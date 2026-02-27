# Supabase Setup Guide

## Quick Start

Your app now uses **Supabase for persistent conversation history**. Follow these steps to set up:

### 1. Create the Conversations Table

Go to your Supabase project dashboard:

- URL: `https://app.supabase.com/project/azksyptqyxiliwlmcmxa`
- Click **SQL Editor**
- Create a new query
- Copy and run the SQL from `migrations/001_create_conversations.sql`:

```sql
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL UNIQUE,
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service role can manage conversations"
ON conversations FOR ALL
USING (true)
WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
```

### 2. Environment Variables

The `.env` file already has:

```
SUPABASE_URL=https://azksyptqyxiliwlmcmxa.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### 3. How It Works

- Chat history is now stored in Supabase PostgreSQL database
- Each user (identified by `userId`) has one conversation record
- Messages are stored as JSONB for flexible querying
- On server restart, historical messages are retrieved from database
- No more in-memory loss when server restarts!

### 4. Test Locally

```bash
npm run server:dev   # Backend on 5000
npm run dev         # Frontend on 5173/5174
```

Visit `http://localhost:5173` and start chatting. History persists across server restarts!

### 5. Deploy to Vercel

Your code is ready to deploy:

```bash
git add .
git commit -m "Add Supabase persistence for chat history"
git push origin main
```

Vercel will auto-deploy. Your chat history will persist on production too!

## Architecture

```
Frontend (React) ➜ Backend (Express)
                ➜ Supabase PostgreSQL
                  (Persistent History)
```

- **Frontend**: React chat UI, sends messages to `/api/chat`
- **Backend**: Express server with OpenAI client
- **Database**: Supabase stores all conversations per user
- **Auth**: JWT tokens identify users (userId in req.user)

## Troubleshooting

**"Supabase credentials not configured"?**

- Make sure `.env` file exists with `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
- Restart your server after creating `.env`

**Table doesn't exist?**

- Run the SQL from step 1 in your Supabase SQL Editor
- Check that RLS policy allows service role access

**Messages not persisting?**

- Check Supabase dashboard ➜ Table Editor ➜ conversations
- Verify messages are being inserted
- Check browser console for API errors

## Next Steps

- Add OpenAI API key to `.env` for live AI responses
- Customize user preferences persistence (currently in-memory)
- Add user authentication (JWT login/register)
- Deploy to Vercel and monitor with Supabase logs
