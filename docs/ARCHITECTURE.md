# Quotiq AI — Data Architecture

> The production tenant and persistence foundation is documented in
> [`PRODUCTION_DATA_LAYER.md`](./PRODUCTION_DATA_LAYER.md). The browser-backed
> repositories described below remain active until production infrastructure is
> configured and an explicit import has been verified.

This document describes the core domain model introduced in Sprint 2.
It supersedes the earlier client-centric shape (Sprint 1), where jobs,
estimates, invoices, photos, notes, and documents all referenced a
`clientId` directly. **`WorkOrder` is now the relational hub**: almost
everything that isn't a `Client`, `Property`, or `Vehicle` hangs off a
`WorkOrder` instead of the client.

Source of truth for types: [`lib/types.ts`](../lib/types.ts).
Mock data and join helpers: [`lib/data.ts`](../lib/data.ts).

## Entities

| Entity | Belongs to | Description |
|---|---|---|
| `Client` | — | A contractor's customer. Root of the graph. |
| `Property` | `Client` | A physical address owned/managed by a client. A client can have many. |
| `Vehicle` | `Client` | A vehicle owned by a client (fleet work, auto-adjacent trades). A client can have many. |
| `WorkOrder` | `Client`, optionally `Property` or `Vehicle` | A unit of work — the hub every downstream record joins through. |
| `Quote` | `WorkOrder` | A price quote for a work order. A work order can have many (e.g. revisions). |
| `Invoice` | `WorkOrder` | A bill for a work order. A work order can have many (e.g. progress billing). |
| `Photo` | `WorkOrder` | A jobsite photo. |
| `DocumentRecord` | `WorkOrder` | A contract, permit, insurance certificate, or inspection report. |
| `Note` | `WorkOrder` | A freeform timestamped note from staff. |
| `WarrantyRecord` | `WorkOrder` | A warranty tied to materials/labor from that job. |

## Relationships

```
Client 1 ──< Property
Client 1 ──< Vehicle
Client 1 ──< WorkOrder

WorkOrder N ──> 0..1 Property   (optional)
WorkOrder N ──> 0..1 Vehicle    (optional)

WorkOrder 1 ──< Quote
WorkOrder 1 ──< Invoice
WorkOrder 1 ──< Photo
WorkOrder 1 ──< Note
WorkOrder 1 ──< DocumentRecord
WorkOrder 1 ──< WarrantyRecord
```

- **One `Client`** can have many `Property`, `Vehicle`, and `WorkOrder` records.
- **Each `WorkOrder`** belongs to exactly one `Client`, and may optionally
  reference one `Property` **or** one `Vehicle` (e.g. a kitchen remodel
  references a property; a fleet A/C repair references a vehicle; a
  brand-new lead with no site visit yet references neither).
- **Each `WorkOrder`** can have many `Quote`, `Invoice`, `Photo`, `Note`,
  `DocumentRecord`, and `WarrantyRecord` entries.

## Modeling decisions worth calling out

1. **`WorkOrderStatus` gained a `"quoting"` stage.** Because `Quote`
   belongs to a `WorkOrder` (not directly to a `Client`), a work order
   has to exist before a quote can be sent — including for a lead who
   hasn't had a job created yet. `"quoting"` represents that pre-approval
   stage (no crew assigned, `budget`/`progress` at 0) so the relationship
   holds without inventing a parallel "pre-work-order quote" concept.

2. **No duplicated denormalized fields.** Sprint 1's mock data stored
   `clientName` / `jobTitle` directly on invoices and estimates for
   convenience. That's gone — everything is looked up through
   `workOrderId` → `WorkOrder` → `clientId` → `Client` via the helpers in
   `lib/data.ts` (`getWorkOrderById`, `getClientById`, etc.), so there's
   one source of truth per fact.

3. **`Client.totalJobs` / `Client.lifetimeValue` were removed** as stored
   fields for the same reason — they're derived data. Use
   `getWorkOrdersByClient(clientId).length` and
   `getClientLifetimeValue(clientId)` instead of trusting a cached number
   that could drift from the underlying records.

## Join helpers (`lib/data.ts`)

