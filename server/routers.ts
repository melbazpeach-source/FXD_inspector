import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { propertiesRouter } from "./routers/properties";
import { appointmentsRouter } from "./routers/appointments";
import { inspectionsRouter } from "./routers/inspections";
import { roomsRouter } from "./routers/rooms";
import { mediaRouter } from "./routers/media";
import { reportsRouter } from "./routers/reports";
import { integrationsRouter } from "./routers/integrations";
import { chattelsRouter } from "./routers/chattels";
import { healthyHomesRouter } from "./routers/healthyHomes";
import { agentWorkflowRouter } from "./routers/agentWorkflow";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  properties: propertiesRouter,
  appointments: appointmentsRouter,
  inspections: inspectionsRouter,
  rooms: roomsRouter,
  media: mediaRouter,
  reports: reportsRouter,
  integrations: integrationsRouter,
  chattels: chattelsRouter,
  healthyHomes: healthyHomesRouter,
  agent: agentWorkflowRouter,
});

export type AppRouter = typeof appRouter;
