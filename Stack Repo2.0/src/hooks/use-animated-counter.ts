'use client'

import { useState, useEffect } from 'react'

/**
 * Animates a number counting from 0 to `target` over `duration` ms
 * using an ease-out cubic curve. Returns 0 when target is 0.
 */
export function useAnimatedCounter(target: number, duration = 1200): number {
  const [count, setCount] = useState(target)

  useEffect(() => {
    if (target === 0) return
    const startTime = performance.now()

    function step(now: number) {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(eased * target))
      if (progress < 1) {
        requestAnimationFrame(step)
      }
    }

    requestAnimationFrame(step)
  }, [target, duration])

  return target === 0 ? 0 : count
}