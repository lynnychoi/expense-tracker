-- Korean Household Expense Tracker Database Schema
-- All amounts stored as BIGINT for Korean Won (no decimals)

-- Note: JWT secret is automatically managed by Supabase for hosted projects

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Households table
CREATE TABLE IF NOT EXISTS households (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_by UUID REFERENCES users(id) NOT NULL,
  invite_code TEXT UNIQUE NOT NULL DEFAULT LOWER(
    SUBSTRING(gen_random_uuid()::text FROM 1 FOR 7)
  ),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Household members table
CREATE TABLE IF NOT EXISTS household_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID REFERENCES households(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  removed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(household_id, user_id)
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID REFERENCES households(id) ON DELETE CASCADE NOT NULL,
  type TEXT CHECK (type IN ('expense', 'income')) NOT NULL,
  amount BIGINT NOT NULL CHECK (amount >= 0), -- Korean Won as integer
  description TEXT,
  date DATE NOT NULL,
  person_type TEXT CHECK (person_type IN ('member', 'household')) NOT NULL,
  person_id UUID REFERENCES users(id), -- NULL if person_type is 'household'
  payment_method TEXT NOT NULL,
  receipt_url TEXT,
  created_by UUID REFERENCES users(id) NOT NULL,
  updated_by UUID REFERENCES users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Transaction tags table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS transaction_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE NOT NULL,
  tag_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(transaction_id, tag_name)
);

-- Tag colors table
CREATE TABLE IF NOT EXISTS tag_colors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID REFERENCES households(id) ON DELETE CASCADE NOT NULL,
  tag_name TEXT NOT NULL,
  color_hex TEXT NOT NULL CHECK (color_hex ~ '^#[0-9A-Fa-f]{6}$'), -- 6-digit hex color
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(household_id, tag_name)
);

-- Recurring transactions table
CREATE TABLE IF NOT EXISTS recurring_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID REFERENCES households(id) ON DELETE CASCADE NOT NULL,
  type TEXT CHECK (type IN ('expense', 'income')) NOT NULL,
  amount BIGINT NOT NULL CHECK (amount >= 0),
  description TEXT,
  frequency TEXT CHECK (frequency IN ('monthly', 'yearly')) NOT NULL,
  person_type TEXT CHECK (person_type IN ('member', 'household')) NOT NULL,
  person_id UUID REFERENCES users(id), -- NULL if person_type is 'household'
  payment_method TEXT NOT NULL,
  next_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_by UUID REFERENCES users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Recurring transaction tags table
CREATE TABLE IF NOT EXISTS recurring_transaction_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recurring_transaction_id UUID REFERENCES recurring_transactions(id) ON DELETE CASCADE NOT NULL,
  tag_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(recurring_transaction_id, tag_name)
);

-- Budget goals table
CREATE TABLE IF NOT EXISTS budget_goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID REFERENCES households(id) ON DELETE CASCADE NOT NULL,
  tag_name TEXT NOT NULL,
  monthly_limit BIGINT NOT NULL CHECK (monthly_limit >= 0), -- Korean Won as integer
  created_by UUID REFERENCES users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(household_id, tag_name)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_households_created_by ON households(created_by);
