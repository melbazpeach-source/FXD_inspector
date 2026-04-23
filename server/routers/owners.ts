import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { owners, ownerProperties, ownerNotifications, properties } from "../../drizzle/schema";
import { eq, and, desc, inArray } from "drizzle-orm";
import crypto from "crypto";

export const ownersRouter = router({
  // ── List all owners ──────────────────────────────────────────────────────
  list: protectedProcedure.query(async () => {
    const db = await getDb();
      if (!db) throw new Error("Database unavailable");
    const allOwners = await db.select().from(owners).orderBy(desc(owners.createdAt));
    // For each owner, get their linked properties
    const ownerIds = allOwners.map((o: typeof owners.$inferSelect) => o.id);
    if (ownerIds.length === 0) return [];

    const links = await db
      .select({
        ownerId: ownerProperties.ownerId,
        propertyId: ownerProperties.propertyId,
        isPrimary: ownerProperties.isPrimary,
        address: properties.address,
        suburb: properties.suburb,
        city: properties.city,
      })
      .from(ownerProperties)
      .innerJoin(properties, eq(ownerProperties.propertyId, properties.id))
      .where(inArray(ownerProperties.ownerId, ownerIds));

    return allOwners.map((owner: typeof owners.$inferSelect) => ({
      ...owner,
      properties: links.filter((l: { ownerId: number }) => l.ownerId === owner.id),
    }));
  }),

  // ── Get single owner ─────────────────────────────────────────────────────
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const [owner] = await db.select().from(owners).where(eq(owners.id, input.id));
      if (!owner) throw new Error("Owner not found");

      const linkedProps = await db
        .select({
          id: ownerProperties.id,
          ownerId: ownerProperties.ownerId,
          propertyId: ownerProperties.propertyId,
          isPrimary: ownerProperties.isPrimary,
          ownershipShare: ownerProperties.ownershipShare,
          address: properties.address,
          suburb: properties.suburb,
          city: properties.city,
        })
        .from(ownerProperties)
        .innerJoin(properties, eq(ownerProperties.propertyId, properties.id))
        .where(eq(ownerProperties.ownerId, input.id));

      const notifications = await db
        .select()
        .from(ownerNotifications)
        .where(eq(ownerNotifications.ownerId, input.id))
        .orderBy(desc(ownerNotifications.createdAt))
        .limit(20);

      return { ...owner, properties: linkedProps, notifications };
    }),

  // ── Get owner by property ─────────────────────────────────────────────────
  getByProperty: protectedProcedure
    .input(z.object({ propertyId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const links = await db
        .select({
          owner: owners,
          isPrimary: ownerProperties.isPrimary,
          ownershipShare: ownerProperties.ownershipShare,
        })
        .from(ownerProperties)
        .innerJoin(owners, eq(ownerProperties.ownerId, owners.id))
        .where(eq(ownerProperties.propertyId, input.propertyId));
      return links;
    }),

  // ── Create owner ──────────────────────────────────────────────────────────
  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      entityType: z.enum(["individual", "company", "trust", "partnership"]).optional(),
      companyName: z.string().optional(),
      email: z.string().email().optional().or(z.literal("")),
      phone: z.string().optional(),
      alternatePhone: z.string().optional(),
      mailingAddress: z.string().optional(),
      preferredContact: z.enum(["email", "phone", "sms", "portal"]).optional(),
      reportFrequency: z.enum(["after_each_inspection", "monthly", "quarterly"]).optional(),
      notes: z.string().optional(),
      propertyIds: z.array(z.number()).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const { propertyIds, ...ownerData } = input;
      const portalToken = crypto.randomBytes(32).toString("hex");

      const [result] = await db.insert(owners).values({
        ...ownerData,
        email: ownerData.email || null,
        portalToken,
        portalEnabled: false,
      });
      const ownerId = (result as any).insertId;

      // Link to properties
      if (propertyIds && propertyIds.length > 0) {
        await db.insert(ownerProperties).values(
          propertyIds.map((pid, i) => ({
            ownerId,
            propertyId: pid,
            isPrimary: i === 0,
            ownershipShare: 100,
          }))
        );
      }

      return { id: ownerId };
    }),

  // ── Update owner ──────────────────────────────────────────────────────────
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(1).optional(),
      entityType: z.enum(["individual", "company", "trust", "partnership"]).optional(),
      companyName: z.string().optional(),
      email: z.string().email().optional().or(z.literal("")),
      phone: z.string().optional(),
      alternatePhone: z.string().optional(),
      mailingAddress: z.string().optional(),
      preferredContact: z.enum(["email", "phone", "sms", "portal"]).optional(),
      reportFrequency: z.enum(["after_each_inspection", "monthly", "quarterly"]).optional(),
      portalEnabled: z.boolean().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const { id, ...data } = input;
      await db.update(owners).set(data).where(eq(owners.id, id));
      return { success: true };
    }),

  // ── Delete owner ──────────────────────────────────────────────────────────
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      await db.delete(ownerProperties).where(eq(ownerProperties.ownerId, input.id));
      await db.delete(ownerNotifications).where(eq(ownerNotifications.ownerId, input.id));
      await db.delete(owners).where(eq(owners.id, input.id));
      return { success: true };
    }),

  // ── Link owner to property ────────────────────────────────────────────────
  linkProperty: protectedProcedure
    .input(z.object({
      ownerId: z.number(),
      propertyId: z.number(),
      isPrimary: z.boolean().optional(),
      ownershipShare: z.number().min(1).max(100).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      await db.insert(ownerProperties).values({
        ownerId: input.ownerId,
        propertyId: input.propertyId,
        isPrimary: input.isPrimary ?? true,
        ownershipShare: input.ownershipShare ?? 100,
      });
      return { success: true };
    }),

  // ── Unlink owner from property ────────────────────────────────────────────
  unlinkProperty: protectedProcedure
    .input(z.object({ ownerId: z.number(), propertyId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      await db.delete(ownerProperties).where(
        and(
          eq(ownerProperties.ownerId, input.ownerId),
          eq(ownerProperties.propertyId, input.propertyId)
        )
      );
      return { success: true };
    }),

  // ── Get notifications for owner ───────────────────────────────────────────
  getNotifications: protectedProcedure
    .input(z.object({ ownerId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      return db
        .select()
        .from(ownerNotifications)
        .where(eq(ownerNotifications.ownerId, input.ownerId))
        .orderBy(desc(ownerNotifications.createdAt));
    }),

  // ── Create notification (PM sends to owner) ───────────────────────────────
  createNotification: protectedProcedure
    .input(z.object({
      ownerId: z.number(),
      propertyId: z.number(),
      inspectionId: z.number().optional(),
      type: z.enum([
        "inspection_complete",
        "maintenance_approval",
        "rent_appraisal",
        "hh_compliance",
        "maintenance_plan",
        "renovate_recommendations",
      ]),
      title: z.string(),
      summary: z.string().optional(),
      estimatedCost: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      // Reports always start as 'draft' — PM must review and approve before sending
      const [result] = await db.insert(ownerNotifications).values({
        ...input,
        approvalStatus: "pending",
        pmStatus: "draft",
      });
      return { id: (result as any).insertId };
    }),

  // ── PM approves a draft report ──────────────────────────────────────────────
  pmApprove: protectedProcedure
    .input(z.object({
      notificationId: z.number(),
      pmNote: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      await db.update(ownerNotifications)
        .set({
          pmStatus: "pm_approved",
          pmNote: input.pmNote ?? null,
          pmApprovedAt: new Date(),
        })
        .where(eq(ownerNotifications.id, input.notificationId));
      return { success: true };
    }),

  // ── PM sends an approved report to owner ──────────────────────────────────
  sendToOwner: protectedProcedure
    .input(z.object({ notificationId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const rows = await db.select().from(ownerNotifications)
        .where(eq(ownerNotifications.id, input.notificationId));
      const notif = rows[0];
      if (!notif) throw new Error("Notification not found");
      if (notif.pmStatus !== "pm_approved") {
        throw new Error("Report must be PM-approved before sending to owner");
      }
      await db.update(ownerNotifications)
        .set({ pmStatus: "sent", sentAt: new Date() })
        .where(eq(ownerNotifications.id, input.notificationId));
      return { success: true };
    }),

  // ── Update landlord approval status (for maintenance items) ──────────────
  updateApproval: protectedProcedure
    .input(z.object({
      notificationId: z.number(),
      approvalStatus: z.enum(["approved", "deferred", "discuss"]),
      approvalNote: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      await db.update(ownerNotifications)
        .set({
          approvalStatus: input.approvalStatus,
          approvalNote: input.approvalNote,
          approvedAt: new Date(),
        })
        .where(eq(ownerNotifications.id, input.notificationId));
      return { success: true };
    }),
});
