import { z } from "zod";
import { nanoid } from "nanoid";
import {
  createRemoteSubmission,
  createRemoteSubmissionPhoto,
  createReport,
  getAiDescriptions,
  getInspectionById,
  getMaintenanceItems,
  getPhotosForInspection,
  getPropertyById,
  getPropertyTenants,
  getRemoteSubmissionByToken,
  getRemoteSubmissionPhotos,
  getRemoteSubmissions,
  getRoomsForInspection,
  updateRemoteSubmission,
  updateReport,
} from "../db";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { storagePut } from "../storage";
import { invokeLLM } from "../_core/llm";

export const reportsRouter = router({
  // ── Report Generation ────────────────────────────────────────────────────────
  generate: protectedProcedure
    .input(z.object({ inspectionId: z.number() }))
    .mutation(async ({ input }) => {
      // Create a report record
      const reportId = await createReport({
        inspectionId: input.inspectionId,
        status: "generating",
      });

      // Gather all data for the report
      const inspectionData = await getInspectionById(input.inspectionId);
      if (!inspectionData) throw new Error("Inspection not found");

      const rooms = await getRoomsForInspection(input.inspectionId);
      const allPhotos = await getPhotosForInspection(input.inspectionId);
      const maintenance = await getMaintenanceItems(input.inspectionId);
      const aiDescs = await getAiDescriptions(input.inspectionId);
      const property = await getPropertyById(inspectionData.inspection.propertyId);
      const tenants = property ? await getPropertyTenants(property.id) : [];

      const INSPECTION_TYPE_LABELS: Record<string, string> = {
        update_based_on_previous: "Update Based on Previous",
        new_full: "New Full",
        new_vacate: "New Vacate",
        new_inventory: "New Inventory",
        new_chattels: "New Chattels",
        new_routine: "New Routine",
        new_move_in: "New Move-In",
      };

      // Generate HTML report content
      const reportHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Property Inspection Report</title>
<style>
  body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1a1a2e; margin: 0; padding: 40px; background: #fff; }
  .header { border-bottom: 3px solid #1a1a2e; padding-bottom: 24px; margin-bottom: 32px; }
  .header h1 { font-size: 28px; margin: 0 0 8px; color: #1a1a2e; }
  .header .subtitle { color: #666; font-size: 14px; }
  .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 32px; }
  .meta-card { background: #f8f9fa; padding: 16px; border-radius: 8px; }
  .meta-card h3 { margin: 0 0 8px; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #888; }
  .meta-card p { margin: 0; font-size: 14px; color: #1a1a2e; }
  .section { margin-bottom: 40px; }
  .section h2 { font-size: 18px; color: #1a1a2e; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; }
  .room { margin-bottom: 24px; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px; }
  .room h3 { margin: 0 0 12px; font-size: 16px; }
  .condition-badge { display: inline-block; padding: 2px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; }
  .condition-excellent { background: #d1fae5; color: #065f46; }
  .condition-good { background: #dbeafe; color: #1e40af; }
  .condition-fair { background: #fef3c7; color: #92400e; }
  .condition-poor { background: #fee2e2; color: #991b1b; }
  .ai-section { background: #f0f4ff; padding: 16px; border-radius: 8px; margin-top: 12px; }
  .ai-section h4 { margin: 0 0 8px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; color: #4f46e5; }
  .ai-section p { margin: 0; font-size: 14px; line-height: 1.6; }
  .maintenance-item { padding: 12px; border-left: 3px solid #ef4444; margin-bottom: 8px; background: #fff5f5; }
  .maintenance-item.urgent { border-color: #dc2626; }
  .maintenance-item.high { border-color: #f97316; }
  .maintenance-item.medium { border-color: #eab308; }
  .maintenance-item.low { border-color: #22c55e; }
  .footer { margin-top: 48px; padding-top: 24px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #888; }
  @media print { body { padding: 20px; } }
</style>
</head>
<body>
<div class="header">
  <h1>Property Inspection Report</h1>
  <div class="subtitle">FXD Inspector — Professional Property Inspection Platform</div>
</div>

<div class="meta-grid">
  <div class="meta-card">
    <h3>Property</h3>
    <p>${property?.address ?? "N/A"}</p>
    ${property?.suburb ? `<p>${property.suburb}, ${property.city ?? ""} ${property.postcode ?? ""}</p>` : ""}
  </div>
  <div class="meta-card">
    <h3>Inspection Type</h3>
    <p>${INSPECTION_TYPE_LABELS[inspectionData.inspection.type] ?? inspectionData.inspection.type}</p>
  </div>
  <div class="meta-card">
    <h3>Date</h3>
    <p>${new Date(inspectionData.inspection.createdAt).toLocaleDateString("en-NZ", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
  </div>
  <div class="meta-card">
    <h3>Overall Condition</h3>
    <p>${inspectionData.inspection.overallCondition ? `<span class="condition-badge condition-${inspectionData.inspection.overallCondition}">${inspectionData.inspection.overallCondition.charAt(0).toUpperCase() + inspectionData.inspection.overallCondition.slice(1)}</span>` : "Not rated"}</p>
  </div>
  ${tenants.length > 0 ? `<div class="meta-card"><h3>Tenants</h3>${tenants.map((t) => `<p>${t.name}${t.email ? ` — ${t.email}` : ""}</p>`).join("")}</div>` : ""}
  ${property?.landlordName ? `<div class="meta-card"><h3>Landlord / Owner</h3><p>${property.landlordName}</p>${property.landlordEmail ? `<p>${property.landlordEmail}</p>` : ""}</div>` : ""}
</div>

${inspectionData.inspection.generalNotes ? `<div class="section"><h2>General Notes</h2><p>${inspectionData.inspection.generalNotes}</p></div>` : ""}

<div class="section">
  <h2>Room-by-Room Inspection</h2>
  ${rooms
    .map((room) => {
      const roomAi = aiDescs.find((d) => d.roomId === room.id);
      return `<div class="room">
    <h3>${room.name} ${room.conditionRating && room.conditionRating !== "na" ? `<span class="condition-badge condition-${room.conditionRating}">${room.conditionRating.charAt(0).toUpperCase() + room.conditionRating.slice(1)}</span>` : ""}</h3>
    ${room.notes ? `<p style="color:#555;font-size:14px">${room.notes}</p>` : ""}
    ${
      roomAi
        ? `<div class="ai-section">
      ${roomAi.decor ? `<h4>Decor</h4><p>${roomAi.decor}</p>` : ""}
      ${roomAi.condition ? `<h4 style="margin-top:12px">Condition</h4><p>${roomAi.condition}</p>` : ""}
      ${roomAi.pointsToNote ? `<h4 style="margin-top:12px">Points to Note</h4><p>${roomAi.pointsToNote}</p>` : ""}
      ${roomAi.recommendations ? `<h4 style="margin-top:12px">Recommendations</h4><p>${roomAi.recommendations}</p>` : ""}
    </div>`
        : ""
    }
  </div>`;
    })
    .join("")}
</div>

${
  maintenance.length > 0
    ? `<div class="section">
  <h2>Maintenance & Damage Items (${maintenance.length})</h2>
  ${maintenance
    .map(
      (item) =>
        `<div class="maintenance-item ${item.priority ?? "medium"}">
    <strong>${item.isDamage ? "⚠ DAMAGE: " : ""}${item.description}</strong>
    <span style="float:right;font-size:12px;text-transform:uppercase;color:#888">${item.priority ?? "medium"} priority</span>
    ${item.estimatedCost ? `<br><small>Estimated cost: ${item.estimatedCost}</small>` : ""}
  </div>`
    )
    .join("")}
</div>`
    : ""
}

<div class="footer">
  <p>Report generated by FXD Inspector on ${new Date().toLocaleDateString("en-NZ", { year: "numeric", month: "long", day: "numeric" })} at ${new Date().toLocaleTimeString("en-NZ")}</p>
  <p>This report is confidential and intended for the named recipients only.</p>
</div>
</body>
</html>`;

      // Store the HTML report
      const htmlKey = `reports/${input.inspectionId}/report-${Date.now()}.html`;
      const { url } = await storagePut(htmlKey, Buffer.from(reportHtml, "utf-8"), "text/html");

      await updateReport(reportId, {
        storageKey: htmlKey,
        url,
        status: "ready",
        generatedAt: new Date(),
      });

      return { reportId, url };
    }),

  list: protectedProcedure
    .input(z.object({ inspectionId: z.number() }))
    .query(async ({ input }) => {
      const { getReportsForInspection } = await import("../db");
      return getReportsForInspection(input.inspectionId);
    }),

  // ── Remote Submissions ───────────────────────────────────────────────────────
  createRemoteLink: protectedProcedure
    .input(
      z.object({
        propertyId: z.number(),
        inspectionId: z.number().optional(),
        expiresInDays: z.number().default(7),
      })
    )
    .mutation(async ({ input }) => {
      const token = nanoid(32);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + input.expiresInDays);

      const id = await createRemoteSubmission({
        propertyId: input.propertyId,
        inspectionId: input.inspectionId,
        token,
        expiresAt,
      });

      return { id, token };
    }),

  listRemoteSubmissions: protectedProcedure
    .input(z.object({ inspectionId: z.number().optional() }))
    .query(async ({ input }) => {
      return getRemoteSubmissions(input.inspectionId);
    }),

  // Public endpoint for tenants to submit
  getRemoteForm: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const submission = await getRemoteSubmissionByToken(input.token);
      if (!submission) throw new Error("Invalid or expired link");
      if (submission.expiresAt && new Date() > submission.expiresAt) {
        throw new Error("This link has expired");
      }
      const property = await getPropertyById(submission.propertyId);
      return {
        submissionId: submission.id,
        propertyAddress: property?.address ?? "Property",
        status: submission.status,
      };
    }),

  submitRemote: publicProcedure
    .input(
      z.object({
        token: z.string(),
        submitterName: z.string().min(1),
        submitterEmail: z.string().email().optional(),
        notes: z.string().optional(),
        photos: z.array(
          z.object({
            imageData: z.string(),
            mimeType: z.string().default("image/jpeg"),
            caption: z.string().optional(),
            roomLabel: z.string().optional(),
          })
        ).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const submission = await getRemoteSubmissionByToken(input.token);
      if (!submission) throw new Error("Invalid link");
      if (submission.expiresAt && new Date() > submission.expiresAt) {
        throw new Error("This link has expired");
      }

      await updateRemoteSubmission(submission.id, {
        submitterName: input.submitterName,
        submitterEmail: input.submitterEmail,
        notes: input.notes,
        status: "submitted",
        submittedAt: new Date(),
      });

      // Upload photos
      if (input.photos) {
        for (const photo of input.photos) {
          const buffer = Buffer.from(photo.imageData, "base64");
          const ext = photo.mimeType.split("/")[1] ?? "jpg";
          const key = `remote-submissions/${submission.id}/${Date.now()}.${ext}`;
          const { url } = await storagePut(key, buffer, photo.mimeType);
          await createRemoteSubmissionPhoto({
            submissionId: submission.id,
            storageKey: key,
            url,
            caption: photo.caption,
            roomLabel: photo.roomLabel,
          });
        }
      }

      return { success: true };
    }),

  reviewRemoteSubmission: protectedProcedure
    .input(z.object({ submissionId: z.number(), action: z.enum(["approve", "reject"]) }))
    .mutation(async ({ input }) => {
      await updateRemoteSubmission(input.submissionId, {
        status: input.action === "approve" ? "imported" : "reviewed",
      });
      return { success: true };
    }),
});
