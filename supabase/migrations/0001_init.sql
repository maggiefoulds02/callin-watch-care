-- Callin Watch Care — initial schema
-- Run against a real Supabase project via the SQL Editor, or `supabase db push`
-- once the project is linked. See plan doc section "Data model".

-- ============================================================================
-- Extensions
-- ============================================================================
create extension if not exists "pgcrypto"; -- gen_random_uuid()

-- ============================================================================
-- Enums
-- ============================================================================
create type user_role as enum ('owner', 'customer');

create type job_status as enum (
  'received', 'diagnosis', 'quote', 'in_repair',
  'quality_check', 'ready_for_collection', 'collected',
  'on_hold', 'cancelled'
);

create type invoice_status as enum ('draft', 'sent', 'paid', 'overdue', 'void');

-- ============================================================================
-- profiles — one row per authenticated user (owner or customer)
-- ============================================================================
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role user_role not null default 'customer',
  full_name text,
  email text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- Helper: is_owner() — used throughout RLS policies below. Must come after
-- `profiles` exists: `language sql` function bodies are parsed at creation
-- time (unlike plpgsql, which mostly defers), so this errors if it's
-- declared before the table it queries.
-- security definer so it can read `profiles` even under a caller whose own
-- SELECT on profiles is otherwise restricted by RLS.
-- ============================================================================
create or replace function is_owner()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'owner'
  );
$$;

-- Auto-create a profile row whenever a new auth user is created (e.g. when
-- a customer accepts their portal invite). Defaults to 'customer' — the
-- owner's own profile is promoted to 'owner' manually once, in Supabase's
-- SQL editor, right after the owner's own account is created.
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================================================
-- customers — decoupled from auth: the owner can create a customer record
-- (e.g. from a phone booking) before that person ever logs in.
-- ============================================================================
create table customers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles (id) on delete set null,
  full_name text not null,
  email text,
  phone text,
  address text,
  notes text, -- owner-only
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index customers_user_id_idx on customers (user_id);

-- ============================================================================
-- jobs — one watch in service
-- ============================================================================
create sequence job_number_seq;

