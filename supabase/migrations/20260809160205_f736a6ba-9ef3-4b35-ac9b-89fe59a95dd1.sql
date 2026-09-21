create table public.business_identities (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  display_name text,
  headline text,
  job_title text,
  company_name text,
  bio text,
  avatar_url text,
  primary_email text,
  primary_phone text,
  website text,
  linkedin_url text,
  address text,
  city text,
  country_code text,
  preferred_locale text,
  status text not null default 'active' check (status in ('active','disabled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_user_id)
);
grant select, insert, update, delete on public.business_identities to authenticated;
grant all on public.business_identities to service_role;
alter table public.business_identities enable row level security;
create policy "identity_owner_select" on public.business_identities for select to authenticated using (auth.uid() = owner_user_id);
create policy "identity_owner_insert" on public.business_identities for insert to authenticated with check (auth.uid() = owner_user_id);
create policy "identity_owner_update" on public.business_identities for update to authenticated using (auth.uid() = owner_user_id) with check (auth.uid() = owner_user_id);
create policy "identity_owner_delete" on public.business_identities for delete to authenticated using (auth.uid() = owner_user_id);

create table public.identity_field_visibility (
  identity_id uuid not null references public.business_identities(id) on delete cascade,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  field_key text not null check (field_key in ('display_name','headline','job_title','company_name','bio','avatar','primary_email','primary_phone','website','linkedin_url','address','city')),
  visibility text not null check (visibility in ('PRIVATE','SHARED')),
  updated_at timestamptz not null default now(),
  primary key (identity_id, field_key)
);
grant select, insert, update, delete on public.identity_field_visibility to authenticated;
grant all on public.identity_field_visibility to service_role;
alter table public.identity_field_visibility enable row level security;
create policy "visibility_owner_select" on public.identity_field_visibility for select to authenticated using (auth.uid() = owner_user_id);
create policy "visibility_owner_insert" on public.identity_field_visibility for insert to authenticated with check (auth.uid() = owner_user_id);
create policy "visibility_owner_update" on public.identity_field_visibility for update to authenticated using (auth.uid() = owner_user_id) with check (auth.uid() = owner_user_id);
create policy "visibility_owner_delete" on public.identity_field_visibility for delete to authenticated using (auth.uid() = owner_user_id);

create table public.identity_share_links (
  id uuid primary key default gen_random_uuid(),
  identity_id uuid not null references public.business_identities(id) on delete cascade,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  public_token text not null unique check (public_token ~ '^[a-f0-9]{64}$'),
  status text not null default 'active' check (status in ('active','revoked')),
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  rotated_at timestamptz,
  last_used_at timestamptz
);
grant select, insert, update, delete on public.identity_share_links to authenticated;
grant all on public.identity_share_links to service_role;
alter table public.identity_share_links enable row level security;
create policy "share_link_owner_select" on public.identity_share_links for select to authenticated using (auth.uid() = owner_user_id);
create policy "share_link_owner_insert" on public.identity_share_links for insert to authenticated with check (auth.uid() = owner_user_id);
create policy "share_link_owner_update" on public.identity_share_links for update to authenticated using (auth.uid() = owner_user_id) with check (auth.uid() = owner_user_id);
create policy "share_link_owner_delete" on public.identity_share_links for delete to authenticated using (auth.uid() = owner_user_id);

create or replace function public.bc5a_touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger business_identities_touch_updated_at
  before update on public.business_identities
  for each row execute function public.bc5a_touch_updated_at();

create trigger identity_field_visibility_touch_updated_at
  before update on public.identity_field_visibility
  for each row execute function public.bc5a_touch_updated_at();