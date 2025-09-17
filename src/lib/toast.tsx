import React, { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react'

export type ToastKind = 'success' | 'error' | 'warning' | 'info'

export type ToastInput = {
  kind: ToastKind
  title?: string
  message?: string
  duration?: number // ms; default 3500
}

type Toast = Required<ToastInput> & { id: string }

const listeners = new Set<(t: Toast) => void>()

/** Imperative API: call from anywhere (e.g., showToast({ kind:'success', title:'Saved' })) */
export function showToast(input: ToastInput) {
  const t: Toast = {
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    kind: input.kind,
    title: input.title ?? '',
    message: input.message ?? '',
    duration: input.duration ?? 3500,
  }
  listeners.forEach(fn => fn(t))
}

/** Optional hook if you prefer: const { push } = useToast() */
export function useToast() {
  return useMemo(() => ({ push: showToast }), [])
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    const sub = (t: Toast) => {
      setToasts(prev => [...prev, t])
      if (t.duration > 0) {
        window.setTimeout(() => {
          setToasts(prev => prev.filter(x => x.id !== t.id))
        }, t.duration)
      }
    }
    listeners.add(sub)
    return () => { listeners.delete(sub) }
  }, [])

  const remove = (id: string) => setToasts(prev => prev.filter(t => t.id !== id))

  return (
    <>
      {children}
      {/* Top-right stack */}
      <div className="fixed top-4 right-4 z-[1000] space-y-2 w-[min(28rem,calc(100vw-2rem))]">
        {toasts.map(t => (
          <ToastCard key={t.id} toast={t} onClose={() => remove(t.id)} />
        ))}
      </div>
    </>
  )
}

function ToastCard({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const { kind, title, message } = toast

  const tone =
    kind === 'success'
      ? { ring: 'ring-green-200', bg: 'bg-green-50', text: 'text-green-800', icon: <CheckCircle2 className="h-5 w-5" /> }
      : kind === 'error'
      ? { ring: 'ring-red-200', bg: 'bg-red-50', text: 'text-red-800', icon: <XCircle className="h-5 w-5" /> }
      : kind === 'warning'
      ? { ring: 'ring-amber-200', bg: 'bg-amber-50', text: 'text-amber-900', icon: <AlertTriangle className="h-5 w-5" /> }
      : { ring: 'ring-blue-200', bg: 'bg-blue-50', text: 'text-blue-900', icon: <Info className="h-5 w-5" /> }

  return (
    <div className={`rounded-xl border border-neutral-200 shadow-sm ring-1 ${tone.ring} ${tone.bg}`}>
      <div className="flex items-start gap-3 p-3">
        <div className={`${tone.text}`}>{tone.icon}</div>
        <div className="flex-1">
          {title && <div className={`text-sm font-medium ${tone.text}`}>{title}</div>}
          {message && <div className="text-sm text-neutral-700">{message}</div>}
        </div>
        <button
          className="rounded-md p-1 text-neutral-500 hover:bg-white hover:text-neutral-700"
          onClick={onClose}
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
