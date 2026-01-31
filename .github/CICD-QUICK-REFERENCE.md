# CI/CD Quick Reference Card

## 🚀 Common Workflows

### Deploy to Production
```bash
# Commit your changes
git add .
git commit -m "Your commit message"

# Push to main branch
git push origin main

# ✅ Deployment starts automatically
# View progress: GitHub → Actions → Deploy Angular to EC2
```

### Deploy to Staging
```bash
# Push to staging branch
git push origin staging

# OR manually trigger:
# GitHub → Actions → Deploy to Staging → Run workflow
```

### Create a Pull Request
```bash
# Create feature branch
git checkout -b feature/my-feature

# Make changes and commit
git add .
git commit -m "Add new feature"

# Push branch
git push origin feature/my-feature

# Create PR on GitHub
# ✅ PR checks run automatically
```

## 📋 Workflow Status Checks

| Workflow | What It Does | When It Runs |
|----------|--------------|--------------|
| **PR Checks** | Tests, builds, validates | On every PR |
| **Staging Deploy** | Deploys to staging | Push to `staging`/`develop` |
| **Production Deploy** | Deploys to production | Push to `main`/`master` |

## 🔍 View Workflow Results

```
GitHub Repository
  └─ Actions tab
      └─ Click on workflow run
          └─ Click on job name
              └─ View detailed logs
```

## 🛠️ Local Testing Before Push

```bash
# Run tests
npm test -- --watch=false --browsers=ChromeHeadless

# Run linter
npm run ng lint

# Build production
npm run build -- --configuration production

# Build development
npm run build -- --configuration development

# Check bundle size
du -sh dist/smartfix-samana/browser/
```

## 🐛 Troubleshooting

### Build Failed in GitHub Actions

1. **Check the logs**:
   - GitHub → Actions → Failed workflow → View logs

2. **Common fixes**:
   ```bash
   # Update dependencies
   npm ci

   # Fix audit issues
   npm audit fix

   # Test locally first
   npm test
   npm run build
   ```

### Deployment Failed

1. **Check deployment logs** in GitHub Actions

2. **SSH to EC2 and investigate**:
   ```bash
   ssh ubuntu@your-ec2-ip
   cd /home/ubuntu/smartfix-samana
   docker-compose logs -f
   docker-compose ps
   ```

3. **Common fixes on EC2**:
   ```bash
   # Pull latest image manually
   docker pull username/smartfix-samana:ss-frontend

   # Restart containers
   docker-compose down
   docker-compose up -d

   # Clean up disk space
   docker system prune -f

   # Check disk space
   df -h
   ```

### Tests Failed

```bash
# Run tests locally with detailed output
npm test -- --watch=false --browsers=ChromeHeadless --code-coverage

# Update snapshots if needed
npm test -- --watch=false --browsers=ChromeHeadless --updateSnapshots

# Fix linting issues
npm run ng lint -- --fix
```

## 🔐 Managing Secrets

### View/Update GitHub Secrets
```
Repository → Settings → Secrets and variables → Actions
```

### Required Secrets Checklist
- ✅ `DOCKER_USERNAME`
- ✅ `DOCKER_PASSWORD`
- ✅ `EC2_HOST`
- ✅ `EC2_USERNAME`
- ✅ `EC2_SSH_KEY`
- ⚪ `EC2_STAGING_HOST` (optional)

## 📦 Docker Commands

### Build and Test Locally
```bash
# Build Docker image
docker build -t smartfix-test .

# Run container locally
docker run -p 80:80 smartfix-test

# Test in browser
open http://localhost
```

### Push to Docker Hub
```bash
# Login
docker login

# Tag image
docker tag smartfix-test username/smartfix-samana:ss-frontend

# Push
docker push username/smartfix-samana:ss-frontend
```

## 🔄 Rollback

### Option 1: Revert Commit
```bash
# Find commit to revert
git log --oneline

# Revert commit
git revert <commit-hash>

# Push (triggers new deployment)
git push origin main
```

### Option 2: Manual Rollback on EC2
```bash
# SSH to EC2
ssh ubuntu@your-ec2-ip
cd /home/ubuntu/smartfix-samana

# Pull specific version
docker pull username/smartfix-samana:ss-frontend-<commit-sha>

# Update docker-compose.yml
nano docker-compose.yml
# Change image tag to: ss-frontend-<commit-sha>

# Restart
docker-compose down
docker-compose up -d
```

## 📊 Monitoring

### Check Deployment Status
```bash
# SSH to EC2
ssh ubuntu@your-ec2-ip

# Check container status
docker-compose ps

# View logs
docker-compose logs -f frontend
docker-compose logs -f app_smartfixsamana
docker-compose logs -f db

# Check health
curl http://localhost:80
```

### Resource Usage
```bash
# Disk space
df -h

# Container resource usage
docker stats

# Clean up old images
docker system prune -af
```

## 🎯 Best Practices

### Before Pushing Code
```bash
# 1. Test locally
npm test

# 2. Build successfully
npm run build

# 3. Commit with clear message
git commit -m "feat: add user authentication"

# 4. Push to feature branch first
git push origin feature/auth

# 5. Create PR for review
# 6. Merge after PR checks pass
```

### Commit Message Format
```
feat: add new feature
fix: fix bug in login
docs: update README
style: format code
refactor: restructure auth module
test: add unit tests
chore: update dependencies
```

### Branch Strategy
```
main/master     → Production (auto-deploy)
develop/staging → Staging (auto-deploy)
feature/*       → Development (PR checks only)
bugfix/*        → Bug fixes (PR checks only)
hotfix/*        → Urgent fixes (PR checks, fast-track to main)
```

## 📱 Quick Commands Cheatsheet

```bash
# Development
npm start                    # Start dev server
npm test                     # Run tests
npm run build               # Build production

# Git workflow
git checkout -b feature/name # Create branch
git add .                    # Stage changes
git commit -m "message"      # Commit
git push origin branch-name  # Push

# Docker
docker build -t name .       # Build image
docker-compose up -d         # Start containers
docker-compose down          # Stop containers
docker-compose logs -f       # View logs
docker system prune -f       # Clean up

# EC2
ssh ubuntu@ec2-ip           # Connect to EC2
docker-compose ps           # Check status
docker-compose restart      # Restart all
```

## 🆘 Emergency Procedures

### Production is Down

1. **Check GitHub Actions** - Is deployment running?
2. **SSH to EC2** - Check container status
3. **View logs** - `docker-compose logs -f`
4. **Quick restart** - `docker-compose restart`
5. **If still failing** - Rollback to previous version
6. **Notify team** - Update status page

### Need to Deploy Hotfix

```bash
# Create hotfix branch from main
git checkout main
git pull origin main
git checkout -b hotfix/critical-bug

# Fix the bug
# Test locally

# Commit and push
git add .
git commit -m "hotfix: fix critical bug"
git push origin hotfix/critical-bug

# Create PR → Get quick review → Merge → Auto-deploy
```

## 📞 Support

- **Documentation**: See `DEPLOYMENT.md`, `CLAUDE.md`
- **Logs**: GitHub Actions → Workflow runs
- **EC2 Logs**: `docker-compose logs -f`
- **Workflow Files**: `.github/workflows/`

---

**Last Updated**: 2025-11-05
**Maintained by**: Development Team
