# Inspect360 - Project TODO

## Database & Schema
- [x] Properties table (address, landlord, tenants, platform refs)
- [x] Tenants table (name, email, phone, property link)
- [x] Appointments table (scheduled date, type, platform source, sync status)
- [x] Inspections table (type, status, property, inspector, created/completed dates)
- [x] Inspection rooms table (name, order, inspection link)
- [x] Room items table (condition rating, notes, damage flag)
- [x] Photos table (url, storage key, room, type: standard/360, caption)
- [x] Maintenance items table (description, priority, room, inspection)
- [x] AI descriptions table (decor, condition, points_to_note, recommendations, room/inspection link)
- [x] Reports table (pdf url, sent status, sent at, recipients)
- [x] Remote submissions table (token, property, submitted photos/notes, status)
- [x] Integration configs table (platform, credentials, sync status, last synced)

## Server Routers
- [x] appointments router (list, sync, create, update)
- [x] inspections router (create, get, update, complete, list)
- [x] rooms router (create, update, reorder, delete)
- [x] photos router (upload, list, delete, set360)
- [x] voice router (transcribe audio via Whisper)
- [x] ai router (generate descriptions per room/inspection)
- [x] reports router (generate PDF, send email)
- [x] remote router (create token, submit, review)
- [x] integrations router (connect, sync, test connection)
- [x] properties router (list, create, update)

## UI - Design System & Shell
- [x] Premium color palette (FXD: cream/pink/yellow/black) (deep navy, warm white, gold accent)
- [x] Typography (Anton + Archivo Black + Inter + JetBrains Mono) (Inter + display font)
- [x] DashboardLayout with sidebar navigation
- [x] Mobile bottom navigation bar
- [x] Responsive breakpoints throughout
- [x] Loading skeletons and empty states

## UI - Dashboard
- [x] Appointment tiles grid with status badges
- [x] Upcoming / overdue / completed filters
- [x] Property search and filter
- [x] Sync status indicator per platform
- [x] Quick stats header (inspections due, overdue, completed this month)

## UI - Inspection Workflow
- [x] Inspection type selector modal (8 types with exact labels) (7 types with exact labels)
- [x] Room list sidebar with progress indicators
- [x] Room detail view with photo capture
- [x] Standard photo upload (camera + file)
- [x] Condition rating selector (Excellent / Good / Fair / Poor / N/A)
- [x] Maintenance notes with priority tagging
- [x] Damage logging with photo evidence
- [x] Voice-to-text button for notes (Whisper API)
- [x] Auto-save on every change

## UI - 360 Photo Viewer
- [x] Pannellum-based 360 viewer embedded per room
- [x] 360 photo upload and hotspot support
- [x] Toggle between standard and 360 view
- [x] Fullscreen mode

## UI - AI Agent
- [x] AI description trigger per room
- [x] Structured output: Decor, Condition, Points to Note, Recommendations
- [x] Streaming display of AI output
- [x] Edit/approve AI descriptions before finalising

## UI - Paired Comparison Report
- [x] Side-by-side view: previous vs current inspection
- [x] Room-by-room comparison with photo diff
- [x] Condition change highlights
- [x] Maintenance delta summary

## UI - Reports & PDF
- [x] Report preview page
- [x] PDF generation and download
- [x] Email delivery form (tenant + PM recipients)
- [x] Report history per property

## UI - Remote Inspection
- [ ] Remote submission link generator
- [ ] Public submission page (no auth required)
- [ ] Photo upload + notes form for tenants
- [ ] Review and import into inspection workflow

## UI - Integrations
- [ ] Integration settings page
- [ ] Palace connector (config + test)
- [ ] Console connector (config + test)
- [ ] PropertyTree connector (config + test)
- [ ] REST connector (generic webhook/API)
- [ ] Test/sandbox mode toggle
- [ ] Sync log viewer

## Phase 8 — FIXXXD Integration
- [ ] Upgrade AI analysis prompt to tribunal-ready language (10 sections, objective/measurable)
- [ ] Add photo annotation system (critical/attention/good/note pins with x/y positions)
- [ ] Add key register UI (keys received/returned with timestamps)
- [ ] Add digital signature capture for tenant/landlord/inspector
- [ ] Add annotation overlay to InspectionRoom photo viewer
- [ ] Upgrade AI router to use structured tribunal-ready prompt with image analysis
- [ ] Add annotations DB table and router
- [ ] Add key register DB table and router
- [ ] Add signatures DB table and router
- [ ] Add AI chat assistant panel (Fixx assistant)

## AI Engine Upgrade Notes
- [ ] Upgrade AI prompt to current best-practice structured output (JSON schema, sections)
- [ ] Keep Fixx character, tribunal-ready language, "AI can draft but cannot decide" philosophy
- [ ] Move all AI calls server-side (UPW policy — no API keys on frontend)
- [ ] Use latest model defaults via platform invokeLLM helper
- [ ] Add streaming support for AI descriptions
- [ ] Add Fixx chat assistant as server-side tRPC procedure
- [ ] Structured 10-section output: roomType, decor, flooring, wallsCeiling, fixturesFittings, lighting, conditionAssessment, damagesIssues, wearVsDamage, recommendations

