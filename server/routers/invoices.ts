import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { getDb } from "../db";
import { invoices } from "../../drizzle/schema";
import { protectedProcedure, router } from "../_core/trpc";

const lineItemSchema = z.object({
  description: z.string(),
  quantity: z.number(),
  unitPrice: z.number(),
  gst: z.boolean().default(true),
});

function calcTotals(lineItems: Array<{ description: string; quantity: number; unitPrice: number; gst: boolean }>) {
  let subtotalCents = 0;
  let gstCents = 0;
  for (const item of lineItems) {
    const lineCents = Math.round(item.quantity * item.unitPrice * 100);
    subtotalCents += lineCents;
    if (item.gst) gstCents += Math.round(lineCents * 0.15);
  }
  return { subtotalCents, gstCents, totalCents: subtotalCents + gstCents };
}

export const invoicesRouter = router({
  list: protectedProcedure
    .input(z.object({ propertyId: z.number().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const q = db.select().from(invoices).orderBy(desc(invoices.createdAt));
      if (input.propertyId) {
        return q.where(eq(invoices.propertyId, input.propertyId));
      }
      return q;
    }),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      const [row] = await db.select().from(invoices).where(eq(invoices.id, input.id));
      return row ?? null;
    }),

  create: protectedProcedure
    .input(z.object({
      propertyId: z.number(),
      inspectionId: z.number().optional(),
      recipientName: z.string().optional(),
      recipientEmail: z.string().optional(),
      recipientAddress: z.string().optional(),
      lineItems: z.array(lineItemSchema),
      notes: z.string().optional(),
      dueDate: z.date().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const { subtotalCents, gstCents, totalCents } = calcTotals(input.lineItems);
      const issueDate = new Date();
      const dueDate = input.dueDate ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      // Generate invoice number: INV-YYYYMM-XXXX
      const [countRow] = await db.select().from(invoices);
      const count = (countRow ? 1 : 0) + Math.floor(Math.random() * 9000) + 1000;
      const invoiceNumber = `INV-${issueDate.getFullYear()}${String(issueDate.getMonth() + 1).padStart(2, "0")}-${count}`;
      const [result] = await db.insert(invoices).values({
        propertyId: input.propertyId,
        inspectionId: input.inspectionId,
        invoiceNumber,
        issueDate,
        dueDate,
        status: "draft",
        recipientName: input.recipientName,
        recipientEmail: input.recipientEmail,
        recipientAddress: input.recipientAddress,
        lineItems: input.lineItems,
        subtotalCents,
        gstCents,
        totalCents,
        notes: input.notes,
      });
      return { id: (result as any).insertId, invoiceNumber };
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      recipientName: z.string().optional(),
      recipientEmail: z.string().optional(),
      recipientAddress: z.string().optional(),
      lineItems: z.array(lineItemSchema).optional(),
      notes: z.string().optional(),
      status: z.enum(["draft", "sent", "paid", "overdue", "cancelled"]).optional(),
      dueDate: z.date().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const updates: Record<string, unknown> = {};
      if (input.recipientName !== undefined) updates.recipientName = input.recipientName;
      if (input.recipientEmail !== undefined) updates.recipientEmail = input.recipientEmail;
      if (input.recipientAddress !== undefined) updates.recipientAddress = input.recipientAddress;
      if (input.notes !== undefined) updates.notes = input.notes;
      if (input.status !== undefined) updates.status = input.status;
      if (input.dueDate !== undefined) updates.dueDate = input.dueDate;
      if (input.lineItems !== undefined) {
        const { subtotalCents, gstCents, totalCents } = calcTotals(input.lineItems);
        updates.lineItems = input.lineItems;
        updates.subtotalCents = subtotalCents;
        updates.gstCents = gstCents;
        updates.totalCents = totalCents;
      }
      await db.update(invoices).set(updates).where(eq(invoices.id, input.id));
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.delete(invoices).where(eq(invoices.id, input.id));
      return { success: true };
    }),
});
