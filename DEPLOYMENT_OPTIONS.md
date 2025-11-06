# Deployment Options - Choose Your Method

Three ways to deploy your Gotham Cipher frontend to AWS.

---

## 🎯 Quick Comparison

| Method | Difficulty | Time | Cost | Best For |
|--------|-----------|------|------|----------|
| **Amplify Console** | ⭐ Easy | 5 min | Free tier | Beginners, CI/CD |
| **AWS CLI** | ⭐⭐ Medium | 10 min | Free tier | Developers, automation |
| **PowerShell Script** | ⭐ Easy | 5 min | Free tier | Windows users |

---

## 🌐 Option 1: AWS Amplify Console (Recommended for Beginners)

### Pros
- ✅ Easiest method
- ✅ No CLI needed
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ Continuous deployment from GitHub
- ✅ Custom domain support
- ✅ Free tier available

### Cons
- ❌ Requires GitHub account
- ❌ Less control over infrastructure

### Steps

1. Go to: https://console.aws.amazon.com/amplify/
2. Click "Create new app" → "Host web app"
3. Select GitHub
4. Connect repository: `riddlers-cipher-pre-deployment`
5. Select branch: `main`
6. Configure build:
   - Build command: `npm run build`
   - Output directory: `dist`
7. Add environment variable:
   ```
   VITE_API_BASE_URL=https://pit5nsq8w0.execute-api.ap-southeast-2.amazonaws.com/prod
   ```
8. Click "Save and deploy"
9. Wait 5 minutes
10. Done! ✅

### Time: 5 minutes
### Cost: Free (within free tier)

---

## 💻 Option 2: AWS CLI (Recommended for Developers)

### Pros
- ✅ Full control
- ✅ Scriptable
- ✅ Works with any Git provider
- ✅ Can automate with CI/CD
- ✅ Faster for experienced users

### Cons
- ❌ Requires AWS CLI installation
- ❌ More commands to run
- ❌ Manual updates needed

### Steps

```bash
# 1. Configure AWS CLI
aws configure

# 2. Build frontend
npm run build

# 3. Create S3 bucket
aws s3 mb s3://gotham-cipher-XXXXX --region ap-southeast-2

# 4. Upload files
aws s3 sync dist/ s3://gotham-cipher-XXXXX/ --region ap-southeast-2 --delete

# 5. Enable static website hosting
aws s3api put-bucket-website \
  --bucket gotham-cipher-XXXXX \
  --website-configuration IndexDocument={Suffix=index.html},ErrorDocument={Key=index.html} \
  --region ap-southeast-2

# 6. Make bucket public
aws s3api put-bucket-policy \
  --bucket gotham-cipher-XXXXX \
  --policy file://bucket-policy.json \
  --region ap-southeast-2

# 7. Get URL
aws s3api get-bucket-website \
  --bucket gotham-cipher-XXXXX \
  --region ap-southeast-2
```

### Time: 10 minutes
### Cost: Free (within free tier)

---

## 🔧 Option 3: PowerShell Script (Recommended for Windows)

### Pros
- ✅ Automated
- ✅ Single command
- ✅ Handles all steps
- ✅ Error checking
- ✅ Summary output

### Cons
- ❌ Windows only
- ❌ Less control
- ❌ Requires AWS CLI

### Steps

```powershell
# 1. Run deployment script
powershell -ExecutionPolicy Bypass -File deploy-amplify.ps1

# Done! ✅
```

### Time: 5 minutes
### Cost: Free (within free tier)

---

## 🚀 Option 4: AWS Amplify CLI

### Pros
- ✅ Integrated development workflow
- ✅ Local testing
- ✅ Easy updates
- ✅ Automatic CI/CD

### Cons
- ❌ Additional tool to install
- ❌ Steeper learning curve

### Steps

```bash
# 1. Install Amplify CLI
npm install -g @aws-amplify/cli

# 2. Initialize
amplify init

# 3. Add hosting
amplify add hosting

# 4. Deploy
amplify publish

# Done! ✅
```

### Time: 10 minutes
### Cost: Free (within free tier)

---

