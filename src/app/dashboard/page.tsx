import { getDueReviews, getReviewStats } from '@/lib/db'
import Link from 'next/link'
import { ReviewCardClient } from '@/components/ReviewCardClient'
import { WordForm } from '@/components/WordForm'
import { DashboardActions } from '@/components/DashboardActions'
import { WordListActions } from '@/components/WordListActions'
import { SeedStarterDeck } from '@/components/SeedStarterDeck'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Brain, BookOpen, Plus, CheckCircle, Clock } from 'lucide-react'
import { Suspense } from 'react'

async function DashboardStats() {
  const stats = await getReviewStats()
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card className="border-cyan-300/15 bg-cyan-300/[0.08] text-white">
        <CardContent className="pt-6 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-cyan-200">待複習</p>
              <p className="text-3xl font-bold text-white">{stats.due}</p>
            </div>
            <Clock className="h-8 w-8 text-cyan-300" />
          </div>
        </CardContent>
      </Card>
      <Card className="border-emerald-300/15 bg-emerald-300/[0.08] text-white">
        <CardContent className="pt-6 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-emerald-200">學習中</p>
              <p className="text-3xl font-bold text-white">{stats.learning}</p>
            </div>
            <Brain className="h-8 w-8 text-emerald-300" />
          </div>
        </CardContent>
      </Card>
      <Card className="border-violet-300/15 bg-violet-300/[0.08] text-white">
        <CardContent className="pt-6 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-violet-200">複習中</p>
              <p className="text-3xl font-bold text-white">{stats.review}</p>
            </div>
            <BookOpen className="h-8 w-8 text-violet-300" />
          </div>
        </CardContent>
      </Card>
      <Card className="border-white/10 bg-white/[0.06] text-white">
        <CardContent className="pt-6 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-300">新單字</p>
              <p className="text-3xl font-bold text-white">{stats.new}</p>
            </div>
            <Plus className="h-8 w-8 text-slate-300" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

async function ReviewList() {
  const reviews = await getDueReviews(20)
  
  if (reviews.length === 0) {
    return (
      <Card className="border-white/10 bg-white/[0.06] py-12 text-center text-white">
        <CardContent>
          <CheckCircle className="mx-auto mb-4 h-16 w-16 text-cyan-300" />
          <h3 className="mb-2 text-xl font-semibold">
            太棒了！目前沒有待複習的單字
          </h3>
          <p className="text-slate-400">
            去新增單字，或稍後再來複習吧
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {reviews.map((item, index) => (
        <ReviewCardClient key={`${item.review.id}-${index}`} data={item} />
      ))}
    </div>
  )
}

async function WordList() {
  const supabase = await import('@/lib/supabase/server').then(m => m.createClient())
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null

  const { data: words } = await supabase
    .from('words')
    .select(`
      *,
      reviews!left (state, due)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (!words || words.length === 0) {
    return (
      <Card className="border-white/10 bg-white/[0.06] text-white">
        <CardContent className="py-12 text-center">
          <BookOpen className="mx-auto mb-4 h-16 w-16 text-cyan-300/70" />
          <h3 className="mb-2 text-xl font-semibold">
            還沒有任何單字
          </h3>
          <p className="text-slate-400">
            點選上方「新增單字」開始建立你的單字庫
          </p>
          <SeedStarterDeck />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {words.map((word) => (
        <Card key={word.id} className="border-white/10 bg-white/[0.06] text-white transition hover:border-cyan-300/30 hover:bg-white/[0.09]">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-lg font-semibold text-white">
                    {word.word}
                  </p>
                  <p className="text-sm text-slate-400">
                    {word.definition?.zh || '無釋義'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {word.reviews && word.reviews.length > 0 && (
                  <Badge
                    variant="outline"
                    className={word.reviews[0].state === 0 ? 'border-cyan-300/30 bg-cyan-300/10 text-cyan-200' : word.reviews[0].state === 1 ? 'border-amber-300/30 bg-amber-300/10 text-amber-200' : 'border-emerald-300/30 bg-emerald-300/10 text-emerald-200'}
                  >
                    {word.reviews[0].state === 0 ? '新' : word.reviews[0].state === 1 ? '學習中' : '複習中'}
                  </Badge>
                )}
                <WordListActions
                  wordId={word.id}
                  reviewId={word.reviews?.[0]?.id}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function DashboardContent() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">Your learning space</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-white">今天也一起進步。</h1>
        </div>
        <WordForm />
      </div>

      <Suspense fallback={<DashboardStatsSkeleton />}>
        <DashboardStats />
      </Suspense>

      <Tabs defaultValue="review" className="w-full">
        <TabsList className="grid h-12 w-full grid-cols-2 rounded-xl border border-white/10 bg-white/[0.06] p-1">
          <TabsTrigger value="review" className="text-slate-400 hover:text-white data-active:bg-cyan-300 data-active:text-slate-950">
            <Brain className="mr-2 h-4 w-4" />
            複習模式
          </TabsTrigger>
          <TabsTrigger value="words" className="text-slate-400 hover:text-white data-active:bg-cyan-300 data-active:text-slate-950">
            <BookOpen className="mr-2 h-4 w-4" />
            單字列表
          </TabsTrigger>
        </TabsList>

        <TabsContent value="review" className="pt-4">
          <Suspense fallback={<ReviewListSkeleton />}>
            <ReviewList />
          </Suspense>
        </TabsContent>

        <TabsContent value="words" className="pt-4">
          <Suspense fallback={<WordListSkeleton />}>
            <WordList />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function DashboardStatsSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[1,2,3,4].map(i => (
        <Card key={i} className="animate-pulse border-white/10 bg-white/[0.06]">
          <CardContent className="pt-6 pb-4 h-24" />
        </Card>
      ))}
    </div>
  )
}

function ReviewListSkeleton() {
  return (
    <div className="space-y-4">
      {[1,2,3].map(i => (
        <Card key={i} className="h-96 animate-pulse border-white/10 bg-white/[0.06]" />
      ))}
    </div>
  )
}

function WordListSkeleton() {
  return (
    <div className="space-y-3">
      {[1,2,3,4,5].map(i => (
        <Card key={i} className="animate-pulse border-white/10 bg-white/[0.06]">
          <CardContent className="py-4 h-16" />
        </Card>
      ))}
    </div>
  )
}

export default async function DashboardPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-slate-950/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-cyan-300 text-slate-950"><Brain className="h-5 w-5" /></span>
              <span className="hidden sm:inline">YTP VocaBuddy</span>
            </Link>
            <DashboardActions />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
        <DashboardContent />
      </main>
    </div>
  )
}