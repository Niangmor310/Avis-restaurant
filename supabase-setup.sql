-- À exécuter dans Supabase : Dashboard > SQL Editor > New query

-- 1. Table des avis
create table if not exists avis (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Anonyme',
  dish text,
  impression text not null,
  status text not null default 'pending' check (status in ('pending', 'approved')),
  created_at timestamptz not null default now()
);

-- 2. Activer la sécurité au niveau des lignes (RLS)
alter table avis enable row level security;

-- 3. Tout le monde peut déposer un avis (il part toujours en 'pending')
create policy "public_insert_avis"
  on avis for insert
  to anon
  with check (status = 'pending');

-- 4. Tout le monde peut voir les avis approuvés
create policy "public_select_approved"
  on avis for select
  to anon
  using (status = 'approved');

-- 5. Seul un utilisateur connecté (le propriétaire) peut tout voir
create policy "owner_select_all"
  on avis for select
  to authenticated
  using (true);

-- 6. Seul un utilisateur connecté peut approuver / modifier
create policy "owner_update"
  on avis for update
  to authenticated
  using (true)
  with check (true);

-- 7. Seul un utilisateur connecté peut supprimer
create policy "owner_delete"
  on avis for delete
  to authenticated
  using (true);

-- Ensuite : Dashboard > Authentication > Users > "Add user"
-- Créez UN compte (email + mot de passe) pour le propriétaire du restaurant.
-- C'est ce compte qui servira à se connecter à l'espace propriétaire du site.
