import "server-only";
import { redirect } from "next/navigation";
import { requireOwner } from "@/infrastructure/auth/owner";

export async function ownerForPage() {
  try {
    return await requireOwner();
  } catch {
    redirect("/admin/login");
  }
}
