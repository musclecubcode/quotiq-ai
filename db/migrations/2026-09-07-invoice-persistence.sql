-- Non-destructive production upgrade for server-backed invoices.
alter table invoices add column if not exists client_id text;
alter table invoices add column if not exists description text not null default '';
alter table invoices add column if not exists issue_date date;
alter table invoices add column if not exists due_date date;
alter table invoices add column if not exists amount numeric(14,2) not null default 0;
alter table invoices add column if not exists amount_paid numeric(14,2) not null default 0;

update invoices i
set client_id = w.client_id
from work_orders w
where i.company_id = w.company_id
  and i.work_order_id = w.id
  and i.client_id is null;

update invoices
set issue_date = coalesce(issue_date, issued_at::date, created_at::date),
    due_date = coalesce(due_date, issued_at::date, created_at::date)
where issue_date is null or due_date is null;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'invoices_amount_nonnegative') then
    alter table invoices add constraint invoices_amount_nonnegative check (amount >= 0);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'invoices_amount_paid_valid') then
    alter table invoices add constraint invoices_amount_paid_valid check (amount_paid >= 0 and amount_paid <= amount);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'invoices_client_fk') then
    alter table invoices add constraint invoices_client_fk
      foreign key (company_id, client_id) references clients(company_id, id) on delete restrict;
  end if;
end $$;
