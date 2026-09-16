"use client"

import { useEffect, useRef, useState } from "react"
import TapSimulation from "./tap-simulation"

// Live clock for the hero simulation. `window.__simTime` (set by
// scripts/capture-sim.mjs) overrides the clock so frames can be rendered
// deterministically for video capture.
export default function HeroSimulation() {
  const [timeMs, setTimeMs] = useState(0)
  const start = useRef<number | null>(null)

  useEffect(() => {
    let raf: number
    const tick = (now: number) => {
      const forced = (window as unknown as { __simTime?: number }).__simTime
      if (typeof forced === "number") {
        setTimeMs(forced)
      } else {
        if (start.current === null) start.current = now
        setTimeMs(now - start.current)
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div className="relative">
      <div className="absolute -inset-8 bg-teal-400 rounded-full opacity-20 blur-3xl" />
      <TapSimulation timeMs={timeMs} />
    </div>
  )
}
