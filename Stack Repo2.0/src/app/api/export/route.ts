import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ── Helpers ──────────────────────────────────────────────────────────────────

function escapeCsvField(value: string | null | undefined): string {
  if (value === null || value === undefined) return '""'
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function formatTimestamp(date: Date): string {
  return date.toISOString().replace('T', ' ').slice(0, 19) + ' IST'
}

function priorityBadge(priority: string): string {
  const colors: Record<string, string> = {
    CRITICAL: '#ef4444',
    HIGH: '#f97316',
    MEDIUM: '#eab308',
    LOW: '#22c55e',
  }
  const c = colors[priority] || '#94a3b8'
  return `<span style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:700;color:#fff;background:${c}">${priority}</span>`
}

function statusBadge(status: string): string {
  const map: Record<string, string> = {
    PENDING: '#94a3b8',
    VERIFIED: '#22c55e',
    IN_PROGRESS: '#3b82f6',
    RESOLVED: '#10b981',
    FALSE: '#ef4444',
    HIGHLY_PROBABLE: '#f59e0b',
  }
  const c = map[status] || '#94a3b8'
  return `<span style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:700;color:#fff;background:${c}">${status.replace(/_/g, ' ')}</span>`
}

function teamStatusBadge(status: string): string {
  const map: Record<string, string> = {
    STANDBY: '#f59e0b',
    AVAILABLE: '#94a3b8',
    EN_ROUTE: '#3b82f6',
    ON_SITE: '#22c55e',
    DEPLOYED: '#8b5cf6',
    RESOLVED: '#10b981',
  }
  const c = map[status] || '#94a3b8'
  return `<span style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:700;color:#fff;background:${c}">${status.replace(/_/g, ' ')}</span>`
}

// ── GET: Export SITREP ────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const format = req.nextUrl.searchParams.get('format')
    const eventId = req.nextUrl.searchParams.get('eventId') || 'eq-maharashtra-2025-001'

    if (format !== 'csv' && format !== 'pdf') {
      return NextResponse.json({ error: 'Invalid format. Use csv or pdf.' }, { status: 400 })
    }

    // Fetch data from database
    const [dbIncidents, dbVerifications, dbEvent] = await Promise.all([
      db.incident.findMany({
        where: eventId ? { eventId } : {},
        orderBy: { createdAt: 'desc' },
      }),
      db.verificationEntry.findMany({
        where: eventId ? { eventId } : {},
        orderBy: { createdAt: 'desc' },
      }),
      db.earthquakeEvent.findFirst({
        where: { id: eventId },
      }),
    ])

    // Fetch fleet state from shared state API
    let teams: Array<{
      id: string
      name: string
      unitType: string
      status: string
      latitude: number
      longitude: number
      members: number
      assignedIncidentId: string | null
      updatedAt: number
    }> = []

    try {
      const stateRes = await fetch('http://localhost:3000/api/state')
      if (stateRes.ok) {
        const stateData = await stateRes.json()
        teams = stateData.teams || []
      }
    } catch {
      // Fleet state unavailable — continue without it
    }

    const now = new Date()
    const dateStr = now.toISOString().slice(0, 10)
    const eventTitle = dbEvent?.title || 'Maharashtra Earthquake Event'
    const eventMagnitude = dbEvent?.magnitude?.toString() || '6.2'
    const eventLocation = dbEvent?.location || 'Latur District, Maharashtra'

    if (format === 'csv') {
      return generateCsv(dbIncidents, dbVerifications, teams, now, dateStr, eventId, eventTitle)
    }

    // format === 'pdf' — returns a downloadable HTML SITREP
    return generateHtmlSitrep(dbIncidents, dbVerifications, teams, now, dateStr, eventId, eventTitle, eventMagnitude, eventLocation)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// ── CSV Generator ────────────────────────────────────────────────────────────

function generateCsv(
  incidents: Array<Record<string, any>>,
  verifications: Array<Record<string, any>>,
  teams: Array<Record<string, any>>,
  now: Date,
  dateStr: string,
  eventId: string,
  eventTitle: string,
) {
  const rows: string[][] = []

  // Event metadata header
  rows.push(['Quake Relief Command Center — Export Report'])
  rows.push(['Event ID', eventId])
  rows.push(['Event Title', eventTitle])
  rows.push(['Report Generated', formatTimestamp(now)])
  rows.push([])

  // ── Incidents ──
  rows.push(['=== INCIDENTS ==='])
  rows.push([
    'ID', 'Type', 'Priority', 'Status', 'Description',
    'Latitude', 'Longitude', 'Reported By', 'Reporter Name',
    'Verification Tier', 'Assigned To', 'Reported At',
  ])
  for (const inc of incidents) {
    rows.push([
      inc.id,
      inc.type,
      inc.priority,
      inc.status,
      inc.description || '',
      inc.latitude?.toString() || '',
      inc.longitude?.toString() || '',
      inc.reportedBy || '',
      inc.reporterName || '',
      inc.verificationTier || '',
      inc.assignedTo || '',
      inc.createdAt ? formatTimestamp(new Date(inc.createdAt)) : '',
    ])
  }
  rows.push([])

  // ── Fleet Status ──
  rows.push(['=== FLEET STATUS ==='])
  rows.push([
    'Team ID', 'Team Name', 'Unit Type', 'Status',
    'Latitude', 'Longitude', 'Members', 'Assigned Incident ID',
  ])
  for (const team of teams) {
    rows.push([
      team.id,
      team.name,
      team.unitType,
      team.status,
      team.latitude?.toString() || '',
      team.longitude?.toString() || '',
      team.members?.toString() || '',
      team.assignedIncidentId || '',
    ])
  }
  rows.push([])

  // ── Verification Pipeline ──
  rows.push(['=== VERIFICATION PIPELINE ==='])
  rows.push([
    'Entry ID', 'Source Tier', 'Source Type', 'Status',
    'Confidence', 'Raw Content', 'Reviewed By', 'Reviewed At',
  ])
  for (const v of verifications) {
    rows.push([
      v.id,
      v.sourceTier,
      v.sourceType,
      v.status,
      v.confidence?.toString() || '',
      v.rawContent || '',
      v.reviewedBy || '',
      v.reviewedAt ? formatTimestamp(new Date(v.reviewedAt)) : '',
    ])
  }

  const csvString = rows.map(row => row.map(escapeCsvField).join(',')).join('\n')
  const filename = `incidents-${dateStr}.csv`

  return new NextResponse(csvString, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}

// ── HTML SITREP Generator ─────────────────────────────────────────────────────

function generateHtmlSitrep(
  incidents: Array<Record<string, any>>,
  verifications: Array<Record<string, any>>,
  teams: Array<Record<string, any>>,
  now: Date,
  dateStr: string,
  eventId: string,
  eventTitle: string,
  magnitude: string,
  location: string,
) {
  // Compute metrics
  const totalIncidents = incidents.length
  const verifiedCount = incidents.filter(i => i.status === 'VERIFIED').length
  const pendingCount = incidents.filter(i => i.status === 'PENDING').length
  const falseCount = incidents.filter(i => i.status === 'FALSE').length
  const inProgressCount = incidents.filter(i => i.status === 'IN_PROGRESS').length
  const resolvedCount = incidents.filter(i => i.status === 'RESOLVED').length

  const deployedTeams = teams.filter(t => ['EN_ROUTE', 'ON_SITE', 'DEPLOYED'].includes(t.status)).length
  const standbyTeams = teams.filter(t => ['STANDBY', 'AVAILABLE'].includes(t.status)).length

  const pendingVerifications = verifications.filter(v => v.status === 'PENDING').length
  const verifiedVerifications = verifications.filter(v => v.status === 'VERIFIED').length
  const falseVerifications = verifications.filter(v => v.status === 'FALSE').length
  const highlyProbableVerifications = verifications.filter(v => v.status === 'HIGHLY_PROBABLE').length

  // Type distribution
  const typeCounts: Record<string, number> = {}
  for (const inc of incidents) {
    typeCounts[inc.type] = (typeCounts[inc.type] || 0) + 1
  }

  const incidentRows = incidents.length > 0
    ? incidents.map((inc, idx) => `
        <tr>
          <td>${idx + 1}</td>
          <td style="font-family:monospace;font-size:10px;color:#94a3b8">${escapeCsvField(inc.id)}</td>
          <td>${inc.type}</td>
          <td>${priorityBadge(inc.priority)}</td>
          <td>${statusBadge(inc.status)}</td>
          <td style="max-width:250px">${escapeCsvField(inc.description) || '—'}</td>
          <td style="font-family:monospace;font-size:10px">${inc.latitude?.toFixed(4)}, ${inc.longitude?.toFixed(4)}</td>
          <td>${inc.reportedBy}${inc.reporterName ? ` (${inc.reporterName})` : ''}</td>
          <td>${inc.assignedTo ? `<span style="font-weight:600;color:#f1f5f9">${escapeCsvField(inc.assignedTo)}</span>` : '<span style="color:#64748b">Unassigned</span>'}</td>
          <td style="font-size:10px;color:#94a3b8">${inc.createdAt ? formatTimestamp(new Date(inc.createdAt)) : '—'}</td>
        </tr>`).join('')
    : '<tr><td colspan="10" style="text-align:center;color:#64748b;padding:20px">No incidents recorded</td></tr>'

  const teamRows = teams.length > 0
    ? teams.map(team => `
        <tr>
          <td style="font-weight:600;color:#f1f5f9">${escapeCsvField(team.name)}</td>
          <td>${team.unitType}</td>
          <td>${teamStatusBadge(team.status)}</td>
          <td style="font-family:monospace;font-size:10px">${team.latitude?.toFixed(4)}, ${team.longitude?.toFixed(4)}</td>
          <td>${team.members || '—'}</td>
          <td>${team.assignedIncidentId ? `<span style="font-family:monospace;font-size:10px;color:#f97316">${escapeCsvField(team.assignedIncidentId)}</span>` : '<span style="color:#64748b">None</span>'}</td>
        </tr>`).join('')
    : '<tr><td colspan="6" style="text-align:center;color:#64748b;padding:20px">No fleet data available</td></tr>'

  const verificationRows = verifications.length > 0
    ? verifications.slice(0, 30).map(v => `
        <tr>
          <td style="font-family:monospace;font-size:10px;color:#94a3b8">${escapeCsvField(v.id)}</td>
          <td><span style="font-size:10px;padding:2px 6px;border-radius:4px;background:#334155">${v.sourceTier}</span></td>
          <td>${v.sourceType}</td>
          <td>${statusBadge(v.status)}</td>
          <td style="font-weight:600">${(v.confidence * 100).toFixed(0)}%</td>
          <td style="max-width:250px">${escapeCsvField(v.rawContent)}</td>
          <td>${v.reviewedBy || '<span style="color:#64748b">—</span>'}</td>
        </tr>`).join('')
    : ''

  const typeChips = Object.entries(typeCounts).map(([type, count]) => {
    const symbols: Record<string, string> = {
      COLLAPSE: '\u{1F3E2}', MEDICAL: '\u{1FA7A}', LANDSLIDE: '\u{1FAA8}',
      ROAD_BLOCK: '\u{1F6A7}', FIRE: '\u{1F525}', FLOOD: '\u{1F30A}',
    }
    return `<div class="type-chip">${symbols[type] || ''} ${type} <span class="count">${count}</span></div>`
  }).join('\n      ')

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>SITREP — ${eventTitle}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Segoe UI', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    background: #0f172a;
    color: #e2e8f0;
    line-height: 1.5;
    font-size: 13px;
  }

  .header {
    background: linear-gradient(135deg, #0c0c1d 0%, #1a1a3e 50%, #0f172a 100%);
    border-bottom: 3px solid #f97316;
    padding: 28px 40px;
  }
  .header-inner { max-width: 1100px; margin: 0 auto; }
  .header h1 {
    font-size: 22px;
    font-weight: 800;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: #f97316;
    margin-bottom: 6px;
  }
  .header .subtitle {
    font-size: 14px;
    color: #94a3b8;
    font-weight: 400;
  }
  .header .meta-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 12px;
    margin-top: 16px;
  }
  .header .meta-item { display: flex; flex-direction: column; gap: 2px; }
  .header .meta-label { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; font-weight: 600; }
  .header .meta-value { font-size: 14px; color: #f1f5f9; font-weight: 600; }

  .content { max-width: 1100px; margin: 0 auto; padding: 28px 40px; }

  .section { margin-bottom: 32px; }
  .section-title {
    font-size: 13px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 2px;
    color: #f97316;
    padding-bottom: 8px;
    border-bottom: 1px solid #334155;
    margin-bottom: 16px;
  }

  .metrics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 12px;
  }
  .metric-card {
    background: #1e293b;
    border: 1px solid #334155;
    border-radius: 8px;
    padding: 14px;
    text-align: center;
  }
  .metric-value { font-size: 28px; font-weight: 800; color: #fff; }
  .metric-label { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; margin-top: 4px; }
  .metric-card.critical .metric-value { color: #ef4444; }
  .metric-card.success .metric-value { color: #22c55e; }
  .metric-card.warning .metric-value { color: #f59e0b; }
  .metric-card.info .metric-value { color: #3b82f6; }

  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  thead th {
    background: #1e293b;
    color: #94a3b8;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-size: 10px;
    padding: 10px 12px;
    text-align: left;
    border-bottom: 2px solid #334155;
    position: sticky;
    top: 0;
  }
  tbody td {
    padding: 8px 12px;
    border-bottom: 1px solid #1e293b;
    color: #cbd5e1;
    vertical-align: top;
  }
  tbody tr:nth-child(even) { background: rgba(30, 41, 59, 0.5); }
  tbody tr:hover { background: rgba(51, 65, 85, 0.3); }

  .type-dist { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
  .type-chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 10px;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 600;
    background: #1e293b;
    border: 1px solid #334155;
  }
  .type-chip .count { background: #334155; padding: 1px 6px; border-radius: 4px; font-size: 10px; }

  .pipeline-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 10px;
  }
  .pipeline-card {
    background: #1e293b;
    border: 1px solid #334155;
    border-radius: 8px;
    padding: 12px;
    text-align: center;
  }
  .pipeline-card .val { font-size: 22px; font-weight: 800; }
  .pipeline-card .lbl { font-size: 10px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 2px; }

  .footer {
    background: #0c0c1d;
    border-top: 1px solid #334155;
    padding: 20px 40px;
    text-align: center;
    color: #64748b;
    font-size: 11px;
    max-width: 1100px;
    margin: 0 auto;
  }
  .footer strong { color: #f97316; }

  @media print {
    body { background: #fff; color: #1a1a1a; font-size: 11px; }
    .header { background: #1a1a3e !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .content { padding: 16px 24px; }
    .metric-card { background: #f1f5f9; border-color: #cbd5e1; }
    .metric-value { color: #1e293b; }
    thead th { background: #f1f5f9; color: #475569; }
    tbody td { color: #334155; border-bottom-color: #e2e8f0; }
    tbody tr:nth-child(even) { background: #f8fafc; }
    table { page-break-inside: auto; }
    tr { page-break-inside: avoid; }
    .section { page-break-inside: avoid; }
    .footer { background: #f1f5f9; color: #64748b; border-color: #e2e8f0; }
    .pipeline-card, .type-chip { background: #f1f5f9; border-color: #cbd5e1; }
    .pipeline-card .val, .type-chip .count { color: #1e293b; }
  }
</style>
</head>
<body>

<div class="header">
  <div class="header-inner">
    <h1>\u{1F6E1}\uFE0F Situational Report (SITREP)</h1>
    <div class="subtitle">${eventTitle} \u2014 Quake Relief Command Center</div>
    <div class="meta-grid">
      <div class="meta-item">
        <span class="meta-label">Event ID</span>
        <span class="meta-value">${eventId}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Magnitude</span>
        <span class="meta-value">M${magnitude}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Location</span>
        <span class="meta-value">${location}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Report Generated</span>
        <span class="meta-value">${formatTimestamp(now)}</span>
      </div>
    </div>
  </div>
</div>

<div class="content">

  <div class="section">
    <div class="section-title">\u{1F4CA} Metrics Overview</div>
    <div class="metrics-grid">
      <div class="metric-card critical">
        <div class="metric-value">${totalIncidents}</div>
        <div class="metric-label">Total Incidents</div>
      </div>
      <div class="metric-card success">
        <div class="metric-value">${verifiedCount}</div>
        <div class="metric-label">Verified</div>
      </div>
      <div class="metric-card warning">
        <div class="metric-value">${pendingCount}</div>
        <div class="metric-label">Pending</div>
      </div>
      <div class="metric-card critical">
        <div class="metric-value">${falseCount}</div>
        <div class="metric-label">False Alarm</div>
      </div>
      <div class="metric-card info">
        <div class="metric-value">${inProgressCount}</div>
        <div class="metric-label">In Progress</div>
      </div>
      <div class="metric-card success">
        <div class="metric-value">${resolvedCount}</div>
        <div class="metric-label">Resolved</div>
      </div>
      <div class="metric-card info">
        <div class="metric-value">${deployedTeams}</div>
        <div class="metric-label">Deployed Teams</div>
      </div>
      <div class="metric-card warning">
        <div class="metric-value">${standbyTeams}</div>
        <div class="metric-label">Standby Teams</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">\u{1F3AF} Incident Type Distribution</div>
    <div class="type-dist">
      ${typeChips}
    </div>
  </div>

  <div class="section">
    <div class="section-title">\u{1F4CB} Incident Summary</div>
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>ID</th>
          <th>Type</th>
          <th>Priority</th>
          <th>Status</th>
          <th>Description</th>
          <th>Coordinates</th>
          <th>Reported By</th>
          <th>Assigned To</th>
          <th>Reported At</th>
        </tr>
      </thead>
      <tbody>
        ${incidentRows}
      </tbody>
    </table>
  </div>

  <div class="section">
    <div class="section-title">\u{1F681} Fleet Status</div>
    <table>
      <thead>
        <tr>
          <th>Team Name</th>
          <th>Unit Type</th>
          <th>Status</th>
          <th>Position</th>
          <th>Members</th>
          <th>Assigned Incident</th>
        </tr>
      </thead>
      <tbody>
        ${teamRows}
      </tbody>
    </table>
  </div>

  <div class="section">
    <div class="section-title">\u2705 Verification Pipeline Stats</div>
    <div class="pipeline-grid">
      <div class="pipeline-card">
        <div class="val" style="color:#94a3b8">${pendingVerifications}</div>
        <div class="lbl">Pending</div>
      </div>
      <div class="pipeline-card">
        <div class="val" style="color:#22c55e">${verifiedVerifications}</div>
        <div class="lbl">Verified</div>
      </div>
      <div class="pipeline-card">
        <div class="val" style="color:#f59e0b">${highlyProbableVerifications}</div>
        <div class="lbl">Highly Probable</div>
      </div>
      <div class="pipeline-card">
        <div class="val" style="color:#ef4444">${falseVerifications}</div>
        <div class="lbl">False / Dismissed</div>
      </div>
    </div>
    ${verifications.length > 0 ? `
    <table style="margin-top:16px">
      <thead>
        <tr>
          <th>ID</th>
          <th>Source</th>
          <th>Type</th>
          <th>Status</th>
          <th>Confidence</th>
          <th>Content</th>
          <th>Reviewed By</th>
        </tr>
      </thead>
      <tbody>
        ${verificationRows}
      </tbody>
    </table>` : ''}
  </div>

</div>

<div class="footer">
  <strong>Generated by Quake Relief Command Center</strong> &nbsp;|&nbsp; SEOC Maharashtra &nbsp;|&nbsp; Report Date: ${formatTimestamp(now)} &nbsp;|&nbsp; ${totalIncidents} incidents &middot; ${deployedTeams} deployed teams
</div>

</body>
</html>`

  const filename = `sitrep-${dateStr}.html`

  return new NextResponse(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
