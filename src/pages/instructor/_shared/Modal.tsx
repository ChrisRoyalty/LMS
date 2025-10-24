// src/components/_shared/Modal.tsx
"use client";
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

export function Modal({
  title,
  subtext,
  onClose,
  children,
  maxWidth = "max-w-xl",
}: {
  title?: string;
  subtext?: string;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
}) {
  // ✅ Persistent modal root (only created once)
  const [root] = useState(() => {
    const el = document.createElement("div");
    el.setAttribute("data-modal-root", "true");
    return el;
  });

  // ✅ Mount and cleanup logic
  useEffect(() => {
    document.body.appendChild(root);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);

    return () => {
      window.removeEventListener("keydown", esc);
      document.body.style.overflow = prev;
      try {
        document.body.removeChild(root);
      } catch {}
    };
  }, [root, onClose]);

  // ✅ Stable portal that won’t re-mount while typing
  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[10000] bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        className="fixed inset-0 z-[10001] grid place-items-center px-4"
        onClick={onClose}
      >
        <div
          className={`w-full ${maxWidth} rounded-2xl border border-neutral-200 bg-white shadow-xl`}
          onClick={(e) => e.stopPropagation()}
        >
          {(title || subtext) && (
            <div className="flex items-start justify-between px-6 py-5 border-b border-neutral-200">
              <div>
                {title && <h3 className="text-lg font-semibold">{title}</h3>}
                {subtext && (
                  <p className="mt-1 text-sm text-neutral-600">{subtext}</p>
                )}
              </div>
              <button
                className="rounded-md p-2 hover:bg-neutral-100"
                onClick={onClose}
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          )}
          <div className="px-6 py-5">{children}</div>
        </div>
      </div>
    </>,
    root
  );
}
