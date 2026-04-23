import { z } from "zod";
import {
  createRoom,
  createRoomItem,
  deleteRoom,
  getRoomById,
  getRoomItems,
  getRoomsForInspection,
  updateRoom,
  updateRoomItem,
  createMaintenanceItem,
  getMaintenanceItems,
  updateMaintenanceItem,
} from "../db";
import { protectedProcedure, router } from "../_core/trpc";

export const roomsRouter = router({
  list: protectedProcedure
    .input(z.object({ inspectionId: z.number() }))
    .query(async ({ input }) => {
      return getRoomsForInspection(input.inspectionId);
    }),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const room = await getRoomById(input.id);
      if (!room) throw new Error("Room not found");
      const items = await getRoomItems(input.id);
      return { ...room, items };
    }),

  create: protectedProcedure
    .input(
      z.object({
        inspectionId: z.number(),
        name: z.string().min(1),
        roomOrder: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const id = await createRoom(input);
      return { id };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        conditionRating: z.enum(["excellent", "good", "fair", "poor", "na"]).optional(),
        notes: z.string().optional(),
        hasIssues: z.boolean().optional(),
        isComplete: z.boolean().optional(),
        roomOrder: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await updateRoom(id, data);
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteRoom(input.id);
      return { success: true };
    }),

  // Room items (checklist)
  addItem: protectedProcedure
    .input(
      z.object({
        roomId: z.number(),
        label: z.string().min(1),
        conditionRating: z.enum(["excellent", "good", "fair", "poor", "na"]).optional(),
        notes: z.string().optional(),
        isDamaged: z.boolean().optional(),
        maintenanceRequired: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const id = await createRoomItem(input);
      return { id };
    }),

  updateItem: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        conditionRating: z.enum(["excellent", "good", "fair", "poor", "na"]).optional(),
        notes: z.string().optional(),
        isDamaged: z.boolean().optional(),
        maintenanceRequired: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await updateRoomItem(id, data);
      return { success: true };
    }),

  // Maintenance items
  addMaintenance: protectedProcedure
    .input(
      z.object({
        inspectionId: z.number(),
        roomId: z.number().optional(),
        description: z.string().min(1),
        priority: z.enum(["urgent", "high", "medium", "low"]).optional(),
        isDamage: z.boolean().optional(),
        estimatedCost: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const id = await createMaintenanceItem(input);
      return { id };
    }),

  updateMaintenance: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        description: z.string().optional(),
        priority: z.enum(["urgent", "high", "medium", "low"]).optional(),
        status: z.enum(["open", "in_progress", "resolved"]).optional(),
        estimatedCost: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await updateMaintenanceItem(id, data);
      return { success: true };
    }),

  listMaintenance: protectedProcedure
    .input(z.object({ inspectionId: z.number() }))
    .query(async ({ input }) => {
      return getMaintenanceItems(input.inspectionId);
    }),
});
