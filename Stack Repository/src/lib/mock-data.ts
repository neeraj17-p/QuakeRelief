// Mock data for earthquake events and resources
// Centered around Latur, Maharashtra region (Marathwada)

export const MOCK_EARTHQUAKE = {
  id: "eq-maharashtra-2025-001",
  title: "Maharashtra Earthquake - Latur District",
  magnitude: 6.2,
  depth: 12.5,
  latitude: 18.0700,
  longitude: 76.6200,
  location: "Latur, Maharashtra, India",
  eventTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
  source: "NCS",
  status: "ACTIVE"
}

export const MOCK_INCIDENTS = [
  {
    id: "inc-001", eventId: "eq-maharashtra-2025-001", type: "COLLAPSE",
    description: "Multi-story residential building collapsed near Ganj Golai market area, Latur",
    latitude: 18.4050, longitude: 76.5740, reportedBy: "CITIZEN", reporterName: "Rajesh Patil",
    status: "VERIFIED", priority: "CRITICAL", verificationTier: "TIER_2",
    clusterId: "cluster-a", clusterCount: 5, immediateNeeds: '["rescue","medical","heavy_equipment"]',
    assignedTo: "NDRF-Team-Alpha"
  },
  {
    id: "inc-002", eventId: "eq-maharashtra-2025-001", type: "LANDSLIDE",
    description: "Major landslide blocking Ausa road highway route near Wadwal Nagnath",
    latitude: 18.3500, longitude: 76.5000, reportedBy: "CITIZEN", reporterName: "Sunita Deshmukh",
    status: "VERIFIED", priority: "HIGH", verificationTier: "TIER_2",
    clusterId: "cluster-b", clusterCount: 4, immediateNeeds: '["road_clearing","heavy_equipment"]',
    assignedTo: "SDRF-Bataalion-3"
  },
  {
    id: "inc-003", eventId: "eq-maharashtra-2025-001", type: "MEDICAL",
    description: "Multiple casualties reported at Shivaji Nagar market area, Latur",
    latitude: 18.4120, longitude: 76.5800, reportedBy: "CITIZEN", reporterName: "Dr. Anil Jadhav",
    status: "IN_PROGRESS", priority: "CRITICAL", verificationTier: "TIER_1",
    clusterId: "cluster-c", clusterCount: 3, immediateNeeds: '["medical","ambulance","blood"]',
    assignedTo: "MEDICAL-Team-1"
  },
  {
    id: "inc-004", eventId: "eq-maharashtra-2025-001", type: "ROAD_BLOCK",
    description: "Road structural crack near Ganj Golai market area, Latur-Ausa highway",
    latitude: 18.3800, longitude: 76.5550, reportedBy: "GOVERNMENT", reporterName: "PWD Department",
    status: "VERIFIED", priority: "HIGH", verificationTier: "TIER_1",
    clusterId: null, clusterCount: 1, immediateNeeds: '["road_clearing"]',
    assignedTo: null
  },
  {
    id: "inc-005", eventId: "eq-maharashtra-2025-001", type: "COLLAPSE",
    description: "School building partially collapsed in Renapur village",
    latitude: 18.4350, longitude: 76.6200, reportedBy: "CITIZEN", reporterName: "Vikram Shinde",
    status: "PENDING", priority: "HIGH", verificationTier: "TIER_2",
    clusterId: "cluster-d", clusterCount: 3, immediateNeeds: '["rescue","medical"]',
    assignedTo: null
  },
  {
    id: "inc-006", eventId: "eq-maharashtra-2025-001", type: "FIRE",
    description: "Gas cylinder explosion causing fire in residential colony, Old City Latur",
    latitude: 18.3980, longitude: 76.5700, reportedBy: "SOCIAL_MEDIA", reporterName: null,
    status: "HIGHLY_PROBABLE", priority: "HIGH", verificationTier: "TIER_3",
    clusterId: null, clusterCount: 1, immediateNeeds: '["fire_service","medical"]',
    assignedTo: null
  },
  {
    id: "inc-007", eventId: "eq-maharashtra-2025-001", type: "MEDICAL",
    description: "Elderly patient trapped under debris in Killari village",
    latitude: 18.0750, longitude: 76.6250, reportedBy: "CITIZEN", reporterName: "Meera Bhosle",
    status: "PENDING", priority: "MEDIUM", verificationTier: "TIER_2",
    clusterId: null, clusterCount: 1, immediateNeeds: '["rescue","medical"]',
    assignedTo: null
  },
  {
    id: "inc-008", eventId: "eq-maharashtra-2025-001", type: "COLLAPSE",
    description: "Temple structure damaged near Latur city, devotees reported trapped",
    latitude: 18.4030, longitude: 76.5780, reportedBy: "CITIZEN", reporterName: "Priest Mahesh",
    status: "VERIFIED", priority: "CRITICAL", verificationTier: "TIER_2",
    clusterId: "cluster-a", clusterCount: 5, immediateNeeds: '["rescue","structural_engineer"]',
    assignedTo: "NDRF-Team-Alpha"
  },
  {
    id: "inc-009", eventId: "eq-maharashtra-2025-001", type: "ROAD_BLOCK",
    description: "Social media report: Road blocked near Nilanga route, unverified",
    latitude: 18.1000, longitude: 76.7700, reportedBy: "SOCIAL_MEDIA", reporterName: null,
    status: "UNVERIFIED", priority: "LOW", verificationTier: "TIER_3",
    clusterId: null, clusterCount: 1, immediateNeeds: '[]',
    assignedTo: null
  },
  {
    id: "inc-010", eventId: "eq-maharashtra-2025-001", type: "FLOOD",
    description: "Water pipeline burst causing localized flooding in Main Market, Latur",
    latitude: 18.4060, longitude: 76.5730, reportedBy: "GOVERNMENT", reporterName: "Latur Municipal Corp",
    status: "VERIFIED", priority: "MEDIUM", verificationTier: "TIER_1",
    clusterId: null, clusterCount: 1, immediateNeeds: '["water_shutdown","pump"]',
    assignedTo: "MUNICIPALITY-Team"
  },
]

