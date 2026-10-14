-- The owner, 14/10: only the team opens forum discussions (everyone comments),
-- and every text on the site is editable from the admin area.

-- ───────────────────────── posts: team only ─────────────────────────
drop policy "posts insert" on public.posts;
create policy "posts insert" on public.posts for insert
  with check (public.is_admin() and author_id = auth.uid());

drop trigger if exists posts_moderation on public.posts;
drop function if exists public.posts_apply_moderation();
delete from public.settings where key = 'forum_moderation';

-- ───────────────────────── site content ─────────────────────────
-- key → text (plain, multi-line, or sanitized HTML). Defaults live in src/lib/content.ts;
-- a row here overrides the default. Public pages (login) read it too, so anon may select.
create table public.site_content (
  key text primary key,
  value text not null default '',
  updated_at timestamptz not null default now()
);
alter table public.site_content enable row level security;
create policy "content read" on public.site_content for select using (true);
create policy "content admin" on public.site_content for all
  using (public.is_admin()) with check (public.is_admin());
grant select on public.site_content to anon, authenticated;