## Palace API Integration (Real Connector)
- [ ] Palace API base: https://api.getpalace.com/v1 — Bearer token auth via PALACE_API_KEY secret
- [ ] GET /palace/properties — fetch and import properties from Palace
- [ ] GET /palace/properties/:id — fetch specific property details
- [ ] POST /palace/sync-inspection — push critical issues as maintenance requests + add property note
- [ ] POST /palace/import-property — import Palace property to create local property record
- [ ] POST /api/palace/webhook — receive Palace webhook events (property.updated, maintenance_request.created)
- [ ] Store PALACE_API_KEY as a user-provided secret via webdev_request_secrets
- [ ] Integrations page: show real sync status, last sync time, and property count from Palace

## Agentic Capabilities (Phase 9-10)

### Multi-Modal Vision Agent
- [ ] Agent receives ALL room photos + 360 images simultaneously after capture is complete
- [ ] Vision agent "sees" the full property in one pass — all rooms, all angles, all photos
- [ ] Insta360 and Huawei 360 camera support (equirectangular image format handling)
- [ ] Cross-room reasoning: agent identifies patterns across the whole property
- [ ] Structured JSON output: roomType, decor, flooring, wallsCeiling, fixtures, lighting, conditionAssessment, damages, wearVsDamage, recommendations
- [ ] Tribunal-ready language enforced: exact measurements, no subjective terms

### Autonomous Post-Inspection Workflow
- [ ] Triggered automatically when inspector marks inspection as complete
- [ ] Agent reviews all rooms and identifies critical/moderate issues
- [ ] Auto-creates Palace maintenance requests for critical issues (with property ID, priority, description)
- [ ] Auto-drafts tenant letter (formal NZ property management tone, lists findings, required actions)
- [ ] Auto-generates PDF report and stores in S3
- [ ] Queues everything in PM Review Queue — PM sees a single approval screen
- [ ] PM can approve, edit, or reject each item individually before sending
- [ ] Notification sent to PM when review queue has new items

### Fixx Tool-Using Conversational Agent
- [ ] Fixx has access to live database tools: listProperties, listInspections, getInspectionSummary, getMaintenanceItems, getOverdueInspections
- [ ] Fixx can answer: "Which properties are overdue for a routine?" with live data
- [ ] Fixx can answer: "Summarise all critical issues from last month"
- [ ] Fixx can draft letters and reports on request
- [ ] Fixx uses streaming responses with tool call display
- [ ] Fixx preserves its character: helpful, concise, professional, "AI can draft but cannot decide"

### Rental Appraisal Report Agent
- [ ] Agent analyses property condition from inspection data
- [ ] Pulls NZ market data (suburb median rents, vacancy rates, comparable properties)
- [ ] Sentiment analysis across inspection history (is the property improving or declining?)
- [ ] Generates draft rental appraisal with: current market range, recommended rent, condition premium/discount, comparable analysis
- [ ] Exportable as PDF with FXD branding

### 12-Month Proactive Maintenance Plan
- [ ] Agent analyses all inspection findings across property history
- [ ] Generates itemised maintenance plan for next 12 months
- [ ] Traffic light system:
  - GREEN: Good condition, can go another year, monitor only
  - ORANGE: Deteriorating, address within 3-6 months before it becomes expensive
  - RED: Needs immediate attention, stop-this-now urgency
- [ ] Each item includes: description, location, estimated cost bracket, recommended action, urgency timeline
- [ ] Plan exportable as PDF and syncable to Palace as maintenance schedule
- [ ] Visual timeline view showing when items are due

## Inventory & Chattels Sections

### Inventory Section (New Inventory inspection type)
- [ ] Dedicated inventory workflow triggered when inspection type = "New Inventory"
- [ ] Room-by-room inventory list: each item has name, description, quantity, condition (New/Good/Fair/Poor/Damaged), photo, serial number (optional)
- [ ] AI agent auto-generates inventory list from room photos — identifies and names every visible item
- [ ] Editable inventory table: PM can add, remove, edit items inline
- [ ] Inventory items categorised: Furniture, Appliances, Fixtures, Soft Furnishings, White Goods, Other
- [ ] Each item can have multiple photos attached
- [ ] Inventory report PDF: formatted table with photos, conditions, and quantities
- [ ] Inventory syncs to subsequent inspections for comparison (was item present? condition changed?)
- [ ] Missing items flagged automatically when comparing move-in vs move-out inventory

### Chattels Section (New Chattels inspection type)
- [ ] Dedicated chattels register — permanent record of all items included with the property
- [ ] Chattels are property-level (not inspection-level) — they persist across all inspections
- [ ] Each chattel: name, make/model, serial number, purchase date, estimated value, condition at registration, photo
- [ ] Categories: White Goods, Heating/Cooling, Floor Coverings, Window Treatments, Outdoor Equipment, Other
- [ ] AI agent identifies chattels from photos and pre-fills the register
- [ ] Chattels condition tracked at each inspection — agent flags if a chattel has deteriorated
- [ ] Chattels report PDF: schedule of chattels with current condition and depreciation notes
- [ ] Move-out comparison: chattel condition at move-in vs move-out, agent calculates fair wear vs damage
- [ ] Chattels register exportable to Palace as property asset list

