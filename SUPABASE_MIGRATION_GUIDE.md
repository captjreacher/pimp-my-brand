# Supabase Migration Guide
## Moving from Vercel-Managed to Self-Managed Supabase

This guide helps you migrate your Supabase instance from Vercel management to direct Supabase management while deploying your frontend elsewhere.

## Step 1: Export Current Supabase Configuration

### 1.1 Backup Current Database
```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link to your current project (get project ref from Vercel dashboard)
supabase link --project-ref YOUR_PROJECT_REF

# Generate migration from current state
supabase db diff --schema public --file initial_migration

# Pull current database schema
supabase db pull
```

### 1.2 Export Environment Variables
From your Vercel dashboard, export these variables:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY` 
- `SUPABASE_SERVICE_ROLE_KEY`
- `LOVABLE_API_KEY`

## Step 2: Create New Supabase Project (Optional)

If you want a completely fresh start:

```bash
# Create new Supabase project
supabase projects create your-project-name

# Initialize local development
supabase init

# Start local development
supabase start
```

## Step 3: Deploy Database Schema

### 3.1 Apply All Migrations
```bash
# Deploy all migrations to your Supabase project
supabase db push

# Deploy Edge Functions
supabase functions deploy generate-style
supabase functions deploy generate-visual  
supabase functions deploy generate-brand-rider
supabase functions deploy generate-cv

# Set function secrets
supabase secrets set LOVABLE_API_KEY=your-api-key
```

### 3.2 Set Up Storage
```bash
# Create storage bucket
supabase storage create uploads --public=false

# Set up storage policies (run in Supabase SQL editor)
```

## Step 4: Update Frontend Configuration

### 4.1 Update Environment Variables
Create `.env.production` with your new Supabase credentials:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-new-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-new-service-role-key
LOVABLE_API_KEY=your-lovable-api-key
VITE_APP_URL=https://your-new-domain.com
```

## Step 5: Choose Frontend Hosting Platform

### Option A: Netlify (Recommended)
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build and deploy
npm run build
netlify deploy --prod --dir=dist

# Set environment variables
netlify env:set VITE_SUPABASE_URL https://your-project.supabase.co
netlify env:set VITE_SUPABASE_ANON_KEY your-anon-key
netlify env:set LOVABLE_API_KEY your-lovable-api-key
```

### Option B: Railway
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway link
railway up
```

### Option C: DigitalOcean App Platform
1. Connect your GitHub repo
2. Set build command: `npm run build`
3. Set output directory: `dist`
4. Add environment variables in dashboard

### Option D: Self-Hosted with Docker
```bash
# Build Docker image
docker build -t personal-brand-generator .

# Run container
docker run -p 80:80 \
  -e VITE_SUPABASE_URL=https://your-project.supabase.co \
  -e VITE_SUPABASE_ANON_KEY=your-anon-key \
  personal-brand-generator
```

## Step 6: Data Migration (If Needed)

If you're moving to a new Supabase project:

```sql
-- Export data from old project
COPY profiles TO '/tmp/profiles.csv' WITH CSV HEADER;
COPY brands TO '/tmp/brands.csv' WITH CSV HEADER;
COPY cvs TO '/tmp/cvs.csv' WITH CSV HEADER;
-- ... other tables

-- Import to new project
COPY profiles FROM '/tmp/profiles.csv' WITH CSV HEADER;
COPY brands FROM '/tmp/brands.csv' WITH CSV HEADER;
COPY cvs FROM '/tmp/cvs.csv' WITH CSV HEADER;
-- ... other tables
```

## Step 7: Update DNS and Domain

1. Update your domain DNS to point to new hosting platform
2. Set up SSL certificate (most platforms handle this automatically)
3. Update CORS settings in Supabase dashboard if needed

## Step 8: Validation and Testing

```bash
# Run deployment validation
npm run validate:deployment

# Test all functionality
npm run test:e2e

# Monitor for errors
# Check Supabase logs
# Check hosting platform logs
```

## Benefits of This Migration

### ✅ More Control
- Direct access to Supabase dashboard
- Full control over database migrations
- Custom backup strategies
- Advanced monitoring and alerting

### ✅ Cost Optimization  
- Choose hosting platform based on your needs
- Separate billing for database vs hosting
- Better resource allocation

### ✅ Flexibility
- Easy to switch hosting platforms
- Custom deployment pipelines
- Advanced caching strategies

### ✅ Performance
- Choose hosting closer to your users
- Custom CDN configuration
- Optimized build processes

## Rollback Plan

If issues arise:

1. **Quick Rollback**: Point DNS back to Vercel temporarily
2. **Database Rollback**: Restore from backup if needed
3. **Gradual Migration**: Use feature flags to gradually move users

## Monitoring Setup

### Supabase Monitoring
- Set up alerts for database performance
- Monitor Edge Function execution times
- Track storage usage

### Frontend Monitoring
- Set up error tracking (Sentry)
- Monitor Core Web Vitals
- Track user analytics

## Maintenance Schedule

### Weekly
- Review error logs
- Check performance metrics
- Monitor costs

### Monthly  
- Update dependencies
- Review security settings
- Optimize performance

### Quarterly
- Full security audit
- Backup testing
- Infrastructure review