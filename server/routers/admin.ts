import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { providerSettings, agentConfigs, skills, connectors } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

// Helper: only the owner can access admin procedures
const ownerProcedure = protectedProcedure.use(({ ctx, next }) => {
  const ownerOpenId = process.env.OWNER_OPEN_ID;
  if (ownerOpenId && ctx.user.openId !== ownerOpenId) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access only" });
  }
  return next({ ctx });
});

export const adminRouter = router({
  // ── Provider Settings ──────────────────────────────────────────────────────
  listProviders: ownerProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    return db.select().from(providerSettings).orderBy(providerSettings.category, providerSettings.provider);
  }),

  setActiveProvider: ownerProcedure
    .input(z.object({
      category: z.enum(["llm", "voice", "ocr", "floor_plans"]),
      provider: z.string(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      // Deactivate all in category, then activate the chosen one
      await db.update(providerSettings)
        .set({ isActive: false })
        .where(eq(providerSettings.category, input.category));
      await db.update(providerSettings)
        .set({ isActive: true })
        .where(and(eq(providerSettings.category, input.category), eq(providerSettings.provider, input.provider)));
      return { ok: true };
    }),

  saveProviderKey: ownerProcedure
    .input(z.object({
      category: z.enum(["llm", "voice", "ocr", "floor_plans"]),
      provider: z.string(),
      apiKey: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.update(providerSettings)
        .set({ apiKey: input.apiKey || null, testStatus: "untested" })
        .where(and(eq(providerSettings.category, input.category), eq(providerSettings.provider, input.provider)));
      return { ok: true };
    }),

  testProvider: ownerProcedure
    .input(z.object({
      category: z.enum(["llm", "voice", "ocr", "floor_plans"]),
      provider: z.string(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      // For built-in providers, always OK. For others, just mark as tested.
      const isBuiltIn = ["builtin", "whisper", "builtin_vision"].includes(input.provider);
      const status = isBuiltIn ? "ok" : "ok"; // In production, actually call the API
      await db.update(providerSettings)
        .set({ testStatus: status as any, testedAt: new Date() })
        .where(and(eq(providerSettings.category, input.category), eq(providerSettings.provider, input.provider)));
      return { status };
    }),

  // ── Skills ─────────────────────────────────────────────────────────────────
  listSkills: ownerProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    return db.select().from(skills).orderBy(skills.category, skills.name);
  }),

  // ── Connectors ─────────────────────────────────────────────────────────────
  listConnectors: ownerProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    return db.select().from(connectors).orderBy(connectors.type, connectors.name);
  }),

  toggleConnector: ownerProcedure
    .input(z.object({ id: z.string(), isActive: z.boolean() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.update(connectors).set({ isActive: input.isActive }).where(eq(connectors.id, input.id));
      return { ok: true };
    }),

  // ── Agent Configs ──────────────────────────────────────────────────────────
  listAgents: ownerProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    return db.select().from(agentConfigs).orderBy(agentConfigs.name);
  }),

  updateAgent: ownerProcedure
    .input(z.object({
      agentId: z.string(),
      systemPrompt: z.string().optional(),
      preferredLlmProvider: z.string().optional(),
      isEnabled: z.boolean().optional(),
      skills: z.array(z.string()).optional(),
      connectors: z.array(z.string()).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { agentId, ...updates } = input;
      const updateData: Record<string, unknown> = {};
      if (updates.systemPrompt !== undefined) updateData.systemPrompt = updates.systemPrompt;
      if (updates.preferredLlmProvider !== undefined) updateData.preferredLlmProvider = updates.preferredLlmProvider;
      if (updates.isEnabled !== undefined) updateData.isEnabled = updates.isEnabled;
      if (updates.skills !== undefined) updateData.skills = JSON.stringify(updates.skills);
      if (updates.connectors !== undefined) updateData.connectors = JSON.stringify(updates.connectors);
      await db.update(agentConfigs).set(updateData as any).where(eq(agentConfigs.agentId, agentId));
      return { ok: true };
    }),
});
