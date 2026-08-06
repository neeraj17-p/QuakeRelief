'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ShieldCheck, CheckCircle } from 'lucide-react'

// ─── Props ───────────────────────────────────────────────────────────────────

interface SafetyCheckinFormProps {
  open: boolean
  safeName: string
  safePhone: string
  safeNote: string
  safeSubmitting: boolean
  safeSuccess: boolean
  onNameChange: (v: string) => void
  onPhoneChange: (v: string) => void
  onNoteChange: (v: string) => void
  onSubmit: (e: React.FormEvent) => void
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function SafetyCheckinForm({
  open,
  safeName,
  safePhone,
  safeNote,
  safeSubmitting,
  safeSuccess,
  onNameChange,
  onPhoneChange,
  onNoteChange,
  onSubmit,
}: SafetyCheckinFormProps) {
  if (!open) return null

  return (
    <Card className="border-l-4 border-l-emerald-500 border border-emerald-200 dark:border-emerald-800/50 bg-gradient-to-r from-emerald-50/80 to-card dark:from-emerald-950/20 dark:to-card shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg text-emerald-800">
          <ShieldCheck className="size-5" />
          Safety Check-In
        </CardTitle>
        <p className="text-xs text-emerald-600 mt-1">
          We&apos;ll share your status with emergency coordinators
        </p>
      </CardHeader>
      <CardContent>
        {safeSuccess ? (
          <div className="flex flex-col items-center justify-center py-6 gap-2 text-emerald-700">
            <CheckCircle className="size-12 text-emerald-500" />
            <p className="font-semibold text-lg">You&apos;re marked as safe!</p>
            <p className="text-sm text-muted-foreground">
              Your check-in has been recorded.
            </p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="safe-name">Your Name *</Label>
              <Input
                id="safe-name"
                placeholder="Enter your full name"
                value={safeName}
                onChange={(e) => onNameChange(e.target.value)}
                required
                className="h-12 text-base"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="safe-phone">Phone Number (optional)</Label>
              <Input
                id="safe-phone"
                type="tel"
                placeholder="+91 XXXXX XXXXX"
                value={safePhone}
                onChange={(e) => onPhoneChange(e.target.value)}
                className="h-12 text-base"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="safe-note">Short Note (optional)</Label>
              <Textarea
                id="safe-note"
                placeholder="e.g. I am at the relief camp, safe with my family."
                value={safeNote}
                onChange={(e) => onNoteChange(e.target.value)}
                rows={2}
              />
            </div>
            <Button
              type="submit"
              disabled={safeSubmitting}
              className="w-full h-12 text-base bg-emerald-600 hover:bg-emerald-700"
            >
              {safeSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Submitting...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <CheckCircle className="size-4" />
                  Submit Check-In
                </span>
              )}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  )
}