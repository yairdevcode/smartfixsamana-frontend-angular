# Deployment Guide

This document provides instructions for deploying SmartFix Samana to AWS EC2 using GitHub Actions CI/CD.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [GitHub Secrets Configuration](#github-secrets-configuration)
4. [EC2 Server Setup](#ec2-server-setup)
5. [Deployment Workflows](#deployment-workflows)
6. [Manual Deployment](#manual-deployment)
7. [Troubleshooting](#troubleshooting)

## Architecture Overview

### CI/CD Pipeline Flow

```
Developer Push → GitHub Actions
    ↓
1. Checkout code
2. Install dependencies (with caching)
3. Run linter
4. Run tests with coverage
5. Build Angular PWA
6. Build Docker image
7. Push to Docker Hub
8. SSH to EC2
9. Pull latest image
10. Restart containers with docker-compose
    ↓
Production/Staging Environment
```

### Container Architecture on EC2

```
EC2 Instance
├── Frontend Container (nginx:80)
│   └── Proxies /api/* → Backend
├── Backend Container (Spring Boot:8080)
│   └── Connects to Database
└── Database Container (MySQL:3306)
```

## Prerequisites

### Required Tools
- Docker Hub account
- AWS EC2 instance (Ubuntu recommended)
- SSH access to EC2 instance
- GitHub repository with Actions enabled

### Required GitHub Secrets

Configure these secrets in: **GitHub Repository → Settings → Secrets and variables → Actions**

## GitHub Secrets Configuration

### Production Secrets

| Secret Name | Description | Example |
|------------|-------------|---------|
| `DOCKER_USERNAME` | Docker Hub username | `myusername` |
| `DOCKER_PASSWORD` | Docker Hub access token | `dckr_pat_...` |
| `EC2_HOST` | EC2 instance IP or hostname | `54.123.45.67` |
| `EC2_USERNAME` | SSH username for EC2 | `ubuntu` |
| `EC2_SSH_KEY` | Private SSH key for EC2 access | `-----BEGIN RSA PRIVATE KEY-----...` |

### Staging Secrets (Optional)

| Secret Name | Description |
|------------|-------------|
| `EC2_STAGING_HOST` | Staging EC2 instance IP |

### How to Generate Docker Hub Access Token

1. Log in to [Docker Hub](https://hub.docker.com/)
2. Go to **Account Settings → Security → New Access Token**
3. Create token with Read & Write permissions
4. Copy and save as `DOCKER_PASSWORD` secret

### How to Generate SSH Key for EC2

```bash
# On your local machine
ssh-keygen -t rsa -b 4096 -C "github-actions-deploy"

# Copy public key to EC2
ssh-copy-id -i ~/.ssh/id_rsa.pub ubuntu@your-ec2-ip

# Copy private key content to GitHub secret
cat ~/.ssh/id_rsa
```

## EC2 Server Setup

### 1. Install Docker and Docker Compose

```bash
# Connect to EC2
ssh ubuntu@your-ec2-ip

# Update system
sudo apt-get update
sudo apt-get upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker ubuntu

# Install Docker Compose
sudo apt-get install docker-compose-plugin -y

# Verify installations
docker --version
docker compose version
```

### 2. Create Project Directory

```bash
# Create production directory
mkdir -p /home/ubuntu/smartfix-samana
cd /home/ubuntu/smartfix-samana

# Create staging directory (optional)
mkdir -p /home/ubuntu/smartfix-samana-staging
```

### 3. Setup Environment Variables

```bash
cd /home/ubuntu/smartfix-samana

# Copy the example env file from this repository
nano .env

# Fill in the values (see .env.ec2.example)
```

### 4. Create docker-compose.yml

```bash
# Copy docker-compose.example.yml from this repository
nano docker-compose.yml

# Update the configuration as needed
```

### 5. Configure Firewall (Security Groups)

In AWS Console, configure EC2 Security Group:

| Type | Port | Source | Description |
|------|------|--------|-------------|
| SSH | 22 | Your IP | SSH access |
| HTTP | 80 | 0.0.0.0/0 | Frontend |
| HTTPS | 443 | 0.0.0.0/0 | Frontend (SSL) |
| Custom | 8080 | VPC CIDR | Backend API |
| Custom | 3306 | VPC CIDR | MySQL |

## Deployment Workflows

### 1. Production Deployment (`deploy-frontend.yml`)

**Triggers:**
- Push to `main` or `master` branch

**Features:**
- ✅ Full test suite with coverage
- ✅ Production build
- ✅ Docker build caching
- ✅ Automated deployment to EC2
- ✅ Health checks
- ✅ Deployment verification

**Usage:**
```bash
git push origin main
# Automatically triggers deployment
```

### 2. Staging Deployment (`deploy-staging.yml`)

**Triggers:**
- Push to `develop` or `staging` branch
- Manual workflow dispatch

**Features:**
- ✅ Development build
- ✅ Tests (non-blocking)
- ✅ Deploy to staging environment

**Manual Trigger:**
```
GitHub → Actions → Deploy to Staging → Run workflow
```

### 3. Pull Request Checks (`pr-checks.yml`)

**Triggers:**
- Pull requests to `main`, `master`, `develop`, `staging`

**Features:**
- ✅ Lint and test
- ✅ Build verification (both dev & prod)
- ✅ Docker build check (no push)
- ✅ Security audit
- ✅ Bundle size reporting

**No deployment** - only validation

## Manual Deployment

### Deploy from Local Machine

```bash
# 1. Build the Docker image
docker build -t yourusername/smartfix-samana:ss-frontend .

# 2. Push to Docker Hub
docker push yourusername/smartfix-samana:ss-frontend

# 3. SSH to EC2 and deploy
ssh ubuntu@your-ec2-ip
cd /home/ubuntu/smartfix-samana
docker pull yourusername/smartfix-samana:ss-frontend
docker-compose down
docker-compose up -d
```

### Rollback to Previous Version

```bash
# SSH to EC2
ssh ubuntu@your-ec2-ip
cd /home/ubuntu/smartfix-samana

# Pull specific version by commit SHA
docker pull yourusername/smartfix-samana:ss-frontend-<commit-sha>

# Update docker-compose.yml to use specific tag
nano docker-compose.yml
# Change: image: yourusername/smartfix-samana:ss-frontend-<commit-sha>

# Restart
docker-compose down
docker-compose up -d
```

## Monitoring and Logs

### View Container Logs

```bash
# SSH to EC2
ssh ubuntu@your-ec2-ip
cd /home/ubuntu/smartfix-samana

# View all logs
docker-compose logs -f

# View specific service
docker-compose logs -f frontend
docker-compose logs -f app_smartfixsamana
docker-compose logs -f db

# View last 100 lines
docker-compose logs --tail=100 frontend
```

### Check Container Status

```bash
# Check running containers
docker-compose ps

# Check container health
docker ps --format "table {{.Names}}\t{{.Status}}"
```

## Troubleshooting

### Issue: Build Fails in GitHub Actions

**Solution:**
```bash
# Check workflow logs in GitHub Actions
# Common issues:
# 1. npm ci fails → delete package-lock.json and regenerate
# 2. Tests fail → check test configuration in karma.conf.js
# 3. Build fails → check angular.json configuration
```

### Issue: Docker Push Failed

**Solution:**
- Verify `DOCKER_USERNAME` and `DOCKER_PASSWORD` secrets
- Check Docker Hub access token has write permissions
- Verify repository exists in Docker Hub

### Issue: SSH Connection Failed

**Solution:**
```bash
# Test SSH connection manually
ssh -i ~/.ssh/id_rsa ubuntu@your-ec2-ip

# Verify EC2_SSH_KEY secret contains complete private key
# Ensure EC2 Security Group allows SSH from GitHub Actions IPs
```

### Issue: Containers Won't Start

**Solution:**
```bash
# SSH to EC2 and check logs
docker-compose logs

# Check port conflicts
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :8080

# Restart Docker daemon
sudo systemctl restart docker
```

### Issue: Frontend Can't Connect to Backend

**Solution:**
```bash
# Check nginx configuration
docker exec smartfix-frontend cat /etc/nginx/conf.d/default.conf

# Verify backend container name matches nginx proxy_pass
docker-compose ps

# Check Docker network
docker network inspect smartfix-samana_smartfix-network
```

## Performance Optimization

### Enable Docker Layer Caching

The workflows use Docker BuildKit caching:
```yaml
cache-from: type=registry,ref=${{ env.DOCKER_IMAGE }}:buildcache
cache-to: type=registry,ref=${{ env.DOCKER_IMAGE }}:buildcache,mode=max
```

This reduces build times by ~50-70%.

### npm Caching

Node modules are cached between workflow runs:
```yaml
- uses: actions/cache@v3
  with:
    path: ~/.npm
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
```

## Security Best Practices

1. **Never commit secrets** to the repository
2. **Rotate SSH keys** regularly
3. **Use Docker Hub access tokens** instead of passwords
4. **Enable AWS Security Groups** with minimal ports
5. **Keep Docker images updated** for security patches
6. **Use HTTPS** with SSL certificates (Let's Encrypt)
7. **Enable firewall** on EC2: `sudo ufw enable`

## SSL/HTTPS Setup (Optional)

```bash
# Install Certbot on EC2
sudo apt-get install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com

# Auto-renewal
sudo certbot renew --dry-run
```

## Backup Strategy

```bash
# Backup database
docker exec smartfix-db mysqldump -u root -p smartfix_db > backup.sql

# Backup volumes
docker run --rm -v smartfix-samana_db_data:/data -v $(pwd):/backup ubuntu tar czf /backup/db-backup.tar.gz /data
```

## Support

For issues or questions:
- Check GitHub Actions logs
- Review container logs on EC2
- Verify all secrets are configured correctly
- Ensure EC2 has sufficient resources (disk space, memory)
