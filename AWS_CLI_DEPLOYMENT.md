# AWS CLI Deployment Guide - Gotham Cipher Frontend

Complete guide for deploying the frontend using AWS CLI and AWS Amplify.

---

## 📋 Prerequisites

- AWS Account with appropriate permissions
- AWS CLI installed and configured
- Node.js 18+ installed
- npm installed
- Git installed
- GitHub repository connected to AWS Amplify (optional, for CI/CD)

---

## ✅ Step 1: Install and Configure AWS CLI

### Install AWS CLI

**Windows (using PowerShell):**
```powershell
# Using Chocolatey
choco install awscli

# Or download from AWS
# https://aws.amazon.com/cli/
```

**macOS:**
```bash
brew install awscli
```

**Linux:**
```bash
sudo apt-get install awscli
```

### Verify Installation

```bash
aws --version
```

Expected output:
```
aws-cli/2.x.x Python/3.x.x ...
```

---

## 🔐 Step 2: Configure AWS Credentials

### Configure AWS CLI

```bash
aws configure
```

You'll be prompted for:
1. **AWS Access Key ID:** Your access key
2. **AWS Secret Access Key:** Your secret key
3. **Default region:** `ap-southeast-2`
4. **Default output format:** `json`

### Verify Credentials

```bash
aws sts get-caller-identity
```

Expected output:
```json
{
    "UserId": "AIDAI...",
    "Account": "123456789012",
    "Arn": "arn:aws:iam::123456789012:user/your-username"
}
```

---

## 🏗️ Step 3: Build Frontend

### Build the Project

```bash
npm install
npm run build
```

Expected output:
```
✓ 1234 modules transformed
dist/index.html                    1.23 kb
dist/assets/main.abc123.js         456.78 kb
dist/assets/style.def456.css       123.45 kb
```

Verify `dist/` directory was created with build files.

---

## 📦 Step 4: Deploy Using AWS CLI

### Option A: Deploy to S3 + CloudFront (Recommended)

#### 1. Create S3 Bucket

```bash
aws s3 mb s3://gotham-cipher-frontend-$(date +%s) --region ap-southeast-2
```

**Note:** S3 bucket names must be globally unique. Use a timestamp or random suffix.

#### 2. Upload Build Files

```bash
aws s3 sync dist/ s3://gotham-cipher-frontend-XXXXX/ --region ap-southeast-2 --delete
```

#### 3. Enable Static Website Hosting

```bash
aws s3api put-bucket-website \
  --bucket gotham-cipher-frontend-XXXXX \
  --website-configuration IndexDocument={Suffix=index.html},ErrorDocument={Key=index.html} \
  --region ap-southeast-2
```

#### 4. Make Bucket Public

Create a file `bucket-policy.json`:

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

Apply the policy:

```bash
aws s3api put-bucket-policy \
  --bucket gotham-cipher-frontend-XXXXX \
  --policy file://bucket-policy.json \
  --region ap-southeast-2
```

#### 5. Get Website URL

```bash
aws s3api get-bucket-website \
  --bucket gotham-cipher-frontend-XXXXX \
  --region ap-southeast-2
```

Your website URL will be:
```
http://gotham-cipher-frontend-XXXXX.s3-website-ap-southeast-2.amazonaws.com
```

---

### Option B: Deploy Using AWS Amplify CLI

#### 1. Install Amplify CLI

```bash
npm install -g @aws-amplify/cli
```

#### 2. Initialize Amplify

```bash
amplify init
```

Follow the prompts:
- Project name: `gotham-cipher`
- Environment: `prod`
- Editor: Choose your editor
- App type: `javascript`
- Framework: `react`
- Source directory: `src`
- Distribution directory: `dist`
- Build command: `npm run build`
- Start command: `npm run dev`

#### 3. Add Hosting

```bash
amplify add hosting
```

Select:
- Hosting service: **Amazon CloudFront and S3**
- Environment: **prod**

#### 4. Deploy

```bash
amplify publish
```

