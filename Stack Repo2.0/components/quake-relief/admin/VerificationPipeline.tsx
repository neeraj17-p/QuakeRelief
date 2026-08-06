'use client'

import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

// ─── Data Types ────────────────────────────────────────────────────────────────

interface VerificationEntry {
  id: string
  sourceTier: string
  sourceType: string
  rawContent: string
  extractedData: string | null
  status: string
  confidence: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const statusColor = (status: string) => {
  switch (status) {
    case 'VERIFIED': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
    case 'HIGHLY_PROBABLE': return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
    case 'FALSE': return 'bg-red-500/20 text-red-400 border-red-500/30'
    case 'UNVERIFIED': return 'bg-slate-500/20 text-slate-400 border-slate-500/30'
    default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30'
  }
}

// ─── Component ─────────────────────────────────────────────────────────────────

interface VerificationPipelineProps {
  verifications: VerificationEntry[]
  loading: boolean
  pendingCount: number
  onVerify: (id: string) => void
  onReject: (id: string) => void
}

export default function VerificationPipeline({
  verifications,
  loading,
  pendingCount,
  onVerify,
  onReject,
}: VerificationPipelineProps) {
  return (
    <section aria-label="Data Verification Pipeline">
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 break-words whitespace-normal normal-case block w-full max-w-full overflow-hidden">
          Data Verification Pipeline
        </h2>
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-[10px] font-bold text-amber-400 animate-pulse">
          {pendingCount} Pending
        </span>
      </div>
      <div className="w-full max-h-[350px] overflow-y-auto flex flex-col gap-y-3 relative block bg-slate-800/80 border border-slate-700/50 rounded-xl p-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-5 w-16 shrink-0" />
              <Skeleton className="h-5 w-12 shrink-0" />
              <Skeleton className="h-2 flex-1 max-w-20" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-7 w-16 shrink-0" />
              <Skeleton className="h-7 w-16 shrink-0" />
            </div>
          ))
        ) : verifications.length === 0 ? (
          <p className="text-sm text-slate-500 break-words whitespace-normal normal-case block w-full max-w-full overflow-hidden">
            No verification entries loaded.
          </p>
        ) : (
          verifications.map(v => {
            const isActionable = v.status !== 'VERIFIED' && v.status !== 'FALSE'
            return (
              <div
                key={v.id}
                className="flex items-center gap-3 w-full"
              >
                {/* Left: Status badge + Source tier badge + confidence bar */}
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="outline" className={`text-[10px] border ${statusColor(v.status)}`}>
                    {v.status}
                  </Badge>
                  <Badge variant="outline" className="text-[10px] bg-slate-700/50 text-slate-300 border-slate-600/50">
                    {v.sourceTier}
                  </Badge>
                  <div className="flex items-center gap-1.5 min-w-[60px]">
                    <div className="flex-1 h-1.5 rounded-full bg-slate-700 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${(v.confidence * 100)}%`,
                          background: v.confidence > 0.8 ? '#22c55e' : v.confidence > 0.5 ? '#f59e0b' : '#ef4444',
                        }}
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0">{Math.round(v.confidence * 100)}%</span>
                  </div>
                </div>

                {/* Center: Raw content text */}
                <p className="text-xs text-slate-300 line-clamp-1 flex-1 min-w-0 break-words whitespace-normal normal-case block w-full max-w-full overflow-hidden">
                  {v.rawContent}
                </p>

                {/* Right: Action buttons */}
                {isActionable && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => onVerify(v.id)}
                      className="shrink-0 px-2.5 py-1.5 rounded-lg bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-semibold hover:bg-emerald-600/30 transition-colors"
                    >
                      ✔️ Verify
                    </button>
                    <button
                      onClick={() => onReject(v.id)}
                      className="shrink-0 px-2.5 py-1.5 rounded-lg bg-red-600/20 border border-red-500/40 text-red-400 text-[10px] font-semibold hover:bg-red-600/30 transition-colors"
                    >
                      ❌ Reject
                    </button>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </section>
  )
}