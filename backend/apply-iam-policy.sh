#!/bin/bash

# Apply IAM policy for deployment permissions

set -e

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
IAM_USER_NAME="CognitoBackendUser"
POLICY_NAME="GothamCipherDeploymentPolicy"
POLICY_FILE="iam-deployment-policy.json"

echo "🔐 Applying IAM Policy for Deployment"
echo "======================================"
echo "Account ID: $ACCOUNT_ID"
echo "IAM User: $IAM_USER_NAME"
echo "Policy Name: $POLICY_NAME"
echo ""

# Create the policy
echo "📝 Creating IAM policy..."
POLICY_ARN=$(aws iam create-policy \
  --policy-name "$POLICY_NAME" \
  --policy-document file://"$POLICY_FILE" \
  --query 'Policy.Arn' \
  --output text 2>/dev/null || \
  aws iam get-policy \
    --policy-arn "arn:aws:iam::${ACCOUNT_ID}:policy/${POLICY_NAME}" \
    --query 'Policy.Arn' \
    --output text)

if [ -z "$POLICY_ARN" ]; then
    echo "❌ Failed to create/get policy"
    exit 1
fi

echo "✅ Policy ARN: $POLICY_ARN"
echo ""

# Attach policy to user
echo "🔗 Attaching policy to IAM user '$IAM_USER_NAME'..."
aws iam attach-user-policy \
  --user-name "$IAM_USER_NAME" \
  --policy-arn "$POLICY_ARN"

echo "✅ Policy attached successfully!"
echo ""
echo "⏳ Waiting 5 seconds for IAM changes to propagate..."
sleep 5

echo ""
echo "🎉 Done! You can now run the deployment script:"
echo "   ./deploy-step-functions.sh"
