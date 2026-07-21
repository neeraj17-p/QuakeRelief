'use client'

import { useState, useEffect, useCallback, useSyncExternalStore } from 'react'
import { Activity, Phone, MapPin, Clock, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

// Hydration-safe mounting (same pattern as navbar)
const emptySubscribe = () => () => {}
function useHydrated() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  )
}

// Earthquake time: 2h 15m ago from initial render
const EARTHQUAKE_TIME_OFFSET_MS = 2 * 60 * 60 * 1000 + 15 * 60 * 1000

export default function DisasterFooter() {
  const hydrated = useHydrated()
  const [now, setNow] = useState(Date.now())

  // Compute earthquake time as a stable ref based on first render
  const [earthquakeTime] = useState(() => Date.now() - EARTHQUAKE_TIME_OFFSET_MS)

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])

  const formatElapsed = useCallback(() => {
    const diff = now - earthquakeTime
    const hours = Math.floor(diff / 3600000)
    const minutes = Math.floor((diff % 3600000) / 60000)
    const seconds = Math.floor((diff % 60000) / 1000)
    return `T+${hours}h ${minutes}m ${seconds}s`
  }, [now, earthquakeTime])

  if (!hydrated) {
    // Return a placeholder with the same dimensions to prevent layout shift
    return (
      <footer className="relative w-full block clear-both mt-16 bg-slate-950 px-6 py-8 border-t border-slate-800 z-10">
        <div className="max-w-6xl mx-auto" />
      </footer>
    )
  }

  return (
    <footer className="relative w-full block clear-both mt-16 bg-slate-950 px-6 py-8 border-t border-slate-800 z-10">
      <div className="max-w-6xl mx-auto">
        {/* 3-section grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {/* Section 1: Branding */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-lg bg-red-600/20 border border-red-500/30 flex items-center justify-center">
                <Activity className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight">QuakeRelief</h3>
                <p className="text-[11px] text-slate-400 leading-tight">Multi-Agent Disaster Intelligence Platform</p>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
              <MapPin className="h-3 w-3" />
              Built for SEOC, Maharashtra
            </p>
          </div>

          {/* Section 2: Quick Reference */}
          <div className="space-y-2">
            <h4 className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-2">Quick Reference</h4>
            <div className="grid grid-cols-1 gap-1.5 text-[11px]">
              <div className="flex items-center gap-2 text-slate-300">
                <MapPin className="h-3 w-3 text-red-400 shrink-0" />
                <span className="text-slate-400">Epicentre:</span>
                <span className="font-mono text-white">18.0700°N, 76.6200°E (Killari, Latur)</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Zap className="h-3 w-3 text-orange-400 shrink-0" />
                <span className="text-slate-400">Magnitude:</span>
                <span className="font-mono text-white">M6.2</span>
                <span className="text-slate-600">|</span>
                <span className="text-slate-400">Depth:</span>
                <span className="font-mono text-white">15km</span>
              </div>
              <div className="flex items-start gap-2 text-slate-300">
                <Clock className="h-3 w-3 text-sky-400 shrink-0 mt-0.5" />
                <span className="text-slate-400 shrink-0">Sources:</span>
                <span className="text-slate-300">NCS, IMD, Civilian Reports, Social Media</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Clock className="h-3 w-3 text-emerald-400 shrink-0" />
                <span className="text-slate-400">Last Updated:</span>
                <span className="font-mono text-emerald-400 font-semibold">{formatElapsed()}</span>
              </div>
            </div>
          </div>

          {/* Section 3: Emergency Contacts */}
          <div className="space-y-2">
            <h4 className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-2">Emergency Contacts</h4>
            <div className="space-y-1.5 text-[11px]">
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-400">State EOC Helpline</span>
                <span className="font-mono font-bold text-white bg-red-600/20 border border-red-500/30 px-2 py-0.5 rounded text-xs">1077</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-400">NDRF Control Room</span>
                <span className="font-mono text-slate-300 text-[10px]">+91-11-2610-7866</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-400">District Control</span>
                <span className="font-mono text-slate-300 text-[10px]">+91-2382-221010</span>
              </div>
              <Button
                size="sm"
                className="w-full mt-2 bg-red-600 hover:bg-red-700 text-white text-xs h-8 font-semibold"
                onClick={() => toast.info('Emergency hotline: 1077', { description: 'Please call the State EOC helpline for immediate assistance.' })}
              >
                <Phone className="h-3.5 w-3.5 mr-1.5" />
                Report Emergency
              </Button>
            </div>
          </div>
        </div>

        {/* Bottom line */}
        <div className="mt-5 pt-3 border-t border-slate-700/50 text-center">
          <p className="text-[10px] text-slate-500">
            © 2025 QuakeRelief | AI-Powered Situational Awareness | Data refreshes every 30s
          </p>
        </div>
      </div>
    </footer>
  )
}