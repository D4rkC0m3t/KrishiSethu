# KrishiSethu Git Workflow Guide

## Overview
This document outlines the Git workflow for KrishiSethu Inventory Management to ensure clean, maintainable, and trackable development.

## Branch Structure

### **Main Branches**
```
main (or master)     # Production-ready, deployable code
develop              # Integration branch for features
```

### **Supporting Branches**
```
feature/feature-name    # New functionality
patch/bug-description   # Bug fixes
hotfix/urgent-fix      # Critical production fixes
update/dependency-name # Dependency updates
docs/documentation     # Documentation changes
release/version-number # Release preparation
```

## Workflow Steps

### **1. Starting New Work**
```bash
# Always start from latest main
git checkout main
git pull origin main

# Create feature branch
git checkout -b feature/inventory-alerts
```

### **2. Making Changes**
```bash
# Make small, logical commits
git add specific-files
git commit -m "feat: add low stock alert system"

# NOT: git add . && git commit -m "various changes"
```

### **3. Commit Message Convention**
```
type: short description

Types:
- feat: new feature
- fix: bug fix
- docs: documentation
- style: formatting, no code change
- refactor: code restructuring
- test: adding tests
- chore: maintenance tasks
```

### **4. Before Merging**
```bash
# Rebase to keep history clean
git fetch origin
git rebase origin/main

# Push feature branch
git push origin feature/inventory-alerts
```

### **5. Code Review Process**
1. Create Pull Request
2. Minimum 2 reviewers
3. All tests must pass
4. Documentation updated
5. Squash merge to main

## Release Management

### **Tagging Releases**
```bash
# Tag stable releases
git tag -a v1.2.0 -m "Release 1.2.0 - Enhanced Analytics"
git push origin v1.2.0
```

### **Hotfix Process**
```bash
# Branch from production tag
git checkout v1.2.0
git checkout -b hotfix/security-patch

# Make fix and merge to both main and release branch
```

## Branch Protection Rules

### **Main Branch Protection**
- Require pull request reviews (2 minimum)
- Require status checks to pass
- Require branches to be up to date
- Restrict pushes to main
- Require signed commits

### **Develop Branch Protection**
- Require pull request reviews (1 minimum)
- Require status checks to pass
- Allow force pushes for rebasing

## File Organization

### **What to Commit**
✅ Source code files  
✅ Configuration files  
✅ Documentation  
✅ Package.json changes  
✅ Database migrations  

### **What NOT to Commit**
❌ node_modules/  
❌ .env files with secrets  
❌ Build artifacts  
❌ IDE-specific files  
❌ Temporary files  

## Example Workflows

### **Feature Development**
```bash
# 1. Create feature branch
git checkout main
git pull origin main
git checkout -b feature/3d-dashboard

# 2. Develop with small commits
git add src/components/Dashboard3D.jsx
git commit -m "feat: add 3D dashboard component"

git add src/styles/dashboard.css
git commit -m "style: add 3D dashboard styling"

# 3. Rebase and push
git fetch origin
git rebase origin/main
git push origin feature/3d-dashboard

# 4. Create PR for review
```

### **Bug Fix**
```bash
# 1. Create patch branch
git checkout main
git pull origin main
git checkout -b patch/fix-calculation-error

# 2. Fix with descriptive commit
git add src/utils/calculations.js
git commit -m "fix: correct inventory value calculation formula"

# 3. Add test
git add tests/calculations.test.js
git commit -m "test: add test for inventory calculation fix"

# 4. Push and create PR
git push origin patch/fix-calculation-error
```

### **Emergency Hotfix**
```bash
# 1. Branch from production tag
git checkout v1.2.0
git checkout -b hotfix/security-vulnerability

# 2. Make minimal fix
git add src/auth/security.js
git commit -m "fix: patch authentication vulnerability"

# 3. Merge to main and develop
git checkout main
git merge hotfix/security-vulnerability
git checkout develop
git merge hotfix/security-vulnerability

# 4. Tag new patch version
git tag -a v1.2.1 -m "Security patch v1.2.1"
```

## Quality Gates

### **Before Committing**
- [ ] Code compiles without errors
- [ ] Tests pass locally
- [ ] Code follows style guidelines
- [ ] No sensitive data included

### **Before Merging**
- [ ] PR reviewed and approved
- [ ] CI/CD pipeline passes
- [ ] Documentation updated
- [ ] No merge conflicts

### **Before Releasing**
- [ ] All features tested
- [ ] Performance benchmarks met
- [ ] Security scan passed
- [ ] Deployment tested in staging

## Tools & Integration

### **Recommended Tools**
- **GitHub Desktop**: Visual Git interface
- **VS Code**: Built-in Git integration
- **GitKraken**: Advanced Git visualization
- **Conventional Commits**: Commit message standard

### **CI/CD Integration**
```yaml
# .github/workflows/main.yml
name: CI/CD Pipeline
on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test
      - run: npm run build
```

## Troubleshooting

### **Common Issues**
```bash
# Undo last commit (keep changes)
git reset --soft HEAD~1

# Undo last commit (discard changes)
git reset --hard HEAD~1

# Fix commit message
git commit --amend -m "corrected message"

# Resolve merge conflicts
git status
# Edit conflicted files
git add resolved-files
git commit
```

### **Emergency Recovery**
```bash
# Find lost commits
git reflog

# Recover deleted branch
git checkout -b recovered-branch commit-hash

# Reset to previous state
git reset --hard origin/main
```

This workflow ensures clean, trackable changes and makes future patches painless!
