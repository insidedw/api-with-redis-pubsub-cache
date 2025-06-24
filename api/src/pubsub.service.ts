import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Inject,
} from '@nestjs/common'
import { CACHE_MANAGER } from '@nestjs/cache-manager'
import { Cache } from 'cache-manager'
import { getPublisher, getSubscriber } from './redis'

interface UserEventMessage {
  type?: string
}

interface CacheInvalidationMessage {
  type: 'cache-invalidation'
  key: string
  timestamp: number
  instanceId: string
}

@Injectable()
export class PubSubService implements OnModuleInit, OnModuleDestroy {
  private publisher = getPublisher()
  private subscriber = getSubscriber()
  private subscribedChannels: Set<string> = new Set()
  private isReconnecting = false
  private connectionCheckInterval: NodeJS.Timeout | null = null
  private readonly CONNECTION_CHECK_INTERVAL = 5000 // 5초마다 연결 상태 확인

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async onModuleInit() {
    this.setupConnectionMonitoring()
    await this.subscribeToChannels(['user-events'])
  }

  async onModuleDestroy() {
    this.stopConnectionMonitoring()
    await this.subscriber.quit()
    await this.publisher.quit()
  }

  private setupConnectionMonitoring() {
    // 연결 이벤트 리스너 설정
    this.subscriber.on('connect', () => {
      console.log('Redis subscriber connected')
      this.isReconnecting = false
    })

    this.subscriber.on('ready', () => {
      console.log('Redis subscriber ready')
      this.isReconnecting = false
    })

    this.subscriber.on('error', (error) => {
      console.error('Redis subscriber error:', error)
      this.handleConnectionError()
    })

    this.subscriber.on('close', () => {
      console.log('Redis subscriber connection closed')
      this.handleConnectionError()
    })

    this.subscriber.on('reconnecting', () => {
      console.log('Redis subscriber reconnecting...')
      this.isReconnecting = true
    })

    this.subscriber.on('end', () => {
      console.log('Redis subscriber connection ended')
      this.handleConnectionError()
    })

    // 메시지 핸들러 설정
    this.subscriber.on('message', (channel, message) => {
      console.log(`Received message from ${channel}:`, message)
      this.handleMessage(channel, message)
    })

    // 주기적 연결 상태 확인
    this.startConnectionCheck()
  }

  private startConnectionCheck() {
    this.connectionCheckInterval = setInterval(() => {
      void this.checkConnectionHealth()
    }, this.CONNECTION_CHECK_INTERVAL)
  }

  private stopConnectionMonitoring() {
    if (this.connectionCheckInterval) {
      clearInterval(this.connectionCheckInterval)
      this.connectionCheckInterval = null
    }
  }

  private async checkConnectionHealth() {
    try {
      // 연결 상태 확인
      console.log(
        'Connection health check - status:',
        this.subscriber.status,
        this.subscribedChannels,
      )
      if (!this.subscriber.status || this.subscriber.status !== 'ready') {
        console.error(
          'Connection health check failed - status:',
          this.subscriber.status,
        )
        await this.handleConnectionError()
        return
      }

      // 구독 상태 확인
      const subscribedChannels = await this.getSubscribedChannels()
      const missingChannels = Array.from(this.subscribedChannels).filter(
        (channel) => !subscribedChannels.includes(channel),
      )

      if (missingChannels.length > 0) {
        console.log('Missing subscriptions detected:', missingChannels)
        await this.resubscribeToChannels(missingChannels)
      }
    } catch (error) {
      console.error('Connection health check error:', error)
      await this.handleConnectionError()
    }
  }

  private async handleConnectionError() {
    if (this.isReconnecting) {
      console.log('Already attempting to reconnect, skipping...')
      return
    }

    console.log('Handling connection error - attempting recovery...')
    this.isReconnecting = true

    try {
      // 잠시 대기 후 재연결 시도
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // 재구독 시도
      await this.resubscribeToChannels(Array.from(this.subscribedChannels))

      // 방어적 캐시 클리어
      await this.clearCache()
      console.log(
        'Recovery completed - cache cleared and subscriptions restored',
      )
    } catch (error) {
      console.error('Recovery failed:', error)
      // 재시도 로직 (지수 백오프)
      setTimeout(() => {
        void this.handleConnectionError()
      }, 5000)
    } finally {
      this.isReconnecting = false
    }
  }

