'use client'

import { useHousehold } from '@/contexts/HouseholdContext'
import { Navigation } from '@/components/layout/Navigation'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { currentHousehold } = useHousehold()

  if (!currentHousehold) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            가구를 선택하거나 생성하세요
          </h3>
          <p className="text-gray-500">
            서비스를 이용하려면 먼저 가구를 설정해야 합니다.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}