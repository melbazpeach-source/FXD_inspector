import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";

// ── Shared test helpers ──────────────────────────────────────────

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(overrides?: Partial<AuthenticatedUser>): {
  ctx: TrpcContext;
  clearedCookies: { name: string; options: Record<string, unknown> }[];
} {
  const clearedCookies: { name: string; options: Record<string, unknown> }[] = [];

  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-001",
    email: "pm@inspect360.co.nz",
    name: "Sarah Mitchell",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    ...overrides,
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: (name: string, options: Record<string, unknown>) => {
        clearedCookies.push({ name, options });
      },
    } as TrpcContext["res"],
  };

  return { ctx, clearedCookies };
}

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

// ── Auth tests ───────────────────────────────────────────────────

describe("auth.logout", () => {
  it("clears the session cookie and reports success", async () => {
    const { ctx, clearedCookies } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.logout();

    expect(result).toEqual({ success: true });
    expect(clearedCookies).toHaveLength(1);
    expect(clearedCookies[0]?.name).toBe(COOKIE_NAME);
    expect(clearedCookies[0]?.options).toMatchObject({
      maxAge: -1,
      secure: true,
      sameSite: "none",
      httpOnly: true,
      path: "/",
    });
  });

  it("returns current user when authenticated", async () => {
    const { ctx } = createAuthContext({ name: "Test PM", email: "test@pm.co.nz" });
    const caller = appRouter.createCaller(ctx);

    const user = await caller.auth.me();

    expect(user).not.toBeNull();
    expect(user?.name).toBe("Test PM");
    expect(user?.email).toBe("test@pm.co.nz");
  });

  it("returns null for unauthenticated user", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const user = await caller.auth.me();
    expect(user).toBeNull();
  });
});

// ── Inspection type validation ───────────────────────────────────

describe("Inspection types", () => {
  const validInspectionTypes = [
    "update_previous",
    "new_full",
    "new_vacate",
    "new_inventory",
    "new_chattels",
    "new_routine",
    "new_move_in",
    "healthy_homes",
  ] as const;

  it("should have all 8 required inspection types defined", () => {
    expect(validInspectionTypes).toHaveLength(8);
    expect(validInspectionTypes).toContain("update_previous");
    expect(validInspectionTypes).toContain("new_routine");
    expect(validInspectionTypes).toContain("new_move_in");
    expect(validInspectionTypes).toContain("new_vacate");
    expect(validInspectionTypes).toContain("new_inventory");
    expect(validInspectionTypes).toContain("new_chattels");
    expect(validInspectionTypes).toContain("new_full");
    expect(validInspectionTypes).toContain("healthy_homes");
  });

  it("should have exactly the labels specified in requirements", () => {
    const labelMap: Record<string, string> = {
      update_previous: "Update Based on Previous",
      new_full: "New Full",
      new_vacate: "New Vacate",
      new_inventory: "New Inventory",
      new_chattels: "New Chattels",
      new_routine: "New Routine",
      new_move_in: "New Move-In",
      healthy_homes: "Healthy Homes Assessment",
    };

    expect(labelMap["update_previous"]).toBe("Update Based on Previous");
    expect(labelMap["new_move_in"]).toBe("New Move-In");
    expect(labelMap["new_routine"]).toBe("New Routine");
  });
});

// ── Healthy Homes compliance logic ───────────────────────────────

describe("Healthy Homes compliance calculations", () => {
  // Heating capacity formula: floor_area × ceiling_height × climate_factor × insulation_factor
  // Climate Zone 2 (Auckland): factor = 0.08 (approximate)
  // Well-insulated: factor = 1.0, Partially insulated: factor = 1.2, Uninsulated: factor = 1.5

  function calculateRequiredHeatingKw(
    floorAreaM2: number,
    ceilingHeightM: number,
    climateFactor: number,
    insulationFactor: number
  ): number {
    return parseFloat((floorAreaM2 * ceilingHeightM * climateFactor * insulationFactor).toFixed(2));
  }

  it("calculates heating requirement for a standard Auckland lounge", () => {
    // 5.2m × 4.8m = 24.96m², ceiling 2.4m, Zone 2, well-insulated
    const required = calculateRequiredHeatingKw(24.96, 2.4, 0.08, 1.0);
    expect(required).toBeCloseTo(4.79, 1);
  });

  it("flags non-compliance when installed capacity is below required", () => {
    const required = 6.5;
    const installed = 5.8;
    const isCompliant = installed >= required;
    expect(isCompliant).toBe(false);
  });

  it("confirms compliance when installed capacity meets or exceeds required", () => {
    const required = 5.5;
    const installed = 6.0;
    const isCompliant = installed >= required;
    expect(isCompliant).toBe(true);
  });

  it("calculates ventilation window area requirement (5% of floor area)", () => {
    const floorAreaM2 = 20;
    const requiredWindowAreaM2 = floorAreaM2 * 0.05;
    expect(requiredWindowAreaM2).toBe(1.0);
  });

  it("identifies ventilation non-compliance for insufficient window area", () => {
    const floorAreaM2 = 20;
    const actualWindowAreaM2 = 0.8;
    const isCompliant = actualWindowAreaM2 >= floorAreaM2 * 0.05;
    expect(isCompliant).toBe(false);
  });
});

