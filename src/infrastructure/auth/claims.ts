import { z } from "zod";
import { RequestError } from "../security/errors";

const identitySchema = z
  .object({ sub: z.string().min(1).max(255), iss: z.url(), amr: z.array(z.string()).optional() })
  .catchall(z.unknown());

export function ownerClaims(
  user: unknown,
  expectedIssuer: string,
  mfaClaim: string,
): { issuer: string; subject: string } {
  const result = identitySchema.safeParse(user);
  if (!result.success || result.data.iss !== expectedIssuer)
    throw new RequestError("INVALID_IDENTITY", 403, "Access is not permitted.");
  const identity = result.data;
  if (!identity.amr?.includes("mfa") && identity[mfaClaim] !== true)
    throw new RequestError("MFA_REQUIRED", 403, "Use multi-factor authentication to sign in.");
  return { issuer: identity.iss, subject: identity.sub };
}
