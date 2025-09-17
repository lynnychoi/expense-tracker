'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from './AuthContext'
import { useHousehold } from './HouseholdContext'
import { useTransactions } from './TransactionContext'
import { supabase } from '@/lib/supabase'

export interface BudgetCategory {
  id: string
  household_id: string
  name: string
  description: string | null
  icon: string | null
  color: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  created_by: string
  updated_by: string
}

export interface Budget {
  id: string
  household_id: string
  category_id: string | null
  category_name: string | null
  budget_month: string
  budget_amount: number
  spent_amount: number
  is_active: boolean
  notes: string | null
  created_at: string
  updated_at: string
  created_by: string
  updated_by: string
  category?: BudgetCategory // Joined data
}

export interface BudgetGoal {
  id: string
  household_id: string
  name: string
  description: string | null
  target_amount: number
  current_amount: number
  target_date: string | null
  goal_type: 'savings' | 'debt_payoff' | 'purchase' | 'emergency_fund' | 'other'
  priority: number
  is_completed: boolean
  is_active: boolean
  created_at: string
  updated_at: string
  created_by: string
  updated_by: string
}

export interface CreateBudgetCategoryData {
  name: string
  description?: string
  icon?: string
  color?: string
}

export interface CreateBudgetData {
  category_id?: string
  category_name?: string
  budget_month: string
  budget_amount: number
  notes?: string
}

export interface CreateBudgetGoalData {
  name: string
  description?: string
  target_amount: number
  target_date?: string
  goal_type: 'savings' | 'debt_payoff' | 'purchase' | 'emergency_fund' | 'other'
  priority: number
}

interface BudgetContextType {
  // Categories
  budgetCategories: BudgetCategory[]
  createBudgetCategory: (data: CreateBudgetCategoryData) => Promise<{ data?: BudgetCategory; error?: string }>
  updateBudgetCategory: (id: string, data: Partial<CreateBudgetCategoryData>) => Promise<{ data?: BudgetCategory; error?: string }>
  deleteBudgetCategory: (id: string) => Promise<{ error?: string }>
  
  // Budgets
  budgets: Budget[]
  createBudget: (data: CreateBudgetData) => Promise<{ data?: Budget; error?: string }>
  updateBudget: (id: string, data: Partial<CreateBudgetData>) => Promise<{ data?: Budget; error?: string }>
  deleteBudget: (id: string) => Promise<{ error?: string }>
  getCurrentMonthBudgets: () => Budget[]
  getBudgetForMonth: (month: string) => Budget[]
  
  // Goals
  budgetGoals: BudgetGoal[]
  createBudgetGoal: (data: CreateBudgetGoalData) => Promise<{ data?: BudgetGoal; error?: string }>
  updateBudgetGoal: (id: string, data: Partial<CreateBudgetGoalData & { current_amount?: number; is_completed?: boolean }>) => Promise<{ data?: BudgetGoal; error?: string }>
  deleteBudgetGoal: (id: string) => Promise<{ error?: string }>
  
  // Analytics
  calculateSpentAmount: (budget: Budget) => Promise<number>
  refreshBudgetSpending: () => Promise<void>
  
  loading: boolean
}

const BudgetContext = createContext<BudgetContextType | undefined>(undefined)

// Default Korean budget categories
const DEFAULT_BUDGET_CATEGORIES = [
  { name: '식비', icon: 'UtensilsCrossed', color: '#ef4444' },
  { name: '교통비', icon: 'Car', color: '#3b82f6' },
  { name: '문화생활', icon: 'Film', color: '#8b5cf6' },
  { name: '쇼핑', icon: 'ShoppingBag', color: '#ec4899' },
  { name: '의료비', icon: 'Heart', color: '#10b981' },
  { name: '교육비', icon: 'GraduationCap', color: '#f59e0b' },
  { name: '주거비', icon: 'Home', color: '#6b7280' },
  { name: '기타', icon: 'MoreHorizontal', color: '#64748b' }
]

