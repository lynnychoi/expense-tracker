import { NextRequest, NextResponse } from 'next/server'
import { generateFinancialInsights } from '@/lib/openai'
import { getMonthlyTotals, getCategoryTotals } from '@/lib/queries'

export async function POST(request: NextRequest) {
  try {
    const { householdId } = await request.json()

    if (!householdId) {
      return NextResponse.json(
        { error: 'HouseholdId is required' },
        { status: 400 }
      )
    }

    // Get recent financial data
    const [monthlyTotals, categoryTotals] = await Promise.all([
      getMonthlyTotals(householdId),
      getCategoryTotals(householdId)
    ])

    // Generate insights
    const insights = await generateFinancialInsights(monthlyTotals, categoryTotals)

    return NextResponse.json({ 
      insights,
      data: {
        monthlyTotals: monthlyTotals.slice(-6), // Last 6 months
        categoryTotals: categoryTotals.slice(0, 10) // Top 10 categories
      }
    })
  } catch (error) {
    console.error('Error in insights API:', error)
    return NextResponse.json(
      { error: 'Failed to generate financial insights' },
      { status: 500 }
    )
  }
}