import type { Transaction } from '@/contexts/TransactionContext'

export interface DuplicateMatch {
  transaction: Transaction
  similarity: number
  reasons: string[]
}

export interface DuplicateDetectionOptions {
  amountTolerance: number // Percentage tolerance for amount (e.g., 0.05 = 5%)
  dateTolerance: number // Days tolerance for date
  descriptionThreshold: number // Similarity threshold for description (0-1)
  enableSmartDetection: boolean // Use advanced similarity algorithms
}

export const DEFAULT_DETECTION_OPTIONS: DuplicateDetectionOptions = {
  amountTolerance: 0.02, // 2% tolerance
  dateTolerance: 3, // 3 days
  descriptionThreshold: 0.7, // 70% similarity
  enableSmartDetection: true
}

// Calculate string similarity using Levenshtein distance
function calculateStringSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim()
  const s2 = str2.toLowerCase().trim()
  
  if (s1 === s2) return 1
  if (s1.length === 0 || s2.length === 0) return 0

  const matrix = Array(s2.length + 1).fill(null).map(() => Array(s1.length + 1).fill(null))
  
  for (let i = 0; i <= s1.length; i++) matrix[0]![i] = i
  for (let j = 0; j <= s2.length; j++) matrix[j]![0] = j
  
  for (let j = 1; j <= s2.length; j++) {
    for (let i = 1; i <= s1.length; i++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1
      matrix[j]![i] = Math.min(
        matrix[j - 1]![i]! + 1,     // deletion
        matrix[j]![i - 1]! + 1,     // insertion
        matrix[j - 1]![i - 1]! + cost // substitution
      )
    }
  }
  
  const maxLength = Math.max(s1.length, s2.length)
  return 1 - (matrix[s2.length]![s1.length]! / maxLength)
}

