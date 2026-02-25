#!/bin/bash
# ==============================================
# AWS Free Tier Setup Script
# Enterprise Patient Management System
# ==============================================

set -e

REGION=${AWS_REGION:-us-east-1}
BUCKET_NAME="medflow-frontend-$(date +%s)"
STACK_NAME="medflow-frontend-stack"
ECR_SERVICES=("patient-service" "billing-service" "analytics-service" "auth-service" "api-gateway")

echo ""
echo "=========================================="
echo "  MedFlow AWS Free Tier Deployment Setup  "
echo "=========================================="
echo ""

# ----- Step 1: Verify AWS CLI -----
echo "[1/5] Verifying AWS CLI installation..."
if ! command -v aws &> /dev/null; then
    echo "ERROR: AWS CLI is not installed."
    echo "Install it from: https://aws.amazon.com/cli/"
    exit 1
fi

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text 2>/dev/null)
if [ -z "$ACCOUNT_ID" ]; then
    echo "ERROR: AWS CLI is not configured. Run: aws configure"
    exit 1
fi
echo "  Authenticated as AWS Account: $ACCOUNT_ID"
echo "  Region: $REGION"
echo ""

# ----- Step 2: Deploy Frontend S3 + CloudFront -----
echo "[2/5] Deploying Frontend infrastructure (S3 + CloudFront)..."
aws cloudformation deploy \
    --template-file deploy/frontend-stack.json \
    --stack-name $STACK_NAME \
    --parameter-overrides BucketName=$BUCKET_NAME \
    --region $REGION \
    --no-fail-on-empty-changeset

CLOUDFRONT_URL=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --query "Stacks[0].Outputs[?OutputKey=='CloudFrontURL'].OutputValue" \
    --output text --region $REGION)

DISTRIBUTION_ID=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --query "Stacks[0].Outputs[?OutputKey=='DistributionId'].OutputValue" \
    --output text --region $REGION)

echo "  S3 Bucket: $BUCKET_NAME"
echo "  CloudFront URL: https://$CLOUDFRONT_URL"
echo ""

# ----- Step 3: Upload Frontend -----
echo "[3/5] Uploading frontend files to S3..."
aws s3 sync frontend/ s3://$BUCKET_NAME --delete --region $REGION
echo "  Frontend deployed successfully."
echo ""

# ----- Step 4: Create ECR Repositories -----
echo "[4/5] Creating ECR repositories for backend services..."
for SERVICE in "${ECR_SERVICES[@]}"; do
    aws ecr describe-repositories --repository-names "$SERVICE" --region $REGION 2>/dev/null || \
    aws ecr create-repository --repository-name "$SERVICE" --region $REGION --image-scanning-configuration scanOnPush=true
    echo "  ECR repository ready: $SERVICE"
done
echo ""

# ----- Step 5: Print Summary -----
echo "[5/5] Setup Complete!"
echo ""
echo "=========================================="
echo "  DEPLOYMENT SUMMARY"
echo "=========================================="
echo ""
echo "  Frontend URL:     https://$CLOUDFRONT_URL"
echo "  S3 Bucket:        $BUCKET_NAME"
echo "  Distribution ID:  $DISTRIBUTION_ID"
echo "  ECR Registry:     $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com"
echo ""
echo "  GitHub Secrets Required:"
echo "  -----------------------------------------------"
echo "  AWS_ACCESS_KEY_ID       = <your IAM key>"
echo "  AWS_SECRET_ACCESS_KEY   = <your IAM secret>"
echo "  AWS_REGION              = $REGION"
echo "  S3_BUCKET_NAME          = $BUCKET_NAME"
echo "  CLOUDFRONT_DISTRIBUTION_ID = $DISTRIBUTION_ID"
echo ""
echo "  Add these secrets at:"
echo "  https://github.com/thetruesammyjay/soe-maven/settings/secrets/actions"
echo ""
echo "=========================================="
