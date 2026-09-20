import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { updateReviewAfterRating, getNextIntervals } from '@/lib/srs'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const body = await request.json()
    const { rating } = body

    if (!rating || rating < 1 || rating > 4) {
      return NextResponse.json({ error: 'Invalid rating' }, { status: 400 })
    }

    // Get current review
    const { data: review, error: fetchError } = await supabase
      .from('reviews')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }

    // Update using FSRS
    const updatedReview = updateReviewAfterRating(review, rating)

    const { data: updated, error: updateError } = await supabase
      .from('reviews')
      .update({
        due: updatedReview.due,
        stability: updatedReview.stability,
        difficulty: updatedReview.difficulty,
        elapsed_days: updatedReview.elapsed_days,
        scheduled_days: updatedReview.scheduled_days,
        reps: updatedReview.reps,
        lapses: updatedReview.lapses,
        state: updatedReview.state,
        last_review: updatedReview.last_review,
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Return updated review with interval previews
    return NextResponse.json({
      ...updated,
      intervals: getNextIntervals(updated),
    })
  } catch (err) {
    console.error('API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}