export const MOCK_RESOURCES = [
  { id: "res-001", name: "Vilasrao Deshmukh Government Medical College, Latur", type: "HOSPITAL", latitude: 18.4100, longitude: 76.5850, address: "Ambajogai Road, Latur", capacity: 200, currentLoad: 145, status: "OPERATIONAL", contact: "+91-2382-221010" },
  { id: "res-002", name: "Yashwantrao Chavan Rural Hospital, Latur", type: "HOSPITAL", latitude: 18.4150, longitude: 76.5900, address: "Shivaji Nagar, Latur", capacity: 50, currentLoad: 48, status: "OVERLOADED", contact: "+91-2382-221011" },
  { id: "res-003", name: "PHC Ausa", type: "MEDICAL_CAMP", latitude: 18.3500, longitude: 76.5050, address: "Ausa, Latur", capacity: 30, currentLoad: 22, status: "OPERATIONAL", contact: "+91-2382-221012" },
  { id: "res-004", name: "Relief Camp - Latur Sports Ground", type: "RELIEF_CAMP", latitude: 18.4080, longitude: 76.5700, address: "Sports Ground, Latur", capacity: 500, currentLoad: 320, status: "OPERATIONAL", contact: "+91-2382-221013" },
  { id: "res-005", name: "Relief Camp - Killari School", type: "RELIEF_CAMP", latitude: 18.0750, longitude: 76.6150, address: "Government School, Killari", capacity: 300, currentLoad: 180, status: "OPERATIONAL", contact: "+91-2382-221014" },
  { id: "res-006", name: "NDRF Warehouse", type: "WAREHOUSE", latitude: 18.4120, longitude: 76.5720, address: "SDRF HQ, Latur", capacity: 1000, currentLoad: 650, status: "OPERATIONAL", contact: "+91-2382-221015" },
  { id: "res-007", name: "Water Distribution Point - Ganj Golai", type: "WATER_POINT", latitude: 18.4050, longitude: 76.5740, address: "Ganj Golai, Latur", capacity: 200, currentLoad: 80, status: "OPERATIONAL", contact: "" },
  { id: "res-008", name: "Emergency Shelter - Zilla Parishad", type: "SHELTER", latitude: 18.4130, longitude: 76.5750, address: "Zilla Parishad, Latur", capacity: 150, currentLoad: 95, status: "OPERATIONAL", contact: "+91-2382-221016" },
  { id: "res-009", name: "District Hospital, Nilanga", type: "HOSPITAL", latitude: 18.1000, longitude: 76.7700, address: "Nilanga, Latur", capacity: 150, currentLoad: 60, status: "OPERATIONAL", contact: "+91-2382-221017" },
  { id: "res-010", name: "Medical Camp - Renapur", type: "MEDICAL_CAMP", latitude: 18.4350, longitude: 76.6180, address: "Renapur Village", capacity: 40, currentLoad: 35, status: "OVERLOADED", contact: "" },
]

