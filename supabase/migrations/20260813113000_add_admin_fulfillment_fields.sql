alter table public.test_payment_orders
  add column if not exists fulfillment_status text not null default 'NEW'
    check (fulfillment_status in ('NEW', 'PREPARING', 'SHIPPED', 'DELIVERED', 'CANCELLED')),
  add column if not exists tracking_number text not null default '',
  add column if not exists admin_note text not null default '';

create index if not exists test_payment_orders_fulfillment_status_idx
  on public.test_payment_orders (fulfillment_status, created_at desc);

comment on column public.test_payment_orders.fulfillment_status is 'Admin-managed delivery workflow status.';
comment on column public.test_payment_orders.tracking_number is 'Carrier tracking number entered by an administrator.';
comment on column public.test_payment_orders.admin_note is 'Private fulfillment note visible only in the admin dashboard.';
