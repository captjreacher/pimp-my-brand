# AI Features Deployment Checklist

This checklist ensures all AI content generation features are properly deployed and configured.

## Pre-Deployment Requirements

### ✅ Environment Variables
- [ ] `VITE_SUPABASE_URL` - Your Supabase project URL
- [ ] `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (server-side only)
- [ ] `VITE_OPENAI_API_KEY` - OpenAI API key (required for AI features)
- [ ] `VITE_ELEVENLABS_API_KEY` - ElevenLabs API key (optional, for voice synthesis)

### ✅ API Keys Setup

#### OpenAI API Key
1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create a new API key
3. Add billing information and set usage limits
4. Copy the key (starts with `sk-`)

#### ElevenLabs API Key (Optional)
1. Go to [ElevenLabs](https://elevenlabs.io/)
2. Sign up and go to Profile Settings
3. Copy your API key
4. Note: This is optional - voice synthesis will fall back to OpenAI TTS

### ✅ Database Migrations
- [ ] AI content generation tables migration applied
- [ ] AI moderation and analytics tables migration applied
- [ ] All new tables have proper RLS policies
- [ ] Storage bucket for AI-generated assets configured

## Deployment Steps

### 1. Run Pre-Deployment Validation

```bash
# Run the AI features deployment script
node scripts/deploy-ai-features.js
```

This script will:
- ✅ Validate all environment variables
- ✅ Check Supabase connection
- ✅ Apply database migrations
- ✅ Validate AI tables exist
- ✅ Build the application
- ✅ Run tests

### 2. Deploy Database Changes

```bash
# Navigate to supabase directory
cd supabase

# Apply migrations to production
supabase db push --linked

# Verify migrations were applied
supabase db diff --linked
```

### 3. Deploy Application

#### Option A: Vercel
```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Deploy to production
vercel --prod

# Set environment variables
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY  
vercel env add VITE_OPENAI_API_KEY
vercel env add VITE_ELEVENLABS_API_KEY
```

#### Option B: Netlify
```bash
# Install Netlify CLI if not already installed
npm i -g netlify-cli

# Build the application
npm run build

# Deploy to production
netlify deploy --prod --dir=dist

# Set environment variables
netlify env:set VITE_SUPABASE_URL "your-supabase-url"
netlify env:set VITE_SUPABASE_ANON_KEY "your-anon-key"
netlify env:set VITE_OPENAI_API_KEY "your-openai-key"
netlify env:set VITE_ELEVENLABS_API_KEY "your-elevenlabs-key"
```

#### Option C: Custom Server
```bash
# Build the application
npm run build

# Copy build files to your server
scp -r dist/* user@your-server:/var/www/html/

# Configure environment variables on your server
# (method depends on your server setup)
```

## Post-Deployment Verification

### ✅ Functional Testing

#### AI Content Generation
- [ ] Image generation works with OpenAI DALL-E
- [ ] Voice synthesis works (OpenAI TTS or ElevenLabs)
- [ ] Video generation pipeline functions
- [ ] Content moderation flags inappropriate content
- [ ] Background job processing works for heavy operations

#### Admin Features
- [ ] Admin can access AI Content Management page (`/admin/ai-content`)
- [ ] Content moderation queue shows flagged items
- [ ] Usage analytics display correctly
- [ ] Performance dashboard shows metrics
- [ ] Background jobs monitor displays active jobs

#### User Experience
- [ ] AI features are accessible from main interface
- [ ] Loading states show during AI processing
- [ ] Error handling works gracefully
- [ ] Generated content displays properly
- [ ] Export functionality includes AI-generated content

### ✅ Performance Testing
- [ ] AI generation requests complete within reasonable time (< 30s)
- [ ] Background jobs process without blocking UI
- [ ] CDN caching reduces repeated generation costs
- [ ] Performance metrics are being recorded

### ✅ Security Testing
- [ ] Content moderation prevents inappropriate content
- [ ] API keys are not exposed in client-side code
- [ ] RLS policies prevent unauthorized access to AI data
- [ ] File uploads are properly validated and secured

## Monitoring Setup

### ✅ Cost Monitoring
- [ ] OpenAI usage dashboard configured
- [ ] ElevenLabs usage monitoring (if used)
- [ ] Set up billing alerts for AI API usage
- [ ] Monitor cost per user/request in admin analytics

### ✅ Performance Monitoring
- [ ] AI request response times tracked
- [ ] Success/failure rates monitored
- [ ] Background job completion rates tracked
- [ ] Cache hit rates monitored

### ✅ Error Monitoring
- [ ] AI API failures logged and alerted
- [ ] Content moderation errors tracked
- [ ] Background job failures monitored
- [ ] User-facing error handling tested

## Troubleshooting

### Common Issues

#### AI Generation Not Working
1. Check OpenAI API key is valid and has credits
2. Verify environment variables are set correctly
3. Check Supabase connection and table permissions
4. Review browser console for JavaScript errors

#### Content Moderation Issues
1. Verify OpenAI moderation API access
2. Check moderation logs in admin panel
3. Ensure RLS policies allow admin access to moderation data

#### Performance Issues
1. Check if background job processing is working
2. Verify CDN caching is functioning
3. Monitor database query performance
4. Check AI API response times

#### Admin Panel Issues
1. Verify admin user has proper permissions
2. Check if AI tables were created successfully
3. Ensure admin routes are properly configured

### Support Resources

- **OpenAI Documentation**: https://platform.openai.com/docs
- **ElevenLabs Documentation**: https://docs.elevenlabs.io/
- **Supabase Documentation**: https://supabase.com/docs
- **Project Repository**: [Your repository URL]

## Rollback Plan

If issues occur after deployment:

### 1. Quick Rollback
```bash
# Vercel
vercel rollback

# Netlify  
netlify rollback

# Custom server
# Restore previous build from backup
```

### 2. Database Rollback (if needed)
```bash
# Reset to previous migration
supabase db reset --linked
# Re-apply previous migrations
supabase db push --linked
```

### 3. Disable AI Features
If AI features are causing issues, you can temporarily disable them by:
1. Removing `VITE_OPENAI_API_KEY` environment variable
2. The app will gracefully handle missing AI capabilities

## Success Criteria

✅ **Deployment is successful when:**
- [ ] All AI features work as expected
- [ ] Admin panel shows AI management interface
- [ ] Content moderation is active and working
- [ ] Performance metrics are being collected
- [ ] No critical errors in production logs
- [ ] API costs are within expected ranges
- [ ] User experience is smooth and responsive

---

**Deployment Date**: ___________
**Deployed By**: ___________
**Version**: ___________
**Notes**: ___________