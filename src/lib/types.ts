export type Word = {
  id: string
  user_id: string
  word: string
  definition: {
    zh: string
    en: string
  }
  example_sentences: Array<{
    en: string
    zh: string
  }>
  created_at: string
}

export type Review = {
  id: string
  user_id: string
  word_id: string
  due: string
  stability: number
  difficulty: number
  elapsed_days: number
  scheduled_days: number
  reps: number
  lapses: number
  state: number // 0=New, 1=Learning, 2=Review, 3=Relearning
  last_review: string | null
  created_at: string
}

export type WordWithReview = Word & {
  review: Review | null
}

export type ReviewCardData = {
  word: Word
  review: Review
}

export const REVIEW_STATE = {
  NEW: 0,
  LEARNING: 1,
  REVIEW: 2,
  RELEARNING: 3,
} as const

export type ReviewState = (typeof REVIEW_STATE)[keyof typeof REVIEW_STATE]

export const RATING = {
  AGAIN: 1,
  HARD: 2,
  GOOD: 3,
  EASY: 4,
} as const

export type Rating = (typeof RATING)[keyof typeof RATING]