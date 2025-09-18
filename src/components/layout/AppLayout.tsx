'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useHousehold } from '@/contexts/HouseholdContext'
import { AuthPage } from '@/components/auth/AuthPage'
import { HouseholdSetup } from '@/components/household/HouseholdSetup'
import { Navigation } from '@/components/layout/Navigation'

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user, loading: authLoading } = useAuth()
  const { households, loading: householdLoading } = useHousehold()

  // Show loading state
  if (authLoading) {
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
    return <AuthPage />
  }

  // Show household setup if no households
  if (!householdLoading && households.length === 0) {
    return <HouseholdSetup />
  }

  // Show main app with navigation
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}