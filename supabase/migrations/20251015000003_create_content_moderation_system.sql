-- Content Moderation System Migration
-- This migration creates the content moderation queue and related functions

-- Create content moderation queue table
CREATE TABLE IF NOT EXISTS content_moderation_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('brand', 'cv')),
  content_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  flagged_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  flag_reason TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'escalated')),
  priority INTEGER DEFAULT 1 CHECK (priority BETWEEN 1 AND 5), -- 1 = low, 5 = critical
  risk_score INTEGER DEFAULT 0 CHECK (risk_score BETWEEN 0 AND 100),
  moderator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  moderated_at TIMESTAMP WITH TIME ZONE,
  moderator_notes TEXT,
  auto_flagged BOOLEAN DEFAULT false,
  flagging_details JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_content_moderation_queue_status ON content_moderation_queue(status);
CREATE INDEX IF NOT EXISTS idx_content_moderation_queue_priority ON content_moderation_queue(priority DESC);
CREATE INDEX IF NOT EXISTS idx_content_moderation_queue_content_type ON content_moderation_queue(content_type);
CREATE INDEX IF NOT EXISTS idx_content_moderation_queue_user_id ON content_moderation_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_content_moderation_queue_created_at ON content_moderation_queue(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_moderation_queue_risk_score ON content_moderation_queue(risk_score DESC);
CREATE INDEX IF NOT EXISTS idx_content_moderation_queue_composite ON content_moderation_queue(status, priority DESC, created_at DESC);

-- Create content flagging reasons lookup table
CREATE TABLE IF NOT EXISTS content_flag_reasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reason_code VARCHAR(50) UNIQUE NOT NULL,
  reason_name VARCHAR(100) NOT NULL,
  description TEXT,
  severity INTEGER DEFAULT 1 CHECK (severity BETWEEN 1 AND 5),
  auto_flag_enabled BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default flag reasons
INSERT INTO content_flag_reasons (reason_code, reason_name, description, severity, auto_flag_enabled) VALUES
  ('inappropriate_content', 'Inappropriate Content', 'Content contains inappropriate or offensive material', 3, true),
  ('spam', 'Spam', 'Content appears to be spam or promotional', 2, true),
  ('copyright_violation', 'Copyright Violation', 'Content may violate copyright laws', 4, false),
  ('personal_info', 'Personal Information', 'Content contains sensitive personal information', 3, true),
  ('fake_information', 'Fake Information', 'Content contains false or misleading information', 3, false),
  ('harassment', 'Harassment', 'Content contains harassment or bullying', 4, false),
  ('violence', 'Violence', 'Content contains violent or threatening material', 5, true),
  ('adult_content', 'Adult Content', 'Content contains adult or sexual material', 4, true),
  ('hate_speech', 'Hate Speech', 'Content contains hate speech or discrimination', 5, true),
  ('malware', 'Malware/Security', 'Content may contain malicious software or security threats', 5, true)
ON CONFLICT (reason_code) DO NOTHING;

-- Function to flag content for moderation
CREATE OR REPLACE FUNCTION flag_content_for_moderation(
  p_content_type VARCHAR(20),
  p_content_id UUID,
  p_user_id UUID,
  p_flagged_by UUID DEFAULT NULL,
  p_flag_reason TEXT DEFAULT NULL,
  p_priority INTEGER DEFAULT 1,
  p_risk_score INTEGER DEFAULT 0,
  p_auto_flagged BOOLEAN DEFAULT false,
  p_flagging_details JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
  queue_id UUID;
  existing_entry UUID;
BEGIN
  -- Check if content is already in moderation queue
  SELECT id INTO existing_entry
  FROM content_moderation_queue
  WHERE content_type = p_content_type 
    AND content_id = p_content_id 
    AND status IN ('pending', 'escalated');
  
  IF existing_entry IS NOT NULL THEN
    -- Update existing entry with higher priority if needed
    UPDATE content_moderation_queue
    SET priority = GREATEST(priority, p_priority),
        risk_score = GREATEST(risk_score, p_risk_score),
        flag_reason = COALESCE(flag_reason, p_flag_reason),
        flagging_details = flagging_details || p_flagging_details,
        updated_at = NOW()
    WHERE id = existing_entry;
    
    RETURN existing_entry;
  END IF;
  
  -- Insert new moderation queue entry
  INSERT INTO content_moderation_queue (
    content_type,
    content_id,
    user_id,
    flagged_by,
    flag_reason,
    priority,
    risk_score,
    auto_flagged,
    flagging_details
  ) VALUES (
    p_content_type,
    p_content_id,
    p_user_id,
    p_flagged_by,
    p_flag_reason,
    p_priority,
    p_risk_score,
    p_auto_flagged,
    p_flagging_details
  ) RETURNING id INTO queue_id;
  
  -- Log the flagging action
  PERFORM log_admin_action(
    COALESCE(p_flagged_by, p_user_id),
    'CONTENT_FLAGGED',
    'content',
    queue_id,
    jsonb_build_object(
      'content_type', p_content_type,
      'content_id', p_content_id,
      'flag_reason', p_flag_reason,
      'priority', p_priority,
      'risk_score', p_risk_score,
      'auto_flagged', p_auto_flagged
    )
  );
  
  RETURN queue_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to moderate content (approve/reject)
CREATE OR REPLACE FUNCTION moderate_content(
  p_queue_id UUID,
  p_moderator_id UUID,
  p_status VARCHAR(20),
  p_moderator_notes TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  queue_record RECORD;
  action_type VARCHAR(50);
BEGIN
  -- Validate status
  IF p_status NOT IN ('approved', 'rejected', 'escalated') THEN
    RAISE EXCEPTION 'Invalid moderation status: %', p_status;
  END IF;
  
  -- Get the queue record
  SELECT * INTO queue_record
  FROM content_moderation_queue
  WHERE id = p_queue_id AND status IN ('pending', 'escalated');
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Update the moderation queue
  UPDATE content_moderation_queue
  SET status = p_status,
      moderator_id = p_moderator_id,
      moderated_at = NOW(),
      moderator_notes = p_moderator_notes,
      updated_at = NOW()
  WHERE id = p_queue_id;
  
  -- Determine action type for audit log
  action_type := CASE p_status
    WHEN 'approved' THEN 'CONTENT_APPROVED'
    WHEN 'rejected' THEN 'CONTENT_REJECTED'
    WHEN 'escalated' THEN 'CONTENT_ESCALATED'
  END;
  
  -- Log the moderation action
  PERFORM log_admin_action(
    p_moderator_id,
    action_type,
    'content',
    p_queue_id,
    jsonb_build_object(
      'content_type', queue_record.content_type,
      'content_id', queue_record.content_id,
      'user_id', queue_record.user_id,
      'flag_reason', queue_record.flag_reason,
      'moderator_notes', p_moderator_notes,
      'risk_score', queue_record.risk_score
    )
  );
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get moderation queue with filtering
CREATE OR REPLACE FUNCTION get_moderation_queue(
  p_status VARCHAR(20) DEFAULT NULL,
  p_content_type VARCHAR(20) DEFAULT NULL,
  p_priority_min INTEGER DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
) RETURNS TABLE (
  id UUID,
  content_type VARCHAR(20),
  content_id UUID,
  user_id UUID,
  user_email TEXT,
  flagged_by UUID,
  flag_reason TEXT,
  status VARCHAR(20),
  priority INTEGER,
  risk_score INTEGER,
  moderator_id UUID,
  moderated_at TIMESTAMP WITH TIME ZONE,
  moderator_notes TEXT,
  auto_flagged BOOLEAN,
  flagging_details JSONB,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    q.id,
    q.content_type,
    q.content_id,
    q.user_id,
    u.email as user_email,
    q.flagged_by,
    q.flag_reason,
    q.status,
    q.priority,
    q.risk_score,
    q.moderator_id,
    q.moderated_at,
    q.moderator_notes,
    q.auto_flagged,
    q.flagging_details,
    q.created_at,
    q.updated_at
  FROM content_moderation_queue q
  LEFT JOIN auth.users u ON q.user_id = u.id
  WHERE (p_status IS NULL OR q.status = p_status)
    AND (p_content_type IS NULL OR q.content_type = p_content_type)
    AND (p_priority_min IS NULL OR q.priority >= p_priority_min)
  ORDER BY q.priority DESC, q.created_at ASC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate content risk score (basic implementation)
CREATE OR REPLACE FUNCTION calculate_content_risk_score(
  p_content_text TEXT,
  p_content_type VARCHAR(20)
) RETURNS INTEGER AS $$
DECLARE
  risk_score INTEGER := 0;
  word_count INTEGER;
  suspicious_patterns TEXT[] := ARRAY[
    'urgent', 'limited time', 'act now', 'guaranteed', 'free money',
    'click here', 'buy now', 'special offer', 'winner', 'congratulations'
  ];
  pattern TEXT;
BEGIN
  -- Basic risk scoring based on content analysis
  word_count := array_length(string_to_array(p_content_text, ' '), 1);
  
  -- Check for suspicious patterns
  FOREACH pattern IN ARRAY suspicious_patterns
  LOOP
    IF lower(p_content_text) LIKE '%' || pattern || '%' THEN
      risk_score := risk_score + 10;
    END IF;
  END LOOP;
  
  -- Check for excessive capitalization
  IF length(regexp_replace(p_content_text, '[^A-Z]', '', 'g')) > word_count * 0.3 THEN
    risk_score := risk_score + 15;
  END IF;
  
  -- Check for excessive punctuation
  IF length(regexp_replace(p_content_text, '[^!?]', '', 'g')) > word_count * 0.1 THEN
    risk_score := risk_score + 10;
  END IF;
  
  -- Ensure score is within bounds
  risk_score := LEAST(risk_score, 100);
  
  RETURN risk_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;-- Gr
ant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE ON content_moderation_queue TO authenticated;
GRANT SELECT ON content_flag_reasons TO authenticated;

-- RLS policies for content moderation queue
ALTER TABLE content_moderation_queue ENABLE ROW LEVEL SECURITY;

-- Admins and moderators can view all moderation queue items
CREATE POLICY "Admin users can view moderation queue" ON content_moderation_queue
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.app_role IN ('admin', 'moderator', 'super_admin')
    )
  );

-- Users can view their own flagged content
CREATE POLICY "Users can view their own flagged content" ON content_moderation_queue
  FOR SELECT USING (user_id = auth.uid());

-- Only system can insert/update moderation queue (via functions)
CREATE POLICY "System can manage moderation queue" ON content_moderation_queue
  FOR ALL WITH CHECK (true);

-- RLS policies for flag reasons
ALTER TABLE content_flag_reasons ENABLE ROW LEVEL SECURITY;

-- Everyone can view active flag reasons
CREATE POLICY "Users can view flag reasons" ON content_flag_reasons
  FOR SELECT USING (is_active = true);

-- Only admins can manage flag reasons
CREATE POLICY "Admin users can manage flag reasons" ON content_flag_reasons
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.app_role IN ('admin', 'super_admin')
    )
  );

-- Update trigger for content_moderation_queue
CREATE OR REPLACE FUNCTION update_content_moderation_queue_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_content_moderation_queue_updated_at
  BEFORE UPDATE ON content_moderation_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_content_moderation_queue_updated_at();