# Step-by-Step Vercel PostgreSQL Migration Guide

## 📋 Prerequisites

- GitHub account with repository
- Vercel account (free tier works)
- Node.js 18+ installed locally

## 🚀 Quick Start (5 minutes)

### Step 1: Create Vercel Postgres Database

```bash
# Via web browser
1. Go to vercel.com/dashboard
2. Click "Storage" tab
3. Click "Create New" → "Postgres"
4. Choose region (closest to your users)
5. Copy the connection string
```

### Step 2: Add to Environment Variables

```bash
# Copy the POSTGRES_URL_NON_POOLING string
# Go to your Vercel Project → Settings → Environment Variables
# Add: DATABASE_URL = <your-postgres-url>
```

### Step 3: Deploy

```bash
# Via GitHub (Recommended)
git push origin main
# Vercel auto-deploys on push

# Via CLI
vercel deploy --prod
```

### Step 4: Initialize Database

```bash
# Pull environment variables locally
vercel env pull

# Generate and apply schema
npm run db:push

# Or run SQL file directly
psql "your-db-url" -f database.sql
```

## 📝 Complete Migration Workflow

### Phase 1: Local Verification

```bash
# 1. Ensure local build works
npm install
npm run check
npm run build

# 2. Verify routing
npm run dev
# Test: http://localhost:5000
```

### Phase 2: Repository Setup

```bash
# 1. Ensure .gitignore excludes:
# - .env.local
# - node_modules/
# - dist/
# - replit_integrations/ (optional)

# 2. Commit changes
git add .
git commit -m "Configure for Vercel deployment with PostgreSQL"
git push origin main
```

### Phase 3: Vercel Configuration

#### Option A: GitHub Integration (Easiest)

```
1. Go to vercel.com/new
2. Select "Import Git Repository"
3. Choose your GitHub repo
4. Framework: Express.js (auto-detected)
5. Build Command: npm run vercel-build
6. Start Command: npm start
7. Add Environment Variables:
   - DATABASE_URL: <your-postgres-url>
   - AI_INTEGRATIONS_OPENAI_API_KEY: <if using OpenAI>
8. Deploy
```

#### Option B: Vercel CLI

```bash
# Install CLI
npm install -g vercel

# Login
vercel login

# Link project
vercel link

# Add environment variables
vercel env add DATABASE_URL
vercel env add AI_INTEGRATIONS_OPENAI_API_KEY

# Deploy
vercel --prod
```

### Phase 4: Database Setup

**Choose one method:**

**Method 1: Automatic (Recommended)**

```bash
vercel env pull
npm run db:push
```

**Method 2: Manual SQL Execution**

```bash
# Using psql
psql "postgres://user:pwd@host:port/db?sslmode=require" -f database.sql

# Or use Vercel's Data tab
1. Go to Vercel Dashboard → Storage → Select database
2. Click "Query" tab
3. Paste content of database.sql
4. Execute
```

**Method 3: Using DBeaver**

1. Download DBeaver (free)
2. Create New PostgreSQL Connection
3. Paste Vercel Postgres URL
4. Execute SQL file: `database.sql`

### Phase 5: Verification

#### Check Deployment

```bash
# Visit your deployed URL
https://your-project.vercel.app

# Should see the app frontend
# API endpoints at /api/*
```

#### Verify Database

```bash
# Pull env variables
vercel env pull

# Test database connection
npm run db:push  # This validates connection

# Query data
psql "your-postgres-url" -c "SELECT COUNT(*) FROM users;"
```

#### Test API Endpoints

```bash
# Make a test request
curl https://your-project.vercel.app/api/decisions/list

# Should return: {"status": 200, "data": [...]}
```

## 🔄 Continuous Deployment

After initial setup, every push to main auto-deploys:

```bash
# Make changes
git add .
git commit -m "Add new feature"
git push origin main

# Vercel auto-builds and deploys
# Check progress: vercel.com/dashboard → Deployments
```

## 🗄️ Database Management

### Connect Locally for Development

```bash
# Get connection string
vercel env pull

# Test connection with psql
psql "your-vercel-postgres-url"

# In psql, run queries:
SELECT * FROM users;
SELECT COUNT(*) FROM daily_habits;
```

### Backup Database

```bash
# Vercel automatically backs up daily
# Manual backup:
pg_dump "your-vercel-postgres-url" > backup_$(date +%Y%m%d).sql
```

### Monitor Usage

In Vercel Dashboard → Storage → Postgres:

- View query count
- Check storage size
- Monitor real-time queries

## ⚠️ Common Issues & Solutions

### Issue: "DATABASE_URL is not set"

```
Solution:
1. vercel env add DATABASE_URL
2. Paste your POSTGRES_URL_NON_POOLING
3. Redeploy: vercel --prod
```

### Issue: "Connection timeout"

```
Solution:
- Ensure using POSTGRES_URL_NON_POOLING (not POSTGRES_URL)
- Wait 2-3 minutes for Vercel to initialize
- Check if database region matches function region
```

### Issue: "Schema not found"

```
Solution:
1. npm run db:push  (from local with env pulled)
2. Or manually execute: psql url -f database.sql
3. Verify: SELECT table_name FROM information_schema.tables;
```

### Issue: Build fails with "tsx error"

```
Solution:
1. npm run check  (verify TypeScript)
2. npm run build  (test build locally)
3. Check buildCommand in vercel.json
4. Ensure all dependencies installed: npm install
```

### Issue: Cannot connect to database

```
Solution:
1. Test URL locally:
   psql "your-postgres-url" -c "SELECT 1;"
2. Check IP whitelist (Vercel auto-whitelists)
3. Use POSTGRES_URL_NON_POOLING variant
4. Ensure sslmode=require in URL
```

## 📊 Monitoring & Logging

### View Logs

```bash
# Via Vercel CLI
vercel logs --prod

# Via Dashboard
Vercel → Project → Deployments → Select deployment → Logs
```

### Performance Monitoring

```
Vercel Dashboard → Project → Analytics
- Function duration
- Database queries
- Error rates
```

## 🎯 Success Criteria

✅ Project deployed to vercel.com
✅ PostgreSQL database connected
✅ Database schema initialized
✅ API endpoints responding
✅ Frontend loading correctly
✅ No JavaScript errors in console
✅ Can query database successfully

## 📞 Support Resources

- [Vercel Docs](https://vercel.com/docs)
- [Vercel Postgres Docs](https://vercel.com/docs/storage/postgres)
- [Drizzle ORM](https://orm.drizzle.team)
- [Express.js](https://expressjs.com)
- [PostgreSQL](https://www.postgresql.org/docs)

## 🔐 Post-Deployment Security Checklist

- [ ] Database backups enabled
- [ ] Environment variables are private (not in .env.local)
- [ ] HTTPS enabled (automatic on Vercel)
- [ ] API rate limiting configured (if needed)
- [ ] Database user has minimum required permissions
- [ ] Sensitive data not logged
- [ ] CORS configured if needed
