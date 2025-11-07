#!/bin/bash
# Script to build and push frontend Docker image to AWS ECR
# Run this from your local machine (Windows users: use Git Bash or WSL)

set -e

# Configuration - UPDATE THESE VALUES
AWS_ACCOUNT_ID="your-aws-account-id"
AWS_REGION="ap-south-1"
ECR_REPO_NAME="tracking-hub-frontend"
IMAGE_TAG="latest"

# Full image name
ECR_IMAGE="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO_NAME}:${IMAGE_TAG}"

echo "=========================================="
echo "Building and pushing to AWS ECR"
echo "Image: ${ECR_IMAGE}"
echo "=========================================="

# Step 1: Create ECR repository if it doesn't exist
echo "Creating ECR repository (if it doesn't exist)..."
aws ecr describe-repositories --repository-names ${ECR_REPO_NAME} --region ${AWS_REGION} 2>/dev/null || \
    aws ecr create-repository --repository-name ${ECR_REPO_NAME} --region ${AWS_REGION}

# Step 2: Authenticate Docker to ECR
echo "Logging in to ECR..."
aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com

# Step 3: Build the Docker image
echo "Building Docker image..."
docker build -t ${ECR_REPO_NAME}:${IMAGE_TAG} .

# Step 4: Tag the image for ECR
echo "Tagging image for ECR..."
docker tag ${ECR_REPO_NAME}:${IMAGE_TAG} ${ECR_IMAGE}

# Step 5: Push to ECR
echo "Pushing image to ECR..."
docker push ${ECR_IMAGE}

echo "=========================================="
echo "✓ Successfully pushed to ECR!"
echo "Image: ${ECR_IMAGE}"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. SSH to your EC2 instance"
echo "2. Run: export AWS_ACCOUNT_ID=${AWS_ACCOUNT_ID}"
echo "3. Run: export AWS_REGION=${AWS_REGION}"
echo "4. Run: aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
echo "5. Run: docker-compose pull"
echo "6. Run: docker-compose up -d"
