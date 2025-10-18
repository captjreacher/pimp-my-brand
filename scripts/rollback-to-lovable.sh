#!/bin/bash

# Rollback from OpenAI to Lovable AI Gateway
# This script restores the original Lovable functions

set -e

echo "🔄 Rolling back to Lovable AI Gateway..."

# Check if backup exists
if [ ! -d "backups/lovable-functions" ]; then
    echo "❌ No backup found. Cannot rollback."
    exit 1
fi

# Step 1: Remove OpenAI functions
echo "🗑️ Removing OpenAI functions..."
rm -rf supabase/functions/generate-style
rm -rf supabase/functions/generate-visual
rm -rf supabase/functions/generate-brand-rider
rm -rf supabase/functions/generate-cv

# Step 2: Restore Lovable functions
echo "📦 Restoring Lovable functions..."
cp -r backups/lovable-functions/* supabase/functions/

echo "✅ Functions restored"

# Step 3: Restore environment variables
echo "🔧 Restoring environment variables..."

# Restore .env.production
if [ -f ".env.production.bak" ]; then
    mv .env.production.bak .env.production
fi

# Restore .env.example
if [ -f ".env.example.bak" ]; then
    mv .env.example.bak .env.example
fi

echo "✅ Environment variables restored"

# Step 4: Deploy restored functions
echo "🚀 Deploying restored functions to Supabase..."

supabase functions deploy generate-style
supabase functions deploy generate-visual
supabase functions deploy generate-brand-rider
supabase functions deploy generate-cv

echo ""
echo "🎉 Rollback to Lovable AI Gateway complete!"
echo ""
echo "NEXT STEPS:"
echo "1. Set the Lovable secret: supabase secrets set LOVABLE_API_KEY=your-key"
echo "2. Update your .env.production file with the Lovable key"
echo "3. Test the AI functions"