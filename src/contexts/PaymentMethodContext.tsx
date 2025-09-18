'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from './AuthContext'
import { useHousehold } from './HouseholdContext'
import { supabase } from '@/lib/supabase'

export interface PaymentMethod {
  id: string
  household_id: string
  name: string
  description: string | null
  icon: string | null
  color: string | null
  is_active: boolean
  is_default: boolean
  created_at: string
  updated_at: string
  created_by: string
  updated_by: string
}

export interface CreatePaymentMethodData {
  name: string
  description?: string
  icon?: string
  color?: string
  is_default?: boolean
}

export interface UpdatePaymentMethodData {
  name?: string
  description?: string
  icon?: string
  color?: string
  is_active?: boolean
  is_default?: boolean
}

interface PaymentMethodContextType {
  paymentMethods: PaymentMethod[]
  loading: boolean
  createPaymentMethod: (data: CreatePaymentMethodData) => Promise<{ data?: PaymentMethod; error?: string }>
  updatePaymentMethod: (id: string, data: UpdatePaymentMethodData) => Promise<{ data?: PaymentMethod; error?: string }>
  deletePaymentMethod: (id: string) => Promise<{ error?: string }>
  setDefaultPaymentMethod: (id: string) => Promise<{ error?: string }>
  getDefaultPaymentMethods: () => string[]
  getAllPaymentMethods: () => string[] // Including built-in methods
}

const PaymentMethodContext = createContext<PaymentMethodContextType | undefined>(undefined)

// Built-in Korean payment methods
const BUILT_IN_PAYMENT_METHODS = [
  '현금',
  '신용카드', 
  '체크카드',
  '계좌이체',
  '기타'
]

export function PaymentMethodProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const { currentHousehold } = useHousehold()
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [loading, setLoading] = useState(false)

  // Load payment methods when household changes
  useEffect(() => {
    if (currentHousehold && user) {
      loadPaymentMethods()
    } else {
      setPaymentMethods([])
    }
  }, [currentHousehold, user])

  const loadPaymentMethods = async () => {
    if (!currentHousehold) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('household_id', currentHousehold.id)
        .eq('is_active', true)
        .order('name')

      if (error) {
        console.error('Error loading payment methods:', error)
        // If tables don't exist yet, just set empty array
        setPaymentMethods([])
      } else {
        setPaymentMethods(data || [])
      }
    } catch (error) {
      console.error('Error loading payment methods:', error)
    } finally {
      setLoading(false)
    }
  }

  const createPaymentMethod = async (data: CreatePaymentMethodData): Promise<{ data?: PaymentMethod; error?: string }> => {
    if (!currentHousehold || !user) {
      return { error: '가구가 선택되지 않았습니다' }
    }

    try {
      // If setting as default, first unset other defaults
      if (data.is_default) {
        await supabase
          .from('payment_methods')
          .update({ 
            is_default: false,
            updated_by: user.id,
            updated_at: new Date().toISOString()
          })
          .eq('household_id', currentHousehold.id)
      }

      const { data: result, error } = await supabase
        .from('payment_methods')
        .insert({
          household_id: currentHousehold.id,
          name: data.name,
          description: data.description || null,
          icon: data.icon || null,
          color: data.color || null,
          is_default: data.is_default || false,
          created_by: user.id,
          updated_by: user.id
        })
        .select()
        .single()

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          return { error: '이미 같은 이름의 결제 방법이 존재합니다' }
        }
        return { error: error.message }
      }

      // Reload payment methods
      await loadPaymentMethods()
      return { data: result }
    } catch (error: any) {
      return { error: error.message }
    }
  }

  const updatePaymentMethod = async (id: string, data: UpdatePaymentMethodData): Promise<{ data?: PaymentMethod; error?: string }> => {
    if (!currentHousehold || !user) {
      return { error: '가구가 선택되지 않았습니다' }
    }

    try {
      // If setting as default, first unset other defaults
      if (data.is_default) {
        await supabase
          .from('payment_methods')
          .update({ 
            is_default: false,
            updated_by: user.id,
            updated_at: new Date().toISOString()
          })
          .eq('household_id', currentHousehold.id)
          .neq('id', id)
      }

      const { data: result, error } = await supabase
        .from('payment_methods')
        .update({
          ...data,
          updated_by: user.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          return { error: '이미 같은 이름의 결제 방법이 존재합니다' }
        }
        return { error: error.message }
      }

      // Reload payment methods
      await loadPaymentMethods()
      return { data: result }
    } catch (error: any) {
      return { error: error.message }
    }
  }

  const deletePaymentMethod = async (id: string): Promise<{ error?: string }> => {
    if (!currentHousehold) {
      return { error: '가구가 선택되지 않았습니다' }
    }

    try {
      // Check if this payment method is being used in transactions
      const { data: transactions, error: checkError } = await supabase
        .from('transactions')
        .select('id')
        .eq('household_id', currentHousehold.id)
        .eq('payment_method', paymentMethods.find(p => p.id === id)?.name)
        .limit(1)

      if (checkError) {
        return { error: checkError.message }
      }

      if (transactions && transactions.length > 0) {
        return { error: '이 결제 방법을 사용한 거래가 있어 삭제할 수 없습니다' }
      }

      const { error } = await supabase
        .from('payment_methods')
        .delete()
        .eq('id', id)

      if (error) {
        return { error: error.message }
      }

      // Reload payment methods
      await loadPaymentMethods()
      return {}
    } catch (error: any) {
      return { error: error.message }
    }
  }

  const setDefaultPaymentMethod = async (id: string): Promise<{ error?: string }> => {
    return updatePaymentMethod(id, { is_default: true })
  }

  const getDefaultPaymentMethods = (): string[] => {
    return BUILT_IN_PAYMENT_METHODS
  }

  const getAllPaymentMethods = (): string[] => {
    const customMethods = paymentMethods.map(pm => pm.name)
    return [...BUILT_IN_PAYMENT_METHODS, ...customMethods]
  }

  const value: PaymentMethodContextType = {
    paymentMethods,
    loading,
    createPaymentMethod,
    updatePaymentMethod,
    deletePaymentMethod,
    setDefaultPaymentMethod,
    getDefaultPaymentMethods,
    getAllPaymentMethods
  }

  return (
    <PaymentMethodContext.Provider value={value}>
      {children}
    </PaymentMethodContext.Provider>
  )
}

export function usePaymentMethods() {
  const context = useContext(PaymentMethodContext)
  if (context === undefined) {
    throw new Error('usePaymentMethods must be used within a PaymentMethodProvider')
  }
  return context
}