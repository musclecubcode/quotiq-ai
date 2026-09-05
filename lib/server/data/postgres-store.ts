import "server-only";

import { Pool, type PoolClient, type QueryResultRow } from "pg";
import { normalizeCompanyProfileInput, type CompanyProfileInput } from "../../company-profile";
import { categoryLabel } from "../../work-order-options";
import type { NewClientInput, NewWorkOrderInput, WorkOrderUpdate } from "../../workorder-repository";
import { DataLayerError, invalid } from "./errors";
import { analyzeBrowserImport, importCounts } from "./browser-import";
import type { ProductionDataStore } from "./store";
import type {
  AuthorizedCompanyContext,
  BrowserDataImportResult,
  CompanyClient,
  CompanyMembership,
  CompanyWorkOrder,
  PersistedCompany,
  ValidatedBrowserDataImport,
} from "./types";

type CompanyRow = QueryResultRow & {
  id: string; clerk_organization_id: string | null; legal_name: string; display_name: string; email: string;
  phone: string; website: string; address: string; city: string; state: string; postal_code: string; country: string;
  contractor_license: string; default_currency: string; default_markup: string; default_tax_rate: string;
  payment_terms: string; estimate_terms: string; invoice_terms: string; accent_color: string;
  created_at: Date; updated_at: Date;
};

type MembershipRow = QueryResultRow & {
  id: string; company_id: string; clerk_user_id: string; role: CompanyMembership["role"];
  status: CompanyMembership["status"]; created_at: Date; updated_at: Date;
};

const iso = (value: Date | string) => value instanceof Date ? value.toISOString() : value;
const id = () => crypto.randomUUID();
const required = (value: string, label: string) => {
  const trimmed = value.trim();
  if (!trimmed) throw invalid(`${label} is required.`);
  return trimmed;
};

function company(row: CompanyRow): PersistedCompany {
  return {
    id: row.id, clerkOrganizationId: row.clerk_organization_id, legalName: row.legal_name,
    displayName: row.display_name, email: row.email, phone: row.phone, website: row.website,
    address: row.address, city: row.city, state: row.state, postalCode: row.postal_code,
    country: row.country, contractorLicense: row.contractor_license,
    defaultCurrency: row.default_currency, defaultMarkup: Number(row.default_markup),
    defaultTaxRate: Number(row.default_tax_rate), paymentTerms: row.payment_terms,
    estimateTerms: row.estimate_terms, invoiceTerms: row.invoice_terms, accentColor: row.accent_color,
    logo: null, createdAt: iso(row.created_at), updatedAt: iso(row.updated_at),
  };
}

function membership(row: MembershipRow): CompanyMembership {
  return { id: row.id, companyId: row.company_id, clerkUserId: row.clerk_user_id, role: row.role,
    status: row.status, createdAt: iso(row.created_at), updatedAt: iso(row.updated_at) };
}

function client(row: QueryResultRow): CompanyClient {
  return {
    id: row.id, companyId: row.company_id, firstName: row.first_name, lastName: row.last_name,
    company: row.client_company ?? undefined, email: row.email, phone: row.phone, address: row.address,
    city: row.city, state: row.state, zip: row.postal_code, notes: row.notes ?? undefined,
    status: row.status, createdAt: iso(row.created_at), updatedAt: iso(row.updated_at),
  } as CompanyClient;
}

function workOrder(row: QueryResultRow): CompanyWorkOrder {
  return {
    id: row.id, companyId: row.company_id, clientId: row.client_id, propertyId: row.property_id ?? undefined,
    vehicleId: row.vehicle_id ?? undefined, title: row.title, trade: row.trade, tradeDetails: row.trade_details ?? undefined,
    category: row.category, priority: row.priority, serviceAddress: row.service_address,
    description: row.description, internalNotes: row.internal_notes ?? undefined, status: row.status,
    startDate: String(row.start_date), endDate: String(row.end_date), budget: Number(row.budget),
    progress: Number(row.progress), crew: row.crew ?? [], createdAt: iso(row.created_at), updatedAt: iso(row.updated_at),
  } as CompanyWorkOrder;
}

