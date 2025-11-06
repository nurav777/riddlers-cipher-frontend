# Gotham Cipher - System Architecture

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         AWS Amplify                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Gotham Cipher Frontend (React + Vite)                   │  │
│  │  - User Registration & Login                             │  │
│  │  - Riddle Display & Interaction                          │  │
│  │  - Player Progress Tracking                              │  │
│  │  - Achievement System                                    │  │
│  │                                                          │  │
│  │  Environment Variables:                                  │  │
│  │  VITE_API_BASE_URL=https://pit5nsq8w0.execute-api...    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                            ↓ (HTTPS)                            │
└─────────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│                    AWS API Gateway                              │
│  Endpoint: https://pit5nsq8w0.execute-api.ap-southeast-2...    │
│  Stage: prod                                                    │
│                                                                 │
│  Routes:                                                        │
│  ├─ POST   /api/auth/register                                  │
│  ├─ POST   /api/auth/login                                     │
│  ├─ GET    /riddles/random                                     │
│  ├─ POST   /riddles/validate                                   │
│  ├─ POST   /riddles/solve                                      │
│  └─ GET    /riddles/progress                                   │
│                                                                 │
│  CORS: Enabled for Amplify domain                              │
│  Auth: JWT in Authorization header                             │
└─────────────────────────────────────────────────────────────────┘
        ↓              ↓              ↓              ↓
    ┌───────┐    ┌──────────┐   ┌──────────┐   ┌──────────┐
    │ Auth  │    │ Riddles  │   │ Validate │   │ Progress │
    │Lambda │    │ Lambda   │   │ Lambda   │   │ Lambda   │
    └───────┘    └──────────┘   └──────────┘   └──────────┘
        ↓              ↓              ↓              ↓
    ┌────────────────────────────────────────────────────────┐
    │              AWS DynamoDB                              │
    │  ├─ Users Table (Authentication)                       │
    │  ├─ Riddles Table (Riddle Data)                        │
    │  ├─ PlayerProgress Table (User Progress)               │
    │  └─ Achievements Table (Achievement Data)              │
    └────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagrams

### 1. User Registration Flow

```
Frontend                    API Gateway              Lambda              DynamoDB
   │                            │                      │                    │
   ├─ POST /api/auth/register ──→ AuthRegisterFunc ───→ Create User ────→ Users Table
   │  {email, password, ...}     │                      │                    │
   │                             │                      │ Generate JWT       │
   │ ← {jwtToken, user} ─────────┤ ← {jwtToken} ───────┤                    │
   │                             │                      │                    │
   └─ Store JWT in localStorage
```

### 2. User Login Flow

```
Frontend                    API Gateway              Lambda              DynamoDB
   │                            │                      │                    │
   ├─ POST /api/auth/login ────→ AuthLoginFunc ───────→ Verify Credentials │
   │  {email, password}         │                      │                    │
   │                             │                      │ Fetch User ────→ Users Table
   │                             │                      │                    │
   │                             │                      │ Generate JWT       │
   │ ← {jwtToken, user} ─────────┤ ← {jwtToken} ───────┤                    │
   │                             │                      │                    │
   └─ Store JWT in localStorage
```

### 3. Get Random Riddle Flow

```
Frontend                    API Gateway              Lambda              DynamoDB
   │                            │                      │                    │
   ├─ GET /riddles/random ─────→ GetRandomRiddleFunc ─→ Fetch Riddle ────→ Riddles Table
   │  Header: Authorization     │                      │                    │
   │  Bearer <JWT>              │                      │ Fetch Progress ──→ Progress Table
   │                             │                      │                    │
   │ ← {riddle, progress} ───────┤ ← {riddle, data} ───┤                    │
   │                             │                      │                    │
   └─ Display riddle to user
```

### 4. Validate Answer Flow

```
Frontend                    API Gateway              Lambda              DynamoDB
   │                            │                      │                    │
   ├─ POST /riddles/validate ──→ ValidateAnswerFunc ──→ Check Answer       │
   │  {riddleId, answer}        │                      │                    │
   │  Header: Authorization     │                      │ Compare with       │
   │  Bearer <JWT>              │                      │ correct answer     │
   │                             │                      │                    │
   │ ← {isValid: true/false} ────┤ ← {isValid} ────────┤                    │
   │                             │                      │                    │
   └─ Show result to user
```

### 5. Solve Riddle & Update Progress Flow

