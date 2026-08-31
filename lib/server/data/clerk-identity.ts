import "server-only";

import { auth } from "@clerk/nextjs/server";
import { unauthenticated } from "./errors";
import type { AuthenticatedIdentity } from "./types";

/** Reads identity only from Clerk's verified server session. */
export async function getClerkServerIdentity(): Promise<AuthenticatedIdentity> {
  const { userId, orgId } = await auth();
  if (!userId) throw unauthenticated();
  return { clerkUserId: userId, clerkOrganizationId: orgId ?? null };
}
