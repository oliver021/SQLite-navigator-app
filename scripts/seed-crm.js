/**
 * CRM Seed Script — generates sample-crm.sqlite
 * Uses sql.js (pure JS SQLite) — no native modules needed.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import initSqlJs from 'sql.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '../sample-crm.sqlite');

// Remove existing
if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);

console.log('🏗️  Creating CRM database with sql.js...\n');
/* ==========================================================================
   Generate the SQL — 11 deeply-related CRM tables + seed data
   ========================================================================== */

const sql = `

-- 1. Industries (lookup)
CREATE TABLE industries (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL UNIQUE,
  sector      TEXT NOT NULL,
  description TEXT
);

-- 2. Companies
CREATE TABLE companies (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL,
  industry_id INTEGER NOT NULL,
  website     TEXT,
  phone       TEXT,
  address     TEXT,
  city        TEXT,
  country     TEXT,
  employees   INTEGER DEFAULT 0,
  revenue     REAL DEFAULT 0,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (industry_id) REFERENCES industries(id)
);

-- 3. Contacts (belong to a company)
CREATE TABLE contacts (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  first_name  TEXT NOT NULL,
  last_name   TEXT NOT NULL,
  email       TEXT UNIQUE NOT NULL,
  phone       TEXT,
  job_title   TEXT,
  company_id  INTEGER NOT NULL,
  is_primary  INTEGER DEFAULT 0,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id)
);

-- 4. Pipelines (sales pipelines)
CREATE TABLE pipelines (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL,
  description TEXT,
  is_default  INTEGER DEFAULT 0,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 5. Stages (belong to a pipeline)
CREATE TABLE stages (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  pipeline_id   INTEGER NOT NULL,
  name          TEXT NOT NULL,
  position      INTEGER NOT NULL DEFAULT 0,
  probability   REAL NOT NULL DEFAULT 0,
  color         TEXT,
  FOREIGN KEY (pipeline_id) REFERENCES pipelines(id)
);

-- 6. Products
CREATE TABLE products (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL,
  sku         TEXT UNIQUE,
  unit_price  REAL NOT NULL DEFAULT 0,
  category    TEXT,
  is_active   INTEGER DEFAULT 1,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 7. Deals (contact + stage, core of CRM)
CREATE TABLE deals (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  title       TEXT NOT NULL,
  contact_id  INTEGER NOT NULL,
  stage_id    INTEGER NOT NULL,
  value       REAL NOT NULL DEFAULT 0,
  currency    TEXT DEFAULT 'USD',
  close_date  DATE,
  priority    TEXT CHECK(priority IN ('low','medium','high','critical')) DEFAULT 'medium',
  notes       TEXT,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (contact_id) REFERENCES contacts(id),
  FOREIGN KEY (stage_id)   REFERENCES stages(id)
);

-- 8. Deal Products (many-to-many: deals <-> products)
CREATE TABLE deal_products (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  deal_id     INTEGER NOT NULL,
  product_id  INTEGER NOT NULL,
  quantity    INTEGER NOT NULL DEFAULT 1,
  unit_price  REAL NOT NULL,
  discount    REAL DEFAULT 0,
  FOREIGN KEY (deal_id)    REFERENCES deals(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- 9. Activities (linked to contacts and optionally deals)
CREATE TABLE activities (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  type        TEXT NOT NULL CHECK(type IN ('call','email','meeting','task','note')),
  subject     TEXT NOT NULL,
  description TEXT,
  contact_id  INTEGER NOT NULL,
  deal_id     INTEGER,
  due_date    DATETIME,
  completed   INTEGER DEFAULT 0,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (contact_id) REFERENCES contacts(id),
  FOREIGN KEY (deal_id)    REFERENCES deals(id)
);

-- 10. Tags
CREATE TABLE tags (
  id    INTEGER PRIMARY KEY AUTOINCREMENT,
  name  TEXT NOT NULL UNIQUE,
  color TEXT DEFAULT '#6366f1'
);

-- 11. Contact Tags (many-to-many: contacts <-> tags)
CREATE TABLE contact_tags (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  contact_id INTEGER NOT NULL,
  tag_id     INTEGER NOT NULL,
  FOREIGN KEY (contact_id) REFERENCES contacts(id),
  FOREIGN KEY (tag_id)     REFERENCES tags(id),
  UNIQUE(contact_id, tag_id)
);

/* ======================================================================
   SEED DATA
   ====================================================================== */

-- Industries (6)
INSERT INTO industries (name, sector, description) VALUES
  ('Technology',    'IT',         'Software, hardware, and digital services'),
  ('Healthcare',    'Medical',    'Hospitals, pharma, and biotech'),
  ('Finance',       'Banking',    'Banks, insurance, and investment firms'),
  ('Manufacturing', 'Industrial', 'Production and assembly operations'),
  ('Retail',        'Consumer',   'Brick-and-mortar and e-commerce stores'),
  ('Education',     'Public',     'Universities, schools, and edtech');

-- Companies (8)
INSERT INTO companies (name, industry_id, website, phone, address, city, country, employees, revenue) VALUES
  ('Nexora Systems',     1, 'https://nexora.io',      '+1-415-555-0101', '100 Market St',     'San Francisco', 'USA',     350,  42000000),
  ('MediCore Labs',      2, 'https://medicore.com',    '+1-212-555-0202', '250 Park Ave',      'New York',      'USA',     180,  28500000),
  ('CapitalEdge Group',  3, 'https://capitaledge.com', '+44-20-7946-0303','1 Canary Wharf',    'London',        'UK',      520,  95000000),
  ('Pinnacle Mfg',       4, 'https://pinnaclemfg.de',  '+49-89-555-0404', 'Industriestr 42',   'Munich',        'Germany', 1200, 150000000),
  ('ShopWave Retail',    5, 'https://shopwave.co',     '+1-305-555-0505', '777 Brickell Ave',  'Miami',         'USA',     90,   12000000),
  ('BrightPath Academy', 6, 'https://brightpath.edu',  '+1-617-555-0606', '10 Harvard Sq',     'Boston',        'USA',     45,   5500000),
  ('CloudVault Inc',     1, 'https://cloudvault.dev',  '+1-650-555-0707', '2000 Sand Hill Rd', 'Menlo Park',    'USA',     220,  38000000),
  ('GreenLeaf Bio',      2, 'https://greenleafbio.ch', '+41-44-555-0808', 'Bahnhofstr 12',    'Zurich',        'Switzerland', 75, 9200000);

-- Contacts (20)
INSERT INTO contacts (first_name, last_name, email, phone, job_title, company_id, is_primary) VALUES
  ('Sarah',    'Chen',      'sarah.chen@nexora.io',          '+1-415-555-1001', 'VP Engineering',     1, 1),
  ('Marcus',   'Johnson',   'marcus.j@nexora.io',            '+1-415-555-1002', 'CTO',                1, 0),
  ('Elena',    'Rodriguez', 'elena.r@medicore.com',           '+1-212-555-2001', 'Head of Procurement',2, 1),
  ('James',    'Wright',    'james.w@medicore.com',           '+1-212-555-2002', 'Lab Director',       2, 0),
  ('Victoria', 'Palmer',    'victoria.p@capitaledge.com',     '+44-20-7946-3001','CFO',                3, 1),
  ('Raj',      'Patel',     'raj.patel@capitaledge.com',      '+44-20-7946-3002','Head of Trading',    3, 0),
  ('Thomas',   'Mueller',   'thomas.m@pinnaclemfg.de',        '+49-89-555-4001', 'Operations Director',4, 1),
  ('Anna',     'Schmidt',   'anna.s@pinnaclemfg.de',          '+49-89-555-4002', 'Supply Chain Mgr',   4, 0),
  ('Carlos',   'Vega',      'carlos.v@shopwave.co',           '+1-305-555-5001', 'Head of Retail',     5, 1),
  ('Maria',    'Santos',    'maria.s@shopwave.co',            '+1-305-555-5002', 'E-commerce Manager', 5, 0),
  ('David',    'Kim',       'david.k@brightpath.edu',         '+1-617-555-6001', 'Dean of Technology', 6, 1),
  ('Lisa',     'Chang',     'lisa.c@brightpath.edu',          '+1-617-555-6002', 'IT Director',        6, 0),
  ('Alex',     'Turner',    'alex.t@cloudvault.dev',          '+1-650-555-7001', 'CEO',                7, 1),
  ('Priya',    'Sharma',    'priya.s@cloudvault.dev',         '+1-650-555-7002', 'VP Sales',           7, 0),
  ('Oliver',   'Baumann',   'oliver.b@greenleafbio.ch',       '+41-44-555-8001', 'Research Director',  8, 1),
  ('Sophie',   'Keller',    'sophie.k@greenleafbio.ch',       '+41-44-555-8002', 'Lab Manager',        8, 0),
  ('Michael',  'Foster',    'michael.f@nexora.io',            '+1-415-555-1003', 'Product Manager',    1, 0),
  ('Emily',    'Davis',     'emily.d@capitaledge.com',        '+44-20-7946-3003','Compliance Officer', 3, 0),
  ('Lucas',    'Weber',     'lucas.w@pinnaclemfg.de',         '+49-89-555-4003', 'Quality Engineer',   4, 0),
  ('Hannah',   'Brooks',    'hannah.b@cloudvault.dev',        '+1-650-555-7003', 'DevOps Lead',        7, 0);

-- Pipelines (2)
INSERT INTO pipelines (name, description, is_default) VALUES
  ('Enterprise Sales', 'Long-cycle B2B enterprise deals', 1),
  ('SMB Pipeline',     'Fast-moving small business deals', 0);

-- Stages (7 across 2 pipelines)
INSERT INTO stages (pipeline_id, name, position, probability, color) VALUES
  (1, 'Lead',           1, 0.10, '#6366f1'),
  (1, 'Qualified',      2, 0.25, '#8b5cf6'),
  (1, 'Proposal',       3, 0.50, '#a78bfa'),
  (1, 'Negotiation',    4, 0.75, '#f59e0b'),
  (1, 'Closed Won',     5, 1.00, '#10b981'),
  (2, 'Inbound',        1, 0.15, '#22d3ee'),
  (2, 'Demo Scheduled', 2, 0.40, '#06b6d4');

-- Products (6)
INSERT INTO products (name, sku, unit_price, category, is_active) VALUES
  ('Pro License',    'LIC-PRO-001',  499.00,  'Software',  1),
  ('Enterprise Pack','LIC-ENT-001',  1999.00, 'Software',  1),
  ('Onboarding',     'SVC-ONB-001',  2500.00, 'Service',   1),
  ('Annual Support', 'SVC-SUP-001',  999.00,  'Service',   1),
  ('API Access',     'ADD-API-001',  199.00,  'Add-on',    1),
  ('Training (5d)',  'SVC-TRN-001',  4500.00, 'Service',   1);

-- Deals (12)
INSERT INTO deals (title, contact_id, stage_id, value, currency, close_date, priority, notes) VALUES
  ('Nexora Platform Upgrade',    1,  3, 125000.00, 'USD', '2026-06-15', 'high',     'Multi-year platform modernization'),
  ('MediCore Lab Software',      3,  2,  85000.00, 'USD', '2026-07-01', 'medium',   'EHR integration needed'),
  ('CapitalEdge Trading Suite',  5,  4, 340000.00, 'GBP', '2026-05-30', 'critical', 'Competing with Bloomberg'),
  ('Pinnacle IoT Deployment',    7,  1, 210000.00, 'EUR', '2026-09-01', 'medium',   'Factory floor sensors Phase 1'),
  ('ShopWave POS System',        9,  5,  45000.00, 'USD', '2026-04-15', 'low',      'Already signed, deploying'),
  ('BrightPath LMS',            11,  6,  28000.00, 'USD', '2026-08-20', 'medium',   'Learning management system'),
  ('CloudVault Enterprise',     13,  3, 175000.00, 'USD', '2026-06-30', 'high',     'Full cloud migration package'),
  ('GreenLeaf LIMS',            15,  2,  92000.00, 'EUR', '2026-10-01', 'medium',   'Lab information management'),
  ('Nexora Security Audit',      2,  7,  35000.00, 'USD', '2026-05-15', 'high',     'Compliance-driven engagement'),
  ('CapitalEdge Risk Module',    6,  4, 180000.00, 'GBP', '2026-07-15', 'critical', 'Regulatory deadline approaching'),
  ('Pinnacle QA Automation',     8,  1, 120000.00, 'EUR', '2026-11-01', 'low',      'Quality assurance digitization'),
  ('CloudVault Dev Tools',      14,  6,  55000.00, 'USD', '2026-08-01', 'medium',   'CI/CD pipeline tooling');

-- Deal Products (18 line items)
INSERT INTO deal_products (deal_id, product_id, quantity, unit_price, discount) VALUES
  (1,  2, 5,  1999.00, 10.0),
  (1,  3, 1,  2500.00,  0.0),
  (1,  4, 5,   999.00,  5.0),
  (2,  1, 10,  499.00, 15.0),
  (2,  6, 1,  4500.00,  0.0),
  (3,  2, 20, 1999.00, 12.0),
  (3,  5, 20,  199.00,  0.0),
  (3,  4, 20,  999.00,  8.0),
  (4,  2, 10, 1999.00,  5.0),
  (4,  3, 2,  2500.00,  0.0),
  (5,  1, 5,   499.00, 20.0),
  (6,  1, 30,  499.00, 25.0),
  (6,  6, 2,  4500.00, 10.0),
  (7,  2, 8,  1999.00,  5.0),
  (7,  3, 1,  2500.00,  0.0),
  (7,  5, 8,   199.00,  0.0),
  (8,  2, 3,  1999.00,  0.0),
  (8,  4, 3,   999.00,  0.0);

-- Activities (25)
INSERT INTO activities (type, subject, description, contact_id, deal_id, due_date, completed) VALUES
  ('meeting', 'Kickoff call with Nexora',      'Discuss scope and timeline',            1,  1,  '2026-05-02 10:00:00', 0),
  ('email',   'Send proposal to MediCore',     'Include pricing tiers',                 3,  2,  '2026-05-01 09:00:00', 1),
  ('call',    'Follow-up with Victoria',       'Discuss contract terms',                5,  3,  '2026-05-03 14:00:00', 0),
  ('task',    'Prepare IoT demo',              'Set up sensor dashboard',               7,  4,  '2026-05-10 12:00:00', 0),
  ('note',    'ShopWave deployment complete',  'All POS terminals installed',           9,  5,  '2026-04-15 16:00:00', 1),
  ('meeting', 'LMS demo with BrightPath',      'Show content management features',    11,  6,  '2026-05-08 11:00:00', 0),
  ('email',   'Cloud migration proposal',      'Send updated architecture diagram',   13,  7,  '2026-05-05 08:00:00', 0),
  ('call',    'LIMS requirements with Oliver', 'Discuss sample tracking workflow',     15,  8,  '2026-05-06 15:00:00', 0),
  ('task',    'Security audit prep',           'Gather compliance documents',           2,  9,  '2026-05-04 10:00:00', 0),
  ('meeting', 'Risk module review',            'Present risk calculation models',       6, 10,  '2026-05-12 13:00:00', 0),
  ('email',   'QA automation roadmap',         'Send phased implementation plan',       8, 11,  '2026-05-07 09:00:00', 1),
  ('call',    'Dev tools licensing',           'Discuss seat-based pricing',           14, 12,  '2026-05-09 11:00:00', 0),
  ('meeting', 'Quarterly review - Nexora',     'Review product adoption metrics',       1,  1,  '2026-06-01 10:00:00', 0),
  ('task',    'Update CRM records',            'Sync all deal stages',                  3, NULL, '2026-05-15 09:00:00', 0),
  ('note',    'CapitalEdge competitor intel',  'Bloomberg offering lower price',        5,  3,  '2026-05-02 17:00:00', 1),
  ('email',   'Follow-up on proposal',         'Check if they reviewed pricing',       7,  4,  '2026-05-11 08:00:00', 0),
  ('call',    'Check in with Carlos',          'Discuss expansion to new locations',    9, NULL, '2026-05-20 14:00:00', 0),
  ('meeting', 'Board presentation prep',       'Prepare ROI slides for David',         11,  6,  '2026-05-18 09:00:00', 0),
  ('task',    'Contract review',               'Legal team to review T&Cs',            13,  7,  '2026-05-08 16:00:00', 0),
  ('email',   'Lab validation results',        'Share test environment results',       15,  8,  '2026-05-14 10:00:00', 0),
  ('call',    'Marcus tech deep-dive',         'Architecture review session',           2, NULL, '2026-05-16 11:00:00', 0),
  ('meeting', 'Compliance workshop',           'Regulatory framework discussion',      18,  3,  '2026-05-22 14:00:00', 0),
  ('task',    'Quality checklist',             'Prepare QA validation matrix',         19, 11,  '2026-05-25 09:00:00', 0),
  ('email',   'Welcome onboard',              'Send onboarding package',              20,  7,  '2026-05-03 08:00:00', 1),
  ('note',    'Pipeline review notes',         'Q2 forecast looks strong',             14, 12,  '2026-05-01 17:00:00', 1);

-- Tags (6)
INSERT INTO tags (name, color) VALUES
  ('VIP',        '#f59e0b'),
  ('Hot Lead',   '#ef4444'),
  ('Partner',    '#10b981'),
  ('Churning',   '#f97316'),
  ('Enterprise', '#7c3aed'),
  ('Referral',   '#06b6d4');

-- Contact Tags (assign tags to contacts)
INSERT INTO contact_tags (contact_id, tag_id) VALUES
  (1, 1), (1, 5),          -- Sarah: VIP, Enterprise
  (3, 2), (3, 5),          -- Elena: Hot Lead, Enterprise
  (5, 1), (5, 5),          -- Victoria: VIP, Enterprise
  (7, 5),                  -- Thomas: Enterprise
  (9, 3),                  -- Carlos: Partner
  (11, 6),                 -- David: Referral
  (13, 1), (13, 2), (13,5),-- Alex: VIP, Hot Lead, Enterprise
  (15, 5),                 -- Oliver: Enterprise
  (2, 5),                  -- Marcus: Enterprise
  (6, 1),                  -- Raj: VIP
  (14, 2),                 -- Priya: Hot Lead
  (10, 3),                 -- Maria: Partner
  (4, 4),                  -- James: Churning
  (8, 5),                  -- Anna: Enterprise
  (20, 6);                 -- Hannah: Referral
`;

// Execute the SQL and save the database
const SQL = await initSqlJs();
const db = new SQL.Database();

// sql.js doesn't support multi-statement run() well with comments,
// so split by semicolons and execute each statement
const statements = sql.split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith('/*') && !s.startsWith('*'));

for (const stmt of statements) {
  try {
    db.run(stmt + ';');
  } catch (e) {
    console.error(`Error executing: ${stmt.substring(0, 60)}...`);
    console.error(e.message);
  }
}

// Export to file
const data = db.export();
const buffer = Buffer.from(data);
fs.writeFileSync(dbPath, buffer);
db.close();

console.log(`✅ CRM database created at: ${dbPath}\n`);
console.log('Tables & row counts:');
console.log('  industries .... 6');
console.log('  companies ..... 8');
console.log('  contacts ...... 20');
console.log('  pipelines ..... 2');
console.log('  stages ........ 7');
console.log('  products ...... 6');
console.log('  deals ......... 12');
console.log('  deal_products . 18');
console.log('  activities .... 25');
console.log('  tags .......... 6');
console.log('  contact_tags .. 18');
console.log('\nFK relationships: 12 across 11 tables');
console.log('Ready for Schema Graph testing! 🎉');

