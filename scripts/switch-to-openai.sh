#!/bin/bash

# Switch from Lovable AI Gateway to OpenAI
# This script replaces the AI functions with OpenAI versions

set -e

echo "🔄 Switching from Lovable AI Gateway to OpenAI..."

# Step 1: Backup existing functions
echo "📦 Backing up existing functions..."
mkdir -p backups/lovable-functions
cp -r supabase/functions/generate-style backups/lovable-functions/
cp -r supabase/functions/generate-visual backups/lovable-functions/
cp -r supabase/functions/generate-brand-rider backups/lovable-functions/
cp -r supabase/functions/generate-cv backups/lovable-functions/

echo "✅ Backup created in backups/lovable-functions/"

# Step 2: Replace functions with OpenAI versions
echo "🔄 Replacing functions with OpenAI versions..."

# Remove old functions
rm -rf supabase/functions/generate-style
rm -rf supabase/functions/generate-visual
rm -rf supabase/functions/generate-brand-rider
rm -rf supabase/functions/generate-cv

# Move OpenAI functions to replace them
mv supabase/functions/generate-style-openai supabase/functions/generate-style
mv supabase/functions/generate-visual-openai supabase/functions/generate-visual
mv supabase/functions/generate-brand-rider-openai supabase/functions/generate-brand-rider
mv supabase/functions/generate-cv-openai supabase/functions/generate-cv

echo "✅ Functions replaced with OpenAI versions"

# Step 3: Update environment variables
echo "🔧 Updating environment variables..."

# Update .env.production
sed -i.bak 's/LOVABLE_API_KEY/OPENAI_API_KEY/g' .env.production
sed -i.bak 's/your-lovable-api-key-here/your-openai-api-key-here/g' .env.production
sed -i.bak 's/get from Lovable dashboard/get from OpenAI dashboard/g' .env.production

# Update .env.example
sed -i.bak 's/LOVABLE_API_KEY/OPENAI_API_KEY/g' .env.example
sed -i.bak 's/your-lovable-api-key/your-openai-api-key/g' .env.example
sed -i.bak 's/https:\/\/lovable.dev\/dashboard/https:\/\/platform.openai.com\/api-keys/g' .env.example

echo "✅ Environment variables updated"

# Step 4: Deploy new functions
echo "🚀 Deploying new functions to Supabase..."

supabase functions deploy generate-style
supabase functions deploy generate-visual
supabase functions deploy generate-brand-rider
supabase functions deploy generate-cv

# Step 5: Set new environment variable
echo "🔐 Setting OpenAI API key..."
echo "Please run: supabase secrets set OPENAI_API_KEY=your-openai-api-key"

echo ""
echo "🎉 Migration to OpenAI complete!"
echo ""
echo "NEXT STEPS:"
echo "1. Get your OpenAI API key from: https://platform.openai.com/api-keys"
echo "2. Add credits to your OpenAI account"
echo "3. Set the secret: supabase secrets set OPENAI_API_KEY=your-key"
echo "4. Update your .env.production file with the OpenAI key"
echo "5. Test the AI functions"
echo ""
echo "COST COMPARISON:"
echo "- OpenAI GPT-4o-mini: ~$0.15 per 1M input tokens"
echo "- Estimated monthly cost: $3-15 for typical usage"
echo ""
echo "ROLLBACK:"
echo "If you need to rollback, run: bash scripts/rollback-to-lovable.sh"