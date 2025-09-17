'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useHousehold } from '@/contexts/HouseholdContext'

export interface Transaction {
  id: string
  household_id: string
  type: 'expense' | 'income'
  amount: number
  description: string
  date: string
  person_type: 'member' | 'household'
  person_id?: string
  payment_method: string
  receipt_url?: string
  created_by: string
  updated_by: string
  created_at: string
  updated_at: string
  tags: TransactionTag[]
  user?: {
    id: string
    name: string
    email: string
  }
}

export interface TransactionTag {
  id: string
  transaction_id: string
  tag_name: string
  created_at: string
}

export interface CreateTransactionData {
  type: 'expense' | 'income'
  amount: number
  description: string
  date: string
  person_type: 'member' | 'household'
  person_id?: string
  payment_method: string
  tags: string[]
}

interface TransactionContextType {
  transactions: Transaction[]
  loading: boolean
  error: string | null
  createTransaction: (data: CreateTransactionData) => Promise<{ data?: Transaction; error?: string }>
  updateTransaction: (id: string, data: Partial<CreateTransactionData>) => Promise<{ data?: Transaction; error?: string }>
  deleteTransaction: (id: string) => Promise<{ error?: string }>
  loadTransactions: () => Promise<void>
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined)

export function useTransactions() {
  const context = useContext(TransactionContext)
  if (context === undefined) {
    throw new Error('useTransactions must be used within a TransactionProvider')
  }
  return context
}

interface TransactionProviderProps {
  children: ReactNode
}

export function TransactionProvider({ children }: TransactionProviderProps) {
  const { user } = useAuth()
  const { currentHousehold } = useHousehold()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (currentHousehold) {
      loadTransactions()
    } else {
      setTransactions([])
    }
  }, [currentHousehold])

  const loadTransactions = async () => {
    if (!currentHousehold) return

    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          tags:transaction_tags(id, tag_name, created_at),
          user:users(id, name, email)
        `)
        .eq('household_id', currentHousehold.id)
        .order('date', { ascending: false })

      if (error) {
        throw error
      }

      setTransactions(data || [])
    } catch (err: any) {
      setError(err.message)
      console.error('Error loading transactions:', err)
    } finally {
      setLoading(false)
    }
  }

  const createTransaction = async (data: CreateTransactionData) => {
    if (!user || !currentHousehold) {
      return { error: 'User or household not available' }
    }

    try {
      // Create transaction
      const { data: transaction, error: transactionError } = await supabase
        .from('transactions')
        .insert({
          household_id: currentHousehold.id,
          type: data.type,
          amount: data.amount,
          description: data.description,
          date: data.date,
          person_type: data.person_type,
          person_id: data.person_type === 'member' ? data.person_id : null,
          payment_method: data.payment_method,
          created_by: user.id,
          updated_by: user.id,
        })
        .select()
        .single()

      if (transactionError) {
        throw transactionError
      }

      // Create tags
      if (data.tags.length > 0) {
        const tagInserts = data.tags.map(tag => ({
          transaction_id: transaction.id,
          tag_name: tag
        }))

        const { error: tagsError } = await supabase
          .from('transaction_tags')
          .insert(tagInserts)

        if (tagsError) {
          console.error('Error creating tags:', tagsError)
          // Still continue since the transaction was created successfully
        }
      }

      // Reload transactions to get the complete data
      await loadTransactions()

      return { data: transaction }
    } catch (err: any) {
      return { error: err.message }
    }
  }

  const updateTransaction = async (id: string, data: Partial<CreateTransactionData>) => {
    if (!user) {
      return { error: 'User not available' }
    }

    try {
      const updateData: any = {
        updated_by: user.id,
      }

      if (data.type !== undefined) updateData.type = data.type
      if (data.amount !== undefined) updateData.amount = data.amount
      if (data.description !== undefined) updateData.description = data.description
      if (data.date !== undefined) updateData.date = data.date
      if (data.person_type !== undefined) updateData.person_type = data.person_type
      if (data.person_id !== undefined) {
        updateData.person_id = data.person_type === 'member' ? data.person_id : null
      } else if (data.person_type !== undefined) {
        updateData.person_id = data.person_type === 'member' ? data.person_id : null
      }
      if (data.payment_method !== undefined) updateData.payment_method = data.payment_method

      const { data: transaction, error: transactionError } = await supabase
        .from('transactions')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (transactionError) {
        throw transactionError
      }

      // Update tags if provided
      if (data.tags !== undefined) {
        // Delete existing tags
        const { error: deleteError } = await supabase
          .from('transaction_tags')
          .delete()
          .eq('transaction_id', id)

        if (deleteError) {
          console.error('Error deleting existing tags:', deleteError)
        }

        // Insert new tags
        if (data.tags.length > 0) {
          const tagInserts = data.tags.map(tag => ({
            transaction_id: id,
            tag_name: tag
          }))

          const { error: insertError } = await supabase
            .from('transaction_tags')
            .insert(tagInserts)

          if (insertError) {
            console.error('Error inserting new tags:', insertError)
          }
        }
      }

      // Reload transactions
      await loadTransactions()

      return { data: transaction }
    } catch (err: any) {
      return { error: err.message }
    }
  }

  const deleteTransaction = async (id: string) => {
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)

      if (error) {
        throw error
      }

      // Reload transactions
      await loadTransactions()

      return {}
    } catch (err: any) {
      return { error: err.message }
    }
  }

  const value = {
    transactions,
    loading,
    error,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    loadTransactions,
  }

  return (
    <TransactionContext.Provider value={value}>
      {children}
    </TransactionContext.Provider>
  )
}