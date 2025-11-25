# Vercel Cron Setup Guide

## Overview

The app includes an automated daily update system that fetches vehicle data from APIs and updates your database.

## How It Works

1. **Vercel Cron** calls `/api/cron/update-vehicles` daily at 2 AM UTC
2. **Data Fetcher** pulls vehicle data from API Ninjas EV API (free tier)
3. **Transformer** converts API data to our database format
4. **Database Update** creates/updates vehicles in PostgreSQL
5. **Audit Log** records all changes

## Setup Steps

### 1. Get API Ninjas Key (Free)

1. Go to **https://api-ninjas.com/api/electricvehicle**
2. Click **"Get API Key"** (free signup)
3. Copy your API key

### 2. Add Environment Variables

In your **Vercel Dashboard**:
1. Go to your project → **Settings** → **Environment Variables**
2. Add these variables:

```
API_NINJAS_KEY=your-api-key-here
CRON_SECRET=ITUPp1Of5EwvX7gT1rlQu0vD3SpNXmhgkapcNFGzn+M=
```

**For local testing**, also add to your `.env` file:
```env
API_NINJAS_KEY=your-api-key-here
```

### 3. Configure Vercel Cron

The cron is already configured in `vercel.json`, but you need to set it up in Vercel:

#### Option A: Via Vercel Dashboard (Recommended)
1. Go to your project in Vercel Dashboard
2. Click **Settings** → **Cron Jobs**
3. Click **Add Cron Job**
4. Set:
   - **Path**: `/api/cron/update-vehicles`
   - **Schedule**: `0 2 * * *` (daily at 2 AM UTC)
   - **Timezone**: UTC

#### Option B: Via Vercel CLI
```bash
vercel cron add "0 2 * * *" /api/cron/update-vehicles
```

### 4. Set Authorization Header

Vercel Cron needs to pass the `CRON_SECRET` in the Authorization header.

**In Vercel Dashboard:**
1. Go to **Settings** → **Cron Jobs**
2. Edit your cron job
3. Add **Header**:
   - **Name**: `Authorization`
   - **Value**: `Bearer ${CRON_SECRET}` (or use the actual value: `Bearer ITUPp1Of5EwvX7gT1rlQu0vD3SpNXmhgkapcNFGzn+M=`)

**Note**: Vercel Cron automatically passes environment variables, but for headers you may need to use the actual secret value.

### 5. Test the Cron Job

#### Test Locally:
```bash
curl -H "Authorization: Bearer ITUPp1Of5EwvX7gT1rlQu0vD3SpNXmhgkapcNFGzn+M=" http://localhost:3000/api/cron/update-vehicles
```

#### Test on Vercel:
1. Go to **Vercel Dashboard** → **Deployments**
2. Click on your latest deployment
3. Go to **Functions** tab
4. Find `/api/cron/update-vehicles`
5. Click **Invoke** to test

### 6. Monitor Cron Jobs

**View logs:**
- Vercel Dashboard → **Deployments** → **Functions** → `/api/cron/update-vehicles` → **Logs`

**Check audit logs:**
```bash
npm run db:studio
# Navigate to AuditLog table
```

## API Limits

**API Ninjas Free Tier:**
- 10 requests/day
- 1,000 requests/month
- Rate limit: ~1 request/second

**Recommendations:**
- Cron runs once daily (well within limits)
- If you need more, consider upgrading API Ninjas or using multiple APIs

## Troubleshooting

### Cron Not Running
1. Check Vercel Dashboard → Cron Jobs (should show execution history)
2. Verify `CRON_SECRET` matches in environment variables and header
3. Check function logs for errors

### API Errors
1. Verify `API_NINJAS_KEY` is set correctly
2. Check API Ninjas dashboard for rate limits
3. Review audit logs for error details

### No Vehicles Updated
1. Check if API returned data (see logs)
2. Verify database connection
3. Check Prisma schema matches

## Manual Trigger

To manually trigger an update:
```bash
# Local
curl -H "Authorization: Bearer ITUPp1Of5EwvX7gT1rlQu0vD3SpNXmhgkapcNFGzn+M=" http://localhost:3000/api/cron/update-vehicles

# Production (replace with your domain)
curl -H "Authorization: Bearer YOUR_CRON_SECRET" https://your-domain.vercel.app/api/cron/update-vehicles
```

## Future Enhancements

- [ ] Add web scraping for SGCarMart and Carlist.my
- [ ] Support multiple API sources (fallback)
- [ ] Add email notifications on errors
- [ ] Add rate limiting protection
- [ ] Add data validation before saving

