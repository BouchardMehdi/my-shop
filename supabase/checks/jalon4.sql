-- Local only: all fixtures and promotions are rolled back.
\set ON_ERROR_STOP on
begin;
insert into auth.users (id, email, raw_user_meta_data) values
  ('a0000000-0000-4000-8000-000000000004', 'fixture-j4-a@example.test', '{"role":"admin"}'),
  ('b0000000-0000-4000-8000-000000000004', 'fixture-j4-b@example.test', '{}'),
  ('c0000000-0000-4000-8000-000000000004', 'fixture-j4-admin@example.test', '{}');
do $$ begin
  if (select count(*) from public.profiles where id in (
    'a0000000-0000-4000-8000-000000000004', 'b0000000-0000-4000-8000-000000000004', 'c0000000-0000-4000-8000-000000000004'
  ) and role = 'user') <> 3 then raise exception 'Default profile or metadata isolation failed'; end if;
end $$;
update public.profiles set role = 'admin' where id = 'c0000000-0000-4000-8000-000000000004';
update auth.users set email = 'fixture-j4-admin-updated@example.test' where id = 'c0000000-0000-4000-8000-000000000004';
do $$ begin
  if not exists(select from public.profiles where id = 'c0000000-0000-4000-8000-000000000004' and role = 'admin' and email = 'fixture-j4-admin-updated@example.test') then
    raise exception 'Email sync lost admin role';
  end if;
end $$;
insert into public.products(id, slug, name, price, image_url) values
  ('d0000000-0000-4000-8000-000000000004', 'fixture-j4-purchased', 'Fixture J4', 12.50, '/test.webp');

select set_config('request.jwt.claims', '{"sub":"a0000000-0000-4000-8000-000000000004","email":"fixture-j4-a@example.test","role":"authenticated"}', true);
set local role authenticated;
select public.place_order('[{"product_id":"d0000000-0000-4000-8000-000000000004","quantity":2}]');
do $$
declare changed integer;
begin
  if (select count(*) from public.profiles) <> 1 or not exists(select from public.profiles where role = 'user') then raise exception 'Profile privacy failed'; end if;
  begin
    update public.profiles set role = 'admin' where id = auth.uid();
    raise exception 'Self promotion accepted';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.profiles(id, role) values(auth.uid(), 'admin');
    raise exception 'Profile injection accepted';
  exception when insufficient_privilege then null;
  end;
  begin
    delete from public.profiles where id = auth.uid();
    raise exception 'Profile deletion accepted';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.products(slug, name, price, image_url) values('forged-j4', 'Forged', 1, '/test.webp');
    raise exception 'Non-admin product insert accepted';
  exception when insufficient_privilege then null;
  end;
  update public.products set price = 0 where id = 'd0000000-0000-4000-8000-000000000004';
  get diagnostics changed = row_count;
  if changed <> 0 then raise exception 'Non-admin update accepted'; end if;
  delete from public.products where id = 'd0000000-0000-4000-8000-000000000004';
  get diagnostics changed = row_count;
  if changed <> 0 then raise exception 'Non-admin delete accepted'; end if;
  if not exists(select from public.products where id = 'd0000000-0000-4000-8000-000000000004' and price = 12.50) then raise exception 'Public catalogue changed'; end if;
end $$;
reset role;

select set_config('request.jwt.claims', '{"sub":"b0000000-0000-4000-8000-000000000004","email":"fixture-j4-b@example.test","role":"authenticated"}', true);
set local role authenticated;
do $$ begin
  if exists(select from public.orders) or exists(select from public.order_items) then raise exception 'Non-admin reads other orders'; end if;
  perform public.place_order('[{"product_id":"d0000000-0000-4000-8000-000000000004","quantity":1}]');
end $$;
reset role;

select set_config('request.jwt.claims', '{"sub":"c0000000-0000-4000-8000-000000000004","role":"authenticated"}', true);
set local role authenticated;
do $$
declare changed integer;
begin
  if (select count(*) from public.orders where user_id in ('a0000000-0000-4000-8000-000000000004','b0000000-0000-4000-8000-000000000004')) <> 2 then raise exception 'Admin cannot read all orders'; end if;
  if (select count(*) from public.order_items where product_id = 'd0000000-0000-4000-8000-000000000004') <> 2 then raise exception 'Admin cannot read all items'; end if;
  insert into public.products(id, slug, name, price, image_url) values('e0000000-0000-4000-8000-000000000004', 'fixture-j4-crud', 'CRUD', 2, '/test.webp');
  update public.products set price = 3 where id = 'e0000000-0000-4000-8000-000000000004';
  get diagnostics changed = row_count;
  if changed <> 1 or not exists(select from public.products where id = 'e0000000-0000-4000-8000-000000000004' and price = 3) then raise exception 'Admin update failed'; end if;
  delete from public.products where id = 'e0000000-0000-4000-8000-000000000004';
  get diagnostics changed = row_count;
  if changed <> 1 then raise exception 'Admin delete failed'; end if;
  begin
    delete from public.products where id = 'd0000000-0000-4000-8000-000000000004';
    raise exception 'Purchased product deletion accepted';
  exception when foreign_key_violation then null;
  end;
  begin
    update public.profiles set role = 'admin' where id = 'a0000000-0000-4000-8000-000000000004';
    raise exception 'Client admin can alter roles';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.orders set status = 'paid';
    raise exception 'Order update unexpectedly granted';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;

-- Revocation is effective in the database even with the same Auth JWT.
update public.profiles set role = 'user' where id = 'c0000000-0000-4000-8000-000000000004';
set local role authenticated;
do $$ begin
  if exists(select from public.orders) then raise exception 'Revoked admin still reads all orders'; end if;
  begin
    insert into public.products(slug, name, price, image_url) values('revoked-j4', 'Revoked', 1, '/test.webp');
    raise exception 'Revoked admin can write';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;

set local role anon;
do $$ begin
  if not exists(select from public.products where slug = 'fixture-j4-purchased') then raise exception 'Anonymous catalogue unavailable'; end if;
  if exists(select from public.orders) or exists(select from public.order_items) then raise exception 'Anonymous private read'; end if;
  begin
    select role from public.profiles;
    raise exception 'Anonymous profiles exposed';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.products(slug, name, price, image_url) values('anonymous-j4', 'Anonymous', 1, '/test.webp');
    raise exception 'Anonymous product insert accepted';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;
rollback;
\echo 'Jalon 4: profiles, anti-escalation, admin CRUD, order isolation and revocation passed.'
