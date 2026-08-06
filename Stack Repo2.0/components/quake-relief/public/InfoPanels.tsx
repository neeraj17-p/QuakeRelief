'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'
import {
  ShieldCheck, AlertTriangle, Cloud, Sun, Activity,
  XCircle, CheckCircle, BarChart3, ArrowUpRight, TrendingUp, Bell, Radio, Clock,
} from 'lucide-react'

// ─── Props ───────────────────────────────────────────────────────────────────

interface InfoPanelsProps {
  loading: boolean
  animatedSafe: number
  animatedHelp: number
  animatedAlerts: number
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function InfoPanels({
  loading,
  animatedSafe,
  animatedHelp,
  animatedAlerts,
}: InfoPanelsProps) {
  return (
    <>
      {/* ═══════════════ 5b. SEISMIC & WEATHER STATUS ═══════════════ */}
      <section aria-label="Seismic & Weather Status">
        <Card className="glass-card card-glow">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Cloud className="size-5 text-sky-500" />
              Seismic &amp; Weather Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">Magnitude</p>
                <p className="text-sm font-bold text-red-600">M6.2</p>
                <p className="text-xs text-muted-foreground">Main Shock</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">Depth</p>
                <p className="text-sm font-bold">12.5 km</p>
                <p className="text-xs text-muted-foreground">Focal Depth</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Sun className="size-3 text-amber-500" /> Weather
                </p>
                <p className="text-sm font-bold">Clear Skies</p>
                <p className="text-xs text-muted-foreground">No rainfall 48h</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Activity className="size-3 text-orange-500" /> Aftershocks
                </p>
                <p className="text-sm font-bold">3 detected</p>
                <p className="text-xs text-muted-foreground">M2.1 – M3.1 range</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ═══════════════ 6. EVACUATION GUIDANCE ═══════════════ */}
      <section aria-label="Evacuation Guidance">
        <Card className="border-amber-200 bg-amber-50/40 card-glow border-l-4 border-l-emerald-500">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg text-amber-800">
              <AlertTriangle className="size-5" />
              Evacuation Guidance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2.5">
              <li className="flex items-start gap-2.5 text-sm text-foreground/90">
                <span className="inline-flex items-center justify-center size-6 rounded-full bg-emerald-500 text-white text-xs font-bold shrink-0 mt-0.5 badge-pulse">1</span>
                <span>Move to open areas away from buildings</span>
              </li>
              <li className="flex items-start gap-2.5 text-sm text-foreground/90">
                <span className="inline-flex items-center justify-center size-6 rounded-full bg-emerald-500/70 text-white text-xs font-bold shrink-0 mt-0.5">2</span>
                <span>Follow designated evacuation routes marked on the map</span>
              </li>
              <li className="flex items-start gap-2.5 text-sm text-foreground/90">
                <span className="inline-flex items-center justify-center size-6 rounded-full bg-emerald-500/70 text-white text-xs font-bold shrink-0 mt-0.5">3</span>
                <span>Do not re-enter damaged structures</span>
              </li>
              <li className="flex items-start gap-2.5 text-sm text-foreground/90">
                <span className="inline-flex items-center justify-center size-6 rounded-full bg-emerald-500/70 text-white text-xs font-bold shrink-0 mt-0.5">4</span>
                <span>Keep phone lines free for emergencies</span>
              </li>
              <li className="flex items-start gap-2.5 text-sm text-foreground/90">
                <span className="inline-flex items-center justify-center size-6 rounded-full bg-emerald-500/70 text-white text-xs font-bold shrink-0 mt-0.5">5</span>
                <span>Listen for official alerts on this portal</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </section>

      {/* ── Divider: Safety Overview ── */}
      <div className="flex items-center gap-3 py-4">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        <span className="text-xs font-medium text-muted-foreground tracking-wider uppercase flex items-center gap-1.5">
          <BarChart3 className="h-3 w-3" /> SAFETY OVERVIEW
        </span>
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>

      {/* ═══════════════ 7. SAFETY STATS ═══════════════ */}
      <section aria-label="Safety Statistics">
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-5 space-y-3">
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-4 w-28" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Safe Check-Ins */}
            <Card className="relative overflow-hidden bg-gradient-to-br from-emerald-50 to-white border-emerald-100 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 glass-card card-glow card-stagger" style={{ animationDelay: '0ms' }}>
              <ShieldCheck className="absolute -right-3 -bottom-3 size-24 text-emerald-500 opacity-10" />
              <CardContent className="relative p-5 space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-3xl font-bold text-emerald-700">{animatedSafe}</p>
                  <span className="flex items-center gap-0.5 text-xs font-medium text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded">
                    <ArrowUpRight className="size-3" />
                    Live
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">Safe Check-Ins</p>
              </CardContent>
            </Card>

            {/* Help Requests */}
            <Card className="relative overflow-hidden bg-gradient-to-br from-red-50 to-white border-red-100 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 glass-card card-glow card-stagger" style={{ animationDelay: '100ms' }}>
              <AlertTriangle className="absolute -right-3 -bottom-3 size-24 text-red-500 opacity-10" />
              <CardContent className="relative p-5 space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-3xl font-bold text-red-700">{animatedHelp}</p>
                  <span className="flex items-center gap-0.5 text-xs font-medium text-red-600 bg-red-100 px-1.5 py-0.5 rounded">
                    <TrendingUp className="size-3" />
                    Live
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">Help Requests</p>
              </CardContent>
            </Card>

            {/* Active Alerts */}
            <Card className="relative overflow-hidden bg-gradient-to-br from-amber-50 to-white border-amber-100 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 glass-card card-glow card-stagger" style={{ animationDelay: '200ms' }}>
              <Bell className="absolute -right-3 -bottom-3 size-24 text-amber-500 opacity-10" />
              <CardContent className="relative p-5 space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-3xl font-bold text-amber-700">{animatedAlerts}</p>
                  <span className="flex items-center gap-0.5 text-xs font-medium text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded">
                    <Radio className="size-3" />
                    Live
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">Active Alerts</p>
              </CardContent>
            </Card>

            {/* Response Time */}
            <Card className="relative overflow-hidden bg-gradient-to-br from-slate-50 to-white border-slate-200 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 glass-card card-glow card-stagger" style={{ animationDelay: '300ms' }}>
              <Clock className="absolute -right-3 -bottom-3 size-24 text-slate-400 opacity-10" />
              <CardContent className="relative p-5 space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-3xl font-bold text-slate-700">12 min</p>
                  <span className="flex items-center gap-0.5 text-xs font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                    <span className="size-1.5 rounded-full bg-emerald-500" />
                    Avg
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">Response Time</p>
              </CardContent>
            </Card>
          </div>
        )}
      </section>

      {/* ═══════════════ 8. DOS & DON'TS (moved to bottom) ═══════════════ */}
      <section aria-label="Post-Earthquake Safety Guide">
        <Card className="glass-card card-glow">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShieldCheck className="size-5 text-emerald-600" />
              Post-Earthquake Safety Guide
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="multiple" className="w-full">
              <AccordionItem value="dos" className="border-emerald-200">
                <AccordionTrigger className="hover:no-underline py-3">
                  <span className="flex items-center gap-2 text-emerald-700 font-semibold text-sm">
                    <CheckCircle className="size-4 text-emerald-600" />
                    Do&apos;s After an Earthquake
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2.5 pt-1">
                    {[
                      { title: 'Drop, Cover, and Hold On', desc: 'Drop to hands and knees, cover head/neck under sturdy furniture, hold on until shaking stops' },
                      { title: 'Evacuate to Open Ground', desc: 'Move away from buildings, trees, power lines to open areas after shaking stops' },
                      { title: 'Check for Injuries', desc: 'Provide first aid to those around you. Do not move seriously injured unless in danger' },
                      { title: 'Use Stairs, Not Elevators', desc: 'After earthquake, always use stairs. Elevators may be damaged or lose power' },
                      { title: 'Listen to Official Alerts', desc: 'Follow IMD, NDRF, and District Administration instructions via radio/official channels' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <span className="flex items-center justify-center size-6 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground">{item.title}</p>
                          <p className="text-xs text-muted-foreground">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="donts" className="border-red-200">
                <AccordionTrigger className="hover:no-underline py-3">
                  <span className="flex items-center gap-2 text-red-700 font-semibold text-sm">
                    <XCircle className="size-4 text-red-600" />
                    Don&apos;ts After an Earthquake
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2.5 pt-1">
                    {[
                      { title: 'Do Not Run Outside During Shaking', desc: 'Falling debris is the primary cause of earthquake injuries' },
                      { title: 'Do Not Use Matches or Lighters', desc: 'Gas leaks may be present. Use flashlights only' },
                      { title: 'Do Not Stand Near Windows/Glass', desc: 'Glass shattering causes severe injuries in earthquakes' },
                      { title: 'Do Not Enter Damaged Buildings', desc: 'Aftershocks can cause further collapse. Wait for structural assessment' },
                      { title: 'Do Not Spread Unverified Rumors', desc: 'Share only official information. False reports can cause panic and misdirect rescue efforts' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <span className="flex items-center justify-center size-6 rounded-full bg-red-100 text-red-700 text-xs font-bold shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground">{item.title}</p>
                          <p className="text-xs text-muted-foreground">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </section>
    </>
  )
}