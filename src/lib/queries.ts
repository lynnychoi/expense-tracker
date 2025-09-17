import { createClient } from './supabase-server'
import { Transaction, TransactionFilter, MonthlyTotal, CategoryTotal } from '@/types'

/**
 * Get transactions for a household with optional filtering
 */
export async function getTransactions(
  householdId: string,
  filter?: TransactionFilter
): Promise<Transaction[]> {
  const supabase = createClient()
  
  let query = supabase
    .from('transactions')
    .select(`
      *,
      person:users(id, name, avatar_url),
      created_by_user:users!created_by(id, name),
      updated_by_user:users!updated_by(id, name),
      transaction_tags(tag_name)
    `)
    .eq('household_id', householdId)
    .order('date', { ascending: false })

  // Apply filters
  if (filter?.start_date) {
    query = query.gte('date', filter.start_date)
  }
  if (filter?.end_date) {
    query = query.lte('date', filter.end_date)
  }
  if (filter?.type) {
    query = query.eq('type', filter.type)
  }
  if (filter?.person_type) {
    query = query.eq('person_type', filter.person_type)
  }
  if (filter?.person_id) {
    query = query.eq('person_id', filter.person_id)
  }
  if (filter?.payment_method) {
    query = query.eq('payment_method', filter.payment_method)
  }
  if (filter?.min_amount) {
    query = query.gte('amount', filter.min_amount)
  }
  if (filter?.max_amount) {
    query = query.lte('amount', filter.max_amount)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching transactions:', error)
    throw error
  }

  // Transform the data to match our Transaction type
  return data?.map(row => ({
    ...row,
    tags: row.transaction_tags?.map((tag: any) => tag.tag_name) || [],
    person: row.person_type === 'member' ? row.person : undefined
  })) || []
}

/**
 * Get monthly totals for a household
 */
export async function getMonthlyTotals(
  householdId: string,
  year?: number
): Promise<MonthlyTotal[]> {
  const supabase = createClient()
  
  const currentYear = year || new Date().getFullYear()
  const startDate = `${currentYear}-01-01`
  const endDate = `${currentYear}-12-31`

  const { data, error } = await supabase
    .from('transactions')
    .select('type, amount, date')
    .eq('household_id', householdId)
    .gte('date', startDate)
    .lte('date', endDate)

  if (error) {
    console.error('Error fetching monthly totals:', error)
    throw error
  }

  // Group by month and calculate totals
  const monthlyData: { [key: string]: MonthlyTotal } = {}

  data?.forEach(transaction => {
    const month = transaction.date.substring(0, 7) // YYYY-MM format
    
    if (!monthlyData[month]) {
      monthlyData[month] = {
        month,
        total_expense: 0,
        total_income: 0,
        net_income: 0
      }
    }

    if (transaction.type === 'expense') {
      monthlyData[month].total_expense += transaction.amount
    } else {
      monthlyData[month].total_income += transaction.amount
    }
    
    monthlyData[month].net_income = monthlyData[month].total_income - monthlyData[month].total_expense
  })

  return Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month))
}

/**
 * Get category totals for a household
 */
export async function getCategoryTotals(
  householdId: string,
  startDate?: string,
  endDate?: string
): Promise<CategoryTotal[]> {
  const supabase = createClient()

  let query = supabase
    .from('transactions')
    .select(`
      amount,
      type,
      transaction_tags(tag_name)
    `)
    .eq('household_id', householdId)

  if (startDate) {
    query = query.gte('date', startDate)
  }
  if (endDate) {
    query = query.lte('date', endDate)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching category totals:', error)
    throw error
  }

  // Group by tag and calculate totals
  const categoryData: { [key: string]: CategoryTotal } = {}

  data?.forEach(transaction => {
    transaction.transaction_tags?.forEach((tagRow: any) => {
      const tagName = tagRow.tag_name
      
      if (!categoryData[tagName]) {
        categoryData[tagName] = {
          tag_name: tagName,
          total_amount: 0,
          transaction_count: 0
        }
      }

      categoryData[tagName].total_amount += transaction.amount
      categoryData[tagName].transaction_count += 1
    })
  })

  return Object.values(categoryData).sort((a, b) => b.total_amount - a.total_amount)
}

/**
 * Get tag colors for a household
 */
export async function getTagColors(householdId: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('tag_colors')
    .select('*')
    .eq('household_id', householdId)

  if (error) {
    console.error('Error fetching tag colors:', error)
    throw error
  }

  return data || []
}

/**
 * Get budget goals for a household
 */
export async function getBudgetGoals(householdId: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('budget_goals')
    .select(`
      *,
      created_by_user:users!created_by(id, name)
    `)
    .eq('household_id', householdId)

  if (error) {
    console.error('Error fetching budget goals:', error)
    throw error
  }

  return data || []
}

/**
 * Get current month's spending by tag for budget tracking
 */
export async function getCurrentMonthSpendingByTag(householdId: string) {
  const supabase = createClient()
  
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('transactions')
    .select(`
      amount,
      transaction_tags(tag_name)
    `)
    .eq('household_id', householdId)
    .eq('type', 'expense')
    .gte('date', startOfMonth)
    .lte('date', endOfMonth)

  if (error) {
    console.error('Error fetching current month spending:', error)
    throw error
  }

  // Group by tag
  const spendingByTag: { [key: string]: number } = {}

  data?.forEach(transaction => {
    transaction.transaction_tags?.forEach((tagRow: any) => {
      const tagName = tagRow.tag_name
      spendingByTag[tagName] = (spendingByTag[tagName] || 0) + transaction.amount
    })
  })

  return spendingByTag
}