```
Frontend                    API Gateway              Lambda              DynamoDB
   │                            │                      │                    │
   ├─ POST /riddles/solve ─────→ SolveRiddleFunc ────→ Update Progress ──→ Progress Table
   │  {riddleId, levelId,       │                      │                    │
   │   stars, completionTime}   │                      │ Update Achievements│
   │  Header: Authorization     │                      │                    │
   │  Bearer <JWT>              │                      │ Calculate Stats    │
   │                             │                      │                    │
   │ ← {progress, stats} ────────┤ ← {updated} ────────┤                    │
   │                             │                      │                    │
   └─ Update UI with new progress
```

### 6. Get Player Progress Flow

```
Frontend                    API Gateway              Lambda              DynamoDB
   │                            │                      │                    │
   ├─ GET /riddles/progress ───→ GetPlayerProgressFunc→ Fetch Progress ──→ Progress Table
   │  Header: Authorization     │                      │                    │
   │  Bearer <JWT>              │                      │ Fetch Achievements│
   │                             │                      │                    │
   │ ← {progress, achievements} ─┤ ← {data} ──────────┤                    │
   │                             │                      │                    │
   └─ Display stats to user
```

---

## Component Architecture

### Frontend (React)

```
App
├── Pages
│   ├── TitlePage (Home)
│   ├── AuthPage (Login/Register)
│   ├── GothamGame (Main Game)
│   ├── ProfilePage (User Stats)
│   └── NotFound (404)
├── Components
│   ├── UI Components (Button, Input, Card, etc.)
│   ├── Game Components (Riddle Display, Answer Input)
│   └── Progress Components (Stats, Achievements)
├── Hooks
│   ├── useAuth (Authentication)
│   ├── useRiddles (Riddle Management)
│   └── useProgress (Progress Tracking)
├── Services
│   ├── api.ts (API Client)
│   └── pollyService.ts (Text-to-Speech)
└── Lib
    └── api.ts (API Endpoints)
```

### Backend (Lambda)

```
API Gateway
├── /api/auth/register → AuthRegisterFunction
├── /api/auth/login → AuthLoginFunction
├── /riddles/random → GetRandomRiddleFunction
├── /riddles/validate → ValidateAnswerFunction
├── /riddles/solve → SolveRiddleFunction
└── /riddles/progress → GetPlayerProgressFunction
```

### Database (DynamoDB)

```
DynamoDB
├── Users Table
│   ├── PK: userId
│   ├── SK: email
│   └── Attributes: password, name, createdAt, etc.
├── Riddles Table
│   ├── PK: riddleId
│   ├── SK: levelId
│   └── Attributes: question, answer, difficulty, type, etc.
├── PlayerProgress Table
│   ├── PK: playerId
│   ├── SK: timestamp
│   └── Attributes: solvedRiddleIds, score, level, etc.
└── Achievements Table
    ├── PK: achievementId
    ├── SK: playerId
    └── Attributes: name, description, unlockedAt, etc.
```

---

## Authentication Flow

### JWT Token Lifecycle

```
1. User Registration/Login
   ↓
2. Backend generates JWT token
   ├─ Header: {alg: "HS256", typ: "JWT"}
   ├─ Payload: {userId, email, iat, exp}
   └─ Signature: HMAC-SHA256(secret)
   ↓
3. Frontend receives JWT
   ↓
4. Frontend stores in localStorage
   ↓
5. Frontend includes in Authorization header
   Authorization: Bearer <JWT>
   ↓
6. Backend validates JWT
   ├─ Check signature
   ├─ Check expiration
   └─ Extract userId
   ↓
7. Process request with userId
   ↓
8. Return response
   ↓
9. Token expires or user logs out
   ↓
10. Frontend clears localStorage
```

---

## Deployment Architecture

### Local Development

```
Developer Machine
├── Node.js 18+
├── npm/yarn
├── Vite Dev Server (http://localhost:5173)
├── .env file (VITE_API_BASE_URL)
└── Git
```

### Production (AWS Amplify)

```
AWS Amplify
├── GitHub Repository
├── Build Process
│   ├── npm install
│   ├── npm run build
│   └── Output: dist/ folder
├── CDN Distribution
│   ├── Global edge locations
│   ├── HTTPS/TLS
│   └── Caching
├── Environment Variables
│   └── VITE_API_BASE_URL
└── Deployment URL
    └── https://<branch>.<app-id>.amplifyapp.com
```