### Cross-Feature Integration
- [ ] Inventory and chattels data feeds into the AI rental appraisal (furnished vs unfurnished premium)
- [ ] Chattels condition feeds into the 12-month maintenance plan (e.g. "dishwasher — 8 years old, fair condition — ORANGE")
- [ ] Move-out inspection auto-compares against move-in inventory and chattels register
- [ ] Paired comparison report includes inventory delta (items added, removed, damaged)

## CORRECTED Definitions — Inventory vs Chattels

### Inventory = Furnished Tenancy Items
Inventory applies ONLY to furnished tenancies. These are the moveable appliances and tools provided by the landlord as part of the furnished letting:
- Whiteware: fridge, washing machine, dryer, dishwasher
- Furniture: beds, sofas, tables, chairs, wardrobes
- Small appliances: microwave, toaster, kettle, vacuum cleaner
- Tools/equipment: lawnmower, garden tools, hose
- Soft furnishings: curtains (if not fixed), rugs, cushions
- Electronics: TV, sound system (if provided)
Inventory is inspection-level — documented at move-in, checked at move-out, compared for missing/damaged items.

### Chattels = Fixed/Permanent Property Items (ALL tenancies)
Chattels are the fixed or semi-fixed items that are always part of the property regardless of furnished/unfurnished status:
- Kitchen: oven, cooktop/range, range hood, dishwasher (if built-in)
- Heating/cooling: heat pump(s), HRV/DVS systems, wood burner
- Ventilation: extractor fans (kitchen, bathroom)
- Floor coverings: carpet, vinyl, tiles (fixed floor surfaces)
- Window treatments: blinds, curtains on fixed tracks, shutters
- Hot water system: cylinder type, age, capacity
- Garage door openers, clotheslines, letterboxes
- Any item that is part of the building or fixed to it
Chattels are property-level — registered once, checked at EVERY inspection, condition tracked over time.

### UI/UX Implications
- [ ] Inventory tab only appears/is enabled when tenancy type = "Furnished"
- [ ] Chattels register is always present on every property
- [ ] Chattels are pre-populated from a standard NZ property template when a new property is created
- [ ] AI agent auto-identifies chattels from photos and flags any that are missing or damaged
- [ ] Move-out inspection: inventory items compared against move-in list; chattels condition compared against last inspection
- [ ] Chattels condition feeds directly into Healthy Homes compliance (heat pump, extractor fans, floor coverings)

## Fixx Knowledge Base (Phase 9)
- [ ] Scrape tenancy.govt.nz: Healthy Homes Standards (all 5 categories)
- [ ] Scrape tenancy.govt.nz: Maintenance & Inspections section
- [ ] Scrape tenancy.govt.nz: Starting a tenancy (bonds, agreements)
- [ ] Scrape tenancy.govt.nz: Ending a tenancy (vacate, notice periods)
- [ ] Scrape tenancy.govt.nz: Disputes and Tribunal process
- [ ] Scrape tenancy.govt.nz: Rent, bonds & bills
- [ ] Structure all scraped content into a knowledge base file
- [ ] Embed knowledge base into Fixx system prompt as grounded context
- [ ] Add citation links so Fixx can reference official sources
- [ ] Build knowledge base router endpoint for Fixx to query

## Healthy Homes Compliance Engine (Phase 10)
- [ ] Agentic compliance assessment logic — 5 standards checked programmatically
- [ ] Report 1: HH Assessment Report (detailed checks, findings, evidence, remediation notes per standard)
- [ ] Report 2: HH Compliance Certificate (formal certificate, pass/fail per standard, overall status, penalty risk)
- [ ] Compliance checklist UI — inspector works through each standard with photo evidence capture
- [ ] Heating: capacity calculator (kW formula, climate zone lookup, room size input, heater type validation)
- [ ] Insulation: R-value checker (climate zone, ceiling/underfloor values, condition, exemptions)
- [ ] Ventilation: openable windows % checker, extractor fan spec validator (150mm/50L/s kitchen, 120mm/25L/s bathroom)
- [ ] Moisture & drainage: subfloor, gutters, drainage, moisture barriers, ground cover checker
- [ ] Draught stopping: gaps, unsealed openings, chimney, windows/doors checker
- [ ] Compliance status per standard: COMPLIANT / NON-COMPLIANT / EXEMPT / NEEDS-ASSESSMENT
- [ ] Overall compliance status with penalty risk flag (up to $7,200 per standard)
- [ ] Exemption recording with required documentation notes
- [ ] Agent auto-generates compliance narrative from inspection evidence and photos
- [ ] Compliance Certificate PDF: property details, landlord, date, assessor name/signature, standard-by-standard result
- [ ] Assessment Report PDF: detailed findings, evidence photos, remediation recommendations, cost estimates
- [ ] Compliance history per property (track compliance status over time)
- [ ] Compliance data feeds into Fixx knowledge agent for PM queries

