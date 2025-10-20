# 🔧 Manual Supabase Setup Guide

Since the Supabase CLI installation is having issues, here's how to set up your fresh Supabase project manually.

## Step 1: Create New Supabase Project

1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Settings:
   - **Name**: `funkmybrand-production`
   - **Database Password**: [Create strong password - save this!]
   - **Region**: [Choose closest to your users]
4. Wait ~2 minutes for creation

## Step 2: Get Your New Credentials

1. In your new project, go to **Settings → API**
2. Copy these values and update your `.env` file:

```env
# Replace with your actual values
VITE_SUPABASE_URL=https://your-new-project-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Step 3: Set Up Database Schema (Manual Method)

### Option A: Using Supabase Dashboard SQL Editor

1. In your Supabase project, go to **SQL Editor**
2. Run each migration file in order. Here are the key ones:

#### Migration 1: Admin Infrastructure
```sql
-- Copy content from: supabase/migrations/20251015000001_add_admin_infrastructure.sql
-- Paste and run in SQL Editor
```

#### Migration 2: Admin Audit System
```sql
-- Copy content from: supabase/migrations/20251015000002_create_admin_audit_system.sql
-- Paste and run in SQL Editor
```

Continue with all migration files in order...

### Option B: Using Our Setup Script

1. First, test your connection:
```bash
node scripts/test-supabase-connection.js
```

2. If connection works, run our setup:
```bash
node scripts/complete-supabase-setup.sql
```

## Step 4: Create Storage Bucket

1. In Supabase Dashboard, go to **Storage**
2. Click "Create Bucket"
3. Settings:
   - **Name**: `uploads`
   - **Public**: No (keep private)
   - **File size limit**: 50MB
   - **Allowed MIME types**: Leave default or add: `image/*,application/pdf,text/*`

## Step 5: Set Up Edge Functions (Manual)

Since we can't use CLI, we'll set up a simple proxy for now:

1. In Supabase Dashboard, go to **Edge Functions**
2. Create new function: `generate-style`
3. Use this code:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const openaiApiKey = Deno.env.get('OPENAI_API_KEY')

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { prompt, style } = await req.json()
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a professional brand style generator. Generate comprehensive brand guidelines.'
          },
          {
            role: 'user',
            content: `Generate brand style guidelines for: ${prompt}. Style preference: ${style}`
          }
        ],
        max_tokens: 2000,
        temperature: 0.7,
      }),
    })

    const data = await response.json()
    
    return new Response(
      JSON.stringify({ 
        content: data.choices[0].message.content 
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
```

4. Set environment variable:
   - Go to **Settings → Edge Functions**
   - Add secret: `OPENAI_API_KEY` = your OpenAI key

5. Repeat for other functions: `generate-visual`, `generate-brand-rider`, `generate-cv`

## Step 6: Test Your Setup

1. Update your `.env` with new credentials
2. Run connection test:
```bash
node scripts/test-supabase-connection.js
```

3. Build and test locally:
```bash
npm run build
npm run preview
```

## Step 7: Deploy to Production

1. Build with production environment:
```bash
npm run build
```

2. Create deployment package:
```bash
$timestamp = Get-Date -Format 'yyyyMMdd_HHmmss'
Compress-Archive -Path "dist\*" -DestinationPath "deployments\funkmybrand-fresh-$timestamp.zip" -Force
```

3. Upload to Spaceship and extract

## 🎯 What You'll Have After Setup

- ✅ Fresh Supabase database with no old users
- ✅ All admin tables and functions
- ✅ Storage bucket for file uploads  
- ✅ Edge functions for AI generation
- ✅ Clean deployment ready for production

## 🚨 Important Notes

- **Save your database password** - you'll need it for direct connections
- **Keep your service role key secure** - never expose it in client code
- **Test each step** before moving to the next
- **Backup your .env file** with the new credentials

## Need Help?

If you run into issues:
1. Check the Supabase Dashboard logs
2. Verify your environment variables
3. Test the connection script first
4. Run migrations one by one if needed

Your fresh FunkMyBrand setup will be completely under your control! 🎸