# Production Deployment Guide

This guide covers the complete deployment process for FunkMyBrand application.

## Pre-Deployment Checklist

### 1. Environment Configuration

#### Required Environment Variables
```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AI Integration
LOVABLE_API_KEY=your-lovable-api-key

# Optional Configuration
VITE_APP_URL=https://your-domain.com
VITE_SENTRY_DSN=your-sentry-dsn
```

#### Environment Variable Validation
- ✅ All required variables are set
- ✅ URLs use HTTPS in production
- ✅ API keys are valid and have proper permissions
- ✅ No sensitive data in client-side variables

### 2. Supabase Configuration

#### Database Schema
Ensure all required tables exist:
- ✅ `profiles` - User profile information
- ✅ `brands` - Brand rider data
- ✅ `cvs` - CV data
- ✅ `uploads` - File upload records
- ✅ `shares` - Sharing tokens
- ✅ `subscriptions` - User subscription data

#### Row Level Security (RLS)
Verify RLS policies are enabled and configured:
- ✅ `brands` table has proper user isolation
- ✅ `cvs` table has proper user isolation
- ✅ `uploads` table has proper user isolation
- ✅ `shares` table allows public read for valid tokens
- ✅ `profiles` table has proper access controls

#### Storage Buckets
Ensure storage buckets are configured:
- ✅ `uploads` bucket exists
- ✅ Proper file size limits (10MB max)
- ✅ Allowed file types: PDF, DOCX, TXT, JPG, PNG
- ✅ Public access policies for shared content

#### Supabase Functions
Verify all Edge Functions are deployed:
- ✅ `generate-style` - Style analysis function
- ✅ `generate-visual` - Visual identity generation
- ✅ `generate-brand-rider` - Brand rider assembly
- ✅ `generate-cv` - CV generation function

### 3. Build Configuration

#### Build Process
```bash
# Install dependencies
npm install

# Run tests
npm run test

# Build for production
npm run build

# Preview production build
npm run preview
```

#### Build Validation
- ✅ No TypeScript errors
- ✅ All tests passing
- ✅ Build completes successfully
- ✅ Bundle size is optimized
- ✅ All assets are properly referenced

### 4. Security Configuration

#### File Security
- ✅ `.env` files are in `.gitignore`
- ✅ No sensitive data in client-side code
- ✅ File upload validation is enabled
- ✅ File size limits are enforced
- ✅ File type validation is active

#### API Security
- ✅ RLS policies prevent unauthorized access
- ✅ API rate limiting is configured
- ✅ CORS is properly configured
- ✅ Authentication is required for protected routes

### 5. Performance Optimization

#### Code Splitting
- ✅ Lazy loading for route components
- ✅ Dynamic imports for heavy libraries
- ✅ Optimized bundle chunks

#### Caching Strategy
- ✅ Static assets have proper cache headers
- ✅ API responses are cached appropriately
- ✅ Service worker is configured (if applicable)

#### Image Optimization
- ✅ Images are optimized and compressed
- ✅ Responsive images for different screen sizes
- ✅ Lazy loading for images

## Deployment Steps

### 1. Pre-Deployment Validation

Run the deployment validation script:
```bash
node scripts/deployment-validation.js
```

This script will check:
- Environment variables
- Supabase connection and configuration
- Database schema and RLS policies
- Storage buckets and permissions
- Edge Functions deployment
- Build configuration
- Security settings

### 2. Supabase Deployment

#### Deploy Database Migrations
```bash
# Navigate to supabase directory
cd supabase

# Deploy migrations
supabase db push

# Verify deployment
supabase db diff
```

#### Deploy Edge Functions
```bash
# Deploy all functions
supabase functions deploy generate-style
supabase functions deploy generate-visual
supabase functions deploy generate-brand-rider
supabase functions deploy generate-cv

# Set environment variables for functions
supabase secrets set LOVABLE_API_KEY=your-api-key
```

#### Configure Storage
```bash
# Create storage buckets (if not exists)
supabase storage create uploads

# Set bucket policies
supabase storage update uploads --public=false
```

