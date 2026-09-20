import Link from 'next/link'
import { ArrowRight, Brain, Check, Languages, Sparkles, Target, Zap } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const appHref = user ? '/dashboard' : '/login'

  return (
    <main className="min-h-screen overflow-hidden bg-slate-950 text-white">
      <nav className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-cyan-400 text-slate-950"><Brain className="h-5 w-5" /></span>
          YTP VocaBuddy
        </Link>
        <Link href={appHref} className="rounded-full border border-white/20 px-4 py-2 text-sm font-medium transition hover:bg-white/10">
          {user ? '前往儀表板' : '登入 / 註冊'}
        </Link>
      </nav>

      <section className="relative mx-auto grid max-w-6xl gap-12 px-5 pb-20 pt-16 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:pt-24">
        <div className="absolute -left-24 top-12 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="relative">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1.5 text-sm text-cyan-200"><Sparkles className="h-4 w-4" />讓每天 10 分鐘真正留下記憶</div>
          <h1 className="max-w-3xl text-4xl font-black leading-tight tracking-tight sm:text-6xl">用更聰明的方式，<span className="text-cyan-300">記住每個英文單字。</span></h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">VocaBuddy 結合 AI 例句與 FSRS 間隔重複排程，將單字卡變成適合你的每日學習計畫。</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href={appHref} className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-300 px-5 py-3 font-bold text-slate-950 transition hover:bg-cyan-200">{user ? '開始今天的複習' : '免費開始學習'}<ArrowRight className="h-4 w-4" /></Link>
            <a href="#how-it-works" className="inline-flex items-center justify-center rounded-xl border border-white/20 px-5 py-3 font-medium transition hover:bg-white/10">了解運作方式</a>
          </div>
        </div>

        <div className="relative rounded-3xl border border-white/10 bg-white/10 p-4 shadow-2xl backdrop-blur sm:p-6">
          <div className="rounded-2xl bg-white p-6 text-slate-900 shadow-xl sm:p-8">
            <div className="flex items-center justify-between text-sm text-slate-500"><span>今日複習</span><span className="rounded-full bg-emerald-100 px-2 py-1 text-emerald-700">準備好了</span></div>
            <div className="py-12 text-center"><p className="text-sm font-medium text-slate-400">英文單字</p><p className="mt-3 text-5xl font-black tracking-tight">resilient</p><p className="mt-3 text-slate-500">按下開始，翻面查看答案</p></div>
            <div className="grid grid-cols-4 gap-2 text-center text-xs font-semibold"><div className="rounded-lg bg-red-100 px-2 py-3 text-red-700">忘記</div><div className="rounded-lg bg-orange-100 px-2 py-3 text-orange-700">困難</div><div className="rounded-lg bg-blue-100 px-2 py-3 text-blue-700">良好</div><div className="rounded-lg bg-emerald-100 px-2 py-3 text-emerald-700">簡單</div></div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-6xl px-5 pb-24 sm:px-8">
        <div className="grid gap-4 md:grid-cols-3"><Feature icon={<Languages />} title="建立你的單字庫" text="輸入單字，AI 會產生適合台灣學習者的中英文釋義與實用例句。" /><Feature icon={<Target />} title="每天專注複習" text="系統依照你的記憶狀態安排今日最值得複習的單字。" /><Feature icon={<Zap />} title="每次評分都會進化" text="用忘記、困難、良好、簡單回報，FSRS 會調整下一次出現時間。" /></div>
        <div className="mt-12 rounded-3xl border border-white/10 bg-white/[0.06] p-6 sm:p-10"><div className="grid gap-8 md:grid-cols-2 md:items-center"><div><p className="text-sm font-semibold uppercase tracking-widest text-cyan-300">Why VocaBuddy</p><h2 className="mt-3 text-3xl font-bold">少一點焦慮，多一點持續。</h2><p className="mt-4 leading-7 text-slate-300">不用猜今天該讀什麼，也不用一次塞滿整本單字書。讓系統把複習切成每天做得到的小步驟。</p></div><ul className="space-y-3 text-slate-200">{['AI 生成自然例句', 'FSRS 科學化間隔排程', '手機、平板、桌機皆可使用'].map((item) => <li key={item} className="flex items-center gap-3"><Check className="h-5 w-5 text-cyan-300" />{item}</li>)}</ul></div></div>
      </section>
    </main>
  )
}

function Feature({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return <article className="rounded-2xl border border-white/10 bg-white/[0.06] p-6"><div className="mb-5 grid h-11 w-11 place-items-center rounded-xl bg-cyan-300/15 text-cyan-300">{icon}</div><h2 className="text-xl font-bold">{title}</h2><p className="mt-3 leading-7 text-slate-400">{text}</p></article>
}
