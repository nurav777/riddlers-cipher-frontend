# Manual Setup Guide for Gotham Cipher Riddles

## Current Issue
The AWS user `CognitoBackendUser` doesn't have permission to create DynamoDB tables. This is common in production environments for security reasons.

## Solutions

### Option 1: Request AWS Admin to Create Tables (Recommended)

Ask your AWS administrator to create the following tables using the provided JSON configurations:

#### 1. Create GothamRiddles Table
```bash
aws dynamodb create-table --cli-input-json file://create-riddles-table.json --region ap-southeast-2
```

#### 2. Create PlayerProgress Table
```bash
aws dynamodb create-table --cli-input-json file://create-player-progress-table.json --region ap-southeast-2
```

### Option 2: Use AWS Console

1. Go to AWS DynamoDB Console
2. Click "Create table"
3. Use the configurations from the JSON files

### Option 3: Modify IAM Permissions

Add the following permissions to the `CognitoBackendUser` IAM policy:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "dynamodb:CreateTable",
                "dynamodb:DescribeTable",
                "dynamodb:PutItem",
                "dynamodb:GetItem",
                "dynamodb:UpdateItem",
                "dynamodb:DeleteItem",
                "dynamodb:Query",
                "dynamodb:Scan"
            ],
            "Resource": [
                "arn:aws:dynamodb:ap-southeast-2:378968843276:table/GothamRiddles",
                "arn:aws:dynamodb:ap-southeast-2:378968843276:table/PlayerProgress",
                "arn:aws:dynamodb:ap-southeast-2:378968843276:table/GothamRiddles/index/*",
                "arn:aws:dynamodb:ap-southeast-2:378968843276:table/PlayerProgress/index/*"
            ]
        }
    ]
}
```

## After Tables Are Created

Once the tables exist, you can proceed with the migration:

```bash
# Migrate riddles to DynamoDB
npm run migrate-riddles

# Start the server
npm start
```

## Testing the Setup

1. Start the backend server:
   ```bash
   npm start
   ```

2. Test the health endpoint:
   ```bash
   curl http://localhost:3001/health
   ```

3. Test riddle endpoints (requires authentication):
   ```bash
   # Get a random riddle (requires JWT token)
   curl -H "Authorization: Bearer YOUR_JWT_TOKEN" http://localhost:3001/api/riddles/random
   ```

## Alternative: Use Existing UserProfiles Table

If you can't create new tables, we can modify the system to use the existing `UserProfiles` table by adding riddle data as additional attributes. This would require code modifications but would work with existing permissions.

Would you like me to implement this alternative approach?
