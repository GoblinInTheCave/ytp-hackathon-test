# YTP VocaBuddy — Product & Engineering Specification

> 這份文件可直接交給 Claude Code 作為實作規格。目標是完成一個適合黑客松展示、手機優先、可部署的英文單字間隔重複學習網站。

## 1. 產品目標

YTP VocaBuddy 是給台灣英文學習者使用的單字卡網站：使用者輸入單字後，由 AI 產生繁體中文釋義、英文釋義與三個例句；FSRS 依使用者每次的回憶評分安排下一次複習時間。

### MVP 成功標準

- 未登入使用者可瀏覽品牌首頁與產品說明。
- 使用者可 Email/password 註冊、登入、登出；GitHub OAuth 可選用。
- 新使用者可載入基礎單字卡，也可自行新增單字。
- 新增單字會取得 AI 釋義與例句，並建立 FSRS 初始 review record。
- Dashboard 顯示今日待複習數、狀態統計與單字清單。
- 複習卡可翻面、播放發音、使用 1–4 鍵盤快捷鍵評分。
- Again / Hard / Good / Easy 會透過 FSRS 更新 due、stability、difficulty、state 等欄位。
- 使用者可刪除單字、重置單字複習狀態。
- 所有資料只能被資料擁有者讀取或修改。
- `pnpm exec tsc --noEmit`、lint、`pnpm build` 通過。

## 2. 固定技術選擇

不要更換成另一套框架或資料庫，除非有明確阻塞：

- **前端與全端框架**：Next.js 16 App Router + React 19 + TypeScript
- **樣式**：Tailwind CSS 4、現有 shadcn/base-ui 元件
- **BaaS**：Supabase Auth + PostgreSQL + Row Level Security
- **AI**：Vercel AI SDK、`@ai-sdk/openai`、OpenAI `gpt-4o-mini`
- **SRS**：`@squeakyrobot/fsrs`
- **部署**：Vercel；Supabase Cloud 提供 Auth/DB
- **套件管理**：pnpm

## 3. 架構規則

### Server / Client boundary

- Page、資料查詢、SEO、Supabase server client 預設使用 Server Components。
- 需要 `useState`、`useEffect`、event handler、瀏覽器 API 的元件，檔案頂端必須有 `'use client'`。
- Server Component 傳給 Client Component 的 props 必須可序列化；不可傳 callback，例如 `onSuccess`、`onClick`。
- Client Component 自己使用 `useRouter().refresh()`、fetch API 或 browser Supabase client 完成互動。
- 不可在 Server Component 內定義使用 React hooks 的互動元件。
- AI API key 只能在 server action 或 Route Handler 使用，不能暴露在 `NEXT_PUBLIC_*`。
- 所有 API route 必須先呼叫 `supabase.auth.getUser()`，再依 `user_id` 驗證資料擁有權。

### 目錄規範

```text
src/app/page.tsx                         # 公開產品首頁
src/app/login/page.tsx                   # 登入/註冊
src/app/dashboard/page.tsx               # Server dashboard
src/app/api/words/route.ts               # 單字 CRUD 基礎 API
src/app/api/words/[id]/route.ts          # 單字刪除
src/app/api/words/seed/route.ts          # 基礎字卡匯入
src/app/api/reviews/route.ts             # 待複習清單
src/app/api/reviews/[id]/route.ts        # 評分更新
src/app/api/reviews/[id]/reset/route.ts  # 重置複習
src/app/api/ai/examples/route.ts         # 例句生成
src/components/*Client.tsx               # 互動 Client Components
src/lib/db.ts                            # server-side database helpers
src/lib/srs.ts                           # FSRS adapter，禁止 UI 直接操作 FSRS
src/lib/ai.ts                            # server-only AI functions
src/lib/supabase/server.ts               # server client
src/lib/supabase/client.ts               # browser client
src/proxy.ts                              # Next.js 16 auth proxy
supabase/migrations/                     # 可重放 SQL migration
```

## 4. 資料模型

### `public.words`

| 欄位 | 型別 | 規則 |
|---|---|---|
| id | uuid | PK、`gen_random_uuid()` |
| user_id | uuid | FK `auth.users(id)`、cascade delete |
| word | text | required |
| definition | jsonb | `{ zh: string, en: string }` |
| example_sentences | jsonb | `{ en: string, zh: string }[]` |
| created_at | timestamptz | default now |

### `public.reviews`

| 欄位 | 型別 | 規則 |
|---|---|---|
| id | uuid | PK |
| user_id | uuid | FK auth user |
| word_id | uuid | FK words，cascade delete |
| due | timestamptz | 下一次複習時間 |
| stability | double precision | FSRS stability |
| difficulty | double precision | FSRS difficulty |
| elapsed_days | integer | FSRS |
| scheduled_days | integer | FSRS |
| reps | integer | FSRS |
| lapses | integer | FSRS |
| state | integer | 0 New / 1 Learning / 2 Review / 3 Relearning |
| last_review | timestamptz nullable | 最近一次複習 |
| created_at | timestamptz | default now |

`unique(user_id, word_id)`；以 `user_id, due` 建立索引。migration 必須啟用 RLS，並提供 user-owned select/insert/update/delete policies。

## 5. 使用者流程

### 未登入

1. `/` 顯示產品價值、FSRS/AI 特色與 CTA。
2. CTA 前往 `/login`。
3. 登入成功回到 `redirectedFrom`，預設 `/dashboard`。

### 新增單字

