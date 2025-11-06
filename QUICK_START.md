# Quick Start Guide - Gotham Cipher Frontend

## 🚀 Deploy to AWS Amplify in 5 Minutes

### Prerequisites
- GitHub account with repository access
- AWS account with Amplify permissions
- Backend already deployed

### Step 1: Connect to Amplify (2 min)
```
1. Go to https://console.aws.amazon.com/amplify/
2. Click "Create new app" → "Host web app"
3. Select GitHub → Authorize → Select repository
4. Choose main branch → Click "Next"
```

### Step 2: Configure Build (1 min)
```
Build command: npm run build
Output directory: dist
Node version: 18

Environment variables:
VITE_API_BASE_URL=https://pit5nsq8w0.execute-api.ap-southeast-2.amazonaws.com/prod
```

### Step 3: Deploy (2 min)
```
Click "Save and deploy" → Wait for completion → Done! 🎉
```

Your app will be live at: `https://<branch>.<app-id>.amplifyapp.com`

---

## 🧪 Test Locally Before Deploying

### Setup
```bash
npm install
```

### Create .env file
```
VITE_API_BASE_URL=https://pit5nsq8w0.execute-api.ap-southeast-2.amazonaws.com/prod
```

### Run Dev Server
```bash
npm run dev
```

### Test API Integration
```bash
powershell -ExecutionPolicy Bypass -File verify-api-integration.ps1
```

---

## 📋 API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/register` | POST | Register user |
| `/api/auth/login` | POST | Login user |
| `/riddles/random` | GET | Get riddle |
| `/riddles/validate` | POST | Check answer |
| `/riddles/solve` | POST | Update progress |
| `/riddles/progress` | GET | Get stats |

**Base URL:** `https://pit5nsq8w0.execute-api.ap-southeast-2.amazonaws.com/prod`

**Auth Header:** `Authorization: Bearer <JWT_TOKEN>`

---

## 🔍 Verify Deployment

### Check Frontend
- [ ] Page loads without errors
- [ ] No console errors
- [ ] Can register user
- [ ] Can login
- [ ] Can fetch riddles
- [ ] Can submit answers

### Check Network
- [ ] All API requests return 200
- [ ] JWT token in Authorization header
- [ ] CORS not blocking requests
- [ ] Response data is correct

### Troubleshooting
```bash
# Test API directly
curl https://pit5nsq8w0.execute-api.ap-southeast-2.amazonaws.com/prod/riddles/random \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Check build locally
npm run build

# Preview production build
npm run preview
```

---

## 📚 Documentation

- **Full Deployment Guide:** [AMPLIFY_DEPLOYMENT_GUIDE.md](./AMPLIFY_DEPLOYMENT_GUIDE.md)
- **Deployment Checklist:** [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)
- **Local Setup:** [SETUP_LOCAL_ENV.md](./SETUP_LOCAL_ENV.md)
- **Main README:** [README.md](./README.md)

---

## ⚡ Common Issues

### Build Fails
```bash
npm run build  # Test locally first
npm install    # Reinstall dependencies
```

### API Returns 404
- Check `VITE_API_BASE_URL` in Amplify Console
- Verify backend Lambda functions are deployed
- Check API Gateway routes exist

### CORS Errors
- Verify API Gateway has CORS enabled
- Check Amplify domain is allowed in CORS

### JWT Not Working
- Verify token format: `Authorization: Bearer <token>`
- Check token expiration
- Re-login to get fresh token

---

## 🎯 Next Steps

1. ✅ Deploy to Amplify
2. ✅ Test all endpoints
3. ✅ Monitor logs
4. ✅ Set up custom domain (optional)
5. ✅ Configure monitoring

---

**Ready to deploy?** Start with Step 1 above! 🚀
