import { Injectable, Inject } from '@nestjs/common'
import { CACHE_MANAGER } from '@nestjs/cache-manager'
import { Cache } from 'cache-manager'
import { RedisPubSubService } from './redis-pubsub.service'

@Injectable()
export class AppService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private redisPubSubService: RedisPubSubService,
  ) {}

  async getHello(): Promise<string> {
    const cachedValue = await this.cacheManager.get<string>('hello')

    if (cachedValue) {
      console.log('cachedValue', cachedValue)
      // 캐시된 값을 찾았을 때 이벤트 발행
      await this.redisPubSubService.publish(
        'cache:hit',
        `Cache hit for key: hello`,
      )
      return cachedValue
    }
    console.log('cachedValue not found')

    const value = 'Hello World!'
    await this.cacheManager.set('hello', value)

    // 캐시에 새 값을 저장했을 때 이벤트 발행
    await this.redisPubSubService.publish(
      'cache:miss',
      `Cache miss for key: hello, stored new value`,
    )

    return value
  }

  // 메시지 발행
  async publishMessage(channel: string, message: string): Promise<number> {
    return await this.redisPubSubService.publish(channel, message)
  }

  // 구독 정보 조회
  async getSubscriptions(): Promise<string[]> {
    return await this.redisPubSubService.getSubscriptions()
  }

  // 구독자 수 조회
  async getSubscriberCount(channel: string): Promise<number> {
    return await this.redisPubSubService.getSubscriberCount(channel)
  }
}
