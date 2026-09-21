-- BC-Mobile-2E — Meeting Moment canonical domain

create table public.business_relationship_moments (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null,
  target_kind text not null check (target_kind in ('connection', 'saved_card')),
  target_user_id uuid,
  target_card_id uuid,
  occurred_at timestamptz not null,
  event_name text,
  place_label text,
  note text,
  status text not null default 'pending' check (status in ('pending', 'active')),
  client_token uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint brm_target_xor check (
    (target_kind = 'connection' and target_user_id is not null and target_card_id is null)
    or (target_kind = 'saved_card' and target_card_id is not null and target_user_id is null)
  ),
  constraint brm_event_name_len check (event_name is null or char_length(event_name) <= 120),
  constraint brm_place_label_len check (place_label is null or char_length(place_label) <= 120),
  constraint brm_note_len check (note is null or char_length(note) <= 1000)
);

create unique index brm_owner_client_token_key
  on public.business_relationship_moments (owner_user_id, client_token);
create index brm_connection_journey_idx
  on public.business_relationship_moments (owner_user_id, target_user_id, occurred_at desc)
  where target_user_id is not null;
create index brm_saved_card_journey_idx
  on public.business_relationship_moments (owner_user_id, target_card_id, occurred_at desc)
  where target_card_id is not null;

grant select, insert, update, delete on public.business_relationship_moments to authenticated;
grant all on public.business_relationship_moments to service_role;

alter table public.business_relationship_moments enable row level security;

create policy "brm_owner_select" on public.business_relationship_moments
  for select to authenticated using (owner_user_id = auth.uid());
create policy "brm_owner_insert" on public.business_relationship_moments
  for insert to authenticated with check (owner_user_id = auth.uid());
create policy "brm_owner_update" on public.business_relationship_moments
  for update to authenticated using (owner_user_id = auth.uid()) with check (owner_user_id = auth.uid());
create policy "brm_owner_delete" on public.business_relationship_moments
  for delete to authenticated using (owner_user_id = auth.uid());

create table public.business_relationship_moment_media (
  id uuid primary key default gen_random_uuid(),
  moment_id uuid not null references public.business_relationship_moments(id) on delete cascade,
  owner_user_id uuid not null,
  storage_path text not null,
  media_type text not null check (media_type in ('image/jpeg', 'image/png', 'image/webp')),
  sort_order smallint not null default 0 check (sort_order between 0 and 4),
  width integer check (width is null or width > 0),
  height integer check (height is null or height > 0),
  byte_size integer check (byte_size is null or byte_size > 0),
  created_at timestamptz not null default now(),
  constraint brm_media_moment_sort_key unique (moment_id, sort_order)
);

create index brm_media_moment_idx on public.business_relationship_moment_media (moment_id, sort_order);

grant select, insert, update, delete on public.business_relationship_moment_media to authenticated;
grant all on public.business_relationship_moment_media to service_role;

alter table public.business_relationship_moment_media enable row level security;

create policy "brm_media_owner_select" on public.business_relationship_moment_media
  for select to authenticated using (
    owner_user_id = auth.uid()
    and exists (
      select 1 from public.business_relationship_moments m
      where m.id = moment_id and m.owner_user_id = auth.uid()
    )
  );
create policy "brm_media_owner_insert" on public.business_relationship_moment_media
  for insert to authenticated with check (
    owner_user_id = auth.uid()
    and exists (
      select 1 from public.business_relationship_moments m
      where m.id = moment_id and m.owner_user_id = auth.uid()
    )
  );
create policy "brm_media_owner_update" on public.business_relationship_moment_media
  for update to authenticated using (
    owner_user_id = auth.uid()
    and exists (
      select 1 from public.business_relationship_moments m
      where m.id = moment_id and m.owner_user_id = auth.uid()
    )
  ) with check (owner_user_id = auth.uid());
create policy "brm_media_owner_delete" on public.business_relationship_moment_media
  for delete to authenticated using (
    owner_user_id = auth.uid()
    and exists (
      select 1 from public.business_relationship_moments m
      where m.id = moment_id and m.owner_user_id = auth.uid()
    )
  );

-- Relationship authorization, enforced at the database layer as defense in
-- depth: even a hand-crafted write with a stolen owner token cannot attach a
-- Moment to an arbitrary identity.
create or replace function public.brm_validate_moment_target()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if NEW.target_kind = 'connection' then
    if not exists (
      select 1 from public.user_connections
      where status = 'accepted'
        and pair_user_low = least(NEW.owner_user_id, NEW.target_user_id)
        and pair_user_high = greatest(NEW.owner_user_id, NEW.target_user_id)
    ) then
      raise exception 'MOMENT_RELATIONSHIP_NOT_AUTHORIZED';
    end if;
  else
    if not exists (
      select 1 from public.saved_business_cards
      where owner_user_id = NEW.owner_user_id
        and target_card_id = NEW.target_card_id
        and archived = false
    ) then
      raise exception 'MOMENT_RELATIONSHIP_NOT_AUTHORIZED';
    end if;
  end if;
  return NEW;
end
$$;

revoke all on function public.brm_validate_moment_target() from public, anon, authenticated;

create trigger brm_validate_target
  before insert or update of owner_user_id, target_kind, target_user_id, target_card_id
  on public.business_relationship_moments
  for each row execute function public.brm_validate_moment_target();

create or replace function public.brm_touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  NEW.updated_at = now();
  return NEW;
end
$$;

revoke all on function public.brm_touch_updated_at() from public, anon, authenticated;

create trigger brm_touch_updated_at
  before update on public.business_relationship_moments
  for each row execute function public.brm_touch_updated_at();

-- Private photo storage, owner-isolated: the first path segment must be the
-- caller's own user id, so cross-user reads/writes/overwrites and path
-- traversal into another owner's folder are rejected.
create policy "brm_storage_owner_select" on storage.objects
  for select to authenticated using (
    bucket_id = 'relationship-moments'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "brm_storage_owner_insert" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'relationship-moments'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "brm_storage_owner_update" on storage.objects
  for update to authenticated using (
    bucket_id = 'relationship-moments'
    and (storage.foldername(name))[1] = auth.uid()::text
  ) with check (
    bucket_id = 'relationship-moments'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "brm_storage_owner_delete" on storage.objects
  for delete to authenticated using (
    bucket_id = 'relationship-moments'
    and (storage.foldername(name))[1] = auth.uid()::text
  );