# 들어가기 전
[1부 Redis Pub/Sub을 이용한 Distributed Cache 도입기](https://channel.io/ko/blog/articles/Redis-PubSub%EC%9D%84-%EC%9D%B4%EC%9A%A9%ED%95%9C-Distributed-Cache-%EB%8F%84%EC%9E%85%EA%B8%B0-1%EB%B6%80-27ad4f55) 글을 보고 직접 구현해보았습니다.


## Redis Pub/Sub을 이용한 로컬 캐시 최신화 프로토타입

이 프로젝트는 **NestJS**와 **Redis Pub/Sub**을 활용하여 여러 서버 인스턴스 간의 로컬 캐시를 실시간으로 동기화하는 시스템을 구현한 프로토타입입니다.

### 🏗️ 전체 아키텍처

```
[서버 A] ←→ [Redis Pub/Sub] ←→ [서버 B]
   ↓              ↓              ↓
[로컬 캐시]    [메시지 브로커]  [로컬 캐시]
```

### 🔧 주요 구성 요소

#### 1. **Redis 설정** (`src/redis/index.ts`)
- **Publisher**: 메시지를 발행하는 Redis 클라이언트
- **Subscriber**: 메시지를 구독하는 Redis 클라이언트
- **일반 Redis**: 일반적인 Redis 작업용 클라이언트
- **자동 재연결**: 연결 단절 시 자동으로 재연결 시도

#### 2. **Pub/Sub 서비스** (`src/pubsub.service.ts`)
```typescript
// 핵심 기능들:
- 메시지 발행 (publish)
- 채널 구독 (subscribe)
- 메시지 수신 처리 (handleMessage)
- 캐시 정리 (clearCache, clearCacheByKey)
```

#### 3. **캐시 관리** (`src/app.module.ts`)
- **TTL**: 60초 (1분)
- **최대 항목 수**: 100개
- **NestJS Cache Manager** 사용

### �� 동작 방식

#### 1. **캐시 조회 과정**
```typescript
async getHello(): Promise<string> {
  // 1. 로컬 캐시에서 먼저 확인
  const cachedValue = await this.cacheManager.get<string>('hello')
  
  if (cachedValue) {
    return cachedValue  // 캐시 히트
  }
  
  // 2. 캐시 미스 시 새로 저장
  await this.cacheManager.set('hello', 'Hello World!')
  return 'NOT FOUND'
}
```

#### 2. **캐시 무효화 과정**
```typescript
async deleteHello(): Promise<string> {
  // 1. Redis Pub/Sub으로 이벤트 발행
  await this.pubSubService.publish('user-events', JSON.stringify({
    type: 'hello',
    timestamp: new Date().toISOString(),
  }))
  
  return 'Deleted from cache!'
}
```

#### 3. **실시간 캐시 동기화**
```typescript
// 모든 서버 인스턴스가 이 메시지를 수신
this.subscriber.on('message', (channel, message) => {
  // 메시지 타입에 따라 해당 캐시 키만 삭제
  await this.clearCacheByKey(parsedMessage.type)
})
```

### 4. 장애 대응 > 자동 복구 
연결 상태 감지: 내부적으로 setInterval를 이용해서 Redis Pub/Sub 연결 및 구독 상태를 지속적으로 확인합니다.

자동 재연결 및 재구독: 연결 단절이나 비정상적인 구독 종료가 감지되면, 즉시 자동으로 재연결 및 재구독을 시도하여 구독 상태를 복원합니다.

방어적 캐시 클리어: 재구독 성공 시, 연결이 끊어져 있던 동안 놓쳤을 수 있는 무효화 메시지로 인한 잠재적 불일치를 해소하기 위해 해당 인스턴스의 로컬 캐시 전체를 즉시 비웁니다 (cacheManager.clear()). 이를 통해 다음 데이터 접근 시 반드시 최신 상태를 반영하도록 강제합니다.



### �� 핵심 장점

1. **실시간 동기화**: 한 서버에서 데이터가 변경되면 즉시 모든 서버의 캐시가 무효화됩니다.

2. **선택적 캐시 정리**: 전체 캐시를 지우지 않고 특정 키만 정리할 수 있습니다.

3. **확장성**: 서버 인스턴스를 추가해도 자동으로 캐시 동기화가 됩니다.

4. **성능**: 로컬 캐시를 사용하므로 빠른 응답 속도를 유지합니다.

### �� 실제 사용 시나리오

1. **사용자 정보 업데이트**: 한 서버에서 사용자 정보를 수정하면 모든 서버의 해당 사용자 캐시가 무효화됩니다.

2. **상품 정보 변경**: 상품 정보가 변경되면 모든 서버의 상품 캐시가 즉시 갱신됩니다.

3. **설정 변경**: 시스템 설정이 변경되면 모든 서버가 새로운 설정을 반영합니다.

### ��️ 개발 환경

- **Docker Compose**로 Redis와 Redis Commander를 쉽게 실행
- **Redis Commander** (포트 8081)로 Redis 상태 모니터링 가능
- **NestJS**의 모듈 시스템을 활용한 깔끔한 구조

이 프로토타입은 마이크로서비스 환경이나 여러 서버 인스턴스를 운영하는 환경에서 캐시 일관성을 유지하는 데 매우 유용한 패턴을 보여줍니다.