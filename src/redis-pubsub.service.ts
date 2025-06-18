import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisPubSubService implements OnModuleInit, OnModuleDestroy {
  private publisher: Redis;
  private subscriber: Redis;

  constructor() {
    this.publisher = new Redis({
      host: 'localhost',
      port: 6379,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
    });

    this.subscriber = new Redis({
      host: 'localhost',
      port: 6379,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
    });
  }

  async onModuleInit() {
    // 연결 상태 확인
    await this.publisher.ping();
    await this.subscriber.ping();
    console.log('Redis Pub/Sub service initialized');
  }

  async onModuleDestroy() {
    await this.publisher.quit();
    await this.subscriber.quit();
  }

  // 메시지 발행
  async publish(channel: string, message: string): Promise<number> {
    return await this.publisher.publish(channel, message);
  }

  // 메시지 구독
  async subscribe(channel: string, callback: (message: string) => void): Promise<void> {
    await this.subscriber.subscribe(channel);
    this.subscriber.on('message', (subscribedChannel, message) => {
      if (subscribedChannel === channel) {
        callback(message);
      }
    });
  }

  // 구독 해제
  async unsubscribe(channel: string): Promise<void> {
    await this.subscriber.unsubscribe(channel);
  }

  // 패턴 구독 (예: user:*)
  async psubscribe(pattern: string, callback: (pattern: string, channel: string, message: string) => void): Promise<void> {
    await this.subscriber.psubscribe(pattern);
    this.subscriber.on('pmessage', (subscribedPattern, channel, message) => {
      if (subscribedPattern === pattern) {
        callback(subscribedPattern, channel, message);
      }
    });
  }

  // 패턴 구독 해제
  async punsubscribe(pattern: string): Promise<void> {
    await this.subscriber.punsubscribe(pattern);
  }

  // 현재 구독 중인 채널 목록
  async getSubscriptions(): Promise<string[]> {
    const subscriptions = await this.subscriber.pubsub('channels');
    return subscriptions;
  }

  // 채널의 구독자 수
  async getSubscriberCount(channel: string): Promise<number> {
    const count = await this.publisher.pubsub('numsub', channel);
    return count[1];
  }
} 