# EVCompare SEA

A comprehensive comparison tool for electric vehicles (EVs) available in Singapore and Malaysia. Compare battery specs, efficiency, range, pricing, and more to make informed EV purchasing decisions.

## Features

- 🔍 **Smart Search**: Fuzzy search with auto-suggestions powered by Fuse.js
- 📊 **Side-by-Side Comparison**: Compare up to 4 vehicles at once
- 📈 **Visual Analytics**: Charts and graphs for efficiency and range
- 💰 **Price Comparison**: Base prices, OTR prices, rebates, and options
- 🔋 **Battery Insights**: Detailed battery weight, technology, and charging specs
- 🌏 **Multi-Country**: Support for Singapore (SG) and Malaysia (MY)
- 📱 **Mobile-First**: Fully responsive design
- ♿ **Accessible**: ARIA labels, keyboard navigation, semantic HTML
- 🔄 **Auto-Updates**: Daily cron jobs to keep data fresh
- 📥 **Export**: Download comparisons as CSV

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI, Headless UI
- **Database**: PostgreSQL (via Prisma)
- **State Management**: Zustand
- **Charts**: Recharts
- **Search**: Fuse.js
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- PostgreSQL database (local or hosted on Vercel/Supabase)

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd evcompare-sea
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the project root with:
```
DATABASE_URL="postgresql://user:password@localhost:5432/evcompare?schema=public"
CRON_SECRET="your-secret-key-here"
API_NINJAS_KEY="your-api-ninjas-key"
OPENAI_API_KEY=""
NEXT_PUBLIC_GA_ID=""
```
   - Get a free API key at https://api-ninjas.com/api/electricvehicle
   - Generate `CRON_SECRET` with `openssl rand -base64 32`

4. Set up the database:
```bash
# Generate Prisma Client
npx prisma generate

# Push schema to database
npx prisma db push

# Seed with sample data
npm run db:seed
```

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
evcompare-sea/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── vehicles/      # Vehicle endpoints
│   │   └── cron/          # Cron job endpoints
│   ├── about/             # About page
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── Hero.tsx
│   ├── CountrySelector.tsx
│   ├── SearchBox.tsx
│   ├── VehicleSection.tsx
│   ├── VehicleCard.tsx
│   ├── StatsGrid.tsx
│   ├── ComparisonTable.tsx
│   └── Footer.tsx
├── store/                 # Zustand stores
│   └── VehicleStore.tsx
├── types/                 # TypeScript types
│   └── vehicle.ts
├── prisma/                # Prisma schema
│   └── schema.prisma
├── scripts/               # Utility scripts
│   └── seed.ts            # Database seeding
└── public/                # Static assets
```

## Database Schema

The main `Vehicle` model includes:
- Basic info (name, model/trim, country, image)
- Battery specs (weight, technology, manufacturer)
- Performance (power, efficiency, range)
- Pricing (base, OTR, options, rebates)
- Charging (time, capabilities)
- Availability status

## Auto-Update Mechanism

The app includes a cron job system that runs daily to:
1. Fetch latest vehicle data from sources
2. Compare against existing database records
3. Add new models or update existing ones
4. Mark discontinued models as unavailable
5. Log changes to audit table

To set up the cron job on Vercel:
1. Add the cron configuration in `vercel.json` (already included)
2. Set `CRON_SECRET` + `API_NINJAS_KEY` environment variables
3. The cron will run daily at 2 AM UTC

## Data Sources

- **Singapore**: sgcarmart.com, onemotoring.sg
- **Malaysia**: carlist.my, paultan.org
- **Global**: ev-database.org
- **Cost Data**: Industry teardowns (e.g., Munro & Associates)

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:push` - Push Prisma schema to database
- `npm run db:studio` - Open Prisma Studio
- `npm run db:seed` - Seed database with sample data

### Adding New Vehicles

1. Use the seed script as a template
2. Add vehicle data to `scripts/seed.ts`
3. Run `npm run db:seed`

Or manually add via Prisma Studio:
```bash
npm run db:studio
```

## Deployment

### Vercel

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables:
   - `DATABASE_URL`
   - `CRON_SECRET`
4. Deploy!

The cron job will automatically be set up based on `vercel.json`.

### Database Setup

For production, use:
- **Vercel Postgres**: Integrated with Vercel
- **Supabase**: Free tier available
- **Neon**: Serverless Postgres

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `CRON_SECRET` | Secret for securing cron endpoints | Yes |
| `API_NINJAS_KEY` | Free EV data API key from API Ninjas | Yes (for auto-updates) |
| `OPENAI_API_KEY` | For AI-powered insights (optional) | No |
| `NEXT_PUBLIC_GA_ID` | Google Analytics ID (optional) | No |

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT

## Disclaimer

All prices and specifications are estimates based on publicly available information. Prices may vary by dealer, location, and time. Always consult official dealers for the most current pricing and availability. Range estimates are based on WLTP/EPA standards and actual range may vary based on driving conditions, weather, and usage patterns.

## TODO

- [ ] Implement actual data fetching in cron job (currently placeholder)
- [ ] Add more vehicle models (currently 5 sample vehicles)
- [ ] Integrate with EV Database API
- [ ] Add web scraping for sgcarmart.com and carlist.my
- [ ] Add OpenAI integration for natural language insights
- [ ] Add unit tests with Jest
- [ ] Add E2E tests with Playwright
- [ ] Add dark mode toggle
- [ ] Add favorites/bookmarking feature
- [ ] Add user accounts for saving comparisons