### 3. Frontend Deployment

#### Build Application
```bash
# Clean previous builds
rm -rf dist

# Install dependencies
npm ci

# Run tests
npm run test

# Build for production
npm run build
```

#### Deploy to Hosting Platform

##### Vercel Deployment
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Set environment variables
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
vercel env add VITE_APP_URL
```

##### Netlify Deployment
```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod --dir=dist

# Set environment variables
netlify env:set VITE_SUPABASE_URL your-url
netlify env:set VITE_SUPABASE_ANON_KEY your-key
```

##### Custom Server Deployment
```bash
# Copy build files to server
scp -r dist/* user@server:/var/www/html/

# Configure web server (nginx/apache)
# Ensure proper HTTPS configuration
# Set up proper cache headers
```

### 4. Post-Deployment Verification

#### Functional Testing
- ✅ User registration and authentication works
- ✅ File upload and processing works
- ✅ Brand generation workflow completes
- ✅ CV generation workflow completes
- ✅ Editing functionality works
- ✅ Export (PDF/PNG) functionality works
- ✅ Sharing functionality works
- ✅ Gallery displays public content

#### Performance Testing
- ✅ Page load times are acceptable (< 3s)
- ✅ File upload handles large files properly
- ✅ AI generation completes within reasonable time
- ✅ Export generation is performant

#### Security Testing
- ✅ Unauthorized access is properly blocked
- ✅ File upload security is working
- ✅ Shared content access is properly controlled
- ✅ No sensitive data is exposed in client

#### Accessibility Testing
- ✅ Screen reader compatibility
- ✅ Keyboard navigation works
- ✅ Color contrast meets WCAG AA standards
- ✅ Focus indicators are visible

## Monitoring and Maintenance

### 1. Error Monitoring

#### Sentry Configuration (Optional)
```javascript
// Add to main.tsx
import * as Sentry from "@sentry/react";

if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: "production"
  });
}
```

#### Supabase Monitoring
- Monitor Edge Function execution times
- Track database performance
- Monitor storage usage
- Set up alerts for errors

### 2. Performance Monitoring

#### Web Vitals
- Core Web Vitals tracking
- Page load performance
- User interaction metrics

#### API Performance
- Function execution times
- Database query performance
- File processing times

### 3. Regular Maintenance

#### Weekly Tasks
- ✅ Review error logs
- ✅ Check performance metrics
- ✅ Monitor storage usage
- ✅ Review user feedback

#### Monthly Tasks
- ✅ Update dependencies
- ✅ Review security settings
- ✅ Analyze usage patterns
- ✅ Optimize performance

#### Quarterly Tasks
- ✅ Security audit
- ✅ Performance optimization
- ✅ Feature usage analysis
- ✅ Infrastructure review

## Rollback Procedures

### 1. Frontend Rollback
```bash
# Vercel
vercel rollback

# Netlify
netlify rollback

# Custom server
# Restore previous build from backup
```

### 2. Database Rollback
```bash
# Supabase
supabase db reset --linked
supabase db push --linked
```

### 3. Function Rollback
```bash
# Deploy previous version
supabase functions deploy function-name --legacy-bundle
```

## Troubleshooting

### Common Issues

#### Build Failures
- Check TypeScript errors
- Verify all dependencies are installed
- Check environment variables

#### Supabase Connection Issues
- Verify URL and API keys
- Check network connectivity
- Verify RLS policies

#### Function Deployment Issues
- Check function syntax
- Verify environment variables
- Check function logs

#### Performance Issues
- Check bundle size
- Verify caching configuration
- Monitor database queries

### Support Contacts

- **Technical Issues**: [Your support email]
- **Infrastructure**: [Your infrastructure team]
- **Security**: [Your security team]

## Changelog

### Version 1.0.0 (Initial Release)
- Complete brand generation workflow
- CV generation integration
- File upload and processing
- Export and sharing functionality
- Gallery and community features
- Comprehensive accessibility support
- Performance optimizations

---

**Last Updated**: [Current Date]
**Next Review**: [Review Date]