const measurement = (row: QueryResultRow) => ({ id:row.id,companyId:row.company_id,workOrderId:row.work_order_id,type:row.type,label:row.label,value:row.value===null?undefined:Number(row.value),unit:row.unit,width:row.width===null?undefined:Number(row.width),height:row.height===null?undefined:Number(row.height),quantity:Number(row.quantity),notes:row.notes??undefined,createdAt:iso(row.created_at) });
const note = (row: QueryResultRow) => ({ id:row.id,companyId:row.company_id,workOrderId:row.work_order_id,body:row.body,visibility:row.visibility,createdAt:iso(row.created_at),updatedAt:iso(row.updated_at) });
const attachment = (row: QueryResultRow) => ({ id:row.id,companyId:row.company_id,workOrderId:row.work_order_id,kind:row.kind,fileName:row.file_name,mimeType:row.mime_type,size:Number(row.size_bytes),caption:row.caption??undefined,description:row.description??undefined,uploadedAt:iso(row.uploaded_at) });

export function createPostgresPool(connectionString: string) {
  return new Pool({ connectionString, max: 10, idleTimeoutMillis: 20_000, connectionTimeoutMillis: 10_000,
    ssl: connectionString.includes("localhost") ? undefined : { rejectUnauthorized: false } });
}

export class PostgresProductionDataStore implements ProductionDataStore {
  constructor(private readonly pool: Pool) {}

  private async transaction<T>(run: (db: PoolClient) => Promise<T>) {
    const db = await this.pool.connect();
    try { await db.query("begin"); const result = await run(db); await db.query("commit"); return result; }
    catch (error) { await db.query("rollback"); throw error; }
    finally { db.release(); }
  }

  private tenant<T>(companyId: string, run: (db: PoolClient) => Promise<T>) {
    return this.transaction(async (db) => {
      await db.query("select set_config('app.company_id', $1, true)", [companyId]);
      return run(db);
    });
  }

  async createCompanyWithOwner(input: CompanyProfileInput, clerkUserId: string, clerkOrganizationId: string | null) {
    if (!clerkUserId.trim()) throw invalid("Clerk user ID is required.");
    const normalized = normalizeCompanyProfileInput(input);
    return this.transaction(async (db) => {
      const companyId = id(); const membershipId = id();
      try {
        const savedCompany = await db.query<CompanyRow>(`insert into contractor_companies
          (id, clerk_organization_id, legal_name, display_name, email, phone, website, address, city, state,
           postal_code, country, contractor_license, default_currency, default_markup, default_tax_rate,
           payment_terms, estimate_terms, invoice_terms, accent_color)
          values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20) returning *`,
          [companyId, clerkOrganizationId, normalized.legalName, normalized.displayName, normalized.email,
           normalized.phone, normalized.website, normalized.address, normalized.city, normalized.state,
           normalized.postalCode, normalized.country, normalized.contractorLicense, normalized.defaultCurrency,
           normalized.defaultMarkup, normalized.defaultTaxRate, normalized.paymentTerms, normalized.estimateTerms,
           normalized.invoiceTerms, normalized.accentColor]);
        const savedMembership = await db.query<MembershipRow>(`insert into memberships
          (id, company_id, clerk_user_id, role) values ($1,$2,$3,'owner') returning *`,
          [membershipId, companyId, clerkUserId]);
        return { company: company(savedCompany.rows[0]), membership: membership(savedMembership.rows[0]) };
      } catch (error) {
        if ((error as { code?: string }).code === "23505") throw new DataLayerError("CONFLICT", "That company or organization is already linked.");
        throw error;
      }
    });
  }

