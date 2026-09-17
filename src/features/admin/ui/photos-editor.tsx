"use client";

import Image from "next/image";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { mutate } from "@/features/booking/ui/http";

type Media = {
  id: string;
  publicUrl: string;
  altText: string;
  sortOrder: number;
  isHero: boolean;
  accommodation: { name: string } | null;
};
type Studio = { id: string; name: string };

async function csrfToken() {
  const response = await fetch("/api/csrf", { cache: "no-store" });
  if (!response.ok) throw new Error("The form could not start. Reload the page.");
  return ((await response.json()) as { csrfToken: string }).csrfToken;
}

export function PhotosEditor({
  media,
  studios,
  enabled,
}: {
  media: Media[];
  studios: Studio[];
  enabled: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !enabled) return;
    const form = event.currentTarget;
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/media", {
        method: "POST",
        headers: { "x-csrf-token": await csrfToken() },
        body: new FormData(form),
      });
      const result = (await response.json()) as { error?: { message?: string } };
      if (!response.ok)
        throw new Error(result.error?.message ?? "The photo could not be uploaded.");
      form.reset();
      setMessage("Photo uploaded.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The photo could not be uploaded.");
    } finally {
      setBusy(false);
    }
  }
  async function update(id: string, event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    setBusy(true);
    setMessage("");
    try {
      await mutate(
        `/api/admin/media/${id}`,
        {
          altText: values.get("altText"),
          isHero: values.get("isHero") === "on",
          sortOrder: Number(values.get("sortOrder")),
        },
        "PUT",
      );
      setMessage("Photo details saved.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The photo could not be saved.");
    } finally {
      setBusy(false);
    }
  }
  async function remove(id: string) {
    if (!confirm("Delete this photo? This action cannot be undone.")) return;
    setBusy(true);
    setMessage("");
    try {
      await mutate(`/api/admin/media/${id}`, undefined, "DELETE");
      setMessage("Photo deleted.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The photo could not be deleted.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <form className="admin-card admin-form" onSubmit={upload}>
        <h2>Upload a photo</h2>
        {!enabled ? (
          <p className="notice notice-error">
            Local uploads are disabled in this environment. Configure production media storage
            first.
          </p>
        ) : null}
        <label className="field">
          Image
          <input
            type="file"
            name="file"
            accept="image/jpeg,image/png,image/webp"
            required
            disabled={!enabled}
          />
        </label>
        <label className="field">
          Alt text
          <input name="altText" maxLength={300} required disabled={!enabled} />
        </label>
        <label className="field">
          Studio (optional)
          <select name="accommodationId" defaultValue="" disabled={!enabled}>
            <option value="">Whole property</option>
            {studios.map((studio) => (
              <option key={studio.id} value={studio.id}>
                {studio.name}
              </option>
            ))}
          </select>
        </label>
        <button className="button" disabled={busy || !enabled} type="submit">
          Upload photo
        </button>
      </form>
      {message ? (
        <p className="notice" role="status">
          {message}
        </p>
      ) : null}
      <div className="media-grid">
        {media.map((item) => (
          <article className="media-card" key={item.id}>
            <Image src={item.publicUrl} alt={item.altText} width={560} height={380} unoptimized />
            <form onSubmit={(event) => update(item.id, event)}>
              <p>{item.accommodation?.name ?? "Whole property"}</p>
              <label className="field">
                Alt text
                <input name="altText" defaultValue={item.altText} required maxLength={300} />
              </label>
              <label className="field">
                Position
                <input
                  type="number"
                  name="sortOrder"
                  defaultValue={item.sortOrder}
                  min="0"
                  max="10000"
                  required
                />
              </label>
              <label className="checkbox-field">
                <input type="checkbox" name="isHero" defaultChecked={item.isHero} />
                <span>Use as the featured image.</span>
              </label>
              <div className="form-actions">
                <button className="button button-small" disabled={busy}>
                  Save
                </button>
                <button
                  className="text-button danger"
                  type="button"
                  disabled={busy}
                  onClick={() => remove(item.id)}
                >
                  Delete
                </button>
              </div>
            </form>
          </article>
        ))}
      </div>
      {!media.length ? <p className="admin-empty">No owner-managed photos exist.</p> : null}
    </>
  );
}
