import { forbidden, unauthenticated } from "./errors";
import type { ProductionDataStore } from "./store";
import type { AuthenticatedIdentity, AuthorizedCompanyContext, CompanyMembership } from "./types";

function context(membership: CompanyMembership): AuthorizedCompanyContext {
  return { companyId: membership.companyId, clerkUserId: membership.clerkUserId, membershipId: membership.id, role: membership.role };
}

export async function resolveAuthorizedCompany(store: ProductionDataStore, identity: AuthenticatedIdentity | null): Promise<AuthorizedCompanyContext> {
  if (!identity?.clerkUserId) throw unauthenticated();

  if (identity.clerkOrganizationId) {
    const company = await store.findCompanyByClerkOrganizationId(identity.clerkOrganizationId);
    if (!company) throw forbidden();
    const membership = await store.findActiveMembership(company.id, identity.clerkUserId);
    if (!membership) throw forbidden();
    return context(membership);
  }

  const memberships = await store.listActiveMembershipsForUser(identity.clerkUserId);
  if (memberships.length !== 1) throw forbidden();
  return context(memberships[0]);
}
