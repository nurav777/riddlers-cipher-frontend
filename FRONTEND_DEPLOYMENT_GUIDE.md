# Frontend Deployment Guide - AWS Amplify

This guide explains how to deploy the Riddler's Cipher frontend (React/Vite app) to AWS Amplify for hosting.

## Prerequisites

- AWS account with appropriate permissions
- GitHub repository containing the project code
- Backend already deployed (API Gateway URL available)
- AWS CLI installed and configured (optional, for CLI deployment)

## AWS Amplify Overview

AWS Amplify provides:
- Static website hosting with global CDN
- Automatic HTTPS certificates
- Custom domain support
- Continuous deployment from Git
- Environment variables for configuration
- Build previews for pull requests

Free tier includes:
- 5GB storage
- 5GB data transfer/month
- 500 build minutes/month

## Deployment Steps

### 1. Connect Repository to Amplify

1. Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
2. Click "Create new app" → "Host web app"
3. Choose "GitHub" as the source
4. Authorize AWS to access your GitHub account
5. Select your repository (`riddlers-cipher-main`)
6. Choose the main branch (usually `main` or `master`)

### 2. Configure Build Settings

Amplify will auto-detect your app as a Vite React app, but verify these settings:

**App build settings:**
- **Build command:** `npm run build`
- **Build output directory:** `dist`
- **Node version:** `18` (or match your local version)

**Environment variables:**
Add these environment variables in Amplify Console → App settings → Environment variables:
- `VITE_API_BASE_URL`: Your API Gateway URL (e.g., `https://your-api-id.execute-api.region.amazonaws.com/prod`)

### 3. Deploy the App

1. Click "Save and deploy"
2. Amplify will:
   - Clone your repository
   - Install dependencies (`npm install`)
   - Build the app (`npm run build`)
   - Deploy to a global CDN
   - Provide a public URL (e.g., `https://branch-name.app-id.amplifyapp.com`)

### 4. Update Frontend API Configuration

Before deployment, ensure your frontend is configured to use the deployed backend:

1. Open `src/lib/api.ts`
2. Update the `apiBaseUrl` to your API Gateway endpoint:

```typescript
// src/lib/api.ts
export const apiBaseUrl = "https://your-api-gateway-url.amazonaws.com/prod";
```

3. Commit and push this change to trigger a new deployment

### 5. Custom Domain (Optional)

To use a custom domain:
1. Go to Amplify Console → App settings → Domain management
2. Add your domain
3. Configure DNS records as instructed
4. Amplify will provision SSL certificates automatically

## Build Configuration Details

For Vite apps, Amplify uses these default settings. If you need custom configuration, create an `amplify.yml` file in your repository root:

```yaml
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

## Environment Variables

Common environment variables to set:
- `VITE_API_BASE_URL`: Backend API URL
- `VITE_APP_ENV`: Environment (development/production)
- Any other public variables your app needs

## Monitoring and Logs

- **Access logs:** Amplify Console → App settings → Monitoring → Access logs
- **Build logs:** Available in the deployment history
- **Performance:** Use AWS CloudWatch for detailed metrics

## Cost Optimization

- Amplify's free tier covers most small projects
- Monitor data transfer usage
- Consider caching strategies for static assets

## Troubleshooting

### Common Issues

1. **Build fails**
   - Check build logs for errors
   - Ensure all dependencies are in `package.json`
   - Verify Node.js version compatibility

2. **API calls fail**
   - Verify `VITE_API_BASE_URL` is set correctly
   - Check CORS configuration on API Gateway
   - Ensure backend is deployed and accessible

3. **404 errors**
   - For SPAs, ensure proper redirect rules
   - Amplify auto-handles client-side routing for React

### Debug Commands

```bash
# Check build locally
npm run build

# Preview build output
npm run preview

# Test API connectivity
curl https://your-api-gateway-url.amazonaws.com/prod/riddles/random \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Security Considerations

- All Amplify sites use HTTPS by default
- Environment variables are encrypted
- Use AWS IAM for access control
- Regularly update dependencies

## Next Steps

1. Deploy the frontend using this guide
2. Test all functionality with the live URL
3. Set up monitoring and alerts
4. Configure custom domain if needed
5. Update any hardcoded URLs in the code

Your app will be accessible at: `https://branch-name.app-id.amplifyapp.com`

## Alternative: CLI Deployment

If you prefer using AWS CLI:

```bash
# Install Amplify CLI
npm install -g @aws-amplify/cli

# Initialize Amplify in your project
amplify init

# Add hosting
amplify add hosting

# Deploy
amplify publish
```

This provides the same functionality as the console method.