## 📊 Detailed Comparison

### Setup Complexity
```
Amplify Console:  ████░░░░░░ (4/10)
AWS CLI:          ██████░░░░ (6/10)
PowerShell:       ████░░░░░░ (4/10)
Amplify CLI:      ██████░░░░ (6/10)
```

### Speed
```
Amplify Console:  ████░░░░░░ (4/10) - 5 min
AWS CLI:          ██████░░░░ (6/10) - 10 min
PowerShell:       ████░░░░░░ (4/10) - 5 min
Amplify CLI:      ██████░░░░ (6/10) - 10 min
```

### Control
```
Amplify Console:  ██░░░░░░░░ (2/10)
AWS CLI:          ████████░░ (8/10)
PowerShell:       ████░░░░░░ (4/10)
Amplify CLI:      ██████░░░░ (6/10)
```

### Automation
```
Amplify Console:  ██░░░░░░░░ (2/10)
AWS CLI:          ████████░░ (8/10)
PowerShell:       ██████░░░░ (6/10)
Amplify CLI:      ████████░░ (8/10)
```

---

## 🎯 Choose Based on Your Needs

### "I want the easiest way"
→ **AWS Amplify Console**
- No CLI needed
- Visual interface
- Automatic HTTPS
- GitHub integration

### "I want full control"
→ **AWS CLI**
- Complete control
- Scriptable
- Works anywhere
- Automation-friendly

### "I'm on Windows and want fast deployment"
→ **PowerShell Script**
- Single command
- Automated setup
- Error checking
- Summary output

### "I want integrated development workflow"
→ **AWS Amplify CLI**
- Local testing
- Integrated with development
- Easy updates
- Automatic CI/CD

---

## 📋 Pre-Deployment Checklist

For all methods:
- [ ] AWS account created
- [ ] AWS credentials configured
- [ ] Frontend code ready
- [ ] `.env` file created
- [ ] `npm run build` succeeds locally
- [ ] Backend Lambda functions deployed
- [ ] API Gateway routes created

---

## 🔄 Comparison: Updating Deployment

### Amplify Console
```
1. Push code to GitHub
2. Amplify automatically rebuilds and deploys
3. Done! ✅
```

### AWS CLI
```
1. npm run build
2. aws s3 sync dist/ s3://bucket/ --delete
3. Done! ✅
```

### PowerShell Script
```
1. Run deploy-amplify.ps1 again
2. Done! ✅
```

### Amplify CLI
```
1. amplify publish
2. Done! ✅
```

---

## 💰 Cost Comparison

All methods use AWS free tier:

| Service | Free Tier | Cost After |
|---------|-----------|-----------|
| Amplify | 5GB storage, 5GB transfer/month | $0.01-0.15 per GB |
| S3 | 5GB storage, 5GB transfer/month | $0.023 per GB |
| CloudFront | 1TB transfer/month | $0.085 per GB |
| **Total** | **Free** | **~$5-50/month** |

---

## 🏆 Recommendations

### For Beginners
**→ AWS Amplify Console**
- Easiest to use
- Visual interface
- No CLI needed
- Automatic updates from GitHub

### For Developers
**→ AWS CLI**
- Full control
- Scriptable
- Works with any Git provider
- Easy to automate

### For Windows Users
**→ PowerShell Script**
- Single command
- Automated
- Error checking
- Summary output

### For Full Integration
**→ AWS Amplify CLI**
- Integrated workflow
- Local testing
- Automatic CI/CD
- Easy management

---

## 🚀 Next Steps

1. **Choose your method** above
2. **Follow the steps** for your chosen method
3. **Verify deployment** using verification script
4. **Test all features** in your deployed app
5. **Share URL** with your team

---

## 📞 Support

- [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
- [AWS CLI Documentation](https://docs.aws.amazon.com/cli/)
- [AWS Amplify CLI Documentation](https://docs.amplify.aws/)
- [AWS S3 Documentation](https://docs.aws.amazon.com/s3/)

---

**Ready to deploy? Choose your method and get started! 🚀**

---

**Last Updated:** November 2025
**Status:** Ready for Deployment
