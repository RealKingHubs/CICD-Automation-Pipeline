# 🚀 GitHub Actions → AWS ECS Deployment Pipeline

> **Zero-touch, production-grade CI/CD pipeline using GitHub Actions OIDC + Amazon ECS Fargate**

![Pipeline Status](https://img.shields.io/badge/pipeline-passing-brightgreen) ![AWS](https://img.shields.io/badge/AWS-ECS%20Fargate-orange) ![Auth](https://img.shields.io/badge/Auth-OIDC-blue) ![IaC](https://img.shields.io/badge/Container-Docker-blue)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Project Structure](#project-structure)
- [Phase 1 — App & Local Setup](#phase-1--app--local-setup)
- [Phase 2 — ECR Setup](#phase-2--ecr-setup)
- [Phase 3 — ECS Cluster & Service](#phase-3--ecs-cluster--service)
- [Phase 4 — GitHub Actions Pipeline](#phase-4--github-actions-pipeline)
- [Phase 5 — Verification & Monitoring](#phase-5--verification--monitoring)
- [Cost Estimate](#cost-estimate)
- [Troubleshooting](#troubleshooting)

---

## Overview

This project demonstrates a **fully automated, secure CI/CD pipeline** that:

- Authenticates to AWS using **OIDC** (no stored secrets, no access keys)
- Builds and pushes Docker images to **Amazon ECR**
- Deploys containerized apps to **Amazon ECS Fargate** (serverless containers)
- Logs everything to **CloudWatch**
- **Self-heals** — if a container crashes, ECS restarts it automatically

---

## Architecture
<img width="1155" height="758" alt="Screenshot 2026-03-07 214427" src="https://github.com/user-attachments/assets/f8443f07-865f-43b3-a23d-6aa6919f4c92" />

```
git push origin main
        │
        ▼
GitHub Actions (OIDC Auth — no secrets)
        │
        ├─── Build Docker Image
        ├─── Push to Amazon ECR
        ├─── Update ECS Task Definition
        └─── Deploy to ECS Fargate (zero downtime)
                │
                ├─── CloudWatch Logs
                └─── Self-healing Service
```

---

## Prerequisites

| Tool | Version | Check |
|------|---------|-------|
| AWS CLI | v2.x | `aws --version` |
| Docker | v24.x+ | `docker --version` |
| GitHub Account | — | repo with Actions enabled |
| AWS Account | — | admin access |

---

## Project Structure

```
my-app/
├── app.js                        # Node.js application
├── package.json                  # Dependencies
├── Dockerfile                    # Container definition
├── task-definition.json          # ECS task blueprint
├── github-actions-trust-policy.json     # IAM OIDC trust policy
├── github-actions-permissions.json      # IAM permissions policy
└── .github/
    └── workflows/
        └── deploy.yml            # CI/CD pipeline
```

---

## Phase 1 — App & Local Setup

### 1. Create the Application

**app.js**
```javascript
const http = require('http');
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    message: 'Hello from ECS! 🚀',
    version: process.env.APP_VERSION || '1.0.0'
  }));
});
server.listen(3000, () => console.log('Server running on port 3000'));
```

**Dockerfile**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3000
CMD ["node", "app.js"]
```

### 2. Configure AWS CLI

```bash
aws configure
aws sts get-caller-identity   # Save the Account ID from output
```

### 3. Test Locally

```bash
docker build -t my-app .
docker run -p 3000:3000 my-app
curl http://localhost:3000
```

---

## Phase 2 — ECR Setup

### 1. Create ECR Repository

```bash
aws ecr create-repository \
  --repository-name my-app \
  --region us-east-1 \
  --image-scanning-configuration scanOnPush=true \
  --image-tag-mutability IMMUTABLE
```

> 📌 Save the `repositoryUri` from the output

### 2. Authenticate Docker to ECR

```bash
aws ecr get-login-password --region us-east-1 \
  | docker login \
    --username AWS \
    --password-stdin \
    YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com
```

### 3. Push Initial Image

```bash
docker build -t my-app .
docker tag my-app:latest YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/my-app:v1.0.0
docker push YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/my-app:v1.0.0
```

### 4. Set Lifecycle Policy (keep last 10 images)

```bash
aws ecr put-lifecycle-policy \
  --repository-name my-app \
  --lifecycle-policy-text '{"rules":[{"rulePriority":1,"description":"Keep last 10","selection":{"tagStatus":"any","countType":"imageCountMoreThan","countNumber":10},"action":{"type":"expire"}}]}'
```

---

## Phase 3 — ECS Cluster & Service

### 1. Create Cluster

```bash
aws ecs create-cluster \
  --cluster-name my-app-cluster \
  --capacity-providers FARGATE \
  --region us-east-1
```

### 2. Create CloudWatch Log Group

```bash
aws logs create-log-group --log-group-name /ecs/my-app --region us-east-1
aws logs put-retention-policy --log-group-name /ecs/my-app --retention-in-days 30
```

### 3. Create Task Execution Role

```bash
aws iam create-role \
  --role-name ecs-task-execution-role \
  --assume-role-policy-document '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"ecs-tasks.amazonaws.com"},"Action":"sts:AssumeRole"}]}'

aws iam attach-role-policy \
  --role-name ecs-task-execution-role \
  --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy
```

### 4. Register Task Definition

Create `task-definition.json` (replace `YOUR_ACCOUNT_ID`):
```json
{
  "family": "my-app",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256", "memory": "512",
  "executionRoleArn": "arn:aws:iam::YOUR_ACCOUNT_ID:role/ecs-task-execution-role",
  "containerDefinitions": [{
    "name": "my-app",
    "image": "YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/my-app:v1.0.0",
    "essential": true,
    "portMappings": [{ "containerPort": 3000, "protocol": "tcp" }],
    "logConfiguration": {
      "logDriver": "awslogs",
      "options": {
        "awslogs-group": "/ecs/my-app",
        "awslogs-region": "us-east-1",
        "awslogs-stream-prefix": "ecs"
      }
    }
  }]
}
```

```bash
aws ecs register-task-definition --cli-input-json file://task-definition.json --region us-east-1
```

### 5. Create ECS Service

```bash
# Get VPC and subnet IDs first
aws ec2 describe-vpcs --filters Name=isDefault,Values=true --query 'Vpcs[0].VpcId' --output text
aws ec2 describe-subnets --filters Name=vpc-id,Values=YOUR_VPC_ID --query 'Subnets[*].SubnetId' --output text

# Create security group
aws ec2 create-security-group --group-name my-app-sg --description "ECS tasks SG" --vpc-id YOUR_VPC_ID
aws ec2 authorize-security-group-ingress --group-id YOUR_SG_ID --protocol tcp --port 3000 --cidr 0.0.0.0/0

# Create service
aws ecs create-service \
  --cluster my-app-cluster \
  --service-name my-app-service \
  --task-definition my-app \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[SUBNET1,SUBNET2],securityGroups=[SG_ID],assignPublicIp=ENABLED}" \
  --region us-east-1
```

---

## Phase 4 — GitHub Actions Pipeline

### 1. Create OIDC Provider

```bash
aws iam create-open-id-connect-provider \
  --url https://token.actions.githubusercontent.com \
  --client-id-list sts.amazonaws.com \
  --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1
```

### 2. Create IAM Role for GitHub Actions

Save `github-actions-trust-policy.json` (replace placeholders), then:

```bash
aws iam create-role --role-name github-actions-deploy \
  --assume-role-policy-document file://github-actions-trust-policy.json

aws iam create-policy --policy-name github-actions-deploy-policy \
  --policy-document file://github-actions-permissions.json

aws iam attach-role-policy --role-name github-actions-deploy \
  --policy-arn arn:aws:iam::YOUR_ACCOUNT_ID:policy/github-actions-deploy-policy
```

### 3. Add GitHub Repository Variables

In GitHub → Settings → Secrets and variables → Actions → Variables:

| Variable | Value |
|----------|-------|
| `AWS_ACCOUNT_ID` | Your AWS account ID |
| `AWS_REGION` | `us-east-1` |
| `ECR_REPOSITORY` | `my-app` |
| `ECS_CLUSTER` | `my-app-cluster` |
| `ECS_SERVICE` | `my-app-service` |
| `CONTAINER_NAME` | `my-app` |

### 4. Add Workflow File

Create `.github/workflows/deploy.yml` — see full file in repo.

### 5. Trigger Pipeline

```bash
git add .
git commit -m "feat: add CI/CD pipeline"
git push origin main
```

---

## Phase 5 — Verification & Monitoring

### Check Service Health

```bash
aws ecs describe-services \
  --cluster my-app-cluster \
  --services my-app-service \
  --region us-east-1 \
  --query 'services[0].{Status:status,Running:runningCount,Desired:desiredCount}'
```

### Tail Live Logs

```bash
aws logs tail /ecs/my-app --follow --region us-east-1
```

### Get App Public IP

```bash
TASK_ARN=$(aws ecs list-tasks --cluster my-app-cluster --service-name my-app-service --query 'taskArns[0]' --output text --region us-east-1)
ENI_ID=$(aws ecs describe-tasks --cluster my-app-cluster --tasks $TASK_ARN --query 'tasks[0].attachments[0].details[?name==`networkInterfaceId`].value' --output text --region us-east-1)
PUBLIC_IP=$(aws ec2 describe-network-interfaces --network-interface-ids $ENI_ID --query 'NetworkInterfaces[0].Association.PublicIp' --output text --region us-east-1)
curl http://$PUBLIC_IP:3000
```

### Scale Down (Save Money While Learning)

```bash
aws ecs update-service --cluster my-app-cluster --service my-app-service --desired-count 0 --region us-east-1
```
###  Scale back up (when you need it)

```bash
aws ecs update-service --cluster my-app-cluster --service my-app-service --desired-count 1 --region us-east-1
```
---

## Cost Estimate

| Resource | Monthly Cost |
|----------|-------------|
| Fargate (0.25 vCPU, 0.5GB, 24/7) | ~$9.00 |
| ECR Storage (~500MB) | ~$0.05 |
| CloudWatch Logs | ~$0.50 |
| **Total** | **~$9.55/month** |

> 💡 Scale to `desired-count 0` when not using — brings cost to near $0

---

## Troubleshooting

| Problem | Cause | Fix |
|---------|-------|-----|
| OIDC auth fails | Wrong repo name in trust policy | Check `sub` condition matches `org/repo` exactly |
| Image pull fails | ECR permissions missing | Verify `ecs-task-execution-role` has ECR policy |
| Task keeps stopping | App crash or health check fail | Check CloudWatch logs at `/ecs/my-app` |
| Service won't stabilize | Wrong subnet/SG config | Verify `assignPublicIp=ENABLED` and port 3000 open |
| `iam:PassRole` error | Missing PassRole permission | Add `iam:PassRole` for `ecs-task-execution-role` to GitHub Actions policy |

---

## License

MIT — feel free to use this as a template for your own projects.
