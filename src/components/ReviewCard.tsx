'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Volume2, RotateCcw, Brain } from 'lucide-react'
import { cn } from '@/components/ui/cn'
import { getStateLabel, getNextIntervals } from '@/lib/srs'
import { ReviewCardData, RATING, type ReviewState } from '@/lib/types'

interface ReviewCardProps {
  data: ReviewCardData
  onRate: (rating: number) => void
  onSpeak: (text: string) => void
  isLoading?: boolean
  showAnswer?: boolean
  onToggleAnswer: () => void
}

type KeyboardEventLike = {
  key: string
  preventDefault: () => void
}

export function ReviewCard({
  data,
  onRate,
  onSpeak,
  isLoading,
  showAnswer,
  onToggleAnswer,
}: ReviewCardProps) {
  const { word, review } = data
  const intervals = getNextIntervals(review)
  const [localIsFlipped, setLocalIsFlipped] = useState(false)
  const isFlipped = showAnswer ?? localIsFlipped

  const handleFlip = useCallback(() => {
    setLocalIsFlipped(prev => !prev)
    onToggleAnswer()
  }, [onToggleAnswer])

  const handleKeyDown = useCallback((e: KeyboardEventLike) => {
    if (isLoading) return
    
    switch (e.key) {
      case ' ':
      case 'Enter':
        e.preventDefault()
        if (!isFlipped) handleFlip()
        break
      case '1':
        if (isFlipped) onRate(RATING.AGAIN)
        break
      case '2':
        if (isFlipped) onRate(RATING.HARD)
        break
      case '3':
        if (isFlipped) onRate(RATING.GOOD)
        break
      case '4':
        if (isFlipped) onRate(RATING.EASY)
        break
      case 's':
      case 'S':
        onSpeak(word.word)
        break
    }
  }, [isLoading, isFlipped, handleFlip, onRate, onSpeak, word.word])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const speakWord = () => onSpeak(word.word)

  return (
    <div className="mx-auto w-full max-w-2xl perspective-1000 outline-none" onKeyDown={handleKeyDown} tabIndex={0}>
      <div
        className={cn(
          'relative h-[34rem] w-full cursor-pointer transition-transform duration-700 transform-style-3d sm:h-[38rem]',
          'rounded-3xl border border-white/10 shadow-2xl shadow-cyan-950/30',
          isFlipped ? 'rotate-y-180' : 'rotate-y-0'
        )}
        onClick={handleFlip}
      >
        {/* 卡片正面 - 單字 */}
        <div className="absolute flex h-full w-full flex-col items-center justify-center rounded-3xl bg-gradient-to-br from-slate-800 via-slate-900 to-cyan-950 p-6 text-white backface-hidden sm:p-10">
          <div className="mb-6 flex items-center gap-2 text-slate-400">
            <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-sm font-medium text-cyan-200">{getStateLabel(review.state as ReviewState)}</span>
            <span className="text-sm">按空白鍵翻面</span>
          </div>
          
          <h1 className="mb-4 break-words text-center text-5xl font-black tracking-tight text-white sm:text-7xl">
            {word.word}
          </h1>
          
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => { e.stopPropagation(); speakWord(); }}
              className="text-slate-300 hover:bg-white/10 hover:text-cyan-200"
              aria-label="發音"
            >
              <Volume2 className="h-6 w-6" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => { e.stopPropagation(); handleFlip(); }}
              className="text-slate-300 hover:bg-white/10 hover:text-cyan-200"
              aria-label="查看答案"
            >
              <RotateCcw className="h-6 w-6" />
            </Button>
          </div>

          {/* 鍵盤提示 */}
          <div className="mt-8 flex items-center gap-3 text-xs text-slate-500 sm:gap-6">
            <kbd className="rounded border border-white/10 bg-white/5 px-2 py-1">Space/Enter</kbd>
            <span>翻面</span>
            <kbd className="rounded border border-white/10 bg-white/5 px-2 py-1">S</kbd>
            <span>發音</span>
          </div>
        </div>

        {/* 卡片背面 - 答案 */}
        <div className="absolute flex h-full w-full flex-col rounded-3xl border border-cyan-300/15 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 p-5 text-white backface-hidden rotate-y-180 sm:p-8">
          <div className="mb-6 flex items-center justify-between">
            <span className="text-sm font-medium text-cyan-200">
              {getStateLabel(review.state as ReviewState)}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => { e.stopPropagation(); speakWord(); }}
              className="text-cyan-200 hover:bg-white/10 hover:text-cyan-100"
              aria-label="發音"
            >
              <Volume2 className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-6">
            {/* 中文釋義 */}
            <div>
              <p className="mb-2 text-sm font-medium text-cyan-300">中文釋義</p>
              <p className="text-2xl font-semibold text-white">
                {word.definition.zh}
              </p>
            </div>

            {/* 英文釋義 */}
            <div>
              <p className="mb-2 text-sm font-medium text-cyan-300">English Definition</p>
              <p className="text-lg italic text-slate-300">
                {word.definition.en}
              </p>
            </div>

            {/* 例句 */}
            {word.example_sentences && word.example_sentences.length > 0 && (
              <div>
                <p className="mb-3 text-sm font-medium text-cyan-300">例句</p>
                <div className="space-y-3">
                  {word.example_sentences.map((ex, idx) => (
                    <div key={idx} className="rounded-xl border border-white/10 bg-white/[0.06] p-4">
                      <p className="mb-1 text-slate-100">{ex.en}</p>
                      <p className="text-sm text-slate-400">{ex.zh}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 空例句提示 */}
            {!word.example_sentences || word.example_sentences.length === 0 ? (
              <div className="py-4 text-center text-slate-500">
                <Brain className="mx-auto mb-2 h-8 w-8 opacity-50" />
                <p>目前尚無例句</p>
              </div>
            ) : null}
          </div>

          {/* 評分按鈕區域 */}
          <Separator className="my-4 border-white/10" />
          <div className="grid grid-cols-4 gap-2">
            {[
              { rating: RATING.AGAIN, label: '忘記', interval: intervals.again, color: 'bg-rose-500/90 hover:bg-rose-400', icon: '😵' },
              { rating: RATING.HARD, label: '困難', interval: intervals.hard, color: 'bg-orange-500/90 hover:bg-orange-400', icon: '😰' },
              { rating: RATING.GOOD, label: '良好', interval: intervals.good, color: 'bg-cyan-500/90 hover:bg-cyan-400', icon: '😊' },
              { rating: RATING.EASY, label: '簡單', interval: intervals.easy, color: 'bg-emerald-500/90 hover:bg-emerald-400', icon: '😎' },
            ].map(({ rating, label, interval, color, icon }) => (
              <Button
                key={rating}
                onClick={(e) => { e.stopPropagation(); onRate(rating); }}
                disabled={isLoading}
                className={cn(
                  'h-20 flex-col gap-1 text-white font-medium sm:h-24',
                  color,
                  'transition-all hover:scale-105 active:scale-95'
                )}
              >
                <span className="text-2xl">{icon}</span>
                <span className="text-sm font-semibold">{label}</span>
                <span className="text-xs opacity-90">{interval}</span>
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}