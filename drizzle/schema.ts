import {
  boolean,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

// ─── Users ────────────────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Properties ───────────────────────────────────────────────────────────────
export const properties = mysqlTable("properties", {
  id: int("id").autoincrement().primaryKey(),
  address: text("address").notNull(),
  suburb: varchar("suburb", { length: 128 }),
  city: varchar("city", { length: 128 }),
  postcode: varchar("postcode", { length: 16 }),
  landlordName: text("landlord_name"),
  landlordEmail: varchar("landlord_email", { length: 320 }),
  landlordPhone: varchar("landlord_phone", { length: 32 }),
  platformRef: varchar("platform_ref", { length: 128 }),
  platformSource: mysqlEnum("platform_source", ["palace", "console", "propertytree", "rest", "test", "manual"]).default("manual"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Property = typeof properties.$inferSelect;

// ─── Tenants ──────────────────────────────────────────────────────────────────
export const tenants = mysqlTable("tenants", {
  id: int("id").autoincrement().primaryKey(),
  propertyId: int("property_id").notNull(),
  name: text("name").notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 32 }),
  isPrimary: boolean("is_primary").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Tenant = typeof tenants.$inferSelect;

// ─── Appointments ─────────────────────────────────────────────────────────────
export const appointments = mysqlTable("appointments", {
  id: int("id").autoincrement().primaryKey(),
  propertyId: int("property_id").notNull(),
  scheduledAt: timestamp("scheduled_at").notNull(),
  durationMinutes: int("duration_minutes").default(60),
  inspectorId: int("inspector_id"),
  platformRef: varchar("platform_ref", { length: 128 }),
  platformSource: mysqlEnum("platform_source", ["palace", "console", "propertytree", "rest", "test", "manual"]).default("manual"),
  syncStatus: mysqlEnum("sync_status", ["synced", "pending", "error", "manual"]).default("manual"),
  lastSyncedAt: timestamp("last_synced_at"),
  notes: text("notes"),
  status: mysqlEnum("status", ["scheduled", "in_progress", "completed", "cancelled"]).default("scheduled"),
  inspectionId: int("inspection_id"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Appointment = typeof appointments.$inferSelect;

// ─── Inspections ──────────────────────────────────────────────────────────────
export const inspections = mysqlTable("inspections", {
  id: int("id").autoincrement().primaryKey(),
  propertyId: int("property_id").notNull(),
  appointmentId: int("appointment_id"),
  inspectorId: int("inspector_id").notNull(),
  type: mysqlEnum("type", [
    "update_based_on_previous",
    "new_full",
    "new_vacate",
    "new_inventory",
    "new_chattels",
    "new_routine",
    "new_move_in",
  ]).notNull(),
  status: mysqlEnum("status", ["draft", "in_progress", "completed", "report_sent"]).default("draft"),
  previousInspectionId: int("previous_inspection_id"),
  overallCondition: mysqlEnum("overall_condition", ["excellent", "good", "fair", "poor"]),
  generalNotes: text("general_notes"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Inspection = typeof inspections.$inferSelect;

// ─── Inspection Rooms ─────────────────────────────────────────────────────────
export const inspectionRooms = mysqlTable("inspection_rooms", {
  id: int("id").autoincrement().primaryKey(),
  inspectionId: int("inspection_id").notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  roomOrder: int("room_order").default(0),
  conditionRating: mysqlEnum("condition_rating", ["excellent", "good", "fair", "poor", "na"]).default("na"),
  notes: text("notes"),
  hasIssues: boolean("has_issues").default(false),
  isComplete: boolean("is_complete").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type InspectionRoom = typeof inspectionRooms.$inferSelect;

// ─── Room Items (specific checklist items per room) ───────────────────────────
export const roomItems = mysqlTable("room_items", {
  id: int("id").autoincrement().primaryKey(),
  roomId: int("room_id").notNull(),
  label: varchar("label", { length: 256 }).notNull(),
  conditionRating: mysqlEnum("condition_rating", ["excellent", "good", "fair", "poor", "na"]).default("na"),
  notes: text("notes"),
  isDamaged: boolean("is_damaged").default(false),
  maintenanceRequired: boolean("maintenance_required").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type RoomItem = typeof roomItems.$inferSelect;

// ─── Maintenance Items ────────────────────────────────────────────────────────
export const maintenanceItems = mysqlTable("maintenance_items", {
  id: int("id").autoincrement().primaryKey(),
  inspectionId: int("inspection_id").notNull(),
  roomId: int("room_id"),
  description: text("description").notNull(),
  priority: mysqlEnum("priority", ["urgent", "high", "medium", "low"]).default("medium"),
  isDamage: boolean("is_damage").default(false),
  estimatedCost: varchar("estimated_cost", { length: 64 }),
  status: mysqlEnum("status", ["open", "in_progress", "resolved"]).default("open"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MaintenanceItem = typeof maintenanceItems.$inferSelect;

// ─── Photos ───────────────────────────────────────────────────────────────────
export const photos = mysqlTable("photos", {
  id: int("id").autoincrement().primaryKey(),
  inspectionId: int("inspection_id").notNull(),
  roomId: int("room_id"),
  storageKey: varchar("storage_key", { length: 512 }).notNull(),
  url: text("url").notNull(),
  photoType: mysqlEnum("photo_type", ["standard", "360", "damage", "maintenance"]).default("standard"),
  caption: text("caption"),
  takenAt: timestamp("taken_at").defaultNow(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Photo = typeof photos.$inferSelect;

// ─── AI Descriptions ──────────────────────────────────────────────────────────
export const aiDescriptions = mysqlTable("ai_descriptions", {
  id: int("id").autoincrement().primaryKey(),
  inspectionId: int("inspection_id").notNull(),
  roomId: int("room_id"),
  decor: text("decor"),
  condition: text("condition"),
  pointsToNote: text("points_to_note"),
  recommendations: text("recommendations"),
  rawPrompt: text("raw_prompt"),
  generatedAt: timestamp("generated_at").defaultNow(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AiDescription = typeof aiDescriptions.$inferSelect;

// ─── Reports ──────────────────────────────────────────────────────────────────
export const reports = mysqlTable("reports", {
  id: int("id").autoincrement().primaryKey(),
  inspectionId: int("inspection_id").notNull(),
  storageKey: varchar("storage_key", { length: 512 }),
  url: text("url"),
  status: mysqlEnum("status", ["generating", "ready", "sent", "error"]).default("generating"),
  sentAt: timestamp("sent_at"),
  recipients: json("recipients").$type<string[]>(),
  generatedAt: timestamp("generated_at"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Report = typeof reports.$inferSelect;

// ─── Remote Submissions ───────────────────────────────────────────────────────
export const remoteSubmissions = mysqlTable("remote_submissions", {
  id: int("id").autoincrement().primaryKey(),
  inspectionId: int("inspection_id"),
  propertyId: int("property_id").notNull(),
  token: varchar("token", { length: 128 }).notNull().unique(),
  submitterName: text("submitter_name"),
  submitterEmail: varchar("submitter_email", { length: 320 }),
  notes: text("notes"),
  status: mysqlEnum("status", ["pending", "submitted", "reviewed", "imported"]).default("pending"),
  expiresAt: timestamp("expires_at"),
  submittedAt: timestamp("submitted_at"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type RemoteSubmission = typeof remoteSubmissions.$inferSelect;

// ─── Remote Submission Photos ─────────────────────────────────────────────────
export const remoteSubmissionPhotos = mysqlTable("remote_submission_photos", {
  id: int("id").autoincrement().primaryKey(),
  submissionId: int("submission_id").notNull(),
  storageKey: varchar("storage_key", { length: 512 }).notNull(),
  url: text("url").notNull(),
  caption: text("caption"),
  roomLabel: varchar("room_label", { length: 128 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type RemoteSubmissionPhoto = typeof remoteSubmissionPhotos.$inferSelect;

// ─── Integration Configs ──────────────────────────────────────────────────────
export const integrationConfigs = mysqlTable("integration_configs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  platform: mysqlEnum("platform", ["palace", "console", "propertytree", "rest", "test"]).notNull(),
  isEnabled: boolean("is_enabled").default(false),
  isSandbox: boolean("is_sandbox").default(false),
  apiEndpoint: text("api_endpoint"),
  apiKey: text("api_key"),
  apiSecret: text("api_secret"),
  webhookUrl: text("webhook_url"),
  lastSyncedAt: timestamp("last_synced_at"),
  syncStatus: mysqlEnum("sync_status", ["idle", "syncing", "success", "error"]).default("idle"),
  syncError: text("sync_error"),
  metadata: json("metadata").$type<Record<string, string>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type IntegrationConfig = typeof integrationConfigs.$inferSelect;

// ─── Chattels Register (property-level, always present) ─────────────────────
export const chattels = mysqlTable("chattels", {
  id: int("id").autoincrement().primaryKey(),
  propertyId: int("property_id").notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  category: mysqlEnum("category", [
    "kitchen",
    "heating_cooling",
    "ventilation",
    "floor_coverings",
    "window_treatments",
    "hot_water",
    "outdoor",
    "other",
  ]).notNull(),
  makeModel: varchar("make_model", { length: 256 }),
  serialNumber: varchar("serial_number", { length: 128 }),
  installDate: varchar("install_date", { length: 32 }),
  estimatedAge: varchar("estimated_age", { length: 64 }),
  estimatedValue: varchar("estimated_value", { length: 64 }),
  conditionAtRegistration: mysqlEnum("condition_at_registration", ["new", "excellent", "good", "fair", "poor"]).default("good"),
  currentCondition: mysqlEnum("current_condition", ["new", "excellent", "good", "fair", "poor"]).default("good"),
  photoUrl: text("photo_url"),
  photoKey: varchar("photo_key", { length: 512 }),
  notes: text("notes"),
  isHealthyHomesItem: boolean("is_healthy_homes_item").default(false),
  healthyHomesCategory: mysqlEnum("healthy_homes_category", ["heating", "ventilation", "insulation", "moisture", "draught"]),
  lastCheckedAt: timestamp("last_checked_at"),
  lastCheckedInspectionId: int("last_checked_inspection_id"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Chattel = typeof chattels.$inferSelect;

// ─── Inventory Items (furnished tenancies only) ───────────────────────────────
export const inventoryItems = mysqlTable("inventory_items", {
  id: int("id").autoincrement().primaryKey(),
  inspectionId: int("inspection_id").notNull(),
  propertyId: int("property_id").notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  category: mysqlEnum("category", [
    "whiteware",
    "furniture",
    "appliances",
    "tools_equipment",
    "soft_furnishings",
    "electronics",
    "other",
  ]).notNull(),
  quantity: int("quantity").default(1),
  condition: mysqlEnum("condition", ["new", "excellent", "good", "fair", "poor", "damaged", "missing"]).default("good"),
  description: text("description"),
  serialNumber: varchar("serial_number", { length: 128 }),
  photoUrl: text("photo_url"),
  photoKey: varchar("photo_key", { length: 512 }),
  notes: text("notes"),
  isAiGenerated: boolean("is_ai_generated").default(false),
  moveInCondition: mysqlEnum("move_in_condition", ["new", "excellent", "good", "fair", "poor", "damaged", "missing"]),
  moveOutCondition: mysqlEnum("move_out_condition", ["new", "excellent", "good", "fair", "poor", "damaged", "missing"]),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type InventoryItem = typeof inventoryItems.$inferSelect;

// ─── Healthy Homes Assessment ─────────────────────────────────────────────────
export const healthyHomesAssessments = mysqlTable("healthy_homes_assessments", {
  id: int("id").autoincrement().primaryKey(),
  propertyId: int("property_id").notNull(),
  inspectionId: int("inspection_id"),
  inspectorId: int("inspector_id").notNull(),
  climateZone: mysqlEnum("climate_zone", ["1", "2", "3"]).notNull(),
  // Heating
  heatingCompliant: boolean("heating_compliant"),
  heatingDeviceType: varchar("heating_device_type", { length: 128 }),
  heatingCapacityKw: varchar("heating_capacity_kw", { length: 32 }),
  heatingRequiredKw: varchar("heating_required_kw", { length: 32 }),
  heatingNotes: text("heating_notes"),
  heatingPhotoUrl: text("heating_photo_url"),
  // Insulation
  insulationCompliant: boolean("insulation_compliant"),
  ceilingInsulationRValue: varchar("ceiling_insulation_r_value", { length: 32 }),
  underfloorInsulationRValue: varchar("underfloor_insulation_r_value", { length: 32 }),
  ceilingInsulationNotes: text("ceiling_insulation_notes"),
  underfloorInsulationNotes: text("underfloor_insulation_notes"),
  insulationPhotoUrl: text("insulation_photo_url"),
  // Ventilation
  ventilationCompliant: boolean("ventilation_compliant"),
  kitchenExtractorFan: boolean("kitchen_extractor_fan"),
  bathroomExtractorFan: boolean("bathroom_extractor_fan"),
  openableWindowsCompliant: boolean("openable_windows_compliant"),
  ventilationNotes: text("ventilation_notes"),
  // Moisture & Drainage
  moistureCompliant: boolean("moisture_compliant"),
  gutterCondition: mysqlEnum("gutter_condition", ["good", "fair", "poor", "na"]).default("na"),
  subfloorMoistureBarrier: boolean("subfloor_moisture_barrier"),
  moistureNotes: text("moisture_notes"),
  // Draught Stopping
  draughtCompliant: boolean("draught_compliant"),
  unusedFireplacesBlocked: boolean("unused_fireplaces_blocked"),
  draughtNotes: text("draught_notes"),
  // Overall
  overallCompliant: boolean("overall_compliant"),
  complianceDate: timestamp("compliance_date"),
  aiSummary: text("ai_summary"),
  status: mysqlEnum("status", ["draft", "completed", "report_sent"]).default("draft"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type HealthyHomesAssessment = typeof healthyHomesAssessments.$inferSelect;

// ─── PM Review Queue ──────────────────────────────────────────────────────────
export const pmReviewQueue = mysqlTable("pm_review_queue", {
  id: int("id").autoincrement().primaryKey(),
  inspectionId: int("inspection_id").notNull(),
  propertyId: int("property_id").notNull(),
  assignedToUserId: int("assigned_to_user_id"),
  status: mysqlEnum("status", ["pending", "in_review", "approved", "rejected", "sent"]).default("pending"),
  tenantLetterDraft: text("tenant_letter_draft"),
  tenantLetterApproved: boolean("tenant_letter_approved").default(false),
  maintenanceRequestsCreated: boolean("maintenance_requests_created").default(false),
  maintenanceRequestCount: int("maintenance_request_count").default(0),
  pdfReportReady: boolean("pdf_report_ready").default(false),
  pdfReportUrl: text("pdf_report_url"),
  reviewedAt: timestamp("reviewed_at"),
  sentAt: timestamp("sent_at"),
  agentNotes: text("agent_notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type PmReviewItem = typeof pmReviewQueue.$inferSelect;

// ─── Maintenance Plan (12-month proactive) ────────────────────────────────────
export const maintenancePlanItems = mysqlTable("maintenance_plan_items", {
  id: int("id").autoincrement().primaryKey(),
  propertyId: int("property_id").notNull(),
  title: varchar("title", { length: 256 }).notNull(),
  description: text("description"),
  location: varchar("location", { length: 256 }),
  trafficLight: mysqlEnum("traffic_light", ["green", "orange", "red"]).notNull(),
  estimatedCostBracket: mysqlEnum("estimated_cost_bracket", ["under_500", "500_2000", "2000_10000", "over_10000"]),
  recommendedAction: text("recommended_action"),
  urgencyTimeline: varchar("urgency_timeline", { length: 128 }),
  dueByMonth: int("due_by_month"),
  sourceInspectionId: int("source_inspection_id"),
  chattelId: int("chattel_id"),
  isAiGenerated: boolean("is_ai_generated").default(true),
  status: mysqlEnum("status", ["open", "in_progress", "completed", "deferred"]).default("open"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type MaintenancePlanItem = typeof maintenancePlanItems.$inferSelect;

// ─── Rental Appraisals ────────────────────────────────────────────────────────
export const rentalAppraisals = mysqlTable("rental_appraisals", {
  id: int("id").autoincrement().primaryKey(),
  propertyId: int("property_id").notNull(),
  inspectionId: int("inspection_id"),
  currentRent: varchar("current_rent", { length: 32 }),
  recommendedRentLow: varchar("recommended_rent_low", { length: 32 }),
  recommendedRentHigh: varchar("recommended_rent_high", { length: 32 }),
  marketMedian: varchar("market_median", { length: 32 }),
  conditionPremiumDiscount: varchar("condition_premium_discount", { length: 32 }),
  comparableAnalysis: text("comparable_analysis"),
  marketSentiment: mysqlEnum("market_sentiment", ["rising", "stable", "softening"]).default("stable"),
  vacancyRate: varchar("vacancy_rate", { length: 32 }),
  aiDraftReport: text("ai_draft_report"),
  pdfUrl: text("pdf_url"),
  status: mysqlEnum("status", ["draft", "finalised", "sent"]).default("draft"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type RentalAppraisal = typeof rentalAppraisals.$inferSelect;

// ─── Sync Logs ────────────────────────────────────────────────────────────────
export const syncLogs = mysqlTable("sync_logs", {
  id: int("id").autoincrement().primaryKey(),
  integrationId: int("integration_id").notNull(),
  platform: mysqlEnum("platform", ["palace", "console", "propertytree", "rest", "test"]).notNull(),
  action: varchar("action", { length: 128 }).notNull(),
  status: mysqlEnum("status", ["success", "error", "warning"]).default("success"),
  message: text("message"),
  recordsAffected: int("records_affected").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SyncLog = typeof syncLogs.$inferSelect;

// ─── Smoke Alarms ─────────────────────────────────────────────────────────────
export const smokeAlarms = mysqlTable("smoke_alarms", {
  id: int("id").autoincrement().primaryKey(),
  propertyId: int("property_id").notNull(),
  inspectionId: int("inspection_id"),
  // Location
  location: varchar("location", { length: 256 }).notNull(), // e.g. "Hallway outside master bedroom"
  level: mysqlEnum("level", ["ground", "first", "second", "third", "basement", "single_storey"]).default("ground"),
  distanceFromBedroom: varchar("distance_from_bedroom", { length: 32 }), // e.g. "2.1m", "in room"
  // Alarm type & power
  alarmType: mysqlEnum("alarm_type", ["photoelectric", "ionisation", "heat", "combined", "unknown"]).default("unknown"),
  powerSource: mysqlEnum("power_source", ["long_life_battery", "replaceable_battery", "hard_wired", "unknown"]).default("unknown"),
  // Status
  isWorking: boolean("is_working").default(true),
  isTested: boolean("is_tested").default(false),
  isInterconnected: boolean("is_interconnected").default(false),
  // Dates
  expiryDate: varchar("expiry_date", { length: 32 }), // stored as string e.g. "2031-06"
  installDate: varchar("install_date", { length: 32 }),
  lastTestedDate: varchar("last_tested_date", { length: 32 }),
  // Compliance
  meetsStandards: boolean("meets_standards").default(true),
  complianceNotes: text("compliance_notes"),
  // Evidence
  photoUrl: text("photo_url"),
  photoKey: text("photo_key"),
  // Pre-dates July 2016 (existing alarm exemption)
  isPreRegulation: boolean("is_pre_regulation").default(false),
  // Inspector notes
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SmokeAlarm = typeof smokeAlarms.$inferSelect;
export type InsertSmokeAlarm = typeof smokeAlarms.$inferInsert;

// ─── Owners / Landlords ───────────────────────────────────────────────────────
export const owners = mysqlTable("owners", {
  id: int("id").autoincrement().primaryKey(),
  // Identity
  name: varchar("name", { length: 256 }).notNull(),
  entityType: mysqlEnum("entity_type", ["individual", "company", "trust", "partnership"]).default("individual"),
  companyName: varchar("company_name", { length: 256 }), // if entity_type = company/trust
  // Contact
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 32 }),
  alternatePhone: varchar("alternate_phone", { length: 32 }),
  // Address
  mailingAddress: text("mailing_address"),
  // Preferences
  preferredContact: mysqlEnum("preferred_contact", ["email", "phone", "sms", "portal"]).default("email"),
  reportFrequency: mysqlEnum("report_frequency", ["after_each_inspection", "monthly", "quarterly"]).default("after_each_inspection"),
  // Portal access
  portalEnabled: boolean("portal_enabled").default(false),
  portalToken: varchar("portal_token", { length: 128 }), // secure token for landlord portal login
  // CRM integration
  platformRef: varchar("platform_ref", { length: 128 }),  // ID in the external CRM
  platformSource: mysqlEnum("platform_source", ["palace", "console", "propertytree", "rest", "standalone", "manual"]).default("manual"),
  lastPushedAt: timestamp("last_pushed_at"),
  pushStatus: mysqlEnum("push_status", ["synced", "pending", "error", "not_pushed"]).default("not_pushed"),
  pushError: text("push_error"),
  // Notes
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Owner = typeof owners.$inferSelect;
export type InsertOwner = typeof owners.$inferInsert;

// ─── Owner ↔ Property link ────────────────────────────────────────────────────
// One owner can own multiple properties; each property has one primary owner
export const ownerProperties = mysqlTable("owner_properties", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("owner_id").notNull(),
  propertyId: int("property_id").notNull(),
  isPrimary: boolean("is_primary").default(true), // primary owner for this property
  ownershipShare: int("ownership_share").default(100), // percentage (for joint ownership)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type OwnerProperty = typeof ownerProperties.$inferSelect;

// ─── Landlord Notifications / Approvals ──────────────────────────────────────
export const ownerNotifications = mysqlTable("owner_notifications", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("owner_id").notNull(),
  propertyId: int("property_id").notNull(),
  inspectionId: int("inspection_id"),
  type: mysqlEnum("type", [
    "inspection_complete",
    "maintenance_approval",
    "rent_appraisal",
    "hh_compliance",
    "maintenance_plan",
    "renovate_recommendations",
  ]).notNull(),
  title: varchar("title", { length: 256 }).notNull(),
  summary: text("summary"),
  // For maintenance approvals
  estimatedCost: varchar("estimated_cost", { length: 64 }),
  approvalStatus: mysqlEnum("approval_status", ["pending", "approved", "deferred", "discuss"]).default("pending"),
  approvalNote: text("approval_note"),
  approvedAt: timestamp("approved_at"),
  // PM workflow status: draft → pm_review → pm_approved → sent
  pmStatus: mysqlEnum("pm_status", ["draft", "pm_review", "pm_approved", "sent"]).default("draft").notNull(),
  pmNote: text("pm_note"),
  pmApprovedAt: timestamp("pm_approved_at"),
  // Delivery
  sentAt: timestamp("sent_at"),
  readAt: timestamp("read_at"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type OwnerNotification = typeof ownerNotifications.$inferSelect;

// ─── Marketing Photos ──────────────────────────────────────────────────────────
export const marketingPhotos = mysqlTable("marketing_photos", {
  id: int("id").autoincrement().primaryKey(),
  propertyId: int("property_id").notNull(),
  inspectionId: int("inspection_id"),
  // Storage
  url: text("url").notNull(),          // /manus-storage/... path
  storageKey: varchar("storage_key", { length: 512 }).notNull(),
  // Metadata
  style: varchar("style", { length: 64 }).notNull().default("professional"),  // e.g. "living_room", "exterior", "kitchen"
  roomLabel: varchar("room_label", { length: 128 }),  // human-readable label e.g. "Living Room"
  prompt: text("prompt"),              // the prompt used to generate
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type MarketingPhoto = typeof marketingPhotos.$inferSelect;

// ─── Improvements (Reno & Redec Recommendations) ──────────────────────────────
export const improvements = mysqlTable("improvements", {
  id: int("id").autoincrement().primaryKey(),
  propertyId: int("property_id").notNull(),
  inspectionId: int("inspection_id"),
  category: mysqlEnum("category", ["kitchen", "bathroom", "flooring", "exterior", "interior", "landscaping", "roofing", "other"]).notNull().default("other"),
  title: varchar("title", { length: 256 }).notNull(),
  description: text("description"),
  priority: mysqlEnum("priority", ["urgent", "high", "medium", "low"]).notNull().default("medium"),
  estimatedCostMin: int("estimated_cost_min"),
  estimatedCostMax: int("estimated_cost_max"),
  potentialRentUplift: int("potential_rent_uplift"), // $/week
  roiMonths: int("roi_months"),
  status: mysqlEnum("status", ["recommended", "approved", "in_progress", "completed", "deferred"]).default("recommended"),
  aiGenerated: boolean("ai_generated").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Improvement = typeof improvements.$inferSelect;

// ─── Invoices ─────────────────────────────────────────────────────────────────
export const invoices = mysqlTable("invoices", {
  id: int("id").autoincrement().primaryKey(),
  propertyId: int("property_id").notNull(),
  inspectionId: int("inspection_id"),
  invoiceNumber: varchar("invoice_number", { length: 64 }).notNull(),
  issueDate: timestamp("issue_date").notNull(),
  dueDate: timestamp("due_date").notNull(),
  status: mysqlEnum("status", ["draft", "sent", "paid", "overdue", "cancelled"]).default("draft"),
  // Recipient
  recipientName: varchar("recipient_name", { length: 256 }),
  recipientEmail: varchar("recipient_email", { length: 256 }),
  recipientAddress: text("recipient_address"),
  // Line items stored as JSON
  lineItems: json("line_items").$type<Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    gst: boolean;
  }>>().notNull(),
  // Totals (in cents to avoid float issues)
  subtotalCents: int("subtotal_cents").notNull().default(0),
  gstCents: int("gst_cents").notNull().default(0),
  totalCents: int("total_cents").notNull().default(0),
  // Notes
  notes: text("notes"),
  // Push to tracking
  pushedToPalace: boolean("pushed_to_palace").default(false),
  pushedAt: timestamp("pushed_at"),
  pdfUrl: text("pdf_url"),
  pdfStorageKey: varchar("pdf_storage_key", { length: 512 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Invoice = typeof invoices.$inferSelect;
