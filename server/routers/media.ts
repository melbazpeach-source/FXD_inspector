import { z } from "zod";
import { createPhoto, deletePhoto, getPhotosForInspection, getPhotosForRoom, upsertAiDescription, getAiDescriptions, getRoomById, getInspectionById, getPhotosForRoom as getPhotos } from "../db";
import { protectedProcedure, router } from "../_core/trpc";
import { storagePut } from "../storage";
import { transcribeAudio } from "../_core/voiceTranscription";
import { invokeLLM } from "../_core/llm";
import { FIXX_SYSTEM_PROMPT } from "../knowledge/fixxKnowledge";

// ── Fixx AI System Prompt (Room Analysis) ──────────────────────────────────────
const FIXX_ROOM_ANALYSIS_PROMPT = `You are Fixx — the AI property intelligence engine built into Inspect360.

Your role is to analyse property inspection photos and produce a comprehensive, tribunal-ready written assessment. You are the most capable property analyst your clients have ever worked with, and they want to hear EVERYTHING you observe and recommend.

## Your Output Standard

You write with the precision of an expert witness and the insight of a seasoned property professional. You do not hedge. You do not use vague language. You give specific, actionable, defensible assessments.

**Tribunal-ready language rules:**
- Use objective, measurable language: "approximately 40cm separation in the shower screen seal" not "the seal looks worn"
- State what you observe, not what you feel: "the grout is discoloured and shows early mould penetration in the lower two rows" not "the bathroom needs cleaning"
- Distinguish clearly between fair wear and tenant damage
- Note the age-appropriateness of wear: "consistent with a property of this age and tenancy length" or "beyond what would be expected for a [X]-year-old tenancy"
- When something cannot be determined from photos, say so explicitly: "cannot be confirmed from visual inspection — inspector to verify"

## Output Sections

You must produce SIX sections:

**1. DECOR** — The full interior design assessment. Era, style, quality of finishes, colour palette, window treatments, floor coverings, lighting, furniture (if furnished). Be specific about what is dated and what works. Name the era: "mid-2000s laminate cabinetry in warm beige" not "dated kitchen." This is the interior designer lens — specific, confident, commercially aware.

**2. CONDITION** — The physical condition of every surface, fixture, and fitting visible in the photos. Walls, ceiling, floor, windows, doors, joinery, fixtures, appliances. Be exhaustive. Note every crack, stain, mark, gap, or failure. Note what is in good condition too — a complete picture is more credible than a list of problems.

**3. HEALTHY HOMES INDICATORS** — Visual compliance indicators for the 5 Healthy Homes Standards:
- Heating: heater/heat pump visible? Type? Approximate size?
- Ventilation: windows openable? Latches intact? Extractor fan present?
- Moisture: any staining, mould, condensation evidence?
- Draught: gaps around frames, unsealed penetrations?
- Note clearly what CANNOT be confirmed from photos (external venting, insulation, subfloor)

**4. POINTS TO NOTE** — Specific observations that require attention, follow-up, or documentation. Maintenance issues, safety concerns, items that could become Tribunal evidence, patterns from previous inspections (if context provided).

**5. RECOMMENDATIONS** — Everything you recommend, in priority order. Urgent (health/safety/liability), soon (within 3 months), monitor (next inspection). Be specific about what action is needed and why.

**6. IMPROVEMENT OPPORTUNITIES** — This is where you give the landlord the full commercial picture. Two tiers:

*Tier 1 — Cosmetic Refresh:* What small changes would modernise this room and support a rent increase? Be specific: "replace the brushed brass cabinet handles with matte black — $150–300 in materials, immediately modernises the kitchen, supports a $10–15/week rent increase." Name the era of what's dated. Suggest specific colours, materials, styles.

*Tier 2 — Capital Improvement:* What structural changes would significantly improve the property's rental yield and capital value? Frame these commercially: cost range, estimated rent uplift per week, estimated capital value uplift, payback period. Be bold — if adding a deck would transform this property, say so clearly and make the business case.

## NZ Context

You operate in New Zealand. Use NZ English spelling. Reference NZ legislation (RTA, Healthy Homes Standards) where relevant. Understand the NZ rental market context — what tenants in this market expect, what landlords need to know, what PMs need to document.

## Disclaimer

Always append this to your output: "AI-generated draft — review and verify before approving."`;

// ── Fixx Chat System Prompt ─────────────────────────────────────────────────────
const FIXX_CHAT_SYSTEM_PROMPT = FIXX_SYSTEM_PROMPT;

