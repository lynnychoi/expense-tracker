import { cn } from '@/lib/utils'
import { formatKRW, parseKRW, isValidKRWAmount, formatKRWInput, formatKRWShort } from '@/lib/currency'

describe('Utils Library', () => {
  describe('cn', () => {
    test('merges classes correctly', () => {
      expect(cn('px-2 py-1', 'text-blue-500')).toBe('px-2 py-1 text-blue-500')
    })

    test('handles conditional classes', () => {
      expect(cn('base-class', true && 'conditional-class')).toBe('base-class conditional-class')
      expect(cn('base-class', false && 'conditional-class')).toBe('base-class')
    })

    test('handles undefined values', () => {
      expect(cn('base-class', undefined)).toBe('base-class')
    })
  })

  describe('formatKRW', () => {
    test('formats positive amounts correctly', () => {
      expect(formatKRW(1000)).toBe('₩1,000')
      expect(formatKRW(1234567)).toBe('₩1,234,567')
      expect(formatKRW(100)).toBe('₩100')
    })

    test('handles zero amount', () => {
      expect(formatKRW(0)).toBe('₩0')
    })

    test('handles invalid amounts', () => {
      expect(formatKRW(NaN)).toBe('₩0')
    })
  })

  describe('parseKRW', () => {
    test('parses KRW strings correctly', () => {
      expect(parseKRW('₩1,000')).toBe(1000)
      expect(parseKRW('1,234,567')).toBe(1234567)
      expect(parseKRW('₩100')).toBe(100)
    })

    test('handles empty strings', () => {
      expect(parseKRW('')).toBe(0)
    })

    test('handles invalid strings', () => {
      expect(parseKRW('invalid')).toBe(0)
    })
  })

  describe('isValidKRWAmount', () => {
    test('validates positive amounts', () => {
      expect(isValidKRWAmount(1000)).toBe(true)
      expect(isValidKRWAmount(0)).toBe(true)
    })

    test('rejects negative amounts', () => {
      expect(isValidKRWAmount(-1000)).toBe(false)
    })

    test('rejects non-integers', () => {
      expect(isValidKRWAmount(1000.5)).toBe(false)
    })

    test('rejects invalid values', () => {
      expect(isValidKRWAmount(NaN)).toBe(false)
    })
  })

  describe('formatKRWInput', () => {
    test('formats for input fields correctly', () => {
      expect(formatKRWInput(1000)).toBe('1,000')
      expect(formatKRWInput(1234567)).toBe('1,234,567')
    })

    test('handles zero amount', () => {
      expect(formatKRWInput(0)).toBe('0')
    })

    test('handles invalid amounts', () => {
      expect(formatKRWInput(NaN)).toBe('')
    })
  })

  describe('formatKRWShort', () => {
    test('formats small amounts normally', () => {
      expect(formatKRWShort(1000)).toBe('₩1,000')
    })

    test('abbreviates amounts in 만 (ten thousands)', () => {
      expect(formatKRWShort(50000)).toBe('₩5.0만')
    })

    test('abbreviates amounts in 억 (hundred millions)', () => {
      expect(formatKRWShort(150000000)).toBe('₩1.5억')
    })

    test('handles invalid amounts', () => {
      expect(formatKRWShort(NaN)).toBe('₩0')
    })
  })
})