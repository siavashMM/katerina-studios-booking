"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Dialog, DialogTrigger, Heading, Modal, ModalOverlay } from "react-aria-components";
import { mutate } from "@/features/booking/ui/http";
import { useTranslation } from "@/i18n/client";

export function ReservationActions({
  id,
  status,
  canComplete,
}: {
  id: string;
  status: string;
  canComplete: boolean;
}) {
  const { Translate } = useTranslation();
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function act(action: string) {
    if (busy) return;
    setBusy(true);
    setMessage("");
    try {
      await mutate(
        `/api/admin/reservations/${id}/${action}`,
        action === "confirm" ? { externalChannelsChecked: checked } : {},
      );
      setMessage(Translate.admin.actions.updated);
      router.refresh();
    } catch {
      setMessage(Translate.admin.actions.error);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="admin-actions">
      <h2>{Translate.admin.actions.title}</h2>
      {message ? (
        <p role="status" className="notice">
          {message}
        </p>
      ) : null}
      {status === "PENDING" ? (
        <>
          <label className="checkbox-field">
            <input
              type="checkbox"
              checked={checked}
              onChange={(event) => setChecked(event.target.checked)}
            />
            <span>{Translate.admin.actions.channels}</span>
          </label>
          <button className="button" disabled={!checked || busy} onClick={() => act("confirm")}>
            {Translate.admin.actions.confirm}
          </button>
        </>
      ) : null}
      {status === "CONFIRMED" && canComplete ? (
        <button className="button" disabled={busy} onClick={() => act("complete")}>
          {Translate.admin.actions.complete}
        </button>
      ) : null}
      {status === "CONFIRMED" ? (
        <Link className="button button-secondary" href={`/admin/messages?reservation=${id}`}>
          Send message
        </Link>
      ) : null}
      {status === "PENDING" || status === "CONFIRMED" ? (
        <DialogTrigger>
          <Button className="text-button danger" isDisabled={busy}>
            {status === "PENDING"
              ? Translate.admin.actions.cancelRequest
              : Translate.admin.actions.cancelReservation}
          </Button>
          <ModalOverlay className="admin-modal-overlay" isDismissable>
            <Modal className="admin-modal">
              <Dialog>
                {({ close }) => (
                  <>
                    <Heading slot="title">{Translate.admin.actions.cancelTitle}</Heading>
                    <p>{Translate.admin.actions.cancelText}</p>
                    <div className="form-actions">
                      <Button className="button button-secondary" onPress={close}>
                        {Translate.admin.actions.keep}
                      </Button>
                      <Button
                        className="button"
                        onPress={() => {
                          close();
                          void act("cancel");
                        }}
                      >
                        {Translate.admin.actions.confirmCancellation}
                      </Button>
                    </div>
                  </>
                )}
              </Dialog>
            </Modal>
          </ModalOverlay>
        </DialogTrigger>
      ) : (
        <p>{Translate.admin.actions.none}</p>
      )}
    </section>
  );
}
