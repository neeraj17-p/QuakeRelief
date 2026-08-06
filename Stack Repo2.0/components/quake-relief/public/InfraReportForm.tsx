'use client'

import MapWrapper from '@/components/quake-relief/shared/map-wrapper'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Building2, Send } from 'lucide-react'

// ─── Damage Type Config ─────────────────────────────────────────────────────

const DAMAGE_TYPE_OPTIONS = [
  'Road Blockage',
  'Water Pipeline Burst',
  'Power Line Down',
  'Bridge Damage',
  'Building Crack',
  'Other',
] as const

// ─── Props ───────────────────────────────────────────────────────────────────

interface InfraReportFormProps {
  open: boolean
  damageType: string
  location: string
  description: string
  name: string
  phone: string
  submitting: boolean
  lat: string
  lng: string
  onDamageTypeChange: (v: string) => void
  onLocationChange: (v: string) => void
  onDescriptionChange: (v: string) => void
  onNameChange: (v: string) => void
  onPhoneChange: (v: string) => void
  onSubmit: (e: React.FormEvent) => void
  onMapClick: (lat: number, lng: number) => void
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function InfraReportForm({
  open,
  damageType,
  location,
  description,
  name,
  phone,
  submitting,
  lat,
  lng,
  onDamageTypeChange,
  onLocationChange,
  onDescriptionChange,
  onNameChange,
  onPhoneChange,
  onSubmit,
  onMapClick,
}: InfraReportFormProps) {
  if (!open) return null

  return (
    <Card className="border-l-4 border-l-amber-500 border border-amber-200 dark:border-amber-800/50 bg-gradient-to-r from-amber-50/80 to-card dark:from-amber-950/20 dark:to-card shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg text-amber-800">
          <Building2 className="size-5" />
          Report Infrastructure Damage
        </CardTitle>
        <p className="text-xs text-amber-600 mt-1">
          Help us map damaged infrastructure for faster repair response
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          {/* Damage type */}
          <div className="space-y-2">
            <Label htmlFor="infra-damage-type">Damage Type *</Label>
            <Select
              value={damageType}
              onValueChange={(v) => onDamageTypeChange(v)}
            >
              <SelectTrigger id="infra-damage-type" className="h-12 text-base">
                <SelectValue placeholder="Select damage type" />
              </SelectTrigger>
              <SelectContent>
                {DAMAGE_TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Location description */}
          <div className="space-y-2">
            <Label htmlFor="infra-location">Location Description *</Label>
            <Input
              id="infra-location"
              placeholder="e.g., Near Ganj Golai circle"
              value={location}
              onChange={(e) => onLocationChange(e.target.value)}
              required
              className="h-12 text-base"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="infra-desc">Brief Description *</Label>
            <Textarea
              id="infra-desc"
              placeholder="Describe the damage briefly..."
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              rows={2}
              required
            />
          </div>

          {/* Name & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="infra-name">Your Name</Label>
              <Input
                id="infra-name"
                placeholder="Full name"
                value={name}
                onChange={(e) => onNameChange(e.target.value)}
                className="h-12 text-base"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="infra-phone">Phone Number</Label>
              <Input
                id="infra-phone"
                type="tel"
                placeholder="+91 XXXXX XXXXX"
                value={phone}
                onChange={(e) => onPhoneChange(e.target.value)}
                className="h-12 text-base"
              />
            </div>
          </div>

          {/* Coordinate Picker Map */}
          <div className="space-y-1.5">
            <Label className="text-xs break-words whitespace-normal normal-case block w-full max-w-full overflow-hidden">📍 Click on the map to pin the exact distress location</Label>
            <div className="relative block w-full h-[250px] rounded-lg overflow-hidden border border-slate-700/50">
              <MapWrapper
                center={[18.4080, 76.5768]}
                zoom={13}
                onMapClick={(mapLat, mapLng) => {
                  onMapClick(mapLat, mapLng)
                }}
              />
            </div>
          </div>

          {/* Coordinates display */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs break-words whitespace-normal normal-case block w-full max-w-full overflow-hidden">Latitude</Label>
              <Input
                value={lat}
                onChange={() => {}}
                placeholder="18.xxxx"
                readOnly
                className="h-9 text-sm bg-muted"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs break-words whitespace-normal normal-case block w-full max-w-full overflow-hidden">Longitude</Label>
              <Input
                value={lng}
                onChange={() => {}}
                placeholder="76.xxxx"
                readOnly
                className="h-9 text-sm bg-muted"
              />
            </div>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            disabled={submitting}
            className="w-full h-12 text-base bg-amber-600 hover:bg-amber-700"
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Submitting Report...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Send className="size-4" />
                Submit Infrastructure Report
              </span>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}