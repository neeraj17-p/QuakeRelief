import { db } from "./db";// Adjust imports based on your actual mock-data export structureimport { 
  mockEarthquake, 
  mockIncidents, 
  mockTeams, 
  mockResources, 
  mockVerifications, 
  mockAlerts, 
  mockAgentOutputs 
} from "./mock-data";export async function runSeed() {
  console.log("🌱 Starting database seed...");

  // Clear existing records to avoid unique constraint collisions
  await db.agentOutput.deleteMany({});
  await db.verificationEntry.deleteMany({});
  await db.fieldUpdate.deleteMany({});
  await db.alert.deleteMany({});
  await db.safetyCheckIn.deleteMany({});
  await db.incident.deleteMany({});
  await db.rescueTeam.deleteMany({});
  await db.resource.deleteMany({});
  await db.earthquakeEvent.deleteMany({});

  // Seed Event
  if (mockEarthquake) {
    await db.earthquakeEvent.create({ data: mockEarthquake });
  }

  // Seed Incidents
  if (mockIncidents?.length) {
    await db.incident.createMany({ data: mockIncidents });
  }

  // Seed Teams
  if (mockTeams?.length) {
    await db.rescueTeam.createMany({ data: mockTeams });
  }

  // Seed Resources
  if (mockResources?.length) {
    await db.resource.createMany({ data: mockResources });
  }

  // Seed Verifications
  if (mockVerifications?.length) {
    await db.verificationEntry.createMany({ data: mockVerifications });
  }

  // Seed Alerts
  if (mockAlerts?.length) {
    await db.alert.createMany({ data: mockAlerts });
  }

  // Seed AI Agent Outputs
  if (mockAgentOutputs?.length) {
    await db.agentOutput.createMany({ data: mockAgentOutputs });
  }

  console.log("✅ Database seeded successfully!");
}// Allow script execution directly via CLIif (import.meta.main) {
  runSeed()
    .then(async () => {
      await db.$disconnect();
      process.exit(0);
    })
    .catch(async (e) => {
      console.error("❌ Seed error:", e);
      await db.$disconnect();
      process.exit(1);
    });
}
