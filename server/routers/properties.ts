import { z } from "zod";
import {
  createProperty,
  getProperties,
  getPropertyById,
  getPropertyTenants,
} from "../db";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { tenants } from "../../drizzle/schema";

export const propertiesRouter = router({
  list: protectedProcedure.query(async () => {
    return getProperties();
  }),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const property = await getPropertyById(input.id);
      if (!property) throw new Error("Property not found");
      const propertyTenants = await getPropertyTenants(input.id);
      return { ...property, tenants: propertyTenants };
    }),

  create: protectedProcedure
    .input(
      z.object({
        address: z.string().min(1),
        suburb: z.string().optional(),
        city: z.string().optional(),
        postcode: z.string().optional(),
        landlordName: z.string().optional(),
        landlordEmail: z.string().email().optional(),
        landlordPhone: z.string().optional(),
        platformRef: z.string().optional(),
        platformSource: z
          .enum(["palace", "console", "propertytree", "rest", "test", "manual"])
          .optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      await createProperty(input);
      return { success: true };
    }),

  addTenant: protectedProcedure
    .input(
      z.object({
        propertyId: z.number(),
        name: z.string().min(1),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        isPrimary: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.insert(tenants).values(input);
      return { success: true };
    }),
});
