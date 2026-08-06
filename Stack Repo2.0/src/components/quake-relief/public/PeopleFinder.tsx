'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Search, Phone } from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

interface SafetyCheckIn {
  id: string
  personName: string
  phone: string | null
  status: string
  createdAt: string
  note: string | null
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface PeopleFinderProps {
  safetyCheckIns: SafetyCheckIn[]
  searchQuery: string
  onSearchChange: (v: string) => void
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function PeopleFinder({ safetyCheckIns, searchQuery, onSearchChange }: PeopleFinderProps) {
  return (
    <section aria-label="People Finder">
      <Card className="glass-card card-glow">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <span className="text-base">👥</span>
            People Finder
          </CardTitle>
          <p className="text-xs text-muted-foreground">Search for registered safe check-ins</p>
        </CardHeader>
        <CardContent>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 h-10 text-sm"
            />
          </div>
          {!searchQuery.trim() ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Search by name to find registered check-ins...
            </p>
          ) : (() => {
            const query = searchQuery.trim().toLowerCase()
            const results = safetyCheckIns.filter(c =>
              c.personName.toLowerCase().includes(query)
            )
            const shown = results.slice(0, 5)
            const remaining = results.length - 5
            if (results.length === 0) {
              return (
                <p className="text-sm text-muted-foreground text-center py-6">
                  No results found
                </p>
              )
            }
            return (
              <div className="space-y-2">
                {shown.map((checkIn) => {
                  const statusBadge = checkIn.status === 'SAFE'
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                    : checkIn.status === 'UNABLE'
                      ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'
                      : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                  const statusLabel = checkIn.status === 'SAFE' ? 'Safe' : checkIn.status === 'UNABLE' ? 'Unable' : 'Injured'
                  return (
                    <div key={checkIn.id} className="flex items-center justify-between gap-3 rounded-lg border bg-muted/30 px-3 py-2.5">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="inline-flex items-center justify-center size-8 rounded-full bg-muted shrink-0 text-sm font-bold text-foreground/70">
                          {checkIn.personName.charAt(0).toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{checkIn.personName}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {checkIn.phone && (
                              <span className="inline-flex items-center gap-0.5">
                                <Phone className="size-2.5" />
                                {checkIn.phone}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusBadge}`}>
                          {statusLabel}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(checkIn.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  )
                })}
                {remaining > 0 && (
                  <p className="text-xs text-muted-foreground text-center pt-1">
                    and {remaining} more...
                  </p>
                )}
              </div>
            )
          })()}
        </CardContent>
      </Card>
    </section>
  )
}