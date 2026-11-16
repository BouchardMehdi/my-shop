-- Jalon 4: roles belong to the database, never to editable Auth metadata.
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  role text not null default 'user' check (role in ('user', 'admin'))
);
alter table public.profiles enable row level security;
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;

create policy "read own profile" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);

insert into public.profiles (id, email) select id, email from auth.users;

create function public.sync_auth_profile() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, email, role) values (new.id, new.email, 'user')
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;
revoke all on function public.sync_auth_profile() from public, anon, authenticated;
create trigger sync_auth_profile
  after insert or update of email on auth.users
  for each row execute function public.sync_auth_profile();

grant insert, update, delete on public.products to authenticated;
create policy "admin manages products" on public.products
  for all to authenticated
  using (exists (
    select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'
  ))
  with check (exists (
    select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'
  ));

create policy "admin reads orders" on public.orders
  for select to authenticated using (exists (
    select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'
  ));
create policy "admin reads order items" on public.order_items
  for select to authenticated using (exists (
    select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'
  ));

-- Promoting one specific account is an environment operation, not a shared
-- migration. Clients (including admins) cannot write their own profile/role.
