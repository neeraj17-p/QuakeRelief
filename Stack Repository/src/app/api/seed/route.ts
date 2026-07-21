import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { MOCK_EARTHQUAKE, MOCK_INCIDENTS, MOCK_RESOURCES, MOCK_ALERTS, MOCK_VERIFICATIONS, MOCK_RESCUE_TEAMS, MOCK_SAFETY_CHECKINS, MOCK_AGENT_OUTPUTS } from '@/lib/mock-data'

export async function POST() {
  try {
    // Clear existing data
    await db.fieldUpdate.deleteMany()
    await db.agentOutput.deleteMany()
    await db.safetyCheckIn.deleteMany()
    await db.rescueTeam.deleteMany()
    await db.verificationEntry.deleteMany()
    await db.resource.deleteMany()
    await db.alert.deleteMany()
    await db.incident.deleteMany()
    await db.earthquakeEvent.deleteMany()

    // Seed earthquake event
    await db.earthquakeEvent.create({
      data: {
        id: MOCK_EARTHQUAKE.id,
        title: MOCK_EARTHQUAKE.title,
        magnitude: MOCK_EARTHQUAKE.magnitude,
        depth: MOCK_EARTHQUAKE.depth,
        latitude: MOCK_EARTHQUAKE.latitude,
        longitude: MOCK_EARTHQUAKE.longitude,
        location: MOCK_EARTHQUAKE.location,
        eventTime: new Date(MOCK_EARTHQUAKE.eventTime),
        source: MOCK_EARTHQUAKE.source,
        status: MOCK_EARTHQUAKE.status,
      }
    })

    // Seed incidents
    for (const inc of MOCK_INCIDENTS) {
      await db.incident.create({
        data: {
          id: inc.id,
          eventId: inc.eventId,
          type: inc.type,
          description: inc.description,
          latitude: inc.latitude,
          longitude: inc.longitude,
          reportedBy: inc.reportedBy,
          reporterName: inc.reporterName,
          status: inc.status,
          priority: inc.priority,
          verificationTier: inc.verificationTier,
          clusterId: inc.clusterId,
          clusterCount: inc.clusterCount,
          immediateNeeds: inc.immediateNeeds,
          assignedTo: inc.assignedTo,
        }
      })
    }

    // Seed resources
    for (const res of MOCK_RESOURCES) {
      await db.resource.create({
        data: {
          id: res.id,
          name: res.name,
          type: res.type,
          latitude: res.latitude,
          longitude: res.longitude,
          address: res.address,
          capacity: res.capacity,
          currentLoad: res.currentLoad,
          status: res.status,
          contact: res.contact,
        }
      })
    }

    // Seed alerts
    for (const alt of MOCK_ALERTS) {
      await db.alert.create({
        data: {
          id: alt.id,
          eventId: alt.eventId,
          title: alt.title,
          message: alt.message,
          severity: alt.severity,
          targetRole: alt.targetRole,
          isActive: alt.isActive,
        }
      })
    }

    // Seed verifications
    for (const v of MOCK_VERIFICATIONS) {
      await db.verificationEntry.create({
        data: {
          id: v.id,
          eventId: v.eventId,
          sourceTier: v.sourceTier,
          sourceType: v.sourceType,
          rawContent: v.rawContent,
          extractedData: v.extractedData,
          status: v.status,
          confidence: v.confidence,
          adminNote: v.adminNote,
          reviewedBy: v.reviewedBy,
          reviewedAt: v.reviewedAt ? new Date(v.reviewedAt) : null,
          incidentId: v.incidentId,
        }
      })
    }

    // Seed rescue teams
    for (const t of MOCK_RESCUE_TEAMS) {
      await db.rescueTeam.create({
        data: {
          id: t.id,
          name: t.name,
          unitType: t.unitType,
          status: t.status,
          latitude: t.latitude,
          longitude: t.longitude,
          assignedIncidentId: t.assignedIncidentId,
          contact: t.contact,
          members: t.members,
        }
      })
    }

    // Seed safety check-ins
    for (const sc of MOCK_SAFETY_CHECKINS) {
      await db.safetyCheckIn.create({
        data: {
          id: sc.id,
          eventId: sc.eventId,
          personName: sc.personName,
          phone: sc.phone,
          status: sc.status,
          latitude: sc.latitude,
          longitude: sc.longitude,
          note: sc.note,
        }
      })
    }

    // Seed agent outputs
    for (const ao of MOCK_AGENT_OUTPUTS) {
      await db.agentOutput.create({
        data: {
          id: ao.id,
          eventId: ao.eventId,
          agentType: ao.agentType,
          output: ao.output,
          reasoningTrace: ao.reasoningTrace,
        }
      })
    }

    return NextResponse.json({ success: true, message: 'Database seeded successfully' })
  } catch (error: any) {
    console.error('Seed error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}