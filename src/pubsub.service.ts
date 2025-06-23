import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Inject,
} from '@nestjs/common'
import { CACHE_MANAGER } from '@nestjs/cache-manager'
import { Cache } from 'cache-manager'
import { getPublisher, getSubscriber } from './redis'

@Injectable()
export class PubSubService implements OnModuleInit, OnModuleDestroy {
  private publisher = getPublisher()
  private subscriber = getSubscriber()

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async onModuleInit() {
    // Subscribe to channels
    await this.subscriber.subscribe('user-events')

    // Handle messages
    this.subscriber.on('message', (channel, message) => {
      console.log(`Received message from ${channel}:`, message)
      this.handleMessage(channel, message)
    })
  }

  async onModuleDestroy() {
    await this.subscriber.quit()
    await this.publisher.quit()
  }

  async publish(channel: string, message: string): Promise<number> {
    return await this.publisher.publish(channel, message)
  }

  async subscribe(channel: string): Promise<void> {
    await this.subscriber.subscribe(channel)
  }

  async unsubscribe(channel: string): Promise<void> {
    await this.subscriber.unsubscribe(channel)
  }

  private async handleMessage(channel: string, message: string) {
    try {
      const parsedMessage = JSON.parse(message) as { type?: string }

      switch (channel) {
        case 'user-events':
          console.log('User event received:', message)
          // 사용자 이벤트에 따라 캐시 정리
          await this.clearCacheByKey(parsedMessage.type)
          console.log('Cache cleared due to hello_deleted event')

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

  // 전체 캐시 정리 (모든 알려진 키들을 지움)
  private async clearCache(): Promise<void> {
    try {
      // 알려진 캐시 키들을 지움
      const knownKeys = ['hello']
      for (const key of knownKeys) {
        await this.cacheManager.del(key)
      }
      console.log('Local cache cleared successfully')
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
}
