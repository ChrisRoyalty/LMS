// src/components/ui/Select.tsx
import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Check } from 'lucide-react'

export function Select({
  value,
  onChange,
  placeholder = 'Select…',
  options,
}: {
  value?: string
  onChange: (v: string) => void
  placeholder?: string
  options: { label: string; value: string }[]
}) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(
    Math.max(0, options.findIndex(o => o.value === value))
  )
  const ref = useRef<HTMLDivElement>(null)
  const selected = options.find(o => o.value === value)

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!ref.current) return
      if (!ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  useEffect(() => {
    setActive(Math.max(0, options.findIndex(o => o.value === value)))
  }, [value, options])

  return (
    <div className="relative" ref={ref}>
      {/* Trigger matches the gray input from your Figma */}
      <button
        type="button"
        className="input w-full text-left pr-10"
        onClick={() => setOpen(o => !o)}
      >
        {selected ? (
          selected.label
        ) : (
          <span className="text-neutral-400">{placeholder}</span>
        )}
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500 pointer-events-none" />
      </button>

      {open && (
        <div className="absolute left-0 right-0 mt-2 z-30 rounded-xl border border-neutral-200 bg-white shadow-lg overflow-hidden">
          <ul className="py-1 max-h-60 overflow-auto">
            {options.map((opt, idx) => {
              const isSel = opt.value === value
              const isAct = idx === active
              return (
                <li
                  key={opt.value}
                  onMouseEnter={() => setActive(idx)}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    onChange(opt.value)
                    setOpen(false)
                  }}
                  className={[
                    'px-3 py-2 cursor-pointer flex items-center justify-between',
                    isAct ? 'bg-cyan-500 text-white' : 'hover:bg-neutral-50',
                    isSel && !isAct ? 'text-neutral-900' : ''
                  ].join(' ')}
                >
                  <span>{opt.label}</span>
                  {isSel && <Check className="h-4 w-4 opacity-90" />}
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
