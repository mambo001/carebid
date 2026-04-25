# CareBid Backend Implementation Design

**Date:** 2025-04-25  
**Status:** Approved  
**Scope:** Items 1-5 (Database, Firebase Auth, Redis, Business Logic, Tests)

---

## 1. Overview

This document describes the implementation of the CareBid backend infrastructure including database persistence, authentication, real-time notifications, complete business logic, and comprehensive testing.

### Goals
- Replace in-memory storage with PostgreSQL persistence for CareRequests and Bids
- Configure real Firebase Auth for development and production
- Utilize existing Redis pub/sub for real-time room notifications
- Implement full CRUD operations for care request and bid workflows
- Establish comprehensive test coverage with unit and integration tests

### Non-Goals
- Caching layer (can be added later if performance issues arise)
- Background job processing (can be added later for email notifications)
- User management in database (kept in Firebase Auth)

---

## 2. Architecture

### 2.1 Hexagonal Architecture (Ports & Adapters)

The system follows hexagonal architecture with clear separation:

```
┌─────────────────────────────────────────┐
│           Program (Core Logic)          │
│  - Request handlers                     │
│  - Business workflows                   │
│  - Auth middleware                      │
└──────────────────┬──────────────────────┘
                   │ depends on
                   ▼
┌─────────────────────────────────────────┐
│              Ports (Interfaces)         │
│  - CareRequests                         │
│  - Bids                                 │
│  - Users                                │
│  - AuthProvider                         │
│  - RoomNotifier                         │
│  - SseRegistry                          │
│  - RequestCommands                      │
└──────────────────┬──────────────────────┘
                   │ implemented by
                   ▼
┌─────────────────────────────────────────┐
│           Adapters (Implementations)    │
│  - Prisma: CareRequests, Bids           │
│  - Firebase: AuthProvider, Users        │
│  - Redis: RoomNotifier                  │
│  - In-Memory: SseRegistry, Commands     │
└─────────────────────────────────────────┘
```

### 2.2 Data Flow

1. **Create Request Flow:**
   ```
   POST /api/requests
     → Auth middleware (Firebase)
     → RequestCommands.create()
     → CareRequests.save() [Prisma]
     → Response with created request
   ```

2. **Place Bid Flow:**
   ```
   POST /api/requests/:id/bids
     → Auth middleware (Firebase)
     → RequestCommands.placeBid()
     → Bids.save() [Prisma]
     → RoomNotifier.notifyRoomUpdated() [Redis]
     → SSE clients receive update
   ```

3. **Accept Bid Flow:**
   ```
   POST /api/requests/:id/accept
     → Auth middleware (Firebase)
     → RequestCommands.acceptBid()
     → CareRequests.save() [Prisma]
     → Bids.save() [Prisma]
     → RoomNotifier.notifyRoomUpdated() [Redis]
     → SSE clients receive update
   ```

---

## 3. Database Schema (Prisma)

### 3.1 Entities

```prisma
model CareRequest {
  id            String      @id @default(cuid())
  title         String
  description   String
  category      String
  status        RequestStatus @default(DRAFT)
  patientId     String
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
  openedAt      DateTime?
  acceptedBidId String?
  
  bids          Bid[]
  acceptedBid   Bid?        @relation("AcceptedBid", fields: [acceptedBidId], references: [id])
}

model Bid {
  id            String      @id @default(cuid())
  requestId     String
  request       CareRequest @relation(fields: [requestId], references: [id], onDelete: Cascade)
  providerId    String
  amount        Decimal     @db.Decimal(10, 2)
  availableDate DateTime
  notes         String?
  status        BidStatus   @default(PENDING)
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
  
  acceptedRequest CareRequest? @relation("AcceptedBid")
}

enum RequestStatus {
  DRAFT
  OPEN
  ACCEPTED
  COMPLETED
  CANCELLED
}

enum BidStatus {
  PENDING
  ACCEPTED
  REJECTED
  WITHDRAWN
}
```

### 3.2 Migration Strategy

- Use Prisma migrations for schema changes
- Initial migration creates tables with indexes on frequently queried fields
- Docker compose runs `prisma db push` on startup for development

---

## 4. Component Specifications

### 4.1 Prisma Adapters

#### CareRequestsPrisma
**File:** `src/adapters/prisma/CareRequests.ts`

**Implements:** `CareRequests` port

**Methods:**
- `findById(id: RequestId): Effect<CareRequest, RequestNotFound>`
  - Query by primary key
  - Include related bids
  - Map Prisma result to domain entity
  
- `findByPatient(patientId: UserId): Effect<ReadonlyArray<CareRequest>>`
  - Query by patientId index
  - Order by createdAt desc
  - Return array of domain entities
  
- `findOpen(): Effect<ReadonlyArray<CareRequest>>`
  - Query where status = OPEN
  - Order by openedAt desc
  - Exclude requests with accepted bids
  
