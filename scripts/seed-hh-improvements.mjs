import mysql from "mysql2/promise";

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// 1. Healthy Homes assessment for 14 Rata Street (property_id=4, id=2)
await conn.query(`
  UPDATE healthy_homes_assessments SET
    climate_zone = '2',
    heating_compliant = 1,
    heating_device_type = 'Heat pump (Mitsubishi MSZ-AP25VGD)',
    heating_capacity_kw = '2.5',
    heating_required_kw = '2.1',
    heating_notes = 'Mitsubishi 2.5kW heat pump installed in living room. Exceeds minimum requirement for 18m2 living area in Climate Zone 2. Last serviced April 2025.',
    insulation_compliant = 1,
    ceiling_insulation_r_value = 'R3.6',
    underfloor_insulation_r_value = 'R1.3',
    ceiling_insulation_notes = 'Pink Batts R3.6 installed 2022. Uniform coverage, no gaps observed. Compliant with NZS 4218:2009.',
    underfloor_insulation_notes = 'Polyester underfloor R1.3 installed 2021. Secure foil-faced batts, no sagging. Compliant.',
    ventilation_compliant = 1,
    kitchen_extractor_fan = 1,
    bathroom_extractor_fan = 1,
    openable_windows_compliant = 1,
    ventilation_notes = 'Kitchen rangehood vents externally. Bathroom has 100mm inline fan. All habitable rooms have openable windows 5pct floor area.',
    moisture_compliant = 1,
    gutter_condition = 'good',
    subfloor_moisture_barrier = 1,
    moisture_notes = 'Polythene ground moisture barrier installed under floor. Gutters clear and functioning. No evidence of rising damp.',
    draught_compliant = 0,
    unused_fireplaces_blocked = 0,
    draught_notes = 'Unused fireplace in lounge not blocked. Gaps around window frames in bedroom 2 require sealing.',
    overall_compliant = 0,
    ai_summary = '14 Rata Street is substantially Healthy Homes compliant. Four of five standards are met. The single non-compliant item is Draught Stopping: the unused fireplace flue must be blocked and window frame gaps sealed. Estimated remediation cost: $180-$350.',
    status = 'completed'
  WHERE id = 2
`);
console.log("HH assessment updated for 14 Rata Street");

// 2. Check improvements table
const [tables] = await conn.query("SHOW TABLES LIKE 'improvements'");
if (tables.length === 0) {
  console.log("improvements table not found - skipping");
} else {
  await conn.query("DELETE FROM improvements WHERE property_id = 4");
  const rows = [
    [4,"kitchen","Kitchen Renovation - Benchtop & Splashback Upgrade","Replace laminate benchtop with engineered stone (Silestone Calacatta). Install subway tile splashback. Upgrade tapware to brushed brass. Repaint cabinetry in Resene Alabaster.","high",4800,7200,35,14,"recommended"],
    [4,"bathroom","Bathroom Refresh - Vanity & Tiling","Replace dated vanity unit with wall-hung 750mm unit. Re-tile shower in large-format 600x600 porcelain. Install frameless shower screen. New chrome tapware throughout.","high",3500,5500,25,16,"recommended"],
    [4,"flooring","Flooring - Replace Carpet with Hybrid Plank","Remove existing carpet in bedrooms and hallway. Install Godfrey Hirst Hybrid+ 6mm plank in Driftwood Oak. Provides warmth, durability, and allergen reduction.","medium",2800,4200,20,13,"recommended"],
    [4,"exterior","Exterior Paint & Fence Repair","Full exterior repaint in Resene Half Thorndon Cream with Resene Black trim. Repair and paint timber front fence. Power wash driveway and paths.","medium",3200,4800,15,20,"recommended"],
    [4,"interior","Interior Redecoration - Feature Walls & Lighting","Paint lounge feature wall in Resene Biscay (deep navy). Replace all light fittings with warm LED pendants and downlights. Install dimmer switches in living and master bedroom.","low",1200,2200,10,12,"recommended"],
    [4,"landscaping","Garden & Landscaping Tidy","Remove overgrown shrubs along boundary. Lay fresh bark mulch in garden beds. Reseed lawn bare patches. Plant low-maintenance natives (flax, pittosporum).","low",800,1500,8,11,"recommended"],
  ];
  for (const r of rows) {
    await conn.query(
      "INSERT INTO improvements (property_id,category,title,description,priority,estimated_cost_min,estimated_cost_max,potential_rent_uplift,roi_months,status) VALUES (?,?,?,?,?,?,?,?,?,?)",
      r
    );
  }
  console.log(rows.length + " improvements seeded for 14 Rata Street");
}

await conn.end();
console.log("Seed complete");