- `getClientById(id)`, `getWorkOrderById(id)`
- `getWorkOrdersByClient(clientId)`, `getPropertiesByClient(clientId)`, `getVehiclesByClient(clientId)`
- `getQuotesByWorkOrder(id)`, `getInvoicesByWorkOrder(id)`
- `getQuoteTotal(quote)` — sums line items
- `getClientLifetimeValue(clientId)` — sums `amountPaid` across all invoices on all of a client's work orders
- `getClientRelatedRecords(clientId)` — everything reachable through a client's work orders (properties, vehicles, work orders, quotes, invoices, notes, warranties, documents, photos), keyed off `clientId` alone so it works for both fixture and real clients

## What's intentionally not built yet

Per the Sprint 2 brief, this pass is data-model only. Existing pages
were updated just enough to compile against the new shapes (e.g. the
Jobs/Estimates/Invoices list pages now join through `WorkOrder` instead
of reading denormalized fields) — no new screens, and no UI for
managing Properties/Vehicles/Quotes as first-class list pages yet.

## Unified client and Work Order repository

[`lib/workorder-repository.ts`](../lib/workorder-repository.ts) is the single
read/write interface for clients and Work Orders. It combines read-only
sample records with records persisted under `quotiq.clients` and
`quotiq.workOrders`, with persisted records overriding samples by ID. This
keeps sample data available without forcing screens to choose between two
data sources. Editing a sample Work Order saves an override rather than
mutating the fixture.

The repository uses `useSyncExternalStore` for browser subscriptions and
provides validated create, lookup, relationship, and update operations.
The Work Order list, creation flow, dynamic workspace, and client workspace
all consume this interface. Dashboard, quotes, invoices, and the demo AI
remain fixture-backed until their own milestones.

## Work Order Job Intelligence

The Work Order workspace includes Overview, Photos, Measurements, Notes,
and Documents. Structured job-site records and attachment metadata live in
the versioned `quotiq.jobIntelligence` localStorage record through
`lib/job-intelligence-repository.ts`. Every record carries a `workOrderId`.

Photo and document bytes are stored as `Blob` values in the versioned
`quotiq-job-files` IndexedDB database through `lib/indexeddb-file-storage.ts`;
binary data is never base64-encoded into localStorage. Metadata is written
only after its file succeeds, and deletion removes both the IndexedDB value
and metadata. Storage and quota failures are normalized into visible UI
messages. No AI analysis or automatic measurement claims are part of this
milestone.

## Multi-trade Work Orders

Quotiq AI serves multiple contractor trades (mobile mechanics, handymen,
fence installers, electricians, plumbers, general contractors, and more)
from **one shared `WorkOrder` model** — not a separate app or record type
per trade. Two additions to `WorkOrder` in `lib/types.ts` make this work:

- **`trade: TradeCategory`** — a required, closed set of trade values
  (`mobile_mechanic`, `handyman`, `fence`, `drywall`, `painting`,
  `electrical`, `appliance_repair`, `sprinklers_irrigation`,
  `pressure_washing`, `carpentry`, `plumbing`, `general_contractor`,
  `other`). This is distinct from the pre-existing `category` field:
  `category` classifies the *kind* of work (remodel/repair/installation/
  inspection/maintenance/other) regardless of trade, while `trade`
  identifies *which specialty* is doing it.
- **`tradeDetails?: TradeDetails`** — optional, trade-specific structured
  data. `TradeDetails` is deliberately a loose `Record<string, string |
  boolean>` rather than a hand-rolled interface (or discriminated union)
  per trade. Which keys are meaningful for a given trade is **config, not
  a type-level concern** — see below.

### Extensibility: config-driven detail fields

`TRADE_DETAIL_FIELDS` in [`lib/work-order-options.ts`](../lib/work-order-options.ts)
is the single source of truth mapping each `TradeCategory` to the list of
optional fields relevant to it (e.g. Mobile Mechanic gets vehicle year/
make/model/VIN/mileage; Fence gets fence type/linear feet/gate count;
Electrical gets panel type/amperage/permit-required). `CreateWorkOrderForm`
reads this config to render the right optional fields the moment a trade
is selected, and to extract them into `tradeDetails` on submit — no
per-trade branching in the form component itself.

**Adding a new trade going forward means two small, additive edits and
nothing else:**

1. Add the new value to the `TradeCategory` union in `lib/types.ts`.
2. Add a matching entry (label + optional detail fields) to
   `TRADE_CATEGORIES` / `TRADE_DETAIL_FIELDS` in `lib/work-order-options.ts`.

The form, storage layer, and list views all pick this up automatically —
none of them hardcode the set of trades.

