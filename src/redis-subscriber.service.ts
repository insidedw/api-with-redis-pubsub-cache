import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { RedisPubSubService } from './redis-pubsub.service';

@Injectable()
export class RedisSubscriberService implements OnModuleInit, OnModuleDestroy {
  constructor(private redisPubSubService: RedisPubSubService) {}

  async onModuleInit() {
    // 캐시 관련 이벤트 구독
    await this.redisPubSubService.subscribe('cache:hit', (message) => {
      console.log('🔵 Cache Hit Event:', message);
    });

    await this.redisPubSubService.subscribe('cache:miss', (message) => {
      console.log('🔴 Cache Miss Event:', message);
    });

    // 일반 메시지 채널 구독
    await this.redisPubSubService.subscribe('general', (message) => {
      console.log('📢 General Message:', message);
    });

    // 패턴 구독 (user:로 시작하는 모든 채널)
    await this.redisPubSubService.psubscribe('user:*', (pattern, channel, message) => {
      console.log(`👤 User Event [${channel}]:`, message);
    });

    console.log('Redis Subscriber Service initialized');
  }

  async onModuleDestroy() {
    // 구독 해제
    await this.redisPubSubService.unsubscribe('cache:hit');
    await this.redisPubSubService.unsubscribe('cache:miss');
    await this.redisPubSubService.unsubscribe('general');
    await this.redisPubSubService.punsubscribe('user:*');
  }
} 