## CORRECTED: Two Healthy Homes Report Definitions

### Report 1 — Healthy Homes Assessment Report (Working Document)
- The inspector's checking and measuring document
- Records every measurement, observation, and finding for each of the 5 standards
- Includes: room dimensions, heater kW, insulation R-values, window areas, fan specs, drainage observations
- Includes photo evidence for each item checked
- Includes remediation notes where non-compliant
- Internal document — used by PM and landlord to understand what needs fixing
- NOT the legal compliance document — this is the evidence base

### Report 2 — Healthy Homes Compliance Statement (Formal Legal Document)
- The PM's formal written promise of compliance given to the tenant
- Required by law to be attached to all new or renewed tenancy agreements (RTA s13A)
- PM signs this document — it is a legal declaration
- States: which standards the property complies with, which are exempt and why, any that are not yet compliant with a date by which they will be
- Tenant receives this document — it is their legal protection
- Must include: property address, landlord/PM name, date, signature, compliance status per standard
- Penalty for false compliance statement: up to $7,200 per standard

### Key Design Implications
- [ ] Report 1 is generated by the AI agent from inspection data — detailed, evidence-rich, working document
- [ ] Report 2 is a formal legal certificate — PM reviews, confirms, and digitally signs before it is issued
- [ ] Report 2 CANNOT be auto-sent — it requires PM review and explicit sign-off (not just approval)
- [ ] Report 2 should have a clear "I confirm this is accurate and I am signing this as a legal declaration" step
- [ ] Both reports are generated from the same underlying assessment data
- [ ] Report 2 PDF must look formal and professional — not a working document format

## MagicPlan Integration (Room Measurement)
- [ ] MagicPlan REST API connector — API Key + Customer ID via webdev_request_secrets
- [ ] Deep linking: launch MagicPlan app from Inspect360 room view (pre-fills project/room name)
- [ ] Webhook receiver: MagicPlan pushes completed floor plan data back to Inspect360
- [ ] Parse Plan Exchange XML: extract room name, floor area (m²), ceiling height, wall lengths, window/door dimensions
- [ ] Auto-populate Healthy Homes compliance fields from MagicPlan data:
  - Room floor area → heating capacity calculation
  - Ceiling height → heating capacity calculation
  - Window dimensions → ventilation 5% floor area check
  - Door/window openings → draught stopping assessment
- [ ] Store MagicPlan project ID against each inspection room
- [ ] Display embedded floor plan view in room detail (MagicPlan 3D embed)
- [ ] Manual measurement fallback: inspector can enter dimensions manually if MagicPlan not used
- [ ] MagicPlan integration settings page: connect account, test connection, view linked projects

## Vision Agent Capability Matrix — Healthy Homes Standards

### What the 360/Vision Agent CAN assess visually:

VENTILATION STANDARD (visual):
- [ ] Presence of openable windows in each room (agent sees windows in 360 photo)
- [ ] Whether windows appear to have functioning latches/handles (agent flags missing/broken latches)
- [ ] Broken or cracked window glass (agent flags as non-compliant + safety issue)
- [ ] Presence of range hood above cooktop (agent sees it in kitchen 360 photo)
- [ ] Presence of extractor fan in bathroom/toilet (agent sees fan unit on ceiling/wall)
- [ ] NOTE: Agent CANNOT confirm if fan/range hood vents externally — inspector must confirm this manually
- [ ] Inspector prompted: "Does the range hood vent to outside? (Yes / No / Unknown — needs tradesperson check)"

MOISTURE & DRAINAGE (visual — exterior photos):
- [ ] Gutters present and visible condition (sagging, overflow staining, debris visible)
- [ ] Downpipes present and connected (agent sees from exterior photos)
- [ ] Surface drainage away from building (agent assesses from exterior/ground photos)
- [ ] Visible moisture staining on walls/ceilings (agent flags in interior photos)
- [ ] Mould visible on walls, ceilings, window frames (agent flags as critical)
- [ ] NOTE: Subfloor moisture barrier — agent CANNOT see this; inspector must confirm manually

DRAUGHT STOPPING (visual):
- [ ] Visible gaps around windows and door frames (agent sees in close-up photos)
- [ ] Unsealed pipe/cable penetrations through walls (agent flags if visible)
- [ ] Fireplace/chimney present (agent sees it; inspector confirms if sealed)
- [ ] NOTE: Agent flags what it can see; inspector confirms sealing status

HEATING STANDARD:
- [ ] Heat pump unit present and visible (agent identifies make/model from chattels register)
- [ ] Electric heater visible (agent identifies type)
- [ ] NOTE: Capacity (kW) comes from chattels register + MagicPlan room dimensions — NOT visual
- [ ] NOTE: Heating capacity calculation requires: room m², ceiling height, climate zone, heater kW rating

