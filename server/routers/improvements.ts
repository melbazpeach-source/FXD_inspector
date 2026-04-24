import { z } from "zod";
import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { improvements } from "../../drizzle/schema";
import { protectedProcedure, router } from "../_core/trpc";

export const improvementsRouter = router({
  list: protectedProcedure
    .input(z.object({ propertyId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db
        .select()
        .from(improvements)
        .where(eq(improvements.propertyId, input.propertyId))
        .orderBy(improvements.createdAt);
    }),

  create: protectedProcedure
    .input(z.object({
      propertyId: z.number(),
      inspectionId: z.number().optional(),
      category: z.enum(["kitchen", "bathroom", "flooring", "exterior", "interior", "landscaping", "roofing", "other"]).default("other"),
      title: z.string().min(1),
      description: z.string().optional(),
      priority: z.enum(["urgent", "high", "medium", "low"]).default("medium"),
      estimatedCostMin: z.number().optional(),
      estimatedCostMax: z.number().optional(),
      potentialRentUplift: z.number().optional(),
      roiMonths: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const [result] = await db.insert(improvements).values({
        propertyId: input.propertyId,
        inspectionId: input.inspectionId,
        category: input.category,
        title: input.title,
        description: input.description,
        priority: input.priority,
        estimatedCostMin: input.estimatedCostMin,
        estimatedCostMax: input.estimatedCostMax,
        potentialRentUplift: input.potentialRentUplift,
        roiMonths: input.roiMonths,
        status: "recommended",
      });
      return { id: (result as any).insertId };
    }),

  updateStatus: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["recommended", "approved", "in_progress", "completed", "deferred"]),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.update(improvements)
        .set({ status: input.status })
        .where(eq(improvements.id, input.id));
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.delete(improvements).where(eq(improvements.id, input.id));
      return { success: true };
    }),
});
