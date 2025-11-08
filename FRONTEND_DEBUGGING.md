# Frontend Debugging Guide - API Integration Issues

Your API endpoints are working, but the frontend isn't connecting properly. Let's debug this step by step.

---

## 🔍 Step 1: Check Browser Console (F12)

Open your deployed Amplify app and press **F12** to open DevTools.

### Go to Console Tab

Look for any error messages. Common errors:

**Error 1: CORS Error**
```
Access to XMLHttpRequest blocked by CORS
```
→ Check backend CORS configuration

**Error 2: 404 Error**
```
GET https://pit5nsq8w0.execute-api.ap-southeast-2.amazonaws.com/prod/riddles/random 404
```
→ Check API base URL is correct

**Error 3: Network Error**
```
Failed to fetch
```
→ Check if API is accessible

**Error 4: JSON Parse Error**
```
Unexpected token < in JSON at position 0
```
→ API returned HTML instead of JSON (likely an error page)

---

## 🔍 Step 2: Check Network Tab

Go to **Network** tab in DevTools.

### Perform an action (login, fetch riddle, etc.)

Look for API requests. For each request:

1. **Click on the request** to see details
2. **Check Status Code:**
   - ✅ 200 = Success
   - ❌ 400 = Bad request
   - ❌ 401 = Unauthorized
   - ❌ 404 = Not found
   - ❌ 500 = Server error

3. **Check Response Tab:**
   - Should be JSON
   - Should have `success: true` or `success: false`
   - Check error message if present

4. **Check Request Headers:**
   - Should have `Authorization: Bearer <token>`
   - Should have `Content-Type: application/json`

---

## 🔍 Step 3: Check Application Tab

Go to **Application** tab → **Local Storage**

### Look for:
- `jwtToken` - Should be present after login
- `userProfile` - Should contain user data
- `gotham_user_profile` - Should contain game profile

If these are missing, the login didn't work properly.

---

## 🔧 Common Issues and Fixes

### Issue 1: Environment Variable Not Set

**Symptom:** API calls go to `http://localhost:3001` instead of AWS API

**Fix:**
1. Go to AWS Amplify Console
2. Select your app
3. Go to **App settings → Environment variables**
4. Verify `VITE_API_BASE_URL` is set to:
   ```
   https://pit5nsq8w0.execute-api.ap-southeast-2.amazonaws.com/prod
   ```
5. Redeploy the app

---

### Issue 2: CORS Errors

**Symptom:**
```
Access to XMLHttpRequest blocked by CORS
```

**Fix:**
1. Check backend API Gateway CORS settings
2. Verify CORS headers are returned:
   - `Access-Control-Allow-Origin: *`
   - `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS`
   - `Access-Control-Allow-Headers: Content-Type, Authorization`

---

### Issue 3: 404 Errors on API Endpoints

**Symptom:**
```
GET /riddles/random 404
```

**Fix:**
1. Verify endpoint path is correct in `src/lib/api.ts`
2. Check backend Lambda routes are created
3. Test endpoint directly with curl:
   ```bash
   curl -H "Authorization: Bearer YOUR_TOKEN" \
     https://pit5nsq8w0.execute-api.ap-southeast-2.amazonaws.com/prod/riddles/random
   ```

---

### Issue 4: 401 Unauthorized

**Symptom:**
```
GET /riddles/random 401
```

**Fix:**
1. Check JWT token is being sent in Authorization header
2. Verify token is valid (not expired)
3. Check backend JWT validation logic
4. Test with curl:
   ```bash
   curl -H "Authorization: Bearer YOUR_TOKEN" \
     https://pit5nsq8w0.execute-api.ap-southeast-2.amazonaws.com/prod/riddles/random
   ```

---

### Issue 5: Login Response Missing JWT

**Symptom:**
```
Login response received: {success: true, data: {}}
No JWT token received from server
```

**Fix:**
1. Check backend login endpoint returns `jwtToken` in response
2. Verify response format matches expected structure
3. Check backend code for JWT generation

---

### Issue 6: Non-JSON Response

**Symptom:**
```
Non-JSON response from /riddles/random: <html>...</html>
```

**Fix:**
1. API returned HTML error page instead of JSON
2. Check backend Lambda function error logs
3. Verify Lambda function is deployed correctly
4. Check API Gateway integration

---

## 📝 What to Check

Create a checklist:

- [ ] Environment variable `VITE_API_BASE_URL` is set in Amplify
- [ ] API base URL has no trailing slash
- [ ] All 6 endpoints are configured in `src/lib/api.ts`
- [ ] JWT token is stored in localStorage after login
- [ ] JWT token is sent in Authorization header
- [ ] Backend CORS is enabled
- [ ] Backend Lambda functions are deployed
- [ ] API Gateway routes are created
- [ ] No console errors in DevTools
- [ ] Network requests show 200 status codes

---

## 🧪 Manual Testing

### Test 1: Check Environment Variable

In browser console:
```javascript
console.log(import.meta.env.VITE_API_BASE_URL)
```

Should output:
```
https://pit5nsq8w0.execute-api.ap-southeast-2.amazonaws.com/prod
```

### Test 2: Test API Endpoint Directly

In browser console:
```javascript
fetch('https://pit5nsq8w0.execute-api.ap-southeast-2.amazonaws.com/prod/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'test@example.com',
    password: 'password123'
  })
})
.then(r => r.json())
.then(d => console.log(d))
```

### Test 3: Check JWT Token

In browser console:
```javascript
console.log(localStorage.getItem('jwtToken'))
```

Should output the JWT token (long string starting with `eyJ...`)

---

## 📊 Debugging Workflow

1. **Open DevTools** (F12)
2. **Go to Console tab**
3. **Look for errors**
4. **Go to Network tab**
5. **Perform action** (login, fetch riddle, etc.)
6. **Check request/response**
7. **Check Application tab** for localStorage
8. **Compare with expected values**

---

## 🔗 Quick Links

- **Amplify Console:** https://console.aws.amazon.com/amplify/
- **AWS CloudWatch Logs:** https://console.aws.amazon.com/cloudwatch/
- **API Gateway Console:** https://console.aws.amazon.com/apigateway/

---

## 📞 Information to Collect

When asking for help, provide:

1. **Exact error message** from console
2. **Screenshot of Network tab** showing failed request
3. **Response body** from failed request
4. **Request headers** (especially Authorization)
5. **Environment variable value** (VITE_API_BASE_URL)
6. **Backend logs** from CloudWatch

---

## ✅ Success Indicators

You'll know it's working when:

- ✅ No console errors
- ✅ All network requests return 200
- ✅ JWT token stored in localStorage
- ✅ Can register user
- ✅ Can login
- ✅ Can fetch riddles
- ✅ Can submit answers
- ✅ Can view progress

---

## 🚀 Next Steps

1. Open DevTools (F12)
2. Check console for errors
3. Check Network tab for failed requests
4. Check Application tab for localStorage
5. Share findings and I'll help fix it!

---

**Share the error messages and I'll help you fix it! 👇**
