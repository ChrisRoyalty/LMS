import { useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

export function Modal({
  onClose, title, subtext, children, maxWidth = 'max-w-2xl',
}: { onClose: () => void; title: string; subtext?: string; children: React.ReactNode; maxWidth?: string }) {
  const el = useMemo(() => {
    const d = document.createElement('div')
    d.setAttribute('data-modal-root', 'true')
    return d
  }, [])

  useEffect(() => {
    document.body.appendChild(el)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
      try { document.body.removeChild(el) } catch {}
    }
  }, [el, onClose])

  return createPortal(
    <>
      <div className="fixed inset-0 z-[10000] h-screen w-screen bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="fixed inset-0 z-[10001] grid place-items-center px-4" onClick={onClose}>
        <div
          role="dialog" aria-modal="true"
          className={`w-full ${maxWidth} rounded-2xl border border-neutral-200 bg-white shadow-xl`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between px-6 py-5 border-b border-neutral-200">
            <div>
              <h3 className="text-lg font-semibold">{title}</h3>
              {subtext && <p className="mt-1 text-sm text-neutral-600">{subtext}</p>}
            </div>
            <button className="rounded-md p-2 hover:bg-neutral-100" onClick={onClose} aria-label="Close">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="px-6 py-5 overflow-visible">{children}</div>
        </div>
      </div>
    </>,
    el
  )
}
