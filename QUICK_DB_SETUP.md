# Quick Database Setup Guide

## 🚀 Fastest Option: Neon (Free, 2 minutes)

### Step 1: Create Neon Database
1. Go to **https://neon.tech**
2. Sign up (use GitHub for fastest setup)
3. Click **"Create a project"**
4. Name: `evcompare-sea`
5. Region: Choose closest (Singapore/Tokyo for SEA)
6. Click **"Create project"**

### Step 2: Get Connection String
1. After creation, you'll see a connection string like:
   ```
   postgres://username:password@ep-xxx-xxx.region.aws.neon.tech/neondb?sslmode=require
   ```
2. **Copy it!**

### Step 3: Update .env File
1. Open `.env` file in the project root
2. Replace the `DATABASE_URL` line with your Neon connection string:
   ```env
   DATABASE_URL="postgres://your-actual-connection-string-here"
   ```

### Step 4: Run Setup Commands
```bash
# Push database schema
npx prisma db push

# Seed with sample data
npm run db:seed

# Restart dev server (if running)
# Press Ctrl+C to stop, then:
npm run dev
```

---

## ✅ That's It!

Your site should now work with the database. Open http://localhost:3000 and you should see vehicles!

---

## Alternative Options

### Vercel Postgres
- Go to vercel.com → Storage → Create Postgres
- Copy connection string to `.env`

### Supabase
- Go to supabase.com → New Project
- Settings → Database → Copy connection string
- Use as `DATABASE_URL` in `.env`

---

## Troubleshooting

**Error: "Can't reach database server"**
- Check your connection string is correct
- Make sure it includes `?sslmode=require` at the end
- Verify database is running (check Neon/Vercel dashboard)

**Error: "Schema not found"**
- Run `npx prisma db push` again
- Check Prisma schema is valid

**No vehicles showing**
- Run `npm run db:seed` to add sample data
- Check browser console for errors

