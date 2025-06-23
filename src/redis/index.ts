import { Redis } from 'ioredis'

let redis: Redis

export function getRedis() {
  if (redis) return redis

  redis = new Redis()
  return redis
}
