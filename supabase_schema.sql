-- ═══════════════════════════════════════════════════════════════
-- SHIFT SCHEDULE — Supabase SQL Schema v2
-- Run this entire file in Supabase → SQL Editor → New query
-- ═══════════════════════════════════════════════════════════════

-- Drop existing tables if re-running (safe for fresh setup)
drop table if exists shift_swaps     cascade;
drop table if exists app_settings    cascade;
drop table if exists notifications   cascade;
drop table if exists reset_requests  cascade;
drop table if exists leave_requests  cascade;
drop table if exists attendance      cascade;
drop table if exists schedule        cascade;
drop table if exists passwords       cascade;
drop table if exists members         cascade;
drop table if exists businesses      cascade;

-- ── BUSINESSES ────────────────────────────────────────────────
create table businesses (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  code       text not null unique,
  created_at timestamptz default now()
);

-- ── MEMBERS ───────────────────────────────────────────────────
create table members (
  id             uuid primary key default gen_random_uuid(),
  business_id    uuid references businesses(id) on delete cascade,
  name           text not null,
  username       text not null,
  role           text not null check (role in ('superadmin','manager','staff')),
  is_admin       boolean default false,
  shift          text default 'Varies',
  expected_hours integer default 48,
  color          text default '#6c8cff',
  bg             text default 'rgba(108,140,255,0.12)',
  created_at     timestamptz default now()
);

-- ── PASSWORDS ─────────────────────────────────────────────────
create table passwords (
  member_id uuid primary key references members(id) on delete cascade,
  password  text not null
);

-- ── SCHEDULE ──────────────────────────────────────────────────
create table schedule (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid references businesses(id) on delete cascade,
  week_start   date not null,
  employee_idx integer not null,
  day_idx      integer not null,
  shift_label  text,
  shift_start  text,
  shift_end    text,
  updated_at   timestamptz default now(),
  unique(business_id, week_start, employee_idx, day_idx)
);

-- ── ATTENDANCE ────────────────────────────────────────────────
create table attendance (
  id            uuid primary key default gen_random_uuid(),
  business_id   uuid references businesses(id) on delete cascade,
  member_id     uuid references members(id) on delete cascade,
  date          date not null,
  clock_in      timestamptz,
  clock_out     timestamptz,
  clock_in_raw  text,
  clock_out_raw text,
  location      text,
  created_at    timestamptz default now(),
  unique(business_id, member_id, date)
);

-- ── LEAVE REQUESTS ────────────────────────────────────────────
create table leave_requests (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade,
  member_id   uuid references members(id) on delete cascade,
  member_name text,
  type        text default 'personal',
  date        date,
  reason      text,
  status      text default 'pending',
  created_at  timestamptz default now()
);

-- ── RESET REQUESTS ────────────────────────────────────────────
create table reset_requests (
  id                 uuid primary key default gen_random_uuid(),
  business_id        uuid references businesses(id) on delete cascade,
  member_name        text,
  reason             text,
  status             text default 'pending',
  is_manager_request boolean default false,
  created_at         timestamptz default now()
);

-- ── NOTIFICATIONS ─────────────────────────────────────────────
create table notifications (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade,
  recipient   text,
  sent_by     text,
  message     text,
  type        text default 'info',
  read_by     jsonb default '{}',
  created_at  timestamptz default now()
);

-- ── APP SETTINGS ──────────────────────────────────────────────
create table app_settings (
  key   text primary key,
  value text
);

-- ── SHIFT SWAPS ───────────────────────────────────────────────
create table shift_swaps (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade,
  requester   text,
  target      text,
  date        date,
  reason      text,
  status      text default 'pending',
  created_at  timestamptz default now()
);

-- ═══════════════════════════════════════════════════════════════
-- DISABLE RLS — we use service_role key server-side only
-- This is safe because the anon/publishable key never touches Supabase directly
-- All requests go through our Vercel API routes which use service_role
-- ═══════════════════════════════════════════════════════════════
alter table businesses     disable row level security;
alter table members        disable row level security;
alter table passwords      disable row level security;
alter table schedule       disable row level security;
alter table attendance     disable row level security;
alter table leave_requests disable row level security;
alter table reset_requests disable row level security;
alter table notifications  disable row level security;
alter table app_settings   disable row level security;
alter table shift_swaps    disable row level security;

-- ═══════════════════════════════════════════════════════════════
-- SEED: Thunder super-admin
-- ═══════════════════════════════════════════════════════════════
insert into members (name, username, role, is_admin, business_id)
values ('Thunder', 'thunder', 'superadmin', true, null);

insert into passwords (member_id, password)
select id, 'Thunder@SuperAdmin77' from members where username = 'thunder';
