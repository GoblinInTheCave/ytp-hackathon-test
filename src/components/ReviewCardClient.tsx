'use client'

import { useCallback, useState } from 'react'
import { ReviewCard } from '@/components/ReviewCard'
import type { ReviewCardData } from '@/lib/types'

export function ReviewCardClient({ data }: { data: ReviewCardData }) {
  const [showAnswer, setShowAnswer] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleRate = useCallback(async (rating: number) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/reviews/${data.review.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating }),
      })

      if (!response.ok) {
        throw new Error('複習結果儲存失敗')
      }

      window.location.reload()
    } catch (error) {
      console.error('Rate error:', error)
      setIsLoading(false)
    }
  }, [data.review.id])

  const handleSpeak = useCallback((text: string) => {
    if (!('speechSynthesis' in window)) return

    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'en-US'
    utterance.rate = 0.9
    window.speechSynthesis.speak(utterance)
  }, [])

  return (
    <ReviewCard
      data={data}
      onRate={handleRate}
      onSpeak={handleSpeak}
      isLoading={isLoading}
      showAnswer={showAnswer}
      onToggleAnswer={() => setShowAnswer((current) => !current)}
    />
  )
}
