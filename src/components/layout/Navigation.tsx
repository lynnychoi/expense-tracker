'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useHousehold } from '@/contexts/HouseholdContext'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Home, 
  CreditCard, 
  PiggyBank, 
  BarChart3, 
  Settings, 
  Users, 
  LogOut,
  Menu,
  X,
  FileText
} from 'lucide-react'

const navigation = [
  { name: '대시보드', href: '/', icon: Home },
  { name: '거래 내역', href: '/transactions', icon: CreditCard },
  { name: '예산 관리', href: '/budget', icon: PiggyBank },
  { name: '분석', href: '/analytics', icon: BarChart3 },
  { name: '리포트', href: '/reports', icon: FileText },
  { name: '설정', href: '/settings', icon: Settings },
]

export function Navigation() {
  const pathname = usePathname()
  const { currentHousehold, householdMembers } = useHousehold()
  const { user, signOut } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and main navigation */}
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-xl font-bold text-gray-900">
                가계부
              </Link>
            </div>
            
            {/* Desktop navigation */}
            <div className="hidden md:ml-6 md:flex md:space-x-8">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      isActive
                        ? 'border-blue-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    <item.icon className="w-4 h-4 mr-2" />
                    {item.name}
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {/* Household info */}
            {currentHousehold && (
              <div className="hidden md:flex items-center space-x-2">
                <Users className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-700">{currentHousehold.name}</span>
                <Badge variant="outline" className="text-xs">
                  {householdMembers.length}명
                </Badge>
              </div>
            )}

            {/* User menu */}
            <div className="flex items-center space-x-2">
              <span className="hidden md:block text-sm text-gray-700">
                {user?.email}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => signOut()}
                className="text-gray-500 hover:text-gray-700"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden md:ml-2 md:block">로그아웃</span>
              </Button>
            </div>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden">
          <div className="pt-2 pb-3 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                    isActive
                      ? 'bg-blue-50 border-blue-500 text-blue-700'
                      : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className="flex items-center">
                    <item.icon className="w-5 h-5 mr-3" />
                    {item.name}
                  </div>
                </Link>
              )
            })}
          </div>
          
          {/* Mobile household info */}
          {currentHousehold && (
            <div className="pt-4 pb-3 border-t border-gray-200">
              <div className="flex items-center px-4">
                <Users className="w-5 h-5 text-gray-400 mr-2" />
                <span className="text-sm font-medium text-gray-900">
                  {currentHousehold.name}
                </span>
                <Badge variant="outline" className="ml-2 text-xs">
                  {householdMembers.length}명
                </Badge>
              </div>
              <div className="mt-2 px-4">
                <span className="text-xs text-gray-500">{user?.email}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </nav>
  )
}