export const MOCK_ALERTS = [
  { id: "alt-001", eventId: "eq-maharashtra-2025-001", title: "Earthquake Alert", message: "A 6.2 magnitude earthquake has struck Latur district. Stay calm and move to open areas.", severity: "CRITICAL", targetRole: "ALL", isActive: true, createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
  { id: "alt-002", eventId: "eq-maharashtra-2025-001", title: "Evacuation Warning - Ausa Road", message: "Evacuate immediately from Ausa road highway route due to active landslide risk near Wadwal Nagnath.", severity: "EVACUATION", targetRole: "PUBLIC", isActive: true, createdAt: new Date(Date.now() - 90 * 60 * 1000).toISOString() },
  { id: "alt-003", eventId: "eq-maharashtra-2025-001", title: "Hospital Overload - Yashwantrao Chavan Rural Hospital", message: "Yashwantrao Chavan Rural Hospital is at 96% capacity. Divert non-critical cases to Vilasrao Deshmukh Government Medical College, Latur.", severity: "WARNING", targetRole: "RESCUE", isActive: true, createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString() },
  { id: "alt-004", eventId: "eq-maharashtra-2025-001", title: "Aftershock Warning", message: "Seismologists predict aftershocks of magnitude 4-5 in the next 12 hours. All teams maintain alert.", severity: "WARNING", targetRole: "ALL", isActive: true, createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString() },
]

export const MOCK_VERIFICATIONS = [
  { id: "v-001", eventId: "eq-maharashtra-2025-001", sourceTier: "TIER_1", sourceType: "NCS", rawContent: "NCS Alert: M6.2 earthquake at 18.0700°N, 76.6200°E, depth 12.5km, Latur district", extractedData: '{"magnitude":6.2,"lat":18.0700,"lng":76.6200,"depth":12.5}', status: "VERIFIED", confidence: 1.0, adminNote: null, reviewedBy: "SYSTEM", reviewedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), incidentId: null },
  { id: "v-002", eventId: "eq-maharashtra-2025-001", sourceTier: "TIER_2", sourceType: "CITIZEN_REPORT", rawContent: "Building collapsed near Ganj Golai market, people trapped inside", extractedData: '{"type":"COLLAPSE","lat":18.405,"lng":76.574}', status: "VERIFIED", confidence: 0.85, adminNote: "Cluster of 5 reports confirmed", reviewedBy: "EOC-Officer-1", reviewedAt: new Date(Date.now() - 100 * 60 * 1000).toISOString(), incidentId: "inc-001" },
  { id: "v-003", eventId: "eq-maharashtra-2025-001", sourceTier: "TIER_2", sourceType: "CITIZEN_REPORT", rawContent: "Landslide blocking the Ausa road highway route, vehicles stuck", extractedData: '{"type":"LANDSLIDE","lat":18.35,"lng":76.50}', status: "VERIFIED", confidence: 0.9, adminNote: "4 reports, aerial confirmation received", reviewedBy: "EOC-Officer-2", reviewedAt: new Date(Date.now() - 85 * 60 * 1000).toISOString(), incidentId: "inc-002" },
  { id: "v-004", eventId: "eq-maharashtra-2025-001", sourceTier: "TIER_3", sourceType: "TWITTER", rawContent: "@user_raj: Major road blocked near Nilanga route, no one can pass! #Maharashtra #Earthquake", extractedData: '{"type":"ROAD_BLOCK","lat":18.10,"lng":76.77}', status: "UNVERIFIED", confidence: 0.35, adminNote: "No corroboration from Tier 1/2. PWD reports route functional.", reviewedBy: null, reviewedAt: null, incidentId: "inc-009" },
  { id: "v-005", eventId: "eq-maharashtra-2025-001", sourceTier: "TIER_3", sourceType: "WHATSAPP", rawContent: "Forwarded msg: Fire in Old City Latur due to gas cylinder, many houses affected", extractedData: '{"type":"FIRE","lat":18.398,"lng":76.57}', status: "HIGHLY_PROBABLE", confidence: 0.65, adminNote: "Single source, no cluster yet. Monitoring.", reviewedBy: null, reviewedAt: null, incidentId: "inc-006" },
  { id: "v-006", eventId: "eq-maharashtra-2025-001", sourceTier: "TIER_1", sourceType: "IMD", rawContent: "IMD Weather Advisory: No rainfall expected in next 48hrs. Clear skies favorable for aerial operations.", extractedData: '{"weather":"clear","rain_probability":0}', status: "VERIFIED", confidence: 1.0, adminNote: null, reviewedBy: "SYSTEM", reviewedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(), incidentId: null },
  { id: "v-007", eventId: "eq-maharashtra-2025-001", sourceTier: "TIER_2", sourceType: "CITIZEN_REPORT", rawContent: "School building cracked in Renapur, children were inside but evacuated", extractedData: '{"type":"COLLAPSE","lat":18.435,"lng":76.618}', status: "HIGHLY_PROBABLE", confidence: 0.7, adminNote: "3 reports in 12 min window. Pending visual confirmation.", reviewedBy: null, reviewedAt: null, incidentId: "inc-005" },
  { id: "v-008", eventId: "eq-maharashtra-2025-001", sourceTier: "TIER_3", sourceType: "TWITTER", rawContent: "@news_channel: Breaking - Damaged bridge on Latur-Ausa road, do not travel! #EarthquakeRelief", extractedData: '{"type":"ROAD_BLOCK","lat":18.38,"lng":76.555}', status: "FALSE", confidence: 0.15, adminNote: "Contradicted by PWD Tier 1 report. Bridge inspected and declared safe.", reviewedBy: "EOC-Officer-1", reviewedAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(), incidentId: null },
]

