'use client'

import { Suspense, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Brain, Loader2, Mail, Lock } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { FaGithub } from "react-icons/fa";

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectedFrom = searchParams.get('redirectedFrom') || '/dashboard'
  const error = searchParams.get('error')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [errorMessage, setErrorMessage] = useState(error || '')

  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')
    setIsLoading(true)

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/api/auth/callback?next=${redirectedFrom}`,
          },
        })
        if (error) throw error
        setErrorMessage('註冊成功！請檢查信箱驗證後登入。')
        setIsSignUp(false)
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        router.push(redirectedFrom)
        router.refresh()
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : '發生錯誤，請稍後再試')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOAuth = async (provider: 'github') => {
    setIsLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback?next=${redirectedFrom}`,
      },
    })
    if (error) {
      setErrorMessage(error.message)
      setIsLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-12 text-white">
      <div className="absolute -left-32 top-10 h-80 w-80 rounded-full bg-cyan-500/20 blur-3xl" />
      <div className="absolute -right-32 bottom-0 h-80 w-80 rounded-full bg-blue-500/15 blur-3xl" />
      <Card className="relative w-full max-w-md border-white/10 bg-white/[0.08] text-white shadow-2xl backdrop-blur-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl flex items-center justify-center gap-2">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-300 text-slate-950"><Brain className="h-5 w-5" /></span>
            YTP VocaBuddy
          </CardTitle>
          <CardDescription className="text-slate-400">
            {isSignUp ? '建立帳號開始背單字' : '登入您的帳號'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {errorMessage && (
            <div className="rounded-xl border border-red-300/20 bg-red-400/10 p-3 text-center text-sm text-red-200">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="border-white/10 bg-white/[0.06] pl-10 text-white placeholder:text-slate-500"
                  required
                  disabled={isLoading}
                  autoComplete={isSignUp ? 'email' : 'email'}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">密碼</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="至少 6 個字元"
                  className="border-white/10 bg-white/[0.06] pl-10 text-white placeholder:text-slate-500"
                  required
                  disabled={isLoading}
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="h-11 w-full bg-cyan-300 text-slate-950 hover:bg-cyan-200"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isSignUp ? '註冊中...' : '登入中...'}
                </>
              ) : (
                isSignUp ? '建立帳號' : '登入'
              )}
            </Button>
          </form>

          <Separator className="my-4" />

          <Button
            variant="outline"
            onClick={() => handleOAuth('github')}
            disabled={isLoading}
            className="h-11 w-full gap-2 border-white/15 bg-white/[0.04] text-white hover:bg-white/10 hover:text-white"
          >
            <FaGithub className="h-4 w-4" />
            使用 GitHub 登入
          </Button>

          <p className="text-center text-sm text-slate-400">
            {isSignUp ? '已有帳號？' : '還沒帳號？'}
            <button
              onClick={() => {
                setIsSignUp(!isSignUp)
                setErrorMessage('')
              }}
              className="ml-1 font-medium text-cyan-300 hover:underline"
            >
              {isSignUp ? '去登入' : '免費註冊'}
            </button>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950" />}>
      <LoginForm />
    </Suspense>
  )
}