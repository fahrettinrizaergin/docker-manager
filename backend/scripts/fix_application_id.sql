-- Fix application_id column constraint in containers table
-- This migration makes application_id nullable since it's no longer used in the application model

-- Make application_id nullable if it exists
ALTER TABLE containers ALTER COLUMN application_id DROP NOT NULL;

-- Optionally, you can remove the column entirely if it's no longer needed
-- Uncomment the line below to drop the column:
-- ALTER TABLE containers DROP COLUMN IF EXISTS application_id;
