'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'
import { useTheme } from 'next-themes'
import { useAppStore } from '@/store/app-store'
import { Badge } from '@/components/ui/badge'
import {
  Globe, Shield, Terminal, Activity, AlertTriangle, MapPin, Users, Clock, TrendingUp,
  Sun, Moon, LogOut,
} from 'lucide-react'

const ROLE_CONFIG: Record<string, { emoji: string; label: string; color: string; badgeBg: string }> = {
  public: { emoji: '🌍', label: 'CITIZEN SAFETY', color: 'text-emerald-400', badgeBg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300' },
  rescue: { emoji: '🛡️', label: 'RESCUE OPS', color: 'text-amber-400', badgeBg: 'bg-amber-500/15 border-amber-500/30 text-amber-300' },
  admin: { emoji: '🏛️', label: 'SEOC ADMIN', color: 'text-red-400', badgeBg: 'bg-red-500/15 border-red-500/30 text-red-300' },
}

interface LiveStats {
  incidents: number
  verified: number
  alerts: number
  teams: number
}

export default function LockedNavbar() {
  const { currentRole, isRealtimeConnected, logout } = useAppStore()
  const { theme, setTheme } = useTheme()
  const [stats, setStats] = useState<LiveStats>({ incidents: 0, verified: 0, alerts: 0, teams: 0 })
  const [elapsed, setElapsed] = useState('2h 15m')
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )

  const roleConfig = ROLE_CONFIG[currentRole] || ROLE_CONFIG.public

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [incRes, altRes] = await Promise.all([
          fetch('/api/incidents?eventId=eq-maharashtra-2025-001'),
          fetch('/api/alerts?targetRole=ALL'),
        ])
        const incidents = incRes.ok ? await incRes.json() : []
        const alerts = altRes.ok ? await altRes.json() : []
        setStats({
          incidents: incidents.length,
          verified: incidents.filter((i: any) => i.status === 'VERIFIED' || i.status === 'HIGHLY_PROBABLE').length,
          alerts: alerts.length,
          teams: 6,
        })
      } catch {}
    }
    fetchStats()
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const quakeTime = new Date(Date.now() - 2 * 60 * 60 * 1000 - 15 * 60 * 1000)
    const update = () => {
      const diff = Date.now() - quakeTime.getTime()
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      setElapsed(`${h}h ${m}m`)
    }
    update()
    const interval = setInterval(update, 60000)
    return () => clearInterval(interval)
  }, [])

  return (
    <header className="sticky top-0 z-50">
      {/* Top bar with gradient */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="flex items-center justify-between px-4 py-2.5">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="flex items-center justify-center size-9 rounded-lg bg-red-500/20 backdrop-blur-sm border border-red-500/30">
                <Activity className="h-5 w-5 text-red-400" />
              </div>
              <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 bg-red-500 rounded-full status-pulse ring-2 ring-slate-900" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold tracking-tight leading-none">QuakeRelief</h1>
                <span className="relative flex items-center justify-center ml-0.5">
                  <span className="absolute w-2 h-2 rounded-full bg-emerald-500 animate-ping opacity-75" />
                  <span className="relative w-2 h-2 rounded-full bg-emerald-500" />
                </span>
                <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">LIVE</span>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-red-500/25 text-red-300 border border-red-500/30 breathing-glow">
                  M6.2 ACTIVE
                </span>
              </div>
              <p className="text-[10px] text-slate-400 leading-none mt-0.5">Multi-Agent Disaster Intelligence</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Elapsed time */}
            <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-300">
              <Clock className="h-3 w-3" />
              <span className="font-mono">T+{elapsed}</span>
            </div>

            {/* Location */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400">
              <MapPin className="h-3 w-3" />
              <span>Latur, MH</span>
            </div>

            {/* Dark mode toggle */}
            {mounted && (
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="flex items-center justify-center size-8 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 transition-colors"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <Sun className="h-3.5 w-3.5 text-amber-300" /> : <Moon className="h-3.5 w-3.5 text-slate-300" />}
              </button>
            )}

            {/* Live indicator */}
            <div className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-full border ${
              isRealtimeConnected
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                : 'bg-red-500/15 text-red-300 border-red-500/30'
            }`}>
              <span className={`h-2 w-2 rounded-full ${
                isRealtimeConnected
                  ? 'bg-emerald-400 connection-pulse'
                  : 'bg-red-400'
              }`} />
              <span className="hidden sm:inline font-semibold tracking-wide">
                {isRealtimeConnected ? 'LIVE' : 'OFFLINE'}
              </span>
            </div>

            {/* Logout button */}
            <button
              onClick={logout}
              className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border border-white/15 bg-white/5 hover:bg-red-500/15 hover:border-red-500/30 hover:text-red-300 transition-all"
              aria-label="Logout"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        {/* Live stats ticker */}
        <div className="border-t border-white/10 bg-black/20">
          <div className="flex items-center justify-center gap-5 sm:gap-8 px-4 py-1.5 text-[11px]">
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="h-3 w-3 text-red-400" />
              <span className="text-slate-400">Incidents:</span>
              <span className="font-bold text-white number-glow-red">{stats.incidents}</span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5">
              <TrendingUp className="h-3 w-3 text-emerald-400" />
              <span className="text-slate-400">Verified:</span>
              <span className="font-bold text-emerald-300">{stats.verified}</span>
              <span className="text-slate-500">/ {stats.incidents}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Activity className="h-3 w-3 text-amber-400" />
              <span className="text-slate-400">Alerts:</span>
              <span className="font-bold text-amber-300">{stats.alerts}</span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5">
              <Users className="h-3 w-3 text-sky-400" />
              <span className="text-slate-400">Teams:</span>
              <span className="font-bold text-sky-300">{stats.teams}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Role badge bar — replaces the role-switching tabs */}
      <div className="bg-card border-b border-red-500/30 shadow-sm">
        <div className="flex items-center justify-center px-4 py-2.5">
          <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-bold uppercase tracking-wider ${roleConfig.badgeBg}`}>
            <span className="text-sm">{roleConfig.emoji}</span>
            <span>{roleConfig.label}</span>
          </div>
        </div>
      </div>
      <div className="h-0.5 bg-gradient-to-r from-transparent via-red-500/40 to-transparent" />
    </header>
  )
}