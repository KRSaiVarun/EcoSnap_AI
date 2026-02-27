# Vercel PostgreSQL Deployment Guide for Eco-Decision-Guide

## Setup Instructions

### 1. **Create Vercel PostgreSQL Database**

- Go to [Vercel Dashboard](https://vercel.com/dashboard)
- Navigate to **Storage** → **Create New** → **Postgres**
- Name: `eco-decision-db` (or your preferred name)
- Select your region and create the database

### 2. **Get Database Connection String**

- After creation, click on the database
- Copy the `POSTGRES_URL_NON_POOLING` connection string
- This will be your `DATABASE_URL` environment variable

### 3. **Deploy to Vercel**

#### Option A: Using Vercel CLI

```bash
npm install -g vercel
vercel link  # Connect to your Vercel project
vercel env add DATABASE_URL  # Add your PostgreSQL URL
vercel deploy --prod
```

#### Option B: Using GitHub Integration

1. Push code to GitHub
2. Go to Vercel Dashboard → New Project → Import Git Repository
3. Select your repository
4. Add environment variables:
   - `DATABASE_URL`: Your PostgreSQL connection string
5. Deploy

### 4. **Initialize Database Schema**

Run the following once after deployment:

```bash
# Via Vercel CLI
vercel env pull  # Get env variables locally
npm run db:generate  # Generate migrations
npm run db:push    # Apply schema to database
```

Or manually execute the SQL in `database.sql` file using:

- Vercel's Data tab
- DBeaver or pgAdmin with the connection string
- psql CLI:

```bash
psql "your_postgres_url" -f database.sql
```

### 5. **Environment Variables Required**

Create a `.env.local` file with:

```
DATABASE_URL=postgres://...your-postgresql-url...
NODE_ENV=production
```

## Vercel Deployment Features

✅ **Automatic Deployments**: Deploy on every push to main branch
✅ **Database Auto-Backups**: Vercel Postgres includes daily backups
✅ **SSL Connection**: All connections are encrypted
✅ **Auto-scaling**: Database automatically scales based on usage
✅ **Monitoring**: Built-in analytics and performance monitoring

## Project Structure for Vercel

```
Eco-Decision-Guide/
├── server/              # Express backend - runs on Vercel Functions
├── client/              # React frontend - static assets
├── shared/              # Shared types and schemas
├── database.sql         # Initial schema (run manually once)
├── drizzle.config.ts    # Drizzle ORM config
├── vercel.json          # Vercel deployment config
├── .vercelignore        # Files to exclude from deployment
└── package.json         # Dependencies and scripts
```

## Important Notes

- **Replit Integrations Removed**: All replit_integrations/ code has been removed
- **Database Migrations**: Use Drizzle Kit for safe schema migrations
- **Build Output**: Output directory is set to `dist/`
- **Node Version**: Compatible with Node 18+

## Troubleshooting

### Database Connection Issues

- Verify `DATABASE_URL` environment variable is set
- Check if IP is whitelisted (Vercel IPs are auto-whitelisted)
- Use `psql` to test connection directly

### Build Failures

```bash
npm run check  # Check TypeScript errors
npm run build  # Test build locally
```

### Runtime Errors

- Check Vercel function logs: Dashboard → Project → Logs
- Ensure all environment variables are set
- Verify database migrations were applied

## Database Management

### Backup & Restore

- Vercel automatically backs up daily
- Use `pg_dump` for manual backups:

```bash
pg_dump "your_postgres_url" > backup.sql
```

### Monitoring Queries

```bash
psql "your_postgres_url"
SELECT * FROM users;
SELECT COUNT(*) FROM daily_habits;
```

## Next Steps

1. Deploy project to Vercel
2. Initialize database schema (run `database.sql`)
3. Test API endpoints
4. Monitor performance in Vercel dashboard
5. Scale database as needed
