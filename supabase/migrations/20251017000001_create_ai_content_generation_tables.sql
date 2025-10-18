-- AI Content Generation System Database Schema
-- Migration: 20251017000001_create_ai_content_generation_tables.sql

-- Create custom types
CREATE TYPE template_type AS ENUM ('brand_rider', 'cv', 'presentation');
CREATE TYPE image_category AS ENUM ('avatars', 'backgrounds', 'logos', 'icons');
CREATE TYPE ai_feature_type AS ENUM ('image_generation', 'voice_synthesis', 'video_generation', 'advanced_editing');
CREATE TYPE generation_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled');
CREATE TYPE asset_type AS ENUM ('image', 'audio', 'video', 'document');
CREATE TYPE moderation_status AS ENUM ('pending', 'approved', 'rejected', 'flagged');

-- Templates table for admin template management
CREATE TABLE ai_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  type template_type NOT NULL,
  html_content TEXT NOT NULL,
  style_sheet TEXT,
  placeholders JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Placeholder images table for admin image management
CREATE TABLE placeholder_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename VARCHAR(255) NOT NULL,
  storage_path TEXT NOT NULL,
  category image_category NOT NULL,
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  ai_generated BOOLEAN DEFAULT false,
  generation_prompt TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI generation requests tracking table
CREATE TABLE ai_generation_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  feature ai_feature_type NOT NULL,
  provider VARCHAR(50) NOT NULL,
  prompt TEXT,
  options JSONB DEFAULT '{}',
  result_url TEXT,
  cost_cents INTEGER DEFAULT 0,
  processing_time_ms INTEGER,
  status generation_status DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Usage tracking table for subscription management
CREATE TABLE ai_usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  feature ai_feature_type NOT NULL,
  usage_count INTEGER DEFAULT 1,
  total_cost_cents INTEGER DEFAULT 0,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  subscription_tier VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Generated assets table
CREATE TABLE generated_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  asset_type asset_type NOT NULL,
  storage_path TEXT NOT NULL,
  generation_request_id UUID REFERENCES ai_generation_requests(id),
  metadata JSONB DEFAULT '{}',
  is_public BOOLEAN DEFAULT false,
  moderation_status moderation_status DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_ai_templates_type ON ai_templates(type);
CREATE INDEX idx_ai_templates_active ON ai_templates(is_active);
CREATE INDEX idx_placeholder_images_category ON placeholder_images(category);
CREATE INDEX idx_ai_generation_requests_user_id ON ai_generation_requests(user_id);
CREATE INDEX idx_ai_generation_requests_status ON ai_generation_requests(status);
CREATE INDEX idx_ai_usage_tracking_user_period ON ai_usage_tracking(user_id, period_start, period_end);
CREATE INDEX idx_generated_assets_user_id ON generated_assets(user_id);
CREATE INDEX idx_generated_assets_moderation ON generated_assets(moderation_status);

-- Enable RLS on all tables
ALTER TABLE ai_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE placeholder_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_generation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_assets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_templates (admin only for management)
CREATE POLICY "Admin can manage templates" ON ai_templates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can read active templates" ON ai_templates
  FOR SELECT USING (is_active = true);

-- RLS Policies for placeholder_images (admin only for management)
CREATE POLICY "Admin can manage placeholder images" ON placeholder_images
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can read placeholder images" ON placeholder_images
  FOR SELECT USING (true);

-- RLS Policies for ai_generation_requests (users can see their own)
CREATE POLICY "Users can manage their own AI requests" ON ai_generation_requests
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Admin can view all AI requests" ON ai_generation_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- RLS Policies for ai_usage_tracking (users can see their own)
CREATE POLICY "Users can view their own usage" ON ai_usage_tracking
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admin can view all usage" ON ai_usage_tracking
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- RLS Policies for generated_assets (users can see their own)
CREATE POLICY "Users can manage their own assets" ON generated_assets
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can view public assets" ON generated_assets
  FOR SELECT USING (is_public = true);

CREATE POLICY "Admin can view all assets" ON generated_assets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Create storage buckets for AI-generated content
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('ai-templates', 'ai-templates', false),
  ('placeholder-images', 'placeholder-images', true),
  ('generated-assets', 'generated-assets', false);

-- Storage policies for ai-templates bucket (admin only)
CREATE POLICY "Admin can upload templates" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'ai-templates' AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admin can manage template files" ON storage.objects
  FOR ALL USING (
    bucket_id = 'ai-templates' AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Storage policies for placeholder-images bucket (admin upload, public read)
CREATE POLICY "Admin can upload placeholder images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'placeholder-images' AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Anyone can view placeholder images" ON storage.objects
  FOR SELECT USING (bucket_id = 'placeholder-images');

-- Storage policies for generated-assets bucket (users can manage their own)
CREATE POLICY "Users can upload their own generated assets" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'generated-assets' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can manage their own generated assets" ON storage.objects
  FOR ALL USING (
    bucket_id = 'generated-assets' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );