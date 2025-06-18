# NestJS API with Redis Pub/Sub Cache

<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

NestJS application with Redis Pub/Sub and caching capabilities using Docker.

## Features

- ✅ Redis Pub/Sub messaging
- ✅ Redis caching with NestJS cache manager
- ✅ Docker Compose setup
- ✅ Redis Commander web UI
- ✅ Event-driven architecture
- ✅ Pattern-based subscriptions

## Quick Start

### 1. Install Dependencies

```bash
$ npm install
```

### 2. Start Redis with Docker

```bash
# Start Redis and Redis Commander
$ docker-compose up -d

# Check if containers are running
$ docker-compose ps
```

### 3. Run the Application

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Redis Services

### Redis Server
- **Port**: 6379
- **Features**: Pub/Sub, Caching, Persistence
- **Configuration**: Keyspace notifications enabled

### Redis Commander (Web UI)
- **URL**: http://localhost:8081
- **Features**: Web-based Redis management interface

## API Endpoints

### Cache Operations
- `GET /` - Get cached hello message (triggers cache events)

### Pub/Sub Operations
- `POST /publish` - Publish message to channel
  ```json
  {
    "channel": "general",
    "message": "Hello World!"
  }
  ```

- `GET /subscriptions` - Get active subscriptions
- `GET /subscribers/:channel` - Get subscriber count for channel

## Redis Pub/Sub Events

The application automatically publishes events for cache operations:

- `cache:hit` - When cached value is found
- `cache:miss` - When cache miss occurs and new value is stored

### Example Usage

1. **Start the application**:
   ```bash
   npm run start:dev
   ```

2. **Access the root endpoint** (triggers cache events):
   ```bash
   curl http://localhost:3000/
   ```

3. **Publish a message**:
   ```bash
   curl -X POST http://localhost:3000/publish \
     -H "Content-Type: application/json" \
     -d '{"channel": "general", "message": "Hello from API!"}'
   ```

4. **Check subscriptions**:
   ```bash
   curl http://localhost:3000/subscriptions
   ```

## Docker Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs redis
docker-compose logs redis-commander

# Restart services
docker-compose restart

# Remove containers and volumes
docker-compose down -v
```

## Project Structure

```
src/
├── app.controller.ts          # API endpoints
├── app.service.ts             # Business logic with cache and pub/sub
├── app.module.ts              # Module configuration
├── redis-pubsub.service.ts    # Redis Pub/Sub service
└── redis-subscriber.service.ts # Event subscriber service
```

## Development

### Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Resources

- [NestJS Documentation](https://docs.nestjs.com)
- [Redis Pub/Sub](https://redis.io/docs/manual/pubsub/)
- [ioredis](https://github.com/luin/ioredis)
- [NestJS Cache Manager](https://docs.nestjs.com/techniques/caching)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)
