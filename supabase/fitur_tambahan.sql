-- ---------------------------------------------------------------------------
-- Bore & Barrel — optional schema for the extra features.
--
-- Run once in Supabase Dashboard › SQL Editor. Without it the app still
-- works: archive and review votes fall back to localStorage (per device).
-- With it, both are stored on the server and shared between users.
-- ---------------------------------------------------------------------------

-- 1. Soft delete / archive: products with deleted_at set are hidden from
--    the catalog and listed in Profile › Archive.
alter table public.products
  add column if not exists deleted_at timestamptz;

-- 2. Thumbs up / thumbs down on reviews (one vote per user per review).
create table if not exists public.review_votes (
  review_id  bigint      not null references public.reviews (id) on delete cascade,
  user_id    uuid        not null,
  vote       smallint    not null check (vote in (-1, 1)),
  created_at timestamptz not null default now(),
  primary key (review_id, user_id)
);

alter table public.review_votes enable row level security;

drop policy if exists "review_votes_select" on public.review_votes;
drop policy if exists "review_votes_insert" on public.review_votes;
drop policy if exists "review_votes_update" on public.review_votes;
drop policy if exists "review_votes_delete" on public.review_votes;

create policy "review_votes_select" on public.review_votes for select using (true);
create policy "review_votes_insert" on public.review_votes for insert with check (true);
create policy "review_votes_update" on public.review_votes for update using (true) with check (true);
create policy "review_votes_delete" on public.review_votes for delete using (true);

grant select, insert, update, delete on public.review_votes to anon, authenticated;
