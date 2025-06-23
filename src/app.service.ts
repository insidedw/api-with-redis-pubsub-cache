import { Injectable, Inject } from '@nestjs/common'
import { CACHE_MANAGER } from '@nestjs/cache-manager'
import { Cache } from 'cache-manager'
import { getRedis } from './redis'

@Injectable()
export class AppService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async getHello(): Promise<string> {
    const cachedValue = await this.cacheManager.get<string>('hello')

    const redis = getRedis()
    await redis.set('hello', 'Hello World!')
    const value2 = await redis.get('hello')
    console.log('value2', value2)

    if (cachedValue) {
      console.log('cachedValue', cachedValue)
      return cachedValue
    }
    console.log('cachedValue not found')

    const value = 'Hello World!'
    await this.cacheManager.set('hello', value)
    return value
  }

  async deleteHello(): Promise<string> {
    const redis = getRedis()
    await redis.del('hello')
    return 'Hello World!'
  }
}
