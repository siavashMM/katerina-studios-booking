import "server-only";
import { getEnv } from "@/config/env";
import { prisma } from "@/infrastructure/db/client";
import { createBookingService } from "./application/booking-service";
import { createAdminService } from "@/features/admin/application/admin-service";
import { RequestError } from "@/infrastructure/security/errors";
import { readinessIssues } from "@/config/env";

export function bookingService() {
  const env = getEnv();
  if (!env.RECEIPT_SECRET || readinessIssues(env).length > 0) {
    throw new RequestError(
      "BOOKING_DISABLED",
      503,
      "Online booking requests are not available. Please try again later.",
    );
  }
  return createBookingService(prisma, {
    receiptSecret: env.RECEIPT_SECRET,
    demoMode: env.DEMO_MODE,
    appUrl: env.APP_URL,
  });
}

export function adminService() {
  return createAdminService(prisma, { appUrl: getEnv().APP_URL });
}
