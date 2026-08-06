import { create } from 'zustand'

export type UserRole = 'public' | 'rescue' | 'admin'

export type SquadStatus = 'STANDBY' | 'DISPATCHED' | 'EN_ROUTE' | 'ON_SITE' | 'RESOLVED' | 'AVAILABLE'

export const SQUAD_OPTIONS = [
  { id: 'NDRF-Team-Alpha', name: 'NDRF Team Alpha', unitType: 'NDRF', members: 12, lat: 18.4050, lng: 76.5740, status: 'EN_ROUTE' as SquadStatus, assignedIncidentId: 'inc-001' },
  { id: 'SDRF-Battalion-3', name: 'SDRF Battalion 3', unitType: 'SDRF', members: 8, lat: 18.3500, lng: 76.5000, status: 'ON_SITE' as SquadStatus, assignedIncidentId: 'inc-002' },
  { id: 'MEDICAL-Team-1', name: 'Medical Team 1', unitType: 'MEDICAL', members: 6, lat: 18.4120, lng: 76.5800, status: 'ON_SITE' as SquadStatus, assignedIncidentId: 'inc-003' },
  { id: 'FIRE-Station-Latur', name: 'Fire Station Latur', unitType: 'FIRE', members: 10, lat: 18.4060, lng: 76.5760, status: 'STANDBY' as SquadStatus, assignedIncidentId: null },
  { id: 'DISTRICT-POLICE-QR', name: 'District Police Quick Response', unitType: 'POLICE', members: 15, lat: 18.4080, lng: 76.5740, status: 'STANDBY' as SquadStatus, assignedIncidentId: null },
  { id: 'ARMY-Engineering-Corps', name: 'Army Engineering Corps', unitType: 'ARMY', members: 20, lat: 18.4200, lng: 76.5850, status: 'STANDBY' as SquadStatus, assignedIncidentId: null },
]

interface AppState {
  currentRole: UserRole
  setRole: (role: UserRole) => void
  isRealtimeConnected: boolean
  setRealtimeConnected: (connected: boolean) => void
  activeEventId: string | null
  setActiveEventId: (id: string | null) => void
  liveAlerts: Alert[]
  setLiveAlerts: (alerts: Alert[]) => void
  addLiveAlert: (alert: Alert) => void
  isAuthenticated: boolean
  setAuthenticated: (val: boolean) => void
  userName: string
  setUserName: (name: string) => void
  userPhone: string
  setUserPhone: (phone: string) => void
  userDistrict: string
  setUserDistrict: (district: string) => void
  // Squad-specific auth (rescue portal)
  squadId: string | null
  squadName: string | null
  squadStatus: SquadStatus
  squadLat: number | null
  squadLng: number | null
  squadAssignedIncidentId: string | null
  setSquad: (id: string, name: string, status: SquadStatus, lat: number, lng: number, assignedIncidentId: string | null) => void
  setSquadStatus: (status: SquadStatus) => void
  setSquadAssignedIncident: (incidentId: string | null) => void
  setSquadPosition: (lat: number, lng: number) => void
  logout: () => void
}

interface Alert {
  id: string
  title: string
  message: string
  severity: string
  targetRole: string
  isActive: boolean
  createdAt: string
}

export const useAppStore = create<AppState>((set) => ({
  currentRole: 'public',
  setRole: (role) => set((state) => ({
    currentRole: role,
    ...(state.isAuthenticated ? { isAuthenticated: true } : {}),
  })),
  isRealtimeConnected: false,
  setRealtimeConnected: (connected) => set({ isRealtimeConnected: connected }),
  activeEventId: null,
  setActiveEventId: (id) => set({ activeEventId: id }),
  liveAlerts: [],
  setLiveAlerts: (alerts) => set({ liveAlerts: alerts }),
  addLiveAlert: (alert) => set((state) => ({ liveAlerts: [alert, ...state.liveAlerts].slice(0, 50) })),
  isAuthenticated: false,
  setAuthenticated: (val) => set({ isAuthenticated: val }),
  userName: '',
  setUserName: (name) => set({ userName: name }),
  userPhone: '',
  setUserPhone: (phone) => set({ userPhone: phone }),
  userDistrict: '',
  setUserDistrict: (district) => set({ userDistrict: district }),
  // Squad defaults
  squadId: null,
  squadName: null,
  squadStatus: 'STANDBY',
  squadLat: null,
  squadLng: null,
  squadAssignedIncidentId: null,
  setSquad: (id, name, status, lat, lng, assignedIncidentId) => set({
    squadId: id,
    squadName: name,
    squadStatus: status,
    squadLat: lat,
    squadLng: lng,
    squadAssignedIncidentId: assignedIncidentId,
  }),
  setSquadStatus: (status) => set({ squadStatus: status }),
  setSquadAssignedIncident: (incidentId) => set({ squadAssignedIncidentId: incidentId }),
  setSquadPosition: (lat, lng) => set({ squadLat: lat, squadLng: lng }),
  logout: () => set({
    isAuthenticated: false,
    userName: '',
    userPhone: '',
    userDistrict: '',
    squadId: null,
    squadName: null,
    squadStatus: 'STANDBY',
    squadLat: null,
    squadLng: null,
    squadAssignedIncidentId: null,
  }),
}))