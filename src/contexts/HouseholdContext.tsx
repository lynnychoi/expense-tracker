'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Household, HouseholdMember } from '@/types'

interface HouseholdContextType {
  households: Household[]
  currentHousehold: Household | null
  householdMembers: HouseholdMember[]
  loading: boolean
  createHousehold: (name: string) => Promise<{ data?: Household; error?: string }>
  joinHousehold: (inviteCode: string) => Promise<{ error?: string }>
  switchHousehold: (householdId: string) => void
  leaveHousehold: (householdId: string) => Promise<{ error?: string }>
  removeMember: (householdId: string, userId: string) => Promise<{ error?: string }>
  loadHouseholds: () => Promise<void>
}

const HouseholdContext = createContext<HouseholdContextType | undefined>(undefined)

export function HouseholdProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [households, setHouseholds] = useState<Household[]>([])
  const [currentHousehold, setCurrentHousehold] = useState<Household | null>(null)
  const [householdMembers, setHouseholdMembers] = useState<HouseholdMember[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) {
      loadHouseholds()
    } else {
      setHouseholds([])
      setCurrentHousehold(null)
      setHouseholdMembers([])
    }
  }, [user])

  useEffect(() => {
    if (currentHousehold) {
      loadHouseholdMembers()
    }
  }, [currentHousehold])

  const loadHouseholds = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('household_members')
        .select(`
          household_id,
          joined_at,
          household:households!inner (
            id,
            name,
            created_by,
            invite_code,
            created_at,
            updated_at,
            deleted_at
          )
        `)
        .eq('user_id', user.id)
        .is('removed_at', null)
        .is('household.deleted_at', null)

      if (error) {
        console.error('Error loading households:', error)
        return
      }

      const householdsData = data.map(item => item.household).filter(Boolean)
      setHouseholds(householdsData)

      // Set current household if none selected
      if (!currentHousehold && householdsData.length > 0) {
        setCurrentHousehold(householdsData[0]!)
      }
    } catch (error) {
      console.error('Error loading households:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadHouseholdMembers = async () => {
    if (!currentHousehold) return

    try {
      const { data, error } = await supabase
        .from('household_members')
        .select(`
          id,
          household_id,
          user_id,
          joined_at,
          removed_at,
          user:users!inner (
            id,
            name,
            email,
            avatar_url
          )
        `)
        .eq('household_id', currentHousehold.id)
        .is('removed_at', null)

      if (error) {
        console.error('Error loading household members:', error)
        return
      }

      setHouseholdMembers(data as any)
    } catch (error) {
      console.error('Error loading household members:', error)
    }
  }

  const createHousehold = async (name: string) => {
    if (!user) {
      return { error: 'Not authenticated' }
    }

    try {
      // Create household
      const { data: household, error: householdError } = await supabase
        .from('households')
        .insert({
          name,
          created_by: user.id,
        })
        .select()
        .single()

      if (householdError) {
        return { error: householdError.message }
      }

      // Add creator as member
      const { error: memberError } = await supabase
        .from('household_members')
        .insert({
          household_id: household.id,
          user_id: user.id,
        })

      if (memberError) {
        return { error: memberError.message }
      }

      // Create default tags for the household
      await supabase.rpc('create_default_tags_for_household', {
        household_uuid: household.id
      })

      await loadHouseholds()
      setCurrentHousehold(household)

      return { data: household }
    } catch (error) {
      return { error: 'An unexpected error occurred' }
    }
  }

  const joinHousehold = async (inviteCode: string) => {
    if (!user) {
      return { error: 'Not authenticated' }
    }

    try {
      // Find household by invite code
      const { data: household, error: findError } = await supabase
        .from('households')
        .select('*')
        .eq('invite_code', inviteCode.toLowerCase())
        .is('deleted_at', null)
        .single()

      if (findError || !household) {
        return { error: '유효하지 않은 초대 코드입니다' }
      }

      // Check if already a member
      const { data: existingMember } = await supabase
        .from('household_members')
        .select('id')
        .eq('household_id', household.id)
        .eq('user_id', user.id)
        .is('removed_at', null)
        .single()

      if (existingMember) {
        return { error: '이미 가입된 가구입니다' }
      }

      // Check member limit
      const { count } = await supabase
        .from('household_members')
        .select('*', { count: 'exact', head: true })
        .eq('household_id', household.id)
        .is('removed_at', null)

      if (count && count >= 7) {
        return { error: '가구 구성원 수가 최대치에 도달했습니다 (최대 7명)' }
      }

      // Add as member
      const { error: memberError } = await supabase
        .from('household_members')
        .insert({
          household_id: household.id,
          user_id: user.id,
        })

      if (memberError) {
        return { error: memberError.message }
      }

      await loadHouseholds()
      setCurrentHousehold(household)

      return {}
    } catch (error) {
      return { error: 'An unexpected error occurred' }
    }
  }

  const switchHousehold = (householdId: string) => {
    const household = households.find(h => h.id === householdId)
    if (household) {
      setCurrentHousehold(household)
    }
  }

  const leaveHousehold = async (householdId: string) => {
    if (!user) {
      return { error: 'Not authenticated' }
    }

    try {
      const { error } = await supabase
        .from('household_members')
        .update({ removed_at: new Date().toISOString() })
        .eq('household_id', householdId)
        .eq('user_id', user.id)

      if (error) {
        return { error: error.message }
      }

      await loadHouseholds()
      
      // Switch to another household if current one was left
      if (currentHousehold?.id === householdId) {
        const remainingHouseholds = households.filter(h => h.id !== householdId)
        setCurrentHousehold(remainingHouseholds.length > 0 ? remainingHouseholds[0]! : null)
      }

      return {}
    } catch (error) {
      return { error: 'An unexpected error occurred' }
    }
  }

  const removeMember = async (householdId: string, userId: string) => {
    if (!user) {
      return { error: 'Not authenticated' }
    }

    try {
      // Check if current user is the household creator
      const household = households.find(h => h.id === householdId)
      if (!household || household.created_by !== user.id) {
        return { error: '가구 생성자만 구성원을 제거할 수 있습니다' }
      }

      const { error } = await supabase
        .from('household_members')
        .update({ removed_at: new Date().toISOString() })
        .eq('household_id', householdId)
        .eq('user_id', userId)

      if (error) {
        return { error: error.message }
      }

      await loadHouseholdMembers()
      return {}
    } catch (error) {
      return { error: 'An unexpected error occurred' }
    }
  }

  return (
    <HouseholdContext.Provider
      value={{
        households,
        currentHousehold,
        householdMembers,
        loading,
        createHousehold,
        joinHousehold,
        switchHousehold,
        leaveHousehold,
        removeMember,
        loadHouseholds,
      }}
    >
      {children}
    </HouseholdContext.Provider>
  )
}

export function useHousehold() {
  const context = useContext(HouseholdContext)
  if (context === undefined) {
    throw new Error('useHousehold must be used within a HouseholdProvider')
  }
  return context
}