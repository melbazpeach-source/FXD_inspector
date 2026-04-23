import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "../db";
import { smokeAlarms, properties } from "../../drizzle/schema";
import { protectedProcedure, router } from "../_core/trpc";

// ── NZ Smoke Alarm Compliance Logic ──────────────────────────────────────────
// Based on Residential Tenancies (Smoke Alarms and Insulation) Regulations 2016
// Source: https://www.tenancy.govt.nz/maintenance-and-inspections/smoke-alarms/

export type ComplianceIssue = {
  severity: "critical" | "warning" | "info";
  rule: string;
  detail: string;
};

export type SmokeAlarmComplianceResult = {
  status: "compliant" | "non_compliant" | "needs_assessment";
  issues: ComplianceIssue[];
  summary: string;
  penaltyRisk: boolean;
  alarmCount: number;
  workingCount: number;
  photoelectricCount: number;
  coverageAdequate: boolean;
};

function assessCompliance(alarms: typeof smokeAlarms.$inferSelect[]): SmokeAlarmComplianceResult {
  const issues: ComplianceIssue[] = [];

  if (alarms.length === 0) {
    return {
      status: "non_compliant",
      issues: [{
        severity: "critical",
        rule: "Mandatory smoke alarms",
        detail: "No smoke alarms recorded for this property. At least one working smoke alarm is required within 3 metres of each bedroom door.",
      }],
      summary: "No smoke alarms documented. This property is non-compliant — landlord faces penalties up to $7,200.",
      penaltyRisk: true,
      alarmCount: 0,
      workingCount: 0,
      photoelectricCount: 0,
      coverageAdequate: false,
    };
  }

  const workingAlarms = alarms.filter(a => a.isWorking);
  const nonWorkingAlarms = alarms.filter(a => !a.isWorking);
  const photoelectricAlarms = alarms.filter(a => a.alarmType === "photoelectric");
  const ionisationAlarms = alarms.filter(a => a.alarmType === "ionisation" && !a.isPreRegulation);
  const unknownTypeAlarms = alarms.filter(a => a.alarmType === "unknown");
  const inadequatePowerAlarms = alarms.filter(a =>
    !a.isPreRegulation &&
    a.powerSource === "replaceable_battery"
  );

  // Check 1: Non-working alarms
  for (const alarm of nonWorkingAlarms) {
    issues.push({
      severity: "critical",
      rule: "Working smoke alarm required",
      detail: `Alarm at "${alarm.location}" is not working. Landlord must ensure all alarms are in working order.`,
    });
  }

  // Check 2: Ionisation alarms (new installations must be photoelectric)
  for (const alarm of ionisationAlarms) {
    issues.push({
      severity: "critical",
      rule: "Photoelectric requirement (post July 2016)",
      detail: `Alarm at "${alarm.location}" is ionisation type. Any alarm installed after 1 July 2016 must be photoelectric. Replace with photoelectric alarm.`,
    });
  }

  // Check 3: Replaceable battery (new alarms must have 8yr+ battery or be hard-wired)
  for (const alarm of inadequatePowerAlarms) {
    issues.push({
      severity: "critical",
      rule: "Long-life battery or hard-wired requirement",
      detail: `Alarm at "${alarm.location}" uses a replaceable battery. New alarms must have a battery life of at least 8 years, or be hard-wired to mains power.`,
    });
  }

  // Check 4: Unknown alarm type — flag for assessment
  for (const alarm of unknownTypeAlarms) {
    issues.push({
      severity: "warning",
      rule: "Alarm type unconfirmed",
      detail: `Alarm at "${alarm.location}" has unknown type. Confirm it is photoelectric to ensure compliance.`,
    });
  }

  // Check 5: Distance from bedroom
  for (const alarm of alarms) {
    if (alarm.distanceFromBedroom) {
      const match = alarm.distanceFromBedroom.match(/^(\d+\.?\d*)/);
      if (match) {
        const dist = parseFloat(match[1]);
        if (dist > 3.0) {
          issues.push({
            severity: "critical",
            rule: "3-metre rule",
            detail: `Alarm at "${alarm.location}" is ${alarm.distanceFromBedroom} from the nearest bedroom — exceeds the 3-metre maximum. Relocate or add an additional alarm.`,
          });
        }
      }
    }
  }

  // Check 6: Best practice — interconnection for multi-level
  const levelsSet = new Set(alarms.map(a => a.level));
  const levels = Array.from(levelsSet);
  const isMultiStorey = levelsSet.size > 1 && !levelsSet.has("single_storey");
  const hasInterconnected = alarms.some(a => a.isInterconnected);
  if (isMultiStorey && !hasInterconnected) {
    issues.push({
      severity: "info",
      rule: "Interconnection recommended (multi-storey)",
      detail: "FENZ recommends interconnected alarms for multi-storey properties so all alarms sound simultaneously. Not legally required but strongly recommended.",
    });
  }

  // Check 7: Coverage — at least one alarm per level
  if (isMultiStorey) {
    for (const level of levels) {
      const levelAlarms = alarms.filter(a => a.level === level && a.isWorking);
      if (levelAlarms.length === 0) {
        issues.push({
          severity: "critical",
          rule: "Coverage per level",
          detail: `No working smoke alarm found on the ${level} level. Each level of a multi-storey home must have at least one working alarm.`,
        });
      }
    }
  }

  const criticalIssues = issues.filter(i => i.severity === "critical");
  const status = criticalIssues.length > 0 ? "non_compliant"
    : issues.filter(i => i.severity === "warning").length > 0 ? "needs_assessment"
    : "compliant";

  const coverageAdequate = criticalIssues.filter(i =>
    i.rule.includes("3-metre") || i.rule.includes("Coverage")
  ).length === 0;

  let summary = "";
  if (status === "compliant") {
    summary = `All ${alarms.length} smoke alarm${alarms.length !== 1 ? "s" : ""} are compliant with NZ regulations. Property meets the Residential Tenancies (Smoke Alarms and Insulation) Regulations 2016.`;
  } else if (status === "non_compliant") {
    summary = `${criticalIssues.length} compliance issue${criticalIssues.length !== 1 ? "s" : ""} found. Landlord must rectify before the next tenancy commencement. Penalty risk: up to $7,200.`;
  } else {
    summary = `Smoke alarms present but ${issues.filter(i => i.severity === "warning").length} item${issues.filter(i => i.severity === "warning").length !== 1 ? "s" : ""} require confirmation to verify full compliance.`;
  }

  return {
    status,
    issues,
    summary,
    penaltyRisk: criticalIssues.length > 0,
    alarmCount: alarms.length,
    workingCount: workingAlarms.length,
    photoelectricCount: photoelectricAlarms.length,
    coverageAdequate,
  };
}

