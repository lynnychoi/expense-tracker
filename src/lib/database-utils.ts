import { createClient } from './supabase-server'
import { DEFAULT_KOREAN_TAGS } from '@/types'

/**
 * Create default Korean household tags for a new household
 */
export async function createDefaultTagsForHousehold(householdId: string) {
  const supabase = createClient()
  
  const defaultTags = [
    ...DEFAULT_KOREAN_TAGS.EXPENSE,
    ...DEFAULT_KOREAN_TAGS.INCOME
  ]

  const tagColorsData = defaultTags.map(tag => ({
    household_id: householdId,
    tag_name: tag.name,
    color_hex: tag.color
  }))

  const { error } = await supabase
    .from('tag_colors')
    .insert(tagColorsData)
    .select()

  if (error) {
    console.error('Error creating default tags:', error)
    throw error
  }

  return tagColorsData
}

/**
 * Create sample transaction data for a new household
 */
export async function createSampleDataForHousehold(householdId: string, userId: string) {
  const supabase = createClient()

  // Sample transactions
  const sampleTransactions = [
    {
      household_id: householdId,
      type: 'expense',
      amount: 15000, // ₩15,000
      description: '점심 식사',
      date: new Date().toISOString().split('T')[0],
      person_type: 'member',
      person_id: userId,
      payment_method: 'Card',
      created_by: userId,
      updated_by: userId
    },
    {
      household_id: householdId,
      type: 'expense',
      amount: 45000, // ₩45,000
      description: '장보기',
      date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Yesterday
      person_type: 'household',
      person_id: null,
      payment_method: 'Cash',
      created_by: userId,
      updated_by: userId
    },
    {
      household_id: householdId,
      type: 'income',
      amount: 3000000, // ₩3,000,000
      description: '월급',
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2 days ago
      person_type: 'member',
      person_id: userId,
      payment_method: 'Transfer',
      created_by: userId,
      updated_by: userId
    }
  ]

  const { data: transactions, error: transactionError } = await supabase
    .from('transactions')
    .insert(sampleTransactions)
    .select()

  if (transactionError) {
    console.error('Error creating sample transactions:', transactionError)
    throw transactionError
  }

  // Add sample tags to transactions
  if (transactions) {
    const transactionTags = [
      { transaction_id: transactions[0].id, tag_name: '식비' },
      { transaction_id: transactions[1].id, tag_name: '식비' },
      { transaction_id: transactions[1].id, tag_name: '생활용품' },
      { transaction_id: transactions[2].id, tag_name: '급여' }
    ]

    const { error: tagError } = await supabase
      .from('transaction_tags')
      .insert(transactionTags)

    if (tagError) {
      console.error('Error creating sample transaction tags:', tagError)
      throw tagError
    }
  }

  // Sample budget goals
  const sampleBudgetGoals = [
    {
      household_id: householdId,
      tag_name: '식비',
      monthly_limit: 500000, // ₩500,000
      created_by: userId
    },
    {
      household_id: householdId,
      tag_name: '교통비',
      monthly_limit: 200000, // ₩200,000
      created_by: userId
    },
    {
      household_id: householdId,
      tag_name: '엔터테인먼트',
      monthly_limit: 300000, // ₩300,000
      created_by: userId
    }
  ]

  const { error: budgetError } = await supabase
    .from('budget_goals')
    .insert(sampleBudgetGoals)

  if (budgetError) {
    console.error('Error creating sample budget goals:', budgetError)
    throw budgetError
  }

  return { transactions, budgetGoals: sampleBudgetGoals }
}

/**
 * Generate a unique invite code for a household
 */
export function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 7; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}