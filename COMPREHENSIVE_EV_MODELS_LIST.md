# Comprehensive EV Models List for API_NINJAS_MODELS

This is a comprehensive list of popular electric vehicles that can be added to your `API_NINJAS_MODELS` environment variable.

## How to Use

Copy the entire list below and paste it into your Vercel environment variable `API_NINJAS_MODELS`:

```
Model 3,Model Y,Model S,Model X,Atto 3,Seal,IONIQ 5,IONIQ 6,EV6,Niro EV,Soul EV,XC40,Polestar 2,BMW iX,BMW iX3,BMW i4,BMW iX1,Mercedes EQS,Mercedes EQE,Mercedes EQC,Audi e-tron,Audi Q4 e-tron,Audi e-tron GT,Volkswagen ID.4,Volkswagen ID.3,Volkswagen ID.7,Nissan Leaf,Nissan Ariya,Ford Mustang Mach-E,Ford F-150 Lightning,Rivian R1T,Rivian R1S,Lucid Air,Porsche Taycan,Hyundai Kona Electric,Chevrolet Bolt EV,Chevrolet Bolt EUV,Genesis GV60,Genesis Electrified GV70,Genesis Electrified G80,Volvo C40,Volvo EX90,Volvo EX30,MG4,MG ZS EV
```

## Popular Models (Recommended Starting List)

If you want to start with a smaller, curated list:

```
Model 3,Model Y,Atto 3,Seal,IONIQ 5,IONIQ 6,EV6,XC40,Polestar 2,BMW iX,Mercedes EQS,Mercedes EQE,BMW i4,BMW iX3,Audi e-tron,Audi Q4 e-tron,Volkswagen ID.4,Volkswagen ID.3,Nissan Leaf,Nissan Ariya,Ford Mustang Mach-E,Ford F-150 Lightning,Rivian R1T,Rivian R1S,Lucid Air,Porsche Taycan,Mercedes EQC,BMW iX1,Hyundai Kona Electric,Kia Niro EV,Kia Soul EV,Chevrolet Bolt EV,Chevrolet Bolt EUV,Genesis GV60,Volvo C40,Volvo EX90,MG4,MG ZS EV
```

## Notes

- **API Rate Limits**: Free tier allows 10 requests/day, 1000/month
- **Current Default**: 8 models (uses 8 requests per run)
- **Recommended**: Start with 20-30 popular models
- **Max Per Run**: Controlled by `API_NINJAS_MAX_REQUESTS` (default: 8)

## Adding New Models

When new EV models are released:

1. Add the model name to the `API_NINJAS_MODELS` environment variable
2. The next cron run (within 24 hours) will automatically fetch it
3. No code changes or redeployment needed!

## Model Name Format

- Use the **model name** as it appears in API Ninjas
- Examples: "Model 3", "IONIQ 5", "ID.4" (not "Tesla Model 3")
- The API will return all variants/trims for that model

## Updating the List

1. Go to **Vercel Dashboard** → **Settings** → **Environment Variables**
2. Find `API_NINJAS_MODELS`
3. Click **Edit**
4. Add new model names (comma-separated)
5. Save
6. Next cron run will include the new models

