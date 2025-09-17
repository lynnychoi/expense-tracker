import OpenAI from 'openai'

export interface SpendingPattern {
  category: string
  amount: number
  frequency: number
  trend: 'increasing' | 'decreasing' | 'stable'
}

export interface BudgetRecommendation {
  category: string
  recommendedAmount: number
  reason: string
  priority: 'high' | 'medium' | 'low'
}

export interface FinancialAdvice {
  title: string
  description: string
  actionItems: string[]
  impact: 'high' | 'medium' | 'low'
  category: 'saving' | 'budgeting' | 'spending' | 'investment'
}

let openai: OpenAI | null = null

// OpenAI 클라이언트 초기화
export function initializeOpenAI() {
  const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY || process.env.OPENAI_API_KEY
  
  if (!apiKey) {
    console.warn('OpenAI API key not found. AI features will be disabled.')
    return null
  }

  if (!openai) {
    openai = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true // 클라이언트 사이드에서 사용
    })
  }
  
  return openai
}

// 지출 패턴 분석
export async function analyzeSpendingPatterns(transactions: any[]): Promise<SpendingPattern[]> {
  const client = initializeOpenAI()
  if (!client || transactions.length === 0) {
    return []
  }

  try {
    const transactionData = transactions
      .filter(t => t.transaction_type === 'expense')
      .map(t => ({
        date: t.date,
        amount: t.amount,
        description: t.description,
        category: t.tags?.[0]?.name || '기타'
      }))

    const prompt = `
다음은 한국 가계부 지출 데이터입니다:
${JSON.stringify(transactionData, null, 2)}

이 데이터를 분석하여 지출 패턴을 찾아주세요. 
카테고리별로 다음 정보를 JSON 배열 형태로 제공해주세요:
- category: 카테고리명
- amount: 평균 지출액
- frequency: 거래 빈도 (월간)
- trend: 'increasing', 'decreasing', 'stable' 중 하나

응답은 오직 JSON만 포함해주세요.
`

    const response = await client.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
    })

    const content = response.choices[0]?.message?.content
    if (!content) return []

    try {
      return JSON.parse(content)
    } catch {
      return []
    }
  } catch (error) {
    console.error('Error analyzing spending patterns:', error)
    return []
  }
}

// 예산 추천
export async function recommendBudget(
  transactions: any[],
  currentBudgets: any[]
): Promise<BudgetRecommendation[]> {
  const client = initializeOpenAI()
  if (!client) {
    return []
  }

  try {
    const spendingData = transactions
      .filter(t => t.transaction_type === 'expense')
      .reduce((acc, t) => {
        const category = t.tags?.[0]?.name || '기타'
        acc[category] = (acc[category] || 0) + t.amount
        return acc
      }, {} as Record<string, number>)

    const incomeData = transactions
      .filter(t => t.transaction_type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)

    const prompt = `
한국 가계부 데이터:
- 월 수입: ${incomeData}원
- 카테고리별 지출: ${JSON.stringify(spendingData)}
- 현재 예산: ${JSON.stringify(currentBudgets.map(b => ({ category: b.category?.name || b.category_name, amount: b.budget_amount })))}

한국 가정의 일반적인 예산 비율을 고려하여 카테고리별 예산을 추천해주세요.
JSON 배열 형태로 응답해주세요:
- category: 카테고리명
- recommendedAmount: 추천 금액
- reason: 추천 이유 (한국어)
- priority: 'high', 'medium', 'low' 중 하나

응답은 오직 JSON만 포함해주세요.
`

    const response = await client.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
    })

    const content = response.choices[0]?.message?.content
    if (!content) return []

    try {
      return JSON.parse(content)
    } catch {
      return []
    }
  } catch (error) {
    console.error('Error recommending budget:', error)
    return []
  }
}

// 재정 조언 생성
export async function generateFinancialAdvice(
  transactions: any[],
  budgets: any[],
  savingsRate: number
): Promise<FinancialAdvice[]> {
  const client = initializeOpenAI()
  if (!client) {
    return []
  }

  try {
    const totalIncome = transactions
      .filter(t => t.transaction_type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)

    const totalExpense = transactions
      .filter(t => t.transaction_type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)

    const budgetUtilization = budgets.length > 0 
      ? budgets.reduce((sum, b) => sum + (b.spent_amount / b.budget_amount), 0) / budgets.length 
      : 0

    const prompt = `
한국 가계 재정 상황:
- 월 수입: ${totalIncome}원
- 월 지출: ${totalExpense}원
- 저축률: ${savingsRate.toFixed(1)}%
- 예산 달성률: ${(budgetUtilization * 100).toFixed(1)}%
- 예산 초과 카테고리: ${budgets.filter(b => b.spent_amount > b.budget_amount).length}개

이 정보를 바탕으로 한국 가정에 맞는 실용적인 재정 조언을 3-5개 제공해주세요.
JSON 배열 형태로 응답해주세요:
- title: 조언 제목 (한국어)
- description: 상세 설명 (한국어)
- actionItems: 실행 방법 배열 (한국어)
- impact: 'high', 'medium', 'low' 중 하나
- category: 'saving', 'budgeting', 'spending', 'investment' 중 하나

응답은 오직 JSON만 포함해주세요.
`

    const response = await client.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    })

    const content = response.choices[0]?.message?.content
    if (!content) return []

    try {
      return JSON.parse(content)
    } catch {
      return []
    }
  } catch (error) {
    console.error('Error generating financial advice:', error)
    return []
  }
}

// 자동 카테고리 분류
export async function categorizeTransaction(description: string): Promise<string> {
  const client = initializeOpenAI()
  if (!client || !description.trim()) {
    return '기타'
  }

  try {
    const prompt = `
거래 내역: "${description}"

이 거래 내역을 다음 한국 가계부 카테고리 중 하나로 분류해주세요:
- 식비
- 교통비
- 문화생활
- 쇼핑
- 의료비
- 교육비
- 주거비
- 통신비
- 보험료
- 기타

카테고리명만 응답해주세요.
`

    const response = await client.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
    })

    const category = response.choices[0]?.message?.content?.trim()
    
    // 유효한 카테고리인지 확인
    const validCategories = ['식비', '교통비', '문화생활', '쇼핑', '의료비', '교육비', '주거비', '통신비', '보험료', '기타']
    return validCategories.includes(category || '') ? category! : '기타'
  } catch (error) {
    console.error('Error categorizing transaction:', error)
    return '기타'
  }
}