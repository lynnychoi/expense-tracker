import { NextRequest, NextResponse } from 'next/server'
import { suggestTags } from '@/lib/openai'
import { createClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const { description, householdId } = await request.json()

    if (!description || !householdId) {
      return NextResponse.json(
        { error: 'Description and householdId are required' },
        { status: 400 }
      )
    }

    // Get existing tags for the household
    const supabase = await createClient()
    const { data: tagColors } = await supabase
      .from('tag_colors')
      .select('tag_name')
      .eq('household_id', householdId)

    const existingTags = tagColors?.map(tc => tc.tag_name) || []

    // Generate tag suggestions
    const suggestions = await suggestTags(description, existingTags)

    return NextResponse.json({ suggestions })
  } catch (error) {
    console.error('Error in suggest-tags API:', error)
    return NextResponse.json(
      { error: 'Failed to generate tag suggestions' },
      { status: 500 }
    )
  }
}