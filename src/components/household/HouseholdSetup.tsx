'use client'

import { useState } from 'react'
import { CreateHouseholdForm } from './CreateHouseholdForm'
import { JoinHouseholdForm } from './JoinHouseholdForm'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export function HouseholdSetup() {
  const [activeTab, setActiveTab] = useState('create')

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">가구 설정</h2>
          <p className="mt-2 text-sm text-gray-600">
            가구를 만들거나 기존 가구에 참여하세요
          </p>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="create">가구 만들기</TabsTrigger>
            <TabsTrigger value="join">가구 참여</TabsTrigger>
          </TabsList>
          
          <TabsContent value="create" className="mt-6">
            <CreateHouseholdForm />
          </TabsContent>
          
          <TabsContent value="join" className="mt-6">
            <JoinHouseholdForm />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}