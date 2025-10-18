# OpenAI Setup Guide

FunkMyBrand now uses OpenAI API for all AI features. Here's how to get it running.

## 🚀 Quick Setup

### 1. Get OpenAI API Key
1. Go to https://platform.openai.com/api-keys
2. Create a new API key
3. Copy the key (starts with `sk-`)

### 2. Add Credits to OpenAI Account
1. Go to https://platform.openai.com/settings/organization/billing
2. Add $10-20 to start (should last months)

### 3. Update Environment Variables

Edit `.env.production`:
```env
OPENAI_API_KEY=sk-your-actual-openai-key-here
```

### 4. Deploy Functions to Supabase

```bash
# Deploy all AI functions
supabase functions deploy generate-style
supabase functions deploy generate-visual
supabase functions deploy generate-brand-rider
supabase functions deploy generate-cv

# Set the API key in Supabase
supabase secrets set OPENAI_API_KEY=sk-your-actual-key
```

## 💰 Cost Breakdown

### OpenAI Pricing (GPT-4o-mini)
- **Input**: $0.15 per 1M tokens
- **Output**: $0.60 per 1M tokens

### Estimated Usage per Generation
- **Style Analysis**: ~500 tokens = $0.0003
- **Visual Identity**: ~300 tokens = $0.0002  
- **Brand Rider**: ~800 tokens = $0.0005
- **CV Generation**: ~1000 tokens = $0.0006

**Total per complete brand**: ~$0.0016 (less than 1 cent!)

### Monthly Estimates
- **Light usage** (50 generations): ~$0.08
- **Moderate usage** (200 generations): ~$0.32
- **Heavy usage** (1000 generations): ~$1.60

Much cheaper than Lovable! 🎉

## ✅ Test the Setup

After deployment, test each function:

```bash
# Test style analysis
curl -X POST 'https://your-project.supabase.co/functions/v1/generate-style' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"corpus": "I am a creative professional who loves building innovative solutions. I believe in clear communication and getting things done efficiently."}'
```

## 🔄 Switch Back to Lovable (if needed)

If you want to switch back:
```bash
bash scripts/rollback-to-lovable.sh
```

## 🆘 Troubleshooting

### "OPENAI_API_KEY not configured"
- Make sure you set the secret: `supabase secrets set OPENAI_API_KEY=your-key`
- Verify the key starts with `sk-`

### "Payment required" 
- Add credits to your OpenAI account
- Check billing at https://platform.openai.com/settings/organization/billing

### Rate limits
- OpenAI has generous rate limits for GPT-4o-mini
- If you hit limits, wait a minute or upgrade your OpenAI tier

## 🎯 Benefits of OpenAI

✅ **Lower cost** - ~70% cheaper than Lovable  
✅ **Direct control** - No middleman  
✅ **Transparent pricing** - Pay only for what you use  
✅ **High reliability** - OpenAI's robust infrastructure  
✅ **Same quality** - GPT-4o-mini performs excellently  

Your FunkMyBrand is now powered by OpenAI! 🚀