INSULATION STANDARD — CANNOT BE VISUALLY ASSESSED:
- [ ] Agent CANNOT see ceiling/underfloor insulation from standard or 360 photos
- [ ] Inspector must enter: ceiling insulation R-value, underfloor R-value, condition, installation date
- [ ] OR: Inspector selects exemption reason (concrete slab, impracticable access, etc.)
- [ ] Insulation assessment is the ONE standard that requires manual data entry — no visual shortcut
- [ ] App prompts inspector clearly: "Insulation cannot be assessed from photos — please check ceiling/subfloor space"

### Agent Confidence Levels:
- HIGH confidence: windows present/absent, fan unit present/absent, mould/moisture staining, gutter condition
- MEDIUM confidence: window latch condition, gap visibility, range hood presence
- LOW/CANNOT: external venting confirmation, insulation R-values, subfloor moisture barrier
- Agent must always state its confidence level and flag items requiring manual confirmation

## Agent Improvement Recommendations (New Section/Tab)

### Overview
A separate tab on the inspection report and property profile — distinct from compliance and condition.
This is the "value uplift" advisor: the agent looks at the property through the lens of a savvy interior
designer and property investor, not just an inspector. Two tiers of recommendation.

### Tier 1 — Cosmetic Refresh (Low Cost, Quick Wins)
Agent analyses decor style, age, and condition from room photos and recommends small changes
that improve appeal and justify a rent increase. Examples:
- [ ] Decor era detection: agent identifies style period (e.g. "early 2000s, painted feature wall in terracotta")
- [ ] Specific cosmetic recommendations: paint colours, curtain length/style, lighting upgrades, hardware changes
- [ ] Tone: warm, encouraging, specific — like advice from a good interior designer friend
- [ ] Each recommendation includes: what to change, why it matters, approximate cost, estimated rent uplift ($pw)
- [ ] Example output: "Replace the short-length curtains in the lounge with full-length linen drapes in warm white
  or sage. Cost approx $300–600. This single change modernises the room significantly and supports a
  $10–20/week rent increase based on current market expectations for this suburb."
- [ ] Aggregate uplift summary: "Total cosmetic refresh cost: ~$1,200–2,500. Estimated rent uplift: $30–50/week.
  Payback period: 6–10 weeks."

### Tier 2 — Renovation & Capital Improvement (Higher Investment, Larger Uplift)
Agent identifies structural or layout opportunities for significant value improvement. Examples:
- [ ] Renovation opportunity detection: outdated bathroom, kitchen, no outdoor living, single bathroom, etc.
- [ ] Specific project recommendations: deck addition, bathroom upgrade, kitchen refresh, heat pump addition,
  double glazing, landscaping
- [ ] Each project includes: description, estimated cost range, estimated rent uplift, estimated capital value uplift,
  payback period, priority rating
- [ ] Example output: "Adding a deck off the lounge would significantly improve the liveability and outdoor appeal
  of this property. Estimated cost: $8,000–15,000. Estimated rent uplift: $40–60/week. Capital value uplift:
  $25,000–40,000. This is a high-priority recommendation for this suburb and price bracket."
- [ ] Renovation recommendations are ranked by ROI (rent uplift per dollar invested)

### Data Sources for Recommendations
- [ ] Agent uses: room photos (visual analysis), suburb from property record, current rent from property record
- [ ] Agent cross-references: NZ market data for the suburb (median rents, what features command premiums)
- [ ] Agent uses: inspection history (has this been recommended before? has it been actioned?)
- [ ] Agent tone: specific, confident, commercially minded — not generic or vague

### Report Integration
- [ ] Improvement Recommendations tab appears on: property profile, inspection report, rental appraisal
- [ ] Exportable as a standalone "Property Improvement Report" PDF — designed for landlord conversations
- [ ] PM can edit/approve recommendations before sharing with landlord
- [ ] Recommendations can be converted into maintenance plan items or tracked as "pending projects"
- [ ] Historical tracking: when a recommendation is actioned, agent notes the improvement in future inspections

### Design Notes
- [ ] Visual layout: two columns — Tier 1 (Cosmetic) and Tier 2 (Renovation)
- [ ] Each recommendation card: photo evidence, recommendation text, cost range, uplift estimate, ROI badge
- [ ] Aggregate summary at top: total investment range, total estimated uplift, overall ROI
- [ ] FXD brand: this section should feel aspirational and exciting — not clinical

## Agent Output Philosophy — Full Spectrum

The agent gives EVERYTHING. Not a summary. Not a filtered subset. Every observation, every
recommendation, every concern, every opportunity. The landlord is paying for the smartest
property assessor they will ever have access to — they deserve the full picture.

### What "Full Spectrum" Means in Practice:

