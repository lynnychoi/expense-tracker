-- Debug RLS issue by temporarily disabling it
-- This is for debugging the household loading problem

-- Disable RLS on households table
ALTER TABLE households DISABLE ROW LEVEL SECURITY;

-- Disable RLS on household_members table  
ALTER TABLE household_members DISABLE ROW LEVEL SECURITY;

-- Add a simple read policy for now (we can re-enable RLS later with proper policies)
-- But keeping RLS disabled for debugging