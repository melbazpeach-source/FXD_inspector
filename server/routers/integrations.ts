import { z } from "zod";
import {
  createSyncLog,
  getSyncLogs,
  getIntegrationConfigs,
  upsertIntegrationConfig,
} from "../db";
import { protectedProcedure, router } from "../_core/trpc";

const PLATFORM_LABELS: Record<string, string> = {
  palace: "Palace",
  console: "Console",
  propertytree: "PropertyTree",
  rest: "REST / Generic API",
  test: "Test / Sandbox",
};

export const integrationsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const configs = await getIntegrationConfigs(ctx.user.id);
    // Return all platforms with their config (or defaults)
    const platforms = ["palace", "console", "propertytree", "rest", "test"] as const;
    return platforms.map((platform) => {
      const config = configs.find((c) => c.platform === platform);
      return {
        platform,
        label: PLATFORM_LABELS[platform],
        isEnabled: config?.isEnabled ?? false,
        isSandbox: config?.isSandbox ?? false,
        syncStatus: config?.syncStatus ?? "idle",
        lastSyncedAt: config?.lastSyncedAt ?? null,
        syncError: config?.syncError ?? null,
        hasCredentials: !!(config?.apiKey || config?.apiEndpoint),
        id: config?.id ?? null,
      };
    });
  }),

  configure: protectedProcedure
    .input(
      z.object({
        platform: z.enum(["palace", "console", "propertytree", "rest", "test"]),
        isEnabled: z.boolean().optional(),
        isSandbox: z.boolean().optional(),
        apiEndpoint: z.string().optional(),
        apiKey: z.string().optional(),
        apiSecret: z.string().optional(),
        webhookUrl: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await upsertIntegrationConfig({
        userId: ctx.user.id,
        ...input,
      });
      return { success: true };
    }),

  testConnection: protectedProcedure
    .input(
      z.object({
        platform: z.enum(["palace", "console", "propertytree", "rest", "test"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const configs = await getIntegrationConfigs(ctx.user.id);
      const config = configs.find((c) => c.platform === input.platform);

      if (input.platform === "test") {
        // Test mode always succeeds
        if (config) {
          await upsertIntegrationConfig({
            userId: ctx.user.id,
            platform: "test",
            syncStatus: "success",
            lastSyncedAt: new Date(),
            isEnabled: true,
          });
          await createSyncLog({
            integrationId: config.id,
            platform: "test",
            action: "test_connection",
            status: "success",
            message: "Test connection successful — sandbox mode active",
            recordsAffected: 0,
          });
        }
        return { success: true, message: "Test connection successful — sandbox mode active" };
      }

      if (!config?.apiKey && !config?.apiEndpoint) {
        return { success: false, message: "No credentials configured for this platform" };
      }

      // For real platforms, attempt a basic connectivity check
      try {
        if (config.apiEndpoint) {
          const response = await fetch(config.apiEndpoint, {
            method: "GET",
            headers: config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {},
            signal: AbortSignal.timeout(5000),
          });
          const success = response.ok;
          await upsertIntegrationConfig({
            userId: ctx.user.id,
            platform: input.platform,
            syncStatus: success ? "success" : "error",
            lastSyncedAt: new Date(),
            syncError: success ? null : `HTTP ${response.status}`,
          });
          if (config) {
            await createSyncLog({
              integrationId: config.id,
              platform: input.platform,
              action: "test_connection",
              status: success ? "success" : "error",
              message: success ? "Connection successful" : `HTTP ${response.status}`,
            });
          }
          return { success, message: success ? "Connection successful" : `HTTP ${response.status}` };
        }
        return { success: false, message: "No API endpoint configured" };
      } catch (e: any) {
        if (config) {
          await upsertIntegrationConfig({
            userId: ctx.user.id,
            platform: input.platform,
            syncStatus: "error",
            syncError: e.message,
          });
          await createSyncLog({
            integrationId: config.id,
            platform: input.platform,
            action: "test_connection",
            status: "error",
            message: e.message,
          });
        }
        return { success: false, message: e.message };
      }
    }),

  sync: protectedProcedure
    .input(
      z.object({
        platform: z.enum(["palace", "console", "propertytree", "rest", "test"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const configs = await getIntegrationConfigs(ctx.user.id);
      const config = configs.find((c) => c.platform === input.platform);

      if (input.platform === "test") {
        // Simulate a sync with test data
        if (config) {
          await createSyncLog({
            integrationId: config.id,
            platform: "test",
            action: "sync_appointments",
            status: "success",
            message: "Synced 3 appointments from test environment",
            recordsAffected: 3,
          });
          await upsertIntegrationConfig({
            userId: ctx.user.id,
            platform: "test",
            syncStatus: "success",
            lastSyncedAt: new Date(),
          });
        }
        return { success: true, recordsAffected: 3, message: "Synced 3 test appointments" };
      }

      return { success: false, message: "Platform sync requires configuration. Please set up API credentials first." };
    }),

  getLogs: protectedProcedure
    .input(z.object({ integrationId: z.number(), limit: z.number().optional() }))
    .query(async ({ input }) => {
      return getSyncLogs(input.integrationId, input.limit);
    }),
});
