# PowerShell Deployment Script for FunkMyBrand
# Deploy to funkmybrand.com

param(
    [switch]$SkipTests = $false,
    [switch]$SkipValidation = $false
)

# Colors for output
$Colors = @{
    Red = "Red"
    Green = "Green"
    Yellow = "Yellow"
    Blue = "Blue"
    White = "White"
}

function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor $Colors.Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor $Colors.Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor $Colors.Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor $Colors.Red
}

# Configuration
$Domain = "funkmybrand.com"
$DeploymentName = "funkmybrand-$(Get-Date -Format 'yyyyMMdd_HHmmss')"
$BackupDir = "deployments"

Write-Status "🚀 Starting deployment to $Domain"

# Step 1: Validate environment
Write-Status "📋 Validating environment..."

if (-not (Test-Path "package.json")) {
    Write-Error "package.json not found. Are you in the project root?"
    exit 1
}

if (-not (Test-Path ".env.production")) {
    Write-Warning ".env.production not found. Make sure environment variables are set correctly."
}

# Step 2: Run tests and validation (unless skipped)
if (-not $SkipTests) {
    Write-Status "🧪 Running tests..."
    
    $testResult = npm run test:run
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Tests failed. Use -SkipTests to bypass or fix the issues."
        exit 1
    }
    Write-Success "Tests passed!"
}

if (-not $SkipValidation) {
    Write-Status "🔍 Running deployment validation..."
    
    $validationResult = npm run validate:deployment
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Deployment validation failed. Use -SkipValidation to bypass or fix the issues."
        exit 1
    }
    Write-Success "Validation passed!"
}

# Step 3: Build the application
Write-Status "📦 Building application for production..."

# Clean previous build
if (Test-Path "dist") {
    Remove-Item -Recurse -Force "dist"
}

# Build with production environment
$buildResult = npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Error "Build failed. Please fix build errors."
    exit 1
}

Write-Success "Build completed successfully!"

# Step 4: Prepare deployment package
Write-Status "📋 Preparing deployment package..."

# Create backup directory
if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir | Out-Null
}

# Copy .htaccess to dist folder
Copy-Item ".htaccess" "dist\" -Force

# Create deployment package
$zipPath = "$BackupDir\$DeploymentName.zip"
Compress-Archive -Path "dist\*" -DestinationPath $zipPath -Force

Write-Success "Deployment package created: $zipPath"

# Step 5: Generate deployment instructions
Write-Status "📝 Generating deployment instructions..."

$instructionsPath = "$BackupDir\$DeploymentName-instructions.txt"
$instructions = "Deployment Instructions for $Domain
Generated: $(Get-Date)
Package: $DeploymentName.zip

MANUAL DEPLOYMENT STEPS:

1. Login to your Spaceship hosting control panel
2. Navigate to File Manager for $Domain
3. Backup current files (if any)
4. Upload $DeploymentName.zip to your domain's public folder
5. Extract the zip file
6. Ensure all files are in the root of your public folder

ENVIRONMENT VARIABLES:
Make sure these are set in your Supabase project:
- VITE_SUPABASE_URL
- VITE_SUPABASE_PUBLISHABLE_KEY
- SUPABASE_SERVICE_ROLE_KEY
- OPENAI_API_KEY
- VITE_APP_URL=https://$Domain

Test at: https://$Domain"

Set-Content -Path $instructionsPath -Value $instructions

# Step 6: Summary
Write-Success "🎉 Deployment preparation complete!"
Write-Host ""
Write-Host "📦 Deployment package: $zipPath" -ForegroundColor $Colors.White
Write-Host "📝 Instructions: $instructionsPath" -ForegroundColor $Colors.White
Write-Host ""
Write-Host "NEXT STEPS:" -ForegroundColor $Colors.Yellow
Write-Host "1. Upload the zip file to your Spaceship hosting" -ForegroundColor $Colors.White
Write-Host "2. Extract it to your domain's public folder" -ForegroundColor $Colors.White
Write-Host "3. Follow the detailed instructions in the generated file" -ForegroundColor $Colors.White
Write-Host "4. Test the deployment at https://$Domain" -ForegroundColor $Colors.White
Write-Host ""
Write-Host "🔧 IMPORTANT:" -ForegroundColor $Colors.Yellow
Write-Host "- Ensure .htaccess is in place for SPA routing" -ForegroundColor $Colors.White
Write-Host "- Verify SSL certificate is active" -ForegroundColor $Colors.White
Write-Host "- Test all functionality after deployment" -ForegroundColor $Colors.White
Write-Host "- Keep the deployment package as backup" -ForegroundColor $Colors.White
Write-Host ""

# Step 7: Open instructions file
if (Get-Command "notepad" -ErrorAction SilentlyContinue) {
    Write-Status "Opening deployment instructions..."
    Start-Process notepad $instructionsPath
}

Write-Success "Deployment script completed successfully! 🚀"