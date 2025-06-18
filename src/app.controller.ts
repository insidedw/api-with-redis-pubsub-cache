import { Controller, Get, Post, Body, Param } from '@nestjs/common'
import { AppService } from './app.service'

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  async getHello(): Promise<string> {
    return await this.appService.getHello()
  }

  @Post('publish')
  async publishMessage(
    @Body() body: { channel: string; message: string },
  ): Promise<{ subscribers: number }> {
    const subscribers = await this.appService.publishMessage(
      body.channel,
      body.message,
    )
    return { subscribers }
  }

  @Get('subscriptions')
  async getSubscriptions(): Promise<{ channels: string[] }> {
    const channels = await this.appService.getSubscriptions()
    return { channels }
  }

  @Get('subscribers/:channel')
  async getSubscriberCount(
    @Param('channel') channel: string,
  ): Promise<{ count: number }> {
    const count = await this.appService.getSubscriberCount(channel)
    return { count }
  }
}