export const MOCK_RESCUE_TEAMS = [
  { id: "team-001", name: "NDRF Team Alpha", unitType: "NDRF", status: "EN_ROUTE", latitude: 18.4050, longitude: 76.5740, assignedIncidentId: "inc-001", contact: "+91-98765-43210", members: 12 },
  { id: "team-002", name: "SDRF Battalion 3", unitType: "SDRF", status: "DEPLOYED", latitude: 18.3500, longitude: 76.5000, assignedIncidentId: "inc-002", contact: "+91-98765-43211", members: 8 },
  { id: "team-003", name: "Medical Response Team 1", unitType: "MEDICAL", status: "DEPLOYED", latitude: 18.4120, longitude: 76.5800, assignedIncidentId: "inc-003", contact: "+91-98765-43212", members: 6 },
  { id: "team-004", name: "Fire Station Latur", unitType: "FIRE", status: "AVAILABLE", latitude: 18.4060, longitude: 76.5760, assignedIncidentId: null, contact: "+91-98765-43213", members: 10 },
  { id: "team-005", name: "District Police Quick Response", unitType: "POLICE", status: "STANDBY", latitude: 18.4080, longitude: 76.5740, assignedIncidentId: null, contact: "+91-98765-43214", members: 15 },
  { id: "team-006", name: "Army Engineering Corps", unitType: "ARMY", status: "AVAILABLE", latitude: 18.4200, longitude: 76.5850, assignedIncidentId: null, contact: "+91-98765-43215", members: 20 },
]

export const MOCK_SAFETY_CHECKINS = [
  { id: "sc-001", eventId: "eq-maharashtra-2025-001", personName: "Anita Deshmukh", phone: "+91-99887-76655", status: "SAFE", latitude: 18.4100, longitude: 76.5850, note: "At government medical college, safe" },
  { id: "sc-002", eventId: "eq-maharashtra-2025-001", personName: "Ramesh Patil", phone: "+91-99887-76656", status: "NEEDS_ASSISTANCE", latitude: 18.4050, longitude: 76.5740, note: "Trapped in building, floor 2" },
  { id: "sc-003", eventId: "eq-maharashtra-2025-001", personName: "Priya Shinde", phone: "+91-99887-76657", status: "SAFE", latitude: 18.4120, longitude: 76.5900, note: "Evacuated to relief camp" },
  { id: "sc-004", eventId: "eq-maharashtra-2025-001", personName: "Deepak Jadhav", phone: "+91-99887-76658", status: "NEEDS_ASSISTANCE", latitude: 18.3500, longitude: 76.5000, note: "Elderly parents need medical help, road blocked" },
  { id: "sc-005", eventId: "eq-maharashtra-2025-001", personName: "Kavita More", phone: null, status: "SAFE", latitude: 18.4130, longitude: 76.5750, note: "" },
]