export function BudgetProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const { currentHousehold } = useHousehold()
  const { transactions } = useTransactions()
  
  const [budgetCategories, setBudgetCategories] = useState<BudgetCategory[]>([])
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [budgetGoals, setBudgetGoals] = useState<BudgetGoal[]>([])
  const [loading, setLoading] = useState(false)

  // Load data when household changes
  useEffect(() => {
    if (currentHousehold && user) {
      loadAllData()
    } else {
      setBudgetCategories([])
      setBudgets([])
      setBudgetGoals([])
    }
  }, [currentHousehold, user])

  // Refresh spending when transactions change
  useEffect(() => {
    if (budgets.length > 0 && transactions.length > 0) {
      refreshBudgetSpending()
    }
  }, [transactions])

  const loadAllData = async () => {
    if (!currentHousehold) return

    setLoading(true)
    try {
      await Promise.all([
        loadBudgetCategories(),
        loadBudgets(),
        loadBudgetGoals()
      ])
    } catch (error) {
      console.error('Error loading budget data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadBudgetCategories = async () => {
    if (!currentHousehold) return

    const { data, error } = await supabase
      .from('budget_categories')
      .select('*')
      .eq('household_id', currentHousehold.id)
      .eq('is_active', true)
      .order('name')

    if (error) {
      console.error('Error loading budget categories:', error)
    } else {
      setBudgetCategories(data || [])
    }
  }

  const loadBudgets = async () => {
    if (!currentHousehold) return

    const { data, error } = await supabase
      .from('budgets')
      .select(`
        *,
        category:budget_categories(*)
      `)
      .eq('household_id', currentHousehold.id)
      .eq('is_active', true)
      .order('budget_month', { ascending: false })

    if (error) {
      console.error('Error loading budgets:', error)
    } else {
      setBudgets(data || [])
    }
  }

  const loadBudgetGoals = async () => {
    if (!currentHousehold) return

    const { data, error } = await supabase
      .from('budget_goals')
      .select('*')
      .eq('household_id', currentHousehold.id)
      .eq('is_active', true)
      .order('priority', { ascending: true })

    if (error) {
      console.error('Error loading budget goals:', error)
    } else {
      setBudgetGoals(data || [])
    }
  }

  // Budget Categories CRUD
  const createBudgetCategory = async (data: CreateBudgetCategoryData): Promise<{ data?: BudgetCategory; error?: string }> => {
    if (!currentHousehold || !user) {
      return { error: '가구가 선택되지 않았습니다' }
    }

    try {
      const { data: result, error } = await supabase
        .from('budget_categories')
        .insert({
          household_id: currentHousehold.id,
          name: data.name,
          description: data.description || null,
          icon: data.icon || null,
          color: data.color || null,
          created_by: user.id,
          updated_by: user.id
        })
        .select()
        .single()

      if (error) {
        if (error.code === '23505') {
          return { error: '이미 같은 이름의 카테고리가 존재합니다' }
        }
        return { error: error.message }
      }

      await loadBudgetCategories()
      return { data: result }
    } catch (error: any) {
      return { error: error.message }
    }
  }

  const updateBudgetCategory = async (id: string, data: Partial<CreateBudgetCategoryData>): Promise<{ data?: BudgetCategory; error?: string }> => {
    if (!user) {
      return { error: '로그인이 필요합니다' }
    }

    try {
      const { data: result, error } = await supabase
        .from('budget_categories')
        .update({
          ...data,
          updated_by: user.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        if (error.code === '23505') {
          return { error: '이미 같은 이름의 카테고리가 존재합니다' }
        }
        return { error: error.message }
      }

      await loadBudgetCategories()
      return { data: result }
    } catch (error: any) {
      return { error: error.message }
    }
  }

  const deleteBudgetCategory = async (id: string): Promise<{ error?: string }> => {
    try {
      // Check if category is being used in budgets
      const { data: budgetsUsingCategory, error: checkError } = await supabase
        .from('budgets')
        .select('id')
        .eq('category_id', id)
        .limit(1)

      if (checkError) {
        return { error: checkError.message }
      }

      if (budgetsUsingCategory && budgetsUsingCategory.length > 0) {
        return { error: '이 카테고리를 사용하는 예산이 있어 삭제할 수 없습니다' }
      }

      const { error } = await supabase
        .from('budget_categories')
        .delete()
        .eq('id', id)

      if (error) {
        return { error: error.message }
      }

      await loadBudgetCategories()
      return {}
    } catch (error: any) {
      return { error: error.message }
    }
  }

  // Budgets CRUD
  const createBudget = async (data: CreateBudgetData): Promise<{ data?: Budget; error?: string }> => {
    if (!currentHousehold || !user) {
      return { error: '가구가 선택되지 않았습니다' }
    }

    try {
      const { data: result, error } = await supabase
        .from('budgets')
        .insert({
          household_id: currentHousehold.id,
          category_id: data.category_id || null,
          category_name: data.category_name || null,
          budget_month: data.budget_month,
          budget_amount: data.budget_amount,
          notes: data.notes || null,
          created_by: user.id,
          updated_by: user.id
        })
        .select()
        .single()

      if (error) {
        if (error.code === '23505') {
          return { error: '해당 월에 이미 같은 카테고리의 예산이 존재합니다' }
        }
        return { error: error.message }
      }

      await loadBudgets()
      return { data: result }
    } catch (error: any) {
      return { error: error.message }
    }
  }

  const updateBudget = async (id: string, data: Partial<CreateBudgetData>): Promise<{ data?: Budget; error?: string }> => {
    if (!user) {
      return { error: '로그인이 필요합니다' }
    }

    try {
      const { data: result, error } = await supabase
        .from('budgets')
        .update({
          ...data,
          updated_by: user.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        return { error: error.message }
      }

      await loadBudgets()
      return { data: result }
    } catch (error: any) {
      return { error: error.message }
    }
  }

  const deleteBudget = async (id: string): Promise<{ error?: string }> => {
    try {
      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', id)

      if (error) {
        return { error: error.message }
      }

      await loadBudgets()
      return {}
    } catch (error: any) {
      return { error: error.message }
    }
  }

  // Budget Goals CRUD
  const createBudgetGoal = async (data: CreateBudgetGoalData): Promise<{ data?: BudgetGoal; error?: string }> => {
    if (!currentHousehold || !user) {
      return { error: '가구가 선택되지 않았습니다' }
    }

    try {
      const { data: result, error } = await supabase
        .from('budget_goals')
        .insert({
          household_id: currentHousehold.id,
          name: data.name,
          description: data.description || null,
          target_amount: data.target_amount,
          target_date: data.target_date || null,
          goal_type: data.goal_type,
          priority: data.priority,
          created_by: user.id,
          updated_by: user.id
        })
        .select()
        .single()

      if (error) {
        return { error: error.message }
      }

      await loadBudgetGoals()
      return { data: result }
    } catch (error: any) {
      return { error: error.message }
    }
  }

  const updateBudgetGoal = async (id: string, data: Partial<CreateBudgetGoalData & { current_amount?: number; is_completed?: boolean }>): Promise<{ data?: BudgetGoal; error?: string }> => {
    if (!user) {
      return { error: '로그인이 필요합니다' }
    }

    try {
      const { data: result, error } = await supabase
        .from('budget_goals')
        .update({
          ...data,
          updated_by: user.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        return { error: error.message }
      }

      await loadBudgetGoals()
      return { data: result }
    } catch (error: any) {
      return { error: error.message }
    }
  }

  const deleteBudgetGoal = async (id: string): Promise<{ error?: string }> => {
    try {
      const { error } = await supabase
        .from('budget_goals')
        .delete()
        .eq('id', id)

      if (error) {
        return { error: error.message }
      }

      await loadBudgetGoals()
      return {}
    } catch (error: any) {
      return { error: error.message }
    }
  }

  // Analytics
  const calculateSpentAmount = async (budget: Budget): Promise<number> => {
    if (!currentHousehold) return 0

    const monthStart = new Date(budget.budget_month)
    const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0)

    // Calculate based on category_id or category_name
    let categoryFilter: any = {}
    if (budget.category_id) {
      // For budgets linked to budget categories, we need to find transactions with matching tags
      const category = budgetCategories.find(c => c.id === budget.category_id)
      if (category) {
        categoryFilter.tags = { contains: [{ tag_name: category.name }] }
      }
    } else if (budget.category_name) {
      // For budgets linked to tag names directly
      categoryFilter.tags = { contains: [{ tag_name: budget.category_name }] }
    }

    // For now, return the stored spent_amount
    // In a real implementation, you'd calculate this from transactions
    return budget.spent_amount
  }

  const refreshBudgetSpending = async () => {
    // This would recalculate spent amounts from transactions
    // For now, we'll keep the stored values
    console.log('Refreshing budget spending calculations...')
  }

  const getCurrentMonthBudgets = (): Budget[] => {
    const currentMonth = new Date()
    const monthString = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-01`
    return budgets.filter(budget => budget.budget_month === monthString)
  }

  const getBudgetForMonth = (month: string): Budget[] => {
    return budgets.filter(budget => budget.budget_month === month)
  }

  const value: BudgetContextType = {
    budgetCategories,
    createBudgetCategory,
    updateBudgetCategory,
    deleteBudgetCategory,
    
    budgets,
    createBudget,
    updateBudget,
    deleteBudget,
    getCurrentMonthBudgets,
    getBudgetForMonth,
    
    budgetGoals,
    createBudgetGoal,
    updateBudgetGoal,
    deleteBudgetGoal,
    
    calculateSpentAmount,
    refreshBudgetSpending,
    
    loading
  }

  return (
    <BudgetContext.Provider value={value}>
      {children}
    </BudgetContext.Provider>
  )
}

export function useBudget() {
  const context = useContext(BudgetContext)
  if (context === undefined) {
    throw new Error('useBudget must be used within a BudgetProvider')
  }
  return context
}