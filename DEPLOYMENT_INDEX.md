# Deployment Documentation Index

## 📚 Complete Guide to Deploying Gotham Cipher Frontend

Welcome! This index will help you navigate all deployment documentation and resources.

---

## 🚀 Quick Links

### For First-Time Deployers
1. **Start here:** [QUICK_START.md](./QUICK_START.md) - 5-minute deployment guide
2. **Then read:** [AMPLIFY_DEPLOYMENT_GUIDE.md](./AMPLIFY_DEPLOYMENT_GUIDE.md) - Detailed instructions
3. **Finally verify:** [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) - Post-deployment verification

### For Developers
1. **Setup:** [SETUP_LOCAL_ENV.md](./SETUP_LOCAL_ENV.md) - Local development environment
2. **Architecture:** [ARCHITECTURE.md](./ARCHITECTURE.md) - System design and data flows
3. **API Reference:** [API_ENDPOINTS.md](#api-endpoints) - All endpoints and usage

### For DevOps/Operations
1. **Deployment:** [AMPLIFY_DEPLOYMENT_GUIDE.md](./AMPLIFY_DEPLOYMENT_GUIDE.md)
2. **Monitoring:** [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) - Monitoring section
3. **Troubleshooting:** [AMPLIFY_DEPLOYMENT_GUIDE.md](./AMPLIFY_DEPLOYMENT_GUIDE.md) - Troubleshooting section

---

## 📖 Documentation Files

### Core Documentation

| File | Purpose | Audience | Time |
|------|---------|----------|------|
| [QUICK_START.md](./QUICK_START.md) | Quick deployment reference | Everyone | 5 min |
| [AMPLIFY_DEPLOYMENT_GUIDE.md](./AMPLIFY_DEPLOYMENT_GUIDE.md) | Complete deployment guide | Developers, DevOps | 20 min |
| [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) | Pre/post deployment verification | QA, DevOps | 30 min |
| [DEPLOYMENT_SUMMARY.md](./DEPLOYMENT_SUMMARY.md) | Overview of all changes | Project Managers | 10 min |
| [SETUP_LOCAL_ENV.md](./SETUP_LOCAL_ENV.md) | Local development setup | Developers | 15 min |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System architecture and design | Architects, Developers | 20 min |
| [README.md](./README.md) | Project overview | Everyone | 5 min |

### Configuration Files

| File | Purpose | Status |
|------|---------|--------|
| [.env](./.env) | Environment variables | ✅ Created |
| [amplify.yml](./amplify.yml) | Amplify build configuration | ✅ Created |

### Verification Scripts

| File | Purpose | Usage |
|------|---------|-------|
| [verify-api-integration.ps1](./verify-api-integration.ps1) | Test API endpoints | `powershell -ExecutionPolicy Bypass -File verify-api-integration.ps1` |

---

## 🎯 Deployment Paths

### Path 1: First-Time Deployment (Recommended)

```
1. Read QUICK_START.md (5 min)
   ↓
2. Run verify-api-integration.ps1 (2 min)
   ↓
3. Follow AMPLIFY_DEPLOYMENT_GUIDE.md (5 min)
   ↓
4. Use DEPLOYMENT_CHECKLIST.md to verify (5 min)
   ↓
5. Done! 🎉
```

**Total Time:** ~20 minutes

### Path 2: Local Development First

```
1. Read SETUP_LOCAL_ENV.md (5 min)
   ↓
2. npm install && npm run dev (5 min)
   ↓
3. Run verify-api-integration.ps1 (2 min)
   ↓
4. Follow AMPLIFY_DEPLOYMENT_GUIDE.md (5 min)
   ↓
5. Use DEPLOYMENT_CHECKLIST.md to verify (5 min)
   ↓
6. Done! 🎉
```

**Total Time:** ~25 minutes

### Path 3: Understanding Architecture First

```
1. Read ARCHITECTURE.md (20 min)
   ↓
2. Read AMPLIFY_DEPLOYMENT_GUIDE.md (20 min)
   ↓
3. Follow QUICK_START.md (5 min)
   ↓
4. Use DEPLOYMENT_CHECKLIST.md to verify (5 min)
   ↓
5. Done! 🎉
```

**Total Time:** ~50 minutes

---

## 📋 API Endpoints

All endpoints require JWT authentication in the `Authorization` header.

**Base URL:** `https://pit5nsq8w0.execute-api.ap-southeast-2.amazonaws.com/prod`

### Authentication Endpoints

| Endpoint | Method | Purpose | Auth Required |
|----------|--------|---------|---|
| `/api/auth/register` | POST | Register new user | ❌ No |
| `/api/auth/login` | POST | Login user | ❌ No |

### Riddle Endpoints

| Endpoint | Method | Purpose | Auth Required |
|----------|--------|---------|---|
| `/riddles/random` | GET | Get random riddle | ✅ Yes |
| `/riddles/validate` | POST | Validate answer | ✅ Yes |
| `/riddles/solve` | POST | Update progress | ✅ Yes |
| `/riddles/progress` | GET | Get player progress | ✅ Yes |

### Example Request

```bash
curl https://pit5nsq8w0.execute-api.ap-southeast-2.amazonaws.com/prod/riddles/random \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 🔧 Configuration Reference

### Environment Variables

| Variable | Value | Required |
|----------|-------|----------|
| `VITE_API_BASE_URL` | `https://pit5nsq8w0.execute-api.ap-southeast-2.amazonaws.com/prod` | ✅ Yes |

### Build Configuration

```yaml
# amplify.yml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: dist
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
```

---

## ✅ Pre-Deployment Checklist

- [ ] Read [QUICK_START.md](./QUICK_START.md)
- [ ] Run `npm install` locally
- [ ] Run `npm run build` successfully
- [ ] Run `verify-api-integration.ps1` and all tests pass
- [ ] Have GitHub repository ready
- [ ] Have AWS account with Amplify access
- [ ] Backend Lambda functions deployed
- [ ] API Gateway routes created

---

## ✅ Post-Deployment Checklist

- [ ] Amplify deployment completed successfully
- [ ] Environment variable `VITE_API_BASE_URL` set in Amplify Console
- [ ] Frontend loads without errors
- [ ] User registration works
- [ ] User login works
- [ ] Riddle retrieval works
- [ ] Answer validation works
- [ ] Progress updates work
- [ ] No console errors
- [ ] No CORS errors
- [ ] JWT token persists across page reloads
- [ ] Logout clears token

---

## 🆘 Troubleshooting Quick Reference

### Build Fails
→ See [AMPLIFY_DEPLOYMENT_GUIDE.md - Troubleshooting](./AMPLIFY_DEPLOYMENT_GUIDE.md#troubleshooting)

### API Returns 404
→ See [AMPLIFY_DEPLOYMENT_GUIDE.md - API Calls Return 404](./AMPLIFY_DEPLOYMENT_GUIDE.md#issue-api-calls-return-404)

### CORS Errors
→ See [AMPLIFY_DEPLOYMENT_GUIDE.md - CORS Errors](./AMPLIFY_DEPLOYMENT_GUIDE.md#issue-cors-errors)

### JWT Not Working
→ See [AMPLIFY_DEPLOYMENT_GUIDE.md - JWT Token Not Stored](./AMPLIFY_DEPLOYMENT_GUIDE.md#issue-jwt-token-not-stored)

---

## 📊 Key Information

### API Gateway
- **Endpoint:** `https://pit5nsq8w0.execute-api.ap-southeast-2.amazonaws.com/prod`
- **Region:** ap-southeast-2
- **Stage:** prod
- **Type:** HTTP API

### Frontend Framework
- **Framework:** React 18
- **Build Tool:** Vite
- **Language:** TypeScript
- **Styling:** Tailwind CSS + shadcn/ui

### Deployment Platform
- **Platform:** AWS Amplify
- **Hosting:** Global CDN
- **HTTPS:** Automatic
- **Custom Domain:** Supported

---

## 🔒 Security Information

- ✅ All API calls use HTTPS
- ✅ JWT tokens stored in localStorage
- ✅ Environment variables encrypted in Amplify
- ✅ CORS configured for security
- ✅ Authorization header required for protected endpoints

---

## 📞 Support Resources

- [AWS Amplify Documentation](https://docs.aws.amazon.com/amplify/)
- [AWS API Gateway Documentation](https://docs.aws.amazon.com/apigateway/)
- [AWS Lambda Documentation](https://docs.aws.amazon.com/lambda/)
- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)

---

## 🎓 Learning Resources

### Understanding the Architecture
1. Read [ARCHITECTURE.md](./ARCHITECTURE.md) for system design
2. Review data flow diagrams
3. Study component architecture

### Understanding Deployment
1. Read [AMPLIFY_DEPLOYMENT_GUIDE.md](./AMPLIFY_DEPLOYMENT_GUIDE.md)
2. Follow step-by-step instructions
3. Use [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) for verification

### Understanding Development
1. Read [SETUP_LOCAL_ENV.md](./SETUP_LOCAL_ENV.md)
2. Set up local environment
3. Run development server
4. Test API integration

---

## 📝 File Structure

```
riddlers-cipher-pre-deployment/
├── src/
│   ├── lib/
│   │   └── api.ts (Updated API endpoints)
│   ├── pages/
│   ├── components/
│   └── ...
├── .env (Environment variables)
├── amplify.yml (Build configuration)
├── package.json
├── vite.config.ts
├── README.md (Updated)
├── QUICK_START.md (New)
├── AMPLIFY_DEPLOYMENT_GUIDE.md (New)
├── DEPLOYMENT_CHECKLIST.md (New)
├── DEPLOYMENT_SUMMARY.md (New)
├── SETUP_LOCAL_ENV.md (New)
├── ARCHITECTURE.md (New)
├── DEPLOYMENT_INDEX.md (This file)
└── verify-api-integration.ps1 (New)
```

---

## 🚀 Getting Started

### Option 1: Quick Deploy (5 minutes)
```bash
# 1. Read quick start
# 2. Deploy to Amplify
# 3. Done!
```
→ Follow [QUICK_START.md](./QUICK_START.md)

### Option 2: Test First (25 minutes)
```bash
# 1. Setup local environment
npm install
npm run dev

# 2. Test API integration
powershell -ExecutionPolicy Bypass -File verify-api-integration.ps1

# 3. Deploy to Amplify
# 4. Verify deployment
```
→ Follow [SETUP_LOCAL_ENV.md](./SETUP_LOCAL_ENV.md) then [QUICK_START.md](./QUICK_START.md)

### Option 3: Full Understanding (50 minutes)
```bash
# 1. Read architecture
# 2. Read deployment guide
# 3. Setup local environment
# 4. Test API integration
# 5. Deploy to Amplify
# 6. Verify deployment
```
→ Follow [ARCHITECTURE.md](./ARCHITECTURE.md) → [AMPLIFY_DEPLOYMENT_GUIDE.md](./AMPLIFY_DEPLOYMENT_GUIDE.md) → [SETUP_LOCAL_ENV.md](./SETUP_LOCAL_ENV.md) → [QUICK_START.md](./QUICK_START.md)

---

## ✨ What's Included

### Frontend Updates
- ✅ API endpoints updated to match Lambda routes
- ✅ JWT authentication configured
- ✅ Environment variables set up
- ✅ Build configuration created

### Documentation
- ✅ 7 comprehensive guides
- ✅ Architecture diagrams
- ✅ Deployment checklists
- ✅ Troubleshooting guides
- ✅ API reference

### Scripts
- ✅ API integration verification script
- ✅ Build configuration
- ✅ Environment setup

---

## 🎯 Next Steps

1. **Choose your path** above (Quick, Test First, or Full Understanding)
2. **Follow the guide** for your chosen path
3. **Deploy to Amplify** using the instructions
4. **Verify deployment** using the checklist
5. **Monitor and maintain** your application

---

## 📞 Questions?

Refer to the appropriate documentation:
- **"How do I deploy?"** → [QUICK_START.md](./QUICK_START.md)
- **"What's the architecture?"** → [ARCHITECTURE.md](./ARCHITECTURE.md)
- **"How do I set up locally?"** → [SETUP_LOCAL_ENV.md](./SETUP_LOCAL_ENV.md)
- **"What endpoints are available?"** → [AMPLIFY_DEPLOYMENT_GUIDE.md](./AMPLIFY_DEPLOYMENT_GUIDE.md#api-integration-details)
- **"How do I verify deployment?"** → [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)
- **"What went wrong?"** → [AMPLIFY_DEPLOYMENT_GUIDE.md](./AMPLIFY_DEPLOYMENT_GUIDE.md#troubleshooting)

---

**Last Updated:** November 2025
**Status:** Ready for Production Deployment
**Version:** 1.0.0

**Happy Deploying! 🚀**
