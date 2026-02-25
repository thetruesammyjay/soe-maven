# AWS Free Tier Deployment Guide

This document provides the exact steps to deploy the Enterprise Patient Management System to AWS Free Tier.

## Architecture

```
[Browser] --> [CloudFront CDN] --> [S3 Bucket (Frontend)]
                                       |
                                       v (API calls)
                              [EC2 / ECS Instance]
                                       |
                          +------------+------------+
                          |            |            |
                    [API Gateway]  [Auth Service]  [Patient Service]
                          |            |            |
                    [Billing]    [Analytics]    [PostgreSQL RDS]
                                       |
                                    [Kafka]
```

## Prerequisites

1. An active AWS Account (Free Tier eligible)
2. AWS CLI installed and configured (`aws configure`)
3. Git and a terminal (bash or PowerShell)

---

## Step 1: One-Command Infrastructure Setup

From the root of your project, run:

```bash
chmod +x deploy/setup-aws.sh
./deploy/setup-aws.sh
```

This script will automatically:
- Deploy an S3 bucket for the frontend
- Create a CloudFront CDN distribution with HTTPS
- Upload the frontend files to S3
- Create ECR repositories for all 5 microservices
- Print the GitHub Secrets you need to configure

---

## Step 2: Configure GitHub Secrets

After the script completes, go to your repository settings:

**https://github.com/thetruesammyjay/soe-maven/settings/secrets/actions**

Add the following secrets (values printed by the setup script):

| Secret Name | Description |
|-------------|-------------|
| `AWS_ACCESS_KEY_ID` | Your IAM Access Key |
| `AWS_SECRET_ACCESS_KEY` | Your IAM Secret Key |
| `AWS_REGION` | e.g., `us-east-1` |
| `S3_BUCKET_NAME` | Printed by the setup script |
| `CLOUDFRONT_DISTRIBUTION_ID` | Printed by the setup script |

---

## Step 3: Automatic Deployments

Once the secrets are configured, the following happens automatically:

- **Push to `frontend/`** --> GitHub Actions syncs files to S3 and invalidates CloudFront cache
- **Push to any service** --> GitHub Actions builds Docker images and pushes them to ECR

---

## Step 4: Accessing the Application

After deployment, your frontend will be accessible at:

```
https://<cloudfront-distribution-id>.cloudfront.net
```

The CloudFront URL is printed by the setup script and shown in the AWS Console under CloudFront Distributions.

---

## Free Tier Coverage

| Service | Free Tier Allowance |
|---------|-------------------|
| S3 | 5 GB storage, 20,000 GET requests/month |
| CloudFront | 1 TB data transfer, 10M requests/month |
| ECR | 500 MB storage/month |
| EC2 | 750 hours t2.micro/month (12 months) |
| RDS | 750 hours db.t3.micro, 20 GB storage (12 months) |
