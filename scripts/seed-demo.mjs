/**
 * FXD Inspector — NZ Demo Seed Script
 * Seeds realistic NZ property management demo data for pitch presentations.
 * Run: node scripts/seed-demo.mjs
 */

import mysql from "mysql2/promise";
import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "../.env") });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL not set");
  process.exit(1);
}

const conn = await mysql.createConnection(DATABASE_URL);
console.log("✅ Connected to database");

async function q(sql, params = []) {
  const [rows] = await conn.execute(sql, params);
  return rows;
}
async function insert(sql, params = []) {
  const [result] = await conn.execute(sql, params);
  return result.insertId;
}

// ─── Get inspector user ID ────────────────────────────────────────────────────
const users = await q("SELECT id, name FROM users LIMIT 1");
if (!users.length) {
  console.error("❌ No users found — please log in first, then re-run this script");
  process.exit(1);
}
const inspectorId = users[0].id;
const inspectorName = users[0].name;
console.log(`👤 Using inspector: ${inspectorName} (id=${inspectorId})`);

// ─── Clear existing demo data ─────────────────────────────────────────────────
console.log("🧹 Clearing existing demo data...");
await q("DELETE FROM pm_review_queue");
await q("DELETE FROM rental_appraisals");
await q("DELETE FROM maintenance_plan_items");
await q("DELETE FROM healthy_homes_assessments");
await q("DELETE FROM ai_descriptions");
await q("DELETE FROM maintenance_items");
await q("DELETE FROM room_items");
await q("DELETE FROM inspection_rooms");
await q("DELETE FROM photos");
await q("DELETE FROM reports");
await q("DELETE FROM inspections");
await q("DELETE FROM appointments");
await q("DELETE FROM chattels");
await q("DELETE FROM inventory_items");
await q("DELETE FROM tenants");
await q("DELETE FROM properties");
console.log("✅ Cleared");

// ─── PROPERTIES ───────────────────────────────────────────────────────────────
console.log("🏠 Seeding properties...");

const prop1 = await insert(`
  INSERT INTO properties (address, suburb, city, postcode, landlord_name, landlord_email, landlord_phone, notes, platform_source)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ["14 Rata Street", "Newtown", "Wellington", "6021",
   "James & Helen Forsyth", "james.forsyth@gmail.com", "021 456 7890",
   "1960s character villa, recently renovated kitchen. Weatherboard exterior, iron roof. 3BR/1BA, single garage.", "manual"]);

const prop2 = await insert(`
  INSERT INTO properties (address, suburb, city, postcode, landlord_name, landlord_email, landlord_phone, notes, platform_source)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ["Unit 4/22 Beach Road", "Takapuna", "Auckland", "0622",
   "Ngaio Property Trust", "ngaio.trust@outlook.co.nz", "09 555 1234",
   "Modern 2BR apartment in well-maintained complex. Body corporate managed. Sea views from deck.", "manual"]);

const prop3 = await insert(`
  INSERT INTO properties (address, suburb, city, postcode, landlord_name, landlord_email, landlord_phone, notes, platform_source)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ["88 Fitzgerald Avenue", "Merivale", "Christchurch", "8014",
   "David & Aroha Tane", "dtane@xtra.co.nz", "027 888 3456",
   "Post-earthquake rebuild 2012. 4BR/2BA, double garage. Heat pump x2, HRV system. Premium condition.", "manual"]);

console.log(`  ✅ 3 properties: ${prop1}, ${prop2}, ${prop3}`);

// ─── TENANTS ──────────────────────────────────────────────────────────────────
console.log("👥 Seeding tenants...");

const tenant1 = await insert(`
  INSERT INTO tenants (property_id, name, email, phone, is_primary)
  VALUES (?, ?, ?, ?, ?)`,
  [prop1, "Sarah & Tom Nguyen", "sarah.nguyen@gmail.com", "021 234 5678", true]);

const tenant2 = await insert(`
  INSERT INTO tenants (property_id, name, email, phone, is_primary)
  VALUES (?, ?, ?, ?, ?)`,
  [prop2, "Marcus Chen", "m.chen@hotmail.com", "021 987 6543", true]);

const tenant3 = await insert(`
  INSERT INTO tenants (property_id, name, email, phone, is_primary)
  VALUES (?, ?, ?, ?, ?)`,
  [prop3, "Raj Patel", "raj.patel@gmail.com", "027 111 2222", true]);

console.log(`  ✅ 3 tenants`);

// ─── APPOINTMENTS ─────────────────────────────────────────────────────────────
console.log("📅 Seeding appointments...");

const appt1 = await insert(`
  INSERT INTO appointments (property_id, scheduled_at, duration_minutes, inspector_id, platform_source, sync_status, status, notes)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  [prop1, new Date("2026-04-22 10:00:00"), 60, inspectorId, "manual", "manual", "completed",
   "Routine 6-month inspection. Tenant notified 48hrs prior."]);

