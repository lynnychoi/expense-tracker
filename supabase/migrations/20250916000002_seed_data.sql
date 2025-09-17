-- Seed data for Korean Household Expense Tracker

-- Function to create default tags for a household
CREATE OR REPLACE FUNCTION create_default_tags_for_household(household_uuid UUID)
RETURNS void AS $$
BEGIN
  -- Insert default Korean household tags with colors
  INSERT INTO tag_colors (household_id, tag_name, color_hex) VALUES
  -- Default expense tags
  (household_uuid, '식비', '#FF6B6B'),
  (household_uuid, '교통비', '#45B7D1'),
  (household_uuid, '생활용품', '#96CEB4'),
  (household_uuid, '공과금', '#FECA57'),
  (household_uuid, '엔터테인먼트', '#FF9FF3'),
  (household_uuid, '의료비', '#4ECDC4'),
  (household_uuid, '교육비', '#6C5CE7'),
  (household_uuid, '의류', '#A29BFE'),
  (household_uuid, '주거비', '#E17055'),
  (household_uuid, '보험료', '#74B9FF'),
  -- Default income tags
  (household_uuid, '급여', '#00B894'),
  (household_uuid, '부업', '#FDCB6E'),
  (household_uuid, '투자수익', '#00CEC9'),
  (household_uuid, '정부지원금', '#E84393'),
  (household_uuid, '기타수입', '#98D8C8')
  ON CONFLICT (household_id, tag_name) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Function to create sample data for a household
CREATE OR REPLACE FUNCTION create_sample_data_for_household(
  household_uuid UUID, 
  user_uuid UUID
)
RETURNS void AS $$
BEGIN
  -- Insert sample transactions
  WITH sample_transactions AS (
    INSERT INTO transactions (
      household_id, type, amount, description, date, 
      person_type, person_id, payment_method, created_by, updated_by
    ) VALUES
    (household_uuid, 'expense', 15000, '점심 식사', CURRENT_DATE, 'member', user_uuid, 'Card', user_uuid, user_uuid),
    (household_uuid, 'expense', 45000, '장보기', CURRENT_DATE - INTERVAL '1 day', 'household', NULL, 'Cash', user_uuid, user_uuid),
    (household_uuid, 'income', 3000000, '월급', CURRENT_DATE - INTERVAL '2 days', 'member', user_uuid, 'Transfer', user_uuid, user_uuid)
    RETURNING id, type, description
  )
  -- Insert sample transaction tags
  INSERT INTO transaction_tags (transaction_id, tag_name)
  SELECT 
    st.id,
    CASE 
      WHEN st.description = '점심 식사' THEN '식비'
      WHEN st.description = '장보기' AND st.type = 'expense' THEN '식비'
      WHEN st.description = '월급' THEN '급여'
    END as tag_name
  FROM sample_transactions st
  WHERE CASE 
    WHEN st.description = '점심 식사' THEN '식비'
    WHEN st.description = '장보기' AND st.type = 'expense' THEN '식비'
    WHEN st.description = '월급' THEN '급여'
  END IS NOT NULL;

  -- Add additional tag for grocery shopping
  INSERT INTO transaction_tags (transaction_id, tag_name)
  SELECT st.id, '생활용품'
  FROM sample_transactions st
  WHERE st.description = '장보기';

  -- Insert sample budget goals
  INSERT INTO budget_goals (household_id, tag_name, monthly_limit, created_by) VALUES
  (household_uuid, '식비', 500000, user_uuid),
  (household_uuid, '교통비', 200000, user_uuid),
  (household_uuid, '엔터테인먼트', 300000, user_uuid)
  ON CONFLICT (household_id, tag_name) DO NOTHING;
END;
$$ LANGUAGE plpgsql;