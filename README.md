<h1 align="center">🚀 GitHub Actions → AWS ECS Deployment Pipeline</h1>

<p align="center">
  <img src="https://img.shields.io/badge/pipeline-passing-brightgreen"/>
  <img src="https://img.shields.io/badge/AWS-ECS%20Fargate-orange"/>
  <img src="https://img.shields.io/badge/Auth-OIDC-blue"/>
  <img src="https://img.shields.io/badge/Container-Docker-blue"/>
  <img src="https://img.shields.io/badge/IaC-Terraform-7B42BC"/>
</p>

> **Zero-touch, production-grade CI/CD pipeline using GitHub Actions OIDC + Amazon ECS Fargate. No stored secrets. No manual deployments. Just push and ship.**

---

## 🏆 Key Achievements

- ✅ Eliminated all long-lived AWS credentials using **OIDC (Zero Secrets Architecture)**
- ✅ Reduced deployment time to **under 3 minutes** from `git push` to live container
- ✅ Implemented **self-healing ECS service** — crashed containers restart automatically
- ✅ Designed a **One-Click Teardown Script** to prevent ghost resource billing
- ✅ Full **CloudWatch observability** with 30-day log retention policy

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
- [Lessons Learned](#lessons-learned--engineering-insights)
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

📖 **Read the full write-up on Medium:** [How I Built a Production-Grade AWS ECS Deployment Pipeline With Zero Stored Secrets](https://medium.com/@RealKingHubs/how-i-built-a-production-grade-aws-ecs-deployment-pipeline-with-zero-stored-secrets-1f8b4c70afbe)

---

## Architecture

<img width="1281" height="832" alt="image_7cf048c0" src="https://github.com/user-attachments/assets/2e1f5926-37c7-4efb-9e56-f1aac10b9db8" />
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

## Lessons Learned & Engineering Insights

### 1. Security: The "Zero-Trust" Shift
**The Challenge:** Storing `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` in GitHub Secrets is a major security risk.

**The Solution:** Implemented **IAM OIDC**. By establishing a trust relationship between GitHub and AWS, the pipeline requests short-lived temporary tokens instead.

**Takeaway:** Credentials should never be static. **"Identity over Secrets"** is the production standard for modern DevOps.

### 2. Infrastructure: Serverless Containerization
**The Challenge:** Managing EC2 instances for a simple REST API adds unnecessary overhead.

**The Solution:** Leveraged **AWS ECS Fargate** — serverless containers where I only define CPU/Memory at the task level.

**Takeaway:** Moving from "Instance-managed" to "Task-managed" infrastructure reduces operational toil significantly.

### 3. Automation: Reducing the Feedback Loop
**The Challenge:** Manual deployments are slow and prone to human error.

**The Solution:** Every `git push` triggers a build, a push to ECR, and a rolling update in ECS automatically.

**Takeaway:** Reducing deployment time to **under 3 minutes** drastically improves developer productivity.

### 4. Cloud Economics: Resource Lifecycle Management
**The Challenge:** Cloud costs spiral if idle resources are left running.

**The Solution:** Built a **One-Click Teardown Script** to automate deletion of all AWS resources used in the project.

**Takeaway:** Being a Cloud Engineer means thinking about **cost-effective architecture** at every stage.

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
CICD-Automation-Pipeline/
├── app.js                               # Node.js application
├── package.json                         # Dependencies
├── Dockerfile                           # Container definition
├── task-definition.json                 # ECS task blueprint
├── github-actions-trust-policy.json     # IAM OIDC trust policy
├── github-actions-permissions.json      # IAM permissions policy
├── screenshots/                         # Architecture diagrams
└── .github/
    └── workflows/
        └── deploy.yml                   # CI/CD pipeline definition
```

---

## Cost Estimate

| Resource | Monthly Cost |
|----------|-------------|
| Fargate (0.25 vCPU, 0.5GB, 24/7) | ~$9.00 |
| ECR Storage (~500MB) | ~$0.05 |
| CloudWatch Logs | ~$0.50 |
| **Total** | **~$9.55/month** |

> 💡 Scale to `desired-count 0` when not in use — brings cost to near **$0**

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

---

<p align="center">Built by <a href="https://www.linkedin.com/in/kingsley-odo-8b81a6369/">Odo Kingsley Uchenna</a></p>
