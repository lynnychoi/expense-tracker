'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ReportGenerator } from '@/components/reports/ReportGenerator'
import { MonthlyReport } from '@/components/reports/MonthlyReport'
import { YearlyReport } from '@/components/reports/YearlyReport'
import { PrintOptimizedReport } from '@/components/reports/PrintOptimizedReport'
import { FileText, Calendar, CalendarDays, Printer } from 'lucide-react'

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('custom')

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">리포트</h1>
        <p className="text-gray-600 mt-1">
          가계부 데이터를 다양한 형식으로 내보내고 분석하세요
        </p>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="custom" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            사용자 정의
          </TabsTrigger>
          <TabsTrigger value="monthly" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            월별 리포트
          </TabsTrigger>
          <TabsTrigger value="yearly" className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4" />
            연간 리포트
          </TabsTrigger>
          <TabsTrigger value="print" className="flex items-center gap-2">
            <Printer className="w-4 h-4" />
            인쇄용
          </TabsTrigger>
        </TabsList>

        <TabsContent value="custom" className="mt-6">
          <ReportGenerator />
        </TabsContent>

        <TabsContent value="monthly" className="mt-6">
          <MonthlyReport />
        </TabsContent>

        <TabsContent value="yearly" className="mt-6">
          <YearlyReport />
        </TabsContent>

        <TabsContent value="print" className="mt-6">
          <PrintOptimizedReport />
        </TabsContent>
      </Tabs>
    </div>
  )
}