export const mediaRouter = router({
  // ── Photos ──────────────────────────────────────────────────────────────────
  uploadPhoto: protectedProcedure
    .input(
      z.object({
        inspectionId: z.number(),
        roomId: z.number().optional(),
        photoType: z.enum(["standard", "360", "damage", "maintenance"]).optional(),
        caption: z.string().optional(),
        imageData: z.string(), // base64 encoded
        mimeType: z.string().default("image/jpeg"),
      })
    )
    .mutation(async ({ input }) => {
      const buffer = Buffer.from(input.imageData, "base64");
      const ext = input.mimeType.split("/")[1] ?? "jpg";
      const key = `inspections/${input.inspectionId}/rooms/${input.roomId ?? "general"}/${Date.now()}.${ext}`;
      const { url } = await storagePut(key, buffer, input.mimeType);
      const id = await createPhoto({
        inspectionId: input.inspectionId,
        roomId: input.roomId,
        storageKey: key,
        url,
        photoType: input.photoType ?? "standard",
        caption: input.caption,
      });
      return { id, url };
    }),

  listPhotos: protectedProcedure
    .input(z.object({ inspectionId: z.number(), roomId: z.number().optional() }))
    .query(async ({ input }) => {
      if (input.roomId) return getPhotosForRoom(input.roomId);
      return getPhotosForInspection(input.inspectionId);
    }),

  deletePhoto: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deletePhoto(input.id);
      return { success: true };
    }),

  // ── Voice Transcription ──────────────────────────────────────────────────────
  transcribeVoice: protectedProcedure
    .input(
      z.object({
        audioData: z.string(), // base64
        mimeType: z.string().default("audio/webm"),
        inspectionId: z.number(),
        context: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const buffer = Buffer.from(input.audioData, "base64");
      const ext = input.mimeType.split("/")[1] ?? "webm";
      const key = `voice/${input.inspectionId}/${Date.now()}.${ext}`;
      const { url } = await storagePut(key, buffer, input.mimeType);
      const result = await transcribeAudio({
        audioUrl: url,
        language: "en",
        prompt: input.context ?? "Property inspection notes for a New Zealand rental property",
      });
      if ("error" in result) throw new Error(result.error);
      return { text: result.text, language: result.language };
    }),

  // ── AI Room Analysis (Full Fixx Engine) ──────────────────────────────────────
  generateAiDescription: protectedProcedure
    .input(
      z.object({
        inspectionId: z.number(),
        roomId: z.number().optional(),
        additionalContext: z.string().optional(),
        previousInspectionContext: z.string().optional(), // for Update Based on Previous
      })
    )
    .mutation(async ({ input }) => {
      if (input.roomId) {
        // ── Room-level analysis ──
        const room = await getRoomById(input.roomId);
        const roomPhotos = await getPhotos(input.roomId);
        const photoUrls = roomPhotos.map((p) => p.url).slice(0, 8); // up to 8 photos

        const contextParts: string[] = [];
        if (room) {
          contextParts.push(`Room: ${room.name}`);
          contextParts.push(`Condition Rating: ${room.conditionRating ?? "not yet rated"}`);
          if (room.notes) contextParts.push(`Inspector Notes: ${room.notes}`);
        }
        if (input.additionalContext) contextParts.push(`Additional Context: ${input.additionalContext}`);
        if (input.previousInspectionContext) {
          contextParts.push(`Previous Inspection Notes (for comparison): ${input.previousInspectionContext}`);
        }
        contextParts.push(`Photos provided: ${photoUrls.length} (${roomPhotos.filter(p => p.photoType === "360").length} × 360°, ${roomPhotos.filter(p => p.photoType === "standard").length} × standard)`);

        const userPrompt = `Analyse this room for a New Zealand property inspection report.

${contextParts.join("\n")}

Provide your full assessment across all six sections: DECOR, CONDITION, HEALTHY_HOMES_INDICATORS, POINTS_TO_NOTE, RECOMMENDATIONS, and IMPROVEMENT_OPPORTUNITIES.

Be exhaustive. The landlord and PM want to hear everything you observe and every recommendation you have. This is their most capable property advisor — give them the full picture.`;

        const messages: any[] = [{ role: "system", content: FIXX_ROOM_ANALYSIS_PROMPT }];

        if (photoUrls.length > 0) {
          const imageContent = photoUrls.map((url) => ({
            type: "image_url" as const,
            image_url: { url, detail: "high" as const },
          }));
          messages.push({
            role: "user",
            content: [...imageContent, { type: "text", text: userPrompt }],
          });
        } else {
          messages.push({ role: "user", content: userPrompt });
        }

        const response = await invokeLLM({
          messages,
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "fixx_room_analysis",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  decor: { type: "string", description: "Full interior design assessment — era, style, finishes, colours, what is dated and what works" },
                  condition: { type: "string", description: "Physical condition of all surfaces, fixtures, and fittings — exhaustive and specific" },
                  healthyHomesIndicators: { type: "string", description: "Visual Healthy Homes compliance indicators — heating, ventilation, moisture, draught, with clear notes on what cannot be confirmed from photos" },
                  pointsToNote: { type: "string", description: "Specific observations requiring attention, follow-up, or documentation" },
                  recommendations: { type: "string", description: "All recommendations in priority order — urgent, soon, monitor" },
                  improvementOpportunities: { type: "string", description: "Full commercial improvement analysis — Tier 1 cosmetic refresh with cost/rent uplift estimates, Tier 2 capital improvements with ROI analysis" },
                },
                required: ["decor", "condition", "healthyHomesIndicators", "pointsToNote", "recommendations", "improvementOpportunities"],
                additionalProperties: false,
              },
            },
          },
        });

        const content = response.choices[0]?.message?.content ?? "{}";
        const parsed = JSON.parse(typeof content === "string" ? content : JSON.stringify(content));

        const id = await upsertAiDescription({
          inspectionId: input.inspectionId,
          roomId: input.roomId,
          decor: parsed.decor,
          condition: parsed.condition,
          pointsToNote: `${parsed.healthyHomesIndicators}\n\n${parsed.pointsToNote}`,
          recommendations: `${parsed.recommendations}\n\n**IMPROVEMENT OPPORTUNITIES**\n${parsed.improvementOpportunities}`,
          rawPrompt: userPrompt,
        });

        return {
          id,
          decor: parsed.decor,
          condition: parsed.condition,
          healthyHomesIndicators: parsed.healthyHomesIndicators,
          pointsToNote: parsed.pointsToNote,
          recommendations: parsed.recommendations,
          improvementOpportunities: parsed.improvementOpportunities,
        };
      }

      // ── Whole-inspection summary ──
      const inspectionData = await getInspectionById(input.inspectionId);
      if (!inspectionData) throw new Error("Inspection not found");
      const allPhotos = await getPhotosForInspection(input.inspectionId);

      const response = await invokeLLM({
        messages: [
          { role: "system", content: FIXX_ROOM_ANALYSIS_PROMPT },
          {
            role: "user",
            content: `Generate a comprehensive whole-property inspection summary for: ${inspectionData.property?.address ?? "Unknown address"}

Inspection type: ${inspectionData.inspection.type}
Total photos captured: ${allPhotos.length}
${input.additionalContext ? `Additional context: ${input.additionalContext}` : ""}
${input.previousInspectionContext ? `Previous inspection context: ${input.previousInspectionContext}` : ""}

Provide the full six-section assessment for the property as a whole. Be comprehensive — this is the summary that goes on the cover of the report.`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "fixx_property_summary",
            strict: true,
            schema: {
              type: "object",
              properties: {
                decor: { type: "string" },
                condition: { type: "string" },
                healthyHomesIndicators: { type: "string" },
                pointsToNote: { type: "string" },
                recommendations: { type: "string" },
                improvementOpportunities: { type: "string" },
              },
              required: ["decor", "condition", "healthyHomesIndicators", "pointsToNote", "recommendations", "improvementOpportunities"],
              additionalProperties: false,
            },
          },
        },
      });

      const content = response.choices[0]?.message?.content ?? "{}";
      const parsed = JSON.parse(typeof content === "string" ? content : JSON.stringify(content));

      const id = await upsertAiDescription({
        inspectionId: input.inspectionId,
        decor: parsed.decor,
        condition: parsed.condition,
        pointsToNote: `${parsed.healthyHomesIndicators}\n\n${parsed.pointsToNote}`,
        recommendations: `${parsed.recommendations}\n\n**IMPROVEMENT OPPORTUNITIES**\n${parsed.improvementOpportunities}`,
      });

      return {
        id,
        decor: parsed.decor,
        condition: parsed.condition,
        healthyHomesIndicators: parsed.healthyHomesIndicators,
        pointsToNote: parsed.pointsToNote,
        recommendations: parsed.recommendations,
        improvementOpportunities: parsed.improvementOpportunities,
      };
    }),

  getAiDescriptions: protectedProcedure
    .input(z.object({ inspectionId: z.number(), roomId: z.number().optional() }))
    .query(async ({ input }) => {
      return getAiDescriptions(input.inspectionId, input.roomId);
    }),

  // ── Fixx Chat ──────────────────────────────────────────────────────────────
  fixxChat: protectedProcedure
    .input(
      z.object({
        messages: z.array(
          z.object({
            role: z.enum(["user", "assistant"]),
            content: z.string(),
          })
        ),
        propertyContext: z.string().optional(), // current property address/ID for context
        inspectionContext: z.string().optional(), // current inspection context
      })
    )
    .mutation(async ({ input }) => {
      const systemContent = FIXX_CHAT_SYSTEM_PROMPT +
        (input.propertyContext ? `\n\n## Current Property Context\n${input.propertyContext}` : "") +
        (input.inspectionContext ? `\n\n## Current Inspection Context\n${input.inspectionContext}` : "");

      const response = await invokeLLM({
        messages: [
          { role: "system", content: systemContent },
          ...input.messages.map((m) => ({ role: m.role, content: m.content })),
        ],
      });

      const reply = response.choices[0]?.message?.content ?? "I'm sorry, I couldn't generate a response. Please try again.";
      return { reply: typeof reply === "string" ? reply : JSON.stringify(reply) };
    }),
});
