import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const eventId = req.nextUrl.searchParams.get('eventId')
    const status = req.nextUrl.searchParams.get('status')
    const priority = req.nextUrl.searchParams.get('priority')
    const assignedTo = req.nextUrl.searchParams.get('assignedTo')

    const where: any = {}
    if (eventId) where.eventId = eventId
    if (status) where.status = status
    if (priority) where.priority = priority
    if (assignedTo) where.assignedTo = assignedTo

    const incidents = await db.incident.findMany({
      where,
      include: { fieldUpdates: { orderBy: { createdAt: 'desc' } } },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(incidents)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { eventId, type, description, latitude, longitude, reporterName, reporterPhone, immediateNeeds, reportedBy = 'CITIZEN' } = body

    if (!eventId || !type || !latitude || !longitude) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Spatiotemporal clustering check for TIER_2
    let clusterId: string | null = null
    let clusterCount = 1
    let status = 'PENDING'

    if (reportedBy === 'CITIZEN') {
      const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000)
      const nearbyReports = await db.incident.findMany({
        where: {
          eventId,
          reportedBy: 'CITIZEN',
          createdAt: { gte: fifteenMinAgo },
          latitude: { gte: latitude - 0.001, lte: latitude + 0.001 },
          longitude: { gte: longitude - 0.001, lte: longitude + 0.001 },
        }
      })

      if (nearbyReports.length >= 2) {
        clusterId = nearbyReports[0].clusterId || `cluster-${Date.now()}`
        clusterCount = nearbyReports.length + 1
        status = 'HIGHLY_PROBABLE'

        // Update existing reports in cluster
        for (const report of nearbyReports) {
          await db.incident.update({
            where: { id: report.id },
            data: { clusterId, clusterCount, status: 'HIGHLY_PROBABLE' }
          })
        }
      }
    }

    const incident = await db.incident.create({
      data: {
        eventId,
        type,
        description: description || '',
        latitude,
        longitude,
        reportedBy,
        reporterName: reporterName || null,
        reporterPhone: reporterPhone || null,
        status,
        priority: clusterCount >= 3 ? 'HIGH' : 'MEDIUM',
        verificationTier: reportedBy === 'GOVERNMENT' ? 'TIER_1' : reportedBy === 'CITIZEN' ? 'TIER_2' : 'TIER_3',
        clusterId,
        clusterCount,
        immediateNeeds: immediateNeeds ? JSON.stringify(immediateNeeds) : '[]',
      }
    })

    // Create verification entry
    await db.verificationEntry.create({
      data: {
        eventId,
        sourceTier: reportedBy === 'GOVERNMENT' ? 'TIER_1' : reportedBy === 'CITIZEN' ? 'TIER_2' : 'TIER_3',
        sourceType: reportedBy === 'GOVERNMENT' ? 'NCS' : 'CITIZEN_REPORT',
        rawContent: description || `Incident report: ${type} at ${latitude}, ${longitude}`,
        extractedData: JSON.stringify({ type, lat: latitude, lng: longitude }),
        status: reportedBy === 'GOVERNMENT' ? 'VERIFIED' : 'PENDING',
        confidence: reportedBy === 'GOVERNMENT' ? 1.0 : clusterCount >= 3 ? 0.8 : 0.4,
        incidentId: incident.id,
      }
    })

    return NextResponse.json(incident, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}