---

## Security Architecture

### Authentication & Authorization

```
┌─────────────────────────────────────────────────────┐
│              Frontend (React)                       │
│  ├─ User enters credentials                         │
│  └─ Sends to /api/auth/login                        │
└─────────────────────────────────────────────────────┘
                      ↓ HTTPS
┌─────────────────────────────────────────────────────┐
│           API Gateway (CORS Enabled)                │
│  ├─ Validates request origin                        │
│  └─ Routes to Lambda                                │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│         Lambda (AuthLoginFunction)                  │
│  ├─ Validates credentials                           │
│  ├─ Generates JWT token                             │
│  └─ Returns token to frontend                       │
└─────────────────────────────────────────────────────┘
                      ↓ HTTPS
┌─────────────────────────────────────────────────────┐
│              Frontend (React)                       │
│  ├─ Stores JWT in localStorage                      │
│  └─ Includes in Authorization header                │
└─────────────────────────────────────────────────────┘
                      ↓ HTTPS
┌─────────────────────────────────────────────────────┐
│           API Gateway (CORS Enabled)                │
│  ├─ Validates JWT in Authorization header           │
│  └─ Routes to Lambda                                │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│      Lambda (Protected Endpoint)                    │
│  ├─ Verifies JWT signature                          │
│  ├─ Checks token expiration                         │
│  ├─ Extracts userId from token                      │
│  └─ Processes request                               │
└─────────────────────────────────────────────────────┘
```

---

## Scalability Considerations

### Current Architecture Supports

- **Users:** Unlimited (DynamoDB auto-scales)
- **Requests:** Unlimited (API Gateway auto-scales)
- **Concurrent Users:** 40,000+ (Lambda concurrent execution)
- **Data Storage:** Unlimited (DynamoDB)
- **Geographic Distribution:** Global (Amplify CDN)

### Performance Optimizations

- Frontend: Vite build optimization, tree-shaking, code splitting
- Backend: Lambda concurrent execution, DynamoDB provisioning
- CDN: Amplify global edge locations, caching strategies
- Database: DynamoDB on-demand pricing, indexes

---

## Monitoring & Logging

### Frontend Monitoring

- Browser console logs
- Sentry/Error tracking (optional)
- Google Analytics (optional)

### Backend Monitoring

- CloudWatch Logs (Lambda)
- CloudWatch Metrics (API Gateway, Lambda)
- X-Ray (optional, for tracing)

### Database Monitoring

- DynamoDB Metrics
- CloudWatch Alarms
- AWS Cost Explorer

---

## Disaster Recovery

### Backup Strategy

- DynamoDB point-in-time recovery enabled
- Regular backups to S3
- Git repository as code backup

### Recovery Procedures

1. **Frontend Issue:** Rollback to previous Amplify deployment
2. **Backend Issue:** Redeploy Lambda functions
3. **Database Issue:** Restore from DynamoDB backup
4. **Complete Outage:** Restore from S3 backup

---

## Cost Estimation (Monthly)

| Service | Tier | Cost |
|---------|------|------|
| Amplify | Free | $0 |
| API Gateway | Pay-per-request | $0.35/M requests |
| Lambda | Free tier | $0 (up to 1M) |
| DynamoDB | On-demand | $1.25/M read + $1.25/M write |
| **Total** | | **~$5-50** |

---

## Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | React | 18.3.1 |
| Build Tool | Vite | 5.4.19 |
| Language | TypeScript | 5.8.3 |
| Styling | Tailwind CSS | 3.4.17 |
| UI Components | shadcn/ui | Latest |
| State Management | React Query | 5.83.0 |
| Routing | React Router | 7.9.1 |
| Hosting | AWS Amplify | Latest |
| API Gateway | AWS API Gateway v2 | HTTP API |
| Compute | AWS Lambda | Node.js 18+ |
| Database | AWS DynamoDB | Latest |

---

## Future Enhancements

- [ ] Real-time multiplayer riddles
- [ ] Leaderboard system
- [ ] Social features (friends, challenges)
- [ ] Mobile app (React Native)
- [ ] Advanced analytics
- [ ] AI-powered riddle generation
- [ ] Subscription tiers
- [ ] Payment integration

---

**Last Updated:** November 2025
**Architecture Version:** 1.0.0
**Status:** Production Ready
