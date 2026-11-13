"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import "./modal.css";

type ModalProps = {
  title: string;
  onClose: () => void;
  children: ReactNode;
};

/**
 * Modale accessible basée sur <dialog> : le navigateur gère le focus,
 * le fond inerte et la touche Échap. À monter seulement quand elle est ouverte :
 *   {open && <Modal title="…" onClose={() => setOpen(false)}>…</Modal>}
 */
export function Modal({ title, onClose, children }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (!dialog.open) dialog.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
      if (dialog.open) dialog.close();
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className="modal"
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault(); // on laisse React démonter la modale
        onClose();
      }}
      onClick={(e) => {
        // clic sur le fond (hors contenu)
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <button type="button" className="modal-close" onClick={onClose} aria-label="Fermer">
        <X size={20} aria-hidden />
      </button>
      <div className="modal-body">
        <h2 id={titleId} className="modal-title">
          {title}
        </h2>
        {children}
      </div>
    </dialog>
  );
}
