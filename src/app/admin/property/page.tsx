import { ownerForPage } from "@/features/admin/page-auth";
import { adminService } from "@/features/booking/server";
import { AdminNav } from "@/features/admin/ui/admin-nav";
import { PropertyEditor } from "@/features/admin/ui/property-editor";
import { AccommodationEditor } from "@/features/admin/ui/accommodation-editor";

const empty = {
  introduction: "",
  story: "",
  contactEmail: "",
  contactPhone: "",
  locationSummary: "",
  checkIn: "",
  checkOut: "",
  arrivalInstructions: "",
  amenities: [] as string[],
  policies: [] as string[],
};

export default async function PropertyPage() {
  const owner = await ownerForPage();
  const [content, accommodations] = await Promise.all([
    adminService().getPropertyContent(owner),
    adminService().listAccommodationContent(owner),
  ]);
  const initial = content
    ? {
        introduction: content.introduction,
        story: content.story,
        contactEmail: content.contactEmail,
        contactPhone: content.contactPhone,
        locationSummary: content.locationSummary,
        checkIn: content.checkIn,
        checkOut: content.checkOut,
        arrivalInstructions: content.arrivalInstructions,
        amenities: Array.isArray(content.amenities)
          ? content.amenities.filter((item): item is string => typeof item === "string")
          : [],
        policies: Array.isArray(content.policies)
          ? content.policies.filter((item): item is string => typeof item === "string")
          : [],
      }
    : empty;
  return (
    <>
      <AdminNav />
      <main id="main-content" className="admin-main">
        <header className="workspace-header">
          <div>
            <p className="eyebrow">Full Control</p>
            <h1>Property</h1>
            <p>Edit structured website and studio information.</p>
          </div>
        </header>
        <PropertyEditor initial={initial} />
        <section className="subsection-heading">
          <p className="eyebrow">Accommodation</p>
          <h2>Studios</h2>
          <p>Archive a studio instead of deleting it. Historical reservations remain linked.</p>
        </section>
        <div className="admin-rate-grid">
          {accommodations.map((accommodation) => (
            <AccommodationEditor
              key={accommodation.id}
              accommodation={{
                ...accommodation,
                amenities: Array.isArray(accommodation.amenities)
                  ? accommodation.amenities.filter(
                      (item): item is string => typeof item === "string",
                    )
                  : [],
              }}
            />
          ))}
        </div>
      </main>
    </>
  );
}
