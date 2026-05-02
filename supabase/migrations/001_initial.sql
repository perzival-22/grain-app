-- Run this SQL in the Supabase dashboard SQL editor to set up the database.
-- Then add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to Replit Secrets.

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- Rolls table
create table if not exists rolls (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  film_stock text not null default '',
  camera text not null default '',
  iso integer not null default 400,
  push_pull integer not null default 0,
  frames_shot integer not null default 0,
  frame_count integer not null default 36,
  status text not null default 'in_camera',
  notes text not null default '',
  started_at timestamptz,
  finished_at timestamptz
);

-- Frames table
create table if not exists frames (
  id uuid primary key default gen_random_uuid(),
  roll_id uuid not null references rolls(id) on delete cascade,
  frame_number integer not null,
  note text not null default '',
  shot_at timestamptz not null default now(),
  unique(roll_id, frame_number)
);

-- Indexes
create index if not exists rolls_status_idx on rolls(status);
create index if not exists rolls_created_at_idx on rolls(created_at desc);
create index if not exists frames_roll_id_idx on frames(roll_id);
