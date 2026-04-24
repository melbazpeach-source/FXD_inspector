import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "../db";
import { chattels, inventoryItems } from "../../drizzle/schema";
import { protectedProcedure, router } from "../_core/trpc";

export const chattelsRouter = router({
  // ── Chattels ──────────────────────────────────────────────────────────────
  listByProperty: protectedProcedure
    .input(z.object({ propertyId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(chattels).where(eq(chattels.propertyId, input.propertyId));
    }),

  create: protectedProcedure
    .input(z.object({
      propertyId: z.number(),
      name: z.string(),
      category: z.enum(["kitchen","heating_cooling","ventilation","floor_coverings","window_treatments","hot_water","outdoor","other"]),
      makeModel: z.string().optional(),
      serialNumber: z.string().optional(),
      installDate: z.string().optional(),
      estimatedAge: z.string().optional(),
      estimatedValue: z.string().optional(),
      conditionAtRegistration: z.enum(["new","excellent","good","fair","poor"]).optional(),
      notes: z.string().optional(),
      isHealthyHomesItem: z.boolean().optional(),
      healthyHomesCategory: z.enum(["heating","ventilation","insulation","moisture","draught"]).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const [result] = await db.insert(chattels).values({
        propertyId: input.propertyId,
        name: input.name,
        category: input.category,
        makeModel: input.makeModel,
        serialNumber: input.serialNumber,
        installDate: input.installDate,
        estimatedAge: input.estimatedAge,
        estimatedValue: input.estimatedValue,
        conditionAtRegistration: input.conditionAtRegistration ?? "good",
        currentCondition: input.conditionAtRegistration ?? "good",
        notes: input.notes,
        isHealthyHomesItem: input.isHealthyHomesItem ?? false,
        healthyHomesCategory: input.healthyHomesCategory,
      });
      return { id: (result as any).insertId };
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      makeModel: z.string().optional(),
      serialNumber: z.string().optional(),
      currentCondition: z.enum(["new","excellent","good","fair","poor"]).optional(),
      notes: z.string().optional(),
      photoUrl: z.string().optional(),
      photoKey: z.string().optional(),
      lastCheckedInspectionId: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const { id, ...data } = input;
      const updateData: Record<string, unknown> = { ...data };
      if (data.lastCheckedInspectionId) {
        updateData.lastCheckedAt = new Date();
      }
      await db.update(chattels).set(updateData).where(eq(chattels.id, id));
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.delete(chattels).where(eq(chattels.id, input.id));
      return { success: true };
    }),

  // Seed default chattels for a new property
  seedDefaults: protectedProcedure
    .input(z.object({ propertyId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const defaults = [
        { name: "Oven / Cooktop", category: "kitchen" as const, isHealthyHomesItem: false },
        { name: "Range Hood", category: "ventilation" as const, isHealthyHomesItem: true, healthyHomesCategory: "ventilation" as const },
        { name: "Heat Pump", category: "heating_cooling" as const, isHealthyHomesItem: true, healthyHomesCategory: "heating" as const },
        { name: "Hot Water Cylinder", category: "hot_water" as const, isHealthyHomesItem: false },
        { name: "Bathroom Extractor Fan", category: "ventilation" as const, isHealthyHomesItem: true, healthyHomesCategory: "ventilation" as const },
        { name: "Carpet / Floor Coverings", category: "floor_coverings" as const, isHealthyHomesItem: false },
        { name: "Window Blinds / Curtains", category: "window_treatments" as const, isHealthyHomesItem: false },
        { name: "Dishwasher", category: "kitchen" as const, isHealthyHomesItem: false },
      ];
      for (const item of defaults) {
        await db.insert(chattels).values({
          propertyId: input.propertyId,
          name: item.name,
          category: item.category,
          isHealthyHomesItem: item.isHealthyHomesItem,
          healthyHomesCategory: item.healthyHomesCategory,
          currentCondition: "good",
          conditionAtRegistration: "good",
        });
      }
      return { success: true, count: defaults.length };
    }),

  // ── Inventory Items ───────────────────────────────────────────────────────
  listInventory: protectedProcedure
    .input(z.object({ inspectionId: z.number().optional(), propertyId: z.number().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      if (input.propertyId) {
        return db.select().from(inventoryItems).where(eq(inventoryItems.propertyId, input.propertyId));
      }
      if (input.inspectionId) {
        return db.select().from(inventoryItems).where(eq(inventoryItems.inspectionId, input.inspectionId));
      }
      return [];
    }),

  createInventoryItem: protectedProcedure
    .input(z.object({
      inspectionId: z.number().optional(),
      propertyId: z.number(),
      name: z.string(),
      category: z.enum(["whiteware","furniture","appliances","tools_equipment","soft_furnishings","electronics","other"]),
      quantity: z.number().optional(),
      condition: z.enum(["new","excellent","good","fair","poor","damaged","missing"]).optional(),
      description: z.string().optional(),
      serialNumber: z.string().optional(),
      notes: z.string().optional(),
      isAiGenerated: z.boolean().optional(),
      moveInCondition: z.enum(["new","excellent","good","fair","poor","damaged","missing"]).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const [result] = await db.insert(inventoryItems).values({
        inspectionId: input.inspectionId ?? 0,
        propertyId: input.propertyId,
        name: input.name,
        category: input.category,
        quantity: input.quantity ?? 1,
        condition: input.condition ?? "good",
        description: input.description,
        serialNumber: input.serialNumber,
        notes: input.notes,
        isAiGenerated: input.isAiGenerated ?? false,
        moveInCondition: input.moveInCondition,
      });
      return { id: (result as any).insertId };
    }),

  updateInventoryItem: protectedProcedure
    .input(z.object({
      id: z.number(),
      condition: z.enum(["new","excellent","good","fair","poor","damaged","missing"]).optional(),
      moveOutCondition: z.enum(["new","excellent","good","fair","poor","damaged","missing"]).optional(),
      notes: z.string().optional(),
      quantity: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const { id, ...data } = input;
      await db.update(inventoryItems).set(data).where(eq(inventoryItems.id, id));
      return { success: true };
    }),

  deleteInventoryItem: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.delete(inventoryItems).where(eq(inventoryItems.id, input.id));
      return { success: true };
    }),
});
