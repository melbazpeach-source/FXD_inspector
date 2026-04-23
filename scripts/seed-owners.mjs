import { createConnection } from "mysql2/promise";
import crypto from "crypto";
import dotenv from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "../.env") });

const conn = await createConnection(process.env.DATABASE_URL);

// Get properties
const [properties] = await conn.execute("SELECT id, address, suburb, city FROM properties ORDER BY id");
console.log("Properties found:", properties.map(p => `${p.id}: ${p.address}`));

if (properties.length === 0) {
  console.log("No properties found. Run seed-demo.mjs first.");
  await conn.end();
  process.exit(1);
}

// Clear existing owners data
await conn.execute("DELETE FROM owner_notifications");
await conn.execute("DELETE FROM owner_properties");
await conn.execute("DELETE FROM owners");
console.log("Cleared existing owner data");

// Create 3 demo owners
const owners = [
  {
    name: "David & Helen Thornton",
    entity_type: "individual",
    company_name: null,
    email: "d.thornton@email.co.nz",
    phone: "021 456 7890",
    alternate_phone: null,
    mailing_address: "PO Box 4421, Wellington 6011",
    preferred_contact: "email",
    report_frequency: "after_each_inspection",
    portal_enabled: false,
    portal_token: crypto.randomBytes(32).toString("hex"),
    notes: "Long-term clients — 8 years. David prefers email, Helen prefers phone. Very hands-off, trust PM completely. Budget conscious on maintenance.",
  },
  {
    name: "Meridian Property Holdings Ltd",
    entity_type: "company",
    company_name: "Meridian Property Holdings Ltd",
    email: "accounts@meridianproperty.co.nz",
    phone: "04 888 1234",
    alternate_phone: "021 999 5678",
    mailing_address: "Level 3, 45 Customhouse Quay, Wellington 6011",
    preferred_contact: "email",
    report_frequency: "monthly",
    portal_enabled: true,
    portal_token: crypto.randomBytes(32).toString("hex"),
    notes: "Corporate client with 3 properties. Requires formal reports. Finance team handles approvals — CC accounts@meridianproperty.co.nz on all correspondence. Quick to approve maintenance under $500.",
  },
  {
    name: "Te Ariki Ngata",
    entity_type: "individual",
    company_name: null,
    email: "teariki.ngata@gmail.com",
    phone: "027 333 4444",
    alternate_phone: null,
    mailing_address: "18 Karaka Bay Road, Eastbourne 5013",
    preferred_contact: "phone",
    report_frequency: "after_each_inspection",
    portal_enabled: false,
    portal_token: crypto.randomBytes(32).toString("hex"),
    notes: "First-time investor. Bought 2023. Keen to improve the property — open to renovation recommendations. Call before emailing.",
  },
];

