-- Fix infinite recursion in household_members RLS policies

-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can view members of their household" ON household_members;

-- Create a new policy that doesn't cause recursion
-- Users can view household members if they are a member of that household
CREATE POLICY "Users can view members of their household" ON household_members FOR SELECT USING (
  household_id IN (
    SELECT h.id FROM households h
    INNER JOIN household_members hm ON h.id = hm.household_id
    WHERE hm.user_id = auth.uid() AND hm.removed_at IS NULL
  )
);

-- Alternative approach: Create a more direct policy
-- Drop and recreate with a simpler approach
DROP POLICY IF EXISTS "Users can view members of their household" ON household_members;

-- Allow users to see members of households they belong to
CREATE POLICY "Users can view members of their household" ON household_members FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM household_members hm2
    WHERE hm2.household_id = household_members.household_id
    AND hm2.user_id = auth.uid()
    AND hm2.removed_at IS NULL
  )
);