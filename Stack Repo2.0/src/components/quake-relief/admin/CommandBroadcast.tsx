'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Clock, Send, Loader2, AlertTriangle, Flame, Info, FileText } from 'lucide-react'

// ─── Data Types ────────────────────────────────────────────────────────────────

export type CriticalityLevel = 'critical' | 'evacuation' | 'advisory' | 'routine'

interface Broadcast {
  id: string
  message: string
  heading?: string
  criticality?: string
  sentBy: string
  createdAt: string
}

// ─── Criticality Level Config ─────────────────────────────────────────────────

const CRITICALITY_OPTIONS: Array<{
  value: CriticalityLevel
  label: string
  icon: typeof AlertTriangle
  dotClass: string
  activeBg: string
  activeBorder: string
  activeText: string
  badgeClass: string
}> = [
  {
    value: 'critical',
    label: 'Critical',
    icon: AlertTriangle,
    dotClass: 'bg-red-500',
    activeBg: 'bg-red-500/15 border-red-500/50 text-red-300',
    activeBorder: 'border-red-500/50',
    activeText: 'text-red-300',
    badgeClass: 'bg-red-500/20 text-red-300 border border-red-500/40',
  },
  {
    value: 'evacuation',
    label: 'Evacuation',
    icon: Flame,
    dotClass: 'bg-orange-500',
    activeBg: 'bg-orange-500/15 border-orange-500/50 text-orange-300',
    activeBorder: 'border-orange-500/50',
    activeText: 'text-orange-300',
    badgeClass: 'bg-orange-500/20 text-orange-300 border border-orange-500/40',
  },
  {
    value: 'advisory',
    label: 'Advisory',
    icon: Info,
    dotClass: 'bg-yellow-500',
    activeBg: 'bg-yellow-500/15 border-yellow-500/50 text-yellow-300',
    activeBorder: 'border-yellow-500/50',
    activeText: 'text-yellow-300',
    badgeClass: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40',
  },
  {
    value: 'routine',
    label: 'Routine Update',
    icon: FileText,
    dotClass: 'bg-slate-400',
    activeBg: 'bg-slate-500/15 border-slate-500/50 text-slate-300',
    activeBorder: 'border-slate-500/50',
    activeText: 'text-slate-300',
    badgeClass: 'bg-slate-500/20 text-slate-300 border border-slate-500/40',
  },
]

