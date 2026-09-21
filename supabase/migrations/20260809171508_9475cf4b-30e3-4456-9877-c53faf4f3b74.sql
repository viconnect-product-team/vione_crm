-- BC-Mobile-5C — NFC tag registry for the Business Digital Identity.
-- NFC remains a pure TRANSPORT: a tag carries only the opaque share URL.
-- This table is a management registry (which physical tags did the owner
-- program), NOT a new identity domain. STALE is derived at read time from
-- the linked share link's status (rotation makes tags stale automatically).

create table public.identity_nfc_tags (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  identity_id uuid not null references public.business_identities(id) on delete cascade,
  share_link_id uuid not null references public.identity_share_links(id) on delete cascade,
  label text,
  status text not null default 'active' check (status in ('active', 'revoked')),
  written_at timestamptz not null default now(),
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index identity_nfc_tags_owner_idx on public.identity_nfc_tags (owner_user_id, created_at desc);

grant select, insert, update on public.identity_nfc_tags to authenticated;
grant all on public.identity_nfc_tags to service_role;

alter table public.identity_nfc_tags enable row level security;

create policy "Owners can read their own NFC tags"
  on public.identity_nfc_tags for select to authenticated
  using (owner_user_id = auth.uid());

create policy "Owners can register their own NFC tags"
  on public.identity_nfc_tags for insert to authenticated
  with check (owner_user_id = auth.uid());

create policy "Owners can update their own NFC tags"
  on public.identity_nfc_tags for update to authenticated
  using (owner_user_id = auth.uid())
  with check (owner_user_id = auth.uid());