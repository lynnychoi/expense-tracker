-- Create payment_methods table for custom payment methods per household
CREATE TABLE payment_methods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  color VARCHAR(7), -- hex color code
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  updated_by UUID NOT NULL REFERENCES auth.users(id),
  
  -- Ensure unique payment method names per household
  UNIQUE(household_id, name)
);

-- RLS policies for payment_methods
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

-- Users can view payment methods for households they belong to
CREATE POLICY "payment_methods_select_policy" ON payment_methods
  FOR SELECT
  USING (
    household_id IN (
      SELECT household_id 
      FROM household_members 
      WHERE user_id = auth.uid()
    )
  );

-- Users can insert payment methods for households they belong to
CREATE POLICY "payment_methods_insert_policy" ON payment_methods
  FOR INSERT
  WITH CHECK (
    household_id IN (
      SELECT household_id 
      FROM household_members 
      WHERE user_id = auth.uid()
    )
    AND created_by = auth.uid()
  );

-- Users can update payment methods for households they belong to
CREATE POLICY "payment_methods_update_policy" ON payment_methods
  FOR UPDATE
  USING (
    household_id IN (
      SELECT household_id 
      FROM household_members 
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    household_id IN (
      SELECT household_id 
      FROM household_members 
      WHERE user_id = auth.uid()
    )
    AND updated_by = auth.uid()
  );

-- Users can delete payment methods for households they belong to
CREATE POLICY "payment_methods_delete_policy" ON payment_methods
  FOR DELETE
  USING (
    household_id IN (
      SELECT household_id 
      FROM household_members 
      WHERE user_id = auth.uid()
    )
  );

-- Create updated_at trigger
CREATE TRIGGER update_payment_methods_updated_at
  BEFORE UPDATE ON payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default payment methods for Korean users
-- This will be handled by the application when creating households

-- Create indexes for better performance
CREATE INDEX idx_payment_methods_household_id ON payment_methods(household_id);
CREATE INDEX idx_payment_methods_active ON payment_methods(household_id, is_active);

-- Add comment
COMMENT ON TABLE payment_methods IS 'Custom payment methods for each household';
COMMENT ON COLUMN payment_methods.icon IS 'Icon name from lucide-react or emoji';
COMMENT ON COLUMN payment_methods.color IS 'Hex color code for UI theming';
COMMENT ON COLUMN payment_methods.is_default IS 'Whether this is the default payment method for the household';