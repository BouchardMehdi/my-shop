-- Run with psql as postgres against the local database. Every fixture is rolled back.
\set ON_ERROR_STOP on
begin;
insert into public.orders (id, customer_email) values
  ('00000000-0000-4000-8000-000000000001', 'fixture@example.com');
insert into public.order_items (order_id, product_id, quantity)
select '00000000-0000-4000-8000-000000000001', id, 1
from public.products where slug = 'lampe-aria';

do $$ begin
  begin
    insert into public.products (slug, name, price, image_url) values ('invalid', 'Invalid', -1, '/invalid.webp');
    raise exception 'Negative price unexpectedly accepted';
  exception when check_violation then null;
  end;
  begin
    insert into public.order_items (order_id, product_id, quantity)
    select '00000000-0000-4000-8000-000000000001', id, 0 from public.products limit 1;
    raise exception 'Zero quantity unexpectedly accepted';
  exception when check_violation then null;
  end;
end $$;

set local role anon;
do $$ begin
  if (select count(*) from public.products) <> 6 then raise exception 'Public catalogue is unavailable'; end if;
  if exists(select from public.orders) or exists(select from public.order_items) then raise exception 'Private orders exposed to anon'; end if;
  begin
    insert into public.products (slug, name, price, image_url) values ('forbidden', 'Forbidden', 1, '/test.webp');
    raise exception 'Anonymous write unexpectedly accepted';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;

set local role authenticated;
do $$ begin
  if exists(select from public.orders) or exists(select from public.order_items) then raise exception 'Orders exposed before user policies'; end if;
  begin
    insert into public.orders default values;
    raise exception 'Authenticated write unexpectedly accepted';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;
rollback;
\echo 'Jalon 1: catalogue, privacy, write restrictions and constraints passed.'