CREATE INDEX IF NOT EXISTS idx_households_invite_code ON households(invite_code);
CREATE INDEX IF NOT EXISTS idx_household_members_household_id ON household_members(household_id);
CREATE INDEX IF NOT EXISTS idx_household_members_user_id ON household_members(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_household_id ON transactions(household_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_person_id ON transactions(person_id);
CREATE INDEX IF NOT EXISTS idx_transaction_tags_transaction_id ON transaction_tags(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_tags_tag_name ON transaction_tags(tag_name);
CREATE INDEX IF NOT EXISTS idx_tag_colors_household_id ON tag_colors(household_id);
CREATE INDEX IF NOT EXISTS idx_recurring_transactions_household_id ON recurring_transactions(household_id);
CREATE INDEX IF NOT EXISTS idx_recurring_transactions_next_date ON recurring_transactions(next_date);
CREATE INDEX IF NOT EXISTS idx_budget_goals_household_id ON budget_goals(household_id);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE tag_colors ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_transaction_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_goals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view their own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for households table
CREATE POLICY "Users can view households they belong to" ON households FOR SELECT USING (
  id IN (
    SELECT household_id FROM household_members 
    WHERE user_id = auth.uid() AND removed_at IS NULL
  )
);
CREATE POLICY "Users can create households" ON households FOR INSERT WITH CHECK (created_by = auth.uid());
CREATE POLICY "Household creators can update their households" ON households FOR UPDATE USING (created_by = auth.uid());

-- RLS Policies for household_members table
CREATE POLICY "Users can view members of their household" ON household_members FOR SELECT USING (
  household_id IN (
    SELECT household_id FROM household_members 
    WHERE user_id = auth.uid() AND removed_at IS NULL
  )
);
CREATE POLICY "Household creators can manage members" ON household_members FOR ALL USING (
  household_id IN (
    SELECT id FROM households WHERE created_by = auth.uid()
  )
);
CREATE POLICY "Users can join households" ON household_members FOR INSERT WITH CHECK (user_id = auth.uid());

-- RLS Policies for transactions table
CREATE POLICY "Users can view household transactions" ON transactions FOR SELECT USING (
  household_id IN (
    SELECT household_id FROM household_members 
    WHERE user_id = auth.uid() AND removed_at IS NULL
  )
);
CREATE POLICY "Users can create household transactions" ON transactions FOR INSERT WITH CHECK (
  household_id IN (
    SELECT household_id FROM household_members 
    WHERE user_id = auth.uid() AND removed_at IS NULL
  ) AND created_by = auth.uid()
);
CREATE POLICY "Users can update household transactions" ON transactions FOR UPDATE USING (
  household_id IN (
    SELECT household_id FROM household_members 
    WHERE user_id = auth.uid() AND removed_at IS NULL
  )
);
CREATE POLICY "Users can delete household transactions" ON transactions FOR DELETE USING (
  household_id IN (
    SELECT household_id FROM household_members 
    WHERE user_id = auth.uid() AND removed_at IS NULL
  )
);

-- RLS Policies for transaction_tags table
CREATE POLICY "Users can view household transaction tags" ON transaction_tags FOR SELECT USING (
  transaction_id IN (
    SELECT id FROM transactions WHERE household_id IN (
      SELECT household_id FROM household_members 
      WHERE user_id = auth.uid() AND removed_at IS NULL
    )
  )
);
CREATE POLICY "Users can manage household transaction tags" ON transaction_tags FOR ALL USING (
  transaction_id IN (
    SELECT id FROM transactions WHERE household_id IN (
      SELECT household_id FROM household_members 
      WHERE user_id = auth.uid() AND removed_at IS NULL
    )
  )
);

-- RLS Policies for tag_colors table
CREATE POLICY "Users can view household tag colors" ON tag_colors FOR SELECT USING (
  household_id IN (
    SELECT household_id FROM household_members 
    WHERE user_id = auth.uid() AND removed_at IS NULL
  )
);
CREATE POLICY "Users can manage household tag colors" ON tag_colors FOR ALL USING (
  household_id IN (
    SELECT household_id FROM household_members 
    WHERE user_id = auth.uid() AND removed_at IS NULL
  )
);

-- RLS Policies for recurring_transactions table
CREATE POLICY "Users can view household recurring transactions" ON recurring_transactions FOR SELECT USING (
  household_id IN (
    SELECT household_id FROM household_members 
    WHERE user_id = auth.uid() AND removed_at IS NULL
  )
);
CREATE POLICY "Users can manage household recurring transactions" ON recurring_transactions FOR ALL USING (
  household_id IN (
    SELECT household_id FROM household_members 
    WHERE user_id = auth.uid() AND removed_at IS NULL
  )
);

-- RLS Policies for recurring_transaction_tags table
CREATE POLICY "Users can view household recurring transaction tags" ON recurring_transaction_tags FOR SELECT USING (
  recurring_transaction_id IN (
    SELECT id FROM recurring_transactions WHERE household_id IN (
      SELECT household_id FROM household_members 
      WHERE user_id = auth.uid() AND removed_at IS NULL
    )
  )
);
CREATE POLICY "Users can manage household recurring transaction tags" ON recurring_transaction_tags FOR ALL USING (
  recurring_transaction_id IN (
    SELECT id FROM recurring_transactions WHERE household_id IN (
      SELECT household_id FROM household_members 
      WHERE user_id = auth.uid() AND removed_at IS NULL
    )
  )
);

-- RLS Policies for budget_goals table
CREATE POLICY "Users can view household budget goals" ON budget_goals FOR SELECT USING (
  household_id IN (
    SELECT household_id FROM household_members 
    WHERE user_id = auth.uid() AND removed_at IS NULL
  )
);
CREATE POLICY "Users can manage household budget goals" ON budget_goals FOR ALL USING (
  household_id IN (
    SELECT household_id FROM household_members 
    WHERE user_id = auth.uid() AND removed_at IS NULL
  )
);

-- Functions for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_households_updated_at BEFORE UPDATE ON households FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tag_colors_updated_at BEFORE UPDATE ON tag_colors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_recurring_transactions_updated_at BEFORE UPDATE ON recurring_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_budget_goals_updated_at BEFORE UPDATE ON budget_goals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Default tags are created per household using the create_default_tags_for_household() function
-- This function is defined in the seed data migration