1. 使用者在 dashboard 輸入英文單字。
2. Client 呼叫 server-only `generateWordData()`。
3. 顯示可編輯的 AI 釋義與三個例句預覽。
4. POST `/api/words`。
5. API 驗證欄位、建立 words row，再以 `createEmptyCard()` 建立 reviews row。
6. 成功後清空表單並 `router.refresh()`。

### 複習

1. Server 查詢 `reviews.due <= now` 並 join words。
2. Client 顯示單字正面。
3. 點擊、Space 或 Enter 翻面。
4. 顯示釋義、例句與四個評分按鈕。
5. 1/2/3/4 對應 Again/Hard/Good/Easy。
6. PATCH `/api/reviews/:id`，使用 `scheduleWithGrade()` 儲存更新後 card。
7. 成功後重新載入或 `router.refresh()`，下一張到期卡出現。

## 6. FSRS 實作規則

只能從 `@squeakyrobot/fsrs` 匯入：

```ts
import { FSRS, Rating, type Card, type SchedulingResult } from '@squeakyrobot/fsrs'
```

- 新卡：`fsrs.createEmptyCard(now)`
- 四種預覽：`fsrs.repeat(card)[Rating.Again]` 等；間隔使用 `result.card.scheduled_days`
- 實際評分：`fsrs.scheduleWithGrade(card, rating)`，取 `{ card: updatedCard, log }`
- DB 的 ISO string 必須在進入 FSRS 時轉成 `Date`，輸出時轉回 ISO string。
- API 必須只接受整數 1–4，拒絕 `0`、`5`、小數與非數字。
- `last_review` 以實際評分時間寫入，不能把 preview 當成 review。

## 7. API 契約

### `POST /api/words`

Request:

```json
{
  "word": "resilient",
  "definition": { "zh": "有韌性的", "en": "able to recover quickly" },
  "examples": [{ "en": "...", "zh": "..." }]
}
```

回傳 `201` 與建立的 word；未登入 401；輸入錯誤 400；DB 錯誤 500。

### `DELETE /api/words/:id`

只允許刪除目前使用者的 word。reviews 透過 FK cascade 一併刪除。

### `POST /api/words/seed`

建立 12 張基礎單字卡。必須先查詢使用者已有單字並避免重複；每張卡都建立一筆初始 review。

### `GET /api/reviews`

只回傳當前使用者且 `due <= now()` 的最多 20 筆，包含關聯 word 與四種 intervals。

### `PATCH /api/reviews/:id`

Request `{ "rating": 1 | 2 | 3 | 4 }`。先查詢並驗證 ownership，再用 FSRS 更新。不可接受別人的 review id。

### `POST /api/reviews/:id/reset`

把 review 替換成 `createEmptyCard(new Date())` 的狀態。

### `POST /api/ai/examples`

驗證 word ownership；若已有例句可直接回傳；否則由 AI 生成三句並儲存。

## 8. UI / RWD 規則

- Mobile-first；小螢幕不可出現水平溢出。
- 表單、卡片、按鈕最小觸控區域約 44px。
- Dashboard 統計手機 2 欄、桌機 4 欄。
- 複習卡在手機使用 `max-w-md`，四個評分按鈕仍需可讀且可點擊。
- AI loading、API error、空資料、成功後 refresh 都要有明確 UI。
- 所有 icon button 必須有 `aria-label`。
- 不要在 production UI 留下 Next.js starter logo 或模板文字。

## 9. 環境變數

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
OPENAI_API_KEY=
```

- `OPENAI_API_KEY` 僅 server 使用。
- 不要提交 `.env`、`.env.local`、service role key 或 API key。
- 若 key 曾經被貼到聊天、issue 或 git，必須立即 rotate。

## 10. 本機與部署

```bash
pnpm install
pnpm dev
pnpm exec tsc --noEmit
pnpm lint
pnpm build
```

部署步驟：

1. Supabase 建立專案。
2. 在 SQL Editor 執行 `supabase/migrations/0001_initial_schema.sql`。
3. 設定 Auth Email；GitHub OAuth 依需要設定 callback URL。
4. Vercel import Git repository。
5. 在 Vercel 設定上述環境變數。
6. Supabase Auth URL 設定為 Vercel production URL 與 callback `/api/auth/callback`。
7. 以新帳號完成註冊、匯入基礎字卡、AI 新增與四種評分的 smoke test。

## 11. 測試驗收清單

- [ ] `/` 可以開啟，沒有 Next.js 預設模板。
- [ ] 未登入進入 `/dashboard` 會導向 `/login`。
- [ ] 註冊、登入、登出都可使用。
- [ ] 新帳號可匯入 starter deck。
- [ ] 新增單字時 AI 失敗會顯示錯誤，不會卡在 loading。
- [ ] 新增單字會同時建立 word 與 review。
- [ ] 複習卡翻面、語音、鍵盤快捷鍵可用。
- [ ] 四種評分會更新 due/state/reps/lapses。
- [ ] 重置與刪除功能可用。
- [ ] 使用者 A 無法讀取或修改使用者 B 的資料。
- [ ] 手機寬度 375px 沒有水平捲軸。
- [ ] `tsc`、lint、build 通過。

## 12. 後續非 MVP

- 個人化 FSRS 參數與學習統計圖表。
- CSV 匯入/匯出與自訂牌組。
- 每日學習目標、streak、通知。
- AI 智慧出題與選擇題/填空題。
- PWA 離線快取。
