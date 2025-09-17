'use client'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, X, Eye } from 'lucide-react'
import { formatKRW } from '@/lib/currency'
import type { DuplicateMatch } from '@/lib/duplicateDetection'
import type { Transaction } from '@/contexts/TransactionContext'

interface DuplicateWarningProps {
  matches: DuplicateMatch[]
  onDismiss: () => void
  onViewTransaction?: (transaction: Transaction) => void
  className?: string
}

export function DuplicateWarning({ 
  matches, 
  onDismiss, 
  onViewTransaction,
  className 
}: DuplicateWarningProps) {
  if (matches.length === 0) return null

  const topMatch = matches[0]
  const confidence = Math.round(topMatch.similarity * 100)
  
  // Determine alert variant based on confidence
  const getAlertVariant = (confidence: number) => {
    if (confidence >= 90) return 'destructive'
    if (confidence >= 70) return 'default'
    return 'default'
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'bg-red-100 text-red-800 border-red-200'
    if (confidence >= 70) return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    return 'bg-blue-100 text-blue-800 border-blue-200'
  }

  return (
    <Alert variant={getAlertVariant(confidence)} className={className}>
      <AlertTriangle className="h-4 w-4" />
      <div className="flex-1">
        <AlertDescription>
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <Badge 
                  variant="outline" 
                  className={getConfidenceColor(confidence)}
                >
                  {confidence}% 중복 가능성
                </Badge>
                <span className="text-sm font-medium">
                  유사한 거래가 발견되었습니다
                </span>
              </div>

              {/* Top match details */}
              <div className="bg-gray-50 p-3 rounded-md space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-sm">
                      {topMatch.transaction.description}
                    </p>
                    <p className="text-xs text-gray-600">
                      {topMatch.transaction.date} • {topMatch.transaction.payment_method}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold text-sm ${
                      topMatch.transaction.type === 'income' 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      {topMatch.transaction.type === 'income' ? '+' : '-'}
                      {formatKRW(topMatch.transaction.amount)}
                    </p>
                  </div>
                </div>

                {/* Similarity reasons */}
                <div className="flex flex-wrap gap-1">
                  {topMatch.reasons.map((reason, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {reason}
                    </Badge>
                  ))}
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 mt-2">
                  {onViewTransaction && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onViewTransaction(topMatch.transaction)}
                      className="text-xs h-7"
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      상세보기
                    </Button>
                  )}
                </div>
              </div>

              {/* Additional matches */}
              {matches.length > 1 && (
                <p className="text-xs text-gray-600">
                  + {matches.length - 1}개의 추가 유사 거래가 있습니다
                </p>
              )}

              <p className="text-xs text-gray-600">
                계속 진행하면 새로운 거래로 등록됩니다.
              </p>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className="h-6 w-6 p-0 ml-2"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </AlertDescription>
      </div>
    </Alert>
  )
}