const appt2 = await insert(`
  INSERT INTO appointments (property_id, scheduled_at, duration_minutes, inspector_id, platform_source, sync_status, status, notes)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  [prop2, new Date("2026-04-25 14:00:00"), 45, inspectorId, "manual", "manual", "scheduled",
   "Annual routine inspection."]);

const appt3 = await insert(`
  INSERT INTO appointments (property_id, scheduled_at, duration_minutes, inspector_id, platform_source, sync_status, status, notes)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  [prop3, new Date("2026-04-28 09:00:00"), 90, inspectorId, "manual", "manual", "scheduled",
   "Full inspection ahead of lease renewal."]);

const appt4 = await insert(`
  INSERT INTO appointments (property_id, scheduled_at, duration_minutes, inspector_id, platform_source, sync_status, status, notes)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  [prop1, new Date("2026-05-02 11:00:00"), 90, inspectorId, "manual", "manual", "scheduled",
   "Vacate inspection — tenants moving out 1 May."]);

console.log(`  ✅ 4 appointments`);

// ─── COMPLETED INSPECTION — 14 Rata Street ───────────────────────────────────
console.log("🔍 Seeding completed inspection for 14 Rata Street...");

const insp1 = await insert(`
  INSERT INTO inspections (property_id, appointment_id, inspector_id, type, status, overall_condition, general_notes, started_at, completed_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  [prop1, appt1, inspectorId, "new_routine", "completed", "good",
   "Property is well-maintained overall. Tenants are clearly house-proud. A few items noted for attention — minor bathroom grout discolouration, one kitchen tap dripping, and the heat pump filter needs cleaning. No urgent maintenance required. Recommend scheduling a gutter clean before winter.",
   new Date("2026-04-22 10:05:00"), new Date("2026-04-22 11:02:00")]);

await q("UPDATE appointments SET inspection_id = ?, status = 'completed' WHERE id = ?", [insp1, appt1]);

// ─── ROOMS ────────────────────────────────────────────────────────────────────
console.log("🚪 Seeding rooms...");

const roomData = [
  { name: "Front Entry & Hallway", order: 1, condition: "good", notes: "Clean and tidy. Carpet in good condition, no stains. Front door lock operates smoothly.", issues: false },
  { name: "Living Room", order: 2, condition: "good", notes: "Well presented. Walls clean with no marks. Heat pump unit clean externally — filter due for clean. Carpet shows light wear consistent with tenancy length.", issues: false },
  { name: "Kitchen", order: 3, condition: "fair", notes: "Generally clean. One cold tap dripping — washer replacement required. Rangehood filter greasy, needs cleaning. Oven clean. Dishwasher operational.", issues: true },
  { name: "Master Bedroom", order: 4, condition: "excellent", notes: "Excellent condition. Freshly painted walls. Wardrobe doors tracking well. Carpet clean and vacuumed.", issues: false },
  { name: "Bedroom 2", order: 5, condition: "good", notes: "Good condition. Minor scuff on skirting board near door — tenant advised. Curtains clean and functional.", issues: false },
  { name: "Bedroom 3 / Home Office", order: 6, condition: "good", notes: "Used as home office. Good condition. No issues noted.", issues: false },
  { name: "Bathroom", order: 7, condition: "fair", notes: "Functional and clean. Grout between floor tiles showing discolouration around shower base — recommend re-grouting within 3 months to prevent moisture ingress. Extractor fan operational. Toilet seal intact.", issues: true },
  { name: "Laundry", order: 8, condition: "good", notes: "Clean and tidy. Washing machine connections secure. No leaks detected. Dryer vented correctly.", issues: false },
  { name: "Garage", order: 9, condition: "good", notes: "Used for storage and parking. Automatic door operational. No oil stains on floor. Fire door to house self-closing and latching correctly.", issues: false },
  { name: "Exterior & Gardens", order: 10, condition: "fair", notes: "Gardens tidy and well-maintained by tenants. Gutters have leaf accumulation — recommend professional clean before winter. Deck boards sound, no rot detected. Exterior paint showing minor weathering on south-facing gable — monitor.", issues: true },
];

const roomIds = [];
for (const room of roomData) {
  const rid = await insert(`
    INSERT INTO inspection_rooms (inspection_id, name, room_order, condition_rating, notes, has_issues, is_complete)
    VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [insp1, room.name, room.order, room.condition, room.notes, room.issues, true]);
  roomIds.push(rid);
}
console.log(`  ✅ ${roomData.length} rooms`);

// ─── ROOM ITEMS ───────────────────────────────────────────────────────────────
await insert(`INSERT INTO room_items (room_id, label, condition_rating, notes, is_damaged, maintenance_required) VALUES (?, ?, ?, ?, ?, ?)`,
  [roomIds[2], "Cold tap (kitchen mixer)", "fair", "Dripping — washer replacement required. Est. $80–$120 incl. labour.", false, true]);
await insert(`INSERT INTO room_items (room_id, label, condition_rating, notes, is_damaged, maintenance_required) VALUES (?, ?, ?, ?, ?, ?)`,
  [roomIds[2], "Rangehood filter", "poor", "Heavily grease-laden. Clean or replace.", false, true]);
await insert(`INSERT INTO room_items (room_id, label, condition_rating, notes, is_damaged, maintenance_required) VALUES (?, ?, ?, ?, ?, ?)`,
  [roomIds[2], "Oven / Cooktop", "good", "Clean and operational. All burners working.", false, false]);
await insert(`INSERT INTO room_items (room_id, label, condition_rating, notes, is_damaged, maintenance_required) VALUES (?, ?, ?, ?, ?, ?)`,
  [roomIds[6], "Floor tile grout (shower base)", "fair", "Discolouration noted. Re-grouting recommended within 3 months to prevent moisture ingress under tiles.", false, true]);
await insert(`INSERT INTO room_items (room_id, label, condition_rating, notes, is_damaged, maintenance_required) VALUES (?, ?, ?, ?, ?, ?)`,
  [roomIds[6], "Extractor fan", "good", "Operational. Clean. Evidence of regular use.", false, false]);
await insert(`INSERT INTO room_items (room_id, label, condition_rating, notes, is_damaged, maintenance_required) VALUES (?, ?, ?, ?, ?, ?)`,
  [roomIds[9], "Gutters", "fair", "Leaf accumulation. Professional clean recommended before winter (May–June).", false, true]);
await insert(`INSERT INTO room_items (room_id, label, condition_rating, notes, is_damaged, maintenance_required) VALUES (?, ?, ?, ?, ?, ?)`,
  [roomIds[1], "Heat pump (Mitsubishi Electric 5.0kW)", "good", "Operational. Filter indicator light on — clean due. Not a fault.", false, true]);

console.log("  ✅ Room items");

// ─── MAINTENANCE ITEMS ────────────────────────────────────────────────────────
console.log("🔧 Seeding maintenance items...");

await insert(`INSERT INTO maintenance_items (inspection_id, room_id, description, priority, is_damage, estimated_cost, status) VALUES (?, ?, ?, ?, ?, ?, ?)`,
  [insp1, roomIds[2], "Kitchen cold tap dripping — replace washer. Recommend licensed plumber.", "medium", false, "$80–$120", "open"]);
await insert(`INSERT INTO maintenance_items (inspection_id, room_id, description, priority, is_damage, estimated_cost, status) VALUES (?, ?, ?, ?, ?, ?, ?)`,
  [insp1, roomIds[6], "Bathroom floor tile grout discolouration around shower base. Re-grout to prevent moisture ingress.", "medium", false, "$200–$350", "open"]);
await insert(`INSERT INTO maintenance_items (inspection_id, room_id, description, priority, is_damage, estimated_cost, status) VALUES (?, ?, ?, ?, ?, ?, ?)`,
  [insp1, roomIds[9], "Gutter clean — leaf accumulation. Schedule before winter.", "low", false, "$150–$250", "open"]);
await insert(`INSERT INTO maintenance_items (inspection_id, room_id, description, priority, is_damage, estimated_cost, status) VALUES (?, ?, ?, ?, ?, ?, ?)`,
  [insp1, roomIds[1], "Heat pump filter clean — living room unit. Tenant can complete or arrange service.", "low", false, "$0 (DIY) or $80 (service)", "open"]);

console.log("  ✅ 4 maintenance items");

// ─── AI DESCRIPTIONS (using actual column names) ──────────────────────────────
console.log("🤖 Seeding Fixx AI descriptions...");

await insert(`INSERT INTO ai_descriptions (inspection_id, room_id, decor, condition, points_to_note, recommendations) VALUES (?, ?, ?, ?, ?, ?)`,
  [insp1, roomIds[1],
   "The living room presents a warm, comfortable aesthetic consistent with a well-occupied family home. Walls are painted in a neutral warm white, complemented by a feature wall in muted sage green. Carpet is a mid-tone beige Axminster-style pile. Window treatments are full-length linen-look curtains in off-white, functioning correctly on their tracks. The heat pump unit (Mitsubishi Electric 5.0kW) is mounted on the north wall.",
   "Overall condition is GOOD. Walls are clean and free of marks or scuffs. Carpet shows light but even wear consistent with 2+ years of tenancy — no staining, no fraying at edges. Skirting boards clean. Ceiling rose intact. Light fittings clean and operational. Heat pump unit is clean externally; however, the filter indicator light is illuminated, indicating the filter requires cleaning — this is a routine maintenance item.",
   "1. Heat pump filter indicator light is on — filter cleaning is due. This is a routine item and does not indicate a fault. Tenant should be advised to clean the filter or arrange for it to be done.\n2. Minor indentation in carpet at previous furniture position (north-east corner) — consistent with normal use, not tenant damage.",
   "1. ROUTINE: Arrange heat pump filter clean — either advise tenant (DIY, 15 mins) or include in next service call.\n2. MONITOR: Carpet wear — acceptable at this stage, reassess at next inspection. No action required."]);

await insert(`INSERT INTO ai_descriptions (inspection_id, room_id, decor, condition, points_to_note, recommendations) VALUES (?, ?, ?, ?, ?, ?)`,
  [insp1, roomIds[2],
   "Standard residential kitchen with laminate benchtops in a light oak finish, white subway tile splashback, and overhead and under-bench cabinetry in white melamine. Stainless steel sink and mixer tap (hot functional, cold dripping). Freestanding Westinghouse oven/cooktop (white). Integrated Fisher & Paykel dishwasher. Schweigen rangehood above cooktop.",
   "Overall condition is FAIR. Kitchen is clean and functional with two maintenance items noted. The cold tap on the kitchen mixer is dripping at approximately 1 drip per 2 seconds — a worn washer is the likely cause. The rangehood filter is heavily grease-laden and requires cleaning or replacement. Benchtops are clean with no burns or cuts. Cabinetry doors and drawers all operational. Dishwasher ran a test cycle successfully.",
   "1. MAINTENANCE REQUIRED: Cold tap dripping — washer replacement needed. Left unattended, this will result in water waste and potential staining of the sink.\n2. MAINTENANCE REQUIRED: Rangehood filter requires cleaning — grease accumulation is a fire risk if not addressed.\n3. One cabinet hinge (upper left cabinet, door 3) is slightly loose — minor adjustment required.",
   "1. URGENT-ISH: Arrange licensed plumber to replace kitchen tap washer. Estimated cost $80–$120 incl. labour.\n2. ROUTINE: Rangehood filter — clean or replace. Tenant can be asked to clean, or include in next trade visit.\n3. MINOR: Cabinet hinge adjustment — can be done by handyman or property manager."]);

await insert(`INSERT INTO ai_descriptions (inspection_id, room_id, decor, condition, points_to_note, recommendations) VALUES (?, ?, ?, ?, ?, ?)`,
  [insp1, roomIds[6],
   "Standard residential bathroom. Floor: 300x300mm ceramic tiles in light grey. Walls: white subway tiles to ceiling in shower, painted plasterboard elsewhere. White melamine vanity with integrated basin. Mirror cabinet above vanity. Freestanding acrylic bath in white. Over-bath shower with glass screen and chrome fittings.",
   "Overall condition is FAIR. The bathroom is clean and functional. The primary concern is grout discolouration around the shower base perimeter — the grout has darkened significantly, likely from moisture and mould ingress. This is a maintenance issue, not tenant damage. If left unaddressed, moisture can penetrate under the tiles causing substrate damage. Extractor fan is operational and appears to be used regularly (no condensation staining on ceiling). Toilet: flush mechanism operational, no leaks at base or cistern.",
   "1. MAINTENANCE REQUIRED: Shower base grout discolouration — re-grouting recommended within 3 months.\n2. Extractor fan is operational — good. Evidence of regular use.\n3. Bath plug chain is missing — minor item, tenant to replace.",
   "1. SCHEDULE: Arrange tiler to re-grout shower base within 3 months. Estimated cost $200–$350. Do not defer beyond 6 months.\n2. MINOR: Bath plug chain — advise tenant to replace ($5 from hardware store).\n3. MONITOR: Ceiling above shower for any condensation staining at next inspection."]);

console.log("  ✅ 3 AI descriptions (Living Room, Kitchen, Bathroom)");

// ─── PHOTOS ───────────────────────────────────────────────────────────────────
console.log("📸 Seeding photo records...");

const photoData = [
  { roomId: roomIds[0], url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80", caption: "Front entry hallway — clean and tidy", type: "standard" },
  { roomId: roomIds[1], url: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80", caption: "Living room — heat pump filter indicator on", type: "standard" },
  { roomId: roomIds[2], url: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80", caption: "Kitchen — overall view", type: "standard" },
  { roomId: roomIds[2], url: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800&q=80", caption: "Kitchen tap — dripping cold tap noted", type: "damage" },
  { roomId: roomIds[3], url: "https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=800&q=80", caption: "Master bedroom — excellent condition", type: "standard" },
  { roomId: roomIds[6], url: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800&q=80", caption: "Bathroom — grout discolouration at shower base", type: "damage" },
  { roomId: roomIds[9], url: "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&q=80", caption: "Exterior — front of property in good condition", type: "standard" },
];

for (const p of photoData) {
  await insert(`INSERT INTO photos (inspection_id, room_id, storage_key, url, photo_type, caption) VALUES (?, ?, ?, ?, ?, ?)`,
    [insp1, p.roomId, `demo/${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`, p.url, p.type, p.caption]);
}
console.log(`  ✅ ${photoData.length} photos`);

// ─── CHATTELS ─────────────────────────────────────────────────────────────────
console.log("🏷️  Seeding chattels...");

const chattelsData = [
  { name: "Heat Pump", cat: "heating_cooling", makeModel: "Mitsubishi Electric MSZ-GL50VGD", serial: "ME2019-GL50-4421", condReg: "good", condCur: "good", notes: "5.0kW reverse cycle. Installed 2019. Filter due for clean.", hhItem: true, hhCat: "heating" },
  { name: "Oven / Cooktop", cat: "kitchen", makeModel: "Westinghouse WFE914SB", serial: null, condReg: "good", condCur: "good", notes: "Freestanding 90cm. All burners operational. Clean.", hhItem: false, hhCat: null },
  { name: "Rangehood", cat: "ventilation", makeModel: "Schweigen SB75", serial: null, condReg: "good", condCur: "fair", notes: "Filter requires cleaning — grease accumulation.", hhItem: true, hhCat: "ventilation" },
  { name: "Dishwasher", cat: "kitchen", makeModel: "Fisher & Paykel DD60DDFHX9", serial: null, condReg: "good", condCur: "good", notes: "Integrated. Test cycle completed successfully.", hhItem: false, hhCat: null },
  { name: "Floor Coverings (Carpet)", cat: "floor_coverings", makeModel: null, serial: null, condReg: "good", condCur: "good", notes: "Beige Axminster pile throughout bedrooms, hallway, living room. Light wear consistent with tenancy.", hhItem: false, hhCat: null },
  { name: "Window Treatments", cat: "window_treatments", makeModel: null, serial: null, condReg: "good", condCur: "good", notes: "Full-length linen curtains in living room. Venetian blinds in bedrooms. All operational.", hhItem: false, hhCat: null },
  { name: "Garage Door Opener", cat: "other", makeModel: "B&D Controll-A-Door", serial: null, condReg: "good", condCur: "good", notes: "Auto door operational. Remote x2 issued to tenant.", hhItem: false, hhCat: null },
];

for (const c of chattelsData) {
  await insert(`
    INSERT INTO chattels (property_id, name, category, make_model, serial_number, condition_at_registration, current_condition, notes, is_healthy_homes_item, healthy_homes_category)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [prop1, c.name, c.cat, c.makeModel, c.serial, c.condReg, c.condCur, c.notes, c.hhItem, c.hhCat]);
}
console.log(`  ✅ ${chattelsData.length} chattels`);

// ─── HEALTHY HOMES ASSESSMENT ─────────────────────────────────────────────────
console.log("🏡 Seeding Healthy Homes assessment...");

await insert(`
  INSERT INTO healthy_homes_assessments (
    property_id, inspection_id, inspector_id, climate_zone,
    heating_compliant, heating_device_type, heating_capacity_kw, heating_required_kw, heating_notes,
    insulation_compliant, ceiling_insulation_r_value, underfloor_insulation_r_value, ceiling_insulation_notes, underfloor_insulation_notes,
    ventilation_compliant, kitchen_extractor_fan, bathroom_extractor_fan, openable_windows_compliant, ventilation_notes,
    moisture_compliant, gutter_condition, subfloor_moisture_barrier, moisture_notes,
    draught_compliant, unused_fireplaces_blocked, draught_notes,
    overall_compliant, compliance_date, ai_summary, status
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  [prop1, insp1, inspectorId, "2",
   true, "Heat pump (Mitsubishi Electric)", "5.0", "3.2", "Mitsubishi Electric 5.0kW exceeds the calculated requirement of 3.2kW for the living area. Compliant.",
   true, "3.2", "1.3", "Ceiling insulation R3.2 confirmed (2019 upgrade). Meets minimum standard.", "Underfloor insulation R1.3 present. Meets minimum standard.",
   true, true, true, true, "Kitchen rangehood extractor present and operational (filter needs cleaning — not a compliance issue). Bathroom extractor fan operational. Living room has two openable windows exceeding 5% of floor area.",
   true, "fair", true, "Subfloor drainage adequate. No pooling observed. Polythene moisture barrier present and in good condition. Gutters have leaf accumulation — maintenance item but not a compliance failure.",
   true, true, "Unused fireplace in living room has been blocked with a fitted board. All other draught sources sealed.",
   true, new Date("2026-04-22"),
   "14 Rata Street, Newtown is COMPLIANT with all five Healthy Homes Standards as at 22 April 2026. Heating: compliant (5.0kW heat pump exceeds 3.2kW requirement). Insulation: compliant (ceiling R3.2, underfloor R1.3). Ventilation: compliant (kitchen extractor, bathroom extractor, adequate openable windows). Moisture ingress & drainage: compliant. Draught stopping: compliant. No remediation required.",
   "completed"]);

console.log("  ✅ Healthy Homes — COMPLIANT ✅");

// ─── MAINTENANCE PLAN ─────────────────────────────────────────────────────────
console.log("🔧 Seeding 12-month maintenance plan...");

const planItems = [
  { title: "Kitchen tap washer replacement", location: "Kitchen", light: "orange", cost: "under_500", action: "Arrange licensed plumber to replace worn washer on cold tap mixer. Dripping tap wastes water and will worsen.", timeline: "Within 2 weeks", month: 1 },
  { title: "Bathroom shower base re-grout", location: "Bathroom", light: "orange", cost: "under_500", action: "Arrange tiler to re-grout shower base perimeter. Discolouration indicates moisture ingress risk. Do not defer beyond 3 months.", timeline: "Within 3 months", month: 2 },
  { title: "Gutter clean (pre-winter)", location: "Exterior", light: "orange", cost: "under_500", action: "Professional gutter clean before winter rains. Leaf accumulation noted. Blocked gutters can cause fascia rot and water ingress.", timeline: "May–June 2026", month: 2 },
  { title: "Heat pump filter clean", location: "Living Room", light: "green", cost: "under_500", action: "Clean heat pump filter. Tenant can do this (15 min DIY) or include in next service call. Filter indicator light is on.", timeline: "Within 1 month", month: 1 },
  { title: "Rangehood filter clean/replace", location: "Kitchen", light: "green", cost: "under_500", action: "Clean or replace rangehood filter. Grease accumulation is a minor fire risk. Tenant responsibility or include in trade visit.", timeline: "Within 1 month", month: 1 },
  { title: "Exterior paint — south gable", location: "Exterior", light: "green", cost: "500_2000", action: "Monitor weathering on south-facing gable end. Minor at this stage. Plan for repaint within 12 months to protect weatherboards.", timeline: "Within 12 months", month: 10 },
  { title: "Heat pump annual service", location: "Living Room", light: "green", cost: "under_500", action: "Schedule annual heat pump service (refrigerant check, coil clean, filter replacement). Recommended annually for warranty compliance.", timeline: "September 2026", month: 6 },
  { title: "Smoke alarm test & battery check", location: "Throughout", light: "green", cost: "under_500", action: "Test all smoke alarms and replace batteries. Required annually under RTA. Schedule with next inspection or tenant self-test.", timeline: "October 2026", month: 7 },
];

for (const item of planItems) {
  await insert(`
    INSERT INTO maintenance_plan_items (property_id, title, location, traffic_light, estimated_cost_bracket, recommended_action, urgency_timeline, due_by_month, source_inspection_id, is_ai_generated, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open')`,
    [prop1, item.title, item.location, item.light, item.cost, item.action, item.timeline, item.month, insp1, true]);
}
console.log(`  ✅ ${planItems.length} maintenance plan items (3 orange, 5 green)`);

// ─── RENTAL APPRAISAL ─────────────────────────────────────────────────────────
console.log("💰 Seeding rental appraisal...");

await insert(`
  INSERT INTO rental_appraisals (property_id, inspection_id, current_rent, recommended_rent_low, recommended_rent_high, market_median, condition_premium_discount, comparable_analysis, market_sentiment, vacancy_rate, ai_draft_report, status)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft')`,
  [prop1, insp1, "$650/wk", "$670/wk", "$700/wk", "$680/wk", "+$10–20 (good condition premium)",
   "Analysis of comparable 3-bedroom properties in Newtown and adjacent suburbs (Berhampore, Island Bay, Mt Cook) indicates current market range of $650–$720 per week for properties of similar size and standard. 14 Rata Street benefits from a recently renovated kitchen, off-street parking, and a compliant heat pump. The property is currently rented at $650/wk — slightly below the market median of $680/wk. A modest increase to $670–$700/wk at next lease renewal would be defensible and consistent with market conditions.",
   "rising", "2.1%",
   "RENTAL APPRAISAL — 14 Rata Street, Newtown, Wellington\nPrepared by Fixx AI | FXD Inspector | 22 April 2026\n\nCURRENT RENT: $650 per week\nRECOMMENDED RANGE: $670–$700 per week\nMARKET MEDIAN (3BR Newtown): $680 per week\n\nMARKET COMMENTARY\nThe Wellington rental market continues to show modest upward pressure in inner-city suburbs. Newtown remains in high demand due to proximity to the hospital precinct, Victoria University, and CBD. Vacancy rates in the suburb are running at approximately 2.1%, indicating a tight market favouring landlords.\n\nPROPERTY ASSESSMENT\nThis property presents well above average for its age cohort (1960s villa). The renovated kitchen, compliant heating, and well-maintained grounds support a condition premium above the suburb median. The current rent of $650/wk is approximately 4% below market median.\n\nRECOMMENDATION\nAt next lease renewal, recommend a rent review to $670–$680/wk. This represents a fair market adjustment that remains competitive while improving yield.\n\nDISCLAIMER: This appraisal is prepared by an AI system and is indicative only. It should be reviewed by a licensed property manager before being presented to the owner."]);

console.log("  ✅ Rental appraisal ($670–$700/wk recommendation)");

// ─── PM REVIEW QUEUE ──────────────────────────────────────────────────────────
console.log("📋 Seeding PM review queue...");

const tenantLetterDraft = `Dear Sarah & Tom,

Thank you for allowing us access to 14 Rata Street for the routine inspection on 22 April 2026.

We are pleased to report that the property is being well maintained and you are clearly taking good care of your home. We noted the following items for your attention:

MAINTENANCE ITEMS (we will arrange):
• Kitchen cold tap — we will arrange a plumber to replace the washer. We will be in touch to schedule a suitable time.
• Bathroom shower grout — we will arrange a tiler to re-grout the shower base. We will contact you to schedule.

ITEMS FOR YOUR ATTENTION:
• Heat pump filter — the filter indicator light is on. Please clean the filter at your convenience (instructions are on the inside of the front panel, or we can send you a guide).
• Rangehood filter — please clean or replace the filter when convenient.

Overall, the property is in good condition and we appreciate the care you take. Please don't hesitate to contact us if you have any maintenance concerns.

Kind regards,
[Property Manager Name]
FXD Inspector Property Management`;

await insert(`
  INSERT INTO pm_review_queue (inspection_id, property_id, assigned_to_user_id, status, tenant_letter_draft, tenant_letter_approved, maintenance_requests_created, maintenance_request_count, pdf_report_ready, agent_notes)
  VALUES (?, ?, ?, 'pending', ?, false, false, 4, true, ?)`,
  [insp1, prop1, inspectorId, tenantLetterDraft,
   "Inspection completed 22 April. 4 maintenance items (2 medium, 2 low). Property is HH compliant. Rental appraisal suggests $670–700/wk at next renewal. Recommend approving tenant letter and creating maintenance requests."]);

console.log("  ✅ PM review queue item (pending approval)");

// ─── REPORT ───────────────────────────────────────────────────────────────────
await insert(`INSERT INTO reports (inspection_id, status, generated_at) VALUES (?, 'ready', NOW())`, [insp1]);
console.log("  ✅ Report record");

// ─── IN-PROGRESS INSPECTION — Unit 4/22 Beach Road ───────────────────────────
console.log("🔍 Seeding in-progress inspection for Unit 4/22 Beach Road...");

const insp2 = await insert(`
  INSERT INTO inspections (property_id, appointment_id, inspector_id, type, status, general_notes, started_at)
  VALUES (?, ?, ?, ?, ?, ?, ?)`,
  [prop2, appt2, inspectorId, "new_routine", "in_progress",
   "Inspection in progress.", new Date("2026-04-25 14:05:00")]);

await q("UPDATE appointments SET inspection_id = ?, status = 'in_progress' WHERE id = ?", [insp2, appt2]);

const r1 = await insert(`INSERT INTO inspection_rooms (inspection_id, name, room_order, condition_rating, notes, has_issues, is_complete) VALUES (?, ?, ?, ?, ?, ?, ?)`,
  [insp2, "Entry & Living Area", 1, "excellent", "Modern open-plan living. Excellent condition. Sea views from deck. No issues.", false, true]);
const r2 = await insert(`INSERT INTO inspection_rooms (inspection_id, name, room_order, condition_rating, notes, has_issues, is_complete) VALUES (?, ?, ?, ?, ?, ?, ?)`,
  [insp2, "Kitchen", 2, "good", "Clean and tidy. All appliances operational. No issues.", false, true]);
await insert(`INSERT INTO inspection_rooms (inspection_id, name, room_order, condition_rating, notes, has_issues, is_complete) VALUES (?, ?, ?, ?, ?, ?, ?)`,
  [insp2, "Master Bedroom", 3, "na", null, false, false]);
await insert(`INSERT INTO inspection_rooms (inspection_id, name, room_order, condition_rating, notes, has_issues, is_complete) VALUES (?, ?, ?, ?, ?, ?, ?)`,
  [insp2, "Bedroom 2", 4, "na", null, false, false]);
await insert(`INSERT INTO inspection_rooms (inspection_id, name, room_order, condition_rating, notes, has_issues, is_complete) VALUES (?, ?, ?, ?, ?, ?, ?)`,
  [insp2, "Bathroom", 5, "na", null, false, false]);

console.log("  ✅ In-progress inspection (2 of 5 rooms complete)");

// ─── DONE ─────────────────────────────────────────────────────────────────────
await conn.end();

console.log(`
╔══════════════════════════════════════════════════════════════╗
║         🎉 FXD INSPECTOR — DEMO SEED COMPLETE               ║
╠══════════════════════════════════════════════════════════════╣
║  📍 3 NZ properties (Wellington, Auckland, Christchurch)     ║
║  👥 3 active tenancies                                       ║
║  📅 4 appointments (1 done, 1 in-progress, 2 upcoming)       ║
║                                                              ║
║  🔍 COMPLETED INSPECTION — 14 Rata Street, Newtown           ║
║     • 10 rooms, all assessed                                 ║
║     • 3 Fixx AI descriptions (living, kitchen, bathroom)     ║
║     • 7 photos                                               ║
║     • 4 maintenance items                                    ║
║     • Healthy Homes: COMPLIANT ✅                            ║
║     • 8-item maintenance plan (3 orange, 5 green)            ║
║     • Rental appraisal: $670–$700/wk recommendation          ║
║     • PM Review Queue: pending approval                      ║
║     • 7 chattels registered                                  ║
║                                                              ║
║  🔄 IN-PROGRESS — Unit 4/22 Beach Road, Takapuna             ║
║     • 2 of 5 rooms complete                                  ║
║                                                              ║
║  🚀 PITCH WALKTHROUGH:                                       ║
║     Dashboard → Inspections → 14 Rata Street                 ║
╚══════════════════════════════════════════════════════════════╝
`);
