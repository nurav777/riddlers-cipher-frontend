# 🚀 Deploy Now - Quick Commands

Deploy your Gotham Cipher frontend to AWS in 5 minutes!

---

## ⚡ Fastest Way (Using PowerShell Script)

```powershell
# 1. Build frontend
npm run build

# 2. Run deployment script
powershell -ExecutionPolicy Bypass -File deploy-amplify.ps1

# Done! ✅
```

---

## 📝 Step-by-Step AWS CLI Commands

### 1. Configure AWS CLI

```bash
aws configure
```

Enter:
- Access Key ID: `your-access-key`
- Secret Access Key: `your-secret-key`
- Region: `ap-southeast-2`
- Output format: `json`

### 2. Verify Credentials

```bash
aws sts get-caller-identity
```

### 3. Build Frontend

```bash
npm install
npm run build
```

### 4. Create S3 Bucket

```bash
# Replace XXXXX with random numbers or timestamp
aws s3 mb s3://gotham-cipher-frontend-XXXXX --region ap-southeast-2
```

### 5. Upload Build Files

```bash
aws s3 sync dist/ s3://gotham-cipher-frontend-XXXXX/ --region ap-southeast-2 --delete
```

### 6. Enable Static Website Hosting

```bash
aws s3api put-bucket-website \
  --bucket gotham-cipher-frontend-XXXXX \
  --website-configuration IndexDocument={Suffix=index.html},ErrorDocument={Key=index.html} \
  --region ap-southeast-2
```

### 7. Make Bucket Public

Create `bucket-policy.json`:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::gotham-cipher-frontend-XXXXX/*"
    }
  ]
}
```

Apply policy:
```bash
aws s3api put-bucket-policy \
  --bucket gotham-cipher-frontend-XXXXX \
  --policy file://bucket-policy.json \
  --region ap-southeast-2
```

### 8. Get Website URL

```bash
aws s3api get-bucket-website \
  --bucket gotham-cipher-frontend-XXXXX \
  --region ap-southeast-2
```

Your URL: `http://gotham-cipher-frontend-XXXXX.s3-website-ap-southeast-2.amazonaws.com`

---

## 🎯 Using AWS Amplify CLI

```bash
# 1. Install Amplify CLI
npm install -g @aws-amplify/cli

# 2. Initialize Amplify
amplify init

# 3. Add hosting
amplify add hosting

# 4. Deploy
amplify publish

# Done! ✅
```

---

## 🌐 Using AWS Amplify Console (Easiest)

1. Go to: https://console.aws.amazon.com/amplify/
2. Click "Create new app" → "Host web app"
3. Select GitHub
4. Connect your repository
5. Select branch: `main`
6. Add environment variable:
   ```
   VITE_API_BASE_URL=https://pit5nsq8w0.execute-api.ap-southeast-2.amazonaws.com/prod
   ```
7. Click "Save and deploy"
8. Wait 5 minutes
9. Done! ✅

---

## ✅ Verify Deployment

### Test Website

Open your website URL in browser and verify:
- [ ] Page loads without errors
- [ ] No console errors (F12)
- [ ] Can register user
- [ ] Can login
- [ ] Can fetch riddles

### Test API Integration

```powershell
powershell -ExecutionPolicy Bypass -File verify-api-integration.ps1
```

---

## 📊 Environment Variables

Set in Amplify Console or `.env` file:

```
VITE_API_BASE_URL=https://pit5nsq8w0.execute-api.ap-southeast-2.amazonaws.com/prod
```

---

## 🔄 Update Deployment

After making changes:

```bash
# 1. Build
npm run build

# 2. Sync to S3
aws s3 sync dist/ s3://gotham-cipher-frontend-XXXXX/ --region ap-southeast-2 --delete

# 3. Invalidate CloudFront cache (if using CloudFront)
aws cloudfront create-invalidation \
  --distribution-id E1234ABCD \
  --paths "/*" \
  --region ap-southeast-2
```

---

## 🆘 Troubleshooting

### AWS CLI not found
```bash
# Install: https://aws.amazon.com/cli/
aws --version
```

### Credentials not configured
```bash
aws configure
aws sts get-caller-identity
```

### S3 bucket name taken
```bash
# Use unique name with timestamp
aws s3 mb s3://gotham-cipher-$(date +%s) --region ap-southeast-2
```

### Website shows 404
1. Check `index.html` is in S3
2. Verify static website hosting enabled
3. Check bucket policy allows public access

---

## 📋 Quick Reference

| Task | Command |
|------|---------|
| Build | `npm run build` |
| Create bucket | `aws s3 mb s3://gotham-cipher-XXXXX --region ap-southeast-2` |
| Upload | `aws s3 sync dist/ s3://gotham-cipher-XXXXX/ --region ap-southeast-2 --delete` |
| Enable hosting | `aws s3api put-bucket-website --bucket gotham-cipher-XXXXX --website-configuration IndexDocument={Suffix=index.html},ErrorDocument={Key=index.html} --region ap-southeast-2` |
| Make public | `aws s3api put-bucket-policy --bucket gotham-cipher-XXXXX --policy file://bucket-policy.json --region ap-southeast-2` |
| Get URL | `aws s3api get-bucket-website --bucket gotham-cipher-XXXXX --region ap-southeast-2` |

---

## 🎉 You're Done!

Your frontend is now deployed and accessible at your S3 website URL or Amplify URL!

**Next:** Test all features and share the URL with your team! 🚀

---

**Time to Deploy:** 5-10 minutes
**Difficulty:** Easy
**Status:** Ready to go!
