-- Back Office – Datenbankschema (SQLite)
-- Beträge werden in Cent (INTEGER) gespeichert, um Rundungsfehler zu vermeiden.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS schema_version (version INTEGER NOT NULL);

CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT
);

CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  email         TEXT NOT NULL UNIQUE COLLATE NOCASE,
  name          TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'mitarbeiter' CHECK (role IN ('admin','manager','buchhaltung','mitarbeiter')),
  active        INTEGER NOT NULL DEFAULT 1,
  totp_secret   TEXT,
  totp_enabled  INTEGER NOT NULL DEFAULT 0,
  failed_logins INTEGER NOT NULL DEFAULT 0,
  locked_until  TEXT,
  hourly_rate   INTEGER NOT NULL DEFAULT 0,
  last_login_at TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sessions (
  id         TEXT PRIMARY KEY,
  user_id    INTEGER REFERENCES users(id) ON DELETE CASCADE,
  data       TEXT NOT NULL DEFAULT '{}',
  ip         TEXT,
  user_agent TEXT,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

CREATE TABLE IF NOT EXISTS password_resets (
  token_hash TEXT PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL,
  used       INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS api_keys (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL,
  key_hash    TEXT NOT NULL UNIQUE,
  key_prefix  TEXT NOT NULL,
  scopes      TEXT NOT NULL DEFAULT 'read',
  last_used_at TEXT,
  created_by  INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  revoked     INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS customers (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  number        TEXT NOT NULL UNIQUE,
  type          TEXT NOT NULL DEFAULT 'firma' CHECK (type IN ('firma','privat','behoerde')),
  company       TEXT,
  salutation    TEXT,
  first_name    TEXT,
  last_name     TEXT,
  email         TEXT,
  phone         TEXT,
  mobile        TEXT,
  website       TEXT,
  street        TEXT,
  zip           TEXT,
  city          TEXT,
  country       TEXT NOT NULL DEFAULT 'DE',
  vat_id        TEXT,
  leitweg_id    TEXT,
  payment_terms INTEGER,
  discount_pct  REAL NOT NULL DEFAULT 0,
  tags          TEXT,
  notes         TEXT,
  status        TEXT NOT NULL DEFAULT 'aktiv' CHECK (status IN ('aktiv','interessent','inaktiv')),
  gdpr_consent  INTEGER NOT NULL DEFAULT 0,
  anonymized    INTEGER NOT NULL DEFAULT 0,
  created_by    INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(company, last_name);

CREATE TABLE IF NOT EXISTS contacts (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  position    TEXT,
  email       TEXT,
  phone       TEXT,
  is_primary  INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Aktivitäten / Kontakthistorie (Anrufe, Mails, Notizen)
CREATE TABLE IF NOT EXISTS activities (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
  lead_id     INTEGER REFERENCES leads(id) ON DELETE CASCADE,
  type        TEXT NOT NULL DEFAULT 'notiz' CHECK (type IN ('notiz','anruf','email','termin','besuch')),
  subject     TEXT NOT NULL,
  body        TEXT,
  user_id     INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Anfragen über die Website (Kontaktformular) und manuell erfasste Leads
CREATE TABLE IF NOT EXISTS leads (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL,
  company     TEXT,
  email       TEXT,
  phone       TEXT,
  subject     TEXT,
  message     TEXT,
  source      TEXT NOT NULL DEFAULT 'website',
  status      TEXT NOT NULL DEFAULT 'neu' CHECK (status IN ('neu','kontaktiert','qualifiziert','gewonnen','verloren')),
  value       INTEGER NOT NULL DEFAULT 0,
  assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
  customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
  ip          TEXT,
  consent     INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS products (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  sku         TEXT UNIQUE,
  name        TEXT NOT NULL,
  description TEXT,
  unit        TEXT NOT NULL DEFAULT 'Stk.',
  price       INTEGER NOT NULL DEFAULT 0,
  tax_rate    REAL NOT NULL DEFAULT 19,
  active      INTEGER NOT NULL DEFAULT 1,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Belege: Angebote, Auftragsbestätigungen, Rechnungen, Stornorechnungen (Gutschriften)
CREATE TABLE IF NOT EXISTS documents_sales (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  kind           TEXT NOT NULL CHECK (kind IN ('angebot','auftrag','rechnung','storno')),
  number         TEXT UNIQUE,
  customer_id    INTEGER NOT NULL REFERENCES customers(id),
  project_id     INTEGER REFERENCES projects(id) ON DELETE SET NULL,
  ref_id         INTEGER REFERENCES documents_sales(id),
  status         TEXT NOT NULL DEFAULT 'entwurf',
  title          TEXT,
  intro          TEXT,
  footer         TEXT,
  issue_date     TEXT NOT NULL,
  service_date   TEXT,
  service_until  TEXT,
  due_date       TEXT,
  valid_until    TEXT,
  customer_snapshot TEXT,
  net_total      INTEGER NOT NULL DEFAULT 0,
  tax_total      INTEGER NOT NULL DEFAULT 0,
  gross_total    INTEGER NOT NULL DEFAULT 0,
  paid_total     INTEGER NOT NULL DEFAULT 0,
  dunning_level  INTEGER NOT NULL DEFAULT 0,
  last_dunning_at TEXT,
  small_business INTEGER NOT NULL DEFAULT 0,
  reverse_charge INTEGER NOT NULL DEFAULT 0,
  finalized_at   TEXT,
  sent_at        TEXT,
  created_by     INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at     TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at     TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_sales_kind ON documents_sales(kind, status);
CREATE INDEX IF NOT EXISTS idx_sales_customer ON documents_sales(customer_id);

CREATE TABLE IF NOT EXISTS document_items (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  document_id INTEGER NOT NULL REFERENCES documents_sales(id) ON DELETE CASCADE,
  position    INTEGER NOT NULL,
  product_id  INTEGER REFERENCES products(id) ON DELETE SET NULL,
  name        TEXT NOT NULL,
  description TEXT,
  quantity    REAL NOT NULL DEFAULT 1,
  unit        TEXT NOT NULL DEFAULT 'Stk.',
  unit_price  INTEGER NOT NULL DEFAULT 0,
  discount_pct REAL NOT NULL DEFAULT 0,
  tax_rate    REAL NOT NULL DEFAULT 19,
  net_amount  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS payments (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  document_id INTEGER NOT NULL REFERENCES documents_sales(id) ON DELETE CASCADE,
  amount      INTEGER NOT NULL,
  paid_at     TEXT NOT NULL,
  method      TEXT NOT NULL DEFAULT 'ueberweisung',
  note        TEXT,
  created_by  INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS dunnings (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  document_id INTEGER NOT NULL REFERENCES documents_sales(id) ON DELETE CASCADE,
  level       INTEGER NOT NULL,
  fee         INTEGER NOT NULL DEFAULT 0,
  interest    INTEGER NOT NULL DEFAULT 0,
  due_date    TEXT NOT NULL,
  created_by  INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Wiederkehrende Rechnungen (Abos, Wartungsverträge, Objektschutz-Pauschalen …)
CREATE TABLE IF NOT EXISTS recurring_invoices (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  template_id   INTEGER NOT NULL REFERENCES documents_sales(id) ON DELETE CASCADE,
  interval      TEXT NOT NULL CHECK (interval IN ('monatlich','quartalsweise','halbjaehrlich','jaehrlich')),
  next_date     TEXT NOT NULL,
  end_date      TEXT,
  auto_finalize INTEGER NOT NULL DEFAULT 0,
  active        INTEGER NOT NULL DEFAULT 1,
  last_run_at   TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS projects (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  number      TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
  status      TEXT NOT NULL DEFAULT 'geplant' CHECK (status IN ('geplant','aktiv','pausiert','abgeschlossen','storniert')),
  description TEXT,
  start_date  TEXT,
  end_date    TEXT,
  budget      INTEGER NOT NULL DEFAULT 0,
  hourly_rate INTEGER NOT NULL DEFAULT 0,
  manager_id  INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS tasks (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  title       TEXT NOT NULL,
  description TEXT,
  status      TEXT NOT NULL DEFAULT 'offen' CHECK (status IN ('offen','in_arbeit','wartet','erledigt')),
  priority    TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('niedrig','normal','hoch','dringend')),
  due_date    TEXT,
  project_id  INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
  assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_by  INTEGER REFERENCES users(id) ON DELETE SET NULL,
  completed_at TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS appointments (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  title       TEXT NOT NULL,
  description TEXT,
  location    TEXT,
  starts_at   TEXT NOT NULL,
  ends_at     TEXT NOT NULL,
  all_day     INTEGER NOT NULL DEFAULT 0,
  customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
  project_id  INTEGER REFERENCES projects(id) ON DELETE SET NULL,
  user_id     INTEGER REFERENCES users(id) ON DELETE SET NULL,
  color       TEXT NOT NULL DEFAULT 'blau',
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_appointments_start ON appointments(starts_at);

CREATE TABLE IF NOT EXISTS time_entries (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id  INTEGER REFERENCES projects(id) ON DELETE SET NULL,
  customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
  date        TEXT NOT NULL,
  minutes     INTEGER NOT NULL,
  started_at  TEXT,
  description TEXT,
  billable    INTEGER NOT NULL DEFAULT 1,
  invoiced_in INTEGER REFERENCES documents_sales(id) ON DELETE SET NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_time_user_date ON time_entries(user_id, date);

-- Laufende Stoppuhr pro Benutzer
CREATE TABLE IF NOT EXISTS timers (
  user_id     INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  project_id  INTEGER REFERENCES projects(id) ON DELETE SET NULL,
  description TEXT,
  started_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS suppliers (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT NOT NULL,
  email      TEXT,
  phone      TEXT,
  iban       TEXT,
  notes      TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS expenses (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  date        TEXT NOT NULL,
  supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL,
  supplier_name TEXT,
  category    TEXT NOT NULL DEFAULT 'Sonstiges',
  description TEXT,
  receipt_no  TEXT,
  net_amount  INTEGER NOT NULL DEFAULT 0,
  tax_rate    REAL NOT NULL DEFAULT 19,
  tax_amount  INTEGER NOT NULL DEFAULT 0,
  gross_amount INTEGER NOT NULL DEFAULT 0,
  paid        INTEGER NOT NULL DEFAULT 1,
  paid_at     TEXT,
  project_id  INTEGER REFERENCES projects(id) ON DELETE SET NULL,
  file_id     INTEGER REFERENCES files(id) ON DELETE SET NULL,
  created_by  INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS files (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  original_name TEXT NOT NULL,
  stored_name  TEXT NOT NULL UNIQUE,
  mime         TEXT,
  size         INTEGER NOT NULL DEFAULT 0,
  sha256       TEXT,
  folder       TEXT NOT NULL DEFAULT 'Allgemein',
  customer_id  INTEGER REFERENCES customers(id) ON DELETE SET NULL,
  project_id   INTEGER REFERENCES projects(id) ON DELETE SET NULL,
  uploaded_by  INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS notifications (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  body       TEXT,
  link       TEXT,
  read       INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Revisionssicheres Protokoll: nur INSERT, kein UPDATE/DELETE (per Trigger erzwungen)
CREATE TABLE IF NOT EXISTS audit_log (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER,
  user_name  TEXT,
  action     TEXT NOT NULL,
  entity     TEXT,
  entity_id  INTEGER,
  details    TEXT,
  ip         TEXT,
  prev_hash  TEXT,
  hash       TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_log(entity, entity_id);

CREATE TRIGGER IF NOT EXISTS audit_no_update BEFORE UPDATE ON audit_log
BEGIN SELECT RAISE(ABORT, 'Audit-Log ist unveränderlich'); END;
CREATE TRIGGER IF NOT EXISTS audit_no_delete BEFORE DELETE ON audit_log
BEGIN SELECT RAISE(ABORT, 'Audit-Log ist unveränderlich'); END;

-- GoBD: festgeschriebene Rechnungen dürfen inhaltlich nicht mehr geändert werden
CREATE TRIGGER IF NOT EXISTS sales_lock_finalized BEFORE UPDATE OF customer_id, issue_date, net_total, tax_total, gross_total, number, customer_snapshot, service_date ON documents_sales
WHEN OLD.finalized_at IS NOT NULL AND OLD.kind IN ('rechnung','storno')
BEGIN SELECT RAISE(ABORT, 'Festgeschriebene Rechnung kann nicht geändert werden'); END;
CREATE TRIGGER IF NOT EXISTS sales_no_delete_finalized BEFORE DELETE ON documents_sales
WHEN OLD.finalized_at IS NOT NULL AND OLD.kind IN ('rechnung','storno')
BEGIN SELECT RAISE(ABORT, 'Festgeschriebene Rechnung kann nicht gelöscht werden'); END;
CREATE TRIGGER IF NOT EXISTS items_lock_finalized_ins BEFORE INSERT ON document_items
WHEN (SELECT finalized_at FROM documents_sales WHERE id = NEW.document_id AND kind IN ('rechnung','storno')) IS NOT NULL
BEGIN SELECT RAISE(ABORT, 'Positionen festgeschriebener Rechnungen sind gesperrt'); END;
CREATE TRIGGER IF NOT EXISTS items_lock_finalized_upd BEFORE UPDATE ON document_items
WHEN (SELECT finalized_at FROM documents_sales WHERE id = OLD.document_id AND kind IN ('rechnung','storno')) IS NOT NULL
BEGIN SELECT RAISE(ABORT, 'Positionen festgeschriebener Rechnungen sind gesperrt'); END;
CREATE TRIGGER IF NOT EXISTS items_lock_finalized_del BEFORE DELETE ON document_items
WHEN (SELECT finalized_at FROM documents_sales WHERE id = OLD.document_id AND kind IN ('rechnung','storno')) IS NOT NULL
BEGIN SELECT RAISE(ABORT, 'Positionen festgeschriebener Rechnungen sind gesperrt'); END;

CREATE TABLE IF NOT EXISTS counters (
  name  TEXT PRIMARY KEY,
  value INTEGER NOT NULL DEFAULT 0
);

-- ───────── Dienstplanung (Personal, Qualifikationen, Schichten) ─────────
CREATE TABLE IF NOT EXISTS staff (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  personnel_no   TEXT UNIQUE,
  first_name     TEXT NOT NULL,
  last_name      TEXT NOT NULL,
  email          TEXT,
  phone          TEXT,
  user_id        INTEGER REFERENCES users(id) ON DELETE SET NULL,
  employment     TEXT NOT NULL DEFAULT 'vollzeit' CHECK (employment IN ('vollzeit','teilzeit','minijob','aushilfe','freelancer')),
  weekly_hours   REAL NOT NULL DEFAULT 40,
  hourly_wage    INTEGER NOT NULL DEFAULT 0,
  bewacher_id    TEXT,
  color          TEXT NOT NULL DEFAULT 'blau',
  active         INTEGER NOT NULL DEFAULT 1,
  notes          TEXT,
  created_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS qualification_types (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  name            TEXT NOT NULL UNIQUE,
  validity_months INTEGER,
  description     TEXT
);

CREATE TABLE IF NOT EXISTS staff_qualifications (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  staff_id   INTEGER NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  type_id    INTEGER NOT NULL REFERENCES qualification_types(id) ON DELETE CASCADE,
  issued_at  TEXT,
  expires_at TEXT,
  file_id    INTEGER REFERENCES files(id) ON DELETE SET NULL,
  note       TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_staffq_staff ON staff_qualifications(staff_id);

CREATE TABLE IF NOT EXISTS absences (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  staff_id   INTEGER NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  type       TEXT NOT NULL DEFAULT 'urlaub' CHECK (type IN ('urlaub','krank','frei','schulung','sonstiges')),
  date_from  TEXT NOT NULL,
  date_to    TEXT NOT NULL,
  note       TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS shifts (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  staff_id      INTEGER REFERENCES staff(id) ON DELETE SET NULL,
  project_id    INTEGER REFERENCES projects(id) ON DELETE SET NULL,
  customer_id   INTEGER REFERENCES customers(id) ON DELETE SET NULL,
  title         TEXT NOT NULL,
  location      TEXT,
  starts_at     TEXT NOT NULL,
  ends_at       TEXT NOT NULL,
  break_minutes INTEGER NOT NULL DEFAULT 0,
  status        TEXT NOT NULL DEFAULT 'geplant' CHECK (status IN ('geplant','bestaetigt','erledigt','abgesagt')),
  required_qualifications TEXT,
  notes         TEXT,
  invoiced_in   INTEGER REFERENCES documents_sales(id) ON DELETE SET NULL,
  created_by    INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_shifts_start ON shifts(starts_at);
CREATE INDEX IF NOT EXISTS idx_shifts_staff ON shifts(staff_id, starts_at);
