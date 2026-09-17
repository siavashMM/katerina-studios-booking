import { getEnv } from "@/config/env";
import { ownerForPage } from "@/features/admin/page-auth";
import { adminService } from "@/features/booking/server";
import { AdminNav } from "@/features/admin/ui/admin-nav";
import { IcalSettings } from "@/features/admin/ui/ical-settings";
import { createCalendarToken } from "@/infrastructure/calendar/export";

export default async function SettingsPage() {
  const owner = await ownerForPage();
  const context = await adminService().getPortalContext(owner);
  const env = getEnv();
  const exportSecret = env.ICAL_EXPORT_SECRET;
  const [calendars, studios] = context.capabilities.canConfigureChannels
    ? await Promise.all([
        adminService().listExternalCalendars(owner),
        adminService().listAccommodationsForOwner(owner),
      ])
    : [[], []];
  const channels = [
    {
      name: "Direct website",
      status: "Connected",
      detail: context.property.isDemo
        ? "Booking requests use demonstration data. Email stays captured unless the real-email test is enabled."
        : "Booking requests create pending reservations.",
    },
    {
      name: "Booking.com",
      status: "Manual only",
      detail:
        "Add Booking.com reservations with Add booking. Official API access is not configured.",
    },
    {
      name: "Airbnb",
      status: "Manual only",
      detail: "Add Airbnb reservations with Add booking. Official API access is not configured.",
    },
    {
      name: "iCal",
      status: calendars.length ? "Connected" : "Not connected",
      detail: calendars.length
        ? `${calendars.length} feed${calendars.length === 1 ? "" : "s"} connected.`
        : "No external feed URL is configured.",
    },
  ];
  return (
    <>
      <AdminNav fullControl={context.property.portalPlan === "FULL_CONTROL"} />
      <main id="main-content" className="admin-main">
        <header className="workspace-header">
          <div>
            <p className="eyebrow">Owner portal</p>
            <h1>Settings</h1>
            <p>Review the plan and connection status. A status is shown with text and color.</p>
          </div>
        </header>
        <section className="admin-card settings-summary">
          <h2>Plan</h2>
          <strong>
            {context.property.portalPlan === "FULL_CONTROL" ? "Full Control" : "Owner Control"}
          </strong>
          <p>{context.property.name}</p>
        </section>
        <section className="admin-card">
          <h2>Channels</h2>
          <div className="channel-list">
            {channels.map((channel) => (
              <article key={channel.name}>
                <div>
                  <h3>{channel.name}</h3>
                  <p>{channel.detail}</p>
                </div>
                <span
                  className={`connection-status connection-${channel.status.toLowerCase().replaceAll(" ", "-")}`}
                >
                  {channel.status}
                </span>
              </article>
            ))}
          </div>
        </section>
        {context.capabilities.canConfigureChannels ? (
          <>
            <IcalSettings
              enabled={Boolean(env.ICAL_ENCRYPTION_KEY)}
              studios={studios}
              calendars={calendars.map((calendar) => ({
                ...calendar,
                lastSyncedAt: calendar.lastSyncedAt?.toISOString() ?? null,
              }))}
            />
            {exportSecret ? (
              <section className="admin-card">
                <h2>iCal exports</h2>
                <p>
                  Keep these private URLs secret. Each feed contains unavailable dates and no guest
                  details.
                </p>
                <ul className="export-list">
                  {studios.map((studio) => (
                    <li key={studio.id}>
                      <strong>{studio.name}</strong>
                      <a
                        className="text-link wrap-anywhere"
                        href={`${env.APP_URL}/api/calendar/${studio.id}?token=${createCalendarToken(studio.id, exportSecret)}`}
                      >
                        Open private calendar feed
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            ) : (
              <section className="admin-card">
                <h2>iCal exports</h2>
                <p className="notice notice-error">
                  Set ICAL_EXPORT_SECRET to create private export feeds.
                </p>
              </section>
            )}
          </>
        ) : null}
        <section className="admin-card">
          <h2>Service status</h2>
          <dl className="compact-data">
            <div>
              <dt>Email delivery</dt>
              <dd>
                {env.REAL_EMAIL_TEST
                  ? "Real-email test enabled"
                  : env.DEMO_MODE
                    ? "Captured in demo mode"
                    : "Production provider"}
              </dd>
            </div>
            <div>
              <dt>Photo storage</dt>
              <dd>
                {env.MEDIA_STORAGE === "local" && env.NODE_ENV !== "production"
                  ? "Local development storage"
                  : "Production storage not connected"}
              </dd>
            </div>
          </dl>
        </section>
      </main>
    </>
  );
}