  async ensureCompanyWithOwner(input: CompanyProfileInput, clerkUserId: string, clerkOrganizationId: string | null) {
    if (!clerkUserId.trim()) throw invalid("Clerk user ID is required.");
    const normalized = normalizeCompanyProfileInput(input);
    return this.transaction(async (db) => {
      await db.query("select pg_advisory_xact_lock(hashtext($1))", [`quotiq-provision:${clerkUserId}`]);
      const existingMemberships = await db.query<MembershipRow>("select * from memberships where clerk_user_id=$1 and status='active' order by created_at", [clerkUserId]);
      if (existingMemberships.rowCount && existingMemberships.rowCount > 1) throw new DataLayerError("CONFLICT", "Select an active company before continuing.");
      if (existingMemberships.rows[0]) {
        const existingCompany = await db.query<CompanyRow>("select * from contractor_companies where id=$1", [existingMemberships.rows[0].company_id]);
        if (!existingCompany.rows[0]) throw new DataLayerError("NOT_FOUND", "Company was not found.");
        if (clerkOrganizationId && existingCompany.rows[0].clerk_organization_id !== clerkOrganizationId) throw new DataLayerError("FORBIDDEN", "You do not have access to this company.");
        return { company: company(existingCompany.rows[0]), membership: membership(existingMemberships.rows[0]), created: false };
      }
      if (clerkOrganizationId) {
        const linked = await db.query("select id from contractor_companies where clerk_organization_id=$1", [clerkOrganizationId]);
        if (linked.rowCount) throw new DataLayerError("FORBIDDEN", "That organization already has a company workspace.");
      }
      const companyId=id(), membershipId=id();
      const savedCompany=await db.query<CompanyRow>(`insert into contractor_companies (id,clerk_organization_id,legal_name,display_name,email,phone,website,address,city,state,postal_code,country,contractor_license,default_currency,default_markup,default_tax_rate,payment_terms,estimate_terms,invoice_terms,accent_color) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20) returning *`,[companyId,clerkOrganizationId,normalized.legalName,normalized.displayName,normalized.email,normalized.phone,normalized.website,normalized.address,normalized.city,normalized.state,normalized.postalCode,normalized.country,normalized.contractorLicense,normalized.defaultCurrency,normalized.defaultMarkup,normalized.defaultTaxRate,normalized.paymentTerms,normalized.estimateTerms,normalized.invoiceTerms,normalized.accentColor]);
      const savedMembership=await db.query<MembershipRow>("insert into memberships (id,company_id,clerk_user_id,role) values ($1,$2,$3,'owner') returning *",[membershipId,companyId,clerkUserId]);
      return { company:company(savedCompany.rows[0]), membership:membership(savedMembership.rows[0]), created:true };
    });
  }

  async findCompanyByClerkOrganizationId(clerkOrganizationId: string) {
    const result = await this.pool.query<CompanyRow>("select * from contractor_companies where clerk_organization_id = $1", [clerkOrganizationId]);
    return result.rows[0] ? company(result.rows[0]) : null;
  }
  async findActiveMembership(companyId: string, clerkUserId: string) {
    const result = await this.pool.query<MembershipRow>("select * from memberships where company_id = $1 and clerk_user_id = $2 and status = 'active'", [companyId, clerkUserId]);
    return result.rows[0] ? membership(result.rows[0]) : null;
  }
  async listActiveMembershipsForUser(clerkUserId: string) {
    const result = await this.pool.query<MembershipRow>("select * from memberships where clerk_user_id = $1 and status = 'active'", [clerkUserId]);
    return result.rows.map(membership);
  }
  async getCompany(companyId: string) {
    return this.tenant(companyId, async (db) => { const result = await db.query<CompanyRow>("select * from contractor_companies where id = $1", [companyId]); return result.rows[0] ? company(result.rows[0]) : null; });
  }
  async updateCompany(context: AuthorizedCompanyContext, input: CompanyProfileInput) {
    const value = normalizeCompanyProfileInput(input);
    return this.tenant(context.companyId, async (db) => {
      const result = await db.query<CompanyRow>(`update contractor_companies set legal_name=$2, display_name=$3, email=$4,
        phone=$5, website=$6, address=$7, city=$8, state=$9, postal_code=$10, country=$11,
        contractor_license=$12, default_currency=$13, default_markup=$14, default_tax_rate=$15,
        payment_terms=$16, estimate_terms=$17, invoice_terms=$18, accent_color=$19, updated_at=now()
        where id=$1 returning *`, [context.companyId, value.legalName, value.displayName, value.email, value.phone,
        value.website, value.address, value.city, value.state, value.postalCode, value.country, value.contractorLicense,
        value.defaultCurrency, value.defaultMarkup, value.defaultTaxRate, value.paymentTerms, value.estimateTerms,
        value.invoiceTerms, value.accentColor]);
      if (!result.rows[0]) throw new DataLayerError("NOT_FOUND", "Company was not found.");
      return company(result.rows[0]);
    });
  }

