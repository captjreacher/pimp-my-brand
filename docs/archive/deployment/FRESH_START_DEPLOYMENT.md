# 🆕 Fresh Start Deployment Guide

## Step-by-Step Fresh Supabase Setup

### **1. Create New Supabase Project**
1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Settings:
   - **Name**: `funkmybrand-production`
   - **Database Password**: [Create strong password]
   - **Region**: [Choose closest to users]
4. Wait ~2 minutes for creation

### **2. Get New Credentials**
From **Settings → API** in your new project:
```env
VITE_SUPABASE_URL=https://your-new-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### **3. Update Environment Files**
Update both `.env` and `.env.production` with your new credentials.

### **4. Deploy Database Schema**
Once you have Supabase CLI working:
```bash
# Link to new project
supabase link --project-ref YOUR_NEW_PROJECT_REF

# Deploy all migrations
supabase db push

# Deploy Edge Functions
supabase functions deploy generate-style
supabase functions deploy generate-visual
supabase functions deploy generate-brand-rider
supabase functions deploy generate-cv

# Set OpenAI API key
supabase secrets set OPENAI_API_KEY=sk-your-openai-key
```

### **5. Create Storage Bucket**
```bash
supabase storage create uploads --public=false
```

### **6. Rebuild and Deploy**
```bash
# Build with new environment
npm run build

# Create fresh deployment package
$timestamp = Get-Date -Format 'yyyyMMdd_HHmmss'
Compress-Archive -Path "dist\*" -DestinationPath "deployments\funkmybrand-fresh-$timestamp.zip" -Force
```

### **7. Upload to Spaceship**
1. Upload the new zip file
2. Extract to replace current files
3. Test at funkmybrand.com

## ✅ **Benefits of Fresh Start**

- **Clean database** - No old admin users or test data
- **Fresh credentials** - New API keys and tokens
- **Full control** - You manage everything from scratch
- **Better security** - No legacy access or permissions
- **Clean slate** - Start with exactly what you need

## 🎯 **What You'll Have**

After fresh deployment:
- ✅ **Clean FunkMyBrand app** at funkmybrand.com
- ✅ **Fresh Supabase database** with no existing users
- ✅ **New admin system** ready for your first admin user
- ✅ **OpenAI integration** ready to configure
- ✅ **Complete control** over all aspects

## 🚀 **Next Steps After Fresh Deploy**

1. **Create your first user account**
2. **Promote yourself to admin** using SQL scripts
3. **Set up OpenAI API** for AI features
4. **Test all functionality**
5. **Invite other users**

Your fresh FunkMyBrand will be completely under your control! 🎸