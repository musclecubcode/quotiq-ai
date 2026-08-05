# Quotiq AI — Data Architecture

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