- `save(request: CareRequest): Effect<void>`
  - Upsert operation (create or update)
  - Handle unique constraint violations

**Error Handling:**
- `DatabaseError` for query failures
- `RequestNotFound` when entity doesn't exist

#### BidsPrisma
**File:** `src/adapters/prisma/Bids.ts`

**Implements:** `Bids` port (to be created)

**Methods:**
- `findById(id: BidId): Effect<Bid, BidNotFound>`
- `findByRequest(requestId: RequestId): Effect<ReadonlyArray<Bid>>`
- `findByProvider(providerId: UserId): Effect<ReadonlyArray<Bid>>`
- `save(bid: Bid): Effect<void>`

**Error Handling:**
- `DatabaseError` for query failures
- `BidNotFound` when entity doesn't exist
- `DuplicateBid` when provider already bid on request

#### Codecs
**File:** `src/adapters/prisma/lib/codecs.ts`

**Responsibilities:**
- Encode domain entities to Prisma input types
- Decode Prisma results to domain entities
- Handle type conversions (Decimal ↔ Money, DateTime ↔ Date)

### 4.2 Firebase Auth Configuration

#### Environment Variables
```bash
# Development (docker-compose.dev.yml)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
```

#### AuthProvider Adapter
**File:** `src/adapters/firebase/AuthProvider.ts` (exists)

**Changes Needed:**
- Read service account credentials from environment
- Support both emulator (dev fallback) and real auth
- Cache verified tokens (optional optimization)

### 4.3 Redis RoomNotifier

**File:** `src/adapters/redis/RoomNotifier.ts` (exists)

**Current Implementation:** Uses Redis pub/sub for room updates

**No Changes Required:** Adapter is already implemented and working.

### 4.4 RequestCommands Updates

**File:** `src/adapters/in-memory/RequestCommands.ts`

**Changes Needed:**
- Replace in-memory storage with Prisma calls
- Add bid acceptance logic
- Integrate RoomNotifier for real-time updates

**New Methods:**
- `acceptBid(requestId: RequestId, bidId: BidId, patientId: UserId): Effect<CareRequest>`
  - Verify patient owns request
  - Verify bid exists on request
  - Update request status to ACCEPTED
  - Update bid status to ACCEPTED
  - Notify room subscribers

---

## 5. API Endpoints

### 5.1 Care Requests

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /health | None | Health check |
| GET | /api/requests | Patient | List my requests |
| POST | /api/requests | Patient | Create new request |
| GET | /api/requests/open | Provider | List open requests |
| GET | /api/requests/:id | Any (room member) | Get request details |
| POST | /api/requests/:id/open | Patient (owner) | Open for bidding |
| POST | /api/requests/:id/accept | Patient (owner) | Accept a bid |
| GET | /api/requests/:id/stream | Any (room member) | SSE stream |

### 5.2 Bids

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/requests/:id/bids | Any (room member) | List bids |
| POST | /api/requests/:id/bids | Provider | Place bid |

### 5.3 Request/Response Schemas

**Create Request:**
```typescript
POST /api/requests
Body: {
  title: string
  description: string
  category: string
}
Response: {
  request: CareRequest
}
```

**Place Bid:**
```typescript
POST /api/requests/:id/bids
Body: {
  amount: number
  availableDate: string (ISO date)
  notes?: string
}
Response: {
  bid: Bid
}
```

**Accept Bid:**
```typescript
POST /api/requests/:id/accept
Body: {
  bidId: string
}
Response: {
  request: CareRequest
}
```

---

## 6. Testing Strategy

### 6.1 Unit Tests (Vitest)

**Coverage:**
- Prisma adapters (mocked PrismaClient)
- Firebase AuthProvider (mocked auth)
- Domain logic functions
- Codecs (encode/decode round trips)

**Location:** `src/**/*.test.ts`

**Example:**
```typescript
// src/adapters/prisma/CareRequests.test.ts
describe('CareRequestsPrisma', () => {
  it('should find request by id', async () => {
    const mockPrisma = { careRequest: { findUnique: vi.fn() } }
    const adapter = makeCareRequestsPrisma(mockPrisma)
    // ... test logic
  })
})
```

### 6.2 Integration Tests

**Coverage:**
- Full request lifecycle (create → open → bid → accept)
- Auth flow (token verification)
- Real-time updates (SSE + Redis)
- Error scenarios (not found, unauthorized)

**Infrastructure:**
- Testcontainers for Postgres and Redis
- Firebase Auth Emulator for auth tests
- Supertest for HTTP assertions

**Location:** `tests/integration/*.test.ts`

**Example:**
```typescript
// tests/integration/request-lifecycle.test.ts
describe('Request Lifecycle', () => {
  it('should complete full flow', async () => {
    // 1. Create patient account
    // 2. Create request
    // 3. Create provider account
    // 4. Place bid
    // 5. Accept bid
    // 6. Verify final state
  })
})
```

