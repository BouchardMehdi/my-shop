-- Jalon 3: personal reads, atomic checkout and historical prices.
alter table public.order_items
  add column unit_price numeric(12, 2) not null default 0 check (unit_price >= 0),
  add column product_name text not null default '';

update public.order_items i
set unit_price = p.price, product_name = p.name
from public.products p where p.id = i.product_id;

create policy "read own orders" on public.orders
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "insert own orders" on public.orders
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "read own order items" on public.order_items
  for select to authenticated using (
    exists (select 1 from public.orders o where o.id = order_id and o.user_id = (select auth.uid()))
  );
create policy "insert own order items" on public.order_items
  for insert to authenticated with check (
    exists (select 1 from public.orders o where o.id = order_id and o.user_id = (select auth.uid()))
  );

-- Client table writes stay revoked: only this narrow RPC can create orders.
-- Identity, status and prices never come from browser-supplied fields.
create function public.place_order(p_items jsonb) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  v_order uuid;
  v_line jsonb;
  v_product public.products%rowtype;
  v_quantity integer;
  v_total numeric := 0;
begin
  if v_user is null then
    raise exception 'Connectez-vous pour passer commande.' using errcode = '42501';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' then
    raise exception 'Panier invalide.' using errcode = '22023';
  end if;
  if jsonb_array_length(p_items) < 1 or jsonb_array_length(p_items) > 100 then
    raise exception 'Le panier doit contenir entre 1 et 100 produits.' using errcode = '22023';
  end if;
  if exists (
    select 1 from jsonb_array_elements(p_items) x
    where jsonb_typeof(x) <> 'object'
      or jsonb_typeof(x->'product_id') is distinct from 'string'
      or jsonb_typeof(x->'quantity') is distinct from 'number'
      or coalesce(x->>'quantity', '') !~ '^[1-9][0-9]?$'
  ) then
    raise exception 'Chaque quantité doit être un entier entre 1 et 99.' using errcode = '22023';
  end if;
  if (select count(distinct (x->>'product_id')::uuid) from jsonb_array_elements(p_items) x)
     <> jsonb_array_length(p_items) then
    raise exception 'Un produit ne peut apparaître qu’une fois dans le panier.' using errcode = '22023';
  end if;

  insert into public.orders (user_id, customer_email)
  values (v_user, auth.jwt()->>'email') returning id into v_order;

  -- A stable lock order also makes concurrent catalogue edits predictable.
  for v_line in select value from jsonb_array_elements(p_items) order by value->>'product_id' loop
    select * into v_product from public.products
    where id = (v_line->>'product_id')::uuid for share;
    if not found then
      raise exception 'Un produit du panier n’existe plus.' using errcode = '22023';
    end if;
    if not v_product.in_stock then
      raise exception 'Le produit % est épuisé.', v_product.name using errcode = '22023';
    end if;
    v_quantity := (v_line->>'quantity')::integer;
    insert into public.order_items (order_id, product_id, quantity, unit_price, product_name)
    values (v_order, v_product.id, v_quantity, v_product.price, v_product.name);
    v_total := v_total + v_product.price * v_quantity;
  end loop;

  update public.orders set total = v_total where id = v_order;
  return v_order;
end;
$$;

revoke all on function public.place_order(jsonb) from public, anon, authenticated;
grant execute on function public.place_order(jsonb) to authenticated;
