# Gotham Cipher - Riddle Delivery & Puzzle Logic Module

## Overview

This module migrates riddles from the frontend to DynamoDB and implements a serverless system for dynamic riddle delivery with player progress tracking and adaptive difficulty.

## Architecture

```
Frontend (React) → API Gateway → Lambda (Express) → DynamoDB
                                    ↓
                              CloudWatch Logs & Metrics
```

## AWS Services Used

- **DynamoDB**: Store riddles and player progress
- **Lambda**: Riddle retrieval and game logic
- **API Gateway**: Expose Lambda functions
- **CloudWatch**: Logging and monitoring
- **Cognito**: Authentication (existing)

## Database Schema

### GothamRiddles Table
```json
{
  "riddleId": "level-1-riddle-1",     // Primary Key
  "levelId": 1,                       // GSI
  "question": "In Arkham's halls...",
  "answer": "ARKHAM",
  "hint": "Caesar cipher shifted by 3",
  "type": "cipher",                   // GSI
  "difficulty": "easy",               // GSI
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00Z",
  "metadata": {
    "originalId": 1,
    "levelTitle": "Shadows of Arkham",
    "hintType": "cipher"
  }
}
```

### PlayerProgress Table
```json
{
  "playerId": "cognito-sub-123",      // Primary Key
  "solvedRiddleIds": ["level-1-riddle-1"],
  "currentDifficulty": "easy",
  "lastPlayedTimestamp": "2024-01-01T00:00:00Z",
  "levelProgress": {
    "1": {
      "completed": true,
      "bestStars": 3,
      "attempts": 2,
      "bestTime": 45000
    }
  },
  "totalScore": 15,
  "achievements": ["first_solve", "speed_demon"]
}
```

## Setup Instructions

### 1. Environment Variables

Add to your `.env` file:
```bash
# Existing variables...
RIDDLES_TABLE_NAME=GothamRiddles
PROGRESS_TABLE_NAME=PlayerProgress
CLOUDWATCH_LOG_GROUP=GothamCipherRiddles
CLOUDWATCH_LOG_STREAM=RiddleService
CLOUDWATCH_NAMESPACE=GothamCipher/Riddles
```

### 2. Create DynamoDB Tables

```bash
# Create riddles table
npm run setup-riddles-tables

# Or manually using AWS CLI
aws dynamodb create-table --cli-input-json file://backend/create-riddles-table.json
aws dynamodb create-table --cli-input-json file://backend/create-player-progress-table.json
```

### 3. Migrate Riddles

```bash
# Run migration script
npm run migrate-riddles
```

### 4. Deploy Backend

```bash
cd backend
npm run build
npm start
```

## API Endpoints

### Authentication Required
All endpoints require a valid JWT token in the Authorization header.

### Get Random Riddle
```http
GET /api/riddles/random?levelId=1&difficulty=easy&type=cipher&excludeSolved=true
```

**Response:**
```json
{
  "success": true,
  "data": {
    "riddle": {
      "riddleId": "level-1-riddle-1",
      "levelId": 1,
      "question": "In Arkham's halls where madness dwells...",
      "answer": "ARKHAM",
      "hint": "Caesar cipher shifted by 3",
      "type": "cipher",
      "difficulty": "easy"
    },
    "isNew": true,
    "playerProgress": { ... },
    "nextRiddleHint": "Next: anagram puzzle in easy difficulty"
  }
}
```

### Get Riddles by Level
```http
GET /api/riddles/level/1
```

### Get Riddles by Difficulty
```http
GET /api/riddles/difficulty/easy
```

### Get Riddles by Type
```http
GET /api/riddles/type/cipher
```

### Validate Answer
```http
POST /api/riddles/validate
Content-Type: application/json

{
  "riddleId": "level-1-riddle-1",
  "answer": "ARKHAM"
}
```

### Solve Riddle
```http
POST /api/riddles/solve
Content-Type: application/json

{
  "riddleId": "level-1-riddle-1",
  "levelId": 1,
  "stars": 3,
  "completionTime": 45000
}
```

### Get Player Progress
```http
GET /api/riddles/progress
```

## Frontend Integration

### 1. Update API Client

The `src/lib/api.ts` has been updated with new riddle endpoints.

### 2. Use Riddle Hook

