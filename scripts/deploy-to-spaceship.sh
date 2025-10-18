#!/bin/bash

# Deploy FunkMyBrand to Spaceship Hosting
# For funkmybrand.com

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Configuration
DOMAIN="funkmybrand.com"
DEPLOYMENT_NAME="funkmybrand-$(date +%Y%m%d_%H%M%S)"
BACKUP_DIR="deployments"

print_status "🚀 Starting deployment to $DOMAIN"

# Step 1: Validate environment
print_status "📋 Validating environment..."

if [ ! -f "package.json" ]; then
    print_error "package.json not found. Are you in the project root?"
    exit 1
fi

if [ ! -f ".env.production" ]; then
    print_warning ".env.production not found. Make sure environment variables are set correctly."
fi

# Step 2: Run tests and validation
print_status "🧪 Running tests and validation..."

if ! npm run test:run; then
    print_error "Tests failed. Aborting deployment."
    exit 1
fi

if ! npm run validate:deployment; then
    print_error "Deployment validation failed. Please fix issues before deploying."
    exit 1
fi

print_success "All tests and validations passed!"

# Step 3: Build the application
print_status "📦 Building application for production..."

# Clean previous build
rm -rf dist/

# Build with production environment
if ! npm run build; then
    print_error "Build failed. Please fix build errors."
    exit 1
fi

print_success "Build completed successfully!"

# Step 4: Prepare deployment package
print_status "📋 Preparing deployment package..."

# Create backup directory
mkdir -p $BACKUP_DIR

# Copy .htaccess to dist folder
cp .htaccess dist/

# Create deployment package
cd dist
zip -r "../$BACKUP_DIR/$DEPLOYMENT_NAME.zip" .
cd ..

print_success "Deployment package created: $BACKUP_DIR/$DEPLOYMENT_NAME.zip"

# Step 5: Generate deployment instructions
print_status "📝 Generating deployment instructions..."

cat > "$BACKUP_DIR/$DEPLOYMENT_NAME-instructions.txt" << EOF
Deployment Instructions for $DOMAIN
Generated: $(date)
Package: $DEPLOYMENT_NAME.zip

MANUAL DEPLOYMENT STEPS:

1. Login to your Spaceship hosting control panel
2. Navigate to File Manager for $DOMAIN
3. Backup current files (if any):
   - Download existing files as backup
   - Or rename current folder to 'backup-$(date +%Y%m%d)'

4. Upload the deployment package:
   - Upload $DEPLOYMENT_NAME.zip to your domain's public folder
   - Extract the zip file
   - Ensure all files are in the root of your public folder

5. Verify file structure:
   Your public folder should contain:
   - index.html
   - assets/ folder
   - .htaccess file
   - Other static files

6. Test the deployment:
   - Visit https://$DOMAIN
   - Test user registration/login
   - Test file upload functionality
   - Test brand generation
   - Test CV generation
   - Test export features

7. Monitor for issues:
   - Check browser console for errors
   - Monitor server logs if available
   - Test on different devices/browsers

ENVIRONMENT VARIABLES:
Make sure these are set in your Supabase project:
- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- LOVABLE_API_KEY
- VITE_APP_URL=https://$DOMAIN

ROLLBACK PLAN:
If issues occur:
1. Restore from backup files
2. Or re-upload previous working version
3. Check DNS/SSL settings
4. Contact Spaceship support if needed

NEXT STEPS AFTER DEPLOYMENT:
1. Update DNS if needed (A record to Spaceship IP)
2. Verify SSL certificate is active
3. Set up monitoring/analytics
4. Update any external service URLs
5. Notify users of the new deployment

EOF

# Step 6: Create FTP deployment script (optional)
if [ ! -z "$FTP_HOST" ] && [ ! -z "$FTP_USER" ]; then
    print_status "📡 Creating FTP deployment script..."
    
    cat > "$BACKUP_DIR/$DEPLOYMENT_NAME-ftp-deploy.sh" << EOF
#!/bin/bash
# Automated FTP deployment script
# Configure these variables before running:

FTP_HOST="$FTP_HOST"
FTP_USER="$FTP_USER"
FTP_PASS="$FTP_PASS"  # Set this environment variable
REMOTE_PATH="/public_html"

if [ -z "\$FTP_PASS" ]; then
    echo "Please set FTP_PASS environment variable"
    exit 1
fi

echo "🚀 Deploying via FTP to $DOMAIN"

# Upload using lftp (install with: brew install lftp or apt-get install lftp)
lftp -c "
set ftp:ssl-allow no;
open ftp://\$FTP_USER:\$FTP_PASS@\$FTP_HOST;
lcd dist;
cd \$REMOTE_PATH;
mirror --reverse --delete --verbose;
bye
"

echo "✅ FTP deployment complete!"
EOF
    
    chmod +x "$BACKUP_DIR/$DEPLOYMENT_NAME-ftp-deploy.sh"
    print_success "FTP deployment script created (configure FTP credentials first)"
fi

# Step 7: Summary
print_success "🎉 Deployment preparation complete!"
echo ""
echo "📦 Deployment package: $BACKUP_DIR/$DEPLOYMENT_NAME.zip"
echo "📝 Instructions: $BACKUP_DIR/$DEPLOYMENT_NAME-instructions.txt"
echo ""
echo "NEXT STEPS:"
echo "1. Upload the zip file to your Spaceship hosting"
echo "2. Extract it to your domain's public folder"
echo "3. Follow the detailed instructions in the generated file"
echo "4. Test the deployment at https://$DOMAIN"
echo ""
echo "🔧 IMPORTANT:"
echo "- Ensure .htaccess is in place for SPA routing"
echo "- Verify SSL certificate is active"
echo "- Test all functionality after deployment"
echo "- Keep the deployment package as backup"
echo ""

# Step 8: Open instructions file (if on macOS/Linux with GUI)
if command -v open &> /dev/null; then
    print_status "Opening deployment instructions..."
    open "$BACKUP_DIR/$DEPLOYMENT_NAME-instructions.txt"
elif command -v xdg-open &> /dev/null; then
    print_status "Opening deployment instructions..."
    xdg-open "$BACKUP_DIR/$DEPLOYMENT_NAME-instructions.txt"
fi

print_success "Deployment script completed successfully! 🚀"