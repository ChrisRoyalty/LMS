// src/components/transitions/PageFade.tsx
import React, { useEffect, useState } from 'react'

type Props = {
  /** Children to animate in */
  children: React.ReactNode
  /** Duration of the entrance animation in ms (default 220) */
  durationMs?: number
  /** Initial Y offset in px (default 4) */
  y?: number
}

const PageFade: React.FC<Props> = ({ children, durationMs = 220, y = 4 }) => {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // trigger on next frame for smooth transition
    const id = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(id)
  }, [])

  // Respect reduced motion as much as possible
  const prefersReduced =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const style: React.CSSProperties = prefersReduced
    ? { opacity: 1, transform: 'none' }
    : {
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'translateY(0px)' : `translateY(${y}px)`,
        transition: `opacity ${durationMs}ms ease, transform ${durationMs}ms ease`,
        willChange: 'opacity, transform',
      }

  return <div style={style} className="min-h-[1px]">{children}</div>
}

export default PageFade
