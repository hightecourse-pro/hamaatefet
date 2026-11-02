-- One button per section for the members, matching the section's purpose (the owner, 2/11 night):
--   thread    – «דיון חדש» (title + body)
--   help_ask  – a help thread as «מבקשת» only
--   question  – a question to the team (team inbox + mail), e.g. «שאלה לרוחמה»
--   request   – a proposal/request to the team, e.g. «הצעה למדור חדש» (own field labels)
--   none      – only the team writes
-- The team always gets «דיון חדש». post_mode stays the RLS switch and is derived from the action.
alter table public.forum_sections
  add column if not exists member_action text not null default 'request',
  add column if not exists action_label text not null default '',
  add column if not exists action_field1 text not null default '',
  add column if not exists action_field2 text not null default '';
alter table public.forum_sections add constraint forum_sections_member_action_check
  check (member_action in ('thread', 'help_ask', 'question', 'request', 'none'));

update public.forum_sections set
  member_action = case
    when ask_label <> '' then 'question'
    when post_mode = 'members' and key = 'help' then 'help_ask'
    when post_mode = 'members' then 'thread'
    else 'request' end,
  action_label = case when ask_label <> '' then ask_label else new_label end;
update public.forum_sections
  set post_mode = case when member_action in ('thread', 'help_ask') then 'members' else 'team' end;
-- The owner's wording for the content section's proposal button.
update public.forum_sections
  set action_label = 'הצעה למדור חדש', action_field1 = 'שם המדור', action_field2 = 'מה יהיה בו'
  where key = 'content' and member_action = 'request' and action_label = '';

alter table public.forum_sections drop column ask_label, drop column new_label;
