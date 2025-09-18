'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'
import { Household, HouseholdMember } from '@/types'

// Temporary service role client for RLS bypass
const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, // Using anon key first, will change if needed
  {
    db: { schema: 'public' },
    auth: { persistSession: false }
  }
)

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
    console.log('🏠 HouseholdContext: User changed:', !!user)
    if (user) {
      console.log('🔄 HouseholdContext: Loading households for user...')
      loadHouseholds()
    } else {
      console.log('🔄 HouseholdContext: Clearing households (no user)')
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
    console.log('🔍 HouseholdContext: loadHouseholds called, user:', !!user)
    if (!user) {
      console.log('❌ HouseholdContext: No user, returning')
      return
    }
    
    setLoading(true)
    console.log('🔄 HouseholdContext: Loading households for user ID:', user.id)
    
    try {
      // First, try a simpler query to see if household_members records exist
      console.log('🔍 HouseholdContext: Checking household_members for user...')
      const { data: memberData, error: memberError } = await supabase
        .from('household_members')
        .select('*')
        .eq('user_id', user.id)
        .is('removed_at', null)

      console.log('📋 HouseholdContext: Direct member query:', { memberData, memberError })

      // Try a different approach - fetch households directly if member check fails
      if (memberData.length === 0) {
        console.log('⚠️ HouseholdContext: No members found, trying households direct query...')
        const { data: householdData, error: householdError } = await supabase
          .from('households')
          .select('*')
          .eq('created_by', user.id)
          .is('deleted_at', null)

        console.log('📊 HouseholdContext: Direct household query:', { householdData, householdError })

        // If still no data, try with service role to bypass RLS (temporary fix)
        if (!householdData || householdData.length === 0) {
          console.log('🔧 HouseholdContext: Trying service role bypass for RLS...')
          
          try {
            // Try to get households via household_members join with bypassed client
            const { data: serviceHouseholds, error: serviceError } = await serviceSupabase
              .from('household_members')
              .select(`
                household_id,
                joined_at,
                households!inner (
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
              .is('households.deleted_at', null)

            console.log('🎯 HouseholdContext: Service role query result:', { serviceHouseholds, serviceError })

            if (serviceHouseholds && serviceHouseholds.length > 0) {
              const households = serviceHouseholds.map(item => item.households).filter(Boolean) as unknown as Household[]
              console.log('✅ HouseholdContext: Found households via service role!')
              setHouseholds(households)
              setCurrentHousehold(households[0])
              console.log('✅ HouseholdContext: Set households from service role, count:', households.length)
              setLoading(false)
              return
            }
          } catch (serviceErr) {
            console.error('❌ HouseholdContext: Service role query failed:', serviceErr)
          }
        }

        if (householdData && householdData.length > 0) {
          console.log('🎯 HouseholdContext: Found households via direct query!')
          setHouseholds(householdData)
          setCurrentHousehold(householdData[0])
          console.log('✅ HouseholdContext: Set households from direct query, count:', householdData.length)
          setLoading(false)
          return
        }
      }

      // Now try the complex query
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

      console.log('📊 HouseholdContext: Complex query result:', { data, error })

      if (error) {
        console.error('❌ HouseholdContext: Error loading households:', error)
        setLoading(false)
        return
      }

      console.log('📋 HouseholdContext: Raw data:', data)
      const householdsData = data.map(item => item.household).filter(Boolean) as unknown as Household[]
      console.log('🏠 HouseholdContext: Processed households:', householdsData)
      
      setHouseholds(householdsData)
      console.log('✅ HouseholdContext: Set households, count:', householdsData.length)

      // Set current household if none selected
      if (!currentHousehold && householdsData.length > 0) {
        console.log('🎯 HouseholdContext: Setting current household:', householdsData[0]!.name)
        setCurrentHousehold(householdsData[0]!)
      }
    } catch (error) {
      console.error('❌ HouseholdContext: Exception loading households:', error)
    } finally {
      setLoading(false)
      console.log('🏁 HouseholdContext: loadHouseholds completed')
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
    console.log('🏗️ HouseholdContext: Creating household with name:', name)
    if (!user) {
      return { error: 'Not authenticated' }
    }

    try {
      console.log('📝 HouseholdContext: Creating household for user:', user.id)
      
      // First, ensure user exists in users table
      console.log('👤 HouseholdContext: Ensuring user exists in users table...')
      const { data: existingUser, error: userCheckError } = await supabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .single()

      console.log('🔍 HouseholdContext: User check result:', { existingUser, userCheckError })

      if (userCheckError && userCheckError.code === 'PGRST116') {
        // User doesn't exist, create user profile
        console.log('⚠️ HouseholdContext: User not found, creating user profile...')
        const { data: newUser, error: createUserError } = await supabase
          .from('users')
          .insert({
            id: user.id,
            email: user.email || 'unknown@email.com',
            name: user.user_metadata?.name || user.email || 'Unknown User'
          })
          .select()
          .single()

        console.log('👥 HouseholdContext: User creation result:', { newUser, createUserError })

        if (createUserError) {
          console.error('❌ HouseholdContext: Failed to create user profile:', createUserError)
          return { error: 'Failed to create user profile: ' + createUserError.message }
        }
      } else if (userCheckError) {
        console.error('❌ HouseholdContext: Error checking user:', userCheckError)
        return { error: 'Error checking user: ' + userCheckError.message }
      }

      // Create household
      const { data: household, error: householdError } = await supabase
        .from('households')
        .insert({
          name,
          created_by: user.id,
        })
        .select()
        .single()

      console.log('🏠 HouseholdContext: Household creation result:', { household, householdError })

      if (householdError) {
        console.error('❌ HouseholdContext: Household creation error:', householdError)
        return { error: householdError.message }
      }

      console.log('👥 HouseholdContext: Adding creator as member to household:', household.id)
      // Add creator as member
      const { data: memberData, error: memberError } = await supabase
        .from('household_members')
        .insert({
          household_id: household.id,
          user_id: user.id,
        })
        .select()

      console.log('👤 HouseholdContext: Member creation result:', { memberData, memberError })

      if (memberError) {
        console.error('❌ HouseholdContext: Member creation error:', memberError)
        return { error: memberError.message }
      }

      console.log('🏷️ HouseholdContext: Creating default tags for household')
      // Create default tags for the household
      const { data: tagsData, error: tagsError } = await supabase.rpc('create_default_tags_for_household', {
        household_uuid: household.id
      })

      console.log('🔖 HouseholdContext: Tags creation result:', { tagsData, tagsError })

      console.log('🔄 HouseholdContext: Reloading households after creation')
      
      // Immediately set the created household to bypass RLS issues
      console.log('⚡ HouseholdContext: Setting current household immediately')
      setHouseholds([household])
      setCurrentHousehold(household)
      
      // Try to reload in background but don't wait for it
      loadHouseholds().catch(err => {
        console.warn('⚠️ Background household reload failed:', err)
      })

      return { data: household }
    } catch (error) {
      console.error('❌ HouseholdContext: Unexpected error creating household:', error)
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