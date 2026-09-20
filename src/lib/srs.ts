import {
  FSRS,
  Rating,
  type Card,
  type SchedulingResult,
} from '@squeakyrobot/fsrs'
import { Review, REVIEW_STATE, RATING, type ReviewState } from '@/lib/types'

// FSRS 實例 - 使用預設參數（已經過優化）
export const fsrs = new FSRS()

// 將資料庫的 Review 轉換為 FSRS 的 Card 格式
export function reviewToCard(review: Review): Card {
  return {
    due: new Date(review.due),
    stability: review.stability,
    difficulty: review.difficulty,
    elapsed_days: review.elapsed_days,
    scheduled_days: review.scheduled_days,
    reps: review.reps,
    lapses: review.lapses,
    state: review.state as 0 | 1 | 2 | 3,
    last_review: review.last_review ? new Date(review.last_review) : null,
  }
}

// 將 FSRS 的 Card 轉換回資料庫的 Review 更新格式
export function cardToReviewUpdate(card: Card) {
  return {
    due: card.due.toISOString(),
    stability: card.stability,
    difficulty: card.difficulty,
    elapsed_days: card.elapsed_days,
    scheduled_days: card.scheduled_days,
    reps: card.reps,
    lapses: card.lapses,
    state: card.state,
    last_review: card.last_review?.toISOString() ?? null,
  }
}

// 取得四個按鈕的下一個間隔預覽
export function getNextIntervals(review: Review) {
  const card = reviewToCard(review)
  const scheduling = fsrs.repeat(card)
  
  return {
    again: formatInterval(scheduling[Rating.Again]),
    hard: formatInterval(scheduling[Rating.Hard]),
    good: formatInterval(scheduling[Rating.Good]),
    easy: formatInterval(scheduling[Rating.Easy]),
  }
}

// 根據評分更新複習記錄
export function updateReviewAfterRating(review: Review, rating: number): Review {
  const card = reviewToCard(review)
  const fsrsRating = rating as Rating
  const { card: updatedCard } = fsrs.scheduleWithGrade(card, fsrsRating)
  
  return {
    ...review,
    ...cardToReviewUpdate(updatedCard),
    last_review: new Date().toISOString(),
  }
}

// 建立新單字的初始複習記錄
export function createInitialReview(wordId: string, userId: string): Omit<Review, 'id' | 'created_at'> {
  const now = new Date()
  const card = fsrs.createEmptyCard(now)
  
  return {
    user_id: userId,
    word_id: wordId,
    due: card.due.toISOString(),
    stability: card.stability,
    difficulty: card.difficulty,
    elapsed_days: card.elapsed_days,
    scheduled_days: card.scheduled_days,
    reps: card.reps,
    lapses: card.lapses,
    state: card.state,
    last_review: null,
  }
}

// 格式化間隔顯示
function formatInterval(scheduling: SchedulingResult): string {
  const days = scheduling.card.scheduled_days
  if (days < 1) {
    const minutes = Math.round(days * 24 * 60)
    return `${minutes} 分鐘`
  } else if (days < 30) {
    return `${days} 天`
  } else if (days < 365) {
    const months = Math.round(days / 30)
    return `${months} 個月`
  } else {
    const years = (days / 365).toFixed(1)
    return `${years} 年`
  }
}

// 取得狀態顯示文字
export function getStateLabel(state: ReviewState): string {
  switch (state) {
    case REVIEW_STATE.NEW:
      return '新單字'
    case REVIEW_STATE.LEARNING:
      return '學習中'
    case REVIEW_STATE.REVIEW:
      return '複習中'
    case REVIEW_STATE.RELEARNING:
      return '重新學習'
    default:
      return '未知'
  }
}

// 取得評分標籤
export function getRatingLabel(rating: number): string {
  switch (rating) {
    case RATING.AGAIN:
      return '忘記'
    case RATING.HARD:
      return '困難'
    case RATING.GOOD:
      return '良好'
    case RATING.EASY:
      return '簡單'
    default:
      return '未知'
  }
}