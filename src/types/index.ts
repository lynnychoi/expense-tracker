/**
 * Type definitions for Korean Household Expense Tracker
 */

// User and Authentication types
export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

// Household types
export interface Household {
  id: string;
  name: string;
  created_by: string;
  invite_code: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface HouseholdMember {
  id: string;
  household_id: string;
  user_id: string;
  user?: User;
  joined_at: string;
  removed_at?: string;
}

// Transaction types
export type TransactionType = 'expense' | 'income';
export type PersonType = 'member' | 'household';

export interface Transaction {
  id: string;
  household_id: string;
  type: TransactionType;
  amount: number; // Korean Won as integer
  description?: string;
  date: string; // ISO date string
  person_type: PersonType;
  person_id?: string; // null if person_type is 'household'
  person?: User; // populated when person_type is 'member'
  payment_method: string;
  receipt_url?: string;
  tags: string[];
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
  created_by_user?: User;
  updated_by_user?: User;
}

// Tag and Color types
export interface TagColor {
  id: string;
  household_id: string;
  tag_name: string;
  color_hex: string; // 6-digit hex color
  created_at: string;
  updated_at: string;
}

// Recurring transaction types
export type RecurringFrequency = 'monthly' | 'yearly';

export interface RecurringTransaction {
  id: string;
  household_id: string;
  type: TransactionType;
  amount: number;
  description?: string;
  frequency: RecurringFrequency;
  person_type: PersonType;
  person_id?: string;
  person?: User;
  payment_method: string;
  tags: string[];
  next_date: string; // ISO date string
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  created_by_user?: User;
}

// Budget Goal types
export interface BudgetGoal {
  id: string;
  household_id: string;
  tag_name: string;
  monthly_limit: number; // Korean Won as integer
  created_by: string;
  created_at: string;
  updated_at: string;
  created_by_user?: User;
}

// Form types for creating/editing
export interface TransactionFormData {
  type: TransactionType;
  amount: string; // String for form input, will be parsed to number
  description?: string;
  date: string;
  person_type: PersonType;
  person_id?: string;
  payment_method: string;
  tags: string[];
  receipt_file?: File;
}

export interface RecurringTransactionFormData {
  type: TransactionType;
  amount: string;
  description?: string;
  frequency: RecurringFrequency;
  person_type: PersonType;
  person_id?: string;
  payment_method: string;
  tags: string[];
  start_date: string;
}

export interface BudgetGoalFormData {
  tag_name: string;
  monthly_limit: string; // String for form input
}

// Analytics types
export interface MonthlyTotal {
  month: string; // YYYY-MM format
  total_expense: number;
  total_income: number;
  net_income: number;
}

export interface CategoryTotal {
  tag_name: string;
  total_amount: number;
  transaction_count: number;
  color_hex?: string;
}

export interface TrendData {
  date: string; // ISO date string
  amount: number;
  tag_name?: string;
}

export interface ComparisonData {
  current_period: {
    total_expense: number;
    total_income: number;
    net_income: number;
  };
  previous_period: {
    total_expense: number;
    total_income: number;
    net_income: number;
  };
  percentage_changes: {
    expense_change: number;
    income_change: number;
    net_change: number;
  };
}

// Filter and search types
export interface TransactionFilter {
  start_date?: string;
  end_date?: string;
  type?: TransactionType;
  person_type?: PersonType;
  person_id?: string;
  tags?: string[];
  payment_method?: string;
  min_amount?: number;
  max_amount?: number;
  search_query?: string;
}

// API response types
export interface APIResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

// Notification types
export interface NotificationData {
  id: string;
  type: 'budget_warning' | 'recurring_reminder' | 'duplicate_warning';
  title: string;
  message: string;
  data?: Record<string, unknown>;
  read: boolean;
  created_at: string;
}

// AI Insight types
export interface AIInsight {
  id: string;
  type: 'spending_pattern' | 'unusual_expense' | 'budget_recommendation';
  title: string;
  message: string;
  confidence: number; // 0-1
  actionable: boolean;
  data?: Record<string, unknown>;
  created_at: string;
}

// Export types
export interface ExportOptions {
  format: 'csv' | 'pdf';
  start_date?: string;
  end_date?: string;
  include_income?: boolean;
  include_expenses?: boolean;
  tags?: string[];
  include_charts?: boolean; // For PDF exports
}

// Korean Won specific types
export type KRWAmount = number; // Always an integer representing Korean Won

// Default Korean household tags
export const DEFAULT_KOREAN_TAGS = {
  EXPENSE: [
    { name: '식비', color: '#FF6B6B' },
    { name: '교통비', color: '#45B7D1' },
    { name: '생활용품', color: '#96CEB4' },
    { name: '공과금', color: '#FECA57' },
    { name: '엔터테인먼트', color: '#FF9FF3' },
    { name: '의료비', color: '#4ECDC4' },
    { name: '교육비', color: '#6C5CE7' },
    { name: '의류', color: '#A29BFE' },
    { name: '주거비', color: '#E17055' },
    { name: '보험료', color: '#74B9FF' },
  ],
  INCOME: [
    { name: '급여', color: '#00B894' },
    { name: '부업', color: '#FDCB6E' },
    { name: '투자수익', color: '#00CEC9' },
    { name: '정부지원금', color: '#E84393' },
    { name: '기타수입', color: '#98D8C8' },
  ],
} as const;

// Color palette for tags (30 colors)
export const TAG_COLOR_PALETTE = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#FF9FF3',
  '#6C5CE7', '#A29BFE', '#FD79A8', '#E17055', '#00B894', '#00CEC9',
  '#74B9FF', '#FDCB6E', '#E84393', '#6C5CE7', '#00B894', '#FF7675',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9', '#F8C471',
  '#82E0AA', '#F1948A', '#AED6F1', '#D7BDE2', '#A3E4D7', '#FAD7A0',
] as const;