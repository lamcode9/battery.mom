# Database Setup Guide for Vercel Postgres

## Step 1: Create Vercel Postgres Database

### Option A: Via Vercel Dashboard (Recommended)
1. Go to [vercel.com](https://vercel.com) and log in with your GitHub account
2. Click on your profile → **Dashboard**
3. Go to the **Storage** tab
4. Click **Create Database** → Select **Postgres**
5. Choose a name (e.g., `evcompare-sea-db`)
6. Select a region closest to you (e.g., `Singapore` or `Tokyo` for SEA)
7. Click **Create**

### Option B: Via Vercel CLI
Run these commands in your terminal:
```bash
# Login to Vercel (will open browser)
vercel login

# Link your project (if not already linked)
vercel link

# Create Postgres database
vercel postgres create evcompare-sea-db
```

## Step 2: Get Connection String

### Via Dashboard:
1. Go to your database in Vercel Dashboard
2. Click on **.env.local** tab
3. Copy the `POSTGRES_URL` value

### Via CLI:
```bash
vercel postgres connect evcompare-sea-db
```

## Step 3: Set Up Local Environment

1. Create a `.env` file in the project root:
```bash
DATABASE_URL="your-postgres-url-from-vercel"
CRON_SECRET="generate-a-random-secret-key-here"
```

2. Generate a random secret for CRON_SECRET:
```bash
openssl rand -base64 32
```

## Step 4: Push Database Schema

Once you have the DATABASE_URL in your `.env` file, run:
```bash
npx prisma db push
```

## Step 5: Seed Sample Data

```bash
npm run db:seed
```

## Step 6: Verify Setup

Start the dev server and check if vehicles load:
```bash
npm run dev
```

---

## Alternative: Use Supabase (Free Tier)

If you prefer Supabase:
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings → Database
4. Copy the connection string (URI format)
5. Use it as `DATABASE_URL` in `.env`

---

## Alternative: Use Neon (Free Tier)

If you prefer Neon:
1. Go to [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string
4. Use it as `DATABASE_URL` in `.env`

