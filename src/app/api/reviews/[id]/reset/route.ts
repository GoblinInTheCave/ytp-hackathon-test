import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fsrs, cardToReviewUpdate } from '@/lib/srs'
import type { Review } from '@/lib/types'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { data: review, error: fetchError } = await supabase
    .from('reviews')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (fetchError || !review) return NextResponse.json({ error: 'Review not found' }, { status: 404 })

  const card = fsrs.createEmptyCard(new Date())
  const update = cardToReviewUpdate(card)
  const { data: updated, error } = await supabase
    .from('reviews')
    .update({ ...update, user_id: user.id, word_id: (review as Review).word_id })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(updated)
}
