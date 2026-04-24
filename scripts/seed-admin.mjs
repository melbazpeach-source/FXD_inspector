import mysql from 'mysql2/promise';

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// ── Provider Settings ──────────────────────────────────────────────────────────
const providers = [
  // LLM
  { category: 'llm', provider: 'builtin',   isActive: 1, config: JSON.stringify({ label: 'Manus Built-in', description: 'Default — no key needed' }) },
  { category: 'llm', provider: 'openai',    isActive: 0, config: JSON.stringify({ label: 'OpenAI', models: 'gpt-4o, gpt-4-turbo, gpt-3.5-turbo' }) },
  { category: 'llm', provider: 'anthropic', isActive: 0, config: JSON.stringify({ label: 'Anthropic', models: 'claude-3-5-sonnet, claude-3-opus' }) },
  { category: 'llm', provider: 'gemini',    isActive: 0, config: JSON.stringify({ label: 'Google Gemini', models: 'gemini-1.5-pro, gemini-flash' }) },
  { category: 'llm', provider: 'grok',      isActive: 0, config: JSON.stringify({ label: 'Grok (xAI)', models: 'grok-2, grok-beta' }) },
  { category: 'llm', provider: 'qwen',      isActive: 0, config: JSON.stringify({ label: 'Qwen (Alibaba)', models: 'qwen-max, qwen-plus' }) },
  { category: 'llm', provider: 'kimi',      isActive: 0, config: JSON.stringify({ label: 'Kimi (Moonshot AI)', models: 'moonshot-v1-128k' }) },
  { category: 'llm', provider: 'minimax',   isActive: 0, config: JSON.stringify({ label: 'MiniMax', models: 'abab6.5s-chat' }) },
  // Voice / STT
  { category: 'voice', provider: 'whisper',     isActive: 1, config: JSON.stringify({ label: 'Whisper (Built-in)', description: 'No key needed' }) },
  { category: 'voice', provider: 'deepgram',    isActive: 0, config: JSON.stringify({ label: 'Deepgram Nova-2', description: 'Fast, NZ English optimised' }) },
  { category: 'voice', provider: 'assemblyai',  isActive: 0, config: JSON.stringify({ label: 'AssemblyAI', description: 'Strong NZ/AU English' }) },
  { category: 'voice', provider: 'google_stt',  isActive: 0, config: JSON.stringify({ label: 'Google Speech-to-Text', description: 'Broad language support' }) },
  // OCR
  { category: 'ocr', provider: 'builtin_vision', isActive: 1, config: JSON.stringify({ label: 'Manus Vision (Built-in)', description: 'Multimodal LLM OCR — no key needed' }) },
  { category: 'ocr', provider: 'google_vision',  isActive: 0, config: JSON.stringify({ label: 'Google Vision API', description: 'High accuracy document OCR' }) },
  { category: 'ocr', provider: 'aws_textract',   isActive: 0, config: JSON.stringify({ label: 'AWS Textract', description: 'Structured document extraction' }) },
  { category: 'ocr', provider: 'azure_di',       isActive: 0, config: JSON.stringify({ label: 'Azure Document Intelligence', description: 'Form & table extraction' }) },
  // Floor Plans
  { category: 'floor_plans', provider: 'magicplan',     isActive: 1, config: JSON.stringify({ label: 'MagicPlan', description: 'Scan rooms with phone camera' }) },
  { category: 'floor_plans', provider: 'roomsketcher',  isActive: 0, config: JSON.stringify({ label: 'RoomSketcher', description: 'Professional floor plan tool' }) },
];

for (const p of providers) {
  await conn.execute(
    `INSERT IGNORE INTO provider_settings (category, provider, is_active, config, test_status) VALUES (?, ?, ?, ?, 'untested')`,
    [p.category, p.provider, p.isActive, p.config]
  );
}
console.log('✓ Provider settings seeded');

// ── Skills Library ─────────────────────────────────────────────────────────────
const skills = [
  { id: 'read_inspection_history', name: 'Read Inspection History', category: 'data', description: 'Access all past inspection records for a property' },
  { id: 'read_chattels', name: 'Read Chattels Register', category: 'data', description: 'Access the fixed items register for a property' },
  { id: 'read_healthy_homes', name: 'Read Healthy Homes Data', category: 'data', description: 'Access Healthy Homes compliance assessments' },
  { id: 'read_maintenance_plan', name: 'Read Maintenance Plan', category: 'data', description: 'Access the 12-month maintenance schedule' },
  { id: 'read_tenancy', name: 'Read Tenancy Details', category: 'data', description: 'Access tenant and lease information' },
  { id: 'write_inspection_notes', name: 'Write Inspection Notes', category: 'write', description: 'Create and update inspection room notes' },
  { id: 'draft_letters', name: 'Draft Letters & Notices', category: 'write', description: 'Generate tenant notices, maintenance requests, compliance letters' },
  { id: 'draft_reports', name: 'Draft Inspection Reports', category: 'write', description: 'Compile and format inspection reports for owners' },
  { id: 'push_to_palace', name: 'Push to Palace', category: 'integration', description: 'Create maintenance requests and sync data to Palace' },
  { id: 'push_to_console', name: 'Push to Console Cloud', category: 'integration', description: 'Sync inspection data to Console Cloud' },
  { id: 'push_to_propertytree', name: 'Push to PropertyTree', category: 'integration', description: 'Sync data to PropertyTree' },
  { id: 'send_email', name: 'Send Email', category: 'integration', description: 'Send emails to tenants, owners, and contractors' },
  { id: 'ocr_documents', name: 'OCR Documents', category: 'ai', description: 'Extract text and data from photos and PDFs' },
  { id: 'analyse_photos', name: 'Analyse Photos', category: 'ai', description: 'Use vision AI to assess condition from inspection photos' },
  { id: 'generate_floor_plan', name: 'Generate Floor Plan', category: 'ai', description: 'Create floor plans from room scans' },
  { id: 'voice_transcription', name: 'Voice Transcription', category: 'ai', description: 'Transcribe voice notes during inspections' },
  { id: 'cost_estimation', name: 'Cost Estimation', category: 'ai', description: 'Estimate repair and improvement costs' },
  { id: 'compliance_check', name: 'Compliance Check', category: 'ai', description: 'Check Healthy Homes and RTA compliance status' },
];

