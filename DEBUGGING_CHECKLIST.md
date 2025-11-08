# Frontend Debugging Checklist

## 🔍 Quick Diagnostics

### 1. Check Browser Console (F12)
- [ ] Are there any error messages?
- [ ] Are there CORS errors?
- [ ] Are there network errors?
- [ ] What's the exact error message?

### 2. Check Network Tab (F12 → Network)
- [ ] Are API requests being made?
- [ ] What's the response status (200, 404, 500)?
- [ ] What's in the response body?
- [ ] Are Authorization headers being sent?

### 3. Check Application Tab (F12 → Application)
- [ ] Is `jwtToken` stored in localStorage?
- [ ] What's the token value?
- [ ] Is it being cleared on page load?

### 4. Test Specific Features
- [ ] Can you register a new user?
- [ ] Can you login?
- [ ] Does the page redirect after login?
- [ ] Can you see the riddle?
- [ ] Can you submit an answer?

---

## 📝 Common Issues and Fixes

### Issue 1: CORS Errors
**Error:** "Access to XMLHttpRequest blocked by CORS"
**Fix:** Check backend CORS configuration

### Issue 2: 404 Errors
**Error:** "GET /riddles/random 404"
**Fix:** Check API base URL is correct

### Issue 3: 401 Unauthorized
**Error:** "401 Unauthorized"
**Fix:** Check JWT token is being sent

### Issue 4: Environment Variable Not Set
**Error:** API calls go to wrong URL
**Fix:** Verify VITE_API_BASE_URL in Amplify Console

### Issue 5: Token Not Stored
**Error:** Can't login or token disappears
**Fix:** Check localStorage in DevTools

---

## 🎯 What to Check

1. **Environment Variable**
   - Is `VITE_API_BASE_URL` set in Amplify?
   - Is it the correct URL?
   - No trailing slash?

2. **API Endpoints**
   - Are they being called?
   - What's the response?
   - Check Network tab

3. **JWT Token**
   - Is it stored after login?
   - Is it being sent in requests?
   - Check Application → localStorage

4. **Build Output**
   - Was the build successful?
   - Check Amplify build logs

---

## 📞 Information Needed

Please provide:
1. **Exact error message** from browser console
2. **Screenshot of Network tab** showing failed request
3. **What feature doesn't work?** (login, riddle, etc.)
4. **What's the API response?** (status code, body)
5. **Is JWT token in localStorage?** (check Application tab)

---

**Share this information and I'll help fix it! 👇**
