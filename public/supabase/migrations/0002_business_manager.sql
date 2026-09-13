-- Callin Watch Care — Business Manager revision
-- Supersedes the job/finance/invoice portions of 0001_init.sql with the
-- precise model from the client's "Business Manager" PRD (v1.0, July 2026):
-- job types + a 9-stage status pipeline, per-job income breakdown, a
-- Sweeping Hands profit split computed at payment time, expense tracking
-- with pot impact, the three-pot balance model, checklists, before/
-- during/after photos, and an activity log for the dashboard.
--
-- Safe to run as a straight replacement: no real business data exists yet
-- in the target project, only a test owner login. Run this in the
-- Supabase SQL editor AFTER 0001_init.sql.

-- ============================================================================
-- Drop what's being replaced (cascade takes views/policies/triggers with it)
-- ============================================================================
drop view if exists customer_job_timeline;
drop table if exists job_photos cascade;
drop table if exists job_status_events cascade;
drop table if exists invoice_line_items cascade;
drop table if exists invoices cascade;
drop table if exists finance_entries cascade;
drop table if exists jobs cascade;
drop sequence if exists job_number_seq;
drop sequence if exists invoice_number_seq;
drop type if exists job_status cascade;
drop type if exists invoice_status cascade;

-- ============================================================================
-- New enums
-- ============================================================================
create type job_type as enum (
  'client', 'trade', 'sweeping_hands', 'internal', 'warranty', 'insurance'
);

create type job_status as enum (
  'incoming', 'booked_in', 'assessment', 'waiting_approval', 'waiting_parts',
  'in_progress', 'quality_control', 'ready_collection', 'collected_complete',
  'on_hold', 'cancelled'
);

create type invoice_type as enum ('client', 'trade', 'sweeping_hands');

create type invoice_status as enum ('pending_review', 'sent', 'paid', 'overdue', 'void');

create type photo_stage as enum ('before', 'during', 'after');

create type client_type as enum ('retail', 'trade');

create type expense_category as enum (
  'parts_purchased', 'outsourced_servicing', 'tools_equipment',
  'sweeping_hands_withdrawal', 'personal_drawing_oliver', 'general_business',
  'rent_workshop', 'consumables', 'marketing', 'software_subscriptions',
  'insurance', 'training', 'fuel_travel', 'shipping', 'bank_fees'
);

