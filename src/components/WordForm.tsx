'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Loader2, Plus, Sparkles } from 'lucide-react'
import { generateWordData, type WordData } from '@/lib/ai'

export function WordForm() {
  const router = useRouter()
  const [word, setWord] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedData, setGeneratedData] = useState<WordData | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [error, setError] = useState('')

  const handleGenerate = async (e: FormEvent) => {
    e.preventDefault()
    if (!word.trim() || isGenerating) return

    setIsGenerating(true)
    setError('')

    try {
      const data = await generateWordData(word.trim())
      setGeneratedData(data)
      setShowPreview(true)
    } catch (err) {
      setError('生成失敗，請稍後再試')
      console.error(err)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleConfirm = async () => {
    if (!generatedData) return

    try {
      const response = await fetch('/api/words', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          word: word.trim(),
          definition: generatedData.definition,
          examples: generatedData.examples,
        }),
      })

      if (!response.ok) throw new Error('儲存失敗')

      setWord('')
      setGeneratedData(null)
      setShowPreview(false)
      router.refresh()
    } catch (err) {
      setError('儲存失敗，請稍後再試')
      console.error(err)
    }
  }

  const handleCancel = () => {
    setGeneratedData(null)
    setShowPreview(false)
  }

  return (
    <Dialog open={showPreview} onOpenChange={handleCancel}>
      <DialogTrigger
        render={
          <Button
            onClick={handleGenerate}
            disabled={!word.trim() || isGenerating} 
            className="h-11 w-full gap-2 bg-cyan-300 text-slate-950 hover:bg-cyan-200 sm:w-auto"
          />
        }
      >
        <>
          <Plus className="h-4 w-4" />
          <Sparkles className="h-4 w-4" />
          {isGenerating ? 'AI 生成中...' : '新增單字 (AI 生成釋義)'}
        </>
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto border-white/10 bg-slate-900 text-white shadow-2xl shadow-cyan-950/30">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-cyan-300" />
            確認單字資料
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={(e) => { e.preventDefault(); handleConfirm(); }}>
          <div className="space-y-6 py-4">
            {/* 單字 */}
            <div>
              <Label className="text-sm font-medium">單字</Label>
              <Input
                value={word}
                onChange={(e) => setWord(e.target.value)}
                disabled={showPreview}
                className="mt-1 text-xl font-semibold text-center"
                placeholder="輸入英文單字..."
                autoFocus
                autoComplete="off"
              />
            </div>

            {/* AI 生成預覽 */}
            {generatedData && (
              <Card className="border-cyan-300/20 bg-cyan-300/[0.08] text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Sparkles className="h-4 w-4 text-cyan-300" />
                    AI 自動生成內容（可編輯）
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* 中文釋義 */}
                  <div>
                    <Label className="text-sm font-medium">中文釋義</Label>
                    <Input
                      defaultValue={generatedData.definition.zh}
                      onChange={(e) => setGeneratedData(prev => prev ? { ...prev, definition: { ...prev.definition, zh: e.target.value } } : null)}
                            className="mt-1 border-white/10 bg-white/[0.06] text-white"
                    />
                  </div>

                  {/* 英文釋義 */}
                  <div>
                    <Label className="text-sm font-medium">英文釋義</Label>
                    <Input
                      defaultValue={generatedData.definition.en}
                      onChange={(e) => setGeneratedData(prev => prev ? { ...prev, definition: { ...prev.definition, en: e.target.value } } : null)}
                            className="mt-1 border-white/10 bg-white/[0.06] text-white"
                    />
                  </div>

                  {/* 例句 */}
                  <div>
                    <Label className="text-sm font-medium">例句 (3 句)</Label>
                    <div className="mt-2 space-y-2">
                      {generatedData.examples.map((ex, idx) => (
                        <div key={idx} className="grid grid-cols-[auto_1fr] items-center gap-2 sm:grid-cols-[auto_1fr_1fr]">
                          <span className="w-6 text-center text-sm text-slate-500">{idx + 1}.</span>
                          <Input
                            defaultValue={ex.en}
                            onChange={(e) => setGeneratedData(prev => prev ? {
                              ...prev,
                              examples: prev.examples.map((e2, i) => i === idx ? { ...e2, en: e.target.value } : e2)
                            } : null)}
                            placeholder="英文例句"
                            className="border-white/10 bg-white/[0.06] text-white"
                          />
                          <Input
                            defaultValue={ex.zh}
                            onChange={(e) => setGeneratedData(prev => prev ? {
                              ...prev,
                              examples: prev.examples.map((e2, i) => i === idx ? { ...e2, zh: e.target.value } : e2)
                            } : null)}
                            placeholder="中文翻譯"
                            className="col-start-2 border-white/10 bg-white/[0.06] text-white sm:col-start-auto"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {error && (
              <div className="rounded-lg border border-red-300/20 bg-red-400/10 p-3 text-center text-sm text-red-200">{error}</div>
            )}
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-white/10 pt-4 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="flex-1 border-white/15 bg-white/[0.04] text-white hover:bg-white/10 hover:text-white"
            >
              取消
            </Button>
            <Button
              type="submit"
              disabled={!generatedData}
              className="flex-1 bg-cyan-300 text-slate-950 hover:bg-cyan-200"
            >
              確認儲存
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// 簡單版本 - 用於 Dashboard 頁面頂部
export function SimpleWordForm() {
  const router = useRouter()
  const [word, setWord] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!word.trim() || isGenerating) return

    setIsGenerating(true)
    setError('')

    try {
      const data = await generateWordData(word.trim())
      
      const response = await fetch('/api/words', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          word: word.trim(),
          definition: data.definition,
          examples: data.examples,
        }),
      })

      if (!response.ok) throw new Error('儲存失敗')

      setWord('')
      router.refresh()
    } catch (err) {
      setError('生成或儲存失敗，請稍後再試')
      console.error(err)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-xl mx-auto">
      <div className="flex gap-2 mb-2">
        <Input
          value={word}
          onChange={(e) => setWord(e.target.value)}
          placeholder="輸入想學的英文單字..."
          className="flex-1 border-white/15 bg-white/[0.04] text-white hover:bg-white/10 hover:text-white"
          disabled={isGenerating}
          autoComplete="off"
        />
        <Button
          type="submit"
          disabled={!word.trim() || isGenerating}
          className="whitespace-nowrap"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              生成中...
            </>
          ) : (
            <>
              <Plus className="mr-2 h-4 w-4" />
              <Sparkles className="h-4 w-4" />
              新增
            </>
          )}
        </Button>
      </div>
      {error && <p className="text-red-500 text-sm text-center">{error}</p>}
      <p className="text-center text-xs text-slate-500">
        AI 會自動生成中英文釋義與 3 句例句
      </p>
    </form>
  )
}