# Spaceship Hosting Deployment Guide
## Deploy to funkmybrand.com with Full Control

This guide covers deploying your Personal Brand Generator to your Spaceship hosting plan while keeping Supabase separate.

## Overview

**Domain**: funkmybrand.com  
**Hosting**: Spaceship.com  
**Backend**: Self-managed Supabase  
**Deployment**: Static files + optional Node.js server

## Step 1: Prepare Your Build

### 1.1 Update Environment Variables
Create `.env.production`:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
LOVABLE_API_KEY=your-lovable-api-key
VITE_APP_URL=https://funkmybrand.com
```

### 1.2 Build for Production
```bash
# Install dependencies
npm ci

# Run tests
npm run test:run

# Validate deployment
npm run validate:deployment

# Build for production
npm run build
```

This creates a `dist/` folder with your static files.

## Step 2: Spaceship Hosting Setup Options

### Option A: Static Hosting (Recommended)

If your Spaceship plan supports static hosting:

1. **Upload Files**
   - Zip your `dist/` folder
   - Upload via Spaceship file manager
   - Extract to your domain's public folder

2. **Configure Web Server**
   - Ensure SPA routing works (see nginx config below)
   - Set up HTTPS (usually automatic with Spaceship)

### Option B: Node.js Hosting

If your plan includes Node.js support:

1. **Upload Full Project**
   - Upload entire project folder
   - Install dependencies on server
   - Configure start script

## Step 3: Web Server Configuration

### For Apache (.htaccess)
Create `.htaccess` in your dist folder:
```apache
RewriteEngine On
RewriteBase /

# Handle client-side routing
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]

# Security headers
Header always set X-Frame-Options "DENY"
Header always set X-XSS-Protection "1; mode=block"
Header always set X-Content-Type-Options "nosniff"
Header always set Referrer-Policy "strict-origin-when-cross-origin"

# Cache static assets
<FilesMatch "\.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$">
    ExpiresActive On
    ExpiresDefault "access plus 1 year"
    Header set Cache-Control "public, immutable"
</FilesMatch>

# Gzip compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
</IfModule>
```

### For Nginx
If you have nginx access:
```nginx
server {
    listen 80;
    server_name funkmybrand.com www.funkmybrand.com;
    root /path/to/your/dist;
    index index.html;

    # Redirect www to non-www
    if ($host = www.funkmybrand.com) {
        return 301 https://funkmybrand.com$request_uri;
    }

    # Handle client-side routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/css application/javascript application/json;
}
```

## Step 4: Deployment Scripts

### Automated Deployment Script
```bash
#!/bin/bash
# deploy-to-spaceship.sh

echo "🚀 Deploying to funkmybrand.com"

# Build the application
echo "📦 Building application..."
npm run build

# Create deployment package
echo "📋 Creating deployment package..."
cd dist
zip -r ../funkmybrand-deployment.zip .
cd ..

echo "✅ Deployment package created: funkmybrand-deployment.zip"
echo ""
echo "Next steps:"
echo "1. Upload funkmybrand-deployment.zip to your Spaceship hosting"
echo "2. Extract to your domain's public folder"
echo "3. Ensure .htaccess is in place for SPA routing"
echo "4. Test the deployment at https://funkmybrand.com"
```

### FTP Deployment (if available)
```bash
#!/bin/bash
# ftp-deploy.sh

# Configuration
FTP_HOST="your-spaceship-ftp-host"
FTP_USER="your-ftp-username"
FTP_PASS="your-ftp-password"
REMOTE_PATH="/public_html"

echo "🚀 Deploying via FTP to funkmybrand.com"

# Build first
npm run build

# Upload using lftp (install with: brew install lftp)
lftp -c "
set ftp:ssl-allow no;
open ftp://$FTP_USER:$FTP_PASS@$FTP_HOST;
lcd dist;
cd $REMOTE_PATH;
mirror --reverse --delete --verbose;
bye
"

echo "✅ FTP deployment complete!"
```

## Step 5: Supabase Configuration

### 5.1 Set Up Independent Supabase
```bash
# Create new Supabase project
supabase projects create funkmybrand

# Link to project
supabase link --project-ref YOUR_PROJECT_REF

# Deploy schema and functions
supabase db push
supabase functions deploy generate-style
supabase functions deploy generate-visual
supabase functions deploy generate-brand-rider
supabase functions deploy generate-cv

# Set secrets
supabase secrets set LOVABLE_API_KEY=your-api-key
```

### 5.2 Update CORS Settings
In Supabase dashboard, add your domain to allowed origins:
- `https://funkmybrand.com`
- `https://www.funkmybrand.com`

## Step 6: Domain Configuration

### DNS Settings
Point your domain to Spaceship hosting:
```
A Record: @ -> [Spaceship IP]
CNAME: www -> funkmybrand.com
```

### SSL Certificate
- Most Spaceship plans include free SSL
- Verify HTTPS is working after deployment
- Set up automatic renewal if needed

## Step 7: Monitoring and Maintenance

### Error Tracking
Add to your environment:
```env
VITE_SENTRY_DSN=your-sentry-dsn
```

### Performance Monitoring
```javascript
// Add to main.tsx
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

function sendToAnalytics(metric) {
  // Send to your analytics service
  console.log(metric);
}

getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);
```

## Step 8: Backup Strategy

### Automated Backups
```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="backups/$DATE"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup built files
cp -r dist/ $BACKUP_DIR/

# Backup source code
git archive --format=zip --output=$BACKUP_DIR/source.zip HEAD

# Backup database (Supabase)
supabase db dump --file=$BACKUP_DIR/database.sql

echo "✅ Backup created: $BACKUP_DIR"
```

## Step 9: Deployment Checklist

### Pre-Deployment
- [ ] Environment variables updated
- [ ] Build completes successfully
- [ ] Tests pass
- [ ] Supabase functions deployed
- [ ] Domain DNS configured

### Deployment
- [ ] Files uploaded to Spaceship
- [ ] .htaccess configured for SPA routing
- [ ] HTTPS working
- [ ] All pages load correctly
- [ ] API calls working

### Post-Deployment
- [ ] User registration works
- [ ] File upload works
- [ ] Brand generation works
- [ ] CV generation works
- [ ] Export functionality works
- [ ] Sharing works
- [ ] Admin panel accessible

## Troubleshooting

### Common Issues

#### SPA Routing Not Working
- Ensure .htaccess is in place
- Check Apache mod_rewrite is enabled
- Verify file permissions

#### API Calls Failing
- Check CORS settings in Supabase
- Verify environment variables
- Check network connectivity

#### Slow Loading
- Enable gzip compression
- Optimize images
- Use CDN for static assets

#### SSL Issues
- Contact Spaceship support
- Verify domain ownership
- Check DNS propagation

## Cost Breakdown

### Monthly Costs
- **Spaceship Hosting**: $X/month (your existing plan)
- **Supabase Pro**: $25/month
- **Domain**: Already owned
- **Total**: ~$25-35/month

### Benefits
- ✅ Complete control over hosting
- ✅ Custom domain already owned
- ✅ No vendor lock-in for frontend
- ✅ Flexible deployment options
- ✅ Direct server access

## Next Steps

1. **Run the migration script**: `node scripts/migrate-from-vercel.js`
2. **Set up Supabase project independently**
3. **Build and test locally**: `npm run build && npm run preview`
4. **Deploy to Spaceship using your preferred method**
5. **Configure domain and SSL**
6. **Test all functionality**

Your setup gives you maximum control while keeping costs reasonable. Need help with any specific step?