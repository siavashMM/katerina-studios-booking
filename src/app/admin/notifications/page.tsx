/* eslint-disable react-hooks/purity -- This dynamic Server Component checks the worker against the current request time. */
import Link from "next/link";
import { ownerForPage } from "@/features/admin/page-auth";
import { AdminNav } from "@/features/admin/ui/admin-nav";
import { prisma } from "@/infrastructure/db/client";
import { getServerTranslation } from "@/i18n/server";

export default async function NotificationsPage() {
  const [owner, { Translate, t, formatDate }] = await Promise.all([
    ownerForPage(),
    getServerTranslation(),
  ]);
  const [emails, heartbeat] = await Promise.all([
    prisma.emailOutbox.findMany({
      where: { reservation: { propertyId: owner.propertyId } },
      select: {
        id: true,
        kind: true,
        status: true,
        attempts: true,
        createdAt: true,
        reservation: { select: { id: true, reference: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.workerHeartbeat.findMany({
      select: { name: true, lastRunAt: true, lastSuccessAt: true },
    }),
  ]);
  // This Server Component reads the current worker state on each request.
  return (
    <>
      <AdminNav />
      <main id="main-content" className="admin-main">
        <div className="admin-heading">
          <p className="eyebrow">{Translate.admin.notifications.eyebrow}</p>
          <h1>{Translate.admin.notifications.title}</h1>
          <p>{Translate.admin.notifications.text}</p>
        </div>
        <section className="admin-card">
          <h2>{Translate.admin.notifications.worker}</h2>
          {heartbeat.length ? (
            heartbeat.map((worker) => (
              <p key={worker.name}>
                {t(Translate.admin.notifications.lastCheck, {
                  date: formatDate(worker.lastRunAt, { dateStyle: "medium", timeStyle: "short" }),
                })}
                {Date.now() - worker.lastRunAt.getTime() > 120000
                  ? ` — ${Translate.admin.notifications.overdue}`
                  : ` — ${Translate.admin.notifications.active}`}
              </p>
            ))
          ) : (
            <p>{Translate.admin.notifications.noCheck}</p>
          )}
        </section>
        <section className="admin-card">
          <h2>{Translate.admin.notifications.recent}</h2>
          <p className="small-copy">{Translate.admin.notifications.help}</p>
          {emails.length ? (
            <ul className="event-list">
              {emails.map((email) => (
                <li key={email.id}>
                  <div>
                    {email.reservation ? (
                      <Link href={`/admin/reservations/${email.reservation.id}`}>
                        {email.reservation.reference}
                      </Link>
                    ) : null}
                    <p>
                      {Translate.admin.events[email.kind as keyof typeof Translate.admin.events] ??
                        email.kind.replaceAll("_", " ").toLowerCase()}
                    </p>
                  </div>
                  <span className={`status status-${email.status.toLowerCase()}`}>
                    {Translate.admin.statuses[email.status]} ·{" "}
                    {t(Translate.admin.notifications.attempt, { count: email.attempts })}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p>{Translate.admin.notifications.empty}</p>
          )}
        </section>
      </main>
    </>
  );
}
