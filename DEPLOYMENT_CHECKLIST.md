# Gotham Cipher Frontend - AWS Amplify Deployment Checklist

## Pre-Deployment Verification

### ✅ Frontend Code Updates
- [x] API endpoints updated to match Lambda routes
  - [x] `/riddles/random` (was `/api/riddles/random`)
  - [x] `/riddles/validate` (was `/api/riddles/validate`)
  - [x] `/riddles/solve` (was `/api/riddles/solve`)
  - [x] `/riddles/progress` (was `/api/riddles/progress`)
  - [x] `/api/auth/register` (unchanged)
  - [x] `/api/auth/login` (unchanged)

- [x] JWT authentication configured
  - [x] Token stored in localStorage
  - [x] Token sent in Authorization header for all requests
  - [x] Token retrieved from login/register responses

- [x] Environment variables configured
  - [x] `.env` file created with `VITE_API_BASE_URL`
  - [x] `amplify.yml` created for build configuration

### ✅ Backend Configuration
- [x] API Gateway endpoint: `https://pit5nsq8w0.execute-api.ap-southeast-2.amazonaws.com/prod`
- [x] Lambda functions deployed:
  - [x] AuthRegisterFunction
  - [x] AuthLoginFunction
  - [x] GetRandomRiddleFunction
  - [x] ValidateAnswerFunction
  - [x] SolveRiddleFunction
  - [x] GetPlayerProgressFunction

- [x] Routes created in API Gateway:
  - [x] POST `/api/auth/register`
  - [x] POST `/api/auth/login`
  - [x] GET `/riddles/random`
  - [x] POST `/riddles/validate`
  - [x] POST `/riddles/solve`
  - [x] GET `/riddles/progress`

- [x] CORS enabled on API Gateway

### ✅ Local Testing
- [ ] Run `npm install` to install dependencies
- [ ] Run `npm run build` to verify build succeeds
- [ ] Run `npm run preview` to test production build locally
- [ ] Run `powershell -ExecutionPolicy Bypass -File verify-api-integration.ps1` to test API endpoints
- [ ] Manually test in browser:
  - [ ] Register new user
  - [ ] Login with credentials
  - [ ] Fetch random riddle
  - [ ] Validate answer
  - [ ] Update progress
  - [ ] View player progress

## AWS Amplify Deployment Steps

### Step 1: Connect Repository
- [ ] Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
- [ ] Click "Create new app" → "Host web app"
- [ ] Select GitHub as source
- [ ] Authorize AWS to access GitHub
- [ ] Select repository: `riddlers-cipher-pre-deployment`
- [ ] Select branch: `main` (or your default branch)
- [ ] Click "Next"

### Step 2: Configure Build Settings
- [ ] Verify build command: `npm run build`
- [ ] Verify build output directory: `dist`
- [ ] Verify Node version: `18` or higher
- [ ] Add environment variables:
  - [ ] `VITE_API_BASE_URL` = `https://pit5nsq8w0.execute-api.ap-southeast-2.amazonaws.com/prod`
- [ ] Click "Save and deploy"

### Step 3: Monitor Deployment
- [ ] Watch deployment progress in Amplify Console
- [ ] Check build logs for any errors
- [ ] Wait for deployment to complete (usually 2-5 minutes)
- [ ] Note the Amplify URL (e.g., `https://main.d1234567890.amplifyapp.com`)

## Post-Deployment Verification

### ✅ Frontend Accessibility
- [ ] Open Amplify URL in browser
- [ ] Verify page loads without errors
- [ ] Check browser console for any errors
- [ ] Verify no CORS errors in console

### ✅ Authentication Flow
- [ ] Navigate to login page
- [ ] Test user registration:
  - [ ] Enter email, password, confirm password
  - [ ] Submit form
  - [ ] Verify success message
  - [ ] Check localStorage for JWT token
- [ ] Test user login:
  - [ ] Enter registered email and password
  - [ ] Submit form
  - [ ] Verify success message
  - [ ] Check localStorage for JWT token

### ✅ API Endpoints
- [ ] Test GET `/riddles/random`:
  - [ ] Open browser DevTools → Network tab
  - [ ] Navigate to game
  - [ ] Verify GET request to `/riddles/random` returns 200
  - [ ] Verify riddle data is displayed

- [ ] Test POST `/riddles/validate`:
  - [ ] Submit an answer to a riddle
  - [ ] Verify POST request to `/riddles/validate` returns 200
  - [ ] Verify response indicates if answer is correct

- [ ] Test POST `/riddles/solve`:
  - [ ] Solve a riddle correctly
  - [ ] Verify POST request to `/riddles/solve` returns 200
  - [ ] Verify player progress is updated

- [ ] Test GET `/riddles/progress`:
  - [ ] Navigate to profile/progress page
  - [ ] Verify GET request to `/riddles/progress` returns 200
  - [ ] Verify player stats are displayed correctly

