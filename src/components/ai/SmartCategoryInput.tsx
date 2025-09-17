'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Brain, Loader2, Sparkles } from 'lucide-react'
import { categorizeTransaction } from '@/lib/ai'
import { TagAutocomplete } from '@/components/tags/TagAutocomplete'

interface SmartCategoryInputProps {
  description: string
  selectedTags: string[]
  onTagsChange: (tags: string[]) => void
  disabled?: boolean
}

export function SmartCategoryInput({ 
  description, 
  selectedTags, 
  onTagsChange, 
  disabled = false 
}: SmartCategoryInputProps) {
  const [suggestedCategory, setSuggestedCategory] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // AI 카테고리 분류 실행
  const suggestCategory = async () => {
    if (!description.trim() || loading) return

    setLoading(true)
    setError(null)
    
    try {
      const category = await categorizeTransaction(description)
      setSuggestedCategory(category)
    } catch (err) {
      console.error('카테고리 분류 오류:', err)
      setError('AI 카테고리 분류 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // 제안된 카테고리 적용
  const applySuggestedCategory = () => {
    if (suggestedCategory && !selectedTags.includes(suggestedCategory)) {
      onTagsChange([...selectedTags, suggestedCategory])
      setSuggestedCategory(null)
    }
  }

  // 제안 거절
  const rejectSuggestion = () => {
    setSuggestedCategory(null)
  }

  // 설명이 변경되면 자동으로 카테고리 제안 (3글자 이상)
  useEffect(() => {
    if (description.trim().length >= 3) {
      const debounceTimer = setTimeout(() => {
        suggestCategory()
      }, 1000) // 1초 지연

      return () => clearTimeout(debounceTimer)
    } else {
      setSuggestedCategory(null)
    }
  }, [description])

  return (
    <div className="space-y-4">
      {/* 기본 태그 입력 */}
      <TagAutocomplete
        value={selectedTags}
        onChange={onTagsChange}
        disabled={disabled}
      />

      {/* AI 카테고리 제안 */}
      {loading && (
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertDescription>
            AI가 카테고리를 분석하고 있습니다...
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {suggestedCategory && !loading && (
        <Alert>
          <Brain className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span>AI 추천 카테고리:</span>
              <Badge variant="secondary" className="flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                {suggestedCategory}
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={applySuggestedCategory}
                disabled={disabled || selectedTags.includes(suggestedCategory)}
              >
                적용
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={rejectSuggestion}
                disabled={disabled}
              >
                거절
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* 수동 카테고리 분류 버튼 */}
      <div className="flex justify-between items-center">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={suggestCategory}
          disabled={disabled || loading || !description.trim()}
          className="flex items-center gap-2"
        >
          <Brain className="h-4 w-4" />
          {loading ? '분석 중...' : 'AI 카테고리 제안'}
        </Button>
        
        {description.trim().length < 3 && (
          <span className="text-xs text-gray-500">
            3글자 이상 입력하면 자동으로 카테고리를 제안합니다
          </span>
        )}
      </div>
    </div>
  )
}