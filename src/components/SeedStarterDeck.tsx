'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { BookOpen, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function SeedStarterDeck() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleSeed = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/words/seed', { method: 'POST' })
      if (!response.ok) throw new Error('基礎字卡建立失敗')
      router.refresh()
    } catch (error) {
      console.error('Seed starter deck error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button onClick={handleSeed} disabled={isLoading} className="mt-4 bg-cyan-300 text-slate-950 hover:bg-cyan-200">
      {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BookOpen className="mr-2 h-4 w-4" />}
      {isLoading ? '建立中...' : '載入基礎單字卡'}
    </Button>
  )
}
