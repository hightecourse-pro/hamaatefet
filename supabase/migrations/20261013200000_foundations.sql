-- המעטפת – foundations: members, forum, events, hosting proposals.
-- Applied to every environment through tools/apply-migrations.mjs. Never edited after it ran.

create extension if not exists "pgcrypto";

-- ───────────────────────── enums ─────────────────────────
create type public.member_role as enum ('member', 'admin');
create type public.member_status as enum ('pending', 'active', 'paused');
create type public.post_status as enum ('pending', 'published', 'hidden');
create type public.help_kind as enum ('asking', 'offering');
create type public.event_type as enum ('general', 'millionaire', 'birthday');
create type public.proposal_kind as enum ('talent', 'insight', 'story', 'other');
create type public.proposal_status as enum ('new', 'scheduled', 'declined');

-- ───────────────────────── admin allowlist ─────────────────────────
-- A sign-up with one of these addresses becomes an active admin immediately.
create table public.admin_emails (
  email text primary key,
  created_at timestamptz not null default now()
);
insert into public.admin_emails (email) values
  ('bv.briut@gmail.com'),
  ('kehilatit.bv@gmail.com'),
  ('saraavi.ezra@gmail.com');

-- ───────────────────────── members ─────────────────────────
-- birth_month: Hebrew month, Tishrei-first: 1 תשרי … 6 אדר (both Adars) … 12 אלול.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  first_name text not null default '',
  last_name text not null default '',
  phone text not null default '',
  birth_month smallint check (birth_month between 1 and 12),
  over_30_confirmed boolean not null default false,
  terms_accepted_at timestamptz,
  role public.member_role not null default 'member',
  status public.member_status not null default 'pending',
  remind_birthday boolean not null default true,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index profiles_status_idx on public.profiles (status);
create index profiles_birth_month_idx on public.profiles (birth_month);

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.is_active() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and status = 'active');
$$;

create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

-- New auth user → profile row (details come from the sign-up metadata).
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  admin_mail boolean := exists (select 1 from public.admin_emails where lower(email) = lower(new.email));
  bm int := nullif(meta->>'birth_month', '')::int;
