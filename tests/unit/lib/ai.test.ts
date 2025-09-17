import { analyzeSpendingPatterns, recommendBudget, categorizeTransaction, generateFinancialAdvice } from '@/lib/ai'

// Mock OpenAI
jest.mock('openai', () => {
  const mockCreate = jest.fn()
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: mockCreate,
        },
      },
    })),
    OpenAI: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: mockCreate,
        },
      },
    })),
  }
})

describe('AI Library', () => {
  // Mock environment variable for OpenAI API key
  beforeAll(() => {
    process.env.OPENAI_API_KEY = 'test-api-key'
  })

  afterAll(() => {
    delete process.env.OPENAI_API_KEY
  })

  const mockTransactions = [
    {
      id: '1',
      description: '스타벅스 커피',
      amount: 5000,
      tags: [{ name: '식비' }],
      date: '2024-01-15',
      transaction_type: 'expense',
    },
    {
      id: '2',
      description: '버스비',
      amount: 1500,
      tags: [{ name: '교통비' }],
      date: '2024-01-16',
      transaction_type: 'expense',
    },
    {
      id: '3',
      description: '월급',
      amount: 3000000,
      tags: [{ name: '급여' }],
      date: '2024-01-01',
      transaction_type: 'income',
    },
  ]

  const mockBudgets = [
    {
      category: { name: '식비' },
      budget_amount: 500000,
      spent_amount: 150000,
    },
    {
      category: { name: '교통비' },
      budget_amount: 100000,
      spent_amount: 50000,
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('analyzeSpendingPatterns', () => {
    test('should analyze spending patterns correctly', async () => {
      const openai = require('openai')
      const mockCreate = jest.fn()
      
      mockCreate.mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify([
              {
                category: '식비',
                amount: 5000,
                frequency: 1,
                trend: 'stable'
              }
            ])
          }
        }]
      })

      const result = await analyzeSpendingPatterns(mockTransactions)

      expect(mockCreate).toHaveBeenCalledWith({
        model: 'gpt-3.5-turbo',
        messages: expect.arrayContaining([
          expect.objectContaining({
            role: 'user'
          })
        ]),
        temperature: 0.3,
      })

      expect(result).toEqual([
        {
          category: '식비',
          amount: 5000,
          frequency: 1,
          trend: 'stable'
        }
      ])
    })

    test('should handle API errors gracefully', async () => {
      const mockOpenAI = require('openai').OpenAI
      const mockCreate = mockOpenAI().chat.completions.create
      
      mockCreate.mockRejectedValue(new Error('API Error'))

      const result = await analyzeSpendingPatterns(mockTransactions)

      expect(result).toEqual([])
    })

    test('should handle empty transactions', async () => {
      const result = await analyzeSpendingPatterns([])

      expect(result).toEqual([])
    })
  })

  describe('recommendBudget', () => {
    test('should generate budget recommendations', async () => {
      const mockOpenAI = require('openai').OpenAI
      const mockCreate = mockOpenAI().chat.completions.create
      
      mockCreate.mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify([
              { category: '식비', recommendedAmount: 450000, reason: '현재 지출 대비 10% 절약', priority: 'medium' },
              { category: '교통비', recommendedAmount: 80000, reason: '대중교통 이용 패턴 고려', priority: 'low' }
            ])
          }
        }]
      })

      const result = await recommendBudget(mockTransactions, mockBudgets)

      expect(mockCreate).toHaveBeenCalled()
      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({
        category: '식비',
        recommendedAmount: 450000,
        reason: '현재 지출 대비 10% 절약',
        priority: 'medium'
      })
    })

    test('should handle API errors gracefully', async () => {
      const mockOpenAI = require('openai').OpenAI
      const mockCreate = mockOpenAI().chat.completions.create
      
      mockCreate.mockRejectedValue(new Error('API Error'))

      const result = await recommendBudget(mockTransactions, mockBudgets)

      expect(result).toEqual([])
    })
  })

  describe('categorizeTransaction', () => {
    test('should categorize transactions correctly', async () => {
      const mockOpenAI = require('openai').OpenAI
      const mockCreate = mockOpenAI().chat.completions.create
      
      mockCreate.mockResolvedValue({
        choices: [{
          message: {
            content: '식비'
          }
        }]
      })

      const result = await categorizeTransaction('맥도날드 햄버거')

      expect(mockCreate).toHaveBeenCalledWith({
        model: 'gpt-3.5-turbo',
        messages: expect.arrayContaining([
          expect.objectContaining({
            role: 'user',
            content: expect.stringContaining('맥도날드 햄버거')
          })
        ]),
        temperature: 0.1,
      })

      expect(result).toBe('식비')
    })

    test('should handle empty descriptions', async () => {
      const result = await categorizeTransaction('')
      expect(result).toBe('기타')
    })

    test('should handle API errors gracefully', async () => {
      const mockOpenAI = require('openai').OpenAI
      const mockCreate = mockOpenAI().chat.completions.create
      
      mockCreate.mockRejectedValue(new Error('API Error'))

      const result = await categorizeTransaction('테스트 거래')

      expect(result).toBe('기타')
    })
  })

  describe('generateFinancialAdvice', () => {
    test('should provide financial advice', async () => {
      const mockOpenAI = require('openai').OpenAI
      const mockCreate = mockOpenAI().chat.completions.create
      
      mockCreate.mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify([
              {
                title: '커피 지출 줄이기',
                description: '현재 지출 패턴을 보면 카페 지출이 많습니다. 홈카페를 시작해보세요.',
                actionItems: ['홈카페 용품 구입', '커피 지출 모니터링'],
                impact: 'medium',
                category: 'spending'
              }
            ])
          }
        }]
      })

      const result = await generateFinancialAdvice(mockTransactions, mockBudgets, 20)

      expect(mockCreate).toHaveBeenCalled()
      expect(result).toEqual([
        {
          title: '커피 지출 줄이기',
          description: '현재 지출 패턴을 보면 카페 지출이 많습니다. 홈카페를 시작해보세요.',
          actionItems: ['홈카페 용품 구입', '커피 지출 모니터링'],
          impact: 'medium',
          category: 'spending'
        }
      ])
    })

    test('should handle API errors gracefully', async () => {
      const mockOpenAI = require('openai').OpenAI
      const mockCreate = mockOpenAI().chat.completions.create
      
      mockCreate.mockRejectedValue(new Error('API Error'))

      const result = await generateFinancialAdvice(mockTransactions, mockBudgets, 20)

      expect(result).toEqual([])
    })

    test('should handle insufficient data', async () => {
      const result = await generateFinancialAdvice([], [], 0)

      expect(result).toEqual([])
    })
  })
})