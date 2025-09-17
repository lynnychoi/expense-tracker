'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Check, Palette } from 'lucide-react'
import { TAG_COLORS, type TagColorId, getTagColor } from '@/lib/colors'
import { cn } from '@/lib/utils'

interface ColorPickerProps {
  value?: TagColorId
  onChange: (colorId: TagColorId) => void
  disabled?: boolean
  usedColors?: TagColorId[]
  label?: string
  placeholder?: string
}

export function ColorPicker({
  value,
  onChange,
  disabled = false,
  usedColors = [],
  label = '색상',
  placeholder = '색상을 선택하세요'
}: ColorPickerProps) {
  const [open, setOpen] = useState(false)
  const selectedColor = value ? getTagColor(value) : null

  const handleColorSelect = (colorId: TagColorId) => {
    onChange(colorId)
    setOpen(false)
  }

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-start h-10"
            disabled={disabled}
          >
            {selectedColor ? (
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-full border"
                  style={{ backgroundColor: selectedColor.hex }}
                />
                <span>{selectedColor.name}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Palette className="w-4 h-4" />
                <span>{placeholder}</span>
              </div>
            )}
          </Button>
        </PopoverTrigger>
        
        <PopoverContent className="w-80 p-4" align="start">
          <div className="space-y-3">
            <h4 className="font-medium text-sm">색상 선택</h4>
            
            <div className="grid grid-cols-6 gap-2">
              {TAG_COLORS.map((color) => {
                const isSelected = value === color.id
                const isUsed = usedColors.includes(color.id) && !isSelected
                
                return (
                  <button
                    key={color.id}
                    type="button"
                    onClick={() => handleColorSelect(color.id)}
                    disabled={isUsed}
                    className={cn(
                      "relative w-8 h-8 rounded-full border-2 transition-all hover:scale-110",
                      "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500",
                      isSelected && "ring-2 ring-gray-900 ring-offset-2",
                      isUsed && "opacity-30 cursor-not-allowed hover:scale-100"
                    )}
                    style={{ backgroundColor: color.hex }}
                    title={`${color.name}${isUsed ? ' (이미 사용됨)' : ''}`}
                  >
                    {isSelected && (
                      <Check className="w-4 h-4 text-white absolute inset-0 m-auto drop-shadow-sm" />
                    )}
                  </button>
                )
              })}
            </div>
            
            {usedColors.length > 0 && (
              <p className="text-xs text-muted-foreground">
                회색으로 표시된 색상은 이미 사용 중입니다.
              </p>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}