```typescript
import { useRiddles } from '@/hooks/useRiddles';

const { 
  getRandomRiddle, 
  validateAnswer, 
  solveRiddle, 
  playerProgress 
} = useRiddles();

// Get random riddle for level 1
const riddleData = await getRandomRiddle({ levelId: 1 });

// Validate answer
const isValid = await validateAnswer(riddleId, userAnswer);

// Solve riddle
await solveRiddle(riddleId, levelId, stars, completionTime);
```

### 3. Replace LevelPlayground

Use `LevelPlaygroundAPI.tsx` instead of the original `LevelPlayground.tsx`:

```typescript
import { LevelPlaygroundAPI } from '@/pages/LevelPlaygroundAPI';

// In your component
<LevelPlaygroundAPI
  level={level}
  onBack={handleBack}
  onComplete={handleComplete}
  backgroundImage={level.background}
/>
```

## Dynamic Difficulty Algorithm

The system automatically adjusts difficulty based on player performance:

```typescript
// Easy: 0-1 levels completed or average stars < 1.5
// Medium: 1-2 levels completed and average stars >= 1.5
// Hard: 3+ levels completed and average stars >= 2.5
```

## Monitoring & Logging

### CloudWatch Logs
- **Log Group**: `GothamCipherRiddles`
- **Log Stream**: `RiddleService`

### CloudWatch Metrics
- **Namespace**: `GothamCipher/Riddles`
- **Metrics**:
  - `RiddleRequests` (Count)
  - `RiddleCompletions` (Count)
  - `RiddleCompletionTime` (Milliseconds)
  - `Errors` (Count)
  - `Performance` (Milliseconds)

### Sample Queries

```sql
-- Most popular riddle types
fields @timestamp, metadata.type
| filter metadata.action = "riddle_request"
| stats count() by metadata.type

-- Average completion time by level
fields @timestamp, metadata.completionTime, metadata.levelId
| filter metadata.action = "riddle_completion"
| stats avg(metadata.completionTime) by metadata.levelId

-- Error rate by operation
fields @timestamp, metadata.operation
| filter metadata.action = "error"
| stats count() by metadata.operation
```

## Performance Optimization

### Caching Strategy
- Riddles are cached in memory for fast retrieval
- Player progress is cached with 5-minute TTL
- Use CloudFront for API Gateway caching

### Scaling
- DynamoDB auto-scaling enabled
- Lambda concurrency limits configured
- API Gateway throttling set to 1000 requests/second

## Security

### Authentication
- All endpoints require valid JWT tokens
- Player ID extracted from JWT claims
- No direct database access from frontend

### Data Protection
- Sensitive data encrypted at rest
- API responses don't include answers
- Player progress isolated by user ID

## Troubleshooting

### Common Issues

1. **"No available riddles found"**
   - Check if riddles exist in DynamoDB
   - Verify level ID is correct
   - Check if all riddles are marked as solved

2. **Authentication errors**
   - Verify JWT token is valid
   - Check Cognito configuration
   - Ensure token hasn't expired

3. **Performance issues**
   - Check CloudWatch metrics
   - Review DynamoDB throttling
   - Monitor Lambda cold starts

### Debug Commands

```bash
# Check table status
aws dynamodb describe-table --table-name GothamRiddles

# View recent logs
aws logs tail /aws/lambda/gotham-cipher-backend --follow

# Check metrics
aws cloudwatch get-metric-statistics \
  --namespace GothamCipher/Riddles \
  --metric-name RiddleRequests \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-02T00:00:00Z \
  --period 3600 \
  --statistics Sum
```

## Future Enhancements

### Planned Features
1. **Hint System**: Time-based hint unlocking
2. **Achievement System**: Badges for milestones
3. **Leaderboards**: Global and friend rankings
4. **Custom Riddles**: User-generated content
5. **Multiplayer**: Collaborative puzzle solving

### Performance Improvements
1. **Preloading**: Cache next riddle asynchronously
2. **CDN**: Global content delivery
3. **Edge Computing**: Lambda@Edge for faster responses
4. **Database Optimization**: Read replicas and caching

## Support

For issues or questions:
1. Check CloudWatch logs for errors
2. Review API Gateway logs
3. Monitor DynamoDB metrics
4. Contact development team

## License

This module is part of the Gotham Cipher project and follows the same licensing terms.
