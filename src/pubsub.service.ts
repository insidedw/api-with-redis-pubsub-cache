import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common'
import { getPublisher, getSubscriber } from './redis'

@Injectable()
export class PubSubService implements OnModuleInit, OnModuleDestroy {
  private publisher = getPublisher()
  private subscriber = getSubscriber()

  async onModuleInit() {
    // Subscribe to channels
    await this.subscriber.subscribe('user-events', 'system-events')

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

  private handleMessage(channel: string, message: string) {
    switch (channel) {
      case 'user-events':
        console.log('User event received:', message)
        break
      case 'system-events':
        console.log('System event received:', message)
        break
      default:
        console.log(`Unknown channel ${channel}:`, message)
    }
  }

  // Get current subscribers count for a channel
  async getSubscribersCount(channel: string): Promise<number> {
    const result = await this.publisher.pubsub('NUMSUB', channel)
    return result[1] as number
  }

  // Get all channels
  async getChannels(pattern?: string): Promise<string[]> {
    const result = await this.publisher.pubsub('CHANNELS', pattern || '*')
    return result as string[]
  }
}
