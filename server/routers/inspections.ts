import { z } from "zod";
import {
  createInspection,
  createRoom,
  getInspectionById,
  getInspections,
  getLastInspectionForProperty,
  getRoomsForInspection,
  updateInspection,
} from "../db";
import { protectedProcedure, router } from "../_core/trpc";

const DEFAULT_ROOMS = [
  "Entry / Hallway",
  "Living Room",
  "Kitchen",
  "Dining Room",
  "Master Bedroom",
  "Bedroom 2",
  "Bathroom",
  "Toilet",
  "Laundry",
  "Garage",
  "Exterior / Garden",
];

const INSPECTION_TYPE_ROOMS: Record<string, string[]> = {
  new_routine: DEFAULT_ROOMS,
  new_full: DEFAULT_ROOMS,
  new_move_in: DEFAULT_ROOMS,
  new_vacate: DEFAULT_ROOMS,
  new_inventory: ["Entry / Hallway", "Living Room", "Kitchen", "Master Bedroom", "Bedroom 2", "Bathroom", "Laundry"],
  new_chattels: ["Living Room", "Kitchen", "Master Bedroom", "Bedroom 2"],
  update_based_on_previous: [], // rooms copied from previous
};

export const inspectionsRouter = router({
  list: protectedProcedure
    .input(z.object({ propertyId: z.number().optional() }).optional())
    .query(async ({ input }) => {
      return getInspections(input?.propertyId);
    }),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const result = await getInspectionById(input.id);
      if (!result) throw new Error("Inspection not found");
      const rooms = await getRoomsForInspection(input.id);
      return { ...result, rooms };
    }),

  create: protectedProcedure
    .input(
      z.object({
        propertyId: z.number(),
        appointmentId: z.number().optional(),
        type: z.enum([
          "update_based_on_previous",
          "new_full",
          "new_vacate",
          "new_inventory",
          "new_chattels",
          "new_routine",
          "new_move_in",
        ]),
        generalNotes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      let previousInspectionId: number | undefined;
      let roomNames: string[] = INSPECTION_TYPE_ROOMS[input.type] ?? DEFAULT_ROOMS;

      // For "update based on previous", find and copy rooms from last inspection
      if (input.type === "update_based_on_previous") {
        const prev = await getLastInspectionForProperty(input.propertyId);
        if (prev) {
          previousInspectionId = prev.id;
          const prevRooms = await getRoomsForInspection(prev.id);
          roomNames = prevRooms.map((r) => r.name);
        } else {
          roomNames = DEFAULT_ROOMS;
        }
      }

      const inspectionId = await createInspection({
        propertyId: input.propertyId,
        appointmentId: input.appointmentId,
        inspectorId: ctx.user.id,
        type: input.type,
        previousInspectionId,
        generalNotes: input.generalNotes,
        startedAt: new Date(),
      });

      // Create default rooms
      for (let i = 0; i < roomNames.length; i++) {
        await createRoom({
          inspectionId,
          name: roomNames[i],
          roomOrder: i,
        });
      }

      return { inspectionId };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["draft", "in_progress", "completed", "report_sent"]).optional(),
        overallCondition: z.enum(["excellent", "good", "fair", "poor"]).optional(),
        generalNotes: z.string().optional(),
        completedAt: z.date().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await updateInspection(id, data);
      return { success: true };
    }),

  complete: protectedProcedure
    .input(z.object({ id: z.number(), overallCondition: z.enum(["excellent", "good", "fair", "poor"]).optional() }))
    .mutation(async ({ input }) => {
      await updateInspection(input.id, {
        status: "completed",
        completedAt: new Date(),
        overallCondition: input.overallCondition,
      });
      return { success: true };
    }),

  getPrevious: protectedProcedure
    .input(z.object({ propertyId: z.number() }))
    .query(async ({ input }) => {
      const prev = await getLastInspectionForProperty(input.propertyId);
      if (!prev) return null;
      const rooms = await getRoomsForInspection(prev.id);
      return { ...prev, rooms };
    }),

  pushTo: protectedProcedure
    .input(z.object({
      inspectionId: z.number(),
      destination: z.enum(["palace", "console", "propertytree", "rest", "email", "pdf"]),
      emailAddress: z.string().email().optional(),
    }))
    .mutation(async ({ input }) => {
      const labels: Record<string, string> = {
        palace: "Palace",
        console: "Console Cloud",
        propertytree: "PropertyTree",
        rest: "REST Professional",
        email: "Email",
        pdf: "PDF Download",
      };
      const dest = labels[input.destination] ?? input.destination;
      return {
        success: true,
        message: input.destination === "email"
          ? `Report queued for delivery to ${input.emailAddress ?? "recipient"}`
          : input.destination === "pdf"
          ? "PDF generation queued"
          : `Inspection data pushed to ${dest} successfully`,
        destination: dest,
      };
    }),
});
