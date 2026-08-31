# Production Data Layer Foundation

## Status

This milestone establishes a provider-independent server data boundary. It does
not switch the running application away from localStorage or IndexedDB because
no production database, object store, or Clerk Organizations configuration is
currently connected. Existing browser data and UI behavior remain unchanged.

The target database is PostgreSQL 16 or newer. PostgreSQL fits the relational
ownership graph, supports transactions and composite foreign keys, and provides
row-level security as defense in depth. `db/schema.sql` is vendor-neutral
PostgreSQL DDL and has not been applied to an external system.

## Ownership graph

```text
ContractorCompany
  ├── Membership ── User (Clerk user ID)
  └── Client
       └── WorkOrder
            ├── Measurement
            ├── Note
            ├── Photo / Document metadata
            ├── Estimate (immutable issuer snapshot when issued)
            └── Invoice  (immutable issuer snapshot when issued)
```

Every tenant-owned database table carries `company_id`. Child relationships use
composite foreign keys such as `(company_id, client_id)` and
`(company_id, work_order_id)`. This prevents a record from referencing a parent
in another company even if application code is wrong.

Company-scoped IDs use composite primary keys, allowing browser IDs to be
preserved during import without causing collisions between companies.

## Authentication and authorization

Clerk remains the identity provider. `getClerkServerIdentity` reads `userId` and
active `orgId` from Clerk's verified server session. It does not read user or
organization metadata.

Authorization follows this order for every server request:

1. Read the verified Clerk identity on the server.
2. Resolve an active database `Membership`.
3. If Clerk provides an active organization, require it to map to the same
   `ContractorCompany` and membership.
4. Without an organization, permit the compatibility path only when the user
   has exactly one active membership.
5. Construct `AuthorizedCompanyContext` from the database result.
6. Apply that context's `companyId` to every repository query and mutation.

The client never selects or submits an authoritative company ID. Lookup methods
query by both `company_id` and record ID, returning not-found for another
tenant's record to avoid enumeration.

In PostgreSQL, the server transaction must set `SET LOCAL app.company_id` only
after membership resolution. Row-level-security policies then provide a second
tenant boundary. The narrowly scoped `resolve_company_membership` function is
the pre-context lookup; execute permission must be granted only to the actual
runtime database role after provisioning.

## Server contracts

- `ProductionDataStore` defines persistence operations.
- `resolveAuthorizedCompany` converts verified identity plus persisted
  membership into tenant context.
- `TenantDataService` is the only business-facing scoped service.
- `InMemoryProductionDataStore` is a test/conformance adapter only and is never
  selected by application runtime code.
- `DataLayerError` provides stable unauthenticated, forbidden, not-found,
  validation, conflict, and not-configured error categories.

The future PostgreSQL adapter must place membership resolution, setting
`app.company_id`, and each operation in controlled server-side transactions.
Database credentials must exist only in server environment configuration.

## Explicit browser import

Import is intentionally not automatic and does not delete local data:

```text
localStorage + IndexedDB
  → assemble versioned export in browser
  → validate IDs, limits, shapes, duplicates, and relationships
  → authenticate on server
  → resolve database membership/company
  → insert in one company-scoped transaction
  → verify counts and relationships from database
  → return receipt with localDataRetained: true
  → user confirms before any later cleanup option
```

The current validator accepts version 1 metadata for company profile, clients,
Work Orders, measurements, notes, and attachments. It preserves IDs, rejects
broken relationships and duplicates, limits each record category to 10,000,
and rejects imports that would overwrite records already present in that
company. Profile data is treated as an import candidate and must not silently
overwrite the authoritative company profile.

Photo, document, and logo bytes require a separate authenticated object-storage
upload phase. Metadata must not be marked complete until each object is stored
and verified. Local IndexedDB blobs remain untouched throughout.

## Existing compatibility

The current company profile, branding, logo, client, Work Order, measurement,
note, photo, and document repositories continue operating exactly as before.
`WorkOrderWorkspace.tsx` is not changed. Clerk `unsafeMetadata` remains a UI and
onboarding compatibility mirror only; it is never an authorization source.

Future estimates and invoices will store `issuer_snapshot` JSON at issuance so
later profile or logo changes cannot alter historical documents.

## Required production connection

Before enabling server persistence:

1. Provision PostgreSQL 16+ with separate migration and least-privilege runtime
   roles, encrypted connections, backups, and point-in-time recovery.
2. Provide the server-only database connection value through the deployment
   platform's encrypted environment settings.
3. Choose and install a minimal PostgreSQL driver/migration tool after the
   provider and deployment runtime are known.
4. Apply and review `db/schema.sql`; grant the runtime role only required table,
   sequence, and membership-resolver permissions.
5. Enable Clerk Organizations and choose membership-required versus
   membership-optional behavior. Existing single-user accounts favor optional
   mode during migration.
6. Configure Clerk organization lifecycle webhooks so company/membership rows
   remain synchronized, with signature verification and idempotency.
7. Provision private object storage for logos, photos, and documents.
8. Add integration tests against an isolated PostgreSQL database before any UI
   repository is switched to server persistence.