begin
  insert into public.profiles (id, email, first_name, last_name, phone, birth_month, over_30_confirmed, terms_accepted_at, role, status, approved_at)
  values (
    new.id,
    new.email,
    coalesce(meta->>'first_name', ''),
    coalesce(meta->>'last_name', ''),
    coalesce(meta->>'phone', ''),
    case when bm between 1 and 12 then bm else null end,
    coalesce((meta->>'over_30')::boolean, false),
    case when coalesce((meta->>'terms')::boolean, false) then now() else null end,
    case when admin_mail then 'admin'::public.member_role else 'member'::public.member_role end,
    case when admin_mail then 'active'::public.member_status else 'pending'::public.member_status end,
    case when admin_mail then now() else null end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.handle_user_email_change() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.email is distinct from old.email then
    update public.profiles set email = new.email where id = new.id;
  end if;
  return new;
end;
$$;

create trigger on_auth_user_email_changed after update of email on auth.users
  for each row execute function public.handle_user_email_change();

-- Members may edit their details, never their role, status or approval.
create or replace function public.profiles_guard() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    new.role := old.role;
    new.status := old.status;
    new.approved_at := old.approved_at;
    new.email := old.email;
  end if;
  return new;
end;
$$;

create trigger profiles_guard before update on public.profiles
  for each row execute function public.profiles_guard();

-- Names other members may see (posts, hosts). Runs as owner, gated on the viewer.
create view public.member_directory with (security_invoker = false) as
  select id, first_name, last_name, birth_month, status, role
  from public.profiles
  where public.is_active() or public.is_admin();

-- ───────────────────────── settings ─────────────────────────
create table public.settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
insert into public.settings (key, value) values ('forum_moderation', '{"enabled": false}'::jsonb);

-- ───────────────────────── forum ─────────────────────────
create table public.forum_sections (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  description text not null default '',
  color text not null default '#4A1942',
  tint text not null default '#F1E2EE',
  icon text not null default '',
  is_new boolean not null default true,
  visible boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

insert into public.forum_sections (key, name, description, color, tint, icon, sort_order) values
  ('content', 'תכנים', 'מאמרים, סרטונים והשראה שנאספו בשבילך', '#4A1942', '#F1E2EE', 'M2 4h7a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H2zM22 4h-7a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h8z', 1),
  ('bts', 'מאחורי הקלעים', 'הצצה להכנות, לצוות ולרגעים שלא רואים במפגש', '#A3304A', '#FBE1E4', 'M3 8a2 2 0 0 1 2-2h2l2-2h6l2 2h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', 2),
  ('help', 'עזרה הדדית', 'מבקשת? מציעה? כאן נפגשות הידיים', '#9A4318', '#FCE7D6', 'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z', 3),
  ('talk', 'דיונים קבוצתיים', 'שאלות פתוחות, דעות, וכל מה שבוער', '#6E0F1A', '#F6DADC', 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z', 4);

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references public.forum_sections (id),
  author_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  body text not null,
  image_path text,
  help_kind public.help_kind,
  status public.post_status not null default 'published',
  pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index posts_feed_idx on public.posts (status, pinned desc, created_at desc);
create index posts_section_idx on public.posts (section_id);

create trigger posts_touch before update on public.posts
  for each row execute function public.touch_updated_at();

-- With moderation on, a member's new post waits for the team; admins publish straight away.
create or replace function public.posts_apply_moderation() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  moderated boolean := coalesce((select (value->>'enabled')::boolean from public.settings where key = 'forum_moderation'), false);
begin
  if auth.uid() is not null and not public.is_admin() then
    new.status := case when moderated then 'pending'::public.post_status else 'published'::public.post_status end;
    new.pinned := false;
  end if;
  return new;
end;
$$;

create trigger posts_moderation before insert on public.posts
  for each row execute function public.posts_apply_moderation();

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);
create index comments_post_idx on public.comments (post_id, created_at);

create table public.post_likes (
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

-- The feed as the member sees it: section + author + counters. Invoker rights,
-- so posts RLS applies; the author's name comes through member_directory.
create view public.post_feed with (security_invoker = true) as
  select
    p.id, p.section_id, p.author_id, p.title, p.body, p.image_path, p.help_kind, p.status, p.pinned, p.created_at,
    s.key as section_key, s.name as section_name, s.color as section_color, s.tint as section_tint,
    coalesce(m.first_name, '') as author_first_name,
    coalesce(m.last_name, '') as author_last_name,
    (select count(*) from public.post_likes l where l.post_id = p.id)::int as like_count,
    (select count(*) from public.comments c where c.post_id = p.id)::int as comment_count,
    exists (select 1 from public.post_likes l where l.post_id = p.id and l.user_id = auth.uid()) as liked_by_me
  from public.posts p
  join public.forum_sections s on s.id = p.section_id
  left join public.member_directory m on m.id = p.author_id;

-- ───────────────────────── events ─────────────────────────
create table public.events (
  id uuid primary key default gen_random_uuid(),
  type public.event_type not null default 'general',
  title text not null,
  description text not null default '',
  hebrew_month smallint check (hebrew_month between 1 and 12),
  hebrew_year int,
  event_date date,
  start_time time,
  end_time time,
  location text not null default '',
  price_ils int not null default 0,
  capacity int,
  topic text not null default '',
  host_name text not null default '',
  host_user_id uuid references public.profiles (id) on delete set null,
  kind public.proposal_kind,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index events_type_date_idx on public.events (type, event_date);
create unique index events_birthday_month_idx on public.events (hebrew_year, hebrew_month) where type = 'birthday';

create trigger events_touch before update on public.events
  for each row execute function public.touch_updated_at();

create table public.event_agenda (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  sort_order int not null default 0,
  time_label text not null default '',
  title text not null,
  body text not null default '',
  questions text[] not null default '{}'
);
create index event_agenda_event_idx on public.event_agenda (event_id, sort_order);

create table public.registrations (
  event_id uuid not null references public.events (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

create table public.topic_team (
  event_id uuid not null references public.events (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

create table public.hosting_proposals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind public.proposal_kind not null,
  display_name text not null default '',
  title text not null,
  description text not null default '',
  preferred_month text not null default '',
  needs text not null default '',
  status public.proposal_status not null default 'new',
  event_id uuid references public.events (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger hosting_proposals_touch before update on public.hosting_proposals
  for each row execute function public.touch_updated_at();

-- Counters members may see although they cannot read other members' rows.
create or replace function public.registration_count(eid uuid) returns int
language sql stable security definer set search_path = public as $$
  select count(*)::int from public.registrations where event_id = eid;
$$;

create or replace function public.topic_team_count(eid uuid) returns int
language sql stable security definer set search_path = public as $$
  select count(*)::int from public.topic_team where event_id = eid;
$$;

create or replace function public.birth_month_count(m int) returns int
language sql stable security definer set search_path = public as $$
  select count(*)::int from public.profiles where birth_month = m and status = 'active';
$$;

-- A registration must respect the event's capacity (checked at the door, not just in the UI).
create or replace function public.registrations_capacity_guard() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  cap int;
  taken int;
begin
  select capacity into cap from public.events where id = new.event_id;
  if cap is not null then
    select count(*) into taken from public.registrations where event_id = new.event_id;
    if taken >= cap then
      raise exception 'event_full' using errcode = 'P0001';
    end if;
  end if;
  return new;
end;
$$;

create trigger registrations_capacity before insert on public.registrations
  for each row execute function public.registrations_capacity_guard();

-- ───────────────────────── storage: forum images ─────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('forum-images', 'forum-images', false, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do nothing;

-- ───────────────────────── row level security ─────────────────────────
alter table public.admin_emails enable row level security;
alter table public.profiles enable row level security;
alter table public.settings enable row level security;
alter table public.forum_sections enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.post_likes enable row level security;
alter table public.events enable row level security;
alter table public.event_agenda enable row level security;
alter table public.registrations enable row level security;
alter table public.topic_team enable row level security;
alter table public.hosting_proposals enable row level security;

revoke all on public.admin_emails from anon, authenticated;

-- profiles: self, or the team.
create policy "profiles read" on public.profiles for select
  using (id = auth.uid() or public.is_admin());
create policy "profiles update" on public.profiles for update
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

-- settings: anyone signed in may read (the forum shows whether posts wait for approval); the team writes.
create policy "settings read" on public.settings for select using (auth.uid() is not null);
create policy "settings admin" on public.settings for all using (public.is_admin()) with check (public.is_admin());

-- forum
create policy "sections read" on public.forum_sections for select
  using (public.is_admin() or (public.is_active() and visible));
create policy "sections admin" on public.forum_sections for all
  using (public.is_admin()) with check (public.is_admin());

create policy "posts read" on public.posts for select
  using (public.is_admin() or (public.is_active() and (status = 'published' or author_id = auth.uid())));
create policy "posts insert" on public.posts for insert
  with check (public.is_active() and author_id = auth.uid());
create policy "posts delete own" on public.posts for delete
  using (author_id = auth.uid() or public.is_admin());
create policy "posts admin update" on public.posts for update
  using (public.is_admin()) with check (public.is_admin());

create policy "comments read" on public.comments for select
  using (public.is_admin() or (public.is_active() and exists (
    select 1 from public.posts p where p.id = post_id and (p.status = 'published' or p.author_id = auth.uid())
  )));
create policy "comments insert" on public.comments for insert
  with check (public.is_active() and author_id = auth.uid() and exists (
    select 1 from public.posts p where p.id = post_id and p.status = 'published'
  ));
create policy "comments delete" on public.comments for delete
  using (author_id = auth.uid() or public.is_admin());

create policy "likes read" on public.post_likes for select using (public.is_active() or public.is_admin());
create policy "likes insert" on public.post_likes for insert with check (public.is_active() and user_id = auth.uid());
create policy "likes delete" on public.post_likes for delete using (user_id = auth.uid());

-- events
create policy "events read" on public.events for select
  using (public.is_admin() or (public.is_active() and published));
create policy "events admin" on public.events for all
  using (public.is_admin()) with check (public.is_admin());

create policy "agenda read" on public.event_agenda for select using (public.is_active() or public.is_admin());
create policy "agenda admin" on public.event_agenda for all using (public.is_admin()) with check (public.is_admin());

create policy "registrations read" on public.registrations for select
  using (user_id = auth.uid() or public.is_admin());
create policy "registrations insert" on public.registrations for insert
  with check (public.is_active() and user_id = auth.uid() and exists (
    select 1 from public.events e where e.id = event_id and e.published
  ));
create policy "registrations delete" on public.registrations for delete
  using (user_id = auth.uid() or public.is_admin());

create policy "team read" on public.topic_team for select
  using (user_id = auth.uid() or public.is_admin());
create policy "team insert" on public.topic_team for insert
  with check (public.is_active() and user_id = auth.uid());
create policy "team delete" on public.topic_team for delete
  using (user_id = auth.uid() or public.is_admin());

create policy "proposals read" on public.hosting_proposals for select
  using (user_id = auth.uid() or public.is_admin());
create policy "proposals insert" on public.hosting_proposals for insert
  with check (public.is_active() and user_id = auth.uid());
create policy "proposals admin" on public.hosting_proposals for update
  using (public.is_admin()) with check (public.is_admin());
create policy "proposals admin delete" on public.hosting_proposals for delete
  using (public.is_admin());

-- storage: members upload under their own folder; every active member may view.
create policy "forum images read" on storage.objects for select
  using (bucket_id = 'forum-images' and (public.is_active() or public.is_admin()));
create policy "forum images insert" on storage.objects for insert
  with check (bucket_id = 'forum-images' and public.is_active() and (storage.foldername(name))[1] = auth.uid()::text);
create policy "forum images delete" on storage.objects for delete
  using (bucket_id = 'forum-images' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));

grant select on public.member_directory to authenticated;
grant select on public.post_feed to authenticated;

-- ───────────────────────── seed: known content ─────────────────────────
-- Opening meeting: יום רביעי ג׳ חשון תשפ״ז = 14.10.2026, 20:00–22:30.
insert into public.events (type, title, description, event_date, start_time, end_time, location, price_ils, hebrew_month, hebrew_year, published)
values ('general', 'מפגש פתיחה', 'הערב שבו הכול מתחיל – מכירות, טועמות ופותחות את המעטפת יחד.', date '2026-10-14', time '20:00', time '22:30', 'מינהל קהילתי בית וגן, רח׳ לויכטר 9', 30, 2, 5787, true);

-- The first monthly birthday meeting: Cheshvan 5787. Date and topic are set by the team.
with ev as (
  insert into public.events (type, title, hebrew_month, hebrew_year, published)
  values ('birthday', 'מסיבת חשון', 2, 5787, true)
  returning id
)
insert into public.event_agenda (event_id, sort_order, time_label, title, body, questions)
select id, 1, '', 'מתכנסות: עוגה, חטיפים ובלונים', 'מקבלות את בעלות השמחה – פינת צילום, ברכה קטנה בכניסה, ומה שמגישים.', '{}'::text[] from ev
union all
select id, 4, '', 'משאלות וברכות', 'סיום הערב – כל אחת מוסיפה משאלה למעטפה של בעלות השמחה.', '{}'::text[] from ev;
