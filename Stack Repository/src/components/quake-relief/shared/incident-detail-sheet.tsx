'use client'

import { useState } from 'react'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  MapPin, Clock, User, Phone, AlertTriangle, CheckCircle, XCircle, Navigation,
  Shield, ExternalLink, Copy, ChevronRight, Activity, Users, Zap,
} from 'lucide-react'
import { toast } from 'sonner'

// ─── Types ───────────────────────────────────────────────────────────────────

interface FieldUpdate {
  id: string
  status: string
  note: string | null
  updatedBy: string | null
  createdAt: string
}

export interface IncidentDetail {
  id: string
  type: string
  description: string | null
  latitude: number
  longitude: number
  reportedBy: string
  reporterName: string | null
  reporterPhone: string | null
  status: string
  priority: string
  verificationTier: string
  clusterId: string | null
  clusterCount: number
  immediateNeeds: string | null
  assignedTo: string | null
  createdAt: string
  updatedAt: string
  fieldUpdates: FieldUpdate[]
  eventId: string
}

interface IncidentDetailSheetProps {
  incident: IncidentDetail | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onStatusUpdate?: (incidentId: string, status: string) => void
  onNavigate?: (lat: number, lng: number) => void
  mode?: 'rescue' | 'admin' | 'public'
}

// ─── Config ──────────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<string, { icon: string; color: string; label: string; bg: string }> = {
  COLLAPSE: { icon: '🏢', color: '#dc2626', label: 'Building Collapse', bg: 'bg-red-100 dark:bg-red-950' },
  FIRE: { icon: '🔥', color: '#f97316', label: 'Fire', bg: 'bg-orange-100 dark:bg-orange-950' },
  MEDICAL: { icon: '🩺', color: '#ec4899', label: 'Medical Emergency', bg: 'bg-pink-100 dark:bg-pink-950' },
  LANDSLIDE: { icon: '⛰️', color: '#ea580c', label: 'Landslide', bg: 'bg-amber-100 dark:bg-amber-950' },
  ROAD_BLOCK: { icon: '🚧', color: '#eab308', label: 'Road Blockage', bg: 'bg-yellow-100 dark:bg-yellow-950' },
  FLOOD: { icon: '🌊', color: '#3b82f6', label: 'Flooding', bg: 'bg-blue-100 dark:bg-blue-950' },
}

