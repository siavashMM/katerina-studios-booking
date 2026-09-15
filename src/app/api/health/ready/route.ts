import { readinessIssues } from "@/config/env";
import { prisma } from "@/infrastructure/db/client";

export async function GET() {
  let ready = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    const heartbeat = await prisma.workerHeartbeat.findUnique({ where: { name: "email" } });
    ready =
      readinessIssues().length === 0 &&
      !!heartbeat?.lastSuccessAt &&
      Date.now() - heartbeat.lastSuccessAt.getTime() < 60000;
  } catch {
    /* Return no infrastructure details. */
  }
  return Response.json(
    { status: ready ? "ready" : "unavailable" },
    { status: ready ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  );
}
