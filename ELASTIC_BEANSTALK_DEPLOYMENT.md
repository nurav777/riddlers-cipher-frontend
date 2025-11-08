# Elastic Beanstalk Deployment Guide

This guide walks you through deploying the Riddlers Cipher project to AWS Elastic Beanstalk.

## Prerequisites

1. **AWS Account** with appropriate permissions
2. **AWS CLI** installed and configured
3. **EB CLI** (Elastic Beanstalk Command Line Interface) installed
4. **Node.js** 18.x or later
5. **Git** installed

## Installation

### 1. Install AWS CLI (if not already installed)
```bash
# Windows (using PowerShell)
msiexec.exe /i https://awscli.amazonaws.com/AWSCLIV2.msi

# Or using pip
pip install awscli --upgrade --user
```

### 2. Install EB CLI
```bash
pip install awsebcli --upgrade --user
```

### 3. Configure AWS Credentials
```bash
aws configure
```
You'll be prompted to enter:
- AWS Access Key ID
- AWS Secret Access Key
- Default region (e.g., `ap-southeast-2`)
- Default output format (e.g., `json`)

## Deployment Steps

### Step 1: Initialize Elastic Beanstalk
```bash
cd d:\riddlers-cipher-pre-deployment
eb init -p "Node.js 18 running on 64bit Amazon Linux 2" riddlers-cipher --region ap-southeast-2
```

### Step 2: Create Environment
```bash
eb create riddlers-cipher-env --instance-type t3.micro --envvars NODE_ENV=production,PORT=8081
```

### Step 3: Set Environment Variables
```bash
# Set your API configuration variables
eb setenv VITE_API_BASE_URL=https://your-api-endpoint.com
```

If you have a `.env` file with sensitive variables:
```bash
# Copy your .env file to the EB environment
eb setenv $(cat .env | tr '\n' ',')
```

### Step 4: Deploy
```bash
eb deploy
```

### Step 5: Monitor Deployment
```bash
# View deployment status
eb status

# View logs
eb logs

# Open the application in browser
eb open
```

## Configuration Files Included

### `.ebextensions/nodejs.config`
- Configures Node.js version and basic settings

### `.ebextensions/proxy.config`
- Configures Nginx proxy for proper request forwarding
- Enables gzip compression
- Sets up proper headers for proxying

### `.ebextensions/environment.config`
- Sets environment variables
- Configures CloudWatch logging

### `.platform/hooks/postdeploy/01_build_frontend.sh`
- Builds the React frontend after deployment

### `.platform/confighooks/predeploy/01_install_deps.sh`
- Installs dependencies and builds the backend before deployment

### `Procfile`
- Specifies how to start the application

## Environment Variables

Create a `.env.production` file with the following variables:

```env
NODE_ENV=production
PORT=8081
AWS_REGION=ap-southeast-2
AWS_COGNITO_USER_POOL_ID=your-user-pool-id
AWS_COGNITO_CLIENT_ID=your-client-id
DYNAMODB_TABLE_RIDDLES=riddles
DYNAMODB_TABLE_PLAYER_PROGRESS=player-progress
```

Then set them in EB:
```bash
eb setenv $(cat .env.production | tr '\n' ',')
```

## Troubleshooting

### 1. Deployment Fails
```bash
# Check logs
eb logs

# SSH into instance for debugging
eb ssh
```

### 2. Application Not Starting
```bash
# Check if Node.js is installed correctly
eb ssh
node --version
npm --version
```

### 3. Port Already in Use
The application runs on port 8081 internally. Nginx proxies requests from port 80.

### 4. Environment Variables Not Set
```bash
# Verify environment variables
eb printenv

# Update specific variable
eb setenv VARIABLE_NAME=value
```

## Scaling

### Auto-scaling Configuration
```bash
# Update environment to enable auto-scaling
eb scale 2  # Minimum 2 instances
```

### Update Instance Type
```bash
eb scale --instance-type t3.small
```

## Monitoring

### View Metrics
```bash
# Open AWS Console
eb open

# Or use AWS CLI
aws elasticbeanstalk describe-environment-resources --environment-name riddlers-cipher-env
```

### CloudWatch Logs
Logs are automatically sent to CloudWatch. View them:
```bash
aws logs tail /aws/elasticbeanstalk/riddlers-cipher-env/var/log/eb-activity.log --follow
```

## Cleanup

To terminate the environment:
```bash
eb terminate riddlers-cipher-env
```

## Additional Resources

- [AWS Elastic Beanstalk Documentation](https://docs.aws.amazon.com/elasticbeanstalk/)
- [EB CLI Reference](https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/eb-cli3.html)
- [Node.js on Elastic Beanstalk](https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/create-deploy-nodejs.html)

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review EB logs: `eb logs`
3. Check AWS Elastic Beanstalk console for error messages
4. Consult AWS documentation
