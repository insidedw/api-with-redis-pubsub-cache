import { Controller, Get } from '@nestjs/common'
import { AppService } from './app.service'

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  async getHello(): Promise<string> {
    return await this.appService.getHello()
  }

  @Get('delete')
  async deleteHello(): Promise<string> {
    return await this.appService.deleteHello()
  }

  @Get('status')
  getCacheStatus(): {
    isConnected: boolean
    subscribedChannels: string[]
  } {
    return this.appService.getCacheStatus()
  }
}
