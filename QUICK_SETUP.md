# Quick Database Setup - Vercel Dashboard

## Step 1: Create Postgres Database (2 minutes)

1. **Go to Vercel Dashboard**: https://vercel.com/dashboard
2. **Click "Storage"** in the left sidebar (or go to https://vercel.com/dashboard/storage)
3. **Click "Create Database"**
4. **Select "Postgres"**
5. **Name it**: `evcompare-sea-db` (or any name you prefer)
6. **Select Region**: Choose `Singapore (sin1)` or closest to you
7. **Click "Create"**

## Step 2: Get Connection String (1 minute)

1. **Click on your newly created database**
2. **Go to the ".env.local" tab**
3. **Copy the `POSTGRES_URL` value** (it looks like: `postgres://default:xxxxx@xxxxx.vercel-storage.com:5432/verceldb`)

## Step 3: Create .env File

Once you have the connection string, I'll help you create the `.env` file with:
- `DATABASE_URL` (your Postgres connection string)
- `CRON_SECRET` (a random secret key)

## Step 4: Push Schema & Seed Data

After the `.env` file is set up, we'll run:
```bash
npx prisma db push
npm run db:seed
```

---

**Ready?** Once you have the `POSTGRES_URL` from Step 2, paste it here and I'll help you set up the `.env` file!

