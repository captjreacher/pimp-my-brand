# Deploy Missing Edge Functions
# This script deploys all the required Edge Functions to Supabase

Write-Host "🚀 Deploying Edge Functions to Supabase..." -ForegroundColor Green

# Check if supabase CLI is available
if (!(Get-Command "supabase" -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Supabase CLI not found. Please install it first:" -ForegroundColor Red
    Write-Host "npm install -g supabase" -ForegroundColor Yellow
    exit 1
}

# Deploy all functions
$functions = @(
    "generate-style",
    "generate-visual", 
    "generate-brand-rider",
    "generate-logo",
    "generate-cv"
)

foreach ($func in $functions) {
    Write-Host "📦 Deploying $func..." -ForegroundColor Blue
    try {
        supabase functions deploy $func
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ $func deployed successfully" -ForegroundColor Green
        } else {
            Write-Host "❌ Failed to deploy $func" -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ Error deploying $func : $_" -ForegroundColor Red
    }
}

Write-Host "`n🎉 Deployment complete!" -ForegroundColor Green
Write-Host "Now test the brand generation in your app." -ForegroundColor Yellow