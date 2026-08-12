create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 80),
  phone text not null default '' check (char_length(phone) <= 30),
  marketing_consent boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.addresses (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null default '기본 배송지' check (char_length(label) between 1 and 40),
  recipient text not null check (char_length(recipient) between 1 and 80),
  phone text not null check (char_length(phone) between 1 and 30),
  zonecode text not null check (char_length(zonecode) between 5 and 10),
  address text not null check (char_length(address) between 1 and 300),
  extra text not null default '',
  detail text not null check (char_length(detail) between 1 and 200),
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index addresses_user_id_idx on public.addresses (user_id);
create unique index addresses_one_default_per_user_idx on public.addresses (user_id) where is_default;

alter table public.profiles enable row level security;
alter table public.addresses enable row level security;

revoke all on table public.profiles from anon;
revoke all on table public.addresses from anon;
revoke all on sequence public.addresses_id_seq from anon;

grant select, insert, update on table public.profiles to authenticated;
grant select, insert, update, delete on table public.addresses to authenticated;
grant usage, select on sequence public.addresses_id_seq to authenticated;

grant select, insert, update, delete on table public.profiles to service_role;
grant select, insert, update, delete on table public.addresses to service_role;
grant usage, select on sequence public.addresses_id_seq to service_role;

create policy profiles_select_own on public.profiles for select to authenticated using ((select auth.uid()) = user_id);
create policy profiles_insert_own on public.profiles for insert to authenticated with check ((select auth.uid()) = user_id);
create policy profiles_update_own on public.profiles for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy addresses_select_own on public.addresses for select to authenticated using ((select auth.uid()) = user_id);
create policy addresses_insert_own on public.addresses for insert to authenticated with check ((select auth.uid()) = user_id);
create policy addresses_update_own on public.addresses for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy addresses_delete_own on public.addresses for delete to authenticated using ((select auth.uid()) = user_id);
