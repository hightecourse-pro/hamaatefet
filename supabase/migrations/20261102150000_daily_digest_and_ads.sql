-- Daily digest e-mail (per-member opt-out + team switch) and the advertisement slot
-- (ads table + a public bucket the team uploads to from /admin/ads).

alter table public.profiles add column if not exists daily_digest boolean not null default true;

insert into public.settings (key, value) values ('digest', '{"enabled": true}'::jsonb)
on conflict (key) do nothing;

create table if not exists public.ads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  image_path text not null,
  link_url text not null default '',
  active boolean not null default true,
  clicks integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger ads_touch before update on public.ads
  for each row execute function public.touch_updated_at();

alter table public.ads enable row level security;
create policy "ads read" on public.ads for select using (public.is_active() or public.is_admin());
create policy "ads admin" on public.ads for all using (public.is_admin()) with check (public.is_admin());

-- One click on the slot: counted, and the advertiser's link handed back (the /ad/<id> route).
create or replace function public.ad_click(aid uuid) returns text
language sql volatile security definer set search_path = public as $$
  update public.ads set clicks = clicks + 1 where id = aid and active returning link_url;
$$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('ads', 'ads', true, 2097152, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do nothing;
create policy "ads images read" on storage.objects for select using (bucket_id = 'ads');