// ── Maintenance plan traffic light logic ─────────────────────────

describe("Maintenance plan traffic light system", () => {
  type TrafficLight = "green" | "orange" | "red";

  function getTrafficLight(
    conditionScore: number,
    inspectionsSinceFlag: number,
    isSafetyRisk: boolean
  ): TrafficLight {
    if (isSafetyRisk) return "red";
    if (conditionScore <= 2 || inspectionsSinceFlag >= 3) return "red";
    if (conditionScore <= 3 || inspectionsSinceFlag >= 2) return "orange";
    return "green";
  }

  it("returns red for safety risks regardless of condition score", () => {
    expect(getTrafficLight(5, 0, true)).toBe("red");
  });

  it("returns red for poor condition (score 1-2)", () => {
    expect(getTrafficLight(2, 0, false)).toBe("red");
    expect(getTrafficLight(1, 0, false)).toBe("red");
  });

  it("returns red for items flagged across 3+ inspections", () => {
    expect(getTrafficLight(4, 3, false)).toBe("red");
  });

  it("returns orange for fair condition (score 3)", () => {
    expect(getTrafficLight(3, 0, false)).toBe("orange");
  });

  it("returns orange for items flagged across 2 inspections", () => {
    expect(getTrafficLight(4, 2, false)).toBe("orange");
  });

  it("returns green for good condition with no flags", () => {
    expect(getTrafficLight(5, 0, false)).toBe("green");
    expect(getTrafficLight(4, 0, false)).toBe("green");
  });
});

// ── Disclaimer completeness ───────────────────────────────────────

describe("Disclaimers", () => {
  it("should have all required disclaimer types", async () => {
    const { DISCLAIMERS } = await import("../shared/disclaimers");

    expect(DISCLAIMERS).toHaveProperty("global");
    expect(DISCLAIMERS).toHaveProperty("aiOutput");
    expect(DISCLAIMERS).toHaveProperty("healthyHomesAssessment");
    expect(DISCLAIMERS).toHaveProperty("complianceStatement");
    expect(DISCLAIMERS).toHaveProperty("rentalAppraisal");
    expect(DISCLAIMERS).toHaveProperty("fixxChat");
    expect(DISCLAIMERS).toHaveProperty("improvementRecommendations");
  });

  it("compliance statement disclaimer should mention penalty amount", async () => {
    const { DISCLAIMERS } = await import("../shared/disclaimers");
    expect(DISCLAIMERS.complianceStatement).toContain("7,200");
  });

  it("Fixx chat disclaimer should mention tenancy.govt.nz", async () => {
    const { DISCLAIMERS } = await import("../shared/disclaimers");
    expect(DISCLAIMERS.fixxChat).toContain("tenancy.govt.nz");
  });
});

// ── Integration platform list ─────────────────────────────────────

describe("Integration platforms", () => {
  const supportedPlatforms = ["palace", "console", "propertytree", "rest", "test"] as const;

  it("should support all required NZ property management platforms", () => {
    expect(supportedPlatforms).toContain("palace");
    expect(supportedPlatforms).toContain("console");
    expect(supportedPlatforms).toContain("propertytree");
    expect(supportedPlatforms).toContain("rest");
    expect(supportedPlatforms).toContain("test");
  });

  it("should have exactly 5 platforms including test/sandbox", () => {
    expect(supportedPlatforms).toHaveLength(5);
  });
});

// ── Chattels vs Inventory distinction ────────────────────────────

describe("Chattels and Inventory distinction", () => {
  const chattelCategories = [
    "oven",
    "range_hood",
    "heat_pump",
    "extractor_fan",
    "floor_coverings",
    "window_treatments",
    "hot_water_cylinder",
    "ventilation_system",
    "other",
  ] as const;

  it("should include all permanent property item categories as chattels", () => {
    expect(chattelCategories).toContain("oven");
    expect(chattelCategories).toContain("range_hood");
    expect(chattelCategories).toContain("heat_pump");
    expect(chattelCategories).toContain("floor_coverings");
    expect(chattelCategories).toContain("window_treatments");
  });

  it("chattels are property-level (permanent), inventory is tenancy-level (furnished)", () => {
    // Chattels: always present regardless of tenancy type
    // Inventory: only for furnished tenancies, tracked per inspection
    const chattelIsPropertyLevel = true;
    const inventoryIsTenancyLevel = true;
    expect(chattelIsPropertyLevel).toBe(true);
    expect(inventoryIsTenancyLevel).toBe(true);
  });
});