### What's intentionally not built yet

Per this pass's brief: no AI-assisted trade detection, no trade-specific
pricing/estimating logic, and no per-trade Work Order *types* (all trades
share the same `WorkOrder` shape, `workorder-storage.ts` persistence, and
`/jobs` list/detail UI).

## Company ownership and branding foundation

`ContractorCompany` (also exported as `CompanyProfile`) is now the intended
tenant root. It owns the contractor's identity, contact information, pricing
defaults, document terms, brand color, and optional logo asset reference. The
Phase 1 relationship is:

```text
ContractorCompany 1 ──< Membership >── 1 User
ContractorCompany 1 ──< Client 1 ──< WorkOrder
WorkOrder 1 ──< Estimate
WorkOrder 1 ──< Invoice
```

Membership is an architectural boundary, not a persisted entity yet. Until
Clerk Organizations and a production database are enabled, a Clerk user ID is
used as the profile `ownerId` and acts as a single-member tenant. The
`AccountStorageBoundary` supplies that owner scope. This preserves existing
accounts and does not require a dangerous migration of current browser data.

### Company profile repository

`lib/company-profile-repository.ts` is the current profile persistence adapter.
It stores one versionable profile namespace per owner under
`quotiq.companyProfile.<ownerId>`. Profile validation and issuer snapshot logic
live separately in `lib/company-profile.ts`, so a database adapter can replace
browser persistence without changing document or settings components.

The Settings screen continues mirroring company name and license into Clerk
user metadata for compatibility with onboarding and the existing dashboard.
Clerk metadata is not the future source of truth for company records.

### Logo storage abstraction

`CompanyLogoStorage` separates binary operations (`put`, `get`, `delete`) from
profile metadata. The local development implementation uses the
`quotiq-company-assets` IndexedDB database and tenant-prefixed storage keys.
It accepts only PNG, JPEG, and WebP files up to 5 MB and checks file signatures
instead of trusting extensions or browser-provided MIME labels.

Before production, replace this adapter with authenticated object storage:

1. Authorize the active company membership on every operation.
2. Upload through a protected server endpoint or short-lived signed request.
3. Repeat byte-level MIME and size validation server-side, normalize images,
   strip metadata, and generate bounded document/display variants.
4. Persist immutable asset metadata in the database and use tenant-prefixed
   object keys with private-by-default access.
5. Add lifecycle cleanup, malware/abuse controls, logging, and backups.

No cloud persistence or credentials are implied by the Phase 1 adapter.

### Document branding and issuer snapshots

`BrandedDocumentHeader` is the shared presentation component for future
estimate and invoice previews/PDFs. It accepts either the live company profile
or an `IssuerSnapshot` and renders the logo, company identity, contact details,
license, and accent color.

`createIssuerSnapshot` copies and freezes identity and branding fields at the
moment a document is issued. Future draft documents may reference the live
profile, but sent/issued estimates and invoices must persist this snapshot.
Changing a company name, address, license, logo, or brand color must never
retroactively alter a historical document. Logo objects therefore need
immutable/versioned retention for as long as an issued snapshot references
them.

## What remains local-only after Phase 1

- Company profiles: localStorage, scoped by the current Clerk user ID.
- Clients and Work Orders: localStorage through `workorder-repository.ts`.
- Measurements, notes, and attachment metadata: localStorage through
  `job-intelligence-repository.ts`.
- Company logos, Work Order photos, and document bytes: IndexedDB.
- Estimates, invoices, dashboard financials, and AI responses: fixtures or
  beta placeholders where noted in their screens.

Browser scoping improves accidental cross-account visibility on one device but
is not a production authorization boundary. Data does not sync, back up, or
survive browser storage loss.

## Next production persistence migration

The next phase should provision a relational database and private object
storage, then add server-side repositories with company-scoped authorization.
Migrate in this order:

1. `ContractorCompany`, `Membership`, and user-to-company authorization.
2. Logo assets and company settings, replacing the two local adapters.
3. Clients and Work Orders, preserving their existing IDs and relationships.
4. Measurements, notes, and attachment metadata.
5. Photo/document blobs with resumable uploads and integrity checks.
6. Estimates, invoices, issuer snapshots, document numbering, and payments.

Migration should be an explicit, user-confirmed import with validation and an
idempotency record. Existing localStorage/IndexedDB data must remain readable
until the server copy is verified; do not silently delete browser data.