### 6.3 Test Configuration

**Files:**
- `vitest.config.ts` - Unit test config
- `vitest.integration.config.ts` - Integration test config
- `.env.test` - Test environment variables

**Scripts:**
```json
{
  "test": "vitest run",
  "test:unit": "vitest run --config vitest.config.ts",
  "test:integration": "vitest run --config vitest.integration.config.ts",
  "test:watch": "vitest"
}
```

---

## 7. Error Handling

### 7.1 Domain Errors (Already Defined)

```typescript
// src/data/errors.ts
class RequestNotFound extends Data.TaggedError('RequestNotFound')<{ requestId: string }>
class BidNotFound extends Data.TaggedError('BidNotFound')<{ bidId: string }>
class Unauthorized extends Data.TaggedError('Unauthorized')<{ message: string }>
class DatabaseError extends Data.TaggedError('DatabaseError')<{ cause: unknown }>
class RedisError extends Data.TaggedError('RedisError')<{ cause: unknown }>
class InvalidState extends Data.TaggedError('InvalidState')<{ message: string }
```

### 7.2 Error Mapping in HTTP Layer

```typescript
// program.ts error handling
type DomainError = RequestNotFound | BidNotFound | Unauthorized | DatabaseError | InvalidState

const handleError = (error: DomainError) => {
  switch (error._tag) {
    case 'RequestNotFound':
    case 'BidNotFound':
      return HttpServerResponse.json({ error: error._tag }, { status: 404 })
    case 'Unauthorized':
      return HttpServerResponse.json({ error: 'Unauthorized' }, { status: 401 })
    case 'InvalidState':
      return HttpServerResponse.json({ error: error.message }, { status: 400 })
    case 'DatabaseError':
      return HttpServerResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
```

---

## 8. Environment Configuration

### 8.1 Development (docker-compose.dev.yml)

```yaml
services:
  backend:
    environment:
      NODE_ENV: development
      DATABASE_URL: postgresql://neon:neon@neon-postgres:5432/neondb
      REDIS_URL: redis://redis:6379
      FIREBASE_PROJECT_ID: ${FIREBASE_PROJECT_ID}
      FIREBASE_PRIVATE_KEY: ${FIREBASE_PRIVATE_KEY}
      FIREBASE_CLIENT_EMAIL: ${FIREBASE_CLIENT_EMAIL}
```

### 8.2 Production (environment.prod.ts)

Uses real Firebase credentials from Cloud Run environment variables.

---

## 9. Implementation Order

1. **Database Schema** - Prisma schema + initial migration
2. **Prisma Adapters** - CareRequests, Bids with codecs
3. **Environment Updates** - Firebase credentials in docker-compose
4. **Business Logic** - Update RequestCommands with full workflows
5. **API Routes** - Add missing endpoints (list open, accept bid)
6. **Unit Tests** - Adapter tests with mocked dependencies
7. **Integration Tests** - Full lifecycle tests with testcontainers

---

## 10. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Prisma schema changes | Medium | Low | Use migrations, validate in tests |
| Firebase auth complexity | Medium | Medium | Fallback to emulator in dev, clear docs |
| Redis connection issues | Low | Medium | Connection retries, graceful degradation |
| Test flakiness | Medium | Medium | Idempotent tests, proper cleanup |

---

## 11. Success Criteria

- [ ] All CRUD operations work via API
- [ ] Real Firebase Auth validates tokens correctly
- [ ] Redis pub/sub delivers real-time updates
- [ ] Unit tests cover all adapters with >80% coverage
- [ ] Integration tests verify full request lifecycle
- [ ] Docker compose starts all services successfully
- [ ] No TypeScript errors, all Effect types correct

---

## Appendix A: File Structure

```
apps/backend/src/
├── adapters/
│   ├── prisma/
│   │   ├── lib/
│   │   │   ├── prisma-client.ts
│   │   │   └── codecs.ts
│   │   ├── CareRequests.ts
│   │   ├── CareRequests.test.ts
│   │   ├── Bids.ts
│   │   └── Bids.test.ts
│   ├── firebase/
│   │   └── AuthProvider.ts
│   ├── redis/
│   │   └── RoomNotifier.ts
│   └── in-memory/
│       ├── RequestCommands.ts
│       └── ...
├── ports/
│   ├── CareRequests.ts
│   ├── Bids.ts (new)
│   └── ...
├── data/
│   ├── entities.ts
│   ├── errors.ts
│   └── branded.ts
├── program.ts
└── main.ts

tests/
└── integration/
    ├── setup.ts
    ├── request-lifecycle.test.ts
    └── auth.test.ts

prisma/
├── schema.prisma
└── migrations/
```