// Calculate date difference in days
function calculateDateDifference(date1: string, date2: string): number {
  const d1 = new Date(date1)
  const d2 = new Date(date2)
  const diffTime = Math.abs(d1.getTime() - d2.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

// Calculate amount similarity (considering tolerance)
function calculateAmountSimilarity(amount1: number, amount2: number, tolerance: number): number {
  if (amount1 === amount2) return 1
  
  const diff = Math.abs(amount1 - amount2)
  const avgAmount = (amount1 + amount2) / 2
  const percentDiff = diff / avgAmount
  
  return percentDiff <= tolerance ? 1 - (percentDiff / tolerance) : 0
}

// Enhanced Korean description similarity
function calculateKoreanDescriptionSimilarity(desc1: string, desc2: string): number {
  // Normalize Korean text
  const normalize = (text: string) => {
    return text
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/[^\w가-힣\s]/g, '') // Keep only Korean, English, numbers, spaces
      .trim()
  }
  
  const normalized1 = normalize(desc1)
  const normalized2 = normalize(desc2)
  
  // Exact match after normalization
  if (normalized1 === normalized2) return 1
  
  // Check for common Korean transaction patterns
  const commonPatterns = [
    /마트|슈퍼|편의점/,
    /카페|커피|스타벅스|이디야/,
    /식당|음식점|치킨|피자|한식|중식|일식|양식/,
    /주유소|기름|연료/,
    /병원|의원|약국|의료/,
    /교통|버스|지하철|택시|기차/,
    /쇼핑|온라인|배송|택배/
  ]
  
  let patternBonus = 0
  for (const pattern of commonPatterns) {
    if (pattern.test(normalized1) && pattern.test(normalized2)) {
      patternBonus = 0.2
      break
    }
  }
  
  const basicSimilarity = calculateStringSimilarity(normalized1, normalized2)
  return Math.min(1, basicSimilarity + patternBonus)
}

// Main duplicate detection function
export function detectDuplicates(
  newTransaction: Omit<Transaction, 'id' | 'created_at' | 'updated_at' | 'tags' | 'user'>,
  existingTransactions: Transaction[],
  options: DuplicateDetectionOptions = DEFAULT_DETECTION_OPTIONS
): DuplicateMatch[] {
  const matches: DuplicateMatch[] = []
  
  for (const existing of existingTransactions) {
    // Skip if different transaction type
    if (existing.type !== newTransaction.type) continue
    
    const reasons: string[] = []
    let totalSimilarity = 0
    let factors = 0
    
    // Amount similarity
    const amountSim = calculateAmountSimilarity(
      existing.amount,
      newTransaction.amount,
      options.amountTolerance
    )
    
    if (amountSim > 0) {
      totalSimilarity += amountSim * 0.4 // 40% weight
      factors++
      if (amountSim > 0.9) {
        reasons.push(`동일한 금액 (${existing.amount.toLocaleString('ko-KR')}원)`)
      } else {
        reasons.push(`유사한 금액 (차이: ${Math.abs(existing.amount - newTransaction.amount).toLocaleString('ko-KR')}원)`)
      }
    }
    
    // Date similarity
    const dateDiff = calculateDateDifference(existing.date, newTransaction.date)
    if (dateDiff <= options.dateTolerance) {
      const dateSim = 1 - (dateDiff / options.dateTolerance)
      totalSimilarity += dateSim * 0.3 // 30% weight
      factors++
      
      if (dateDiff === 0) {
        reasons.push('같은 날짜')
      } else {
        reasons.push(`${dateDiff}일 차이`)
      }
    }
    
    // Description similarity
    const descSim = options.enableSmartDetection
      ? calculateKoreanDescriptionSimilarity(existing.description, newTransaction.description)
      : calculateStringSimilarity(existing.description, newTransaction.description)
    
    if (descSim >= options.descriptionThreshold) {
      totalSimilarity += descSim * 0.3 // 30% weight
      factors++
      
      if (descSim > 0.95) {
        reasons.push('동일한 설명')
      } else {
        reasons.push(`유사한 설명 (${Math.round(descSim * 100)}% 일치)`)
      }
    }
    
    // Additional factors for Korean transactions
    if (options.enableSmartDetection) {
      // Same payment method
      if (existing.payment_method === newTransaction.payment_method) {
        totalSimilarity += 0.1
        reasons.push(`동일한 결제 방법 (${existing.payment_method})`)
      }
      
      // Same person
      if (existing.person_type === newTransaction.person_type && 
          existing.person_id === newTransaction.person_id) {
        totalSimilarity += 0.1
        reasons.push('동일한 사용자')
      }
    }
    
    // Calculate final similarity score
    const finalSimilarity = factors > 0 ? totalSimilarity : 0
    
    // Consider as potential duplicate if similarity > 0.6
    if (finalSimilarity > 0.6 && reasons.length >= 2) {
      matches.push({
        transaction: existing,
        similarity: finalSimilarity,
        reasons
      })
    }
  }
  
  // Sort by similarity score (highest first)
  return matches.sort((a, b) => b.similarity - a.similarity)
}

// Quick duplicate check for real-time warnings
export function hasLikelyDuplicate(
  newTransaction: Omit<Transaction, 'id' | 'created_at' | 'updated_at' | 'tags' | 'user'>,
  existingTransactions: Transaction[]
): boolean {
  const matches = detectDuplicates(newTransaction, existingTransactions, {
    ...DEFAULT_DETECTION_OPTIONS,
    amountTolerance: 0.01, // Stricter for quick check
    dateTolerance: 1, // Only same day
    descriptionThreshold: 0.8 // Higher threshold
  })
  
  return matches.length > 0 && matches[0]!.similarity > 0.8
}

// Get duplicate warning message
export function getDuplicateWarning(matches: DuplicateMatch[]): string {
  if (matches.length === 0) return ''
  
  const topMatch = matches[0]!
  const confidence = Math.round(topMatch.similarity * 100)
  
  return `${confidence}% 확률로 중복 거래일 수 있습니다. ${topMatch.reasons.join(', ')}`
}