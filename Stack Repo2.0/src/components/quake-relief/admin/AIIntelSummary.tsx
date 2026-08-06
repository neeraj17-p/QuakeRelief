'use client'

import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Eye, Shield, Brain } from 'lucide-react'

// ─── Data Types ────────────────────────────────────────────────────────────────

interface AgentOutput {
  id: string
  agentType: string
  output: string
  reasoningTrace: string | null
}

// ─── Component ─────────────────────────────────────────────────────────────────

interface AIIntelSummaryProps {
  agents: AgentOutput[]
  loading: boolean
}

export default function AIIntelSummary({ agents, loading }: AIIntelSummaryProps) {
  return (
    <section aria-label="AI Intelligence Summary">
      <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 break-words whitespace-normal normal-case block w-full max-w-full overflow-hidden">
        AI Intelligence Summary
      </h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-slate-800/80 border border-slate-700/50 rounded-xl p-5">
              <Skeleton className="h-5 w-32 mb-3" />
              <Skeleton className="h-3 w-full mb-2" />
              <Skeleton className="h-3 w-full mb-2" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          ))
        ) : agents.length === 0 ? (
          <p className="text-sm text-slate-500 col-span-full break-words whitespace-normal normal-case block w-full max-w-full overflow-hidden">
            No AI intelligence outputs available.
          </p>
        ) : (
          agents.map(agent => (
            <div
              key={agent.id}
              className="bg-slate-800/80 border border-slate-700/50 rounded-xl p-5 flex flex-col gap-3"
            >
              <div className="flex items-center gap-2">
                <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm ${
                  agent.agentType === 'SITUATION' ? 'bg-cyan-500/20 text-cyan-400' :
                  agent.agentType === 'PRIORITY' ? 'bg-red-500/20 text-red-400' :
                  'bg-amber-500/20 text-amber-400'
                }`}>
                  {agent.agentType === 'SITUATION' ? <Eye className="h-4 w-4" /> :
                   agent.agentType === 'PRIORITY' ? <Shield className="h-4 w-4" /> :
                   <Brain className="h-4 w-4" />}
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-white break-words whitespace-normal normal-case block w-full max-w-full overflow-hidden">
                    {agent.agentType === 'SITUATION' ? 'Situation Report' :
                     agent.agentType === 'PRIORITY' ? 'Priority Ranking' :
                     'Action Recommendations'}
                  </h3>
                  <p className="text-[10px] text-slate-500 break-words whitespace-normal normal-case block w-full max-w-full overflow-hidden">
                    Agent: {agent.agentType}
                  </p>
                </div>
              </div>
              <ScrollArea className="max-h-72">
                <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-line break-words normal-case block w-full max-w-full overflow-hidden">
                  {agent.output}
                </div>
              </ScrollArea>
            </div>
          ))
        )}
      </div>
    </section>
  )
}