-- ============================================================================
-- customers ("Client Database" in the PRD — kept as `customers` to match
-- the already-built customer portal/auth code, just with the fields the
-- PRD's client database calls for).
-- ============================================================================
alter table customers
  add column if not exists company_name text,
  add column if not exists client_type client_type not null default 'retail',
  add column if not exists vat_number text,
  add column if not exists payment_terms_days int not null default 30;

-- ============================================================================
-- business_settings — split percentages + one-time opening pot balances.
-- ============================================================================
alter table business_settings
  drop column if exists default_host_split_percentage,
  drop column if exists host_jeweller_name;

alter table business_settings
  add column if not exists trade_partner_name text not null default 'Sweeping Hands',
  add column if not exists sweeping_hands_polishing_pct numeric(5, 2) not null default 40.00,
  add column if not exists sweeping_hands_servicing_pct numeric(5, 2) not null default 40.00,
  -- One-time entry point for Oliver's real balances at go-live. Left at 0 —
  -- these are NOT filled with the example figures from the PRD, which were
  -- just illustrative; Oliver sets his actual numbers via Settings.
  add column if not exists opening_bank_balance numeric(10, 2) not null default 0,
  add column if not exists opening_sweeping_hands_balance numeric(10, 2) not null default 0,
  add column if not exists opening_balance_date date not null default current_date;

-- ============================================================================
-- jobs
-- ============================================================================
create sequence job_number_seq;

create table jobs (
  id uuid primary key default gen_random_uuid(),
  job_number text not null unique default (
    'CW-' || to_char(now(), 'YYYY') || '-' ||
    lpad(nextval('job_number_seq')::text, 5, '0')
  ),
  job_type job_type not null default 'client',
  -- Nullable: Internal/Warranty jobs, and some Sweeping Hands jobs, may not
  -- link to a row in the client database at all.
  customer_id uuid references customers (id) on delete set null,

  -- Watch details (PRD section 03)
  watch_brand text,
  watch_model text, -- "Model / Reference number"
  watch_serial_number text,
  watch_movement text, -- e.g. "Cal. 3135"
  watch_case_material text,
  watch_strap_bracelet text,
  customer_reference text, -- free-text client PO/reference, distinct from customer_id

  current_status job_status not null default 'incoming',

  -- Job financials (PRD section 03 "JOB FINANCIALS") — the source figures;
  -- invoices snapshot these onto invoice_job_links when generated.
  polishing_income numeric(10, 2) not null default 0 check (polishing_income >= 0),
  servicing_income numeric(10, 2) not null default 0 check (servicing_income >= 0),
  parts_income numeric(10, 2) not null default 0 check (parts_income >= 0),
  outsource_cost numeric(10, 2) not null default 0 check (outsource_cost >= 0),
  other_income numeric(10, 2) not null default 0 check (other_income >= 0),

  -- Admin
  date_received date not null default current_date,
  expected_return_date date,
  intake_notes text,

  -- Set true once a (non-trade) job is marked complete and its pending
  -- invoice has been auto-created, or once a trade job is picked up by a
  -- Trade Invoice Run — prevents duplicate invoice generation.
  invoiced boolean not null default false,

  created_by uuid references profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index jobs_customer_id_idx on jobs (customer_id);
create index jobs_current_status_idx on jobs (current_status);
create index jobs_job_type_idx on jobs (job_type);
create index jobs_invoiced_idx on jobs (invoiced);

-- ============================================================================
-- job_status_events — the timeline (internal_note stays owner-only, same
-- pattern as 0001_init.sql).
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

-- SECURITY NOTE: like all Postgres views, this runs with the view OWNER's
-- privileges by default (not the querying user's) — that's what lets it
-- read job_status_events at all despite that table having no
-- customer-facing RLS policy (deliberately, to keep internal_note hidden
-- from anyone querying the base table directly). Because of that owner
-- bypass, THIS VIEW is the only thing enforcing "a customer sees only
-- their own job's events" — the WHERE clause below is not optional.
create view customer_job_timeline as
  select id, job_id, status, note, occurred_at, created_by
  from job_status_events
  where is_owner() or job_id in (
    select j.id from jobs j
    join customers c on c.id = j.customer_id
    where c.user_id = auth.uid()
  );

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
-- job_photos — before/during/after, per PRD section 03 "PHOTOS".
-- ============================================================================
create table job_photos (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references jobs (id) on delete cascade,
  status_event_id uuid references job_status_events (id) on delete set null,
  stage photo_stage not null default 'during',
  storage_path text not null,
  caption text,
  is_visible_to_customer boolean not null default true,
  created_by uuid references profiles (id),
  created_at timestamptz not null default now()
);

create index job_photos_job_id_idx on job_photos (job_id);
create index job_photos_stage_idx on job_photos (stage);

-- ============================================================================
-- checklist_templates + job_checklist_items — customisable default QC
-- checklist (PRD section 03 "CHECKLIST"). Steps are copied onto each job at
-- creation so later template edits don't rewrite history.
-- ============================================================================
create table checklist_templates (
  id uuid primary key default gen_random_uuid(),
  step_key text not null unique,
  label text not null,
  sort_order int not null default 0,
  is_active boolean not null default true
);

insert into checklist_templates (step_key, label, sort_order) values
  ('photos_taken', 'Photos taken', 1),
  ('disassembly', 'Disassembly', 2),
  ('ultrasonic_clean', 'Ultrasonic clean', 3),
  ('inspection', 'Inspection', 4),
  ('lubrication', 'Lubrication', 5),
  ('timing_test', 'Timing test', 6),
  ('pressure_test', 'Pressure test', 7),
  ('case_restoration', 'Case restoration', 8),
  ('final_photography', 'Final photography', 9),
  ('client_sign_off', 'Client sign-off', 10);

create table job_checklist_items (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references jobs (id) on delete cascade,
  step_key text not null,
  label text not null,
  sort_order int not null default 0,
  is_complete boolean not null default false,
  completed_at timestamptz,
  completed_by uuid references profiles (id)
);

create index job_checklist_items_job_id_idx on job_checklist_items (job_id);

-- Seed a job's checklist from the active template rows at job creation.
create or replace function seed_job_checklist()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into job_checklist_items (job_id, step_key, label, sort_order)
  select new.id, step_key, label, sort_order
  from checklist_templates
  where is_active
  order by sort_order;
  return new;
end;
$$;

create trigger on_job_insert_seed_checklist
  after insert on jobs
  for each row execute function seed_job_checklist();

-- ============================================================================
-- invoices + invoice_job_links
--
-- One invoice can cover multiple jobs (the weekly Trade Invoice Run bundles
-- every completed job for a trade client into a single invoice). Each link
-- snapshots that job's income breakdown at generation time, so editing a
-- job later never silently changes a since-issued invoice. The unique
-- constraint on invoice_job_links.job_id is the enforcement mechanism for
-- the PRD's single most important rule here: "a job can only appear on one
-- invoice — once invoiced it must never reappear in the trade run."
-- ============================================================================
create sequence invoice_number_seq;

create table invoices (
  id uuid primary key default gen_random_uuid(),
  -- No year in the format, and overridable (e.g. importing old invoice
  -- numbers) — this is a plain default, not a forced generated value, so
  -- application code can pass an explicit invoice_number on insert.
  invoice_number text not null unique default (
    'CWC-' || lpad(nextval('invoice_number_seq')::text, 4, '0')
  ),
  invoice_type invoice_type not null default 'client',
  customer_id uuid references customers (id) on delete set null,
  issue_date date not null default current_date,
  due_date date,
  status invoice_status not null default 'pending_review',

  -- Aggregate breakdown — recalculated from invoice_job_links whenever its
  -- links change (recalc_invoice_totals below), same pattern 0001_init.sql
  -- used for invoice_line_items.
  polishing_total numeric(10, 2) not null default 0,
  servicing_total numeric(10, 2) not null default 0,
  parts_total numeric(10, 2) not null default 0,
  outsource_cost_total numeric(10, 2) not null default 0,
  other_total numeric(10, 2) not null default 0,
  total numeric(10, 2) not null default 0,

  -- Snapshotted at the moment status transitions to 'paid' (see
  -- recalc_invoice_shares_on_paid below) — historically accurate even if
  -- business_settings' split percentages change later.
  oliver_share_amount numeric(10, 2),
  sweeping_hands_share_amount numeric(10, 2),
  business_pot_amount numeric(10, 2),

  notes text,
  sent_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index invoices_customer_id_idx on invoices (customer_id);
create index invoices_status_idx on invoices (status);

create table invoice_job_links (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references invoices (id) on delete cascade,
  job_id uuid not null unique references jobs (id) on delete restrict,
  -- Snapshot of the job's financials at the moment it was added to this
  -- invoice.
  polishing_amount numeric(10, 2) not null default 0,
  servicing_amount numeric(10, 2) not null default 0,
  parts_amount numeric(10, 2) not null default 0,
  outsource_cost_amount numeric(10, 2) not null default 0,
  other_amount numeric(10, 2) not null default 0,
  line_total numeric(10, 2) generated always as (
    polishing_amount + servicing_amount + parts_amount
      - outsource_cost_amount + other_amount
  ) stored
);

create index invoice_job_links_invoice_id_idx on invoice_job_links (invoice_id);

create or replace function recalc_invoice_totals()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_invoice_id uuid := coalesce(new.invoice_id, old.invoice_id);
begin
  update invoices set
    polishing_total = coalesce((select sum(polishing_amount) from invoice_job_links where invoice_id = target_invoice_id), 0),
    servicing_total = coalesce((select sum(servicing_amount) from invoice_job_links where invoice_id = target_invoice_id), 0),
    parts_total = coalesce((select sum(parts_amount) from invoice_job_links where invoice_id = target_invoice_id), 0),
    outsource_cost_total = coalesce((select sum(outsource_cost_amount) from invoice_job_links where invoice_id = target_invoice_id), 0),
    other_total = coalesce((select sum(other_amount) from invoice_job_links where invoice_id = target_invoice_id), 0),
    total = coalesce((select sum(line_total) from invoice_job_links where invoice_id = target_invoice_id), 0),
    updated_at = now()
  where id = target_invoice_id;
  return null;
end;
$$;

create trigger on_invoice_job_link_change
  after insert or update or delete on invoice_job_links
  for each row execute function recalc_invoice_totals();

-- Mark linked jobs as invoiced whenever they're attached to an invoice, so
-- the Trade Invoice Run's dedup check (and the unique constraint above) is
-- backed by a fast, obvious flag on the job itself too.
create or replace function mark_job_invoiced()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update jobs set invoiced = true, updated_at = now() where id = new.job_id;
  return new;
end;
$$;

create trigger on_invoice_job_link_insert
  after insert on invoice_job_links
  for each row execute function mark_job_invoiced();

-- The 60/40 (etc.) split, computed and stored the moment an invoice is
-- marked Paid — "the most important logic in the entire system" per the
-- PRD, so it lives here rather than solely in application code.
-- Sweeping Hands share = pct% of polishing_total + pct% of NET servicing
-- (servicing_total minus outsource_cost_total, floored at 0). Everything
-- else (parts_total, other_total) is pure passthrough/Oliver's, per the
-- PRD's income-type table.
create or replace function recalc_invoice_shares_on_paid()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  sh_polishing_pct numeric(5, 2);
  sh_servicing_pct numeric(5, 2);
  net_servicing numeric(10, 2);
  sh_share numeric(10, 2);
begin
  if new.status = 'paid' and (old.status is distinct from 'paid') then
    select sweeping_hands_polishing_pct, sweeping_hands_servicing_pct
      into sh_polishing_pct, sh_servicing_pct
      from business_settings where id = 1;

    net_servicing := greatest(new.servicing_total - new.outsource_cost_total, 0);
    sh_share := round(new.polishing_total * sh_polishing_pct / 100, 2)
              + round(net_servicing * sh_servicing_pct / 100, 2);

    new.sweeping_hands_share_amount := sh_share;
    new.business_pot_amount := new.parts_total;
    new.oliver_share_amount := new.total - sh_share - new.parts_total;
    new.paid_at := now();
  end if;
  return new;
end;
$$;

create trigger on_invoice_paid
  before update on invoices
  for each row execute function recalc_invoice_shares_on_paid();

-- ============================================================================
-- expenses (PRD section 07)
-- ============================================================================
create table expenses (
  id uuid primary key default gen_random_uuid(),
  category expense_category not null,
  description text not null,
  expense_date date not null default current_date,
  net_amount numeric(10, 2) not null check (net_amount >= 0),
  supplier_name text,
  supplier_invoice_ref text,
  linked_job_id uuid references jobs (id) on delete set null,
  is_refund boolean not null default false,
  created_by uuid references profiles (id),
  created_at timestamptz not null default now()
);

create index expenses_expense_date_idx on expenses (expense_date);
create index expenses_category_idx on expenses (category);

-- ============================================================================
-- activity_log — powers the dashboard's running log.
-- ============================================================================
create table activity_log (
  id uuid primary key default gen_random_uuid(),
  event_type text not null, -- e.g. 'job_created', 'invoice_paid', 'expense_added'
  description text not null,
  related_table text,
  related_id uuid,
  created_by uuid references profiles (id),
  created_at timestamptz not null default now()
);

create index activity_log_created_at_idx on activity_log (created_at desc);

-- ============================================================================
-- pot_balances — the three pots (PRD section 08), computed live from paid
-- invoices' stored shares and expenses' category-based impact, on top of
-- the one-time opening balances in business_settings. Deliberately a view,
-- not a stored ledger: "not a complex accounting model."
-- ============================================================================
create view pot_balances as
with settings as (
  select opening_bank_balance, opening_sweeping_hands_balance from business_settings where id = 1
),
paid_invoices as (
  select
    coalesce(sum(total), 0) as total_collected,
    coalesce(sum(sweeping_hands_share_amount), 0) as sh_from_invoices
  from invoices where status = 'paid'
),
expense_impact as (
  select
    coalesce(sum(net_amount) filter (
      where not is_refund
    ), 0) - coalesce(sum(net_amount) filter (where is_refund), 0) as total_expenses,
    coalesce(sum(net_amount * 0.5) filter (
      where category = 'tools_equipment' and not is_refund
    ), 0) - coalesce(sum(net_amount * 0.5) filter (
      where category = 'tools_equipment' and is_refund
    ), 0) as sh_tools_share,
    coalesce(sum(net_amount) filter (
      where category = 'sweeping_hands_withdrawal' and not is_refund
    ), 0) - coalesce(sum(net_amount) filter (
      where category = 'sweeping_hands_withdrawal' and is_refund
    ), 0) as sh_withdrawals
  from expenses
)
select
  (settings.opening_bank_balance + paid_invoices.total_collected - expense_impact.total_expenses) as bank_balance,
  (settings.opening_sweeping_hands_balance + paid_invoices.sh_from_invoices
    - expense_impact.sh_tools_share - expense_impact.sh_withdrawals) as sweeping_hands_pot,
  (settings.opening_bank_balance + paid_invoices.total_collected - expense_impact.total_expenses)
    - (settings.opening_sweeping_hands_balance + paid_invoices.sh_from_invoices
        - expense_impact.sh_tools_share - expense_impact.sh_withdrawals) as available_to_oliver
from settings, paid_invoices, expense_impact
-- Same view-owner-bypass note as customer_job_timeline above: this is the
-- whole business's financials, so it must never return a row unless the
-- querying user is the owner. There's no natural row to scope this to
-- (it's a single aggregate row), so the filter is a flat is_owner() gate.
where is_owner();

-- ============================================================================
-- Row-Level Security — same owner-only pattern as 0001_init.sql. None of
-- the new tables get a customer-facing policy: the PRD's Business Manager
-- is explicitly single-user (Oliver only); the separate customer portal
-- never touches jobs' financials, invoices, expenses, checklist, or pots.
-- ============================================================================
alter table jobs enable row level security;
alter table job_status_events enable row level security;
alter table job_photos enable row level security;
alter table checklist_templates enable row level security;
alter table job_checklist_items enable row level security;
alter table invoices enable row level security;
alter table invoice_job_links enable row level security;
alter table expenses enable row level security;
alter table activity_log enable row level security;

create policy "jobs_all_owner" on jobs
  for all using (is_owner()) with check (is_owner());
create policy "jobs_select_own" on jobs
  for select using (
    customer_id in (select id from customers where user_id = auth.uid())
  );

create policy "job_status_events_all_owner" on job_status_events
  for all using (is_owner()) with check (is_owner());

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

create policy "checklist_templates_all_owner" on checklist_templates
  for all using (is_owner()) with check (is_owner());
create policy "job_checklist_items_all_owner" on job_checklist_items
  for all using (is_owner()) with check (is_owner());

create policy "invoices_all_owner" on invoices
  for all using (is_owner()) with check (is_owner());
create policy "invoices_select_own" on invoices
  for select using (
    customer_id in (select id from customers where user_id = auth.uid())
  );
create policy "invoice_job_links_all_owner" on invoice_job_links
  for all using (is_owner()) with check (is_owner());

create policy "expenses_all_owner" on expenses
  for all using (is_owner()) with check (is_owner());
create policy "activity_log_all_owner" on activity_log
  for all using (is_owner()) with check (is_owner());

-- ============================================================================
-- Storage: job_photos_storage_owner (from 0001_init.sql) only references
-- is_owner(), so it survives the table drops above untouched. But
-- job_photos_storage_select_own references the job_photos table directly
-- in its USING clause, so `drop table job_photos cascade` silently dropped
-- it along with job_photos itself — recreate it here.
-- ============================================================================
drop policy if exists "job_photos_storage_select_own" on storage.objects;

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