const ownerIds = [];
for (const owner of owners) {
  const [result] = await conn.execute(
    `INSERT INTO owners (name, entity_type, company_name, email, phone, alternate_phone, mailing_address, preferred_contact, report_frequency, portal_enabled, portal_token, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      owner.name, owner.entity_type, owner.company_name, owner.email, owner.phone,
      owner.alternate_phone, owner.mailing_address, owner.preferred_contact,
      owner.report_frequency, owner.portal_enabled ? 1 : 0, owner.portal_token, owner.notes,
    ]
  );
  ownerIds.push(result.insertId);
  console.log(`✅ Created owner: ${owner.name} (id: ${result.insertId})`);
}

// Link owners to properties
// Owner 1 (Thornton) → Property 1 (14 Rata Street)
// Owner 2 (Meridian) → Property 2 (Unit 4/22 Beach Road) + Property 3 (if exists)
// Owner 3 (Ngata) → Last property
const linkages = [
  { ownerIdx: 0, propIdx: 0, isPrimary: 1, share: 100 },
  { ownerIdx: 1, propIdx: 1, isPrimary: 1, share: 100 },
  { ownerIdx: 2, propIdx: Math.min(2, properties.length - 1), isPrimary: 1, share: 100 },
];

// If there's a 3rd property, also link it to Meridian
if (properties.length >= 3) {
  linkages.push({ ownerIdx: 1, propIdx: 2, isPrimary: 0, share: 100 });
}

for (const link of linkages) {
  const ownerId = ownerIds[link.ownerIdx];
  const propertyId = properties[link.propIdx].id;
  await conn.execute(
    "INSERT INTO owner_properties (owner_id, property_id, is_primary, ownership_share) VALUES (?, ?, ?, ?)",
    [ownerId, propertyId, link.isPrimary, link.share]
  );
  console.log(`✅ Linked ${owners[link.ownerIdx].name} → ${properties[link.propIdx].address}`);
}

// Create demo notifications for Owner 1 (Thornton) — 14 Rata Street
const prop1Id = properties[0].id;
const owner1Id = ownerIds[0];

// Find inspection for property 1
const [inspections] = await conn.execute(
  "SELECT id FROM inspections WHERE property_id = ? ORDER BY id DESC LIMIT 1",
  [prop1Id]
);
const inspectionId = inspections[0]?.id ?? null;

const notifications = [
  {
    owner_id: owner1Id,
    property_id: prop1Id,
    inspection_id: inspectionId,
    type: "inspection_complete",
    title: "Inspection Complete — 14 Rata Street, Newtown",
    summary: "Routine inspection completed. Property in good overall condition. 4 maintenance items identified — 1 urgent (bathroom exhaust fan), 3 routine. Healthy Homes compliance confirmed. Full report attached.",
    estimated_cost: null,
    approval_status: "pending",
    sent_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    read_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
  },
  {
    owner_id: owner1Id,
    property_id: prop1Id,
    inspection_id: inspectionId,
    type: "maintenance_approval",
    title: "Maintenance Approval Required — Bathroom Exhaust Fan",
    summary: "The bathroom exhaust fan has failed. This is a Healthy Homes requirement under the Moisture & Drainage standard. Immediate replacement recommended to avoid compliance breach. Tradie is available this week.",
    estimated_cost: "$180–$280 (supply & install)",
    approval_status: "pending",
    sent_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    read_at: null,
  },
  {
    owner_id: owner1Id,
    property_id: prop1Id,
    inspection_id: inspectionId,
    type: "rent_appraisal",
    title: "Rent Appraisal Ready — 14 Rata Street",
    summary: "Current rent: $650/wk. Market analysis suggests $670–$700/wk is achievable at next renewal. Comparable properties in Newtown are achieving $680–$720/wk. Recommend increase of $20–$30/wk.",
    estimated_cost: null,
    approval_status: "approved",
    sent_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    read_at: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000),
  },
  {
    owner_id: owner1Id,
    property_id: prop1Id,
    inspection_id: null,
    type: "hh_compliance",
    title: "Healthy Homes Compliance Certificate — 14 Rata Street",
    summary: "All 5 Healthy Homes standards confirmed compliant as at inspection date. Certificate valid for insurance, audit, and tribunal purposes. Recommend keeping on file.",
    estimated_cost: null,
    approval_status: "approved",
    sent_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    read_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
  },
  {
    owner_id: owner1Id,
    property_id: prop1Id,
    inspection_id: null,
    type: "renovate_recommendations",
    title: "Renovate & Redecorate Recommendations — 14 Rata Street",
    summary: "FXD Inspector has identified 3 high-ROI improvement opportunities: (1) Replace master bedroom carpet ~$1,400 — potential rent uplift $25–$40/wk; (2) Repaint lounge & hallway ~$800 — improves tenant retention; (3) Install heat pump in living area ~$2,800 — Healthy Homes compliance + $40–$60/wk rent uplift.",
    estimated_cost: "~$5,000 total (3 items)",
    approval_status: "discuss",
    sent_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    read_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
  },
];

for (const notif of notifications) {
  // All demo notifications are 'sent' (they've already been PM-approved and dispatched)
  await conn.execute(
    `INSERT INTO owner_notifications (owner_id, property_id, inspection_id, type, title, summary, estimated_cost, approval_status, pm_status, sent_at, read_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'sent', ?, ?)`,
    [
      notif.owner_id, notif.property_id, notif.inspection_id,
      notif.type, notif.title, notif.summary, notif.estimated_cost,
      notif.approval_status, notif.sent_at, notif.read_at,
    ]
  );
  console.log(`✅ Created notification: ${notif.title.slice(0, 60)}…`);
}

// Also create 2 draft items in the PM queue for Owner 1 — to demo the workflow
const [draftResult1] = await conn.execute(
  `INSERT INTO owner_notifications (owner_id, property_id, type, title, summary, pm_status, approval_status)
   VALUES (?, ?, 'maintenance_plan', ?, ?, 'draft', 'pending')`,
  [owner1Id, prop1Id,
    '12-Month Maintenance Plan — 14 Rata Street',
    'Forward-looking maintenance schedule for the next 12 months. Key items: gutter clean (April, ~$180), heat pump service (May, ~$120), smoke alarm replacements (June, ~$255), exterior touch-up (October, ~$700). Total estimated budget: $1,255–$1,500.']
);
console.log(`✅ Created DRAFT notification: 12-Month Maintenance Plan (id: ${draftResult1.insertId})`);

const [draftResult2] = await conn.execute(
  `INSERT INTO owner_notifications (owner_id, property_id, type, title, summary, estimated_cost, pm_status, approval_status)
   VALUES (?, ?, 'maintenance_approval', ?, ?, ?, 'pm_approved', 'pending')`,
  [owner1Id, prop1Id,
    'Maintenance Approval — Hot Water Cylinder Replacement',
    'Hot water cylinder is 11 years old and showing early signs of corrosion. Proactive replacement recommended before winter to avoid emergency call-out costs. Tradie available next Tuesday.',
    '$1,400–$1,800 installed']
);
console.log(`✅ Created PM_APPROVED notification: Hot Water Cylinder (id: ${draftResult2.insertId})`);

await conn.end();
console.log("\n🎉 Owner demo data seeded successfully!");
console.log(`   ${owners.length} owners created`);
console.log(`   ${linkages.length} property links created`);
console.log(`   ${notifications.length} notifications created for ${owners[0].name}`);
