'use client'

import { useState, useMemo } from 'react'
import { useAppStore, SQUAD_OPTIONS } from '@/store/app-store'
import { useSharedState } from '@/hooks/use-shared-state'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Activity, Globe, Shield, Terminal, UserPlus, LogIn, ArrowRight,
  Phone, MapPin, Building, Zap, ScanEye, Brain, ChevronDown,
  Users, Crosshair,
} from 'lucide-react'

const MAHARASHTRA_DISTRICTS = [
  'Latur', 'Osmanabad', 'Beed', 'Nanded', 'Parbhani',
  'Jalna', 'Aurangabad', 'Solapur', 'Ahmednagar', 'Bid',
]

type AuthMode = 'track-select' | 'citizen-login' | 'citizen-signup' | 'rescue-squad-select'

export default function AuthGate() {
  const {
    setRole, setAuthenticated, setUserName, setUserPhone, setUserDistrict,
    setSquad,
  } = useAppStore()

  const [mode, setMode] = useState<AuthMode>('track-select')
  const [loginName, setLoginName] = useState('')
  const [loginPhone, setLoginPhone] = useState('')
  const [signupName, setSignupName] = useState('')
  const [signupPhone, setSignupPhone] = useState('')
  const [signupDistrict, setSignupDistrict] = useState('')
  const [selectedSquadId, setSelectedSquadId] = useState('')

  // ── Real-time shared state for live squad status sync ──
  const { teams: sharedTeams } = useSharedState()

  // Merge static SQUAD_OPTIONS with real-time shared state data
  // This ensures the preview card always shows the latest operational status
  const selectedSquad = useMemo(() => {
    const staticSquad = SQUAD_OPTIONS.find(s => s.id === selectedSquadId)
    if (!staticSquad) return null

    // Check if shared state has live data for this squad
    const liveTeam = sharedTeams.find(t => t.id === selectedSquadId)
    if (liveTeam) {
      return {
        ...staticSquad,
        status: liveTeam.status as typeof staticSquad.status,
        lat: liveTeam.latitude,
        lng: liveTeam.longitude,
        assignedIncidentId: liveTeam.assignedIncidentId,
      }
    }
    return staticSquad
  }, [selectedSquadId, sharedTeams])

  function handleTrackSelect(track: 'public' | 'rescue' | 'admin') {
    if (track === 'public') {
      setMode('citizen-login')
    } else if (track === 'rescue') {
      setMode('rescue-squad-select')
    } else {
      setRole('admin')
      setUserName('SEOC Commander')
      setAuthenticated(true)
      toast.success('Welcome, SEOC Commander!', { description: 'Logged in as SEOC Admin.' })
    }
  }

  function handleSquadLogin() {
    if (!selectedSquadId) {
      toast.error('No squad selected', { description: 'Please select your field unit designation.' })
      return
    }
    const squad = SQUAD_OPTIONS.find(s => s.id === selectedSquadId)
    if (!squad) return
    setRole('rescue')
    setUserName(squad.name)
    setSquad(squad.id, squad.name, squad.status, squad.lat, squad.lng, squad.assignedIncidentId)
    setAuthenticated(true)
    toast.success(`Welcome, ${squad.name}!`, { description: `Logged in as ${squad.unitType} unit. Status: ${squad.status}` })
  }

  function handleCitizenLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!loginName.trim() || !loginPhone.trim()) {
      toast.error('Missing fields', { description: 'Please enter your name and phone number.' })
      return
    }
    setRole('public')
    setUserName(loginName.trim())
    setUserPhone(loginPhone.trim())
    setAuthenticated(true)
    toast.success(`Welcome, ${loginName.trim()}!`, { description: 'Logged in as Citizen.' })
  }

  function handleCitizenSignup(e: React.FormEvent) {
    e.preventDefault()
    if (!signupName.trim() || !signupPhone.trim() || !signupDistrict) {
      toast.error('Missing fields', { description: 'Please fill in all fields to register.' })
      return
    }
    setRole('public')
    setUserName(signupName.trim())
    setUserPhone(signupPhone.trim())
    setUserDistrict(signupDistrict)
    setAuthenticated(true)
    toast.success(`Welcome, ${signupName.trim()}!`, { description: "You're now logged in as Citizen." })
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-950 via-slate-900 to-red-950/30 text-white overflow-hidden">
      {/* Seismic wave pulse at top */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-red-500/50 auth-seismic" />

      <div className="flex-1 flex items-stretch">
        {/* Left hero section — hidden on mobile */}
        <div className="hidden lg:flex flex-col justify-center w-1/2 p-12 xl:p-16 relative">
          <div className="absolute inset-0 seismic-pattern opacity-40" />
          <div className="relative z-10 space-y-8">
            {/* Logo */}
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center size-14 rounded-2xl bg-red-500/20 backdrop-blur-sm border border-red-500/30">
                <Activity className="h-8 w-8 text-red-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight break-words whitespace-normal normal-case block w-full max-w-full overflow-hidden">QuakeRelief</h1>
                <p className="text-sm text-slate-400 mt-0.5 break-words whitespace-normal normal-case block w-full max-w-full overflow-hidden">Multi-Agent Disaster Intelligence Platform</p>
              </div>
            </div>

            {/* Event info */}
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/15 border border-red-500/30 text-sm">
                <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
                <span className="text-red-300 font-semibold">M6.2 ACTIVE</span>
              </div>
              <p className="text-lg text-slate-200 break-words whitespace-normal normal-case block w-full max-w-full overflow-hidden">
                M6.2 Earthquake — Latur, Maharashtra (SEOC Control Hub)
              </p>
              <p className="text-sm text-slate-400 break-words whitespace-normal normal-case block w-full max-w-full overflow-hidden">
                Real-time situational awareness and multi-agency coordination
              </p>
            </div>

            {/* Feature cards */}
            <div className="space-y-3 pt-4">
              {[
                { icon: Zap, title: 'Real-time Situational Awareness', desc: 'Live seismic data, incident tracking, and dynamic field updates' },
                { icon: ScanEye, title: 'Multi-Tier Verification', desc: '3-layer verification pipeline for crowd-sourced incident reports' },
                { icon: Brain, title: 'AI-Powered Intelligence', desc: 'Multi-agent LLM system for strategic analysis and resource optimization' },
              ].map((feat) => (
                <div key={feat.title} className="glass-card rounded-xl p-4 flex items-start gap-4">
                  <div className="flex items-center justify-center size-10 rounded-lg bg-red-500/15 border border-red-500/20 shrink-0">
                    <feat.icon className="h-5 w-5 text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-100 break-words whitespace-normal normal-case block w-full max-w-full overflow-hidden">{feat.title}</h3>
                    <p className="text-xs text-slate-400 mt-0.5 break-words whitespace-normal normal-case block w-full max-w-full overflow-hidden">{feat.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right auth section */}
        <div className="flex-1 flex items-center justify-center p-6 sm:p-8 lg:p-12">
          <div className="w-full max-w-md space-y-6">
            {/* Mobile-only logo */}
            <div className="lg:hidden text-center space-y-3">
              <div className="inline-flex items-center justify-center size-12 rounded-xl bg-red-500/20 backdrop-blur-sm border border-red-500/30 mx-auto">
                <Activity className="h-7 w-7 text-red-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold break-words whitespace-normal normal-case block w-full max-w-full overflow-hidden">QuakeRelief</h1>
                <p className="text-xs text-slate-400 break-words whitespace-normal normal-case block w-full max-w-full overflow-hidden">Multi-Agent Disaster Intelligence Platform</p>
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/15 border border-red-500/30 text-xs">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-ping" />
                <span className="text-red-300 font-semibold">M6.2 ACTIVE — Latur, MH</span>
              </div>
            </div>

            {/* Track Selection Mode */}
            {mode === 'track-select' && (
              <div className="space-y-6 portal-enter">
                <div className="text-center space-y-1.5">
                  <h2 className="text-xl font-bold break-words whitespace-normal normal-case block w-full max-w-full overflow-hidden">Select Your Access Track</h2>
                  <p className="text-sm text-slate-400 break-words whitespace-normal normal-case block w-full max-w-full overflow-hidden">Choose the portal that matches your role in the disaster response</p>
                </div>

                <div className="grid gap-3">
                  {/* Citizen */}
                  <button
                    onClick={() => handleTrackSelect('public')}
                    className="glass-card auth-card-emerald hover:scale-[1.02] transition-all cursor-pointer rounded-xl p-5 text-left border-l-4 border-l-emerald-500 group"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex items-center justify-center size-11 rounded-lg bg-emerald-500/15 border border-emerald-500/20 shrink-0">
                        <Globe className="h-5 w-5 text-emerald-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-semibold text-emerald-300 break-words whitespace-normal normal-case block w-full max-w-full overflow-hidden">Citizen Safety</h3>
                          <ArrowRight className="h-4 w-4 text-emerald-400/60 group-hover:translate-x-1 transition-transform shrink-0" />
                        </div>
                        <p className="text-xs text-slate-400 mt-1 break-words whitespace-normal normal-case block w-full max-w-full overflow-hidden">Report incidents, check safety, get evacuation info</p>
                      </div>
                    </div>
                  </button>

                  {/* Rescue */}
                  <button
                    onClick={() => handleTrackSelect('rescue')}
                    className="glass-card auth-card-amber hover:scale-[1.02] transition-all cursor-pointer rounded-xl p-5 text-left border-l-4 border-l-amber-500 group"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex items-center justify-center size-11 rounded-lg bg-amber-500/15 border border-amber-500/20 shrink-0">
                        <Shield className="h-5 w-5 text-amber-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-semibold text-amber-300 break-words whitespace-normal normal-case block w-full max-w-full overflow-hidden">Rescue Operations</h3>
                          <ArrowRight className="h-4 w-4 text-amber-400/60 group-hover:translate-x-1 transition-transform shrink-0" />
                        </div>
                        <p className="text-xs text-slate-400 mt-1 break-words whitespace-normal normal-case block w-full max-w-full overflow-hidden">Field ops, tactical map, team coordination</p>
                      </div>
                    </div>
                  </button>

                  {/* Admin */}
                  <button
                    onClick={() => handleTrackSelect('admin')}
                    className="glass-card auth-card-red hover:scale-[1.02] transition-all cursor-pointer rounded-xl p-5 text-left border-l-4 border-l-red-500 group"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex items-center justify-center size-11 rounded-lg bg-red-500/15 border border-red-500/20 shrink-0">
                        <Terminal className="h-5 w-5 text-red-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-semibold text-red-300 break-words whitespace-normal normal-case block w-full max-w-full overflow-hidden">SEOC Command Centre</h3>
                          <ArrowRight className="h-4 w-4 text-red-400/60 group-hover:translate-x-1 transition-transform shrink-0" />
                        </div>
                        <p className="text-xs text-slate-400 mt-1 break-words whitespace-normal normal-case block w-full max-w-full overflow-hidden">Strategic oversight, AI intelligence, resource control</p>
                      </div>
                    </div>
                  </button>
                </div>

                {/* Demo quick access */}
                <div className="pt-2">
                  <p className="text-[11px] text-slate-500 text-center uppercase tracking-wider font-medium mb-3 break-words whitespace-normal normal-case block w-full max-w-full overflow-hidden">Demo: Quick Access</p>
                  <div className="flex gap-2 justify-center">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-[11px] h-7 px-2.5 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300"
                      onClick={() => handleTrackSelect('public')}
                    >
                      <Globe className="h-3 w-3 mr-1" /> Citizen
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-[11px] h-7 px-2.5 border-amber-500/30 text-amber-400 hover:bg-amber-500/10 hover:text-amber-300"
                      onClick={() => handleTrackSelect('rescue')}
                    >
                      <Shield className="h-3 w-3 mr-1" /> Rescue
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-[11px] h-7 px-2.5 border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                      onClick={() => handleTrackSelect('admin')}
                    >
                      <Terminal className="h-3 w-3 mr-1" /> Admin
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Rescue Squad Selection Mode */}
            {mode === 'rescue-squad-select' && (
              <div className="space-y-5 portal-enter">
                <button
                  onClick={() => setMode('track-select')}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 transition-colors"
                >
                  &larr; Back to track selection
                </button>
                <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center size-10 rounded-lg bg-amber-500/15 border border-amber-500/20">
                        <Shield className="h-5 w-5 text-amber-400" />
                      </div>
                      <div>
                        <CardTitle className="text-lg text-white break-words whitespace-normal normal-case block w-full max-w-full overflow-hidden">Field Unit Authentication</CardTitle>
                        <p className="text-xs text-slate-400 mt-0.5 break-words whitespace-normal normal-case block w-full max-w-full overflow-hidden">Select your squad designation to bind this session</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-slate-300 text-xs">
                        <Users className="h-3 w-3 mr-1.5 inline" />
                        Squad Designation
                      </Label>
                      <Select value={selectedSquadId} onValueChange={setSelectedSquadId}>
                        <SelectTrigger className="w-full bg-white/5 border-white/15 text-white focus:ring-amber-500/50 focus:border-amber-500/50">
                          <SelectValue placeholder="Select your field unit..." />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-white/15">
                          {SQUAD_OPTIONS.map((squad) => (
                            <SelectItem
                              key={squad.id}
                              value={squad.id}
                              className="text-slate-200 focus:bg-amber-500/15 focus:text-amber-200"
                            >
                              <div className="flex items-center gap-2">
                                <Crosshair className="h-3 w-3 text-amber-400 shrink-0" />
                                <span className="font-medium">{squad.name}</span>
                                <span className="text-[10px] text-slate-400 ml-auto">({squad.unitType})</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Squad preview card — synced with real-time operational state */}
                    {selectedSquad && (
                      <div className="rounded-lg bg-white/5 border border-white/10 p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span className="relative flex h-2 w-2 shrink-0">
                              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 animate-ping opacity-75" />
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                            </span>
                            <span className="text-sm font-semibold text-amber-300 break-words whitespace-normal normal-case block w-full max-w-full overflow-hidden">{selectedSquad.name}</span>
                          </div>
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full shrink-0 ml-2 border whitespace-nowrap ${
                            selectedSquad.status === 'EN_ROUTE' ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' :
                            selectedSquad.status === 'ON_SITE' ? 'bg-green-500/20 text-green-300 border-green-500/30' :
                            selectedSquad.status === 'AVAILABLE' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                            selectedSquad.status === 'DISPATCHED' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                            selectedSquad.status === 'RESOLVED' ? 'bg-slate-500/20 text-slate-400 border-slate-500/30' :
                            'bg-slate-500/20 text-slate-300 border-slate-500/30'
                          }`}>
                            {selectedSquad.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <div className="text-slate-400">Unit Type: <span className="text-slate-200">{selectedSquad.unitType}</span></div>
                          <div className="text-slate-400">Members: <span className="text-slate-200">{selectedSquad.members}</span></div>
                          <div className="text-slate-400 col-span-2">Position: <span className="text-slate-200 font-mono">{selectedSquad.lat.toFixed(4)}°N, {selectedSquad.lng.toFixed(4)}°E</span></div>
                        </div>
                        {selectedSquad.assignedIncidentId && (
                          <div className="text-[11px] text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded px-3 py-2 break-words whitespace-normal normal-case block w-full max-w-full overflow-hidden">
                            ⚠️ This squad has an active assignment. Logging in will bind to that incident.
                          </div>
                        )}
                      </div>
                    )}

                    <Button
                      className="w-full bg-amber-600 hover:bg-amber-500 text-white border-0"
                      onClick={handleSquadLogin}
                      disabled={!selectedSquadId}
                    >
                      <LogIn className="h-4 w-4 mr-2" />
                      Authenticate & Enter Operations
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Citizen Login Mode */}
            {mode === 'citizen-login' && (
              <div className="space-y-5 portal-enter">
                <button
                  onClick={() => setMode('track-select')}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 transition-colors"
                >
                  &larr; Back to track selection
                </button>
                <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center size-10 rounded-lg bg-emerald-500/15 border border-emerald-500/20">
                        <LogIn className="h-5 w-5 text-emerald-400" />
                      </div>
                      <div>
                        <CardTitle className="text-lg text-white break-words whitespace-normal normal-case block w-full max-w-full overflow-hidden">Citizen Login</CardTitle>
                        <p className="text-xs text-slate-400 mt-0.5 break-words whitespace-normal normal-case block w-full max-w-full overflow-hidden">Enter your details to access the safety portal</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleCitizenLogin} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="login-name" className="text-slate-300 text-xs">
                          <Building className="h-3 w-3 mr-1.5 inline" />
                          Full Name
                        </Label>
                        <Input
                          id="login-name"
                          placeholder="Enter your name"
                          value={loginName}
                          onChange={(e) => setLoginName(e.target.value)}
                          className="bg-white/5 border-white/15 text-white placeholder:text-slate-500 focus-visible:border-emerald-500/50"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="login-phone" className="text-slate-300 text-xs">
                          <Phone className="h-3 w-3 mr-1.5 inline" />
                          Mobile Number
                        </Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">+91</span>
                          <Input
                            id="login-phone"
                            type="tel"
                            placeholder="9876543210"
                            value={loginPhone}
                            onChange={(e) => setLoginPhone(e.target.value)}
                            className="bg-white/5 border-white/15 text-white placeholder:text-slate-500 focus-visible:border-emerald-500/50 pl-12"
                          />
                        </div>
                      </div>
                      <Button
                        type="submit"
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white border-0"
                      >
                        <LogIn className="h-4 w-4 mr-2" />
                        Login as Citizen
                      </Button>
                    </form>
                    <div className="mt-4 text-center">
                      <button
                        onClick={() => { setLoginName(''); setLoginPhone(''); setMode('citizen-signup') }}
                        className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                      >
                        <UserPlus className="h-3 w-3 mr-1 inline" />
                        Register as Citizen
                      </button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Citizen Sign-Up Mode */}
            {mode === 'citizen-signup' && (
              <div className="space-y-5 portal-enter">
                <button
                  onClick={() => { setSignupName(''); setSignupPhone(''); setSignupDistrict(''); setMode('track-select') }}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 transition-colors"
                >
                  &larr; Back to track selection
                </button>
                <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center size-10 rounded-lg bg-emerald-500/15 border border-emerald-500/20">
                        <UserPlus className="h-5 w-5 text-emerald-400" />
                      </div>
                      <div>
                        <CardTitle className="text-lg text-white break-words whitespace-normal normal-case block w-full max-w-full overflow-hidden">Citizen Registration</CardTitle>
                        <p className="text-xs text-slate-400 mt-0.5 break-words whitespace-normal normal-case block w-full max-w-full overflow-hidden">Create your account for the safety portal</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleCitizenSignup} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signup-name" className="text-slate-300 text-xs">
                          <Building className="h-3 w-3 mr-1.5 inline" />
                          Full Name
                        </Label>
                        <Input
                          id="signup-name"
                          placeholder="Enter your full name"
                          value={signupName}
                          onChange={(e) => setSignupName(e.target.value)}
                          className="bg-white/5 border-white/15 text-white placeholder:text-slate-500 focus-visible:border-emerald-500/50"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-phone" className="text-slate-300 text-xs">
                          <Phone className="h-3 w-3 mr-1.5 inline" />
                          Mobile Number
                        </Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">+91</span>
                          <Input
                            id="signup-phone"
                            type="tel"
                            placeholder="9876543210"
                            value={signupPhone}
                            onChange={(e) => setSignupPhone(e.target.value)}
                            className="bg-white/5 border-white/15 text-white placeholder:text-slate-500 focus-visible:border-emerald-500/50 pl-12"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-district" className="text-slate-300 text-xs">
                          <MapPin className="h-3 w-3 mr-1.5 inline" />
                          District
                        </Label>
                        <Select value={signupDistrict} onValueChange={setSignupDistrict}>
                          <SelectTrigger className="w-full bg-white/5 border-white/15 text-white focus:ring-emerald-500/50 focus:border-emerald-500/50">
                            <SelectValue placeholder="Select your district" />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-900 border-white/15">
                            {MAHARASHTRA_DISTRICTS.map((d) => (
                              <SelectItem key={d} value={d} className="text-slate-200 focus:bg-emerald-500/15 focus:text-emerald-200">
                                {d}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        type="submit"
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white border-0"
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Register &amp; Enter
                      </Button>
                    </form>
                    <div className="mt-4 text-center">
                      <button
                        onClick={() => { setSignupName(''); setSignupPhone(''); setSignupDistrict(''); setMode('citizen-login') }}
                        className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
                      >
                        Already registered? Login instead
                      </button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}