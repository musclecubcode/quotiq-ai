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

## Client persistence (Sprint 3)

`Client` is now the one entity with a real, working data layer instead of
a fixture: [`lib/client-storage.ts`](../lib/client-storage.ts) persists
clients to the browser's `localStorage` (key `quotiq.clients`), exposed
via `useClients()` / `useClient(id)` (backed by `useSyncExternalStore`,
not `useEffect`, so it doesn't hit React's state-in-effect footgun and
doesn't need manual hydration bookkeeping).

This is a **separate store from the demo `clients` fixture** in
`lib/data.ts`. The Jobs, Estimates, Invoices, Dashboard, and AI Assistant
screens still read the fixture — they haven't been migrated to real data
yet, so a client created through the new "New Client" form won't show up
there. The Clients list and Client Workspace pages are the only ones
reading from the real store; both had to become Client Components
(`app/(dashboard)/clients/page.tsx`, and `ClientWorkspace.tsx` behind the
`[id]` route) since `localStorage` doesn't exist during server rendering.

A real client's Workspace tabs (Properties, Vehicles, Jobs, Estimates,
Invoices, Photos, Notes, Warranty, Documents) all resolve to the existing
empty states, since `getClientRelatedRecords` simply finds no fixture
work orders for a real client's id — correct behavior until Work Orders
get their own real data layer.
