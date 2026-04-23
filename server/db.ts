import { and, desc, eq, gte, lte, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  aiDescriptions,
  appointments,
  inspectionRooms,
  inspections,
  integrationConfigs,
  maintenanceItems,
  photos,
  properties,
  remoteSubmissionPhotos,
  remoteSubmissions,
  reports,
  roomItems,
  syncLogs,
  tenants,
  users,
  type InsertUser,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ────────────────────────────────────────────────────────────────────
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  for (const field of textFields) {
    const value = user[field];
    if (value === undefined) continue;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  }
  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

// ─── Properties ───────────────────────────────────────────────────────────────
export async function getProperties() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(properties).orderBy(desc(properties.createdAt));
}

export async function getPropertyById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(properties).where(eq(properties.id, id)).limit(1);
  return result[0];
}

export async function createProperty(data: typeof properties.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(properties).values(data);
  return result[0];
}

export async function getPropertyTenants(propertyId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(tenants).where(eq(tenants.propertyId, propertyId));
}

// ─── Appointments ─────────────────────────────────────────────────────────────
export async function getAppointments(filters?: { from?: Date; to?: Date; status?: string }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters?.from) conditions.push(gte(appointments.scheduledAt, filters.from));
  if (filters?.to) conditions.push(lte(appointments.scheduledAt, filters.to));
  if (filters?.status) conditions.push(eq(appointments.status, filters.status as any));
  const query = db
    .select({
      appointment: appointments,
      property: properties,
    })
    .from(appointments)
    .leftJoin(properties, eq(appointments.propertyId, properties.id))
    .orderBy(appointments.scheduledAt);
  if (conditions.length > 0) {
    return query.where(and(...conditions));
  }
  return query;
}

export async function getAppointmentById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select({ appointment: appointments, property: properties })
    .from(appointments)
    .leftJoin(properties, eq(appointments.propertyId, properties.id))
    .where(eq(appointments.id, id))
    .limit(1);
  return result[0];
}

export async function createAppointment(data: typeof appointments.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(appointments).values(data);
}

export async function updateAppointment(id: number, data: Partial<typeof appointments.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(appointments).set(data).where(eq(appointments.id, id));
}

// ─── Inspections ──────────────────────────────────────────────────────────────
export async function getInspections(propertyId?: number) {
  const db = await getDb();
  if (!db) return [];
  const query = db
    .select({ inspection: inspections, property: properties })
    .from(inspections)
    .leftJoin(properties, eq(inspections.propertyId, properties.id))
    .orderBy(desc(inspections.createdAt));
  if (propertyId) return query.where(eq(inspections.propertyId, propertyId));
  return query;
}

export async function getInspectionById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select({ inspection: inspections, property: properties })
    .from(inspections)
    .leftJoin(properties, eq(inspections.propertyId, properties.id))
    .where(eq(inspections.id, id))
    .limit(1);
  return result[0];
}

export async function createInspection(data: typeof inspections.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(inspections).values(data);
  const insertId = (result as any)[0]?.insertId ?? (result as any).insertId;
  return insertId as number;
}

export async function updateInspection(id: number, data: Partial<typeof inspections.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(inspections).set(data).where(eq(inspections.id, id));
}

export async function getLastInspectionForProperty(propertyId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(inspections)
    .where(and(eq(inspections.propertyId, propertyId), eq(inspections.status, "completed")))
    .orderBy(desc(inspections.completedAt))
    .limit(1);
  return result[0];
}

// ─── Inspection Rooms ─────────────────────────────────────────────────────────
export async function getRoomsForInspection(inspectionId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(inspectionRooms)
    .where(eq(inspectionRooms.inspectionId, inspectionId))
    .orderBy(inspectionRooms.roomOrder);
}

export async function getRoomById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(inspectionRooms).where(eq(inspectionRooms.id, id)).limit(1);
  return result[0];
}

export async function createRoom(data: typeof inspectionRooms.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(inspectionRooms).values(data);
  const insertId = (result as any)[0]?.insertId ?? (result as any).insertId;
  return insertId as number;
}

export async function updateRoom(id: number, data: Partial<typeof inspectionRooms.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(inspectionRooms).set(data).where(eq(inspectionRooms.id, id));
}

export async function deleteRoom(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(inspectionRooms).where(eq(inspectionRooms.id, id));
}

// ─── Room Items ───────────────────────────────────────────────────────────────
export async function getRoomItems(roomId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(roomItems).where(eq(roomItems.roomId, roomId));
}

export async function createRoomItem(data: typeof roomItems.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(roomItems).values(data);
  const insertId = (result as any)[0]?.insertId ?? (result as any).insertId;
  return insertId as number;
}

export async function updateRoomItem(id: number, data: Partial<typeof roomItems.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(roomItems).set(data).where(eq(roomItems.id, id));
}

// ─── Maintenance Items ────────────────────────────────────────────────────────
export async function getMaintenanceItems(inspectionId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(maintenanceItems).where(eq(maintenanceItems.inspectionId, inspectionId));
}