This will:
1. Build your app
2. Create S3 bucket
3. Create CloudFront distribution
4. Deploy your app
5. Provide a live URL

---

## 🌐 Step 5: Configure CloudFront (Optional but Recommended)

### Create CloudFront Distribution

```bash
# Create distribution configuration
cat > cloudfront-config.json << 'EOF'
{
  "CallerReference": "gotham-cipher-$(date +%s)",
  "Comment": "Gotham Cipher Frontend",
  "DefaultRootObject": "index.html",
  "Origins": {
    "Quantity": 1,
    "Items": [
      {
        "Id": "S3Origin",
        "DomainName": "gotham-cipher-frontend-XXXXX.s3.amazonaws.com",
        "S3OriginConfig": {
          "OriginAccessIdentity": ""
        }
      }
    ]
  },
  "DefaultCacheBehavior": {
    "TargetOriginId": "S3Origin",
    "ViewerProtocolPolicy": "redirect-to-https",
    "TrustedSigners": {
      "Enabled": false,
      "Quantity": 0
    },
    "ForwardedValues": {
      "QueryString": false,
      "Cookies": {
        "Forward": "none"
      }
    },
    "MinTTL": 0
  },
  "Enabled": true
}
EOF
```

Create the distribution:

```bash
aws cloudfront create-distribution \
  --distribution-config file://cloudfront-config.json \
  --region ap-southeast-2
```

---

## 🔧 Step 6: Set Environment Variables

### For AWS Amplify Console

1. Go to AWS Amplify Console
2. Select your app
3. Go to **App settings → Environment variables**
4. Add:
   - **Name:** `VITE_API_BASE_URL`
   - **Value:** `https://pit5nsq8w0.execute-api.ap-southeast-2.amazonaws.com/prod`

### For Local Development

Create `.env` file:

```
VITE_API_BASE_URL=https://pit5nsq8w0.execute-api.ap-southeast-2.amazonaws.com/prod
```

---

## 🚀 Step 7: Deploy Using PowerShell Script

### Run the Deployment Script

```powershell
powershell -ExecutionPolicy Bypass -File deploy-amplify.ps1
```

The script will:
1. ✅ Verify AWS CLI
2. ✅ Check AWS credentials
3. ✅ Build frontend
4. ✅ Create S3 bucket
5. ✅ Upload build files
6. ✅ Enable static website hosting
7. ✅ Provide deployment summary

---

## 📊 Step 8: Verify Deployment

### Test Website

```bash
# Get website URL
aws s3api get-bucket-website \
  --bucket gotham-cipher-frontend-XXXXX \
  --region ap-southeast-2

# Open in browser
# http://gotham-cipher-frontend-XXXXX.s3-website-ap-southeast-2.amazonaws.com
```

### Test API Integration

```powershell
powershell -ExecutionPolicy Bypass -File verify-api-integration.ps1
```

### Check CloudFront Status

```bash
aws cloudfront list-distributions --region ap-southeast-2
```

---

## 🔄 Step 9: Update Deployment

### Update Frontend Code

```bash
# Make changes to your code
# Commit and push to GitHub
git add .
git commit -m "Update frontend"
git push origin main
```

### Rebuild and Redeploy

```bash
# Build
npm run build

# Sync to S3
aws s3 sync dist/ s3://gotham-cipher-frontend-XXXXX/ --region ap-southeast-2 --delete

# Invalidate CloudFront cache (if using CloudFront)
aws cloudfront create-invalidation \
  --distribution-id E1234ABCD \
  --paths "/*" \
  --region ap-southeast-2
```

---

## 🗑️ Step 10: Cleanup (If Needed)

### Delete S3 Bucket

```bash
# Empty bucket first
aws s3 rm s3://gotham-cipher-frontend-XXXXX --recursive --region ap-southeast-2

# Delete bucket
aws s3 rb s3://gotham-cipher-frontend-XXXXX --region ap-southeast-2
```

### Delete CloudFront Distribution

