'use server'

import { openai } from '@ai-sdk/openai'
import { generateObject } from 'ai'
import { z } from 'zod'

const WordDataSchema = z.object({
  definition: z.object({
    zh: z.string().describe('繁體中文釋義'),
    en: z.string().describe('英文釋義'),
  }),
  examples: z
    .array(
      z.object({
        en: z.string().describe('英文例句'),
        zh: z.string().describe('繁體中文翻譯'),
      })
    )
    .length(3)
    .describe('三個例句'),
})

export type WordData = z.infer<typeof WordDataSchema>

export async function generateWordData(word: string): Promise<WordData> {
  const { object } = await generateObject({
    model: openai('gpt-4o-mini'),
    schema: WordDataSchema,
    system: `你是專業的英語老師。請為給定的單字提供：
1. 繁體中文釋義與英文釋義
2. 三個自然、實用的英文例句（包含繁體中文翻譯）
例句要涵蓋不同語境，適合台灣學習者。`,
    prompt: `單字：${word}`,
    temperature: 0.7,
  })

  return object
}

export async function generateExampleSentences(
  word: string,
  definition: string
): Promise<Array<{ en: string; zh: string }>> {
  const { object } = await generateObject({
    model: openai('gpt-4o-mini'),
    schema: z.array(
      z.object({
        en: z.string(),
        zh: z.string(),
      })
    ).length(3),
    system: `你是英語老師。為給定單字生成 3 個自然例句（含繁體中文翻譯），釋義參考：${definition}`,
    prompt: `單字：${word}`,
    temperature: 0.8,
  })

  return object
}