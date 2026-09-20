import { createClient } from '@/lib/supabase/server'
import { Word, Review, WordWithReview, ReviewCardData } from '@/lib/types'
import { createInitialReview } from '@/lib/srs'

export async function getUserWords(): Promise<WordWithReview[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return []

  const { data: words, error } = await supabase
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

  if (error) throw error

  return (words || []).map(w => ({
    ...w,
    review: w.reviews?.[0] || null,
  }))
}

export async function getDueReviews(limit = 20): Promise<ReviewCardData[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return []

  const now = new Date().toISOString()
  
  const { data: reviews, error } = await supabase
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
    .limit(limit)

  if (error) throw error

  return (reviews || []).map(r => ({
    word: r.words,
    review: r,
  }))
}

export async function getWordById(wordId: string): Promise<WordWithReview | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null

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
    .eq('id', wordId)
    .eq('user_id', user.id)
    .single()

  if (error || !data) return null

  return {
    ...data,
    review: data.reviews?.[0] || null,
  }
}

export async function createWord(
  word: string,
  definition: { zh: string; en: string },
  examples: Array<{ en: string; zh: string }>
): Promise<Word | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null

  // 建立單字
  const { data: newWord, error: wordError } = await supabase
    .from('words')
    .insert({
      user_id: user.id,
      word,
      definition,
      example_sentences: examples,
    })
    .select()
    .single()

  if (wordError || !newWord) {
    console.error('Create word error:', wordError)
    return null
  }

  // 建立初始複習記錄
  const initialReview = createInitialReview(newWord.id, user.id)
  const { error: reviewError } = await supabase
    .from('reviews')
    .insert(initialReview)

  if (reviewError) {
    console.error('Create review error:', reviewError)
    // 不拋出錯誤，單字已建立成功
  }

  return newWord
}

export async function updateReview(
  reviewId: string,
  updates: Partial<Review>
): Promise<Review | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null

  const { data, error } = await supabase
    .from('reviews')
    .update(updates)
    .eq('id', reviewId)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateWordExamples(
  wordId: string,
  examples: Array<{ en: string; zh: string }>
): Promise<Word | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null

  const { data, error } = await supabase
    .from('words')
    .update({ example_sentences: examples })
    .eq('id', wordId)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteWord(wordId: string): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return false

  const { error } = await supabase
    .from('words')
    .delete()
    .eq('id', wordId)
    .eq('user_id', user.id)

  return !error
}

export async function getReviewStats() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { due: 0, learning: 0, review: 0, new: 0 }

  const now = new Date().toISOString()
  
  const { data: reviews } = await supabase
    .from('reviews')
    .select('state, due')
    .eq('user_id', user.id)

  if (!reviews) return { due: 0, learning: 0, review: 0, new: 0 }

  const stats = reviews.reduce(
    (acc, r) => {
      if (r.state === 0) acc.new++
      else if (r.state === 1) acc.learning++
      else if (r.state === 2) acc.review++
      if (r.due <= now) acc.due++
      return acc
    },
    { due: 0, learning: 0, review: 0, new: 0 }
  )

  return stats
}