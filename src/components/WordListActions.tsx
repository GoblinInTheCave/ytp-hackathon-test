'use client'

import { useState } from 'react'
import { RotateCcw, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export function WordListActions({ wordId, reviewId }: { wordId: string; reviewId?: string }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const resetReview = async () => {
    if (!reviewId) return
    setIsLoading(true)
    try {
      const response = await fetch(`/api/reviews/${reviewId}/reset`, { method: 'POST' })
      if (!response.ok) throw new Error('重置失敗')
      router.refresh()
    } catch (error) {
      console.error('Reset review error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const deleteWord = async () => {
    if (!window.confirm('確定要刪除這個單字嗎？複習紀錄也會一併刪除。')) return
    setIsLoading(true)
    try {
      const response = await fetch(`/api/words/${wordId}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('刪除失敗')
      router.refresh()
    } catch (error) {
      console.error('Delete word error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="icon" onClick={resetReview} disabled={isLoading || !reviewId} aria-label="重置複習" className="text-slate-400 hover:bg-white/10 hover:text-cyan-200">
        <RotateCcw className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" onClick={deleteWord} disabled={isLoading} aria-label="刪除單字" className="text-slate-400 hover:bg-red-400/10 hover:text-red-300">
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )
}