export const MOCK_AGENT_OUTPUTS = [
  {
    id: "ao-001", eventId: "eq-maharashtra-2025-001", agentType: "SITUATION",
    output: "**SITUATION SUMMARY — Maharashtra Earthquake Event**\n\nA magnitude 6.2 earthquake struck Latur district at depth 12.5km approximately 2 hours ago. The epicentre is located near Killari zone (18.07°N, 76.62°E), south of Latur city.\n\n**Verified Impact Assessment:**\n- **Casualties**: Multiple injuries reported across 3 primary zones. At least 2 critical structural collapses confirmed with potential trapped persons.\n- **Infrastructure**: Ausa road highway route blocked by landslide near Wadwal Nagnath. Road structural crack near Ganj Golai market area. Vilasrao Deshmukh Government Medical College operational but nearing capacity.\n- **Active Hazards**: 2 confirmed collapse zones, 1 active landslide, 1 gas fire, 1 water main burst. 2 unverified reports under review.\n- **Response Status**: NDRF Team Alpha deployed to main collapse site. SDRF Battalion 3 at landslide zone. Medical teams active at Shivaji Nagar. 3 rescue teams on standby.\n- **Civilian Reports**: 5 cluster-verified civilian distress reports processed. 23 safety check-ins received (18 safe, 5 need assistance).",
    reasoningTrace: "Step 1: Aggregated all verified incidents (Tier 1 + Tier 2 confirmed) from the past 2 hours.\nStep 2: Cross-referenced with government feeds (NCS seismic data, IMD weather) and field team reports.\nStep 3: Filtered out 1 FALSE social media report (bridge collapse - contradicted by PWD).\nStep 4: Clustered 5 civilian reports into 4 high-probability incident zones.\nStep 5: Assessed resource utilization — Yashwantrao Chavan Rural Hospital at 96%, Vilasrao Deshmukh Medical College at 72%.\nStep 6: Generated concise textual summary with quantified impact metrics.\nStep 7: Flagged aftershock risk based on seismological patterns (M6.2 mainshock typically produces M4-5 aftershocks)."
  },
  {
    id: "ao-002", eventId: "eq-maharashtra-2025-001", agentType: "PRIORITY",
    output: "**RESCUE PRIORITY RANKING**\n\n**🔴 PRIORITY 1 — CRITICAL (Score: 95/100)**\nZone A: Ganj Golai Market Collapse (18.405°N, 76.574°E)\n→ Multi-story building collapse, 5 clustered reports, potential 15+ trapped persons. 37km from epicentre. NDRF already on-site.\n\n**🟠 PRIORITY 2 — HIGH (Score: 82/100)**\nZone B: Ausa Road Landslide (18.350°N, 76.500°E)\n→ Active landslide blocking critical highway. 4 reports, vehicles stranded. 42km from epicentre. SDRF deployed.\n\n**🟡 PRIORITY 3 — HIGH (Score: 78/100)**\nZone C: Shivaji Nagar Market Casualties (18.412°N, 76.580°E)\n→ Multiple injuries, nearest hospital (Yashwantrao Chavan Rural Hospital) at 96% capacity. 38km from epicentre. Medical team deployed.\n\n**🟢 PRIORITY 4 — MEDIUM (Score: 55/100)**\nZone D: Renapur School (18.435°N, 76.618°E)\n→ Partial collapse, children evacuated per reports. 3 clustered reports. 41km from epicentre. Unassigned.\n\n**⚪ PRIORITY 5 — LOW (Score: 30/100)**\nZone E: Nilanga Road Report (18.100°N, 76.770°E)\n→ Single unverified social media report. PWD confirms route functional. 16km from epicentre. Likely FALSE.",
    reasoningTrace: "Step 1: For each incident zone, computed a weighted priority score.\nStep 2: Scoring formula = (proximity_weight × 30) + (damage_severity × 25) + (population_density × 20) + (cluster_confidence × 15) + (resource_proximity × 10).\nStep 3: Zone A scored highest: 37km from epicentre (18/30), structural collapse severity (24/25), dense urban area (18/20), 5 clustered reports (14/15), NDRF on-site (8/10) = 82 → normalized to 95.\nStep 4: Zone B: 42km (15/30), landslide severity (20/25), highway corridor (15/20), 4 reports (13/15), SDRF deployed (7/10) = 70 → normalized to 82.\nStep 5: Zone C: 38km (16/30), medical severity (22/25), market area (16/20), 3 reports (11/15), hospital nearby but overloaded (9/10) = 74 → normalized to 78.\nStep 6: Zone D: 41km (15/30), partial collapse (15/25), village (10/20), 3 reports (11/15), no team assigned (5/10) = 56 → normalized to 55.\nStep 7: Zone E: 16km (20/30), unverified (5/25), rural (8/20), 1 report (4/15), not needed (0/10) = 37 → normalized to 30."
  },
  {
    id: "ao-003", eventId: "eq-maharashtra-2025-001", agentType: "RECOMMENDATION",
    output: "**ACTION RECOMMENDATIONS & ALERTS**\n\n**🚨 IMMEDIATE ACTIONS REQUIRED:**\n\n1. **Deploy Reserve Teams to Zone D (Renapur School)**\n   - Rationale: 3 clustered reports of school collapse with no team assigned. Children potentially at risk. Priority Score 55 but rising.\n   - Suggested Action: Dispatch Fire Station Latur (10 members, 2km away) or Army Engineering Corps.\n   - Confidence: HIGH (based on Tier 2 clustering)\n\n2. **Medical Evacuation Corridor — Shivaji Nagar to Medical College**\n   - Rationale: Yashwantrao Chavan Rural Hospital at 96% capacity with critical patients. Ausa road blocked. Need alternative route via Renapur bypass.\n   - Suggested Action: Coordinate with SDRF to establish medical evacuation route. Alert Vilasrao Deshmukh Medical College to prepare 30 additional beds.\n   - Confidence: HIGH\n\n3. **Public Broadcast — Aftershock Preparedness**\n   - Rationale: 2 hours post-M6.2 mainshock, aftershock probability is elevated. Citizens in damaged structures at risk.\n   - Suggested Action: Broadcast alert advising all citizens to remain in open areas/relief camps. Do not re-enter damaged buildings.\n   - Confidence: VERY HIGH (seismological consensus)\n\n4. **Dismiss False Report — Nilanga Road Blockage**\n   - Rationale: Social media claim contradicted by PWD ground inspection. Could misroute rescue resources.\n   - Suggested Action: Mark as FALSE in verification ledger. No action required.\n   - Confidence: VERY HIGH (Tier 1 contradiction)\n\n5. **Monitor Old City Fire Incident (Tier 3)**\n   - Rationale: Single WhatsApp source, no cluster yet. If true, requires immediate fire service dispatch.\n   - Suggested Action: Assign reconnaissance team for visual confirmation within 30 minutes.\n   - Confidence: MEDIUM (awaiting corroboration)",
    reasoningTrace: "Step 1: Analyzed Priority Agent rankings to identify gaps in response coverage.\nStep 2: Zone D (Renapur) identified as highest-priority unassigned zone. Cross-referenced with available standby teams (Fire Station + Army Corps within range).\nStep 3: Medical capacity analysis revealed Yashwantrao Chavan Rural Hospital critical. Reviewed route options — Ausa road blocked, need bypass via Renapur.\nStep 4: Seismological analysis: M6.2 mainshock at 12.5km depth typically produces aftershock sequence lasting 48-72 hours. Peak aftershock window: 2-12 hours post-event. Currently in peak window.\nStep 5: False report detection: Compared social media claim (bridge/road at Nilanga) against PWD Tier 1 ground inspection data. Direct contradiction found. Recommendation: dismiss to prevent resource misallocation.\nStep 6: Tier 3 fire report assessment: Single WhatsApp source, no spatial-temporal cluster. Cannot confirm or deny. Recommendation: 30-minute recon window.\nStep 7: Generated human-in-the-loop alerts with confidence levels and specific actionable steps for SEOC coordinator."
  }
]

export const EPICENTRE = { lat: 18.0700, lng: 76.6200 }
export const MAP_CENTER: [number, number] = [18.4080, 76.5768]
export const MAP_ZOOM = 12