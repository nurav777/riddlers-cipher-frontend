# DynamoDB Profile Management Setup

This document describes the DynamoDB integration for user profile management in the Gotham Cipher application.

## Table Structure

### Table Name: `UserProfiles`

**Primary Key:**
- Partition Key: `userId` (String) - Cognito user ID
- Sort Key: `profileType` (String) - "main" for primary profile

**Attributes:**
- `userId` (String) - Cognito user ID (Primary Key)
- `profileType` (String) - "main" (Primary Key)
- `email` (String) - User's email address
- `username` (String) - Display username (unique)
- `firstName` (String) - User's first name
- `lastName` (String) - User's last name
- `avatar` (String) - Avatar image URL (optional)
- `bio` (String) - User biography (optional)
- `preferences` (Map) - User preferences object
  - `theme` (String) - UI theme preference
  - `language` (String) - Language preference
  - `notifications` (Boolean) - Notification settings
  - `soundEnabled` (Boolean) - Sound settings
- `gameStats` (Map) - Game statistics object
  - `totalScore` (Number) - Total game score
  - `levelsCompleted` (Number) - Number of levels completed
  - `achievements` (List) - Array of achievement strings
  - `playTime` (Number) - Total play time in seconds
  - `lastLevelPlayed` (String) - Last level played (optional)
- `createdAt` (String) - ISO timestamp of profile creation
- `updatedAt` (String) - ISO timestamp of last update
- `lastLogin` (String) - ISO timestamp of last login (optional)
- `isActive` (Boolean) - Account status

**Global Secondary Indexes:**
1. **EmailIndex**
   - Partition Key: `email` (String)
   - Projection: ALL
   - Used for email-based lookups

2. **UsernameIndex**
   - Partition Key: `username` (String)
   - Projection: ALL
   - Used for username-based lookups and availability checks

## Environment Variables

Add the following environment variable to your `.env` file:

```env
# DynamoDB Configuration
DYNAMODB_TABLE_NAME=UserProfiles
```

## Setup Instructions

### 1. Install Dependencies

The required AWS SDK packages are already installed:
- `@aws-sdk/client-dynamodb`
- `@aws-sdk/lib-dynamodb`

### 2. Configure AWS Credentials

Ensure your AWS credentials are properly configured in your environment:

```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
```

### 3. Create DynamoDB Table

Run the setup script to create the table:

```bash
cd backend
npm run setup-db
```

Or manually create the table using the AWS CLI:

```bash
aws dynamodb create-table \
  --table-name UserProfiles \
  --attribute-definitions \
    AttributeName=userId,AttributeType=S \
    AttributeName=profileType,AttributeType=S \
    AttributeName=email,AttributeType=S \
    AttributeName=username,AttributeType=S \
  --key-schema \
    AttributeName=userId,KeyType=HASH \
    AttributeName=profileType,KeyType=RANGE \
  --global-secondary-indexes \
    IndexName=EmailIndex,KeySchema=[{AttributeName=email,KeyType=HASH}],Projection={ProjectionType=ALL},ProvisionedThroughput={ReadCapacityUnits=5,WriteCapacityUnits=5} \
    IndexName=UsernameIndex,KeySchema=[{AttributeName=username,KeyType=HASH}],Projection={ProjectionType=ALL},ProvisionedThroughput={ReadCapacityUnits=5,WriteCapacityUnits=5} \
  --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5
```

## API Endpoints

### Profile Management

- `GET /api/profile/me` - Get current user's profile
- `PUT /api/profile/me` - Update current user's profile
- `DELETE /api/profile/me` - Delete current user's profile
- `GET /api/profile/username/:username` - Check username availability
- `GET /api/profile/user/:userId` - Get public user profile
- `PUT /api/profile/game-stats` - Update game statistics

### Authentication Integration

The profile system is integrated with the existing Cognito authentication:

1. **Registration**: When a user registers, a profile is automatically created in DynamoDB
2. **Login**: Last login time is updated in the profile
3. **Profile Updates**: Users can update their profile information
4. **Game Stats**: Game statistics are tracked and updated

## Usage Examples

### Creating a User Profile

```typescript
const profile = await dynamoService.createUserProfile(
  userId,      // Cognito user ID
  email,       // User's email
  username,    // Display username
  firstName,   // First name
  lastName     // Last name
);
```

### Updating Profile

```typescript
const updatedProfile = await dynamoService.updateUserProfile(userId, {
  firstName: "John",
  lastName: "Doe",
  bio: "Gotham's finest detective",
  preferences: {
    theme: "dark",
    notifications: true
  }
});
```

### Updating Game Statistics

```typescript
const updatedProfile = await dynamoService.updateGameStats(userId, {
  totalScore: 1500,
  levelsCompleted: 5,
  achievements: ["First Level", "Speed Runner"],
  playTime: 3600
});
```

## Security Considerations

1. **Access Control**: All profile endpoints require authentication via JWT tokens
2. **Data Validation**: Input validation is performed on all profile updates
3. **Username Uniqueness**: Username availability is checked before updates
4. **Public vs Private Data**: Public profiles only expose limited information

## Error Handling

The service includes comprehensive error handling for:
- Table not found errors
- Duplicate username errors
- Invalid user ID errors
- Network connectivity issues
- AWS service errors

## Monitoring and Logging

- All operations are logged with appropriate error messages
- Failed operations return descriptive error messages
- Performance metrics can be monitored through AWS CloudWatch

## Cost Optimization

- Uses provisioned throughput for predictable costs
- Read/Write capacity units are set to 5 (adjust based on usage)
- Consider using on-demand billing for variable workloads
- Monitor usage through AWS Cost Explorer
