// 30-color palette optimized for Korean expense tracking
// Colors are carefully selected for accessibility and visual distinction
export const TAG_COLORS = [
  // Primary colors (bright, for major categories)
  { id: 'red', name: '빨강', hex: '#ef4444', bg: '#fef2f2', text: '#991b1b' },
  { id: 'blue', name: '파랑', hex: '#3b82f6', bg: '#eff6ff', text: '#1e40af' },
  { id: 'green', name: '초록', hex: '#10b981', bg: '#f0fdf4', text: '#059669' },
  { id: 'yellow', name: '노랑', hex: '#f59e0b', bg: '#fffbeb', text: '#d97706' },
  { id: 'purple', name: '보라', hex: '#8b5cf6', bg: '#f5f3ff', text: '#7c3aed' },
  
  // Secondary colors (medium saturation)
  { id: 'pink', name: '분홍', hex: '#ec4899', bg: '#fdf2f8', text: '#be185d' },
  { id: 'indigo', name: '남색', hex: '#6366f1', bg: '#eef2ff', text: '#4338ca' },
  { id: 'teal', name: '청록', hex: '#14b8a6', bg: '#f0fdfa', text: '#0f766e' },
  { id: 'orange', name: '주황', hex: '#f97316', bg: '#fff7ed', text: '#ea580c' },
  { id: 'cyan', name: '하늘', hex: '#06b6d4', bg: '#ecfeff', text: '#0891b2' },
  
  // Warm colors
  { id: 'rose', name: '장미', hex: '#f43f5e', bg: '#fff1f2', text: '#e11d48' },
  { id: 'amber', name: '호박', hex: '#f59e0b', bg: '#fffbeb', text: '#d97706' },
  { id: 'lime', name: '라임', hex: '#84cc16', bg: '#f7fee7', text: '#65a30d' },
  { id: 'emerald', name: '에메랄드', hex: '#10b981', bg: '#ecfdf5', text: '#059669' },
  { id: 'violet', name: '제비꽃', hex: '#8b5cf6', bg: '#f5f3ff', text: '#7c3aed' },
  
  // Cool colors
  { id: 'sky', name: '하늘색', hex: '#0ea5e9', bg: '#f0f9ff', text: '#0284c7' },
  { id: 'slate', name: '청회색', hex: '#64748b', bg: '#f8fafc', text: '#475569' },
  { id: 'gray', name: '회색', hex: '#6b7280', bg: '#f9fafb', text: '#4b5563' },
  { id: 'zinc', name: '아연색', hex: '#71717a', bg: '#fafafa', text: '#52525b' },
  { id: 'stone', name: '돌색', hex: '#78716c', bg: '#fafaf9', text: '#57534e' },
  
  // Earth tones
  { id: 'brown', name: '갈색', hex: '#92400e', bg: '#fef3c7', text: '#92400e' },
  { id: 'coffee', name: '커피색', hex: '#78350f', bg: '#fef3c7', text: '#78350f' },
  { id: 'chocolate', name: '초콜릿', hex: '#a16207', bg: '#fefce8', text: '#a16207' },
  { id: 'sand', name: '모래색', hex: '#ca8a04', bg: '#fefce8', text: '#ca8a04' },
  { id: 'gold', name: '금색', hex: '#eab308', bg: '#fefce8', text: '#a16207' },
  
  // Soft pastels
  { id: 'mint', name: '민트', hex: '#6ee7b7', bg: '#f0fdf4', text: '#065f46' },
  { id: 'lavender', name: '라벤더', hex: '#c4b5fd', bg: '#f5f3ff', text: '#6d28d9' },
  { id: 'peach', name: '복숭아', hex: '#fdba74', bg: '#fff7ed', text: '#c2410c' },
  { id: 'coral', name: '산호', hex: '#fb7185', bg: '#fff1f2', text: '#be123c' },
  { id: 'sage', name: '세이지', hex: '#84d3ae', bg: '#f0fdf4', text: '#065f46' }
] as const

export type TagColor = typeof TAG_COLORS[number]
export type TagColorId = TagColor['id']

// Utility functions
export function getTagColor(colorId: string): TagColor | undefined {
  return TAG_COLORS.find(color => color.id === colorId)
}

export function getDefaultTagColor(): TagColor {
  return TAG_COLORS[0] // Default to red
}

export function getNextAvailableColor(usedColorIds: string[]): TagColor {
  const availableColor = TAG_COLORS.find(color => !usedColorIds.includes(color.id))
  return availableColor || getDefaultTagColor()
}

// Korean default tags with assigned colors
export const DEFAULT_KOREAN_TAGS = [
  { name: '식비', colorId: 'red' },
  { name: '교통비', colorId: 'blue' },
  { name: '쇼핑', colorId: 'pink' },
  { name: '생활용품', colorId: 'green' },
  { name: '의료비', colorId: 'purple' },
  { name: '통신비', colorId: 'indigo' },
  { name: '문화생활', colorId: 'orange' },
  { name: '교육비', colorId: 'teal' },
  { name: '여행', colorId: 'cyan' },
  { name: '용돈', colorId: 'yellow' },
  { name: '급여', colorId: 'emerald' },
  { name: '부수입', colorId: 'lime' },
  { name: '투자', colorId: 'violet' },
  { name: '저축', colorId: 'sky' },
  { name: '기타', colorId: 'gray' }
] as const