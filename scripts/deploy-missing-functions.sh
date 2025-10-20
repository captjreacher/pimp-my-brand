#!/bin/bash
# Deploy Missing Edge Functions
# This script deploys all the required Edge Functions to Supabase

echo "🚀 Deploying Edge Functions to Supabase..."

# Check if supabase CLI is available
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first:"
    echo "npm install -g supabase"
    exit 1
fi

# Deploy all functions
functions=(
    "generate-style"
    "generate-visual" 
    "generate-brand-rider"
    "generate-logo"
    "generate-cv"
)

for func in "${functions[@]}"; do
    echo "📦 Deploying $func..."
    if supabase functions deploy "$func"; then
        echo "✅ $func deployed successfully"
    else
        echo "❌ Failed to deploy $func"
    fi
done

echo ""
echo "🎉 Deployment complete!"
echo "Now test the brand generation in your app."