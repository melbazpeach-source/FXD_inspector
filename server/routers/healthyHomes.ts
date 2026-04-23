import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "../db";
import { healthyHomesAssessments } from "../../drizzle/schema";
import { protectedProcedure, router } from "../_core/trpc";
import { invokeLLM } from "../_core/llm";

export const healthyHomesRouter = router({
  getByProperty: protectedProcedure
    .input(z.object({ propertyId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      const results = await db
        .select()
        .from(healthyHomesAssessments)
        .where(eq(healthyHomesAssessments.propertyId, input.propertyId))
        .limit(1);
      return results[0] ?? null;
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      const results = await db
        .select()
        .from(healthyHomesAssessments)
        .where(eq(healthyHomesAssessments.id, input.id))
        .limit(1);
      return results[0] ?? null;
    }),

  listByProperty: protectedProcedure
    .input(z.object({ propertyId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db
        .select()
        .from(healthyHomesAssessments)
        .where(eq(healthyHomesAssessments.propertyId, input.propertyId));
    }),

  create: protectedProcedure
    .input(z.object({
      propertyId: z.number(),
      inspectionId: z.number().optional(),
      climateZone: z.enum(["1", "2", "3"]),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const [result] = await db.insert(healthyHomesAssessments).values({
        propertyId: input.propertyId,
        inspectionId: input.inspectionId,
        inspectorId: ctx.user!.id,
        climateZone: input.climateZone,
        status: "draft",
      });
      return { id: (result as any).insertId };
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      climateZone: z.enum(["1", "2", "3"]).optional(),
      // Heating
      heatingCompliant: z.boolean().optional(),
      heatingDeviceType: z.string().optional(),
      heatingCapacityKw: z.string().optional(),
      heatingRequiredKw: z.string().optional(),
      heatingNotes: z.string().optional(),
      heatingPhotoUrl: z.string().optional(),
      // Insulation
      insulationCompliant: z.boolean().optional(),
      ceilingInsulationRValue: z.string().optional(),
      underfloorInsulationRValue: z.string().optional(),
      ceilingInsulationNotes: z.string().optional(),
      underfloorInsulationNotes: z.string().optional(),
      insulationPhotoUrl: z.string().optional(),
      // Ventilation
      ventilationCompliant: z.boolean().optional(),
      kitchenExtractorFan: z.boolean().optional(),
      bathroomExtractorFan: z.boolean().optional(),
      openableWindowsCompliant: z.boolean().optional(),
      ventilationNotes: z.string().optional(),
      // Moisture
      moistureCompliant: z.boolean().optional(),
      gutterCondition: z.enum(["good", "fair", "poor", "na"]).optional(),
      subfloorMoistureBarrier: z.boolean().optional(),
      moistureNotes: z.string().optional(),
      // Draught
      draughtCompliant: z.boolean().optional(),
      unusedFireplacesBlocked: z.boolean().optional(),
      draughtNotes: z.string().optional(),
      // Overall
      overallCompliant: z.boolean().optional(),
      status: z.enum(["draft", "completed", "report_sent"]).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const { id, ...data } = input;
      // Auto-calculate overall compliance
      const updateData: Record<string, unknown> = { ...data };
      if (
        data.heatingCompliant !== undefined &&
        data.insulationCompliant !== undefined &&
        data.ventilationCompliant !== undefined &&
        data.moistureCompliant !== undefined &&
        data.draughtCompliant !== undefined
      ) {
        updateData.overallCompliant =
          data.heatingCompliant &&
          data.insulationCompliant &&
          data.ventilationCompliant &&
          data.moistureCompliant &&
          data.draughtCompliant;
      }
      await db.update(healthyHomesAssessments).set(updateData).where(eq(healthyHomesAssessments.id, id));
      return { success: true };
    }),

  // AI-powered compliance analysis
  generateAiSummary: protectedProcedure
    .input(z.object({
      assessmentId: z.number(),
      propertyAddress: z.string(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");

      const results = await db
        .select()
        .from(healthyHomesAssessments)
        .where(eq(healthyHomesAssessments.id, input.assessmentId))
        .limit(1);
      const assessment = results[0];
      if (!assessment) throw new Error("Assessment not found");

      const prompt = `You are a New Zealand Healthy Homes compliance specialist. Analyse this assessment and produce a professional compliance summary.

Property: ${input.propertyAddress}
Climate Zone: ${assessment.climateZone}

HEATING: ${assessment.heatingCompliant ? "COMPLIANT" : "NON-COMPLIANT"}
- Device: ${assessment.heatingDeviceType ?? "Not recorded"}
- Capacity: ${assessment.heatingCapacityKw ?? "Not recorded"} kW (Required: ${assessment.heatingRequiredKw ?? "Not calculated"} kW)
- Notes: ${assessment.heatingNotes ?? "None"}

INSULATION: ${assessment.insulationCompliant ? "COMPLIANT" : "NON-COMPLIANT"}
- Ceiling R-value: ${assessment.ceilingInsulationRValue ?? "Not recorded"}
- Underfloor R-value: ${assessment.underfloorInsulationRValue ?? "Not recorded"}
- Notes: ${assessment.ceilingInsulationNotes ?? ""} ${assessment.underfloorInsulationNotes ?? ""}

VENTILATION: ${assessment.ventilationCompliant ? "COMPLIANT" : "NON-COMPLIANT"}
- Kitchen extractor fan: ${assessment.kitchenExtractorFan ? "Present" : "Missing/Non-compliant"}
- Bathroom extractor fan: ${assessment.bathroomExtractorFan ? "Present" : "Missing/Non-compliant"}
- Openable windows (5% rule): ${assessment.openableWindowsCompliant ? "Compliant" : "Non-compliant"}
- Notes: ${assessment.ventilationNotes ?? "None"}

MOISTURE & DRAINAGE: ${assessment.moistureCompliant ? "COMPLIANT" : "NON-COMPLIANT"}
- Gutter condition: ${assessment.gutterCondition ?? "Not assessed"}
- Subfloor moisture barrier: ${assessment.subfloorMoistureBarrier ? "Present" : "Absent/Not applicable"}
- Notes: ${assessment.moistureNotes ?? "None"}

DRAUGHT STOPPING: ${assessment.draughtCompliant ? "COMPLIANT" : "NON-COMPLIANT"}
- Unused fireplaces blocked: ${assessment.unusedFireplacesBlocked ? "Yes" : "No/Not applicable"}
- Notes: ${assessment.draughtNotes ?? "None"}

OVERALL: ${assessment.overallCompliant ? "COMPLIANT" : "NON-COMPLIANT"}

Write a professional compliance summary covering:
1. Overall compliance status and what this means for the landlord
2. For each non-compliant standard: specific remediation required, estimated urgency, and potential penalty if not addressed
3. For each compliant standard: confirmation and any maintenance recommendations
4. Compliance statement guidance — what the landlord needs to include in their next tenancy agreement
5. A plain-English summary suitable for sharing with the property owner

Use precise, factual language. Reference the Residential Tenancies (Healthy Homes Standards) Regulations 2019 where relevant. Do not use subjective language.`;

      const response = await invokeLLM({
        messages: [
          { role: "system", content: "You are a New Zealand Healthy Homes compliance specialist with expertise in the Residential Tenancies (Healthy Homes Standards) Regulations 2019. Produce clear, accurate, defensible compliance assessments." },
          { role: "user", content: prompt },
        ],
      });

      const rawContent = response.choices[0]?.message?.content;
      const summary = typeof rawContent === "string" ? rawContent : "";
      await db.update(healthyHomesAssessments)
        .set({ aiSummary: summary })
        .where(eq(healthyHomesAssessments.id, input.assessmentId));

      return { summary };
    }),

  // Calculate required heating capacity using the NZ formula
  calculateHeatingCapacity: protectedProcedure
    .input(z.object({
      livingAreaM2: z.number(),
      ceilingHeightM: z.number(),
      climateZone: z.enum(["1", "2", "3"]),
      isModernDwelling: z.boolean().default(false),
      hasDoubleGlazing: z.boolean().default(false),
      ceilingInsulationRValue: z.number().optional(),
      underfloorInsulationRValue: z.number().optional(),
    }))
    .query(async ({ input }) => {
      // NZ Healthy Homes heating capacity formula (simplified)
      // Based on Schedule 2 of the Residential Tenancies (Healthy Homes Standards) Regulations 2019
      const { livingAreaM2, ceilingHeightM, climateZone, isModernDwelling, hasDoubleGlazing } = input;

      // Climate zone multipliers
      const zoneMultiplier = climateZone === "3" ? 1.3 : climateZone === "2" ? 1.1 : 1.0;

      // Base calculation: volume × climate factor
      const volume = livingAreaM2 * ceilingHeightM;

      let requiredKw: number;
      if (isModernDwelling) {
        // Modern dwelling formula (smaller heater needed due to better insulation)
        requiredKw = (volume * 0.07 * zoneMultiplier) + (hasDoubleGlazing ? 0 : 0.5);
      } else {
        // Standard formula
        requiredKw = (volume * 0.10 * zoneMultiplier) + (hasDoubleGlazing ? 0 : 0.8);
      }

      // Minimum 1.5 kW
      requiredKw = Math.max(1.5, Math.round(requiredKw * 10) / 10);

      return {
        requiredKw: requiredKw.toFixed(1),
        formula: isModernDwelling ? "modern_dwelling" : "standard",
        note: "This is an indicative calculation. Use the official Tenancy Services Heating Assessment Tool for compliance purposes.",
      };
    }),
});
