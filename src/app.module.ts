import { Module } from '@nestjs/common'
import { CacheModule } from '@nestjs/cache-manager'
import { AppController } from './app.controller'
import { AppService } from './app.service'

@Module({
  imports: [
    CacheModule.register({
      ttl: 60000, // Cache items for 1 minute
      max: 100, // Maximum number of items in cache
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
