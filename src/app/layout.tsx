import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { HouseholdProvider } from '@/contexts/HouseholdContext'
import { TransactionProvider } from '@/contexts/TransactionContext'
import { PaymentMethodProvider } from '@/contexts/PaymentMethodContext'
import { BudgetProvider } from '@/contexts/BudgetContext'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'
import { PWAFeatures } from '@/components/common/PWAInstallPrompt'
import { Toaster } from 'sonner'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '가계부 - Korean Household Expense Tracker',
  description: '가족과 함께 사용하는 한국형 가계부 앱',
  keywords: ['가계부', '가족', '예산', '지출', '수입', '재정관리'],
  authors: [{ name: '가계부팀' }],
  robots: 'index, follow',
  manifest: '/manifest.json',
  openGraph: {
    title: '가계부 - Korean Household Expense Tracker',
    description: '가족과 함께 사용하는 한국형 가계부 앱',
    type: 'website',
    locale: 'ko_KR',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '가계부',
  },
  icons: {
    icon: [
      { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#1f2937' }
  ]
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        <ErrorBoundary>
          <AuthProvider>
            <HouseholdProvider>
              <PaymentMethodProvider>
                <TransactionProvider>
                  <BudgetProvider>
                    {children}
                    <PWAFeatures />
                    <Toaster position="top-right" />
                  </BudgetProvider>
                </TransactionProvider>
              </PaymentMethodProvider>
            </HouseholdProvider>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}