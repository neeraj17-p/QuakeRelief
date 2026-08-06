'use client'

import React from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import { BarChart3, PieChart as PieChartIcon, TrendingUp, Activity } from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Incident {
  id: string
  type: string
  priority: string
  status: string
  verificationTier: string
  createdAt?: string
}

interface VerificationEntry {
  id: string
  sourceTier: string
  status: string
  confidence: number
}

interface Resource {
  type: string
  capacity: number
  currentLoad: number
  status: string
}

export interface ChartDataProps {
  incidents: Incident[]
  verifications: VerificationEntry[]
  resources: Resource[]
  /** Optional custom class applied to each chart card wrapper */
  cardClassName?: string
  /** Optional custom class applied to the grid container */
  gridClassName?: string
  /** Chart display mode: 'full' renders all 6 charts, 'compact' renders only the first 3 */
  chartMode?: 'full' | 'compact'
}

// ─── Vibrant Neon Color Palettes ───────────────────────────────────────────

const TYPE_COLORS: Record<string, string> = {
  COLLAPSE: '#ff2d55',
  FIRE: '#ff6b35',
  MEDICAL: '#ff3ca0',
  LANDSLIDE: '#ffcc00',
  ROAD_BLOCK: '#ffa726',
  FLOOD: '#00e5ff',
}

const PRIORITY_COLORS: Record<string, string> = {
  CRITICAL: '#ff1744',
  HIGH: '#ff6d00',
  MEDIUM: '#ffd600',
  LOW: '#00e676',
}

