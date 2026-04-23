import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { marketingPhotos, inspectionRooms, aiDescriptions, properties, inspections } from "../../drizzle/schema";
import { eq, desc, and } from "drizzle-orm";
import { generateImage } from "../_core/imageGeneration";
import { storagePut } from "../storage";
import { TRPCError } from "@trpc/server";

// The 3 marketing shot styles we generate for every property
const SHOT_STYLES: { style: string; label: string; promptFn: (ctx: PropertyContext) => string }[] = [
  {
    style: "hero_exterior",
    label: "Hero Exterior",
    promptFn: (ctx) =>
      `Professional real estate marketing photograph of the exterior of a ${ctx.propertyType} residential property at ${ctx.address}, ${ctx.suburb}, New Zealand. ` +
      `${ctx.condition === "excellent" ? "Immaculate, freshly painted, well-maintained gardens." : ctx.condition === "good" ? "Well-maintained exterior, tidy gardens." : "Neat and tidy exterior."} ` +
      `Shot from street level, golden hour lighting, wide angle lens, ultra-sharp, magazine-quality real estate photography. No people. No text overlays.`,
  },
  {
    style: "living_room",
    label: "Living / Dining",
    promptFn: (ctx) =>
      `Professional real estate interior marketing photograph of the living and dining area of a ${ctx.propertyType} in ${ctx.suburb}, New Zealand. ` +
      `${ctx.livingRoomDesc || "Modern, light-filled open-plan living and dining space."} ` +
      `Natural light streaming through windows, styled with tasteful neutral furnishings, hardwood or quality carpet floors. ` +
      `Wide angle lens, bright and airy, ultra-sharp, magazine-quality real estate photography. No people. No text overlays.`,
  },
  {
    style: "kitchen",
    label: "Kitchen",
    promptFn: (ctx) =>
      `Professional real estate interior marketing photograph of the kitchen of a ${ctx.propertyType} in ${ctx.suburb}, New Zealand. ` +
      `${ctx.kitchenDesc || "Modern kitchen with quality appliances, stone benchtops, and ample storage."} ` +
      `Clean, bright, styled with fresh fruit or flowers, natural light. ` +
      `Wide angle lens, ultra-sharp, magazine-quality real estate photography. No people. No text overlays.`,
  },
];

type PropertyContext = {
  address: string;
  suburb: string;
  propertyType: string;
  condition: string;
  livingRoomDesc?: string;
  kitchenDesc?: string;
};

async function buildPropertyContext(propertyId: number, inspectionId?: number): Promise<PropertyContext> {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

  // Get property
  const [property] = await db.select().from(properties).where(eq(properties.id, propertyId)).limit(1);
  if (!property) throw new TRPCError({ code: "NOT_FOUND", message: "Property not found" });

  // Get inspection if provided
  let condition = "good";
  let livingRoomDesc: string | undefined;
  let kitchenDesc: string | undefined;

  if (inspectionId) {
    const [inspection] = await db.select().from(inspections).where(eq(inspections.id, inspectionId)).limit(1);
    if (inspection?.overallCondition) condition = inspection.overallCondition;

    // Get rooms
    const rooms = await db.select().from(inspectionRooms).where(eq(inspectionRooms.inspectionId, inspectionId));

    // Get AI descriptions for rooms
    const aiDescs = await db.select().from(aiDescriptions).where(eq(aiDescriptions.inspectionId, inspectionId));

    // Match living room and kitchen descriptions
    for (const room of rooms) {
      const desc = aiDescs.find(d => d.roomId === room.id);
      const nameLower = room.name.toLowerCase();
      if ((nameLower.includes("living") || nameLower.includes("lounge")) && desc?.decor) {
        livingRoomDesc = desc.decor.slice(0, 200);
      }
      if (nameLower.includes("kitchen") && desc?.decor) {
        kitchenDesc = desc.decor.slice(0, 200);
      }
    }
  }

  return {
    address: property.address,
    suburb: property.suburb || property.city || "New Zealand",
    propertyType: "house",
    condition,
    livingRoomDesc,
    kitchenDesc,
  };
}

export const marketingPhotosRouter = router({
  // List all marketing photos for a property
  list: protectedProcedure
    .input(z.object({ propertyId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db
        .select()
        .from(marketingPhotos)
        .where(eq(marketingPhotos.propertyId, input.propertyId))
        .orderBy(desc(marketingPhotos.createdAt));
    }),

  // Generate 3 marketing photos for a property/inspection
  generate: protectedProcedure
    .input(z.object({
      propertyId: z.number(),
      inspectionId: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      const ctx = await buildPropertyContext(input.propertyId, input.inspectionId);

      const results: { style: string; label: string; url: string }[] = [];

      for (const shot of SHOT_STYLES) {
        const prompt = shot.promptFn(ctx);
        try {
          const { url } = await generateImage({ prompt });
          if (!url) continue;

          // The generateImage helper already stores to S3 and returns /manus-storage/... url
          // We extract the key from the url path
          const storageKey = url.replace(/^\/manus-storage\//, "");

          await db.insert(marketingPhotos).values({
            propertyId: input.propertyId,
            inspectionId: input.inspectionId ?? null,
            url,
            storageKey,
            style: shot.style,
            roomLabel: shot.label,
            prompt,
          });

          results.push({ style: shot.style, label: shot.label, url });
        } catch (err) {
          console.error(`Failed to generate ${shot.style} photo:`, err);
          // Continue generating the others even if one fails
        }
      }

      if (results.length === 0) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "All image generations failed" });
      }

      return results;
    }),

  // Delete a marketing photo
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      await db.delete(marketingPhotos).where(eq(marketingPhotos.id, input.id));
      return { success: true };
    }),
});
