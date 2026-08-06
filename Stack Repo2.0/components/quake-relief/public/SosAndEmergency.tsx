'use client'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { Phone, ShieldCheck, MapPin, AlertTriangle, Heart, Users } from 'lucide-react'

// ─── Emergency Contacts ──────────────────────────────────────────────────────

const EMERGENCY_CONTACTS = [
  { label: 'State EOC Helpline', phone: '1077', icon: Phone, desc: '24/7 Emergency Operations' },
  { label: 'NDRF Control Room', phone: '+91-11-2610-7866', icon: ShieldCheck, desc: 'National Disaster Response' },
  { label: 'District Control Latur', phone: '+91-2382-221010', icon: MapPin, desc: 'Latur District Control' },
  { label: 'Fire Emergency', phone: '101', icon: AlertTriangle, desc: 'Fire & Rescue Services' },
  { label: 'Ambulance / Medical', phone: '108', icon: Heart, desc: 'Emergency Medical Services' },
  { label: 'Police Control Room', phone: '100', icon: Users, desc: 'Law & Order Emergency' },
] as const

// ─── Props ───────────────────────────────────────────────────────────────────

interface SosAndEmergencyProps {
  sosOpen: boolean
  sosSending: boolean
  sosProgress: number
  sosSent: boolean
  sosCoords: { lat: number; lng: number } | null
  sosGpsNote: string
  showHelpForm: boolean
  onSosOpenChange: (open: boolean) => void
  onHelpFormChange: (open: boolean) => void
  onTriggerSOS: () => void
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function SosAndEmergency({
  sosOpen,
  sosSending,
  sosProgress,
  sosSent,
  sosCoords,
  sosGpsNote,
  showHelpForm,
  onSosOpenChange,
  onHelpFormChange,
  onTriggerSOS,
}: SosAndEmergencyProps) {
  const closeSos = () => {
    onSosOpenChange(false)
  }

  return (
    <>
      {/* ══════ Floating SOS Panic Button ══════ */}
      <button
        onClick={onTriggerSOS}
        className="fixed bottom-20 right-4 z-50 group"
        aria-label="Emergency SOS - Send distress signal"
      >
        {/* Triple pulsing rings */}
        <span className="absolute inset-[-8px] rounded-full bg-red-500/40 animate-ping" style={{ animationDuration: '2s', animationDelay: '0s' }} />
        <span className="absolute inset-[-16px] rounded-full bg-red-500/25 animate-ping" style={{ animationDuration: '2s', animationDelay: '0.4s' }} />
        <span className="absolute inset-[-24px] rounded-full bg-red-500/10 animate-ping" style={{ animationDuration: '2s', animationDelay: '0.8s' }} />
        <span className="relative flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-red-600 to-red-800 text-white font-black text-2xl shadow-[0_0_30px_rgba(239,68,68,0.5)] hover:shadow-[0_0_40px_rgba(239,68,68,0.7)] transition-all duration-200 group-hover:scale-105 active:scale-95">
          SOS
        </span>
      </button>

      {/* ══════ SOS Emergency Modal ══════ */}
      <Dialog open={sosOpen} onOpenChange={(open) => { if (!open) closeSos() }}>
        <DialogContent className="sm:max-w-md border-red-500/50" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
          <div className="relative overflow-hidden rounded-lg">
            {/* Red pulsing background */}
            <div className="absolute inset-0 bg-gradient-to-b from-red-600/10 to-red-800/5 animate-pulse pointer-events-none" />
            <DialogHeader className="relative">
              <DialogTitle className="text-center text-xl font-bold text-red-600">
                🚨 EMERGENCY SOS ACTIVATED 🚨
              </DialogTitle>
              <DialogDescription className="text-center text-sm text-muted-foreground">
                {sosSent ? 'Your location has been shared with rescue teams.' : 'Sending your location to SEOC...'}
              </DialogDescription>
            </DialogHeader>

            <div className="relative mt-4 space-y-4">
              {!sosSent ? (
                <>
                  {/* Progress bar */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Transmitting distress signal...</span>
                      <span>{sosProgress}%</span>
                    </div>
                    <Progress value={sosProgress} className="h-2" />
                  </div>

                  {/* Coordinates display */}
                  <div className="rounded-lg border border-red-200 bg-red-50/50 dark:bg-red-950/20 p-3 text-center">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">GPS Coordinates</p>
                    <p className="text-sm font-mono font-semibold">
                      {sosCoords ? `${sosCoords.lat.toFixed(4)}°N, ${sosCoords.lng.toFixed(4)}°E` : 'Acquiring...'}
                    </p>
                  </div>

                  {sosGpsNote && (
                    <p className="text-xs text-amber-600 text-center">⚠️ {sosGpsNote}</p>
                  )}
                </>
              ) : (
                <>
                  {/* Success state */}
                  <div className="rounded-lg border border-green-200 bg-green-50/50 dark:bg-green-950/20 p-4 text-center space-y-2">
                    <p className="text-2xl">✅</p>
                    <p className="text-sm font-semibold text-green-700 dark:text-green-400">Location sent to SEOC Command Centre</p>
                  </div>

                  <div className="rounded-lg border p-3 space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Your coordinates:</span>
                      <span className="font-mono font-semibold">{sosCoords?.lat.toFixed(4)}°N, {sosCoords?.lng.toFixed(4)}°E</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">ETA for rescue team:</span>
                      <span className="font-semibold text-emerald-600">~12 minutes</span>
                    </div>
                  </div>

                  {sosGpsNote && (
                    <p className="text-xs text-amber-600 text-center">⚠️ {sosGpsNote}</p>
                  )}
                </>
              )}

              {/* Close button */}
              <Button
                className="w-full"
                variant={sosSent ? 'default' : 'outline'}
                disabled={sosSending}
                onClick={closeSos}
              >
                {sosSent ? 'Close' : 'Cancel'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ══════ Emergency Numbers Dialog ══════ */}
      <Dialog open={showHelpForm} onOpenChange={(open) => onHelpFormChange(open)}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Phone className="size-5 text-red-500" />
              Emergency Contacts
            </DialogTitle>
            <DialogDescription>
              Use these numbers to contact emergency services in Latur district. Available 24/7.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2">
            {EMERGENCY_CONTACTS.map((contact) => {
              const IconComp = contact.icon
              return (
                <a
                  key={contact.label}
                  href={`tel:${contact.phone}`}
                  className="flex flex-col items-center gap-2 rounded-xl border p-4 text-center hover:bg-accent/50 transition-colors group"
                >
                  <span className="flex items-center justify-center size-10 rounded-full bg-red-100 text-red-600 group-hover:bg-red-200 transition-colors">
                    <IconComp className="size-5" />
                  </span>
                  <p className="text-xs font-semibold leading-tight">{contact.label}</p>
                  <p className="text-base font-mono font-bold text-foreground tracking-tight">{contact.phone}</p>
                  <p className="text-[10px] text-muted-foreground">{contact.desc}</p>
                </a>
              )
            })}
          </div>

          <div className="mt-4 pt-4 border-t">
            <Button
              onClick={() => {
                onHelpFormChange(false)
                onTriggerSOS()
              }}
              className="w-full h-12 text-base bg-red-600 hover:bg-red-700 text-white font-bold"
            >
              <span className="flex items-center justify-center gap-2">
                <span className="relative flex size-3">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-white/50 animate-ping" />
                  <span className="relative inline-flex rounded-full size-3 bg-white" />
                </span>
                🔴 INSTANT SOS — Send Distress Signal
              </span>
            </Button>
            <p className="text-[10px] text-center text-muted-foreground mt-1.5">
              This will share your GPS location with SEOC rescue teams immediately
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}