// ─── Custom Tooltip Component ──────────────────────────────────────────────

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ name: string; value: number; color?: string; dataKey?: string; fill?: string }>
  label?: string
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null

  return (
    <div
      style={{
        background: '#0f172a',
        border: '1px solid #334155',
        borderRadius: '10px',
        padding: '10px 14px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 20px rgba(59,130,246,0.1)',
        backdropFilter: 'blur(12px)',
        animation: 'tooltipFadeIn 0.15s ease-out',
        fontSize: '13px',
      }}
    >
      {label && (
        <p style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '6px', fontWeight: 600 }}>
          {label}
        </p>
      )}
      {payload.map((entry, idx) => (
        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: idx > 0 ? 4 : 0 }}>
          <span
            style={{
              display: 'inline-block',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: entry.color || entry.fill || '#94a3b8',
              boxShadow: `0 0 6px ${entry.color || entry.fill || '#94a3b8'}`,
              flexShrink: 0,
            }}
          />
          <span style={{ color: '#cbd5e1', fontSize: '12px' }}>{entry.name}:</span>
          <span style={{ color: '#f8fafc', fontWeight: 700, fontSize: '13px' }}>{entry.value}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Shared Axis & Grid Styles ─────────────────────────────────────────────

const AXIS_STYLE = { stroke: '#475569', fontSize: '11px' }
const GRID_STYLE = { stroke: '#1e293b', strokeDasharray: '3 3' as const }

// ─── Neon glow keyframes (injected once) ───────────────────────────────────

const styleTagId = 'neon-chart-glow-style'
if (typeof document !== 'undefined' && !document.getElementById(styleTagId)) {
  const style = document.createElement('style')
  style.id = styleTagId
  style.textContent = `
    @keyframes tooltipFadeIn {
      from { opacity: 0; transform: scale(0.95) translateY(2px); }
      to   { opacity: 1; transform: scale(1) translateY(0); }
    }
    .neon-chart-card {
      transition: border-color 0.3s ease, box-shadow 0.3s ease;
    }
    .neon-chart-card:hover {
      border-color: rgba(148,163,184,0.4) !important;
      box-shadow: 0 0 24px rgba(59,130,246,0.07), 0 8px 32px rgba(0,0,0,0.3);
    }
  `
  document.head.appendChild(style)
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function AnalyticsCharts({ incidents, verifications, resources, cardClassName, gridClassName, chartMode = 'full' }: ChartDataProps) {
  const safeIncidents = Array.isArray(incidents) ? incidents : []
  const safeVerifications = Array.isArray(verifications) ? verifications : []
  const safeResources = Array.isArray(resources) ? resources : []

  // ── Compute chart data ──

  // 1. Incident type distribution
  const typeCounts = safeIncidents.reduce<Record<string, number>>((acc, inc) => {
    acc[inc.type] = (acc[inc.type] || 0) + 1
    return acc
  }, {})
  const typeData = Object.entries(typeCounts).map(([type, count]) => ({
    name: type.replace('_', ' '),
    value: count,
    color: TYPE_COLORS[type] || '#94a3b8',
  }))

  // 2. Verification pipeline funnel
  const statusCounts = safeVerifications.reduce<Record<string, number>>((acc, v) => {
    acc[v.status] = (acc[v.status] || 0) + 1
    return acc
  }, {})
  const verificationData = [
    { name: 'Verified', value: statusCounts['VERIFIED'] || 0, fill: '#00e676' },
    { name: 'Probable', value: statusCounts['HIGHLY_PROBABLE'] || 0, fill: '#ffcc00' },
    { name: 'Pending', value: statusCounts['PENDING'] || 0, fill: '#546e7a' },
    { name: 'Unverified', value: statusCounts['UNVERIFIED'] || 0, fill: '#ff6d00' },
    { name: 'False', value: statusCounts['FALSE'] || 0, fill: '#ff1744' },
  ].filter(d => d.value > 0)

  // 3. Resource utilization by type
  const resourceByType = safeResources.reduce<Record<string, { capacity: number; load: number; count: number }>>((acc, r) => {
    if (!acc[r.type]) acc[r.type] = { capacity: 0, load: 0, count: 0 }
    acc[r.type].capacity += r.capacity
    acc[r.type].load += r.currentLoad
    acc[r.type].count += 1
    return acc
  }, {})
  const resourceData = Object.entries(resourceByType).map(([type, data]) => ({
    name: type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).substring(0, 15),
    utilization: Math.round((data.load / data.capacity) * 100),
    fill: data.load / data.capacity > 0.85 ? '#ff1744' : data.load / data.capacity > 0.6 ? '#ffcc00' : '#00e676',
    available: data.capacity - data.load,
    used: data.load,
  }))

  // 4. Priority distribution
  const priorityCounts = safeIncidents.reduce<Record<string, number>>((acc, inc) => {
    acc[inc.priority] = (acc[inc.priority] || 0) + 1
    return acc
  }, {})
  const priorityData = [
    { name: 'Critical', value: priorityCounts['CRITICAL'] || 0, fill: PRIORITY_COLORS.CRITICAL },
    { name: 'High', value: priorityCounts['HIGH'] || 0, fill: PRIORITY_COLORS.HIGH },
    { name: 'Medium', value: priorityCounts['MEDIUM'] || 0, fill: PRIORITY_COLORS.MEDIUM },
    { name: 'Low', value: priorityCounts['LOW'] || 0, fill: PRIORITY_COLORS.LOW },
  ]

  // 5. Verification tier distribution
  const tierCounts = safeVerifications.reduce<Record<string, number>>((acc, v) => {
    acc[v.sourceTier] = (acc[v.sourceTier] || 0) + 1
    return acc
  }, {})
  const tierData = [
    { name: 'Tier 1 (Govt)', value: tierCounts['TIER_1'] || 0, fill: '#00e676' },
    { name: 'Tier 2 (Civilian)', value: tierCounts['TIER_2'] || 0, fill: '#ffcc00' },
    { name: 'Tier 3 (Social)', value: tierCounts['TIER_3'] || 0, fill: '#b388ff' },
  ]

  // Card class: use custom if provided, else fallback neon dark card
  const card = cardClassName || 'bg-gradient-to-br from-slate-800/90 via-slate-800/70 to-slate-900/90 backdrop-blur-md rounded-2xl p-5 min-h-[380px] w-full border border-slate-700/40 hover:border-slate-600/60 transition-all duration-300 flex flex-col justify-between shadow-lg shadow-black/20 neon-chart-card'
  const isCompact = chartMode === 'compact'
  const grid = gridClassName || (isCompact
    ? 'grid grid-cols-1 md:grid-cols-3 gap-6 w-full h-auto relative block clear-both mb-10'
    : 'grid grid-cols-1 md:grid-cols-3 gap-5 w-full h-auto relative block clear-both mb-8'
  )

  // Legend shared style
  const legendStyle = { fontSize: '11px', color: '#cbd5e1' }

  // Axis tick shared style
  const axisTick = { fontSize: 11, fill: '#94a3b8' }
  const axisTickSmall = { fontSize: 10, fill: '#94a3b8' }

  return (
    <div className={grid}>
      {/* ── 1. Incident Type Distribution (Pie) ── */}
      <div className={card}>
        <div className="flex items-center gap-2 mb-4">
          <PieChartIcon className="h-4 w-4 text-cyan-400 shrink-0" />
          <h3 className="text-sm font-semibold text-slate-100 break-words whitespace-normal normal-case block w-full max-w-full overflow-hidden">Incident Types</h3>
        </div>
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={typeData} cx="50%" cy="50%" innerRadius={40} outerRadius={75} paddingAngle={3} dataKey="value" stroke="none">
                {typeData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend iconSize={8} wrapperStyle={legendStyle} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── 2. Verification Pipeline (Bar) ── */}
      <div className={card}>
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="h-4 w-4 text-amber-400 shrink-0" />
          <h3 className="text-sm font-semibold text-slate-100 break-words whitespace-normal normal-case block w-full max-w-full overflow-hidden">Verification Pipeline</h3>
        </div>
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={verificationData} layout="vertical" margin={{ left: 10, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_STYLE.stroke} horizontal={false} />
              <XAxis type="number" tick={axisTick} stroke={AXIS_STYLE.stroke} />
              <YAxis type="category" dataKey="name" tick={axisTick} stroke={AXIS_STYLE.stroke} width={80} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {verificationData.map((entry, index) => (
                  <Cell key={index} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── 3. Resource Utilization % (Horizontal Bar) ── */}
      <div className={card}>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-4 w-4 text-emerald-400 shrink-0" />
          <h3 className="text-sm font-semibold text-slate-100 break-words whitespace-normal normal-case block w-full max-w-full overflow-hidden">Resource Utilization</h3>
        </div>
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={resourceData} layout="vertical" margin={{ left: 10, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_STYLE.stroke} horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={axisTick} stroke={AXIS_STYLE.stroke} unit="%" />
              <YAxis type="category" dataKey="name" tick={axisTickSmall} stroke={AXIS_STYLE.stroke} width={95} />
              <Tooltip content={<CustomTooltip />} formatter={(value: number) => [`${value}%`, 'Utilization']} />
              <Bar dataKey="utilization" radius={[0, 4, 4, 0]}>
                {resourceData.map((entry, index) => (
                  <Cell key={index} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── 4. Priority Distribution (Donut) ── */}
      {!isCompact && (
      <div className={card}>
        <div className="flex items-center gap-2 mb-4">
          <Activity className="h-4 w-4 text-red-400 shrink-0" />
          <h3 className="text-sm font-semibold text-slate-100 break-words whitespace-normal normal-case block w-full max-w-full overflow-hidden">Priority Distribution</h3>
        </div>
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={priorityData} cx="50%" cy="50%" innerRadius={45} outerRadius={80} paddingAngle={4} dataKey="value" stroke="none">
                {priorityData.map((entry, index) => (
                  <Cell key={index} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend iconSize={8} wrapperStyle={legendStyle} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      )}

      {/* ── 5. Data Source Tiers (Bar) ── */}
      {!isCompact && (
      <div className={card}>
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="h-4 w-4 text-violet-400 shrink-0" />
          <h3 className="text-sm font-semibold text-slate-100 break-words whitespace-normal normal-case block w-full max-w-full overflow-hidden">Data Source Tiers</h3>
        </div>
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={tierData} margin={{ left: 10, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_STYLE.stroke} />
              <XAxis dataKey="name" tick={axisTickSmall} stroke={AXIS_STYLE.stroke} />
              <YAxis tick={axisTick} stroke={AXIS_STYLE.stroke} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {tierData.map((entry, index) => (
                  <Cell key={index} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      )}

      {/* ── 6. Capacity vs Load (Stacked Bar) ── */}
      {!isCompact && (
      <div className={card}>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-4 w-4 text-sky-400 shrink-0" />
          <h3 className="text-sm font-semibold text-slate-100 break-words whitespace-normal normal-case block w-full max-w-full overflow-hidden">Capacity vs Load</h3>
        </div>
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={resourceData} margin={{ left: 10, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_STYLE.stroke} />
              <XAxis dataKey="name" tick={axisTickSmall} stroke={AXIS_STYLE.stroke} />
              <YAxis tick={axisTick} stroke={AXIS_STYLE.stroke} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="used" stackId="a" fill="#0ea5e9" name="In Use" radius={[0, 0, 0, 0]} />
              <Bar dataKey="available" stackId="a" fill="#1e293b" name="Available" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      )}
    </div>
  )
}