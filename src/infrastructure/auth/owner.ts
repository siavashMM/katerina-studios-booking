import { getAuthClient } from "./client";
import { ownerClaims } from "./claims";
import { authIssuer, getEnv } from "@/config/env";
import { prisma } from "../db/client";
import { RequestError } from "../security/errors";

export async function requireOwner() {
  const client = getAuthClient();
  const session = await client.getSession();
  if (!session) throw new RequestError("UNAUTHORIZED", 401, "Log in to continue.");
  const identity = ownerClaims(session.user, authIssuer(), getEnv().AUTH0_MFA_CLAIM);
  const owner = await prisma.ownerMembership.findFirst({
    where: {
      issuer: identity.issuer,
      authSubject: identity.subject,
      active: true,
      property: { slug: "katerina-studios" },
    },
    select: { id: true, propertyId: true },
  });
  if (!owner) throw new RequestError("FORBIDDEN", 403, "Owner access is not permitted.");
  return { ...owner, ...identity };
}
