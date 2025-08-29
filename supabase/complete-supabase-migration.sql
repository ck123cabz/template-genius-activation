-- COMPREHENSIVE MIGRATION: Add ALL missing CMS fields to activation_content
-- Run this in your Supabase SQL Editor

-- Add missing columns to activation_content table
ALTER TABLE activation_content 
ADD COLUMN IF NOT EXISTS guarantee_info JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS search_period TEXT DEFAULT '14-day priority access',
ADD COLUMN IF NOT EXISTS activation_fee TEXT DEFAULT '$500';

-- Update the existing payment_options to include the missing fields that the CMS expects
UPDATE activation_content 
SET payment_options = jsonb_set(
  jsonb_set(
    payment_options,
    '{optionA,details}',
    '""'
  ),
  '{optionA,additionalInfo}',
  '""'
)
WHERE NOT (payment_options->'optionA' ? 'details');

UPDATE activation_content 
SET payment_options = jsonb_set(
  jsonb_set(
    payment_options,
    '{optionB,details}',
    '""'
  ),
  '{optionB,additionalInfo}',
  '""'
)
WHERE NOT (payment_options->'optionB' ? 'details');

-- Update the existing row with proper default values
UPDATE activation_content 
SET 
  guarantee_info = '{"period": "6-month replacement coverage", "description": "Free replacement if hired candidate doesn'\''t work out within 6 months"}'::jsonb,
  search_period = '14-day priority access',
  activation_fee = '$500'
WHERE guarantee_info = '{}' OR search_period IS NULL OR activation_fee IS NULL;

-- Verify the structure by selecting all data
-- SELECT * FROM activation_content;