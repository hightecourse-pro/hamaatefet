-- Per-section house rules / "what this section is about" (the owner, 2/11):
-- shown in the forum's «כללי הבית» fold when the section is selected; empty = the general rules from site_content.
alter table public.forum_sections add column if not exists rules text not null default '';
