-- Space Memory Palace · Supabase schema (schemaVersion 1).
--
-- Apply this in the Supabase SQL editor before wiring the app to Supabase.
-- The TypeScript client expects the exact column names and types below.

create extension if not exists "pgcrypto";

create table if not exists spaces (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  scene_url text,
  scene_type text default 'splat',
  cover_url text,
  template text default 'personal_knowledge',
  visibility text default 'private',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists cards (
  id uuid primary key default gen_random_uuid(),
  space_id uuid references spaces(id) on delete cascade,
  title text not null,
  type text default 'note',
  content text,
  ai_summary text,
  tags jsonb default '[]',
  media_urls jsonb default '[]',
  external_links jsonb default '[]',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists hotspots (
  id uuid primary key default gen_random_uuid(),
  space_id uuid references spaces(id) on delete cascade,
  card_id uuid references cards(id) on delete set null,
  title text not null,
  summary text,
  position_x double precision not null,
  position_y double precision not null,
  position_z double precision not null,
  color text default '#ffffff',
  icon text default 'dot',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes for the read patterns we expect.
create index if not exists spaces_updated_at_idx on spaces (updated_at desc);
create index if not exists cards_space_id_idx on cards (space_id);
create index if not exists hotspots_space_id_idx on hotspots (space_id);

-- Auto-bump updated_at on row changes.
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists spaces_set_updated_at on spaces;
create trigger spaces_set_updated_at
  before update on spaces
  for each row execute function set_updated_at();

drop trigger if exists cards_set_updated_at on cards;
create trigger cards_set_updated_at
  before update on cards
  for each row execute function set_updated_at();

drop trigger if exists hotspots_set_updated_at on hotspots;
create trigger hotspots_set_updated_at
  before update on hotspots
  for each row execute function set_updated_at();

-- Anonymous read access for spaces whose visibility is "public" or "shared".
-- Writes always go through the service role or authenticated user with RLS.
alter table spaces enable row level security;
alter table cards enable row level security;
alter table hotspots enable row level security;

drop policy if exists "spaces read" on spaces;
create policy "spaces read" on spaces
  for select using (visibility in ('public', 'shared') or auth.role() = 'authenticated');

drop policy if exists "cards read" on cards;
create policy "cards read" on cards
  for select using (
    exists (
      select 1 from spaces s
      where s.id = cards.space_id
        and (s.visibility in ('public', 'shared') or auth.role() = 'authenticated')
    )
  );

drop policy if exists "hotspots read" on hotspots;
create policy "hotspots read" on hotspots
  for select using (
    exists (
      select 1 from spaces s
      where s.id = hotspots.space_id
        and (s.visibility in ('public', 'shared') or auth.role() = 'authenticated')
    )
  );

-- Writes: only authenticated users. Replace with a user_id column if/when
-- the app gets a real auth flow.
drop policy if exists "spaces write" on spaces;
create policy "spaces write" on spaces
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

drop policy if exists "cards write" on cards;
create policy "cards write" on cards
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

drop policy if exists "hotspots write" on hotspots;
create policy "hotspots write" on hotspots
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
