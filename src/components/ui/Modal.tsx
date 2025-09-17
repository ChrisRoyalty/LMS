// src/components/ui/Modal.tsx
import { X } from 'lucide-react'

export function Modal({
  open, onClose, title, subtitle, children, footer, maxWidth = 'max-w-3xl',
}: {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  children: React.ReactNode
  footer?: React.ReactNode
  maxWidth?: string
}) {
  if (!open) return null
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />
      <div className="fixed inset-0 z-50 grid place-items-center p-4">
        <div className={`w-full ${maxWidth} rounded-2xl border border-neutral-200 bg-white shadow-xl`}>
          <div className="flex items-start justify-between p-5 border-b border-neutral-200">
            <div>
              <h3 className="text-[16px] font-semibold text-neutral-900">{title}</h3>
              {subtitle && <p className="text-sm text-neutral-500">{subtitle}</p>}
            </div>
            <button className="rounded-md p-1.5 hover:bg-neutral-100" onClick={onClose}>
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="p-5">{children}</div>
          {footer && <div className="p-5 pt-4 border-t border-neutral-200">{footer}</div>}
        </div>
      </div>
    </>
  )
}
