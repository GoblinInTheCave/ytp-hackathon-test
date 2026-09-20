'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

export function DashboardActions() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleSignOut = async () => {
    setIsLoading(true)
    const { error } = await createClient().auth.signOut()
    if (error) {
      console.error('Sign out error:', error)
      setIsLoading(false)
      return
    }
    router.push('/')
    router.refresh()
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleSignOut} disabled={isLoading} className="text-slate-300 hover:bg-white/10 hover:text-white">
      <LogOut className="mr-2 h-4 w-4" />
      {isLoading ? '登出中...' : '登出'}
    </Button>
  )
}
