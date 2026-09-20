import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { generateExampleSentences } from '@/lib/ai'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { wordId, word, definition } = body

    if (!wordId || !word) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify ownership
    const { data: wordData, error: wordError } = await supabase
      .from('words')
      .select('id, user_id, example_sentences')
      .eq('id', wordId)
      .eq('user_id', user.id)
      .single()

    if (wordError || !wordData) {
      return NextResponse.json({ error: 'Word not found' }, { status: 404 })
    }

    // Already has examples
    if (wordData.example_sentences && wordData.example_sentences.length > 0) {
      return NextResponse.json({ examples: wordData.example_sentences })
    }

    // Generate examples
    const examples = await generateExampleSentences(word, definition)

    // Save to database
    const { error: updateError } = await supabase
      .from('words')
      .update({ example_sentences: examples })
      .eq('id', wordId)
      .eq('user_id', user.id)

    if (updateError) {
      console.error('Update examples error:', updateError)
    }

    return NextResponse.json({ examples })
  } catch (err) {
    console.error('API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}