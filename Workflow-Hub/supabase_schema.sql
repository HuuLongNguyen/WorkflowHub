-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Departments Table
create table if not exists departments (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  created_at timestamp with time zone default now()
);

-- Roles Table
create table if not exists roles (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  created_at timestamp with time zone default now()
);

-- Users Table (Profiles)
create table if not exists profiles (
  id uuid primary key default uuid_generate_v4(),
  display_name text,
  email text unique,
  department_id uuid references departments(id),
  role_ids uuid[] default '{}',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Processes Table
create table if not exists processes (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  version integer default 1,
  stages jsonb not null default '[]',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Forms Table
create table if not exists forms (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  version integer default 1,
  process_id uuid references processes(id),
  sections jsonb not null default '[]',
  fields_by_id jsonb not null default '{}',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Tasks Table
create table if not exists tasks (
  id uuid primary key default uuid_generate_v4(),
  form_id uuid references forms(id),
  process_id uuid references processes(id),
  requester_user_id uuid, -- Simplified for demo
  current_stage_key text not null,
  status text not null,
  resolved_approvers_by_stage jsonb not null default '{}',
  approvals jsonb not null default '[]',
  data jsonb not null default '{}',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable Row Level Security
alter table departments enable row level security;
alter table roles enable row level security;
alter table profiles enable row level security;
alter table processes enable row level security;
alter table forms enable row level security;
alter table tasks enable row level security;

-- Simple Policies (Allow public for demo - WARNING: Not for production)
create policy "Public all on departments" on departments for all using (true);
create policy "Public all on roles" on roles for all using (true);
create policy "Public all on profiles" on profiles for all using (true);
create policy "Public all on processes" on processes for all using (true);
create policy "Public all on forms" on forms for all using (true);
create policy "Public all on tasks" on tasks for all using (true);
