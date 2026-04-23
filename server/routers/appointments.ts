import { z } from "zod";
import {
  createAppointment,
  getAppointmentById,
  getAppointments,
  updateAppointment,
} from "../db";
import { protectedProcedure, router } from "../_core/trpc";

export const appointmentsRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        from: z.date().optional(),
        to: z.date().optional(),
        status: z.string().optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      return getAppointments(input);
    }),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const appt = await getAppointmentById(input.id);
      if (!appt) throw new Error("Appointment not found");
      return appt;
    }),

  create: protectedProcedure
    .input(
      z.object({
        propertyId: z.number(),
        scheduledAt: z.date(),
        durationMinutes: z.number().optional(),
        notes: z.string().optional(),
        platformSource: z
          .enum(["palace", "console", "propertytree", "rest", "test", "manual"])
          .optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await createAppointment({
        ...input,
        inspectorId: ctx.user.id,
      });
      return { success: true };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        status: z
          .enum(["scheduled", "in_progress", "completed", "cancelled"])
          .optional(),
        inspectionId: z.number().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await updateAppointment(id, data);
      return { success: true };
    }),

  // Simulate sync from NZ platforms (demo data for test mode)
  syncFromPlatform: protectedProcedure
    .input(
      z.object({
        platform: z.enum(["palace", "console", "propertytree", "rest", "test"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // In test mode, create sample appointments
      if (input.platform === "test") {
        const now = new Date();
        const sampleAppts = [
          {
            propertyId: 1,
            scheduledAt: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000),
            durationMinutes: 60,
            platformSource: "test" as const,
            syncStatus: "synced" as const,
            platformRef: "TEST-001",
            notes: "Routine inspection - 3 months",
          },
          {
            propertyId: 1,
            scheduledAt: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
            durationMinutes: 90,
            platformSource: "test" as const,
            syncStatus: "synced" as const,
            platformRef: "TEST-002",
            notes: "Move-in inspection",
          },
        ];
        for (const appt of sampleAppts) {
          await createAppointment({ ...appt, inspectorId: ctx.user.id });
        }
        return { success: true, count: sampleAppts.length };
      }
      return { success: true, count: 0, message: "Platform integration pending configuration" };
    }),
});
