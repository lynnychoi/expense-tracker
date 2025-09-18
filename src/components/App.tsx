'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useHousehold } from '@/contexts/HouseholdContext'
import { AuthPage } from '@/components/auth/AuthPage'
import { HouseholdSetup } from '@/components/household/HouseholdSetup'
import { Navigation } from '@/components/layout/Navigation'
import { Dashboard } from '@/components/dashboard/Dashboard'
import { TransactionsView } from '@/components/transactions/TransactionsView'
import { HouseholdManager } from '@/components/household/HouseholdManager'
import { ProfileManager } from '@/components/profile/ProfileManager'

export function App() {
  const { user, loading: authLoading } = useAuth()
  const { households, loading: householdLoading } = useHousehold()
  const [currentView, setCurrentView] = useState('dashboard')

  console.log('🏠 App: State check:', {
    user: !!user,
    authLoading,
    householdLoading,
    householdsLength: households.length
  })

  // Show loading state for auth
  if (authLoading) {
    console.log('🔄 App: Showing auth loading...')
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  // Show auth page if not logged in
  if (!user) {
    console.log('🔐 App: No user, showing AuthPage...')
    return <AuthPage />
  }

  // Show household setup if no households
  if (!householdLoading && households.length === 0) {
    console.log('🏠 App: No households, showing HouseholdSetup...')
    return <HouseholdSetup />
  }

  // Show loading for households
  if (householdLoading) {
    console.log('🔄 App: Showing household loading...')
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">가구 정보 로딩 중...</p>
        </div>
      </div>
    )
  }

  // Show main app
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        {currentView === 'dashboard' && <Dashboard />}
        {currentView === 'transactions' && <TransactionsView />}
        {currentView === 'household' && <HouseholdManager />}
        {currentView === 'profile' && <ProfileManager />}
      </main>
    </div>
  )
}