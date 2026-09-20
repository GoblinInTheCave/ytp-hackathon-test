import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createInitialReview } from '@/lib/srs'

const STARTER_WORDS = [
  ['achieve', '達成；實現', 'to successfully complete or reach a goal'],
  ['adapt', '適應；調整', 'to change in order to fit a new situation'],
  ['confident', '有自信的', 'feeling sure about your abilities'],
  ['curious', '好奇的', 'wanting to know or learn something'],
  ['essential', '必要的；重要的', 'completely necessary or very important'],
  ['flexible', '有彈性的；靈活的', 'able to change or adapt easily'],
  ['improve', '改善；進步', 'to become better than before'],
  ['opportunity', '機會', 'a chance for progress or success'],
  ['reliable', '可靠的', 'able to be trusted or depended on'],
  ['resilient', '有韌性的', 'able to recover quickly from difficulty'],
  ['significant', '重要的；顯著的', 'important or large enough to be noticed'],
  ['sustain', '維持；持續', 'to continue something over time'],
  ['negus', '國王', 'a historical title for an Ethiopian king and a warm spiced wine drink.']
] as const

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: existing, error: existingError } = await supabase
    .from('words')
    .select('word')
    .eq('user_id', user.id)

  if (existingError) return NextResponse.json({ error: existingError.message }, { status: 500 })

  const existingWords = new Set((existing ?? []).map((item) => item.word.toLowerCase()))
  const wordsToCreate = STARTER_WORDS
    .filter(([word]) => !existingWords.has(word))
    .map(([word, zh, en]) => ({
      user_id: user.id,
      word,
      definition: { zh, en },
      example_sentences: [],
    }))

  if (wordsToCreate.length === 0) return NextResponse.json({ created: 0 })

  const { data: words, error: insertError } = await supabase
    .from('words')
    .insert(wordsToCreate)
    .select('id, user_id')

  if (insertError || !words) {
    return NextResponse.json({ error: insertError?.message ?? 'Unable to create words' }, { status: 500 })
  }

  const reviews = words.map((word) => createInitialReview(word.id, user.id))
  const { error: reviewError } = await supabase.from('reviews').insert(reviews)
  if (reviewError) return NextResponse.json({ error: reviewError.message }, { status: 500 })

  return NextResponse.json({ created: words.length }, { status: 201 })
}
