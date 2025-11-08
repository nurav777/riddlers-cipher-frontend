# Authentication Flow Logging Guide

## Overview
Comprehensive logging has been added to the authentication flow to help debug profile data fetching issues from DynamoDB. All logs are prefixed with `[LOGIN]` or `[REGISTER]` for easy filtering.

## Login Flow Logging

### Request Start
```
[LOGIN] ========== LOGIN REQUEST STARTED ==========
[LOGIN] Request body: { email: "...", password: "***" }
```

### Step-by-Step Logging

1. **Input Validation**
   ```
   [LOGIN] ✓ Input validation passed
   ```

2. **Cognito Authentication**
   ```
   [LOGIN] Authenticating with Cognito...
   [LOGIN] Cognito auth result: {
     success: boolean,
     hasTokens: boolean,
     message: string
   }
   ```

3. **Cognito Sub Extraction**
   ```
   [LOGIN] Extracting Cognito sub from ID token...
   [LOGIN] ✓ Cognito sub extracted: "sub-value"
   ```

4. **DynamoDB Profile Lookup by Cognito Sub**
   ```
   [LOGIN] Fetching profile from DynamoDB with cognitoSub: "sub-value"
   [LOGIN] DynamoDB profile lookup result: {
     found: boolean,
     profileData: { userId, email, username } | null
   }
   ```

5. **Profile Not Found - Email Lookup**
   ```
   [LOGIN] Profile not found by cognitoSub, attempting email lookup...
   [LOGIN] Email lookup result: {
     found: boolean,
     profileData: { userId, email } | null
   }
   ```

6. **Profile Migration (if found by email)**
   ```
   [LOGIN] Found existing profile by email, migrating to Cognito sub...
   [LOGIN] Migration details - Old userId: "..." New cognitoSub: "..."
   [LOGIN] ✓ Profile migration completed
   [LOGIN] ✓ Migrated profile verification: {
     found: boolean,
     profileData: { userId, email } | null
   }
   ```

7. **New Profile Creation (if not found)**
   ```
   [LOGIN] No existing profile found by email, creating new profile...
   [LOGIN] Cognito user lookup result: {
     found: boolean,
     userData: { username, firstName, lastName } | null
   }
   [LOGIN] Creating new user profile with data: {
     cognitoSub: "...",
     email: "...",
     username: "..."
   }
   [LOGIN] ✓ New profile created: {
     userId: "...",
     email: "...",
     username: "..."
   }
   ```

8. **Last Login Update**
   ```
   [LOGIN] Updating last login time for userId: "..."
   [LOGIN] ✓ Last login updated
   ```

9. **JWT Token Generation**
   ```
   [LOGIN] Generating JWT token...
   [LOGIN] ✓ JWT token generated successfully
   ```

10. **Success Summary**
    ```
    [LOGIN] ✓ Login successful - Final profile data: {
      userId: "...",
      email: "...",
      username: "...",
      hasGameStats: boolean,
      hasLevelProgress: boolean
    }
    [LOGIN] Total time: XXXms
    [LOGIN] ========== LOGIN REQUEST COMPLETED ==========
    ```

### Error Logging
```
[LOGIN] ========== LOGIN ERROR ==========
[LOGIN] Error details: Error object
[LOGIN] Error stack: Stack trace
[LOGIN] Total time before error: XXXms
[LOGIN] ========== END ERROR ==========
```

## Registration Flow Logging

### Request Start
```
[REGISTER] ========== REGISTRATION REQUEST STARTED ==========
[REGISTER] Request body: { email, firstName, lastName, username, password: "***" }
```

### Step-by-Step Logging

1. **Input Validation**
   ```
   [REGISTER] ✓ Input validation passed
   ```

2. **Password Strength Validation**
   ```
   [REGISTER] ✓ Password strength validation passed
   ```

3. **Username Availability Check**
   ```
   [REGISTER] Checking username availability: "username"
   [REGISTER] Username availability result: boolean
   [REGISTER] ✓ Username is available
   ```

4. **Cognito Registration**
   ```
   [REGISTER] Registering user with Cognito...
   [REGISTER] Cognito registration result: {
     success: boolean,
     message: string
   }
   ```

5. **DynamoDB Profile Creation**
   ```
   [REGISTER] Creating user profile in DynamoDB...
   [REGISTER] ✓ User profile created: {
     userId: "...",
     email: "...",
     username: "..."
   }
   ```

6. **Success Summary**
   ```
   [REGISTER] Total time: XXXms
   [REGISTER] ========== REGISTRATION REQUEST COMPLETED ==========
   ```

### Error Logging
```
[REGISTER] ========== REGISTRATION ERROR ==========
[REGISTER] Error details: Error object
[REGISTER] Error stack: Stack trace
[REGISTER] Total time before error: XXXms
[REGISTER] ========== END ERROR ==========
```

## Debugging Tips

### Finding Profile Fetch Issues
1. Look for `[LOGIN] DynamoDB profile lookup result` - if `found: false`, check the next steps
2. Check if email lookup succeeded: `[LOGIN] Email lookup result`
3. If migration occurred, verify it completed: `[LOGIN] ✓ Profile migration completed`
4. For new users, verify profile creation: `[LOGIN] ✓ New profile created`

### Common Issues

**Profile not found by cognitoSub:**
- Check if user was previously registered with email-based userId
- Verify migration completed successfully
- Check DynamoDB table for existing profiles

**Profile creation failed:**
- Check Cognito user lookup result
- Verify DynamoDB table permissions
- Check for duplicate username issues

**Last login update failed:**
- This is non-fatal and won't prevent login
- Check DynamoDB table permissions
- Verify userId exists in table

### Filtering Logs
Use grep or your logging service to filter:
```bash
# Login logs only
grep "\[LOGIN\]" logs.txt

# Errors only
grep "\[LOGIN\] ERROR" logs.txt

# Profile lookup issues
grep "DynamoDB profile lookup" logs.txt

# Migration logs
grep "Migration" logs.txt
```

## Performance Monitoring
Each request logs total execution time:
- `[LOGIN] Total time: XXXms`
- `[REGISTER] Total time: XXXms`

Monitor these values to identify performance bottlenecks in:
- Cognito authentication
- DynamoDB queries
- Profile creation/migration
