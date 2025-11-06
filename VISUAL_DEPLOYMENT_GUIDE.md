# Visual Deployment Guide - Step-by-Step with Screenshots

## 🎯 Overview

This guide shows you exactly where to click in AWS Amplify Console to deploy your frontend.

---

## Step 1: Go to AWS Amplify Console

**URL:** https://console.aws.amazon.com/amplify/

```
┌─────────────────────────────────────────────────────────┐
│  AWS Amplify Console                                    │
│  ┌─────────────────────────────────────────────────────┐│
│  │ Create new app  │ My apps                           ││
│  └─────────────────────────────────────────────────────┘│
│                                                         │
│  ┌─────────────────────────────────────────────────────┐│
│  │ [Create new app]  ← Click here                      ││
│  └─────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

---

## Step 2: Select Hosting Method

**Click:** "Create new app" → "Host web app"

```
┌─────────────────────────────────────────────────────────┐
│  Create new app                                         │
│  ┌─────────────────────────────────────────────────────┐│
│  │ ○ Deploy without Git                               ││
│  │ ○ Host web app  ← Select this                      ││
│  └─────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

---

## Step 3: Connect Repository

**Select:** GitHub

```
┌─────────────────────────────────────────────────────────┐
│  Connect repository                                     │
│  ┌─────────────────────────────────────────────────────┐│
│  │ ○ GitHub      ← Select this                        ││
│  │ ○ GitLab                                           ││
│  │ ○ Bitbucket                                        ││
│  │ ○ AWS CodeCommit                                   ││
│  └─────────────────────────────────────────────────────┘│
│                                                         │
│  [Authorize with GitHub]  ← Click to authorize        │
└─────────────────────────────────────────────────────────┘
```

---

## Step 4: Select Repository

**Find:** `riddlers-cipher-pre-deployment`

```
┌─────────────────────────────────────────────────────────┐
│  Select repository                                      │
│  ┌─────────────────────────────────────────────────────┐│
│  │ Search: [___________________]                      ││
│  │                                                     ││
│  │ ☑ riddlers-cipher-pre-deployment  ← Select this   ││
│  │ ☐ other-repo                                       ││
│  │ ☐ another-repo                                     ││
│  └─────────────────────────────────────────────────────┘│
│                                                         │
│  [Next]  ← Click to continue                           │
└─────────────────────────────────────────────────────────┘
```

---

## Step 5: Select Branch

**Choose:** main (or your default branch)

```
┌─────────────────────────────────────────────────────────┐
│  Select branch                                          │
│  ┌─────────────────────────────────────────────────────┐│
│  │ Branch: [main ▼]  ← Select your branch            ││
│  │                                                     ││
│  │ ☑ main           ← Select this                     ││
│  │ ☐ develop                                          ││
│  │ ☐ feature/xyz                                      ││
│  └─────────────────────────────────────────────────────┘│
│                                                         │
│  [Next]  ← Click to continue                           │
└─────────────────────────────────────────────────────────┘
```

---

## Step 6: Configure Build Settings

**Verify these settings:**

```
┌─────────────────────────────────────────────────────────┐
│  Build settings                                         │
│  ┌─────────────────────────────────────────────────────┐│
│  │ Build command: [npm run build]                     ││
│  │ Build output directory: [dist]                     ││
│  │ Node version: [18]                                 ││
│  └─────────────────────────────────────────────────────┘│
│                                                         │
│  [Next]  ← Click to continue                           │
└─────────────────────────────────────────────────────────┘
```

---

## Step 7: Add Environment Variables

**IMPORTANT:** Add this environment variable

```
┌─────────────────────────────────────────────────────────┐
│  Environment variables                                  │
│  ┌─────────────────────────────────────────────────────┐│
│  │ Variable name: [VITE_API_BASE_URL]                 ││
│  │ Value: [https://pit5nsq8w0.execute-api.            ││
│  │        ap-southeast-2.amazonaws.com/prod]          ││
│  │                                                     ││
│  │ [+ Add variable]  ← Add more if needed             ││
│  └─────────────────────────────────────────────────────┘│
│                                                         │
│  [Save and deploy]  ← Click to deploy                 │
└─────────────────────────────────────────────────────────┘
```

