# AWS Amplify Deployment Guide - Gotham Cipher Frontend

This guide walks you through deploying the Gotham Cipher frontend to AWS Amplify with integration to your existing Lambda + API Gateway backend.

## Prerequisites

- AWS account with appropriate permissions
- GitHub repository with the project code
- Backend already deployed (API Gateway endpoint: `https://pit5nsq8w0.execute-api.ap-southeast-2.amazonaws.com/prod`)
- AWS CLI installed and configured (optional)

## Backend API Configuration

Your frontend will communicate with the following Lambda functions through API Gateway:

| Endpoint | Method | Lambda Function | Purpose |
|----------|--------|-----------------|---------|
| `/api/auth/register` | POST | AuthRegisterFunction | User registration |
| `/api/auth/login` | POST | AuthLoginFunction | User login |
| `/riddles/random` | GET | GetRandomRiddleFunction | Get random riddle |
| `/riddles/validate` | POST | ValidateAnswerFunction | Validate answer |
| `/riddles/solve` | POST | SolveRiddleFunction | Update progress |
| `/riddles/progress` | GET | GetPlayerProgressFunction | Get player progress |

**Base URL:** `https://pit5nsq8w0.execute-api.ap-southeast-2.amazonaws.com/prod`

## Step 1: Prepare Your Repository

1. Ensure your code is pushed to GitHub
2. The frontend code is already configured to use environment variables:
   - `VITE_API_BASE_URL` - Set to your API Gateway endpoint
3. The `amplify.yml` file is included in the repository for build configuration

## Step 2: Connect to AWS Amplify

### Via AWS Console

1. Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
2. Click **"Create new app"** → **"Host web app"**
3. Select **GitHub** as the source
4. Authorize AWS to access your GitHub account
5. Select your repository (e.g., `riddlers-cipher-pre-deployment`)
6. Choose the branch to deploy (e.g., `main` or `master`)
7. Click **"Next"**

## Step 3: Configure Build Settings

Amplify will auto-detect your Vite React app. Verify these settings:

### Build Settings
- **Build command:** `npm run build`
- **Build output directory:** `dist`
- **Node version:** `18` or higher

### Environment Variables

Add these environment variables in the Amplify Console:

**App settings → Environment variables**

| Variable | Value |
|----------|-------|
| `VITE_API_BASE_URL` | `https://pit5nsq8w0.execute-api.ap-southeast-2.amazonaws.com/prod` |

**Important:** Do NOT include trailing slashes in the URL.

### Example Configuration

```
VITE_API_BASE_URL=https://pit5nsq8w0.execute-api.ap-southeast-2.amazonaws.com/prod
```

## Step 4: Deploy

1. Click **"Save and deploy"**
2. Amplify will:
   - Clone your repository
   - Install dependencies (`npm install`)
   - Build the app (`npm run build`)
   - Deploy to AWS CDN
   - Provide a public URL (e.g., `https://main.d1234567890.amplifyapp.com`)

3. Monitor the deployment in the **Deployments** tab
4. Once complete, your app is live!

## Step 5: Verify Deployment

### Test the Frontend

1. Open your Amplify URL in a browser
2. Test the following workflows:

#### User Registration
- Navigate to the login page
- Click "Register"
- Fill in email, password, and confirm password
- Submit the form
- Verify JWT token is stored in localStorage

#### User Login
- Use the credentials from registration
- Verify JWT token is stored
- Check browser console for any CORS errors

#### Fetch Random Riddle
- After login, navigate to the game
- Verify a riddle loads successfully
- Check Network tab: GET `/riddles/random` should return 200

#### Validate Answer
- Submit an answer to a riddle
- Check Network tab: POST `/riddles/validate` should return `{ isValid: true/false }`

#### Update Progress
- Solve a riddle correctly
- Check Network tab: POST `/riddles/solve` should update player progress

#### Get Player Progress
- Navigate to profile/progress page
- Check Network tab: GET `/riddles/progress` should return player stats

### Debug Commands

```bash
# Check if environment variables are set
curl https://your-amplify-url.amplifyapp.com/

# Test API connectivity with JWT
curl https://pit5nsq8w0.execute-api.ap-southeast-2.amazonaws.com/prod/riddles/random \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Check browser console for errors
# Open DevTools → Console tab
```

## Troubleshooting

### Issue: Build Fails

**Solution:**
1. Check build logs in Amplify Console → Deployments
2. Verify all dependencies are in `package.json`
3. Ensure Node.js version is compatible (18+)
4. Check for TypeScript errors: `npm run build` locally

### Issue: API Calls Return 404

**Possible causes:**
1. `VITE_API_BASE_URL` not set correctly
2. API Gateway routes not created
3. Lambda functions not deployed

**Solution:**
1. Verify environment variable in Amplify Console
2. Run backend deployment script: `powershell -ExecutionPolicy Bypass -File backend/deploy-smart.ps1`
3. Test API directly: `curl https://pit5nsq8w0.execute-api.ap-southeast-2.amazonaws.com/prod/riddles/random`

### Issue: CORS Errors

**Error:** `Access to XMLHttpRequest has been blocked by CORS policy`