  listClients(companyId: string) { return this.tenant(companyId, async (db) => (await db.query("select * from clients where company_id=$1 order by created_at desc", [companyId])).rows.map(client)); }
  getClient(companyId: string, clientId: string) { return this.tenant(companyId, async (db) => { const row = (await db.query("select * from clients where company_id=$1 and id=$2", [companyId, clientId])).rows[0]; return row ? client(row) : null; }); }
  createClient(companyId: string, input: NewClientInput) {
    return this.tenant(companyId, async (db) => {
      const result = await db.query(`insert into clients (company_id,id,first_name,last_name,client_company,email,phone,address,city,state,postal_code,notes,status,created_at,updated_at)
        values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'active',now(),now()) returning *`,
        [companyId,id(),required(input.firstName,"First name"),required(input.lastName,"Last name"),input.company?.trim()||null,
         required(input.email,"Email"),required(input.phone,"Phone"),required(input.address,"Address"),required(input.city,"City"),
         required(input.state,"State"),required(input.zip,"ZIP code"),input.notes?.trim()||null]);
      return client(result.rows[0]);
    });
  }
  listWorkOrders(companyId: string) { return this.tenant(companyId, async (db) => (await db.query("select * from work_orders where company_id=$1 order by created_at desc", [companyId])).rows.map(workOrder)); }
  getWorkOrder(companyId: string, workOrderId: string) { return this.tenant(companyId, async (db) => { const row = (await db.query("select * from work_orders where company_id=$1 and id=$2", [companyId,workOrderId])).rows[0]; return row ? workOrder(row) : null; }); }
  createWorkOrder(companyId: string, input: NewWorkOrderInput) {
    return this.tenant(companyId, async (db) => {
      const address=required(input.serviceAddress,"Service address"), date=required(input.scheduledDate,"Scheduled date");
      const result=await db.query(`insert into work_orders (company_id,id,client_id,title,trade,trade_details,category,priority,service_address,description,internal_notes,status,start_date,end_date,created_at,updated_at)
        select $1,$2,c.id,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$13,now(),now() from clients c where c.company_id=$1 and c.id=$3 returning *`,
        [companyId,id(),input.clientId,`${categoryLabel(input.category)} — ${address}`,input.trade,input.tradeDetails??null,input.category,input.priority,address,required(input.description,"Description"),input.internalNotes?.trim()||null,input.status,date]);
      if(!result.rows[0]) throw invalid("Select a valid client."); return workOrder(result.rows[0]);
    });
  }
  updateWorkOrder(companyId: string, workOrderId: string, input: WorkOrderUpdate) {
    if(!Number.isFinite(input.budget)||input.budget<0) throw invalid("Budget must be zero or greater.");
    if(!Number.isFinite(input.progress)||input.progress<0||input.progress>100) throw invalid("Progress must be between 0 and 100.");
    if(input.endDate<input.startDate) throw invalid("End date cannot be before the start date.");
    return this.tenant(companyId,async(db)=>{const result=await db.query(`update work_orders set title=$3,trade=$4,category=$5,priority=$6,service_address=$7,description=$8,internal_notes=$9,status=$10,start_date=$11,end_date=$12,budget=$13,progress=$14,updated_at=now() where company_id=$1 and id=$2 returning *`,[companyId,workOrderId,required(input.title,"Title"),input.trade,input.category,input.priority,required(input.serviceAddress,"Service address"),required(input.description,"Description"),input.internalNotes?.trim()||null,input.status,input.startDate,input.endDate,input.budget,input.progress]);return result.rows[0]?workOrder(result.rows[0]):null;});
  }

