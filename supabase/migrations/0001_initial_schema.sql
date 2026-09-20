create table if not exists public.words (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  word text not null,
  definition jsonb not null default '{}'::jsonb,
  example_sentences jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  word_id uuid not null references public.words(id) on delete cascade,
  due timestamptz not null,
  stability double precision not null default 0,
  difficulty double precision not null default 0,
  elapsed_days integer not null default 0,
  scheduled_days integer not null default 0,
  reps integer not null default 0,
  lapses integer not null default 0,
  state integer not null default 0 check (state between 0 and 3),
  last_review timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, word_id)
);

create index if not exists words_user_id_created_at_idx
  on public.words (user_id, created_at desc);

create index if not exists reviews_user_id_due_idx
  on public.reviews (user_id, due);

alter table public.words enable row level security;
alter table public.reviews enable row level security;

create policy "Users can read their own words"
  on public.words for select
  using (auth.uid() = user_id);

create policy "Users can create their own words"
  on public.words for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own words"
  on public.words for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own words"
  on public.words for delete
  using (auth.uid() = user_id);

create policy "Users can read their own reviews"
  on public.reviews for select
  using (auth.uid() = user_id);

create policy "Users can create their own reviews"
  on public.reviews for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own reviews"
  on public.reviews for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own reviews"
  on public.reviews for delete
  using (auth.uid() = user_id);