for (const s of skills) {
  await conn.execute(
    `INSERT IGNORE INTO skills (id, name, description, category, is_built_in) VALUES (?, ?, ?, ?, 1)`,
    [s.id, s.name, s.description, s.category]
  );
}
console.log('✓ Skills seeded');

// ── Connectors ─────────────────────────────────────────────────────────────────
const connectors = [
  { id: 'database', name: 'Inspect360 Database', type: 'internal', isActive: 1 },
  { id: 'storage', name: 'File Storage (S3)', type: 'internal', isActive: 1 },
  { id: 'email', name: 'Email (SMTP)', type: 'email', isActive: 1 },
  { id: 'palace', name: 'Palace Property Management', type: 'property_platform', isActive: 0 },
  { id: 'console', name: 'Console Cloud', type: 'property_platform', isActive: 0 },
  { id: 'propertytree', name: 'PropertyTree', type: 'property_platform', isActive: 0 },
  { id: 'rest_professional', name: 'REST Professional', type: 'property_platform', isActive: 0 },
  { id: 'magicplan', name: 'MagicPlan', type: 'floor_plans', isActive: 0 },
];

for (const c of connectors) {
  await conn.execute(
    `INSERT IGNORE INTO connectors (id, name, type, is_active) VALUES (?, ?, ?, ?)`,
    [c.id, c.name, c.type, c.isActive]
  );
}
console.log('✓ Connectors seeded');

// ── Agent Configs ──────────────────────────────────────────────────────────────
const agents = [
  {
    agentId: 'fixx',
    name: 'Fixx',
    description: 'Property maintenance and compliance assistant. Answers questions about inspections, Healthy Homes, maintenance, and tenancy law.',
    skills: JSON.stringify(['read_inspection_history','read_chattels','read_healthy_homes','read_maintenance_plan','read_tenancy','draft_letters','compliance_check','cost_estimation']),
    connectors: JSON.stringify(['database','email','palace','console']),
    systemPrompt: 'You are Fixx, an expert NZ property management assistant. You have deep knowledge of the Residential Tenancies Act, Healthy Homes Standards, and property maintenance. Always be practical, accurate, and helpful. When referencing specific properties or inspections, use the data provided in context.',
    preferredLlmProvider: 'builtin',
  },
  {
    agentId: 'post_inspection',
    name: 'Post-Inspection Workflow',
    description: 'Automatically drafts reports, maintenance requests, and owner notifications after an inspection is completed.',
    skills: JSON.stringify(['read_inspection_history','read_chattels','draft_reports','draft_letters','push_to_palace','push_to_console','send_email','analyse_photos','compliance_check']),
    connectors: JSON.stringify(['database','storage','email','palace','console','propertytree']),
    systemPrompt: 'You are the post-inspection workflow agent. After an inspection is completed, you analyse the findings, draft a professional report for the owner, create maintenance requests for urgent items, and send notifications. Be thorough, professional, and prioritise urgent safety and compliance issues.',
    preferredLlmProvider: 'builtin',
  },
  {
    agentId: 'rental_appraisal',
    name: 'Rental Appraisal Agent',
    description: 'Analyses market data and property condition to generate rental appraisal reports with improvement recommendations.',
    skills: JSON.stringify(['read_inspection_history','read_chattels','read_healthy_homes','draft_reports','cost_estimation','analyse_photos']),
    connectors: JSON.stringify(['database','storage','email']),
    systemPrompt: 'You are the rental appraisal agent. You analyse property condition, recent inspection findings, chattels, and Healthy Homes compliance to generate accurate rental appraisals. Consider the local NZ rental market, property improvements, and compliance status when making recommendations.',
    preferredLlmProvider: 'builtin',
  },
  {
    agentId: 'maintenance_planner',
    name: 'Maintenance Planner',
    description: 'Generates and updates 12-month proactive maintenance plans based on inspection history and chattel condition.',
    skills: JSON.stringify(['read_inspection_history','read_chattels','read_maintenance_plan','cost_estimation','compliance_check','push_to_palace']),
    connectors: JSON.stringify(['database','email','palace']),
    systemPrompt: 'You are the maintenance planning agent. You analyse inspection history, chattel condition, and Healthy Homes compliance to generate proactive 12-month maintenance schedules. Prioritise safety and compliance items, then preventive maintenance to avoid costly repairs. Provide realistic NZ cost estimates.',
    preferredLlmProvider: 'builtin',
  },
];

for (const a of agents) {
  await conn.execute(
    `INSERT IGNORE INTO agent_configs (agent_id, name, description, skills, connectors, system_prompt, preferred_llm_provider, is_enabled) VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
    [a.agentId, a.name, a.description, a.skills, a.connectors, a.systemPrompt, a.preferredLlmProvider]
  );
}
console.log('✓ Agent configs seeded');

await conn.end();
console.log('\n✅ Admin seed complete');