**⚠️ IMPORTANT:** No trailing slash in the URL!

---

## Step 8: Review and Deploy

**Verify all settings, then click "Save and deploy"**

```
┌─────────────────────────────────────────────────────────┐
│  Review                                                 │
│  ┌─────────────────────────────────────────────────────┐│
│  │ Repository: riddlers-cipher-pre-deployment         ││
│  │ Branch: main                                        ││
│  │ Build command: npm run build                        ││
│  │ Output: dist                                        ││
│  │ Node: 18                                            ││
│  │                                                     ││
│  │ Environment variables:                              ││
│  │ VITE_API_BASE_URL=https://pit5nsq8w0...            ││
│  └─────────────────────────────────────────────────────┘│
│                                                         │
│  [Save and deploy]  ← Final step!                      │
└─────────────────────────────────────────────────────────┘
```

---

## Step 9: Monitor Deployment

**Watch the deployment progress**

```
┌─────────────────────────────────────────────────────────┐
│  Deployment in progress                                 │
│  ┌─────────────────────────────────────────────────────┐│
│  │ Status: Building...                                ││
│  │                                                     ││
│  │ ⏳ Provisioning                                     ││
│  │ ⏳ Building                                         ││
│  │ ⏳ Deploying                                        ││
│  │ ⏳ Verifying                                        ││
│  │                                                     ││
│  │ Build time: 2:45                                   ││
│  └─────────────────────────────────────────────────────┘│
│                                                         │
│  Refresh page to see updates                           │
└─────────────────────────────────────────────────────────┘
```

---

## Step 10: Deployment Complete! 🎉

**Your app is now live!**

```
┌─────────────────────────────────────────────────────────┐
│  Deployment successful                                  │
│  ┌─────────────────────────────────────────────────────┐│
│  │ ✅ Status: Deployed                                ││
│  │                                                     ││
│  │ URL: https://main.d1234567890.amplifyapp.com      ││
│  │                                                     ││
│  │ [Visit app]  ← Click to open your app             ││
│  └─────────────────────────────────────────────────────┘│
│                                                         │
│  Copy this URL and share it!                           │
└─────────────────────────────────────────────────────────┘
```

---

## Verification Checklist

After deployment, verify these things:

### 1. Frontend Loads
```
Open: https://main.d1234567890.amplifyapp.com
Expected: Page loads without errors
Check: Browser console (F12) for errors
```

### 2. User Registration
```
1. Click "Register"
2. Enter email, password, confirm password
3. Click "Register"
Expected: Success message, JWT token stored
Check: DevTools → Application → Local Storage → jwtToken
```

### 3. User Login
```
1. Enter registered email and password
2. Click "Login"
Expected: Success message, redirected to game
Check: DevTools → Application → Local Storage → jwtToken
```

### 4. Fetch Riddle
```
1. After login, navigate to game
2. Riddle should load
Expected: Riddle question displayed
Check: DevTools → Network → GET /riddles/random (200 status)
```

### 5. Submit Answer
```
1. Enter an answer to the riddle
2. Click "Submit"
Expected: Validation result displayed
Check: DevTools → Network → POST /riddles/validate (200 status)
```

### 6. Check Progress
```
1. Navigate to profile/progress page
2. Stats should display
Expected: Player progress and achievements shown
Check: DevTools → Network → GET /riddles/progress (200 status)
```

---

## Network Tab Inspection

**How to check API calls in DevTools:**

