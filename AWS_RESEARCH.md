# Halfterm — AWS Research Spike

## Overview

This document covers what an AWS migration would look like for Halfterm,
when to do it, what it would cost, and what to do now to prepare.

**Current state:** Railway (Hobby plan, ~$5-10/month)
**Target state:** AWS (when database is needed, v4.2.0)

---

## Why migrate to AWS?

Railway is excellent for early-stage projects but has limitations:

- **No uptime SLA** — Railway doesn't guarantee availability
- **Limited database options** — no managed PostgreSQL on Hobby plan
- **No fine-grained control** — can't configure memory, CPU, networking precisely
- **Scaling limits** — Hobby plan isn't designed for production traffic
- **CV/portfolio** — AWS experience is far more valuable to employers than Railway

AWS makes sense when you need:
- A managed PostgreSQL database (v4.2.0)
- Higher reliability guarantees
- More control over infrastructure
- To demonstrate AWS skills for job applications

---

## AWS Services Halfterm Would Use

### Compute
**AWS ECS (Elastic Container Service) + Fargate**
- Runs Docker containers without managing servers
- Fargate = serverless containers — you pay per task, not per server
- Already have Dockerfiles for frontend and backend
- This is what we had briefly set up earlier in the project

**Alternative: AWS App Runner**
- Even simpler than ECS — just point at a container image
- Less control but easier to set up
- Good stepping stone before full ECS

### Database
**AWS RDS (Relational Database Service) — PostgreSQL**
- Managed PostgreSQL — backups, patches, failover handled by AWS
- This is the main reason to move to AWS (Railway has no managed DB on Hobby)
- `db.t3.micro` (free tier eligible): ~$15-20/month after free tier
- Includes automated backups and point-in-time recovery

### Container Registry
**AWS ECR (Elastic Container Registry)**
- Stores Docker images for frontend and backend
- ~$0.10/GB/month — essentially free at Halfterm's scale
- Already used this during the earlier AWS ECS setup

### Load Balancer
**AWS ALB (Application Load Balancer)**
- Routes traffic to frontend and backend containers
- Handles SSL termination (HTTPS)
- ~$16/month minimum
- Required for production ECS setup

### Secrets Management
**AWS Secrets Manager**
- Stores API keys (Anthropic, Google Places, Ticketmaster etc)
- Much more secure than Railway environment variables
- ~$0.40/secret/month — about $5/month for all Halfterm secrets
- Rotate secrets automatically

### DNS
**AWS Route 53**
- Manages custom domain (halfterm.co.uk or halfterm.fyi)
- ~$0.50/hosted zone/month + $0.40/million queries
- Effectively free at Halfterm's scale

### CDN (optional, later)
**AWS CloudFront**
- CDN for the React frontend — serves static files from edge locations worldwide
- Makes the frontend load faster globally
- Free tier: 1TB/month data transfer out
- Worth adding once traffic grows

---

## Infrastructure as Code — Terraform

Rather than clicking around in the AWS console, Terraform lets you define
all the above as code. Benefits:

- Reproducible — create identical dev/staging/prod environments
- Version controlled — infrastructure changes tracked in git
- Documented — the code IS the documentation
- Rollback — revert infrastructure changes like code

Example Terraform for Halfterm:
```hcl
# ECS Cluster
resource "aws_ecs_cluster" "halfterm" {
  name = "halfterm"
}

# RDS PostgreSQL
resource "aws_db_instance" "halfterm" {
  engine         = "postgres"
  engine_version = "15"
  instance_class = "db.t3.micro"
  identifier     = "halfterm-db"
  username       = "halfterm"
  password       = var.db_password
  storage_encrypted = true
}
```

---

## Cost Comparison

### Current (Railway)
| Service | Monthly Cost |
|---------|-------------|
| Railway Hobby (frontend + backend) | ~$8-12 |
| **Total** | **~$8-12/month** |

### AWS (estimated)
| Service | Monthly Cost |
|---------|-------------|
| ECS Fargate (2 tasks, small) | ~$15-25 |
| RDS PostgreSQL db.t3.micro | ~$15-20 |
| ALB | ~$16 |
| ECR | ~$1 |
| Secrets Manager (~12 secrets) | ~$5 |
| Route 53 | ~$1 |
| **Total** | **~$53-68/month** |

**AWS is ~5x more expensive** but gives you:
- Managed database
- Higher reliability
- AWS experience for CV
- Better scaling options
- Secrets management

### When does AWS make financial sense?
When you have paying users or need the database for features (favourites,
user accounts, caching) — the database cost is unavoidable and AWS RDS
is the right place for it.

---

## Migration Plan (for v4.2.0)

### Phase 1 — Preparation (do now)
- [x] Docker containers already working
- [x] GitHub Actions CI/CD already working
- [ ] Create AWS account if not already done
- [ ] Install AWS CLI: `brew install awscli`
- [ ] Install Terraform: `brew install terraform`
- [ ] Create IAM user with appropriate permissions

### Phase 2 — Database first
- [ ] Create RDS PostgreSQL instance via Terraform
- [ ] Run initial schema migrations
- [ ] Test database connection from local backend
- [ ] Add database URL to Secrets Manager

### Phase 3 — Move containers to ECS
- [ ] Push Docker images to ECR
- [ ] Create ECS task definitions (frontend + backend)
- [ ] Create ECS services
- [ ] Set up ALB with SSL certificate (AWS Certificate Manager — free)
- [ ] Point custom domain to ALB via Route 53

### Phase 4 — Switch over
- [ ] Run both Railway and AWS in parallel for 1 week
- [ ] Monitor both for errors via LangSmith
- [ ] Switch DNS to AWS when confident
- [ ] Shut down Railway (keep for 1 month as backup)

### Phase 5 — Cleanup
- [ ] Cancel Railway subscription
- [ ] Remove old Railway-specific config
- [ ] Update README with new deployment instructions
- [ ] Update MAINTENANCE.md with AWS-specific checks

---

## What To Do Now

1. **Create an AWS account** if you don't have one
   - Go to https://aws.amazon.com and sign up
   - Add a payment method
   - Enable MFA on the root account immediately

2. **Install tools locally**
   ```bash
   brew install awscli terraform
   aws configure  # enter your AWS access keys
   ```

3. **Don't migrate yet** — Railway is working well and migration adds
   complexity without benefit until you need the database

4. **When starting v4.2.0** — come back to this document and follow
   the migration plan above

---

## AWS for Your CV

Even without migrating, you can demonstrate AWS knowledge by:
- Setting up a small proof-of-concept ECS deployment
- Writing Terraform configs for Halfterm (even if not applied)
- Getting AWS certifications — Cloud Practitioner is achievable in 2-4 weeks

AWS talking points for interviews:
- "I containerised the app with Docker and deployed to AWS ECS/Fargate"
- "I used AWS Secrets Manager for API key management"
- "I wrote Terraform to manage infrastructure as code"
- "I set up RDS PostgreSQL for caching and user data"

---

*Last updated: August 2026*
*Review when starting v4.2.0*
