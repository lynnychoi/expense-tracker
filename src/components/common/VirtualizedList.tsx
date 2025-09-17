'use client'

import { useVirtualScrolling } from '@/hooks/usePerformance'
import { useRef, useEffect } from 'react'

interface VirtualizedListProps<T> {
  items: T[]
  itemHeight: number
  height: number
  renderItem: (item: T, index: number) => React.ReactNode
  className?: string
  overscan?: number
}

export function VirtualizedList<T>({
  items,
  itemHeight,
  height,
  renderItem,
  className = '',
  overscan = 5
}: VirtualizedListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null)
  
  const {
    visibleItems,
    totalHeight,
    offsetY,
    handleScroll,
    visibleStartIndex
  } = useVirtualScrolling(items, itemHeight, height)

  // Add overscan to show more items above and below visible area
  const startIndex = Math.max(0, visibleStartIndex - overscan)
  const endIndex = Math.min(
    items.length - 1,
    visibleStartIndex + Math.ceil(height / itemHeight) + overscan
  )
  
  const itemsToRender = items.slice(startIndex, endIndex + 1)
  const offsetWithOverscan = startIndex * itemHeight

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${offsetWithOverscan}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0
          }}
        >
          {itemsToRender.map((item, index) => (
            <div
              key={startIndex + index}
              style={{ height: itemHeight }}
              className="flex items-center"
            >
              {renderItem(item, startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Specialized virtualized transaction list
interface Transaction {
  id: string
  date: string
  description: string
  amount: number
  transaction_type: 'income' | 'expense'
  tags?: Array<{ name: string }>
}

interface VirtualizedTransactionListProps {
  transactions: Transaction[]
  onTransactionClick?: (transaction: Transaction) => void
  height?: number
}

export function VirtualizedTransactionList({
  transactions,
  onTransactionClick,
  height = 400
}: VirtualizedTransactionListProps) {
  return (
    <VirtualizedList
      items={transactions}
      itemHeight={72} // Height for each transaction item
      height={height}
      renderItem={(transaction, index) => (
        <div
          className="w-full p-4 border-b hover:bg-gray-50 cursor-pointer transition-colors"
          onClick={() => onTransactionClick?.(transaction)}
        >
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <p className="font-medium text-gray-900">
                {transaction.description}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-gray-500">
                  {new Date(transaction.date).toLocaleDateString('ko-KR')}
                </span>
                {transaction.tags?.map((tag, tagIndex) => (
                  <span
                    key={tagIndex}
                    className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full"
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            </div>
            <div className="text-right">
              <span
                className={`font-semibold ${
                  transaction.transaction_type === 'income'
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}
              >
                {transaction.transaction_type === 'income' ? '+' : '-'}
                {transaction.amount.toLocaleString('ko-KR')}원
              </span>
              <p className="text-xs text-gray-500 mt-1">
                {transaction.transaction_type === 'income' ? '수입' : '지출'}
              </p>
            </div>
          </div>
        </div>
      )}
    />
  )
}