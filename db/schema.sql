-- Quotiq production relational foundation (PostgreSQL 16+).
-- Apply only after provisioning a production database and reviewed migration tooling.

create table contractor_companies (
  id text primary key,
  clerk_organization_id text unique,
  legal_name text not null default '',
  display_name text not null check (length(trim(display_name)) > 0),
  email text not null default '',
  phone text not null default '',
  website text not null default '',
  address text not null default '',
  city text not null default '',
  state text not null default '',
  postal_code text not null default '',
  country text not null default 'US',
  contractor_license text not null default '',
  default_currency char(3) not null default 'USD',
  default_markup numeric(7,3) not null default 0 check (default_markup between 0 and 100),
  default_tax_rate numeric(7,3) not null default 0 check (default_tax_rate between 0 and 100),
  payment_terms text not null default '',
  estimate_terms text not null default '',
  invoice_terms text not null default '',
  accent_color char(7) not null default '#2563eb',
  logo_asset_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table memberships (
  id text primary key,
  company_id text not null references contractor_companies(id) on delete cascade,
  clerk_user_id text not null,
  role text not null check (role in ('owner', 'admin', 'member')),
  status text not null default 'active' check (status in ('active', 'suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, clerk_user_id)
);
create index memberships_user_lookup on memberships (clerk_user_id, status);

create table company_assets (
  company_id text not null references contractor_companies(id) on delete cascade,
  id text not null,
  storage_key text not null unique,
  file_name text not null,
  mime_type text not null check (mime_type in ('image/png', 'image/jpeg', 'image/webp')),
  size_bytes bigint not null check (size_bytes > 0),
  created_at timestamptz not null default now(),
  primary key (company_id, id)
);
alter table contractor_companies add constraint company_logo_fk
  foreign key (id, logo_asset_id) references company_assets(company_id, id);

create table clients (
  company_id text not null references contractor_companies(id) on delete cascade,
  id text not null,
  first_name text not null,
  last_name text not null,
  client_company text,
  email text not null,
  phone text not null,
  address text not null,
  city text not null,
  state text not null,
  postal_code text not null,
  notes text,
  status text not null check (status in ('active', 'lead', 'inactive')),
  created_at timestamptz not null,
  updated_at timestamptz not null,
  primary key (company_id, id)
);

create table work_orders (
  company_id text not null,
  id text not null,
  client_id text not null,
  property_id text,
  vehicle_id text,
  title text not null,
  trade text not null,
  trade_details jsonb,
  category text not null,
  priority text not null,
  service_address text not null,
  description text not null,
  internal_notes text,
  status text not null,
  start_date date not null,
  end_date date not null,
  budget numeric(14,2) not null default 0 check (budget >= 0),
  progress smallint not null default 0 check (progress between 0 and 100),
  crew jsonb not null default '[]'::jsonb,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  primary key (company_id, id),
  foreign key (company_id, client_id) references clients(company_id, id) on delete restrict
);

create table work_order_measurements (
  company_id text not null,
  id text not null,
  work_order_id text not null,
  type text not null,
  label text not null,
  value numeric,
  unit text not null,
  width numeric,
  height numeric,
  quantity numeric not null default 1,
  notes text,
  created_at timestamptz not null,
  primary key (company_id, id),
  foreign key (company_id, work_order_id) references work_orders(company_id, id) on delete cascade
);

create table work_order_notes (
  company_id text not null,
  id text not null,
  work_order_id text not null,
  body text not null,
  visibility text not null check (visibility in ('internal', 'client')),
  created_at timestamptz not null,
  updated_at timestamptz not null,
  primary key (company_id, id),
  foreign key (company_id, work_order_id) references work_orders(company_id, id) on delete cascade
);

create table work_order_attachments (
  company_id text not null,
  id text not null,
  work_order_id text not null,
  kind text not null check (kind in ('photo', 'document')),
  storage_key text,
  file_name text not null,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes > 0),
  caption text,
  description text,
  uploaded_at timestamptz not null,
  primary key (company_id, id),
  foreign key (company_id, work_order_id) references work_orders(company_id, id) on delete cascade
);

create table estimates (
  company_id text not null,
  id text not null,
  work_order_id text not null,
  number text not null,
  status text not null,
  issuer_snapshot jsonb,
  issued_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (company_id, id),
  unique (company_id, number),
  foreign key (company_id, work_order_id) references work_orders(company_id, id) on delete restrict
);

create table invoices (
  company_id text not null,
  id text not null,
  work_order_id text not null,
  number text not null,
  status text not null,
  issuer_snapshot jsonb,
  issued_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (company_id, id),
  unique (company_id, number),
  foreign key (company_id, work_order_id) references work_orders(company_id, id) on delete restrict
);

-- Defense in depth. The server must SET LOCAL app.company_id after verifying
-- Clerk identity against memberships inside the same transaction.
alter table contractor_companies enable row level security;
alter table memberships enable row level security;
alter table company_assets enable row level security;
alter table clients enable row level security;
alter table work_orders enable row level security;
alter table work_order_measurements enable row level security;
alter table work_order_notes enable row level security;
alter table work_order_attachments enable row level security;
alter table estimates enable row level security;
alter table invoices enable row level security;

create policy tenant_companies on contractor_companies using (id = nullif(current_setting('app.company_id', true), '')) with check (id = nullif(current_setting('app.company_id', true), ''));
create policy tenant_memberships on memberships using (company_id = nullif(current_setting('app.company_id', true), '')) with check (company_id = nullif(current_setting('app.company_id', true), ''));
create policy tenant_assets on company_assets using (company_id = nullif(current_setting('app.company_id', true), '')) with check (company_id = nullif(current_setting('app.company_id', true), ''));
create policy tenant_clients on clients using (company_id = nullif(current_setting('app.company_id', true), '')) with check (company_id = nullif(current_setting('app.company_id', true), ''));
create policy tenant_work_orders on work_orders using (company_id = nullif(current_setting('app.company_id', true), '')) with check (company_id = nullif(current_setting('app.company_id', true), ''));
create policy tenant_measurements on work_order_measurements using (company_id = nullif(current_setting('app.company_id', true), '')) with check (company_id = nullif(current_setting('app.company_id', true), ''));
create policy tenant_notes on work_order_notes using (company_id = nullif(current_setting('app.company_id', true), '')) with check (company_id = nullif(current_setting('app.company_id', true), ''));
create policy tenant_attachments on work_order_attachments using (company_id = nullif(current_setting('app.company_id', true), '')) with check (company_id = nullif(current_setting('app.company_id', true), ''));
create policy tenant_estimates on estimates using (company_id = nullif(current_setting('app.company_id', true), '')) with check (company_id = nullif(current_setting('app.company_id', true), ''));
create policy tenant_invoices on invoices using (company_id = nullif(current_setting('app.company_id', true), '')) with check (company_id = nullif(current_setting('app.company_id', true), ''));

-- Membership must be resolved before app.company_id can be set. This narrowly
-- scoped function returns only an active membership matching the verified Clerk
-- identity and active Clerk organization. With no org, it returns a company
-- only when the user has exactly one active membership.
create or replace function resolve_company_membership(p_clerk_user_id text, p_clerk_organization_id text)
returns table (membership_id text, company_id text, role text)
language sql
security definer
set search_path = public
as $$
  select m.id, m.company_id, m.role
  from memberships m
  join contractor_companies c on c.id = m.company_id
  where m.clerk_user_id = p_clerk_user_id
    and m.status = 'active'
    and (
      (p_clerk_organization_id is not null and c.clerk_organization_id = p_clerk_organization_id)
      or
      (p_clerk_organization_id is null and (
        select count(*) from memberships only_m
        where only_m.clerk_user_id = p_clerk_user_id and only_m.status = 'active'
      ) = 1)
    )
  limit 1;
$$;
revoke all on function resolve_company_membership(text, text) from public;
-- After provisioning, grant EXECUTE only to the dedicated Quotiq runtime role.