create table jobs (
  id uuid primary key default gen_random_uuid(),
  job_number text not null unique default (
    'CWC-' || to_char(now(), 'YYYY') || '-' ||
    lpad(nextval('job_number_seq')::text, 4, '0')
  ),
  customer_id uuid not null references customers (id) on delete restrict,
  watch_brand text,
  watch_model text,
  watch_serial_number text,
  watch_description text,
  service_type text,
  current_status job_status not null default 'received',
  intake_notes text,
  estimated_completion_date date,
  created_by uuid references profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index jobs_customer_id_idx on jobs (customer_id);
create index jobs_current_status_idx on jobs (current_status);

-- ============================================================================
-- job_status_events — the timeline. `internal_note` is owner-only; customers
-- read this table only through the `customer_job_timeline` view below, which
-- omits that column entirely.
-- ============================================================================
create table job_status_events (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references jobs (id) on delete cascade,
  status job_status not null,
  note text,
  internal_note text,
  occurred_at timestamptz not null default now(),
  created_by uuid references profiles (id)
);

create index job_status_events_job_id_idx on job_status_events (job_id);

create view customer_job_timeline as
  select id, job_id, status, note, occurred_at, created_by
  from job_status_events;

-- Keep jobs.current_status in sync with the latest timeline event.
create or replace function sync_job_current_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update jobs set current_status = new.status, updated_at = now()
  where id = new.job_id;
  return new;
end;
$$;

create trigger on_job_status_event_insert
  after insert on job_status_events
  for each row execute function sync_job_current_status();

-- ============================================================================
-- job_photos
-- ============================================================================
create table job_photos (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references jobs (id) on delete cascade,
  status_event_id uuid references job_status_events (id) on delete set null,
  storage_path text not null,
  caption text,
  is_visible_to_customer boolean not null default true,
  created_by uuid references profiles (id),
  created_at timestamptz not null default now()
);

create index job_photos_job_id_idx on job_photos (job_id);

-- ============================================================================
-- business_settings — single row, owner-editable
-- ============================================================================
create table business_settings (
  id int primary key default 1,
  default_host_split_percentage numeric(5, 2) not null default 30.00,
  host_jeweller_name text,
  constraint business_settings_single_row check (id = 1)
);

insert into business_settings (id) values (1);

-- ============================================================================
-- finance_entries — the revenue-split ledger. Owner-only, no customer
-- access at all (no RLS policy is granted to customers below — default deny).
-- ============================================================================
create table finance_entries (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references jobs (id) on delete set null,
  description text,
  gross_amount numeric(10, 2) not null check (gross_amount >= 0),
  host_split_percentage numeric(5, 2) not null check (
    host_split_percentage >= 0 and host_split_percentage <= 100
  ),
  host_amount numeric(10, 2) generated always as (
    round(gross_amount * host_split_percentage / 100, 2)
  ) stored,
  cwc_amount numeric(10, 2) generated always as (
    gross_amount - round(gross_amount * host_split_percentage / 100, 2)
  ) stored,
  transaction_date date not null default current_date,
  payment_method text,
  created_by uuid references profiles (id),
  created_at timestamptz not null default now()
);

create index finance_entries_transaction_date_idx on finance_entries (transaction_date);
create index finance_entries_job_id_idx on finance_entries (job_id);

-- ============================================================================
-- invoices + invoice_line_items
-- ============================================================================
create sequence invoice_number_seq;

create table invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text not null unique default (
    'INV-' || to_char(now(), 'YYYY') || '-' ||
    lpad(nextval('invoice_number_seq')::text, 4, '0')
  ),
  job_id uuid references jobs (id) on delete set null,
  customer_id uuid not null references customers (id) on delete restrict,
  issue_date date not null default current_date,
  due_date date,
  status invoice_status not null default 'draft',
  subtotal numeric(10, 2) not null default 0,
  tax_rate numeric(5, 2) not null default 0,
  tax_amount numeric(10, 2) not null default 0,
  total numeric(10, 2) not null default 0,
  notes text,
  terms text,
  paid_at timestamptz,
  payment_method text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index invoices_customer_id_idx on invoices (customer_id);

create table invoice_line_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references invoices (id) on delete cascade,
  description text not null,
  quantity numeric(10, 2) not null default 1,
  unit_price numeric(10, 2) not null default 0,
  line_total numeric(10, 2) generated always as (quantity * unit_price) stored,
  sort_order int not null default 0
);

create index invoice_line_items_invoice_id_idx on invoice_line_items (invoice_id);

-- Recalculate invoice.subtotal/tax_amount/total whenever its line items change.
create or replace function recalc_invoice_totals()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_invoice_id uuid := coalesce(new.invoice_id, old.invoice_id);
  new_subtotal numeric(10, 2);
  invoice_tax_rate numeric(5, 2);
begin
  select coalesce(sum(line_total), 0) into new_subtotal
  from invoice_line_items where invoice_id = target_invoice_id;

  select tax_rate into invoice_tax_rate from invoices where id = target_invoice_id;

  update invoices
  set subtotal = new_subtotal,
      tax_amount = round(new_subtotal * invoice_tax_rate / 100, 2),
      total = new_subtotal + round(new_subtotal * invoice_tax_rate / 100, 2),
      updated_at = now()
  where id = target_invoice_id;

  return null;
end;
$$;

create trigger on_invoice_line_item_change
  after insert or update or delete on invoice_line_items
  for each row execute function recalc_invoice_totals();

-- ============================================================================
-- contact_messages — public contact form
-- ============================================================================
create table contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  message text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- Row-Level Security
-- ============================================================================
alter table profiles enable row level security;
alter table customers enable row level security;
alter table jobs enable row level security;
alter table job_status_events enable row level security;
alter table job_photos enable row level security;
alter table business_settings enable row level security;
alter table finance_entries enable row level security;
alter table invoices enable row level security;
alter table invoice_line_items enable row level security;
alter table contact_messages enable row level security;

