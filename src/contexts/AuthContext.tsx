'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { User as AppUser } from '@/types'

interface AuthContextType {
  user: User | null
  userProfile: AppUser | null
  loading: boolean
  signUp: (email: string, password: string, name: string) => Promise<{ error?: string }>
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<AppUser>) => Promise<{ error?: string }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    console.log('🔄 AuthContext: Initializing auth state...')
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('🔍 AuthContext: Initial session:', !!session?.user)
      setUser(session?.user ?? null)
      if (session?.user) {
        console.log('🔄 AuthContext: Loading user profile...')
        loadUserProfile(session.user.id)
      } else {
        console.log('✅ AuthContext: No session, setting loading to false')
        setLoading(false)
      }
    }).catch(error => {
      console.error('❌ AuthContext: Error getting session:', error)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 AuthContext: Auth state changed:', event, !!session?.user)
      setUser(session?.user ?? null)
      if (session?.user) {
        console.log('🔄 AuthContext: Loading user profile after auth change...')
        await loadUserProfile(session.user.id)
      } else {
        setUserProfile(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const loadUserProfile = async (userId: string) => {
    try {
      console.log('🔍 AuthContext: Loading profile for user:', userId)
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('❌ AuthContext: Error loading user profile:', error)
        setLoading(false) // Ensure loading is set to false even on error
        return
      }

      console.log('✅ AuthContext: User profile loaded:', !!data)
      setUserProfile(data)
      setLoading(false) // Ensure loading is set to false after successful load
    } catch (error) {
      console.error('❌ AuthContext: Error loading user profile:', error)
      setLoading(false) // Ensure loading is set to false even on error
    }
  }

  const signUp = async (email: string, password: string, name: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
          emailRedirectTo: undefined, // Disable email confirmation for development
        },
      })

      if (error) {
        return { error: error.message }
      }

      // If user is immediately available (no email confirmation required), load profile
      if (data.user && !data.user.email_confirmed_at) {
        // For development: automatically confirm email to skip verification
        try {
          // Note: This approach requires adjusting Supabase settings
          // For now, let's try to sign in immediately after signup
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
          })
          
          if (signInError) {
            return { error: 'Signup successful but auto-login failed. Please try logging in manually.' }
          }
        } catch (signInError) {
          return { error: 'Signup successful but auto-login failed. Please try logging in manually.' }
        }
      }

      return {}
    } catch (error) {
      return { error: 'An unexpected error occurred' }
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        return { error: error.message }
      }

      return {}
    } catch (error) {
      return { error: 'An unexpected error occurred' }
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const updateProfile = async (updates: Partial<AppUser>) => {
    if (!user) {
      return { error: 'Not authenticated' }
    }

    try {
      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id)

      if (error) {
        return { error: error.message }
      }

      // Update local state
      setUserProfile(prev => prev ? { ...prev, ...updates } : null)
      return {}
    } catch (error) {
      return { error: 'An unexpected error occurred' }
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        signUp,
        signIn,
        signOut,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}