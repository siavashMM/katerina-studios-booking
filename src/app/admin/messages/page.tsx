import Link from "next/link";
import { ownerForPage } from "@/features/admin/page-auth";
import { adminService } from "@/features/booking/server";
import { dateOnly } from "@/features/booking/domain/rules";
import { AdminNav } from "@/features/admin/ui/admin-nav";
import { MessageComposer } from "@/features/admin/ui/message-composer";

function messageBody(payload: unknown) {
  if (!payload || typeof payload !== "object" || !("messageBody" in payload)) return null;
  return typeof payload.messageBody === "string" ? payload.messageBody : null;
}
function messageSubject(payload: unknown) {
  if (!payload || typeof payload !== "object" || !("messageSubject" in payload)) return null;
  return typeof payload.messageSubject === "string" ? payload.messageSubject : null;
}

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ reservation?: string }>;
}) {
  const owner = await ownerForPage();
  const service = adminService();
  const [reservations, context, query] = await Promise.all([
    service.listReservations(owner),
    service.getPortalContext(owner),
    searchParams,
  ]);
  const selectedId = query.reservation ?? reservations[0]?.id;
  const selected = selectedId
    ? await service.getReservation(owner, selectedId).catch(() => null)
    : null;
  return (
    <>
      <AdminNav fullControl={context.property.portalPlan === "FULL_CONTROL"} />
      <main id="main-content" className="admin-main admin-main-workspace">
        <header className="workspace-header">
          <div>
            <p className="eyebrow">Guest email</p>
            <h1>Messages</h1>
            <p>View sent email and send reservation messages.</p>
          </div>
        </header>
        <div className="message-workspace">
          <section className="message-thread-list" aria-label="Guests">
            {reservations.map((reservation) => (
              <Link
                className={selected?.id === reservation.id ? "is-selected" : ""}
                href={`/admin/messages?reservation=${reservation.id}`}
                key={reservation.id}
              >
                <strong>
                  {reservation.firstName} {reservation.lastName}
                </strong>
                <span>{reservation.accommodation.name}</span>
                <small>
                  {dateOnly(reservation.checkIn)} → {dateOnly(reservation.checkOut)}
                </small>
              </Link>
            ))}
          </section>
          <section className="message-panel">
            {selected ? (
              <>
                <header>
                  <div className="avatar" aria-hidden="true">
                    {selected.firstName[0]}
                    {selected.lastName[0]}
                  </div>
                  <div>
                    <h2>
                      {selected.firstName} {selected.lastName}
                    </h2>
                    <p>
                      {selected.reference} · {selected.email}
                    </p>
                  </div>
                </header>
                <div className="message-history">
                  {selected.emails.map((email) => {
                    const body = messageBody(email.payload);
                    return (
                      <article className="email-event" key={email.id}>
                        <div>
                          <strong>
                            {messageSubject(email.payload) ??
                              email.kind.replaceAll("_", " ").toLowerCase()}
                          </strong>
                          <time>{email.createdAt.toLocaleString()}</time>
                        </div>
                        {body ? <p>{body}</p> : <p>System email for this reservation.</p>}
                        <span className={`status status-${email.status.toLowerCase()}`}>
                          {email.status.toLowerCase()}
                        </span>
                      </article>
                    );
                  })}
                  {!selected.emails.length ? (
                    <p className="admin-empty">No email exists for this reservation.</p>
                  ) : null}
                </div>
                <MessageComposer reservationId={selected.id} guestName={selected.firstName} />
              </>
            ) : (
              <div className="empty-detail">
                <h2>Select a guest</h2>
                <p>Email history will appear here.</p>
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  );
}