-- profiles: read own row; owner reads all.
create policy "profiles_select_own_or_owner" on profiles
  for select using (id = auth.uid() or is_owner());
create policy "profiles_update_own" on profiles
  for update using (id = auth.uid());
create policy "profiles_all_owner" on profiles
  for all using (is_owner()) with check (is_owner());

-- customers: owner full access; customer reads their own linked row.
create policy "customers_all_owner" on customers
  for all using (is_owner()) with check (is_owner());
create policy "customers_select_own" on customers
  for select using (user_id = auth.uid());

-- jobs: owner full access; customer reads their own jobs.
create policy "jobs_all_owner" on jobs
  for all using (is_owner()) with check (is_owner());
create policy "jobs_select_own" on jobs
  for select using (
    customer_id in (select id from customers where user_id = auth.uid())
  );

-- job_status_events: owner full access; customers do NOT get a policy on
-- the base table (internal_note must stay hidden) — they read through the
-- customer_job_timeline view instead, which runs with the view owner's
-- privileges via security_invoker = false (Postgres default for views).
create policy "job_status_events_all_owner" on job_status_events
  for all using (is_owner()) with check (is_owner());

-- job_photos: owner full access; customer reads visible photos on their own jobs.
create policy "job_photos_all_owner" on job_photos
  for all using (is_owner()) with check (is_owner());
create policy "job_photos_select_own" on job_photos
  for select using (
    is_visible_to_customer
    and job_id in (
      select j.id from jobs j
      join customers c on c.id = j.customer_id
      where c.user_id = auth.uid()
    )
  );

-- business_settings: owner only.
create policy "business_settings_all_owner" on business_settings
  for all using (is_owner()) with check (is_owner());

-- finance_entries: owner only — deliberately no customer-facing policy at all.
create policy "finance_entries_all_owner" on finance_entries
  for all using (is_owner()) with check (is_owner());

-- invoices / invoice_line_items: owner full access; customer reads their own.
create policy "invoices_all_owner" on invoices
  for all using (is_owner()) with check (is_owner());
create policy "invoices_select_own" on invoices
  for select using (
    customer_id in (select id from customers where user_id = auth.uid())
  );
create policy "invoice_line_items_all_owner" on invoice_line_items
  for all using (is_owner()) with check (is_owner());
create policy "invoice_line_items_select_own" on invoice_line_items
  for select using (
    invoice_id in (
      select i.id from invoices i
      join customers c on c.id = i.customer_id
      where c.user_id = auth.uid()
    )
  );

-- contact_messages: anyone can submit; only the owner can read/manage.
create policy "contact_messages_insert_public" on contact_messages
  for insert with check (true);
create policy "contact_messages_all_owner" on contact_messages
  for all using (is_owner()) with check (is_owner());

-- ============================================================================
-- Storage bucket for job photos (private — served via signed URLs the
-- owner/customer's own RLS-checked query generates, never a public bucket).
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('job-photos', 'job-photos', false)
on conflict (id) do nothing;

create policy "job_photos_storage_owner" on storage.objects
  for all using (bucket_id = 'job-photos' and is_owner())
  with check (bucket_id = 'job-photos' and is_owner());

-- Customers can read (only) photos that are attached to one of their own
-- jobs AND flagged is_visible_to_customer — joined through job_photos
-- rather than parsed out of the storage path, so the storage layer's
-- authorization can never drift from the job_photos table's own rules.
create policy "job_photos_storage_select_own" on storage.objects
  for select using (
    bucket_id = 'job-photos'
    and exists (
      select 1 from job_photos jp
      join jobs j on j.id = jp.job_id
      join customers c on c.id = j.customer_id
      where jp.storage_path = storage.objects.name
        and jp.is_visible_to_customer = true
        and c.user_id = auth.uid()
    )
  );

-- ============================================================================
-- One-time manual step (do this once, in the Supabase SQL editor, right
-- after the owner signs up through the app's own /login → magic link once
-- Phase 2 adds an invite flow — or via Supabase Auth's dashboard):
--
--   update profiles set role = 'owner' where email = 'owner@example.com';
-- ============================================================================
