import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('words')
    .select(`
      *,
      reviews!left (
        id,
        user_id,
        word_id,
        due,
        stability,
        difficulty,
        elapsed_days,
        scheduled_days,
        reps,
        lapses,
        state,
        last_review,
        created_at
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { word, definition, examples } = body

    if (!word || !definition) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Create word
    const { data: newWord, error: wordError } = await supabase
      .from('words')
      .insert({
        user_id: user.id,
        word: word.trim(),
        definition,
        example_sentences: examples || [],
      })
      .select()
      .single()

    if (wordError) {
      return NextResponse.json({ error: wordError.message }, { status: 500 })
    }

    // Create initial review using FSRS
    const { fsrs } = await import('@/lib/srs')
    const card = fsrs.createEmptyCard(new Date())

    const { error: reviewError } = await supabase
      .from('reviews')
      .insert({
        user_id: user.id,
        word_id: newWord.id,
        due: card.due.toISOString(),
        stability: card.stability,
        difficulty: card.difficulty,
        elapsed_days: card.elapsed_days,
        scheduled_days: card.scheduled_days,
        reps: card.reps,
        lapses: card.lapses,
        state: card.state,
        last_review: null,
      })

    if (reviewError) {
      console.error('Review creation error:', reviewError)
      // Don't fail the request, word is created
    }

    return NextResponse.json(newWord, { status: 201 })
  } catch (err) {
    console.error('API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}