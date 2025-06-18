import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class AppService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async getHello(): Promise<string> {
    const cachedValue = await this.cacheManager.get<string>('hello');

    if (cachedValue) {
      console.log('cachedValue', cachedValue);
      return cachedValue;
    }
    console.log('cachedValue not found');

    const value = 'Hello World!';
    await this.cacheManager.set('hello', value);
    return value;
  }
}