```bash
# Disable distribution first
aws cloudfront update-distribution \
  --id E1234ABCD \
  --distribution-config file://updated-config.json \
  --region ap-southeast-2

# Delete distribution (after it's disabled)
aws cloudfront delete-distribution \
  --id E1234ABCD \
  --region ap-southeast-2
```

---

## 📋 Quick Reference Commands

### Build and Deploy

```bash
# Build
npm run build

# Create S3 bucket
aws s3 mb s3://gotham-cipher-XXXXX --region ap-southeast-2

# Upload to S3
aws s3 sync dist/ s3://gotham-cipher-XXXXX/ --region ap-southeast-2 --delete

# Enable static website hosting
aws s3api put-bucket-website \
  --bucket gotham-cipher-XXXXX \
  --website-configuration IndexDocument={Suffix=index.html},ErrorDocument={Key=index.html} \
  --region ap-southeast-2

# Make bucket public
aws s3api put-bucket-policy \
  --bucket gotham-cipher-XXXXX \
  --policy file://bucket-policy.json \
  --region ap-southeast-2
```

### List Resources

```bash
# List S3 buckets
aws s3 ls --region ap-southeast-2

# List CloudFront distributions
aws cloudfront list-distributions --region ap-southeast-2

# List Amplify apps
aws amplify list-apps --region ap-southeast-2
```

### Monitor Deployment

```bash
# Check S3 bucket contents
aws s3 ls s3://gotham-cipher-XXXXX/ --recursive --region ap-southeast-2

# Check CloudFront distribution status
aws cloudfront get-distribution --id E1234ABCD --region ap-southeast-2

# Check Amplify app status
aws amplify get-app --app-id XXXXX --region ap-southeast-2
```

---

## 🆘 Troubleshooting

### Issue: AWS CLI not found

**Solution:**
```bash
# Install AWS CLI
# Windows: choco install awscli
# macOS: brew install awscli
# Linux: sudo apt-get install awscli

# Verify installation
aws --version
```

### Issue: AWS credentials not configured

**Solution:**
```bash
# Configure credentials
aws configure

# Verify
aws sts get-caller-identity
```

### Issue: S3 bucket name already exists

**Solution:**
```bash
# Use a unique bucket name with timestamp
aws s3 mb s3://gotham-cipher-$(date +%s) --region ap-southeast-2
```

### Issue: Access Denied errors

**Solution:**
1. Verify IAM permissions
2. Check AWS credentials
3. Ensure user has S3, CloudFront, and Amplify permissions

### Issue: Website shows 404

**Solution:**
1. Verify `index.html` is in S3 bucket
2. Check static website hosting is enabled
3. Verify bucket policy allows public access
4. Check CloudFront cache invalidation

---

## 📊 Deployment Checklist

- [ ] AWS CLI installed and configured
- [ ] AWS credentials verified
- [ ] Frontend built successfully
- [ ] S3 bucket created
- [ ] Build files uploaded to S3
- [ ] Static website hosting enabled
- [ ] Bucket policy set to public
- [ ] Website URL accessible
- [ ] API endpoints working
- [ ] Environment variables set
- [ ] CloudFront configured (optional)
- [ ] Custom domain configured (optional)

---

## 🎯 Next Steps

1. ✅ Deploy frontend using AWS CLI
2. ✅ Verify deployment
3. ✅ Test all API endpoints
4. ✅ Set up custom domain (optional)
5. ✅ Configure monitoring and alerts
6. ✅ Set up CI/CD pipeline

---

## 📞 Support

- [AWS CLI Documentation](https://docs.aws.amazon.com/cli/)
- [AWS Amplify Documentation](https://docs.aws.amazon.com/amplify/)
- [AWS S3 Documentation](https://docs.aws.amazon.com/s3/)
- [AWS CloudFront Documentation](https://docs.aws.amazon.com/cloudfront/)

---

**Last Updated:** November 2025
**Status:** Ready for Deployment
**Estimated Time:** 10-15 minutes
