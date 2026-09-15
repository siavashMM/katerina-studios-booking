-- Run with psql as the migration owner after migrations:
-- psql -v runtime_role=katerina_runtime -f prisma/runtime-grants.sql
-- Create the login and its password through the database host first.
GRANT USAGE ON SCHEMA public TO :"runtime_role";
GRANT SELECT ON "Property", "Accommodation", "SeasonalPrice", "PolicyVersion",
  "Reservation", "InventoryAllocation", "EmailOutbox", "AuditEvent", "OwnerMembership",
  "AuthSession", "RateLimitCounter", "ProcessedWebhook", "WorkerHeartbeat" TO :"runtime_role";
GRANT INSERT, UPDATE ON "Reservation", "InventoryAllocation", "EmailOutbox", "AuthSession",
  "RateLimitCounter", "WorkerHeartbeat" TO :"runtime_role";
GRANT UPDATE ON "Accommodation" TO :"runtime_role";
GRANT INSERT, DELETE ON "SeasonalPrice" TO :"runtime_role";
GRANT DELETE ON "AuthSession", "RateLimitCounter" TO :"runtime_role";
GRANT INSERT ON "AuditEvent", "ProcessedWebhook" TO :"runtime_role";
