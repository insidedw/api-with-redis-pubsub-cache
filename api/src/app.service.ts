import { Injectable, Inject } from '@nestjs/common'
import { CACHE_MANAGER } from '@nestjs/cache-manager'
import { Cache } from 'cache-manager'
import { PubSubService } from './pubsub.service'

@Injectable()
export class AppService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private pubSubService: PubSubService,
  ) {}

  async getHello(): Promise<string> {
    const cachedValue = await this.cacheManager.get<string>('hello')

    if (cachedValue) {
      console.log('cachedValue', cachedValue)
      return cachedValue
    }
    await this.cacheManager.set('hello', 'Hello World!')
    console.log('cachedValue not found')

    return 'NOT FOUND'
  }

  async deleteHello(): Promise<string> {
    // Publish event when hello is deleted
    await this.pubSubService.publish(
      'user-events',
      JSON.stringify({
        type: 'hello',
        timestamp: new Date().toISOString(),
      }),
    )

    return 'Deleted from cache!'
  }
}
