# 🚀 FunkMyBrand Deployment Instructions

## 📦 Deployment Package Created
**File**: `funkmybrand-20251017_020358.zip`  
**Generated**: October 17, 2025 at 2:03 AM  
**Size**: Ready for upload to funkmybrand.com

## 🎯 Step-by-Step Deployment

### 1. **Prepare Supabase (5 minutes)**

First, set up your OpenAI API key in Supabase:

```bash
# Get your OpenAI API key from: https://platform.openai.com/api-keys
# Then set it in Supabase:
supabase secrets set OPENAI_API_KEY=sk-your-actual-key-here

# Deploy the AI functions:
supabase functions deploy generate-style
supabase functions deploy generate-visual
supabase functions deploy generate-brand-rider
supabase functions deploy generate-cv
```

### 2. **Upload to Spaceship Hosting (10 minutes)**

1. **Login** to your Spaceship hosting control panel
2. **Navigate** to File Manager for funkmybrand.com
3. **Backup** current files (if any exist)
4. **Upload** `funkmybrand-20251017_020358.zip` to your domain's public folder
5. **Extract** the zip file in the public folder
6. **Verify** all files are in the root (not in a subfolder)

### 3. **Verify File Structure**

Your public folder should contain:
```
funkmybrand.com/
├── index.html
├── .htaccess          ← Important for SPA routing!
├── assets/
│   ├── index-*.css
│   ├── index-*.js
│   └── other assets
└── other static files
```

### 4. **Update Environment Variables**

Make sure these are set in your `.env.production`:
```env
VITE_SUPABASE_URL=https://nfafvtyhmprzydxhebbm.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
OPENAI_API_KEY=sk-your-openai-key
VITE_APP_URL=https://funkmybrand.com
```

### 5. **Test Your Deployment**

Visit https://funkmybrand.com and test:

- ✅ **Homepage loads** correctly
- ✅ **User registration** works
- ✅ **File upload** functionality
- ✅ **Brand generation** (AI features)
- ✅ **CV generation** works
- ✅ **Export features** (PDF/PNG)
- ✅ **Admin panel** accessible (if you're an admin)

## 🔧 Troubleshooting

### **Site doesn't load**
- Check if .htaccess file is present
- Verify all files are in the root directory
- Check Spaceship hosting logs

### **AI features don't work**
- Verify OpenAI API key is set: `supabase secrets list`
- Check you have credits in your OpenAI account
- Ensure functions are deployed: `supabase functions list`

### **404 errors on page refresh**
- Make sure .htaccess file is uploaded and working
- Check Apache mod_rewrite is enabled on your hosting

### **CORS errors**
- Add funkmybrand.com to your Supabase allowed origins
- Check Supabase dashboard → Settings → API

## 💰 Monthly Costs

Your new setup costs:
- **Supabase Pro**: $25/month
- **OpenAI API**: $3-15/month (usage-based)
- **Spaceship Hosting**: Your existing plan
- **Total**: ~$30-45/month

## 🎉 You're Live!

Once deployed, your FunkMyBrand will be live at:
**https://funkmybrand.com**

Share it with the world! 🎸

## 🆘 Need Help?

- Check the logs in your Spaceship control panel
- Test individual functions in Supabase dashboard
- Verify environment variables are set correctly
- Contact Spaceship support if hosting issues persist

---

**FunkMyBrand** - Funk up your professional presence! 🚀