'use client'

import { useState } from 'react'
import { useHousehold } from '@/contexts/HouseholdContext'
import { useTransactions, type Transaction } from '@/contexts/TransactionContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TransactionSearch } from './TransactionSearch'
import { TransactionList } from './TransactionList'
import { AddTransactionModal } from './AddTransactionModal'
import { Plus, Search } from 'lucide-react'

export function TransactionsView() {
  const { currentHousehold } = useHousehold()
  const { transactions } = useTransactions()
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>(transactions)

  if (!currentHousehold) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            가구를 선택하거나 생성하세요
          </h3>
          <p className="text-gray-500">
            거래 내역을 보려면 먼저 가구를 설정해야 합니다.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">거래 내역</h1>
          <p className="text-gray-600 mt-1">
            {currentHousehold.name}의 모든 거래를 검색하고 관리하세요
          </p>
        </div>
        <AddTransactionModal>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            거래 추가
          </Button>
        </AddTransactionModal>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            거래 검색 및 필터
          </CardTitle>
          <CardDescription>
            다양한 조건으로 거래를 검색하고 필터링할 수 있습니다
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TransactionSearch
            onResultsChange={setFilteredTransactions}
          />
        </CardContent>
      </Card>

      {/* Transaction List */}
      <Card>
        <CardHeader>
          <CardTitle>거래 목록</CardTitle>
          <CardDescription>
            검색 결과에 따른 거래 목록입니다
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TransactionList transactions={filteredTransactions} />
        </CardContent>
      </Card>
    </div>
  )
}