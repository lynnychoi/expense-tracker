-- Complete RLS policy fix to eliminate all recursive dependencies

-- First, drop all existing RLS policies on household_members
DROP POLICY IF EXISTS "Users can view members of their household" ON household_members;
DROP POLICY IF EXISTS "Household creators can manage members" ON household_members;
DROP POLICY IF EXISTS "Users can join households" ON household_members;

-- Create simple, non-recursive policies

-- 1. Users can always view their own membership records
CREATE POLICY "Users can view their own memberships" ON household_members FOR SELECT USING (
  user_id = auth.uid()
);

-- 2. Users can view other members in households where they are members
-- Use a function to avoid recursion
CREATE OR REPLACE FUNCTION is_household_member(household_uuid UUID, user_uuid UUID)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM household_members
    WHERE household_id = household_uuid
    AND user_id = user_uuid
    AND removed_at IS NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE POLICY "Users can view household members" ON household_members FOR SELECT USING (
  user_id = auth.uid() OR is_household_member(household_id, auth.uid())
);

-- 3. Household creators can manage all members
CREATE POLICY "Household creators can manage members" ON household_members FOR ALL USING (
  household_id IN (
    SELECT id FROM households WHERE created_by = auth.uid()
  )
);

-- 4. Users can join households (insert their own membership)
CREATE POLICY "Users can join households" ON household_members FOR INSERT WITH CHECK (
  user_id = auth.uid()
);

-- 5. Users can leave households (delete their own membership)
CREATE POLICY "Users can leave households" ON household_members FOR DELETE USING (
  user_id = auth.uid()
);