export async function createMaintenanceItem(data: typeof maintenanceItems.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(maintenanceItems).values(data);
  const insertId = (result as any)[0]?.insertId ?? (result as any).insertId;
  return insertId as number;
}

export async function updateMaintenanceItem(id: number, data: Partial<typeof maintenanceItems.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(maintenanceItems).set(data).where(eq(maintenanceItems.id, id));
}

// ─── Photos ───────────────────────────────────────────────────────────────────
export async function getPhotosForRoom(roomId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(photos).where(eq(photos.roomId, roomId));
}

export async function getPhotosForInspection(inspectionId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(photos).where(eq(photos.inspectionId, inspectionId));
}

export async function createPhoto(data: typeof photos.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(photos).values(data);
  const insertId = (result as any)[0]?.insertId ?? (result as any).insertId;
  return insertId as number;
}

export async function deletePhoto(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(photos).where(eq(photos.id, id));
}

// ─── AI Descriptions ──────────────────────────────────────────────────────────
export async function getAiDescriptions(inspectionId: number, roomId?: number) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(aiDescriptions.inspectionId, inspectionId)];
  if (roomId !== undefined) conditions.push(eq(aiDescriptions.roomId, roomId));
  return db.select().from(aiDescriptions).where(and(...conditions));
}

export async function upsertAiDescription(data: typeof aiDescriptions.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const existing = await db
    .select()
    .from(aiDescriptions)
    .where(
      and(
        eq(aiDescriptions.inspectionId, data.inspectionId),
        data.roomId ? eq(aiDescriptions.roomId, data.roomId) : eq(aiDescriptions.roomId, 0)
      )
    )
    .limit(1);
  if (existing.length > 0) {
    await db.update(aiDescriptions).set(data).where(eq(aiDescriptions.id, existing[0].id));
    return existing[0].id;
  } else {
    const result = await db.insert(aiDescriptions).values(data);
    const insertId = (result as any)[0]?.insertId ?? (result as any).insertId;
    return insertId as number;
  }
}

// ─── Reports ──────────────────────────────────────────────────────────────────
export async function getReportsForInspection(inspectionId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(reports).where(eq(reports.inspectionId, inspectionId));
}

export async function createReport(data: typeof reports.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(reports).values(data);
  const insertId = (result as any)[0]?.insertId ?? (result as any).insertId;
  return insertId as number;
}

export async function updateReport(id: number, data: Partial<typeof reports.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(reports).set(data).where(eq(reports.id, id));
}

// ─── Remote Submissions ───────────────────────────────────────────────────────
export async function getRemoteSubmissionByToken(token: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(remoteSubmissions)
    .where(eq(remoteSubmissions.token, token))
    .limit(1);
  return result[0];
}

export async function getRemoteSubmissions(inspectionId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (inspectionId) {
    return db.select().from(remoteSubmissions).where(eq(remoteSubmissions.inspectionId, inspectionId));
  }
  return db.select().from(remoteSubmissions).orderBy(desc(remoteSubmissions.createdAt));
}

export async function createRemoteSubmission(data: typeof remoteSubmissions.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(remoteSubmissions).values(data);
  const insertId = (result as any)[0]?.insertId ?? (result as any).insertId;
  return insertId as number;
}

export async function updateRemoteSubmission(id: number, data: Partial<typeof remoteSubmissions.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(remoteSubmissions).set(data).where(eq(remoteSubmissions.id, id));
}

export async function createRemoteSubmissionPhoto(data: typeof remoteSubmissionPhotos.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(remoteSubmissionPhotos).values(data);
  const insertId = (result as any)[0]?.insertId ?? (result as any).insertId;
  return insertId as number;
}

export async function getRemoteSubmissionPhotos(submissionId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(remoteSubmissionPhotos)
    .where(eq(remoteSubmissionPhotos.submissionId, submissionId));
}

// ─── Integration Configs ──────────────────────────────────────────────────────
export async function getIntegrationConfigs(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(integrationConfigs).where(eq(integrationConfigs.userId, userId));
}

export async function upsertIntegrationConfig(data: typeof integrationConfigs.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const existing = await db
    .select()
    .from(integrationConfigs)
    .where(and(eq(integrationConfigs.userId, data.userId), eq(integrationConfigs.platform, data.platform)))
    .limit(1);
  if (existing.length > 0) {
    await db.update(integrationConfigs).set(data).where(eq(integrationConfigs.id, existing[0].id));
    return existing[0].id;
  } else {
    const result = await db.insert(integrationConfigs).values(data);
    const insertId = (result as any)[0]?.insertId ?? (result as any).insertId;
    return insertId as number;
  }
}

export async function createSyncLog(data: typeof syncLogs.$inferInsert) {
  const db = await getDb();
  if (!db) return;
  await db.insert(syncLogs).values(data);
}

export async function getSyncLogs(integrationId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(syncLogs)
    .where(eq(syncLogs.integrationId, integrationId))
    .orderBy(desc(syncLogs.createdAt))
    .limit(limit);
}
