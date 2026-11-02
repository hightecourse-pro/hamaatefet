-- The owner, 2/11: the forum becomes a thread list (chat-like), sections decide
-- who opens threads (team only + member requests, or everyone), a section can
-- carry an "ask the team" button, admins delete anything, and a team inbox
-- collects bug reports / questions / topic requests from the floating widget.

-- ───────────────────────── sections: who posts, ask button ─────────────────────────
alter table public.forum_sections
  add column if not exists post_mode text not null default 'team' check (post_mode in ('team', 'members')),
  add column if not exists ask_label text not null default '';

comment on column public.forum_sections.post_mode is 'team = only admins open threads (members send topic requests); members = everyone opens threads';
comment on column public.forum_sections.ask_label is 'Label of the "ask the team" button shown in this section; empty = no button';

-- Members open threads only in "members" sections, never pinned / hidden / pending.
drop policy if exists "posts insert" on public.posts;
create policy "posts insert" on public.posts for insert
  with check (
    author_id = auth.uid() and (
      public.is_admin()
      or (
        public.is_active()
        and not pinned
        and status = 'published'
        and exists (select 1 from public.forum_sections s where s.id = section_id and s.visible and s.post_mode = 'members')
      )
    )
  );

-- ───────────────────────── feed: last activity for the thread list ─────────────────────────
drop view if exists public.post_feed;
create view public.post_feed with (security_invoker = true) as
  select
    p.id, p.section_id, p.author_id, p.title, p.body, p.image_path, p.help_kind, p.status, p.pinned, p.created_at,
    s.key as section_key, s.name as section_name, s.color as section_color, s.tint as section_tint, s.post_mode as section_post_mode,
    coalesce(m.first_name, '') as author_first_name,
    coalesce(m.last_name, '') as author_last_name,
    (select count(*) from public.post_likes l where l.post_id = p.id)::int as like_count,
    (select count(*) from public.comments c where c.post_id = p.id)::int as comment_count,
    exists (select 1 from public.post_likes l where l.post_id = p.id and l.user_id = auth.uid()) as liked_by_me,
    greatest(p.created_at, coalesce((select max(c.created_at) from public.comments c where c.post_id = p.id), p.created_at)) as last_activity_at
  from public.posts p
  join public.forum_sections s on s.id = p.section_id
  left join public.member_directory m on m.id = p.author_id;
grant select on public.post_feed to authenticated;

-- ───────────────────────── team inbox ─────────────────────────
do $$ begin
  create type public.message_kind as enum ('bug', 'question', 'topic');
exception when duplicate_object then null; end $$;

create table if not exists public.team_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind public.message_kind not null,
  section_id uuid references public.forum_sections (id) on delete set null,
  subject text not null default '',
  body text not null,
  page text not null default '',
  status text not null default 'new' check (status in ('new', 'handled')),
  handled_at timestamptz,
  handled_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists team_messages_status_idx on public.team_messages (status, created_at desc);

alter table public.team_messages enable row level security;
drop policy if exists "messages insert" on public.team_messages;
create policy "messages insert" on public.team_messages for insert
  with check (public.is_active() and user_id = auth.uid());
drop policy if exists "messages read" on public.team_messages;
create policy "messages read" on public.team_messages for select
  using (user_id = auth.uid() or public.is_admin());
drop policy if exists "messages admin update" on public.team_messages;
create policy "messages admin update" on public.team_messages for update
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists "messages admin delete" on public.team_messages;
create policy "messages admin delete" on public.team_messages for delete
  using (public.is_admin());

-- The launch-period bubble on the floating widget ("המעטפת בהרצה…") – the team can switch it off.
insert into public.settings (key, value) values ('launch_nudge', '{"enabled": true}'::jsonb)
  on conflict (key) do nothing;
