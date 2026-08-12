create table if not exists public.test_payment_orders (
  order_id text primary key,
  amount bigint not null check (amount > 0 and amount <= 100000000),
  order_name text not null,
  recipient text not null,
  phone text not null,
  address text not null,
  items jsonb not null default '[]'::jsonb,
  status text not null default 'READY' check (status in ('READY', 'DONE', 'FAILED')),
  payment_key text unique,
  payment_method text,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.test_payment_orders enable row level security;
revoke all on table public.test_payment_orders from anon, authenticated;

comment on table public.test_payment_orders is 'Toss Payments SDK v2 test-mode orders; accessed only by the payment Edge Function.';
