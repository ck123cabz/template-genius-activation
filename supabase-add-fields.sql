-- Add missing fields to activation_content table
-- Run this in your Supabase SQL Editor

-- Add the missing fields to the existing activation_content table
ALTER TABLE activation_content 
ADD COLUMN IF NOT EXISTS guarantee_info JSONB DEFAULT '{"period": "6-month replacement coverage", "description": "Free replacement if hired candidate doesn'\''t work out within 6 months"}',
ADD COLUMN IF NOT EXISTS search_period TEXT DEFAULT '14-day priority access',
ADD COLUMN IF NOT EXISTS activation_fee TEXT DEFAULT '$500';

-- Update the existing row with default values for new fields
UPDATE activation_content 
SET 
  guarantee_info = '{"period": "6-month replacement coverage", "description": "Free replacement if hired candidate doesn'\''t work out within 6 months"}'::jsonb,
  search_period = '14-day priority access',
  activation_fee = '$500'
WHERE guarantee_info IS NULL OR search_period IS NULL OR activation_fee IS NULL;