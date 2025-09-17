'use client'

import { useState, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Plus, X, Hash } from 'lucide-react'
import { getTagColor, getNextAvailableColor } from '@/lib/colors'
import { cn } from '@/lib/utils'

interface TagAutocompleteProps {
  value: string[]
  onChange: (tags: string[]) => void
  existingTags?: string[]
  disabled?: boolean
  label?: string
  placeholder?: string
  maxTags?: number
}

export function TagAutocomplete({
  value,
  onChange,
  existingTags = [],
  disabled = false,
  label = '태그',
  placeholder = '태그를 입력하거나 선택하세요',
  maxTags = 10
}: TagAutocompleteProps) {
  const [open, setOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')

  // Filter existing tags that aren't already selected
  const availableTags = useMemo(() => {
    return existingTags.filter(tag => 
      !value.includes(tag) && 
      tag.toLowerCase().includes(inputValue.toLowerCase())
    )
  }, [existingTags, value, inputValue])

  const addTag = (tagName: string) => {
    const trimmedTag = tagName.trim()
    if (trimmedTag && !value.includes(trimmedTag) && value.length < maxTags) {
      onChange([...value, trimmedTag])
      setInputValue('')
      setOpen(false)
    }
  }

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter(tag => tag !== tagToRemove))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault()
      addTag(inputValue)
    }
  }

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      
      {/* Selected Tags */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((tag, index) => {
            const color = getTagColor(getNextAvailableColor([]).id) // We'll improve this later
            return (
              <Badge
                key={`${tag}-${index}`}
                variant="secondary"
                className="flex items-center gap-1 pr-1"
                style={{
                  backgroundColor: color?.bg,
                  color: color?.text,
                  borderColor: color?.hex
                }}
              >
                <Hash className="w-3 h-3" />
                {tag}
                {!disabled && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-transparent"
                    onClick={() => removeTag(tag)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </Badge>
            )
          })}
        </div>
      )}

      {/* Add New Tag */}
      {!disabled && value.length < maxTags && (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-start h-10"
            >
              <Plus className="w-4 h-4 mr-2" />
              {placeholder}
            </Button>
          </PopoverTrigger>
          
          <PopoverContent className="w-full p-3" align="start">
            <div className="space-y-3">
              <Input
                placeholder="태그 검색 또는 새로 만들기..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
              />
              
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {/* Create new tag option */}
                {inputValue.trim() && !availableTags.includes(inputValue.trim()) && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">새 태그 만들기</p>
                    <Button
                      variant="ghost"
                      className="w-full justify-start h-8 px-2"
                      onClick={() => addTag(inputValue)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      &quot;{inputValue.trim()}&quot; 만들기
                    </Button>
                  </div>
                )}

                {/* Existing tags */}
                {availableTags.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">기존 태그</p>
                    {availableTags.map((tag) => {
                      const color = getTagColor(getNextAvailableColor([]).id)
                      return (
                        <Button
                          key={tag}
                          variant="ghost"
                          className="w-full justify-start h-8 px-2"
                          onClick={() => addTag(tag)}
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: color?.hex }}
                            />
                            <Hash className="w-4 h-4" />
                            {tag}
                          </div>
                        </Button>
                      )
                    })}
                  </div>
                )}

                {!inputValue && availableTags.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    사용 가능한 태그가 없습니다.
                  </p>
                )}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      )}

      {/* Tag limit indicator */}
      {value.length >= maxTags && (
        <p className="text-xs text-muted-foreground">
          최대 {maxTags}개의 태그까지 추가할 수 있습니다.
        </p>
      )}
    </div>
  )
}