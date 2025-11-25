# Environment Setup Instructions

## After Creating Your Neon Database:

1. **Get your connection string** from Neon dashboard
2. **Create a `.env` file** in the project root with this content:

```env
# Database Connection (from Neon dashboard)
DATABASE_URL="postgres://username:password@ep-xxx-xxx.region.aws.neon.tech/neondb?sslmode=require"

# Cron Secret (already generated)
CRON_SECRET="ITUPp1Of5EwvX7gT1rlQu0vD3SpNXmhgkapcNFGzn+M="

# Optional: OpenAI API Key (leave empty if not using)
OPENAI_API_KEY=""

# Optional: Google Analytics (leave empty if not using)
NEXT_PUBLIC_GA_ID=""
```

3. **Replace** `DATABASE_URL` with your actual Neon connection string

4. **Then run:**
```bash
npx prisma db push
npm run db:seed
```

---

## Quick Command to Create .env:

```bash
cat > .env << 'EOF'
DATABASE_URL="YOUR_NEON_CONNECTION_STRING_HERE"
CRON_SECRET="ITUPp1Of5EwvX7gT1rlQu0vD3SpNXmhgkapcNFGzn+M="
OPENAI_API_KEY=""
NEXT_PUBLIC_GA_ID=""
EOF
```

Then edit `.env` and replace `YOUR_NEON_CONNECTION_STRING_HERE` with your actual connection string.

