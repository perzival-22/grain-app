-- Run this in Supabase SQL editor AFTER 001_initial.sql.
-- Also go to Supabase → Authentication → URL Configuration and
-- add your Replit deployment URL to the Redirect URLs list.

-- Add user_id column to rolls table
alter table rolls add column if not exists
  user_id text not null default '';

-- Backfill existing rows (dev/test data)
update rolls set user_id = '' where user_id = '';

-- Enable Row Level Security on both tables
alter table rolls enable row level security;
alter table frames enable row level security;

-- Rolls: users can only see and edit their own rows
create policy "Users can manage their own rolls"
  on rolls for all
  using (auth.uid()::text = user_id)
  with check (auth.uid()::text = user_id);

-- Frames: accessible if the parent roll belongs to the user
create policy "Users can manage frames on their own rolls"
  on frames for all
  using (
    exists (
      select 1 from rolls
      where rolls.id = frames.roll_id
      and auth.uid()::text = rolls.user_id
    )
  );