function getCriticalityBadge(level: string): string {
  const opt = CRITICALITY_OPTIONS.find(o => o.value === level)
  return opt?.badgeClass ?? 'bg-slate-500/20 text-slate-300 border border-slate-500/40'
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const CHANNEL_DESC: Record<string, string> = {
  public: 'Pushes warnings straight to the Citizen Portal Public Alerts Banner.',
  tactical: 'Pushes secure orders straight to Field Unit Command logs.',
  interagency: 'Pushes status files upward to National NDMA networks.',
}

const BROADCAST_TEMPLATES = [
  { label: '🚨 Trigger Aftershock Warning', text: 'AFTERSHOCK WARNING: Seismologists predict M4-5 aftershocks in next 12 hours. All teams maintain alert. Public: stay in open areas.' },
  { label: '🚧 Evacuate Route NH361', text: 'EVACUATION ORDER: NH361 Latur-Ausa highway closed due to landslide. All civilian traffic divert via Renapur bypass immediately.' },
  { label: '🏥 Hospital Capacity Alert', text: 'MEDICAL ALERT: Yashwantrao Chavan Rural Hospital at 96% capacity. All non-critical cases divert to Vilasrao Deshmukh Medical College.' },
  { label: '⚡ Grid Failure Zone', text: 'INFRASTRUCTURE: Power grid failure in Killari zone. Emergency generators deployed. Restoration ETA: 2 hours.' },
]

// ─── Component ─────────────────────────────────────────────────────────────────

interface CommandBroadcastProps {
  broadcasts: Broadcast[]
  broadcastMsg: string
  broadcastHeading: string
  broadcastCriticality: CriticalityLevel
  sendingBroadcast: boolean
  broadcastChannel: string
  onMsgChange: (msg: string) => void
  onHeadingChange: (heading: string) => void
  onCriticalityChange: (level: CriticalityLevel) => void
  onChannelChange: (channel: string) => void
  onSend: () => void
}

export default function CommandBroadcast({
  broadcasts,
  broadcastMsg,
  broadcastHeading,
  broadcastCriticality,
  sendingBroadcast,
  broadcastChannel,
  onMsgChange,
  onHeadingChange,
  onCriticalityChange,
  onChannelChange,
  onSend,
}: CommandBroadcastProps) {
  return (
    <section aria-label="Command Broadcast">
      <div className="bg-slate-800/80 border border-slate-700/50 rounded-xl p-5">
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 break-words whitespace-normal normal-case block w-full max-w-full overflow-hidden">
          Command Broadcast
        </h2>
        <Tabs value={broadcastChannel} onValueChange={(v) => onChannelChange(v)}>
          <TabsList className="bg-slate-900/60 border border-slate-700/50">
            <TabsTrigger value="public" className="text-xs data-[state=active]:bg-emerald-600 data-[state=active]:text-white">📢 Public Safety Broadcast</TabsTrigger>
            <TabsTrigger value="tactical" className="text-xs data-[state=active]:bg-blue-600 data-[state=active]:text-white">🛡️ Tactical Operational Order</TabsTrigger>
            <TabsTrigger value="interagency" className="text-xs data-[state=active]:bg-violet-600 data-[state=active]:text-white">🏛️ Inter-Agency Update</TabsTrigger>
          </TabsList>
        </Tabs>
        <p className="text-[11px] text-slate-500 mt-2 break-words whitespace-normal normal-case block w-full max-w-full overflow-hidden">
          {CHANNEL_DESC[broadcastChannel]}
        </p>

        {/* ── Command Heading + Criticality Level Row ── */}
        <div className="flex flex-col gap-2.5 mt-3">
          <div>
            <label htmlFor="broadcast-heading" className="text-[11px] text-slate-400 font-medium mb-1.5 block">
              Command Heading
            </label>
            <Input
              id="broadcast-heading"
              value={broadcastHeading}
              onChange={e => { if (e.target.value.length <= 100) onHeadingChange(e.target.value) }}
              placeholder="Enter command heading..."
              className="h-9 bg-slate-900/60 border-slate-600/50 text-white placeholder:text-slate-500 text-sm"
            />
          </div>
          <div>
            <label className="text-[11px] text-slate-400 font-medium mb-1.5 block">
              Criticality Level
            </label>
            <div className="flex flex-wrap gap-1.5">
              {CRITICALITY_OPTIONS.map(opt => {
                const isActive = broadcastCriticality === opt.value
                const Icon = opt.icon
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onCriticalityChange(opt.value)}
                    title={opt.label}
                    className={`
                      flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold
                      transition-all cursor-pointer whitespace-nowrap
                      ${isActive
                        ? `${opt.activeBg} border-current`
                        : 'bg-slate-900/40 border-slate-700/40 text-slate-500 hover:text-slate-300 hover:border-slate-600/60'
                      }
                    `}
                  >
                    <span className={`h-2 w-2 rounded-full shrink-0 ${isActive ? opt.dotClass : 'bg-slate-600'}`} />
                    <Icon className="h-3 w-3 shrink-0" />
                    <span className="hidden xl:inline">{opt.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* ── Message Body ── */}
        <div className="relative mt-3">
          <Textarea
            value={broadcastMsg}
            onChange={e => { if (e.target.value.length <= 500) onMsgChange(e.target.value) }}
            placeholder={`Type ${broadcastChannel === 'public' ? 'public safety' : broadcastChannel === 'tactical' ? 'tactical operational' : 'inter-agency situation'} message...`}
            className="flex-1 min-h-[60px] max-h-28 resize-none bg-slate-900/60 border-slate-600/50 text-white placeholder:text-slate-500 text-sm"
            rows={2}
          />
          <div className="flex justify-end mt-1.5">
            <span className={`text-[10px] font-mono ${broadcastMsg.length > 250 ? 'text-red-400 font-bold' : 'text-slate-500'}`}>
              Characters: {broadcastMsg.length} / 250
            </span>
          </div>
        </div>

        {/* ── Quick Templates ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
          {BROADCAST_TEMPLATES.map(tpl => (
            <button
              key={tpl.label}
              onClick={() => onMsgChange(tpl.text)}
              className="text-left px-3 py-2 rounded-lg bg-slate-900/60 border border-slate-700/40 hover:border-slate-600/60 text-[11px] text-slate-300 hover:text-white transition-colors truncate"
              title={tpl.text}
            >
              {tpl.label}
            </button>
          ))}
        </div>

        {/* ── Send Button ── */}
        <div className="flex justify-end mt-4">
          <Button
            onClick={onSend}
            disabled={!broadcastMsg.trim() || sendingBroadcast}
            className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white gap-2 h-auto px-5"
          >
            {sendingBroadcast ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            <span className="break-words whitespace-normal normal-case block w-full max-w-full overflow-hidden">Send</span>
          </Button>
        </div>

        {/* ── Recent Broadcasts ── */}
        <div className="border-t border-slate-700/50 pt-4 mt-4">
          <h3 className="text-xs font-semibold text-slate-400 mb-3 break-words whitespace-normal normal-case block w-full max-w-full overflow-hidden">
            Recent Broadcasts
          </h3>
          {broadcasts.length === 0 ? (
            <p className="text-sm text-slate-500 break-words whitespace-normal normal-case block w-full max-w-full overflow-hidden">
              No broadcasts yet.
            </p>
          ) : (
            <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
              {broadcasts.slice(0, 10).map(b => (
                <div key={b.id} className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/30">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      {b.criticality && (
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${getCriticalityBadge(b.criticality)}`}>
                          {b.criticality.toUpperCase()}
                        </span>
                      )}
                      <span className="text-xs font-semibold text-blue-400 truncate break-words whitespace-normal normal-case block w-full max-w-full overflow-hidden">
                        {b.heading || b.sentBy || 'SEOC'}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 shrink-0 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {b.createdAt ? new Date(b.createdAt).toLocaleTimeString() : '—'}
                    </span>
                  </div>
                  {b.heading && b.sentBy && (
                    <p className="text-[10px] text-slate-500 mb-1 break-words whitespace-normal normal-case block w-full max-w-full overflow-hidden">
                      by {b.sentBy || 'SEOC'}
                    </p>
                  )}
                  <p className="text-sm text-slate-300 break-words whitespace-normal normal-case block w-full max-w-full overflow-hidden">
                    {b.message}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}