// src/components/ui/UltraLoader.tsx
import React from 'react'

export function UltraLoader({
  show,
  label = 'Please wait…',
}: { show: boolean; label?: string }) {
  if (!show) return null
  return (
    <>
      <div className="fixed inset-0 z-[9999] bg-neutral-950/30 backdrop-blur-[2px]" />
      <div className="fixed inset-0 z-[10000] grid place-items-center p-4">
        <div className="w-full max-w-xs rounded-2xl border border-neutral-200 bg-white/90 shadow-2xl">
          <div className="px-5 pb-5 pt-4">
            <div className="mx-auto mb-3 mt-1 h-8 w-8">
              {/* equalizer animation */}
              <div className="flex h-8 w-8 items-end justify-between">
                <span className="block h-2 w-1.5 rounded bg-neutral-900 animate-ultraBar [animation-delay:-240ms]" />
                <span className="block h-3 w-1.5 rounded bg-neutral-900 animate-ultraBar [animation-delay:-120ms]" />
                <span className="block h-5 w-1.5 rounded bg-neutral-900 animate-ultraBar" />
                <span className="block h-3 w-1.5 rounded bg-neutral-900 animate-ultraBar [animation-delay:-120ms]" />
                <span className="block h-2 w-1.5 rounded bg-neutral-900 animate-ultraBar [animation-delay:-240ms]" />
              </div>
            </div>
            <p className="text-center text-sm font-medium text-neutral-900">{label}</p>
          </div>
        </div>
      </div>

      {/* Local CSS for the bar animation (works without editing tailwind.config) */}
      <style>{`
        @keyframes ultraBar {
          0% { transform: scaleY(0.6); opacity: .4; }
          50% { transform: scaleY(1.4); opacity: 1; }
          100% { transform: scaleY(0.6); opacity: .4; }
        }
        .animate-ultraBar {
          animation: ultraBar .9s ease-in-out infinite;
          transform-origin: bottom;
        }
      `}</style>
    </>
  )
}
