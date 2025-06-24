import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  // 포트가 사용 중일 때 자동으로 다음 포트 시도
  const startPort = 3000
  const maxPort = 3010 // 최대 시도할 포트

  for (let port = startPort; port <= maxPort; port++) {
    try {
      await app.listen(port)
      console.log(`🚀 Application is running on: http://localhost:${port}`)
      break
    } catch {
      if (port === maxPort) {
        console.error(
          `❌ Failed to start application. All ports from ${startPort} to ${maxPort} are in use.`,
        )
        process.exit(1)
      }
      console.log(`⚠️  Port ${port} is in use, trying next port...`)
    }
  }
}
bootstrap()
