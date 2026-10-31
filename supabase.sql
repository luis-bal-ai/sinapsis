-- Sinapsis: tabla para guardar los datos de cada usuaria.
-- Pégalo entero en Supabase → SQL Editor → New query → Run.

create table if not exists public.sinapsis (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  datos      jsonb  not null,
  updated_at bigint not null default 0
);

-- Cada persona solo puede ver y cambiar su propia fila.
alter table public.sinapsis enable row level security;

drop policy if exists "ver lo mío"      on public.sinapsis;
drop policy if exists "crear lo mío"    on public.sinapsis;
drop policy if exists "cambiar lo mío"  on public.sinapsis;

create policy "ver lo mío"     on public.sinapsis for select using (auth.uid() = user_id);
create policy "crear lo mío"   on public.sinapsis for insert with check (auth.uid() = user_id);
create policy "cambiar lo mío" on public.sinapsis for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Cambios en directo entre el móvil y el ordenador.
alter publication supabase_realtime add table public.sinapsis;
