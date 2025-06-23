import { Redis } from 'ioredis'

let redis: Redis
let publisher: Redis
let subscriber: Redis

export function getRedis() {
  if (redis) return redis

  redis = new Redis()
  return redis
}

export function getPublisher() {
  if (publisher) return publisher

  publisher = new Redis()
  return publisher
}

export function getSubscriber() {
  if (subscriber) return subscriber

  subscriber = new Redis()
  return subscriber
}
