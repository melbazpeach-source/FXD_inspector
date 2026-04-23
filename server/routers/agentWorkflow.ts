import { eq, and, desc } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "../db";
import {
  inspections,
  inspectionRooms,
  photos,
  aiDescriptions,
  maintenanceItems,
  pmReviewQueue,
  maintenancePlanItems,
  rentalAppraisals,
  properties,
  tenants,
  chattels,
} from "../../drizzle/schema";
import { protectedProcedure, router } from "../_core/trpc";
import { invokeLLM } from "../_core/llm";

// ── Post-Inspection Autonomous Agent ─────────────────────────────────────────
// Runs automatically when an inspection is marked complete.
// Reviews all rooms, identifies critical issues, creates maintenance requests,
// drafts tenant letter, generates PDF queue entry — all without PM touching anything.

export const agentWorkflowRouter = router({
  // Trigger the post-inspection agent
  runPostInspectionAgent: protectedProcedure
    .input(z.object({ inspectionId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");

      // 1. Load inspection + property + rooms + photos + AI descriptions
      const inspectionResult = await db
        .select()
        .from(inspections)
        .where(eq(inspections.id, input.inspectionId))
        .limit(1);
      const inspection = inspectionResult[0];
      if (!inspection) throw new Error("Inspection not found");

      const propertyResult = await db
        .select()
        .from(properties)
        .where(eq(properties.id, inspection.propertyId))
        .limit(1);
      const property = propertyResult[0];

      const tenantList = await db
        .select()
        .from(tenants)
        .where(eq(tenants.propertyId, inspection.propertyId));

      const rooms = await db
        .select()
        .from(inspectionRooms)
        .where(eq(inspectionRooms.inspectionId, input.inspectionId));

      const allPhotos = await db
        .select()
        .from(photos)
        .where(eq(photos.inspectionId, input.inspectionId));

      const allDescriptions = await db
        .select()
        .from(aiDescriptions)
        .where(eq(aiDescriptions.inspectionId, input.inspectionId));

      const existingMaintenance = await db
        .select()
        .from(maintenanceItems)
        .where(eq(maintenanceItems.inspectionId, input.inspectionId));

      // 2. Build context for the agent
      const roomSummaries = rooms.map(room => {
        const roomPhotos = allPhotos.filter(p => p.roomId === room.id);
        const roomDesc = allDescriptions.find(d => d.roomId === room.id);
        return `
ROOM: ${room.name}
Condition: ${room.conditionRating ?? "not rated"}
Has Issues: ${room.hasIssues ? "YES" : "No"}
Notes: ${room.notes ?? "None"}
Photos: ${roomPhotos.length} (${roomPhotos.filter(p => p.photoType === "360").length} × 360°, ${roomPhotos.filter(p => p.photoType === "damage").length} × damage)
AI Description: ${roomDesc ? `Condition: ${roomDesc.condition ?? ""}. Points to note: ${roomDesc.pointsToNote ?? ""}. Recommendations: ${roomDesc.recommendations ?? ""}` : "Not yet generated"}
`;
      }).join("\n");

      const maintenanceSummary = existingMaintenance.map(m =>
        `- [${m.priority?.toUpperCase()}] ${m.description} (Room: ${rooms.find(r => r.id === m.roomId)?.name ?? "General"})${m.isDamage ? " [DAMAGE]" : ""}`
      ).join("\n");

      const inspectionType = inspection.type.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
      const primaryTenant = tenantList.find(t => t.isPrimary) ?? tenantList[0];

      // 3. Run the agent
      const agentPrompt = `You are Fixx, the FXD Inspector AI inspection agent. An inspector has just completed a ${inspectionType} inspection and you must now autonomously process the results.

PROPERTY: ${property?.address ?? "Unknown"}, ${property?.suburb ?? ""}, ${property?.city ?? ""}
INSPECTION TYPE: ${inspectionType}
OVERALL CONDITION: ${inspection.overallCondition ?? "Not rated"}
GENERAL NOTES: ${inspection.generalNotes ?? "None"}
TENANT: ${primaryTenant?.name ?? "Unknown"}

ROOM-BY-ROOM SUMMARY:
${roomSummaries}

MAINTENANCE ITEMS LOGGED:
${maintenanceSummary || "None logged"}

Your tasks:
1. REVIEW all rooms and identify any critical issues that require urgent maintenance requests (safety hazards, water damage, structural issues, appliance failures)
2. DRAFT a professional tenant letter that:
   - Opens with a positive acknowledgment of the tenancy
   - Summarises the overall condition of the property
   - Lists any maintenance items that will be attended to (without admitting fault)
   - Notes any tenant responsibilities or items requiring tenant attention
   - Closes professionally
   - Uses plain English, warm but professional tone
   - Is appropriate for the NZ rental market
3. PROVIDE an agent summary of the inspection for the PM to review

Respond in JSON format:
{
  "criticalIssues": [
    {
      "description": "string",
      "location": "string",
      "priority": "urgent|high|medium|low",
      "isDamage": boolean,
      "estimatedCost": "string"
    }
  ],
  "tenantLetter": "string (full letter text)",
  "agentSummary": "string (2-3 paragraph summary for PM)",
  "maintenanceRequestCount": number,
  "overallAssessment": "string (one sentence)"
}`;

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: "You are Fixx, the FXD Inspector AI inspection agent. You produce professional, accurate, tribunal-ready inspection outputs for the New Zealand property management market. You are objective, precise, and thorough. AI can draft, but it cannot decide — your outputs are always reviewed by a property manager before being sent.",
          },
          { role: "user", content: agentPrompt },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "post_inspection_result",
            strict: true,
            schema: {
              type: "object",
              properties: {
                criticalIssues: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      description: { type: "string" },
                      location: { type: "string" },
                      priority: { type: "string", enum: ["urgent", "high", "medium", "low"] },
                      isDamage: { type: "boolean" },
                      estimatedCost: { type: "string" },
                    },
                    required: ["description", "location", "priority", "isDamage", "estimatedCost"],
                    additionalProperties: false,
                  },
                },
                tenantLetter: { type: "string" },
                agentSummary: { type: "string" },
                maintenanceRequestCount: { type: "number" },
                overallAssessment: { type: "string" },
              },
              required: ["criticalIssues", "tenantLetter", "agentSummary", "maintenanceRequestCount", "overallAssessment"],
              additionalProperties: false,
            },
          },
        },
      });

      const rawContent = response.choices[0]?.message?.content;
      const content = typeof rawContent === "string" ? JSON.parse(rawContent) : null;
      if (!content) throw new Error("Agent returned no content");

      // 4. Create maintenance requests for critical issues
      for (const issue of content.criticalIssues) {
        await db.insert(maintenanceItems).values({
          inspectionId: input.inspectionId,
          description: issue.description,
          priority: issue.priority as "urgent" | "high" | "medium" | "low",
          isDamage: issue.isDamage,
          estimatedCost: issue.estimatedCost,
          status: "open",
        });
      }

      // 5. Create PM review queue entry
      const existing = await db
        .select()
        .from(pmReviewQueue)
        .where(eq(pmReviewQueue.inspectionId, input.inspectionId))
        .limit(1);

      if (existing.length === 0) {
        await db.insert(pmReviewQueue).values({
          inspectionId: input.inspectionId,
          propertyId: inspection.propertyId,
          tenantLetterDraft: content.tenantLetter,
          maintenanceRequestsCreated: content.criticalIssues.length > 0,
          maintenanceRequestCount: content.criticalIssues.length,
          agentNotes: content.agentSummary,
          status: "pending",
        });
      } else {
        await db.update(pmReviewQueue).set({
          tenantLetterDraft: content.tenantLetter,
          maintenanceRequestsCreated: content.criticalIssues.length > 0,
          maintenanceRequestCount: content.criticalIssues.length,
          agentNotes: content.agentSummary,
          status: "pending",
        }).where(eq(pmReviewQueue.inspectionId, input.inspectionId));
      }

      return {
        success: true,
        criticalIssuesFound: content.criticalIssues.length,
        tenantLetterDrafted: true,
        overallAssessment: content.overallAssessment,
        agentSummary: content.agentSummary,
      };
    }),

  // PM Review Queue
  getPmQueue: protectedProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) return [];
      return db
        .select()
        .from(pmReviewQueue)
        .where(eq(pmReviewQueue.status, "pending"))
        .orderBy(desc(pmReviewQueue.createdAt));
    }),

  getPmQueueItem: protectedProcedure
    .input(z.object({ inspectionId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      const results = await db
        .select()
        .from(pmReviewQueue)
        .where(eq(pmReviewQueue.inspectionId, input.inspectionId))
        .limit(1);
      return results[0] ?? null;
    }),

  updatePmQueueItem: protectedProcedure
    .input(z.object({
      id: z.number(),
      tenantLetterDraft: z.string().optional(),
      tenantLetterApproved: z.boolean().optional(),
      status: z.enum(["pending", "in_review", "approved", "rejected", "sent"]).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const { id, ...data } = input;
      const updateData: Record<string, unknown> = { ...data };
      if (data.status === "approved") {
        updateData.reviewedAt = new Date();
      }
      if (data.status === "sent") {
        updateData.sentAt = new Date();
      }
      await db.update(pmReviewQueue).set(updateData).where(eq(pmReviewQueue.id, id));
      return { success: true };
    }),

  // ── 12-Month Maintenance Plan ─────────────────────────────────────────────
  generateMaintenancePlan: protectedProcedure
    .input(z.object({
      propertyId: z.number(),
      propertyAddress: z.string(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");

      // Load inspection history
      const recentInspections = await db
        .select()
        .from(inspections)
        .where(and(
          eq(inspections.propertyId, input.propertyId),
          eq(inspections.status, "completed")
        ))
        .orderBy(desc(inspections.completedAt))
        .limit(5);

      // Load chattels
      const chattelList = await db
        .select()
        .from(chattels)
        .where(eq(chattels.propertyId, input.propertyId));

      // Load all maintenance items from recent inspections
      const allMaintenance: typeof maintenanceItems.$inferSelect[] = [];
      for (const insp of recentInspections) {
        const items = await db
          .select()
          .from(maintenanceItems)
          .where(eq(maintenanceItems.inspectionId, insp.id));
        allMaintenance.push(...items);
      }

      const chattelSummary = chattelList.map(c =>
        `- ${c.name} (${c.category}): Current condition ${c.currentCondition ?? "unknown"}${c.estimatedAge ? `, age: ${c.estimatedAge}` : ""}${c.isHealthyHomesItem ? " [Healthy Homes item]" : ""}`
      ).join("\n");

      const maintenanceSummary = allMaintenance.map(m =>
        `- [${m.priority}] ${m.description} - Status: ${m.status}`
      ).join("\n");

      const inspectionSummary = recentInspections.map((insp, i) =>
        `Inspection ${i + 1} (${insp.completedAt ? new Date(insp.completedAt).toLocaleDateString("en-NZ") : "date unknown"}): Overall ${insp.overallCondition ?? "not rated"} - ${insp.generalNotes ?? ""}`
      ).join("\n");

      const planPrompt = `You are Fixx, the FXD Inspector AI maintenance planning agent. Based on the inspection history and chattels register for this property, generate a comprehensive 12-month proactive maintenance plan.

PROPERTY: ${input.propertyAddress}

INSPECTION HISTORY (most recent first):
${inspectionSummary || "No completed inspections"}

CHATTELS REGISTER:
${chattelSummary || "No chattels registered"}

MAINTENANCE HISTORY:
${maintenanceSummary || "No maintenance items recorded"}

Generate a 12-month maintenance plan with items categorised using a traffic light system:
- RED: Needs immediate attention — safety risk, legal liability, or will cost significantly more if deferred
- ORANGE: Address within 3-6 months — deterioration noted, approaching end of life, or recurring issue
- GREEN: Monitor and maintain — good condition, preventive maintenance recommended

For each item provide:
- Title (concise)
- Description (what needs doing and why)
- Location in property
- Traffic light status (red/orange/green)
- Estimated cost bracket (under_500 / 500_2000 / 2000_10000 / over_10000)
- Recommended action
- Urgency timeline
- Month number when action should be taken (1-12)

Focus on:
1. Items with deteriorating condition across multiple inspections
2. Chattels approaching end of useful life (heat pumps 15yr, HWC 10-15yr, carpet 10yr, etc.)
3. Healthy Homes compliance items
4. Preventive maintenance to avoid costly reactive repairs
5. Seasonal maintenance (gutters before winter, heat pump servicing, etc.)

Respond in JSON format:
{
  "items": [
    {
      "title": "string",
      "description": "string",
      "location": "string",
      "trafficLight": "red|orange|green",
      "estimatedCostBracket": "under_500|500_2000|2000_10000|over_10000",
      "recommendedAction": "string",
      "urgencyTimeline": "string",
      "dueByMonth": number
    }
  ],
  "summary": "string (2-3 paragraph executive summary for property owner)"
}`;

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: "You are Fixx, the FXD Inspector AI maintenance planning agent. You produce practical, cost-conscious maintenance plans for New Zealand rental properties. Your recommendations are based on evidence from inspection history and industry-standard asset lifespans.",
          },
          { role: "user", content: planPrompt },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "maintenance_plan",
            strict: true,
            schema: {
              type: "object",
              properties: {
                items: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      description: { type: "string" },
                      location: { type: "string" },
                      trafficLight: { type: "string", enum: ["red", "orange", "green"] },
                      estimatedCostBracket: { type: "string", enum: ["under_500", "500_2000", "2000_10000", "over_10000"] },
                      recommendedAction: { type: "string" },
                      urgencyTimeline: { type: "string" },
                      dueByMonth: { type: "number" },
                    },
                    required: ["title", "description", "location", "trafficLight", "estimatedCostBracket", "recommendedAction", "urgencyTimeline", "dueByMonth"],
                    additionalProperties: false,
                  },
                },
                summary: { type: "string" },
              },
              required: ["items", "summary"],
              additionalProperties: false,
            },
          },
        },
      });

      const rawContent = response.choices[0]?.message?.content;
      const content = typeof rawContent === "string" ? JSON.parse(rawContent) : null;
      if (!content) throw new Error("Agent returned no content");

      // Clear existing plan items for this property
      await db.delete(maintenancePlanItems).where(eq(maintenancePlanItems.propertyId, input.propertyId));

      // Insert new plan items
      for (const item of content.items) {
        await db.insert(maintenancePlanItems).values({
          propertyId: input.propertyId,
          title: item.title,
          description: item.description,
          location: item.location,
          trafficLight: item.trafficLight as "red" | "orange" | "green",
          estimatedCostBracket: item.estimatedCostBracket as "under_500" | "500_2000" | "2000_10000" | "over_10000",
          recommendedAction: item.recommendedAction,
          urgencyTimeline: item.urgencyTimeline,
          dueByMonth: item.dueByMonth,
          isAiGenerated: true,
          status: "open",
        });
      }

      return {
        success: true,
        itemCount: content.items.length,
        summary: content.summary,
        redCount: content.items.filter((i: any) => i.trafficLight === "red").length,
        orangeCount: content.items.filter((i: any) => i.trafficLight === "orange").length,
        greenCount: content.items.filter((i: any) => i.trafficLight === "green").length,
      };
    }),

  getMaintenancePlan: protectedProcedure
    .input(z.object({ propertyId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db
        .select()
        .from(maintenancePlanItems)
        .where(eq(maintenancePlanItems.propertyId, input.propertyId))
        .orderBy(maintenancePlanItems.dueByMonth);
    }),

  updateMaintenancePlanItem: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["open", "in_progress", "completed", "deferred"]).optional(),
      trafficLight: z.enum(["red", "orange", "green"]).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const { id, ...data } = input;
      const updateData: Record<string, unknown> = { ...data };
      if (data.status === "completed") {
        updateData.completedAt = new Date();
      }
      await db.update(maintenancePlanItems).set(updateData).where(eq(maintenancePlanItems.id, id));
      return { success: true };
    }),

  // ── Rental Appraisal Agent ────────────────────────────────────────────────
  generateRentalAppraisal: protectedProcedure
    .input(z.object({
      propertyId: z.number(),
      currentRent: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");

      const propertyResult = await db
        .select()
        .from(properties)
        .where(eq(properties.id, input.propertyId))
        .limit(1);
      const property = propertyResult[0];
      if (!property) throw new Error("Property not found");

      const recentInspections = await db
        .select()
        .from(inspections)
        .where(and(
          eq(inspections.propertyId, input.propertyId),
          eq(inspections.status, "completed")
        ))
        .orderBy(desc(inspections.completedAt))
        .limit(3);

      const chattelList = await db
        .select()
        .from(chattels)
        .where(eq(chattels.propertyId, input.propertyId));

      const conditionSummary = recentInspections.map((insp, i) =>
        `Inspection ${i + 1}: Overall ${insp.overallCondition ?? "not rated"}`
      ).join(", ");

      const chattelCondition = chattelList
        .filter(c => ["kitchen", "heating_cooling", "floor_coverings"].includes(c.category))
        .map(c => `${c.name}: ${c.currentCondition}`)
        .join(", ");

      const appraisalPrompt = `You are Fixx, the FXD Inspector AI rental appraisal agent. Generate a comprehensive rental appraisal for this New Zealand property.

PROPERTY: ${property.address}, ${property.suburb ?? ""}, ${property.city ?? ""}
CURRENT RENT: ${input.currentRent ?? "Not provided"}

INSPECTION CONDITION HISTORY: ${conditionSummary || "No inspections completed"}
KEY CHATTELS CONDITION: ${chattelCondition || "Not assessed"}

Using your knowledge of the New Zealand rental market, provide:
1. A rental appraisal range (weekly rent in NZD)
2. Market analysis for this suburb/city
3. Condition premium or discount analysis
4. Market sentiment (rising/stable/softening)
5. Comparable property analysis
6. Recommendations for maximising rental return

Note: Base your analysis on general NZ market knowledge for this location. Always recommend the PM verify with current market data.

Respond in JSON format:
{
  "recommendedRentLow": "string (weekly NZD)",
  "recommendedRentHigh": "string (weekly NZD)",
  "marketMedian": "string (weekly NZD)",
  "conditionPremiumDiscount": "string (e.g. +$20/week premium for excellent condition)",
  "marketSentiment": "rising|stable|softening",
  "vacancyRate": "string (estimated %)",
  "comparableAnalysis": "string (2-3 sentences)",
  "draftReport": "string (full professional appraisal report, 4-6 paragraphs)"
}`;

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: "You are Fixx, the FXD Inspector AI rental appraisal agent. You produce professional rental appraisals for the New Zealand property management market. Your appraisals are evidence-based, market-aware, and clearly caveated as indicative estimates requiring PM verification.",
          },
          { role: "user", content: appraisalPrompt },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "rental_appraisal",
            strict: true,
            schema: {
              type: "object",
              properties: {
                recommendedRentLow: { type: "string" },
                recommendedRentHigh: { type: "string" },
                marketMedian: { type: "string" },
                conditionPremiumDiscount: { type: "string" },
                marketSentiment: { type: "string", enum: ["rising", "stable", "softening"] },
                vacancyRate: { type: "string" },
                comparableAnalysis: { type: "string" },
                draftReport: { type: "string" },
              },
              required: ["recommendedRentLow", "recommendedRentHigh", "marketMedian", "conditionPremiumDiscount", "marketSentiment", "vacancyRate", "comparableAnalysis", "draftReport"],
              additionalProperties: false,
            },
          },
        },
      });

      const rawContent = response.choices[0]?.message?.content;
      const content = typeof rawContent === "string" ? JSON.parse(rawContent) : null;
      if (!content) throw new Error("Agent returned no content");

      // Save the appraisal
      const [result] = await db.insert(rentalAppraisals).values({
        propertyId: input.propertyId,
        currentRent: input.currentRent,
        recommendedRentLow: content.recommendedRentLow,
        recommendedRentHigh: content.recommendedRentHigh,
        marketMedian: content.marketMedian,
        conditionPremiumDiscount: content.conditionPremiumDiscount,
        marketSentiment: content.marketSentiment as "rising" | "stable" | "softening",
        vacancyRate: content.vacancyRate,
        comparableAnalysis: content.comparableAnalysis,
        aiDraftReport: content.draftReport,
        status: "draft",
      });

      return {
        id: (result as any).insertId,
        ...content,
      };
    }),

  getAppraisals: protectedProcedure
    .input(z.object({ propertyId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db
        .select()
        .from(rentalAppraisals)
        .where(eq(rentalAppraisals.propertyId, input.propertyId))
        .orderBy(desc(rentalAppraisals.createdAt));
    }),

  // ── Fixx Chat Agent with Tool Access ─────────────────────────────────────
  chat: protectedProcedure
    .input(z.object({
      message: z.string(),
      propertyId: z.number().optional(),
      inspectionId: z.number().optional(),
      conversationHistory: z.array(z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      })).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();

      // Load context if property/inspection specified
      let contextBlock = "";
      if (input.propertyId && db) {
        const propResult = await db.select().from(properties).where(eq(properties.id, input.propertyId)).limit(1);
        const prop = propResult[0];
        if (prop) {
          contextBlock = `\nCurrent property context: ${prop.address}, ${prop.suburb ?? ""}, ${prop.city ?? ""}`;
        }
      }

      const history = (input.conversationHistory ?? []).map(m => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are Fixx, the FXD Inspector AI assistant — a knowledgeable, professional, and slightly witty property inspection expert for the New Zealand market. You help property managers and inspectors with:
- Inspection questions and guidance
- NZ tenancy law and Healthy Homes Standards
- Maintenance advice and cost estimates
- Report writing assistance
- Market insights
- Tribunal preparation

You are direct, accurate, and always remind users that your outputs are drafts for PM review — "AI can draft, but it cannot decide."

Always use NZ English spelling and terminology. Reference the Residential Tenancies Act 1986 and Healthy Homes Standards Regulations 2019 where relevant.${contextBlock}`,
          },
          ...history,
          { role: "user", content: input.message },
        ],
      });

      const rawContent = response.choices[0]?.message?.content;
      const reply = typeof rawContent === "string" ? rawContent : "I'm having trouble responding right now. Please try again.";

      return { reply };
    }),
});
