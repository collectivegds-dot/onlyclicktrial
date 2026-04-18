-- 1. Create table for allowed emails
CREATE TABLE IF NOT EXISTS allowed_emails (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);

-- 2. Create table for licenses
CREATE TABLE IF NOT EXISTS licenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT REFERENCES allowed_emails(email) ON DELETE CASCADE,
  license_key TEXT UNIQUE NOT NULL,
  device_fingerprint TEXT,
  device_name TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used TIMESTAMPTZ
);

-- Enable RLS (Row Level Security) - mostly allowing API service roles fully
ALTER TABLE allowed_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;

-- Create policies to allow everything for authenticated roles/service role
CREATE POLICY "Enable all actions for service role"
ON allowed_emails FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY "Enable all actions for service role on licenses"
ON licenses FOR ALL
USING (true)
WITH CHECK (true);