  private async resubscribeToChannels(channels: string[]) {
    try {
      console.log('Resubscribing to channels:', channels)

      for (const channel of channels) {
        await this.subscriber.subscribe(channel)
        console.log(`Resubscribed to channel: ${channel}`)
      }

      // 재구독 성공 시 방어적 캐시 클리어
      await this.clearCache()
      console.log('Cache cleared after successful resubscription')
    } catch (error) {
      console.error('Resubscription failed:', error)
      throw error
    }
  }

  private async getSubscribedChannels(): Promise<string[]> {
    try {
      const result = await this.publisher.pubsub('CHANNELS')
      return result as string[]
    } catch (error) {
      console.error('Failed to get subscribed channels:', error)
      return []
    }
  }

  async publish(channel: string, message: string): Promise<number> {
    return await this.publisher.publish(channel, message)
  }

  async subscribe(channel: string): Promise<void> {
    await this.subscriber.subscribe(channel)
    this.subscribedChannels.add(channel)
  }

  async subscribeToChannels(channels: string[]): Promise<void> {
    for (const channel of channels) {
      await this.subscribe(channel)
    }
  }

  async unsubscribe(channel: string): Promise<void> {
    await this.subscriber.unsubscribe(channel)
    this.subscribedChannels.delete(channel)
  }

  private async handleMessage(channel: string, message: string) {
    try {
      const parsedMessage = JSON.parse(message) as
        | UserEventMessage
        | CacheInvalidationMessage

      switch (channel) {
        case 'user-events':
          console.log('User event received:', message)
          // 사용자 이벤트에 따라 캐시 정리
          if ('type' in parsedMessage) {
            await this.clearCacheByKey(parsedMessage.type)
          }
          console.log('Cache cleared due to user event')

          break
        case 'cache-invalidation':
          console.log('Cache invalidation message received:', message)
          // 캐시 무효화 메시지 처리
          if (this.isCacheInvalidationMessage(parsedMessage)) {
            await this.handleCacheInvalidation(parsedMessage)
          }
          break
        default:
          console.log(`Unknown channel ${channel}:`, message)
      }
    } catch (error) {
      console.error('Error parsing message:', error)
      // JSON 파싱 실패 시에도 기본적으로 캐시 정리
      await this.clearCache()
      console.log('Cache cleared due to message parsing error')
    }
  }

  private isCacheInvalidationMessage(
    message: UserEventMessage | CacheInvalidationMessage,
  ): message is CacheInvalidationMessage {
    return message.type === 'cache-invalidation'
  }

  private async handleCacheInvalidation(
    message: CacheInvalidationMessage,
  ): Promise<void> {
    try {
      const { key, instanceId } = message

      // 자신이 보낸 메시지는 무시
      if (instanceId === (process.env.INSTANCE_ID || 'unknown')) {
        return
      }

      // 로컬 캐시에서 해당 키 삭제
      await this.clearCacheByKey(key)
      console.log(
        `Cache invalidated for key: ${key} (from instance: ${instanceId})`,
      )
    } catch (error) {
      console.error('Error handling cache invalidation:', error)
    }
  }

  // 전체 캐시 정리 (모든 알려진 키들을 지움)
  private async clearCache(): Promise<void> {
    try {
      const result = await this.cacheManager.clear()
      console.log('Is local cache cleared:', result)
    } catch (error) {
      console.error('Error clearing cache:', error)
    }
  }

  // 특정 키의 캐시만 정리
  async clearCacheByKey(key: string): Promise<void> {
    try {
      await this.cacheManager.del(key)
      console.log(`Cache key '${key}' cleared successfully`)
    } catch (error) {
      console.error(`Error clearing cache key '${key}':`, error)
    }
  }

  // Get current subscribers count for a channel
  async getSubscribersCount(channel: string): Promise<number> {
    const result = await this.publisher.pubsub('NUMSUB', channel)
    return result[1] as number
  }

  // 연결 상태 확인 메서드
  isConnected(): boolean {
    return this.subscriber.status === 'ready'
  }

  // 구독 상태 확인 메서드
  getSubscribedChannelsList(): string[] {
    return Array.from(this.subscribedChannels)
  }

  getCacheStatus(): {
    isConnected: boolean
    subscribedChannels: string[]
  } {
    return {
      isConnected: this.isConnected(),
      subscribedChannels: this.getSubscribedChannelsList(),
    }
  }
}
