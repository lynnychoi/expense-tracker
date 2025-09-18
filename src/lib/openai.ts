import OpenAI from 'openai'

function getOpenAIClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    console.warn('OpenAI API key not found, falling back to simple suggestions')
    return null
  }
  return new OpenAI({ apiKey })
}

/**
 * Generate tag suggestions for a transaction description
 * @param description - Transaction description
 * @param existingTags - Array of existing tags in the household
 * @returns Array of suggested tag names
 */
export async function suggestTags(
  description: string,
  existingTags: string[] = []
): Promise<string[]> {
  if (!description.trim()) {
    return []
  }

  const koreanTags = [
    '식비', '교통비', '생활용품', '공과금', '엔터테인먼트',
    '의료비', '교육비', '의류', '주거비', '보험료',
    '급여', '부업', '투자수익', '정부지원금', '기타수입'
  ]

  const allTags = [...new Set([...koreanTags, ...existingTags])]

  const openai = getOpenAIClient()
  if (!openai) {
    // Fallback to simple keyword matching if OpenAI is not available
    return getSimpleTagSuggestions(description, allTags)
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `You are a Korean household expense categorization assistant. Given a transaction description, suggest the most appropriate tags from the provided list. 

Available tags: ${allTags.join(', ')}

Rules:
1. Suggest 1-3 most relevant tags
2. Prefer Korean tags when appropriate
3. Consider Korean context and spending patterns
4. If no existing tag fits perfectly, suggest a new appropriate Korean tag
5. Return only tag names, separated by commas
6. Be conservative - only suggest tags that clearly fit`
        },
        {
          role: 'user',
          content: `Transaction description: "${description}"`
        }
      ],
      max_tokens: 100,
      temperature: 0.3,
    })

    const suggestions = response.choices[0]?.message?.content
      ?.split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0)
      .slice(0, 3) // Maximum 3 suggestions

    return suggestions || []
  } catch (error) {
    console.error('Error generating tag suggestions:', error)
    
    // Fallback to simple keyword matching
    return getSimpleTagSuggestions(description, allTags)
  }
}

/**
 * Generate financial insights based on spending patterns
 * @param monthlyData - Monthly spending data
 * @param categoryData - Category spending data
 * @returns Array of insight messages
 */
export async function generateFinancialInsights(
  monthlyData: { month: string; total_expense: number; total_income: number }[],
  categoryData: { tag_name: string; total_amount: number }[]
): Promise<string[]> {
  if (monthlyData.length === 0 && categoryData.length === 0) {
    return []
  }

  const openai = getOpenAIClient()
  if (!openai) {
    // Fallback to simple insights if OpenAI is not available
    return getSimpleFinancialInsights(monthlyData, categoryData)
  }

  try {
    const monthlyInfo = monthlyData.length > 0 
      ? `Monthly data: ${monthlyData.map(m => `${m.month}: ₩${m.total_expense.toLocaleString()} expenses, ₩${m.total_income.toLocaleString()} income`).join('; ')}`
      : 'No monthly data available'

    const categoryInfo = categoryData.length > 0
      ? `Top spending categories: ${categoryData.slice(0, 5).map(c => `${c.tag_name}: ₩${c.total_amount.toLocaleString()}`).join('; ')}`
      : 'No category data available'

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `You are a Korean household financial advisor. Analyze the spending data and provide 2-3 practical insights in Korean. Focus on:

1. Spending patterns and trends
2. Budget recommendations
3. Areas for potential savings
4. Comparison to typical Korean household spending

Guidelines:
- Write in Korean
- Be specific and actionable
- Use Korean Won (₩) format
- Keep insights concise (1-2 sentences each)
- Focus on practical advice for Korean households`
        },
        {
          role: 'user',
          content: `${monthlyInfo}\n\n${categoryInfo}`
        }
      ],
      max_tokens: 300,
      temperature: 0.7,
    })

    const insights = response.choices[0]?.message?.content
      ?.split('\n')
      .filter(line => line.trim().length > 0)
      .slice(0, 3) // Maximum 3 insights

    return insights || []
  } catch (error) {
    console.error('Error generating financial insights:', error)
    
    // Fallback to simple insights
    return getSimpleFinancialInsights(monthlyData, categoryData)
  }
}

/**
 * Fallback function for tag suggestions without AI
 */
function getSimpleTagSuggestions(description: string, availableTags: string[]): string[] {
  const desc = description.toLowerCase()
  const suggestions: string[] = []

  // Simple keyword mapping
  const keywordMap: { [key: string]: string[] } = {
    '식비': ['음식', '식당', '배달', '카페', '커피', '점심', '저녁', '아침', '맥주', '술'],
    '교통비': ['버스', '지하철', '택시', '기차', '항공', '주유', '기름', '교통'],
    '생활용품': ['마트', '쇼핑', '생활', '용품', '청소', '세제'],
    '공과금': ['전기', '가스', '수도', '인터넷', '통신', '관리비'],
    '의료비': ['병원', '약국', '의료', '치료', '건강'],
    '엔터테인먼트': ['영화', '게임', '여행', '놀이', '오락'],
  }

  for (const [tag, keywords] of Object.entries(keywordMap)) {
    if (keywords.some(keyword => desc.includes(keyword))) {
      suggestions.push(tag)
    }
  }

  return suggestions.slice(0, 2)
}

/**
 * Fallback function for financial insights without AI
 */
function getSimpleFinancialInsights(
  monthlyData: { month: string; total_expense: number; total_income: number }[],
  categoryData: { tag_name: string; total_amount: number }[]
): string[] {
  const insights: string[] = []

  if (monthlyData.length >= 2) {
    const latest = monthlyData[monthlyData.length - 1]
    const previous = monthlyData[monthlyData.length - 2]
    
    if (!latest || !previous) {
      return insights.slice(0, 3)
    }
    
    const expenseChange = ((latest.total_expense - previous.total_expense) / previous.total_expense) * 100

    if (expenseChange > 10) {
      insights.push(`이번 달 지출이 지난 달 대비 ${expenseChange.toFixed(1)}% 증가했습니다.`)
    } else if (expenseChange < -10) {
      insights.push(`이번 달 지출이 지난 달 대비 ${Math.abs(expenseChange).toFixed(1)}% 감소했습니다.`)
    }
  }

  if (categoryData.length > 0) {
    const topCategory = categoryData[0]
    if (topCategory) {
      insights.push(`${topCategory.tag_name} 카테고리에서 가장 많이 지출했습니다. (₩${topCategory.total_amount.toLocaleString()})`)
    }
  }

  return insights.slice(0, 3)
}