```
1. Open DevTools: F12 or Right-click → Inspect
2. Go to Network tab
3. Perform an action (login, fetch riddle, etc.)
4. Look for the API request
5. Click on it to see details

Expected for successful request:
┌─────────────────────────────────────────────────────────┐
│ GET /riddles/random                                     │
│ Status: 200 OK                                          │
│ Headers:                                                │
│   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6... │
│   Content-Type: application/json                        │
│ Response:                                               │
│   {                                                     │
│     "riddle": { ... },                                  │
│     "playerProgress": { ... }                           │
│   }                                                     │
└─────────────────────────────────────────────────────────┘
```

---

## Troubleshooting Visual Guide

### Issue: Page shows 404

```
❌ Problem:
   https://main.d1234567890.amplifyapp.com → 404 Not Found

✅ Solution:
   1. Wait 5 minutes for deployment to fully propagate
   2. Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
   3. Check deployment status in Amplify Console
   4. Check build logs for errors
```

### Issue: API calls fail with CORS error

```
❌ Problem:
   Console shows: "Access to XMLHttpRequest blocked by CORS"

✅ Solution:
   1. Check VITE_API_BASE_URL is set correctly in Amplify Console
   2. Verify API Gateway has CORS enabled
   3. Check that Authorization header is included
   4. Verify backend Lambda functions are deployed
```

### Issue: JWT token not stored

```
❌ Problem:
   localStorage doesn't have jwtToken after login

✅ Solution:
   1. Check login response includes jwtToken field
   2. Check browser console for errors
   3. Verify login endpoint returns 200 status
   4. Check response body contains token
```

### Issue: Riddles not loading

```
❌ Problem:
   GET /riddles/random returns 404 or error

✅ Solution:
   1. Verify JWT token is sent in Authorization header
   2. Check token is not expired
   3. Verify backend Lambda function is deployed
   4. Check API Gateway route exists
   5. Test endpoint directly with curl
```

---

## Quick Reference URLs

### Amplify Console
```
https://console.aws.amazon.com/amplify/
```

### Your Deployed App
```
https://main.<app-id>.amplifyapp.com
```

### API Base URL
```
https://pit5nsq8w0.execute-api.ap-southeast-2.amazonaws.com/prod
```

### Environment Variable
```
VITE_API_BASE_URL=https://pit5nsq8w0.execute-api.ap-southeast-2.amazonaws.com/prod
```

---

## Common Mistakes to Avoid

❌ **Don't:** Forget to set environment variable
✅ **Do:** Set `VITE_API_BASE_URL` in Amplify Console

❌ **Don't:** Include trailing slash in API URL
✅ **Do:** Use `https://pit5nsq8w0.execute-api.ap-southeast-2.amazonaws.com/prod` (no slash)

❌ **Don't:** Deploy without testing locally first
✅ **Do:** Run `npm run build` and `verify-api-integration.ps1` first

❌ **Don't:** Modify backend Lambda functions
✅ **Do:** Only update frontend code

❌ **Don't:** Hardcode API URL in frontend
✅ **Do:** Use environment variables

---

## Success Indicators

✅ **You're successful when:**
- Frontend loads without errors
- User registration works
- User login works
- Riddles load correctly
- Answers can be submitted
- Progress is tracked
- No console errors
- No CORS errors
- JWT token persists
- All API calls return 200

---

## Next Steps After Deployment

1. ✅ Share the Amplify URL with your team
2. ✅ Test all features thoroughly
3. ✅ Monitor deployment logs
4. ✅ Set up custom domain (optional)
5. ✅ Configure monitoring and alerts
6. ✅ Plan next features

---

## Support

If something goes wrong:

1. **Check DevTools Console** (F12) for errors
2. **Check Network Tab** to see API responses
3. **Check Amplify Console** for build/deployment logs
4. **Read** [AMPLIFY_DEPLOYMENT_GUIDE.md](./AMPLIFY_DEPLOYMENT_GUIDE.md#troubleshooting)
5. **Run** `verify-api-integration.ps1` to test endpoints

---

**Ready to deploy? Follow the steps above! 🚀**

**Estimated time: 15-20 minutes from start to live app**