  private snapshot(db: PoolClient, companyId: string) {
    return Promise.all([
      db.query<CompanyRow>("select * from contractor_companies where id=$1",[companyId]), db.query("select * from clients where company_id=$1",[companyId]),
      db.query("select * from work_orders where company_id=$1",[companyId]), db.query("select * from work_order_measurements where company_id=$1",[companyId]),
      db.query("select * from work_order_notes where company_id=$1",[companyId]), db.query("select * from work_order_attachments where company_id=$1",[companyId]),
    ]).then(([companies,clients,workOrders,measurements,notes,attachments]) => companies.rows[0] ? ({ company:company(companies.rows[0]),clients:clients.rows.map(client),workOrders:workOrders.rows.map(workOrder),measurements:measurements.rows.map(measurement),notes:notes.rows.map(note),attachments:attachments.rows.map(attachment) }) : null);
  }

  getCompanyDataSnapshot(companyId: string) { return this.tenant(companyId, (db) => this.snapshot(db,companyId)); }

  previewBrowserDataImport(companyId: string, data: ValidatedBrowserDataImport) {
    return this.tenant(companyId,async(db)=>{const snapshot=await this.snapshot(db,companyId);if(!snapshot) throw new DataLayerError("NOT_FOUND","Company was not found.");return {status:analyzeBrowserImport(snapshot,data),records:importCounts(data),localDataRetained:true as const};});
  }

  importBrowserData(companyId: string, data: ValidatedBrowserDataImport): Promise<BrowserDataImportResult> {
    return this.tenant(companyId, async (db) => {
      const before=await this.snapshot(db,companyId);if(!before) throw new DataLayerError("NOT_FOUND","Company was not found.");
      const status=analyzeBrowserImport(before,data);
      if(status==="already_imported") return {companyId,imported:importCounts(data),verifiedAt:new Date().toISOString(),localDataRetained:true,idempotentReplay:true};
      if(Object.values(importCounts(data)).every((count)=>count===0)) return {companyId,imported:importCounts(data),verifiedAt:new Date().toISOString(),localDataRetained:true,idempotentReplay:false};
      for(const item of data.clients) await db.query(`insert into clients (company_id,id,first_name,last_name,client_company,email,phone,address,city,state,postal_code,notes,status,created_at,updated_at) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,[companyId,item.id,item.firstName,item.lastName,item.company??null,item.email,item.phone,item.address,item.city,item.state,item.zip,item.notes??null,item.status,item.createdAt,new Date().toISOString()]);
      for(const item of data.workOrders) await db.query(`insert into work_orders (company_id,id,client_id,property_id,vehicle_id,title,trade,trade_details,category,priority,service_address,description,internal_notes,status,start_date,end_date,budget,progress,crew,created_at,updated_at) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,now(),now())`,[companyId,item.id,item.clientId,item.propertyId??null,item.vehicleId??null,item.title,item.trade,item.tradeDetails??null,item.category,item.priority,item.serviceAddress,item.description,item.internalNotes??null,item.status,item.startDate,item.endDate,item.budget,item.progress,JSON.stringify(item.crew)]);
      for(const item of data.measurements) await db.query(`insert into work_order_measurements (company_id,id,work_order_id,type,label,value,unit,width,height,quantity,notes,created_at) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,[companyId,item.id,item.workOrderId,item.type,item.label,item.value??null,item.unit,item.width??null,item.height??null,item.quantity,item.notes??null,item.createdAt]);
      for(const item of data.notes) await db.query(`insert into work_order_notes (company_id,id,work_order_id,body,visibility,created_at,updated_at) values ($1,$2,$3,$4,$5,$6,$7)`,[companyId,item.id,item.workOrderId,item.body,item.visibility,item.createdAt,item.updatedAt]);
      for(const item of data.attachments) await db.query(`insert into work_order_attachments (company_id,id,work_order_id,kind,storage_key,file_name,mime_type,size_bytes,caption,description,uploaded_at) values ($1,$2,$3,$4,null,$5,$6,$7,$8,$9,$10)`,[companyId,item.id,item.workOrderId,item.kind,item.fileName,item.mimeType,item.size,item.caption??null,item.description??null,item.uploadedAt]);
      const verified=await this.snapshot(db,companyId);if(!verified||analyzeBrowserImport(verified,data)!=="already_imported") throw new DataLayerError("CONFLICT","Imported data could not be verified.");
      return {companyId,imported:importCounts(data),verifiedAt:new Date().toISOString(),localDataRetained:true,idempotentReplay:false};
    });
  }
}
