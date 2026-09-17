import { getEnv } from "@/config/env";
import { ownerForPage } from "@/features/admin/page-auth";
import { adminService } from "@/features/booking/server";
import { AdminNav } from "@/features/admin/ui/admin-nav";
import { PhotosEditor } from "@/features/admin/ui/photos-editor";

export default async function PhotosPage() {
  const owner = await ownerForPage();
  const service = adminService();
  const [media, studios] = await Promise.all([
    service.listMedia(owner),
    service.listAccommodationsForOwner(owner),
  ]);
  const env = getEnv();
  return (
    <>
      <AdminNav />
      <main id="main-content" className="admin-main">
        <header className="workspace-header">
          <div>
            <p className="eyebrow">Full Control</p>
            <h1>Photos</h1>
            <p>Upload, describe, order, and select the featured property photo.</p>
          </div>
        </header>
        <PhotosEditor
          media={media}
          studios={studios}
          enabled={env.MEDIA_STORAGE === "local" && env.NODE_ENV !== "production"}
        />
      </main>
    </>
  );
}