### ✅ JWT Authentication
- [ ] Verify JWT token is sent in Authorization header:
  - [ ] Open DevTools → Network tab
  - [ ] Check any API request
  - [ ] Verify `Authorization: Bearer <token>` header is present
- [ ] Verify token persists across page reloads
- [ ] Verify logout clears token from localStorage

### ✅ Functionality Testing
- [ ] User can register and create account
- [ ] User can login with credentials
- [ ] User can fetch random riddles
- [ ] User can submit answers
- [ ] User can view progress and achievements
- [ ] User can logout
- [ ] All UI elements render correctly
- [ ] No console errors or warnings

## Troubleshooting

### Build Fails
- [ ] Check Amplify build logs for errors
- [ ] Verify all dependencies are in `package.json`
- [ ] Run `npm run build` locally to reproduce error
- [ ] Check for TypeScript errors: `npm run lint`
- [ ] Ensure Node.js version is 18+

### API Calls Return 404
- [ ] Verify `VITE_API_BASE_URL` is set in Amplify Console
- [ ] Verify API Gateway routes are created
- [ ] Verify Lambda functions are deployed
- [ ] Test API directly with curl:
  ```bash
  curl https://pit5nsq8w0.execute-api.ap-southeast-2.amazonaws.com/prod/riddles/random \
    -H "Authorization: Bearer YOUR_JWT_TOKEN"
  ```

### CORS Errors
- [ ] Verify API Gateway has CORS enabled
- [ ] Check that Amplify domain is allowed in CORS configuration
- [ ] Verify `Authorization` header is in CORS allowed headers

### JWT Token Not Working
- [ ] Verify token is being sent in `Authorization: Bearer <token>` format
- [ ] Check token expiration
- [ ] Verify backend Lambda functions validate token correctly
- [ ] Check browser console for detailed error messages

### 401 Unauthorized Errors
- [ ] Verify JWT token is valid and not expired
- [ ] Verify token is being sent in Authorization header
- [ ] Check backend Lambda function logs in CloudWatch
- [ ] Re-login to get a fresh token

## Rollback Plan

If deployment fails or issues arise:

1. Go to Amplify Console → Deployments
2. Find the last working deployment
3. Click the deployment → "Redeploy this version"
4. Wait for deployment to complete
5. Verify functionality

## Performance Optimization

- [ ] Enable caching in Amplify Console
- [ ] Minify and optimize assets (done by Vite build)
- [ ] Use CloudFront CDN (automatic with Amplify)
- [ ] Monitor performance in CloudWatch

## Security Checklist

- [x] All API calls use HTTPS
- [x] JWT tokens stored securely (localStorage)
- [x] Environment variables encrypted in Amplify
- [x] CORS configured to prevent unauthorized access
- [x] Dependencies up to date (run `npm audit`)
- [ ] Consider using httpOnly cookies for production JWT storage
- [ ] Set up WAF (Web Application Firewall) if needed

## Monitoring & Alerts

- [ ] Set up CloudWatch alarms for API errors
- [ ] Monitor Amplify deployment logs
- [ ] Set up email notifications for deployment failures
- [ ] Monitor API Gateway metrics
- [ ] Monitor Lambda function errors and duration

## Custom Domain (Optional)

- [ ] Purchase domain (Route 53 or external registrar)
- [ ] Go to Amplify Console → Domain management
- [ ] Add domain
- [ ] Configure DNS records
- [ ] Wait for SSL certificate provisioning (usually 5-15 minutes)
- [ ] Verify custom domain works

## Documentation

- [ ] Update README.md with deployment instructions
- [ ] Document API endpoints and authentication flow
- [ ] Create runbook for common issues
- [ ] Document environment variables
- [ ] Create disaster recovery plan

## Final Verification

- [ ] All endpoints working correctly
- [ ] No console errors or warnings
- [ ] Performance acceptable (< 3s page load)
- [ ] Mobile responsive design working
- [ ] All features functional
- [ ] User feedback positive

## Post-Deployment Tasks

- [ ] Announce deployment to team
- [ ] Update documentation
- [ ] Monitor logs for issues
- [ ] Gather user feedback
- [ ] Plan next features/improvements
- [ ] Schedule security audit
- [ ] Set up continuous monitoring

---

## Quick Reference

### Amplify URL
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

### Test API Endpoint
```bash
curl https://pit5nsq8w0.execute-api.ap-southeast-2.amazonaws.com/prod/riddles/random \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### View Logs
```bash
# Amplify build logs: AWS Console → Amplify → Deployments
# Lambda logs: AWS Console → CloudWatch → Logs
# API Gateway logs: AWS Console → API Gateway → Logs
```

---

**Last Updated:** November 2025
**Status:** Ready for Deployment
**Estimated Deployment Time:** 15-30 minutes
