-- Local only: every user, product, order and temporary grant is rolled back.
\set ON_ERROR_STOP on
begin;
insert into auth.users (id, email) values
  ('a0000000-0000-4000-8000-000000000003', 'fixture-a@example.test'),
  ('b0000000-0000-4000-8000-000000000003', 'fixture-b@example.test');
insert into public.products (id, slug, name, price, image_url, in_stock) values
  ('c0000000-0000-4000-8000-000000000003', 'fixture-j3-a', 'Fixture A', 19.90, '/test.webp', true),
  ('d0000000-0000-4000-8000-000000000003', 'fixture-j3-b', 'Fixture B', 5.05, '/test.webp', true),
  ('e0000000-0000-4000-8000-000000000003', 'fixture-j3-out', 'Fixture Out', 10, '/test.webp', false);

set local role anon;
do $$ begin
  if exists(select from public.orders) or exists(select from public.order_items) then raise exception 'Anonymous private read'; end if;
  begin
    perform public.place_order('[]');
    raise exception 'Anonymous checkout accepted';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;

select set_config('request.jwt.claims', '{"sub":"a0000000-0000-4000-8000-000000000003","email":"fixture-a@example.test","role":"authenticated"}', true);
set local role authenticated;
select set_config('test.order_id', public.place_order('[{"product_id":"c0000000-0000-4000-8000-000000000003","quantity":2},{"product_id":"d0000000-0000-4000-8000-000000000003","quantity":3}]')::text, true);
do $$
declare bad jsonb;
begin
  if (select count(*) from public.orders) <> 1 then raise exception 'Own order not visible'; end if;
  if not exists(select from public.orders where total = 54.95 and status = 'pending' and user_id = auth.uid() and customer_email = 'fixture-a@example.test') then
    raise exception 'Wrong owner, total, email or status';
  end if;
  if (select count(*) from public.order_items) <> 2 then raise exception 'Missing items'; end if;
  foreach bad in array array[
    'null'::jsonb, '{}'::jsonb, '[]'::jsonb,
    '[{"product_id":"c0000000-0000-4000-8000-000000000003","quantity":0}]'::jsonb,
    '[{"product_id":"c0000000-0000-4000-8000-000000000003","quantity":-1}]'::jsonb,
    '[{"product_id":"c0000000-0000-4000-8000-000000000003","quantity":1.5}]'::jsonb,
    '[{"product_id":"c0000000-0000-4000-8000-000000000003","quantity":100}]'::jsonb,
    '[{"product_id":"c0000000-0000-4000-8000-000000000003","quantity":"1"}]'::jsonb,
    '[{"product_id":"c0000000-0000-4000-8000-000000000003","quantity":1},{"product_id":"c0000000-0000-4000-8000-000000000003","quantity":1}]'::jsonb,
    '[{"product_id":"e0000000-0000-4000-8000-000000000003","quantity":1}]'::jsonb,
    -- Failure after a valid line must roll back the header and the first line.
    '[{"product_id":"c0000000-0000-4000-8000-000000000003","quantity":1},{"product_id":"f0000000-0000-4000-8000-000000000003","quantity":1}]'::jsonb
  ] loop
    begin
      perform public.place_order(bad);
      raise exception 'Invalid basket accepted: %', bad;
    exception when invalid_parameter_value then null;
    end;
  end loop;
  if (select count(*) from public.orders) <> 1 or (select count(*) from public.order_items) <> 2 then
    raise exception 'Failed checkout left partial writes';
  end if;
  begin
    insert into public.orders(user_id, total, status) values(auth.uid(), 0, 'paid');
    raise exception 'Direct price/status injection accepted';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.orders set status = 'paid';
    raise exception 'Client status update accepted';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;

update public.products set name = 'Changed', price = 999 where id = 'c0000000-0000-4000-8000-000000000003';
select set_config('request.jwt.claims', '{"sub":"b0000000-0000-4000-8000-000000000003","email":"fixture-b@example.test","role":"authenticated"}', true);
set local role authenticated;
do $$ begin
  if exists(select from public.orders) or exists(select from public.order_items) then raise exception 'B can read A data'; end if;
  if exists(select from public.orders where id = current_setting('test.order_id')::uuid) then raise exception 'Known UUID bypasses RLS'; end if;
  perform public.place_order('[{"product_id":"d0000000-0000-4000-8000-000000000003","quantity":1}]');
  if (select count(*) from public.orders) <> 1 or (select count(*) from public.order_items) <> 1 then raise exception 'B own checkout failed'; end if;
end $$;
reset role;

-- Exercise INSERT policies independently of the normal RPC-only privilege gate.
grant insert on public.orders, public.order_items to authenticated;
set local role authenticated;
do $$ begin
  begin
    insert into public.orders(user_id) values('a0000000-0000-4000-8000-000000000003');
    raise exception 'B can insert an order as A';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.order_items(order_id, product_id, quantity)
    values(current_setting('test.order_id')::uuid, 'c0000000-0000-4000-8000-000000000003', 1);
    raise exception 'B can append to A order';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;

select set_config('request.jwt.claims', '{"sub":"a0000000-0000-4000-8000-000000000003","role":"authenticated"}', true);
set local role authenticated;
do $$ begin
  if (select count(*) from public.orders) <> 1 then raise exception 'A can see B order'; end if;
  if not exists(select from public.order_items where product_name = 'Fixture A' and unit_price = 19.90) then
    raise exception 'Historical price/name changed';
  end if;
end $$;
reset role;
rollback;
\echo 'Jalon 3: atomic checkout, totals, historical prices and A/B/anonymous isolation passed.'