CONDITION — every room, every surface, every item:
- [ ] Exact condition of every wall, ceiling, floor, window, door, fixture in every room
- [ ] Specific measurements and observations (not "some wear" but "approximately 15cm scuff mark
  at skirting board height, consistent with furniture movement, fair wear")
- [ ] Maintenance items ranked by urgency and estimated cost
- [ ] Damage vs fair wear assessment for every item

DECOR & STYLE — full interior design assessment:
- [ ] Era identification for every room ("this kitchen is a mid-2000s renovation")
- [ ] What works and what doesn't, specifically
- [ ] Colour palette assessment (does it work? what would work better?)
- [ ] Lighting assessment (too dark? wrong temperature? missing task lighting?)
- [ ] Furniture layout (if furnished — does the layout work for the space?)
- [ ] Textiles and soft furnishings (curtain length, fabric, colour — all assessed)
- [ ] Hardware details (door handles, tapware, light switches — often the cheapest upgrade)

COSMETIC RECOMMENDATIONS — specific, costed, with uplift estimates:
- [ ] Every cosmetic change the agent would recommend, ranked by ROI
- [ ] Specific product/colour recommendations where possible (not "repaint" but "Resene Merino or
  Dulux Natural White — warm whites that photograph well and appeal to a broad tenant market")
- [ ] Cost ranges based on NZ market rates
- [ ] Estimated rent uplift per recommendation

RENOVATION OPPORTUNITIES — every project worth considering:
- [ ] Every structural or capital improvement the agent identifies
- [ ] Not just the obvious ones — the agent thinks about: flow, liveability, outdoor connection,
  storage, natural light, insulation, double glazing, bathroom count, kitchen functionality
- [ ] Each project: description, why it matters for this property and suburb, cost range,
  rent uplift, capital value uplift, payback period, ROI ranking
- [ ] Prioritised list: what to do first, second, third

MARKET POSITIONING — where this property sits and where it could sit:
- [ ] Current market position (bottom/mid/top of its bracket in this suburb)
- [ ] What it would take to move it up a bracket
- [ ] Comparable properties and what they achieve
- [ ] Seasonal timing recommendations (best time to re-let, best time to renovate)

TENANT APPEAL ASSESSMENT:
- [ ] Who is the ideal tenant for this property in its current state?
- [ ] Who would it appeal to after recommended improvements?
- [ ] What features are most likely to attract quality long-term tenants?
- [ ] What features might be deterring good tenants right now?

### Tone and Voice:
- Confident, specific, commercially minded
- Warm but direct — like the best property advisor you've ever had
- No hedging, no "you might want to consider" — "do this, here's why, here's the return"
- Honest about problems — doesn't soften bad news, but frames it constructively
- Excited about opportunities — the agent genuinely cares about this property's potential
- Cites evidence from the photos — "I can see from the kitchen photo that..."

## MagicPlan Floor Plan Output — Uses in Inspect360

MagicPlan produces a complete floor plan from the room scan. This unlocks several features:

### Floor Plan Display
- [ ] Embed interactive floor plan in property profile (MagicPlan 3D embed via iframe)
- [ ] Display 2D floor plan on inspection report cover page
- [ ] Floor plan stored in S3 as PNG/PDF export from MagicPlan API
- [ ] Floor plan included in PDF reports (Assessment Report, Compliance Certificate, Rental Appraisal)

### Floor Plan Data Used For
- [ ] Room dimensions auto-extracted → Healthy Homes heating/ventilation calculations
- [ ] Total floor area calculated → used in rental appraisal ($/m² comparison)
- [ ] Room count and layout → used in improvement recommendations ("no ensuite in master")
- [ ] Window positions and sizes → ventilation compliance check
- [ ] Door positions → draught stopping assessment
- [ ] Outdoor areas → improvement recommendations ("north-facing rear yard — deck opportunity")

### Floor Plan in Reports
- [ ] Inspection report: floor plan on cover page with room labels and condition colour coding
  (green = good, orange = attention needed, red = critical issue)
- [ ] Healthy Homes report: floor plan annotated with compliance status per room/area
- [ ] Improvement recommendations: floor plan showing where recommended changes apply
- [ ] Rental appraisal: floor plan with total m² and room breakdown

### First-Time vs Repeat Inspections
- [ ] Floor plan is created ONCE (first inspection) and stored against the property
- [ ] Subsequent inspections reuse the existing floor plan — no need to re-scan
- [ ] Inspector can trigger a re-scan if the property has been renovated or layout has changed
- [ ] Floor plan version history stored — shows layout changes over time

## Agent-Guided Workflow — Core Design Principle

The agent doesn't produce output and wait. It guides, prompts, and takes over.
PMs are not technical. Most won't know what to do with a compliance report.
The agent's job is to make every step obvious and to do as much as possible autonomously.

### The Guided Workflow Model

Every major workflow has three modes:
1. AGENT DOES IT — fully autonomous, no PM input needed (e.g. post-inspection report draft)
2. AGENT GUIDES — step-by-step prompts, PM answers simple questions (e.g. insulation check)
3. AGENT ASSISTS — PM does the action, agent provides real-time help (e.g. MagicPlan scan)

### Specific Agent Guidance Flows to Build

FIRST INSPECTION SETUP:
- [ ] Agent detects it's the first inspection for this property
- [ ] Agent says: "This is the first inspection for this property. I'll guide you through a one-time
  setup that will make every future inspection faster. It takes about 20 minutes."
- [ ] Step 1: Agent guides MagicPlan scan ("Open MagicPlan, tap New Project, name it [address].
  Stand in the corner of the lounge and follow the on-screen arrows.")
- [ ] Step 2: Agent guides chattels register ("Walk through each room and photograph the oven,
  range hood, heat pump, and any other fixed appliances. I'll identify them from the photos.")
- [ ] Step 3: Agent auto-populates chattels from photos, PM confirms
- [ ] Step 4: Agent asks 3 insulation questions ("Is there ceiling insulation? Approximately how old?
  Can you see it from the ceiling hatch?")
- [ ] After setup: "You're done. Every future inspection for this property will be significantly faster."

HEALTHY HOMES ASSESSMENT GUIDANCE:
- [ ] Agent walks PM through each standard one at a time
- [ ] For each standard: explains what it is in plain English, shows what to look for, asks
  targeted questions, takes over the calculation
- [ ] Agent never shows the PM a compliance formula — it does the maths and shows the result
- [ ] For external venting check: "I can see the range hood is present. Can you confirm it vents
  to outside? (Tap Yes / No / I'm not sure — I'll flag this for a tradesperson check)"
- [ ] Agent handles the "I'm not sure" case gracefully — flags it, suggests action, doesn't block progress

POST-INSPECTION AUTONOMOUS WORKFLOW:
- [ ] When PM marks inspection complete, agent says: "I'm running the post-inspection analysis.
  This takes about 2 minutes. I'll notify you when the draft report is ready for your review."
- [ ] Agent runs: room analysis, maintenance request creation, tenant letter draft, PDF generation
- [ ] PM receives: "Your inspection report is ready. I've identified 3 maintenance items and drafted
  a letter to the tenant. Review and approve below — or edit anything before sending."
- [ ] PM sees: approve all / review each item / edit
- [ ] One tap: everything goes — Palace maintenance requests created, tenant letter sent, PDF emailed

IMPROVEMENT RECOMMENDATIONS GUIDANCE:
- [ ] After generating recommendations, agent says: "I've found 2 quick wins and 1 major opportunity
  for this property. Want me to draft a summary for your next landlord conversation?"
- [ ] Agent drafts the landlord email/letter — PM reviews and sends
- [ ] Agent can schedule a follow-up reminder: "Remind me to discuss the deck recommendation with
  the landlord at the next review in 3 months"

FIXX CHAT — PROACTIVE GUIDANCE:
- [ ] Fixx doesn't just answer questions — it proactively surfaces things the PM should know
- [ ] "3 of your properties are due for a Healthy Homes compliance review before 1 July."
- [ ] "The bathroom at 14 Rata Street has had moisture issues flagged in 3 consecutive inspections.
  This is now a pattern — I'd recommend a plumber assessment."
- [ ] "Your landlord at 22 Oak Ave hasn't had an improvement conversation in 18 months. I've
  prepared a brief based on the last inspection — want to review it?"

### The PM Experience Goal:
The PM should feel like they have a brilliant, proactive colleague who handles the complex stuff,
keeps them informed, and only asks for their input when it genuinely matters.
They should never feel lost, overwhelmed, or unsure what to do next.
The agent always has a next step ready. The agent always explains why.
The agent never makes the PM feel stupid for not knowing something.

## Measurement Variance & Credibility Handling

- [ ] Add "measurement confidence" field to all Healthy Homes numeric inputs (heating kW, insulation R-value, window area)
- [ ] Show ± tolerance range on all measurements (e.g. "7.1 kW ± 0.3 kW" based on instrument precision)
- [ ] Add "Previous Report Reference" field — inspector can enter the figure from an existing HH report for comparison
- [ ] When variance between Inspect360 result and previous report is within 5%, show "Within acceptable tolerance — results are consistent"
- [ ] When variance exceeds 5%, show "Variance noted — see methodology note" with explanation of why results may differ (measurement point, rounding, climate zone interpretation)
- [ ] Add methodology transparency section to Assessment Report explaining measurement approach and acceptable variance ranges
- [ ] Add "Instrument / Method Used" field for each measurement (e.g. "MagicPlan LiDAR scan", "Tape measure", "Manufacturer spec sheet", "Previous HH report")
- [ ] Fixx knowledge base: include NZ HH variance guidance and how Tenancy Tribunal treats minor discrepancies
- [ ] Assessment Report disclaimer: "Minor measurement variances between assessors are normal and expected. Results within ±5% are considered consistent with NZ Healthy Homes Standards measurement guidance."

## Inventory Shopping List

- [ ] Add quantity tracking to inventory items: quantityPresent (number), quantityRequired (number)
- [ ] When quantityPresent < quantityRequired, item auto-appears on the Shopping List
- [ ] Shopping list tab/panel on Inventory page showing all items with shortfall
- [ ] Shopping list shows: item name, required qty, present qty, missing qty, estimated cost per unit
- [ ] "Mark as Purchased" action on shopping list items — updates quantityPresent
- [ ] Shopping list exportable as PDF or shareable link for landlord/PM
- [ ] Example: "Dinner forks: 4 required, 3 present → 1 x dinner fork on list"
- [ ] Add migration for quantity fields on inventory_items table

## Individual Report Approval Workflow

Each report type requires its own explicit PM/LL approval before it can be sent or issued.
The PM Review Queue is expanded to handle all 6 report types as separate approval items.

Report types requiring individual approval:
- [ ] Inspection Report — AI drafts, PM reviews full report, approves before PDF is sent to tenant
- [ ] Chattels Register — AI pre-fills from photos, PM/LL reviews each item, approves register before it becomes the official record
- [ ] Inventory Schedule — AI generates from room photos, PM/LL reviews item by item, approves before it is attached to tenancy agreement
- [ ] Rental Appraisal — AI drafts with market data, PM reviews recommended rent and narrative, approves before sharing with LL
- [ ] Improvement Recommendations — AI generates Tier 1 and Tier 2 recommendations, PM reviews, approves before sharing with LL
- [ ] Healthy Homes Assessment Report — AI drafts findings, PM reviews measurements and compliance status, approves before issuing
- [ ] Healthy Homes Compliance Statement — Separate from Assessment Report — PM must explicitly sign (not just approve) before this can be issued to tenant

PM Review Queue UI changes:
- [ ] Group queue items by report type with clear section headers
- [ ] Each report type shows: draft content, key figures, photos attached, any agent flags
- [ ] "Approve & Send" button is specific to each report type (e.g. "Approve & Email to Tenant", "Approve & Share with Landlord", "Sign & Issue to Tenant")
- [ ] Compliance Statement approval has a distinct sign-off UI — PM reads the legal declaration text and signs digitally
- [ ] PM can edit any section of a draft before approving
- [ ] Rejected items return to the agent with PM notes — agent can redraft
- [ ] Audit trail: every approval/rejection is timestamped and attributed to the PM user
- [ ] LL can be given read-only access to approved reports (future feature — flag for now)

## Continuous Compliance Monitoring (Critical Feature)

The problem: hundreds of thousands of NZ rentals have "compliant" reports from 3-5 years ago when:
- The rules were vague and assessors were inconsistent
- Standards have since been clarified or tightened
- Physical items have deteriorated (heat pump efficiency drops, insulation compresses, fans fail)
- The original assessment may have been done poorly

The solution: every routine inspection includes an automatic Healthy Homes compliance check as a background agent task. Not a full formal assessment — a lightweight visual + data check that flags any drift from compliance.

- [ ] Add "Compliance Health" widget to Dashboard showing compliance status across all properties
- [ ] Run automatic compliance drift check on every routine inspection (agent checks 360 photos for visual indicators)
- [ ] Flag when: heat pump age exceeds 10 years (efficiency likely below rated), extractor fan not visible/present, window latches broken, draught gaps visible
- [ ] "Compliance Age" indicator per property — shows how long since last formal assessment
- [ ] Proactive Fixx alert: "14 Rata Street last had a Healthy Homes assessment 3 years ago. Standards have been clarified since then. I recommend scheduling a fresh assessment."
- [ ] Compliance trend view: shows compliance status over time per property and per standard
- [ ] Portfolio compliance summary: PM can see at a glance which properties are at risk
- [ ] Owner peace-of-mind report: quarterly summary for landlords showing compliance status, any drift flagged, and recommended actions
- [ ] Fixx knowledge base note: "A compliance statement signed 3 years ago does not protect a landlord if the property has since fallen out of compliance. Compliance is ongoing, not a one-time event."

## Disclaimer Architecture (Risk Mitigation)

- [ ] Global app disclaimer — shown on first login and accessible from footer at all times
- [ ] AI output disclaimer — appended to every AI-generated section in every report
- [ ] Healthy Homes compliance disclaimer — shown prominently before any compliance assessment is started, and on every compliance report
- [ ] Compliance Statement disclaimer — shown immediately before PM signs, with full legal declaration text
- [ ] Rental appraisal disclaimer — shown on every appraisal report
- [ ] Improvement recommendations disclaimer — shown on every recommendations report
- [ ] Fixx chat disclaimer — shown at the top of every Fixx conversation
- [ ] All disclaimers must be stored in a single shared constants file for easy legal review and updating

## Pitch Demo (Standalone HTML)
- [ ] Standalone interactive HTML file — no server, no dependencies, opens in any browser
- [ ] Full FXD design system applied — cream/pink/yellow/black, Anton headings, dotted texture
- [ ] Interactive screens: Dashboard, Inspection Type Selector, Room Inspection, AI Analysis output, Healthy Homes, Improvement Recommendations, Fixx Chat
- [ ] Clickable navigation between screens with smooth transitions
- [ ] Sample data pre-loaded (demo property, demo inspection, demo AI output)
- [ ] Designed for presentation — large text, clear hierarchy, impressive visual impact
- [ ] Exportable as a single .html file for email/USB distribution

## Transferable Self-Hosted Build
- [ ] Production build (pnpm build)
- [ ] Dockerfile (Node 22, multi-stage, production-optimised)
- [ ] docker-compose.yml (app + MySQL + optional reverse proxy)
- [ ] .env.example with all required variables documented
- [ ] Deployment guide (DEPLOYMENT.md) covering VPS, Docker, Nginx, SSL
- [ ] Database migration script for fresh installs
- [ ] Health check endpoint
- [ ] Exportable ZIP package
- [ ] Standalone pitch demo HTML file