**Solution:**
1. Verify API Gateway has CORS enabled
2. Check that the Amplify domain is allowed in CORS configuration
3. Ensure `Authorization` header is included in CORS allowed headers

### Issue: JWT Token Not Stored

**Solution:**
1. Check browser DevTools → Application → Local Storage
2. Verify login response includes `jwtToken` field
3. Check browser console for errors during login

### Issue: 401 Unauthorized on API Calls

**Solution:**
1. Verify JWT token is being sent in Authorization header
2. Check token expiration
3. Ensure backend Lambda functions validate the token correctly

## CORS Configuration (Backend)

If you encounter CORS issues, ensure your API Gateway has CORS enabled:

```bash
# Enable CORS on API Gateway (if needed)
aws apigatewayv2 update-api \
  --api-id pit5nsq8w0 \
  --cors-configuration AllowOrigins="*",AllowMethods="*",AllowHeaders="*"
```

## Environment Variables Reference

### Frontend Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API base URL | `https://pit5nsq8w0.execute-api.ap-southeast-2.amazonaws.com/prod` |

### How Frontend Uses Variables

The frontend reads environment variables at build time:

```typescript
// src/lib/api.ts
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
```

All API requests are prefixed with this base URL.

## API Integration Details

### Authentication Flow

1. **Register/Login:**
   - POST to `/api/auth/register` or `/api/auth/login`
   - Receive JWT token in response
   - Frontend stores token in localStorage

2. **Subsequent Requests:**
   - All requests include `Authorization: Bearer <JWT>` header
   - Backend validates JWT and processes request
   - Response includes updated player progress

### Request/Response Format

**Example: Get Random Riddle**

```bash
curl https://pit5nsq8w0.execute-api.ap-southeast-2.amazonaws.com/prod/riddles/random \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response:**
```json
{
  "riddle": {
    "riddleId": "riddle-123",
    "question": "What has keys but no locks?",
    "answer": "piano",
    "difficulty": "easy",
    "type": "wordplay"
  },
  "playerProgress": {
    "playerId": "user-123",
    "totalScore": 150,
    "solvedRiddleIds": ["riddle-1", "riddle-2"],
    "levelProgress": {
      "1": { "completed": true, "bestStars": 3 }
    }
  }
}
```

## Custom Domain (Optional)

To use a custom domain:

1. Go to Amplify Console → App settings → Domain management
2. Click "Add domain"
3. Enter your domain (e.g., `gotham-cipher.com`)
4. Configure DNS records as instructed
5. Amplify automatically provisions SSL certificates

## Monitoring and Logs

### Access Logs
- Amplify Console → App settings → Monitoring → Access logs

### Build Logs
- Amplify Console → Deployments → Click deployment → View logs

### CloudWatch Logs
- AWS CloudWatch Console → Logs → Search for your app

## Cost Optimization

- **Free tier includes:**
  - 5GB storage
  - 5GB data transfer/month
  - 500 build minutes/month
- Monitor usage in Amplify Console → App settings → Usage

## Security Best Practices

1. **HTTPS:** All Amplify sites use HTTPS by default ✓
2. **Environment Variables:** Encrypted in Amplify Console ✓
3. **JWT Tokens:** Stored securely in localStorage (consider using httpOnly cookies for production)
4. **CORS:** Restrict to your domain only (not `*`)
5. **Dependencies:** Regularly update with `npm audit fix`

## Continuous Deployment

Amplify automatically deploys when you push to your connected branch:

1. Push code to GitHub
2. Amplify detects the change
3. Builds and deploys automatically
4. View progress in Deployments tab

To disable auto-deploy:
- Amplify Console → App settings → Build and deploy → Disable auto-deploy

## Rollback

To rollback to a previous deployment:

1. Go to Amplify Console → Deployments
2. Find the deployment you want to restore
3. Click the deployment
4. Click "Redeploy this version"

## Next Steps

1. ✅ Deploy frontend to Amplify
2. ✅ Set environment variables
3. ✅ Test all API endpoints
4. ✅ Verify authentication flow
5. ✅ Monitor deployment logs
6. ✅ Set up custom domain (optional)
7. ✅ Configure monitoring and alerts

## Support & Resources

- [AWS Amplify Documentation](https://docs.aws.amazon.com/amplify/)
- [Vite Documentation](https://vitejs.dev/)
- [React Router Documentation](https://reactrouter.com/)
- [AWS API Gateway Documentation](https://docs.aws.amazon.com/apigateway/)

## Quick Reference

### Amplify URL Format
```
https://<branch>.<app-id>.amplifyapp.com
```

### API Base URL
```
https://pit5nsq8w0.execute-api.ap-southeast-2.amazonaws.com/prod
```

### Environment Variable
```
VITE_API_BASE_URL=https://pit5nsq8w0.execute-api.ap-southeast-2.amazonaws.com/prod
```

### JWT Header Format
```
Authorization: Bearer <JWT_TOKEN>
```

---

**Last Updated:** November 2025
**Frontend Framework:** React 18 + Vite
**Backend:** AWS Lambda + API Gateway
**Hosting:** AWS Amplify