// ── Router ────────────────────────────────────────────────────────────────────
export const smokeAlarmsRouter = router({
  // List all smoke alarms for a property
  list: protectedProcedure
    .input(z.object({ propertyId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db
        .select()
        .from(smokeAlarms)
        .where(eq(smokeAlarms.propertyId, input.propertyId));
    }),

  // Get compliance assessment for a property
  getCompliance: protectedProcedure
    .input(z.object({ propertyId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      const alarms = await db
        .select()
        .from(smokeAlarms)
        .where(eq(smokeAlarms.propertyId, input.propertyId));
      return assessCompliance(alarms);
    }),

  // Create a smoke alarm record
  create: protectedProcedure
    .input(z.object({
      propertyId: z.number(),
      inspectionId: z.number().optional(),
      location: z.string().min(1),
      level: z.enum(["ground", "first", "second", "third", "basement", "single_storey"]).optional(),
      distanceFromBedroom: z.string().optional(),
      alarmType: z.enum(["photoelectric", "ionisation", "heat", "combined", "unknown"]).optional(),
      powerSource: z.enum(["long_life_battery", "replaceable_battery", "hard_wired", "unknown"]).optional(),
      isWorking: z.boolean().optional(),
      isTested: z.boolean().optional(),
      isInterconnected: z.boolean().optional(),
      expiryDate: z.string().optional(),
      installDate: z.string().optional(),
      lastTestedDate: z.string().optional(),
      meetsStandards: z.boolean().optional(),
      complianceNotes: z.string().optional(),
      photoUrl: z.string().optional(),
      photoKey: z.string().optional(),
      isPreRegulation: z.boolean().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const result = await db.insert(smokeAlarms).values(input);
      return { id: Number(result[0].insertId), success: true };
    }),

  // Update a smoke alarm record
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      location: z.string().optional(),
      level: z.enum(["ground", "first", "second", "third", "basement", "single_storey"]).optional(),
      distanceFromBedroom: z.string().optional(),
      alarmType: z.enum(["photoelectric", "ionisation", "heat", "combined", "unknown"]).optional(),
      powerSource: z.enum(["long_life_battery", "replaceable_battery", "hard_wired", "unknown"]).optional(),
      isWorking: z.boolean().optional(),
      isTested: z.boolean().optional(),
      isInterconnected: z.boolean().optional(),
      expiryDate: z.string().optional(),
      installDate: z.string().optional(),
      lastTestedDate: z.string().optional(),
      meetsStandards: z.boolean().optional(),
      complianceNotes: z.string().optional(),
      photoUrl: z.string().optional(),
      photoKey: z.string().optional(),
      isPreRegulation: z.boolean().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const { id, ...data } = input;
      await db.update(smokeAlarms).set(data).where(eq(smokeAlarms.id, id));
      return { success: true };
    }),

  // Delete a smoke alarm record
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.delete(smokeAlarms).where(eq(smokeAlarms.id, input.id));
      return { success: true };
    }),

  // Get NZ rules reference (for Fixx AI and UI tooltips)
  getRules: protectedProcedure
    .query(() => ({
      mandatory: [
        "Working smoke alarms are compulsory in all rental homes",
        "At least one alarm within 3 metres of each bedroom door, OR in every room where a person sleeps",
        "At least one alarm on each level/storey of a multi-storey home",
        "Applies to all rental homes, boarding houses, rental caravans, and self-contained sleep-outs",
      ],
      newAlarms: [
        "Must be photoelectric (not ionisation or heat-only)",
        "Battery life of at least 8 years, OR hard-wired to mains power",
        "Installed according to manufacturer's instructions",
        "Must meet international standards (AS 3786:2014 or equivalent)",
      ],
      existingAlarms: [
        "Do NOT need to be replaced if they are working and have not passed their expiry date",
        "When replaced, the new alarm must meet current standards",
      ],
      landlordResponsibilities: [
        "Ensure alarms are working at the start of each new tenancy",
        "Ensure alarms remain in working order during the tenancy",
        "Replace batteries in common areas of boarding houses",
      ],
      tenantResponsibilities: [
        "Must NOT damage, remove, or disconnect a smoke alarm",
        "Replace dead batteries during the tenancy (older-style alarms with replaceable batteries)",
        "Notify landlord of any problems as soon as possible",
      ],
      penalties: {
        landlord: "$7,200 maximum",
        tenant: "$4,000 maximum",
      },
      bestPractice: [
        "Interconnected alarms strongly recommended for multi-storey properties",
        "Alarm in every bedroom (not just hallway) for maximum protection",
        "Test alarms monthly",
        "Clean alarms every 6 months",
        "Replace all alarms every 10 years regardless of battery status",
      ],
      legislation: "Residential Tenancies (Smoke Alarms and Insulation) Regulations 2016",
      source: "https://www.tenancy.govt.nz/maintenance-and-inspections/smoke-alarms/",
    })),
});
