import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getNextIntervals } from '@/lib/srs'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from('reviews')
    .select(`
      *,
      words!inner (
        id,
        user_id,
        word,
        definition,
        example_sentences,
        created_at
      )
    `)
    .eq('user_id', user.id)
    .lte('due', now)
    .order('due', { ascending: true })
    .limit(20)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Add interval previews for each review
  const reviewsWithIntervals = (data || []).map(r => ({
    ...r,
    intervals: getNextIntervals(r),
  }))

  return NextResponse.json(reviewsWithIntervals)
}