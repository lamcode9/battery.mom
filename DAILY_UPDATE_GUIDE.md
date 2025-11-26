# Daily Vehicle Database Update - Best Practices Guide

## ✅ Current Setup

Your system is already configured for daily updates:

1. **Vercel Cron Job** (`vercel.json`)**: Scheduled to run daily at 2 AM UTC
2. **API Endpoint** (`/api/cron/update-vehicles`): Fetches and updates vehicle data
3. **Audit Logging**: All runs are logged to the database
4. **Status Endpoint** (`/api/cron/status`): Monitor cron job health

## 🎯 Best Solution: Multi-Layer Approach

### 1. **Vercel Cron (Primary - Recommended)**

**Why it's best:**
- ✅ Built into Vercel (no external services needed)
- ✅ Reliable and monitored by Vercel
- ✅ Free for hobby projects
- ✅ Automatic retries on failure
- ✅ Built-in logging

**Setup Steps:**

#### A. Verify `vercel.json` Configuration
```json
{
  "crons": [
    {
      "path": "/api/cron/update-vehicles",
      "schedule": "0 2 * * *"
    }
  ],
  "functions": {
    "app/api/cron/update-vehicles/route.ts": {
      "maxDuration": 300
    }
  }
}
```

#### B. Set Environment Variables in Vercel Dashboard
1. Go to **Settings** → **Environment Variables**
2. Add:
   ```
   API_NINJAS_KEY=your-api-key-here
   CRON_SECRET=your-secret-here
   ```

#### C. Configure Cron Job in Vercel Dashboard
1. Go to **Settings** → **Cron Jobs**
2. Verify the cron job exists:
   - **Path**: `/api/cron/update-vehicles`
   - **Schedule**: `0 2 * * *` (daily at 2 AM UTC)
3. Add **Header**:
   - **Name**: `Authorization`
   - **Value**: `Bearer ${CRON_SECRET}` (or use actual secret value)

#### D. Verify It's Working
```bash
# Check status endpoint
curl https://your-domain.vercel.app/api/cron/status

# Manually trigger (for testing)
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://your-domain.vercel.app/api/cron/update-vehicles
```

### 2. **Monitoring & Health Checks**

#### Status Endpoint
Check cron health anytime:
```bash
GET /api/cron/status
```

Returns:
- Last run timestamp
- Success/failure status
- Vehicle statistics
- Next scheduled run time
- Recent errors

#### Vercel Dashboard Monitoring
1. **Deployments** → **Functions** → `/api/cron/update-vehicles` → **Logs**
2. **Settings** → **Cron Jobs** → View execution history

#### Database Audit Logs
```bash
npm run db:studio
# Navigate to AuditLog table
# Filter by action: 'CRON_RUN' or 'CRON_ERROR'
```

### 3. **Backup Solutions (Optional)**

If Vercel Cron fails, consider these alternatives:

#### Option A: GitHub Actions (Free)
Create `.github/workflows/daily-update.yml`:
```yaml
name: Daily Vehicle Update
on:
  schedule:
    - cron: '0 2 * * *'  # 2 AM UTC daily
  workflow_dispatch:  # Allow manual trigger

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Update
        run: |
          curl -X GET \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            https://your-domain.vercel.app/api/cron/update-vehicles
```

#### Option B: External Cron Service (Paid)
- **Cronitor**: https://cronitor.io
- **EasyCron**: https://www.easycron.com
- **UptimeRobot**: https://uptimerobot.com

### 4. **Error Handling & Retry Logic**

The current implementation includes:
- ✅ Try-catch blocks around API calls
- ✅ Error logging to AuditLog
- ✅ Graceful degradation (continues if some vehicles fail)
- ✅ Detailed error messages

**Recommended Enhancements:**

#### Add Retry Logic for API Failures
```typescript
async function fetchWithRetry(fn: () => Promise<any>, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn()
    } catch (error) {
      if (i === retries - 1) throw error
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
    }
  }
}
```

#### Add Alerting (Optional)
- Email notifications on failures
- Slack/Discord webhooks
- Integration with monitoring services

## 📊 Verification Checklist

Use this checklist to ensure daily updates are working:

- [ ] `vercel.json` has cron configuration
- [ ] Environment variables set in Vercel (`API_NINJAS_KEY`, `CRON_SECRET`)
- [ ] Cron job configured in Vercel Dashboard
- [ ] Authorization header set correctly
- [ ] Status endpoint returns healthy status
- [ ] Manual test run succeeds
- [ ] Audit logs show successful runs
- [ ] Vehicles are being updated in database

## 🔍 Troubleshooting

### Cron Not Running
1. **Check Vercel Dashboard** → **Cron Jobs** → Execution history
2. **Verify Authorization**: Header must match `CRON_SECRET`
3. **Check Function Logs**: Look for errors in deployment logs
4. **Verify Schedule**: Should be `0 2 * * *` (2 AM UTC daily)

### API Errors
1. **Check API Key**: Verify `API_NINJAS_KEY` is correct
2. **Rate Limits**: Free tier is 10/day, 1000/month
3. **API Status**: Check API Ninjas status page

### No Vehicles Updated
1. **Check API Response**: Review logs for API data
2. **Database Connection**: Verify DATABASE_URL is set
3. **Check Transform Logic**: Review vehicle-transformer.ts

## 🚀 Recommended Schedule

**Current**: `0 2 * * *` (2 AM UTC daily)

**Alternative Times** (if needed):
- `0 3 * * *` - 3 AM UTC (less traffic)
- `0 1 * * *` - 1 AM UTC (earlier)
- `0 */12 * * *` - Every 12 hours (if you have higher API limits)

## 📈 Monitoring Best Practices

1. **Daily Check**: Review status endpoint once per day
2. **Weekly Review**: Check audit logs for patterns
3. **Monthly**: Review API usage and rate limits
4. **Set Alerts**: Use Vercel's built-in notifications or external monitoring

## 🔐 Security

- ✅ Cron endpoint requires `CRON_SECRET` authorization
- ✅ Environment variables stored securely in Vercel
- ✅ No sensitive data in logs
- ✅ Rate limiting on API calls

## 📝 Next Steps

1. **Verify Setup**: Run through the verification checklist above
2. **Test Manually**: Trigger a test run to confirm it works
3. **Monitor First Week**: Check logs daily for the first week
4. **Set Up Alerts**: Configure notifications for failures (optional)
5. **Expand Models**: Add more vehicles via `API_NINJAS_MODELS` env var

---

**Status**: ✅ Ready for production use

**Last Updated**: Current implementation supports reliable daily updates via Vercel Cron

