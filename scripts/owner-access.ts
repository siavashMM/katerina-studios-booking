import { z } from "zod";
import { prisma } from "../src/infrastructure/db/client";
import { authIssuer } from "../src/config/env";

async function main() {
  const [action, subject, email] = process.argv.slice(2);
  z.enum(["grant", "revoke"]).parse(action);
  z.string().min(1).max(255).parse(subject);
  const issuer = authIssuer();
  const property = await prisma.property.findUniqueOrThrow({ where: { slug: "katerina-studios" } });
  await prisma.$transaction(async (tx) => {
    if (action === "grant") {
      const address = z.email().parse(email);
      await tx.ownerMembership.upsert({
        where: {
          issuer_authSubject_propertyId: { issuer, authSubject: subject, propertyId: property.id },
        },
        create: { issuer, authSubject: subject, propertyId: property.id, email: address },
        update: { active: true, email: address },
      });
    } else {
      await tx.ownerMembership.updateMany({
        where: { issuer, authSubject: subject, propertyId: property.id },
        data: { active: false },
      });
    }
    await tx.auditEvent.create({
      data: {
        propertyId: property.id,
        actorId: "operator-cli",
        action: action === "grant" ? "OWNER_ACCESS_GRANTED" : "OWNER_ACCESS_REVOKED",
        metadata: { subject, issuer },
      },
    });
  });
  console.info(
    action === "grant"
      ? "Owner access was granted. Auth0 login and MFA are still required."
      : "Owner access was removed. Existing sessions cannot access owner records.",
  );
}
main()
  .catch(() => {
    console.error(
      "Owner access update failed. Use: npm run owner:access -- grant <subject> <email>, or revoke <subject>.",
    );
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
