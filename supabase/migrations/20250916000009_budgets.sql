-- Create budget_categories table for custom budget categories per household
CREATE TABLE budget_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  color VARCHAR(7), -- hex color code
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  updated_by UUID NOT NULL REFERENCES auth.users(id),
  
  -- Ensure unique category names per household
  UNIQUE(household_id, name)
);

-- Create budgets table for monthly budget limits per category
CREATE TABLE budgets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  category_id UUID REFERENCES budget_categories(id) ON DELETE CASCADE,
  category_name VARCHAR(100), -- For transactions that use tag names instead of category_id
  budget_month DATE NOT NULL, -- First day of the month (YYYY-MM-01)
  budget_amount INTEGER NOT NULL CHECK (budget_amount >= 0), -- Korean Won (integer only)
  spent_amount INTEGER DEFAULT 0 CHECK (spent_amount >= 0), -- Calculated field
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  updated_by UUID NOT NULL REFERENCES auth.users(id),
  
  -- Ensure unique budget per category per month per household
  UNIQUE(household_id, category_id, budget_month),
  UNIQUE(household_id, category_name, budget_month),
  
  -- Either category_id or category_name should be set, but not both
  CHECK (
    (category_id IS NOT NULL AND category_name IS NULL) OR
    (category_id IS NULL AND category_name IS NOT NULL)
  )
);

-- Create budget_goals table for savings and financial goals
CREATE TABLE budget_goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  target_amount INTEGER NOT NULL CHECK (target_amount > 0), -- Korean Won
  current_amount INTEGER DEFAULT 0 CHECK (current_amount >= 0),
  target_date DATE,
  goal_type VARCHAR(50) DEFAULT 'savings' CHECK (goal_type IN ('savings', 'debt_payoff', 'purchase', 'emergency_fund', 'other')),
  priority INTEGER DEFAULT 3 CHECK (priority BETWEEN 1 AND 5), -- 1=highest, 5=lowest
  is_completed BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  updated_by UUID NOT NULL REFERENCES auth.users(id)
);

-- RLS policies for budget_categories
ALTER TABLE budget_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "budget_categories_select_policy" ON budget_categories
  FOR SELECT
  USING (
    household_id IN (
      SELECT household_id 
      FROM household_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "budget_categories_insert_policy" ON budget_categories
  FOR INSERT
  WITH CHECK (
    household_id IN (
      SELECT household_id 
      FROM household_members 
      WHERE user_id = auth.uid()
    )
    AND created_by = auth.uid()
  );

CREATE POLICY "budget_categories_update_policy" ON budget_categories
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

CREATE POLICY "budget_categories_delete_policy" ON budget_categories
  FOR DELETE
  USING (
    household_id IN (
      SELECT household_id 
      FROM household_members 
      WHERE user_id = auth.uid()
    )
  );

-- RLS policies for budgets
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "budgets_select_policy" ON budgets
  FOR SELECT
  USING (
    household_id IN (
      SELECT household_id 
      FROM household_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "budgets_insert_policy" ON budgets
  FOR INSERT
  WITH CHECK (
    household_id IN (
      SELECT household_id 
      FROM household_members 
      WHERE user_id = auth.uid()
    )
    AND created_by = auth.uid()
  );

CREATE POLICY "budgets_update_policy" ON budgets
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

CREATE POLICY "budgets_delete_policy" ON budgets
  FOR DELETE
  USING (
    household_id IN (
      SELECT household_id 
      FROM household_members 
      WHERE user_id = auth.uid()
    )
  );

-- RLS policies for budget_goals
ALTER TABLE budget_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "budget_goals_select_policy" ON budget_goals
  FOR SELECT
  USING (
    household_id IN (
      SELECT household_id 
      FROM household_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "budget_goals_insert_policy" ON budget_goals
  FOR INSERT
  WITH CHECK (
    household_id IN (
      SELECT household_id 
      FROM household_members 
      WHERE user_id = auth.uid()
    )
    AND created_by = auth.uid()
  );

CREATE POLICY "budget_goals_update_policy" ON budget_goals
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

CREATE POLICY "budget_goals_delete_policy" ON budget_goals
  FOR DELETE
  USING (
    household_id IN (
      SELECT household_id 
      FROM household_members 
      WHERE user_id = auth.uid()
    )
  );

-- Create updated_at triggers
CREATE TRIGGER update_budget_categories_updated_at
  BEFORE UPDATE ON budget_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_budgets_updated_at
  BEFORE UPDATE ON budgets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_budget_goals_updated_at
  BEFORE UPDATE ON budget_goals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_budget_categories_household_id ON budget_categories(household_id);
CREATE INDEX idx_budget_categories_active ON budget_categories(household_id, is_active);

CREATE INDEX idx_budgets_household_id ON budgets(household_id);
CREATE INDEX idx_budgets_month ON budgets(household_id, budget_month);
CREATE INDEX idx_budgets_category ON budgets(household_id, category_id);
CREATE INDEX idx_budgets_active ON budgets(household_id, is_active);

CREATE INDEX idx_budget_goals_household_id ON budget_goals(household_id);
CREATE INDEX idx_budget_goals_active ON budget_goals(household_id, is_active);
CREATE INDEX idx_budget_goals_priority ON budget_goals(household_id, priority);

-- Insert default Korean budget categories
-- This will be handled by the application when creating households

-- Add comments
COMMENT ON TABLE budget_categories IS 'Custom budget categories for each household';
COMMENT ON TABLE budgets IS 'Monthly budget limits per category';
COMMENT ON TABLE budget_goals IS 'Financial goals and savings targets';

COMMENT ON COLUMN budget_categories.icon IS 'Icon name from lucide-react or emoji';
COMMENT ON COLUMN budget_categories.color IS 'Hex color code for UI theming';
COMMENT ON COLUMN budgets.budget_month IS 'First day of the month for budget period';
COMMENT ON COLUMN budgets.spent_amount IS 'Calculated spent amount for the month';
COMMENT ON COLUMN budget_goals.goal_type IS 'Type of financial goal';
COMMENT ON COLUMN budget_goals.priority IS '1=highest priority, 5=lowest priority';