const STATUS_CONFIG: Record<string, { color: string; label: string; icon: typeof CheckCircle; bg: string }> = {
  PENDING: { color: '#6b7280', label: 'Pending Review', icon: Clock, bg: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
  VERIFIED: { color: '#16a34a', label: 'Verified', icon: CheckCircle, bg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' },
  HIGHLY_PROBABLE: { color: '#d97706', label: 'Highly Probable', icon: AlertTriangle, bg: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400' },
  IN_PROGRESS: { color: '#2563eb', label: 'In Progress', icon: Navigation, bg: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400' },
  RESOLVED: { color: '#16a34a', label: 'Resolved', icon: CheckCircle, bg: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400' },
  FALSE: { color: '#dc2626', label: 'False Report', icon: XCircle, bg: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400' },
  EN_ROUTE: { color: '#2563eb', label: 'En Route', icon: Navigation, bg: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400' },
  ON_SITE: { color: '#d97706', label: 'On Site', icon: MapPin, bg: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400' },
}

const PRIORITY_CONFIG: Record<string, { color: string; label: string; bg: string }> = {
  CRITICAL: { color: '#dc2626', label: 'Critical', bg: 'bg-red-600 text-white' },
  HIGH: { color: '#ea580c', label: 'High', bg: 'bg-orange-500 text-white' },
  MEDIUM: { color: '#d97706', label: 'Medium', bg: 'bg-amber-500 text-white' },
  LOW: { color: '#16a34a', label: 'Low', bg: 'bg-green-500 text-white' },
}

const TIER_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  TIER_1: { label: 'Government', color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950 border-emerald-200' },
  TIER_2: { label: 'Civilian', color: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950 border-amber-200' },
  TIER_3: { label: 'Social Media', color: 'text-purple-700 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-950 border-purple-200' },
}

const REPORTED_CONFIG: Record<string, { label: string }> = {
  CITIZEN: { label: 'Civilian Report' },
  SOCIAL_MEDIA: { label: 'Social Media' },
  GOVERNMENT: { label: 'Government Feed' },
  RESCUE_TEAM: { label: 'Rescue Team' },
}

const NEEDS_LABELS: Record<string, string> = {
  water: '💧 Water',
  food: '🍽️ Food',
  medical: '🏥 Medical',
  rescue: '🚑 Rescue',
  shelter: '🏠 Shelter',
  heavy_equipment: '🏗️ Heavy Equipment',
}

function timeAgo(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diffMs = now - then
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ${mins % 60}m ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function IncidentDetailSheet({ incident, open, onOpenChange, onStatusUpdate, onNavigate, mode = 'admin' }: IncidentDetailSheetProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'timeline' | 'needs'>('details')

  if (!incident) return null

  const typeCfg = TYPE_CONFIG[incident.type] || TYPE_CONFIG.COLLAPSE
  const statusCfg = STATUS_CONFIG[incident.status] || STATUS_CONFIG.PENDING
  const priorityCfg = PRIORITY_CONFIG[incident.priority] || PRIORITY_CONFIG.MEDIUM
  const tierCfg = TIER_CONFIG[incident.verificationTier] || TIER_2

  let needs: string[] = []
  try { needs = JSON.parse(incident.immediateNeeds || '[]') } catch { needs = [] }

  const epicentre = { lat: 18.0700, lng: 76.6200 }
  const distance = haversineKm(incident.latitude, incident.longitude, epicentre.lat, epicentre.lng)

  const handleCopyCoords = () => {
    navigator.clipboard?.writeText(`${incident.latitude.toFixed(4)}, ${incident.longitude.toFixed(4)}`)
    toast.success('Coordinates copied to clipboard')
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[540px] p-0">
        {/* ── Header ── */}
        <div className={`${typeCfg.bg} px-6 py-4 border-b`}>
          <SheetHeader className="p-0">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex items-center justify-center size-12 text-2xl rounded-xl bg-white/80 dark:bg-white/10 shrink-0 shadow-sm">
                  {typeCfg.icon}
                </div>
                <div className="min-w-0">
                  <SheetTitle className="text-base leading-tight">{typeCfg.label}</SheetTitle>
                  <SheetDescription className="text-xs mt-0.5 line-clamp-2">
                    {incident.description || 'No description provided'}
                  </SheetDescription>
                </div>
              </div>
              <Badge className={`${priorityCfg.bg} text-xs font-semibold px-2.5 py-1 shrink-0 shadow-sm`}>
                {priorityCfg.label}
              </Badge>
            </div>
          </SheetHeader>
        </div>

        {/* ── Tabs ── */}
        <div className="flex border-b px-6">
          {(['details', 'timeline', 'needs'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 text-center py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === tab
                  ? 'border-foreground text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground/80'
              }`}
            >
              {tab === 'details' && '📋 Details'}
              {tab === 'timeline' && '📜 Timeline'}
              {tab === 'needs' && '📦 Needs'}
            </button>
          ))}
        </div>

        <ScrollArea className="h-[60vh]">
          <div className="p-6 space-y-5">

            {/* ═══ TAB: Details ═══ */}
            {activeTab === 'details' && (
              <>
                {/* Status & Verification Row */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Status</p>
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium ${statusCfg.bg}`}>
                      <statusCfg.icon className="h-4 w-4" />
                      {statusCfg.label}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Verification</p>
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border ${tierCfg.bg}`}>
                      <Zap className="h-3.5 w-3.5" />
                      <span className={tierCfg.color}>{tierCfg.label}</span>
                      <span className="text-muted-foreground mx-1">·</span>
                      <span className="text-muted-foreground text-xs">{incident.clusterCount > 1 ? `×${incident.clusterCount} cluster` : 'Single'}</span>
                    </div>
                  </div>
                </div>

                {/* Reporter Info */}
                <div className="rounded-xl border p-4 space-y-3">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Reporter Information</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs">Source</p>
                      <p className="font-medium">{REPORTED_CONFIG[incident.reportedBy]?.label || incident.reportedBy}</p>
                    </div>
                    {incident.reporterName && (
                      <div>
                        <p className="text-muted-foreground text-xs">Name</p>
                        <div className="flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-muted-foreground" />
                          <p className="font-medium">{incident.reporterName}</p>
                        </div>
                      </div>
                    )}
                    {incident.reporterPhone && (
                      <div>
                        <p className="text-muted-foreground text-xs">Phone</p>
                        <div className="flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                          <a href={`tel:${incident.reporterPhone}`} className="font-medium text-blue-600 dark:text-blue-400 hover:underline">{incident.reporterPhone}</a>
                        </div>
                      </div>
                    )}
                    <div>
                      <p className="text-muted-foreground text-xs">Reported</p>
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        <p className="font-medium">{timeAgo(incident.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Location */}
                <div className="rounded-xl border p-4 space-y-3">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Location</h3>
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-red-500 shrink-0" />
                    <div className="text-sm space-y-0.5">
                      <p className="font-mono font-medium">{incident.latitude.toFixed(4)}°N, {incident.longitude.toFixed(4)}°E</p>
                      <p className="text-xs text-muted-foreground">
                        {distance.toFixed(1)} km from epicentre
                        {onNavigate && (
                          <button
                            onClick={() => onNavigate(incident.latitude, incident.longitude)}
                            className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline text-xs font-medium"
                          >
                            Focus on map <ExternalLink className="h-3 w-3" />
                          </button>
                        )}
                      </p>
                    </div>
                    <button
                      onClick={handleCopyCoords}
                      className="ml-auto shrink-0 p-2 rounded-lg hover:bg-muted transition-colors"
                      aria-label="Copy coordinates"
                    >
                      <Copy className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </div>
                </div>

                {/* Assigned Team */}
                {incident.assignedTo && (
                  <div className="rounded-xl border p-4 space-y-2">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Assigned Team</h3>
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-semibold">{incident.assignedTo}</span>
                    </div>
                  </div>
                )}

                {/* Action Buttons (Rescue mode) */}
                {mode === 'rescue' && onStatusUpdate && incident.status !== 'RESOLVED' && (
                  <div className="rounded-xl border p-4 space-y-3">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Field Status Update</h3>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-10 text-xs"
                        onClick={() => onStatusUpdate(incident.id, 'EN_ROUTE')}
                      >
                        <Navigation className="h-3.5 w-3.5 mr-1.5" />
                        En Route
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-10 text-xs"
                        onClick={() => onStatusUpdate(incident.id, 'ON_SITE')}
                      >
                        <MapPin className="h-3.5 w-3.5 mr-1.5" />
                        On Site
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 h-10 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={() => onStatusUpdate(incident.id, 'RESOLVED')}
                      >
                        <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                        Resolved
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ═══ TAB: Timeline ═══ */}
            {activeTab === 'timeline' && (
              <div className="space-y-0">
                {/* Creation event */}
                <div className="relative pl-6 pb-4">
                  <div className="absolute left-[7px] top-1 bottom-4 w-0.5 bg-border rounded-full" />
                  <div className="absolute left-[4px] top-1.5 h-5 w-5 rounded-full border-2 border-background bg-blue-500 z-10" />
                  <p className="text-xs text-muted-foreground font-mono">{timeAgo(incident.createdAt)}</p>
                  <p className="text-sm font-medium">Incident reported</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Via {REPORTED_CONFIG[incident.reportedBy]?.label || incident.reportedBy}
                    {incident.clusterCount > 1 && ` · ${incident.clusterCount} reports clustered`}
                  </p>
                </div>

                {/* Field updates */}
                {incident.fieldUpdates.length > 0 ? (
                  incident.fieldUpdates.map((update) => {
                    const updateCfg = STATUS_CONFIG[update.status] || STATUS_CONFIG.PENDING
                    const UpdateIcon = updateCfg.icon
                    return (
                      <div key={update.id} className="relative pl-6 pb-4">
                        <div className="absolute left-[7px] top-1 bottom-4 w-0.5 bg-border rounded-full" />
                        <div className={`absolute left-[4px] top-1.5 h-5 w-5 rounded-full border-2 border-background z-10 ${
                          update.status === 'RESOLVED' ? 'bg-green-500' :
                          update.status === 'EN_ROUTE' ? 'bg-blue-500' :
                          'bg-amber-500'
                        }`} />
                        <p className="text-xs text-muted-foreground font-mono">{timeAgo(update.createdAt)}</p>
                        <p className="text-sm font-medium flex items-center gap-2">
                          <UpdateIcon className="h-4 w-4" />
                          {update.status.replace('_', ' ')}
                        </p>
                        {update.note && (
                          <p className="text-xs text-muted-foreground mt-0.5">{update.note}</p>
                        )}
                        {update.updatedBy && (
                          <p className="text-[11px] text-muted-foreground">
                            by {update.updatedBy}
                          </p>
                        )}
                      </div>
                    )
                  })
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-6">No status updates yet.</p>
                )}

                {incident.status !== 'RESOLVED' && (
                  <div className="flex items-center justify-center gap-2 py-2 text-xs text-muted-foreground">
                    <Activity className="h-3 w-3 animate-pulse" />
                    Awaiting field team response...
                  </div>
                )}
              </div>
            )}

            {/* ═══ TAB: Needs ═══ */}
            {activeTab === 'needs' && (
              <div>
                {needs.length > 0 ? (
                  <div className="space-y-2">
                    {needs.map((need, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl border bg-muted/30">
                        <span className="text-lg">{NEEDS_LABELS[need] || need}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-6">No immediate needs specified.</p>
                )}

                <Separator className="my-4" />

                <div className="rounded-xl border p-4 space-y-2">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Incident Meta</h3>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
                    <div>
                      <span className="text-muted-foreground">ID:</span>
                      <p className="font-mono font-medium">{incident.id}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Event:</span>
                      <p className="font-mono font-medium">{incident.eventId}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Type:</span>
                      <p className="font-medium">{typeCfg.label}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Priority:</span>
                      <Badge className={`${priorityCfg.bg} text-[10px] px-1.5 py-0`}>{priorityCfg.label}</Badge>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Created:</span>
                      <p className="font-medium">{new Date(incident.createdAt).toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Updated:</span>
                      <p className="font-medium">{new Date(incident.updatedAt).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}