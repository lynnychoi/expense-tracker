-- Temporarily disable RLS for debugging household loading issue
-- This will help us determine if RLS policies are blocking data access

-- Disable RLS on households and household_members tables
ALTER TABLE households DISABLE ROW LEVEL SECURITY;
ALTER TABLE household_members DISABLE ROW LEVEL SECURITY;

-- These can be re-enabled later with:
-- ALTER TABLE households ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;