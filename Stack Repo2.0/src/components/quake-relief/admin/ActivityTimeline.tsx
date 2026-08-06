'use client'

import { Zap, Radio, MessageSquare, Shield, CheckCircle, Eye, Brain, AlertTriangle, Users, Send } from 'lucide-react'

// ─── Component ─────────────────────────────────────────────────────────────────

export default function ActivityTimeline() {
  return (
    <div className="relative w-full block h-auto clear-both mb-8">
      <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 break-words whitespace-normal normal-case block w-full max-w-full overflow-hidden">
        Activity Timeline
      </h2>
      <div className="bg-slate-800/80 border border-slate-700/50 rounded-xl p-5 max-h-96 overflow-y-auto custom-scrollbar">
        <div className="relative pl-6">
          {/* Vertical line */}
          <div className="absolute left-2.5 top-1 bottom-1 w-0.5 bg-gradient-to-b from-cyan-500/50 via-emerald-500/50 to-slate-700" />
          {[
            { time: '14:32', icon: <Zap className="h-3.5 w-3.5" />, color: 'text-red-400', bg: 'bg-red-500/20', title: 'Earthquake Detected', desc: 'M6.2 seismic event registered at 18.07°N, 76.62°E (Killari). Depth: 12.5km. NCS alert triggered.' },
            { time: '14:33', icon: <Radio className="h-3.5 w-3.5" />, color: 'text-amber-400', bg: 'bg-amber-500/20', title: 'SEOC Activated', desc: 'State Emergency Operations Centre activated. All rescue teams placed on standby. Event ID: eq-maharashtra-2025-001.' },
            { time: '14:35', icon: <MessageSquare className="h-3.5 w-3.5" />, color: 'text-cyan-400', bg: 'bg-cyan-500/20', title: 'Citizen Reports Flooding', desc: '5 clustered civilian reports received for building collapse near Ganj Golai market. Auto-verified via spatiotemporal clustering.' },
            { time: '14:37', icon: <Shield className="h-3.5 w-3.5" />, color: 'text-emerald-400', bg: 'bg-emerald-500/20', title: 'NDRF Team Alpha Deployed', desc: 'NDRF Team Alpha (12 members) dispatched to Priority 1 collapse zone. Status: EN ROUTE. ETA: 8 minutes.' },
            { time: '14:38', icon: <CheckCircle className="h-3.5 w-3.5" />, color: 'text-emerald-400', bg: 'bg-emerald-500/20', title: 'Landslide Verified', desc: 'Ausa Road highway landslide confirmed via 4 civilian reports + aerial imagery. SDRF Battalion 3 deployed.' },
            { time: '14:40', icon: <Eye className="h-3.5 w-3.5" />, color: 'text-violet-400', bg: 'bg-violet-500/20', title: 'AI Situation Report Generated', desc: 'Multi-agent AI system produced comprehensive situation summary. 2 confirmed collapses, 1 active landslide, 1 gas fire identified.' },
            { time: '14:41', icon: <Brain className="h-3.5 w-3.5" />, color: 'text-violet-400', bg: 'bg-violet-500/20', title: 'Priority Ranking Computed', desc: 'AI Priority Agent ranked 5 incident zones. Ganj Golai collapse scored 95/100 (CRITICAL). Renapur school unassigned.' },
            { time: '14:42', icon: <MessageSquare className="h-3.5 w-3.5" />, color: 'text-blue-400', bg: 'bg-blue-500/20', title: 'Medical Alert Broadcast', desc: 'Hospital overload warning issued. Yashwantrao Chavan Rural Hospital at 96% capacity. Medical evacuation corridor recommended.' },
            { time: '14:43', icon: <AlertTriangle className="h-3.5 w-3.5" />, color: 'text-amber-400', bg: 'bg-amber-500/20', title: 'False Report Dismissed', desc: 'Social media claim of Nilanga bridge collapse marked FALSE. Contradicted by PWD Tier 1 ground inspection.' },
            { time: '14:45', icon: <Users className="h-3.5 w-3.5" />, color: 'text-emerald-400', bg: 'bg-emerald-500/20', title: 'Medical Team On-Site', desc: 'Medical Response Team 1 arrived at Shivaji Nagar market casualty zone. Treating multiple injuries.' },
            { time: '14:47', icon: <Radio className="h-3.5 w-3.5" />, color: 'text-amber-400', bg: 'bg-amber-500/20', title: 'Aftershock Warning Issued', desc: 'Seismologists predict M4-5 aftershocks in next 12 hours. All teams maintain alert. Public advised to stay in open areas.' },
            { time: '14:50', icon: <Send className="h-3.5 w-3.5" />, color: 'text-blue-400', bg: 'bg-blue-500/20', title: 'SEOC Command Broadcast', desc: 'Dispatch order issued: Fire Station Latur to Renapur school collapse. Army Engineering Corps on standby for heavy equipment.' },
          ].map((entry, idx) => (
            <div key={idx} className="relative mb-3.5 last:mb-0 group">
              <div className={`absolute -left-3.5 top-1 w-3 h-3 rounded-full border-2 border-slate-800 ${entry.bg} shadow-sm`} />
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`${entry.color} shrink-0`}>{entry.icon}</span>
                    <span className="text-xs font-semibold text-slate-200 break-words whitespace-normal normal-case block w-full max-w-full overflow-hidden">{entry.title}</span>
                    <span className="text-[10px] text-slate-500 shrink-0 ml-auto font-mono">{entry.time}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed break-words whitespace-normal normal-case block w-full max-w-full overflow-hidden">
                    {entry.desc}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}