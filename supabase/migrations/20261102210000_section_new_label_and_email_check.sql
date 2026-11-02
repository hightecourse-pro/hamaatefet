-- (1) Each section may word its own «דיון חדש» button (e.g. «אני רוצה לשאול…»); the
--     button now lives inside the section only. (2) «שכחתי סיסמה» tells a woman plainly
--     when no account carries that address (a closed community – enumeration is no concern).

alter table public.forum_sections add column if not exists new_label text not null default '';

create or replace function public.email_registered(e text) returns boolean
language sql stable security definer set search_path = public, auth as $$
  select exists (select 1 from auth.users u where lower(u.email) = lower(trim(e)));
$$;
revoke all on function public.email_registered(text) from public, anon, authenticated;
grant execute on function public.email_registered(text) to service_role;
