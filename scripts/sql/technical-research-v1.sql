-- Prepared migration only. Review and apply explicitly after backup.
BEGIN;
CREATE TABLE IF NOT EXISTS rpm_technical_evidence_v1 (
 id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 catalog_source TEXT NOT NULL CHECK (catalog_source IN ('fmic','manual')),
 sku TEXT NOT NULL CHECK (char_length(sku) BETWEEN 1 AND 120),
 identity_snapshot JSONB NOT NULL CHECK (
 jsonb_typeof(identity_snapshot)='object' AND identity_snapshot ? 'name'
 AND identity_snapshot ? 'brand' AND identity_snapshot ? 'mpn'
 AND identity_snapshot ? 'ean' AND identity_snapshot ? 'category'),
 parameter_key TEXT NOT NULL CHECK (parameter_key ~ '^[a-z][a-z0-9_]{0,79}$'),
 value_text TEXT NOT NULL CHECK (char_length(value_text) BETWEEN 1 AND 500),
 numeric_value NUMERIC,
 unit TEXT NOT NULL DEFAULT '' CHECK (char_length(unit)<=40),
 conditions JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(conditions)='object'),
 source_kind TEXT NOT NULL CHECK (source_kind IN ('manufacturer','supplier','workshop','other')),
 source_url TEXT NOT NULL CHECK (source_url ~ '^https://' AND char_length(source_url)<=2048),
 source_locator TEXT NOT NULL CHECK (char_length(source_locator) BETWEEN 1 AND 500),
 evidence_excerpt TEXT NOT NULL CHECK (char_length(evidence_excerpt) BETWEEN 1 AND 500),
 checked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 review_status TEXT NOT NULL DEFAULT 'pending' CHECK (review_status IN ('pending','approved','rejected','superseded')),
 reviewed_at TIMESTAMPTZ,
 reviewed_by TEXT,
 review_note TEXT NOT NULL DEFAULT '',
 CHECK (review_status='pending' OR (reviewed_at IS NOT NULL AND nullif(btrim(reviewed_by),'') IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS rpm_technical_evidence_lookup_v1 ON rpm_technical_evidence_v1(catalog_source,sku,parameter_key,review_status);
CREATE INDEX IF NOT EXISTS rpm_technical_evidence_queue_v1 ON rpm_technical_evidence_v1(checked_at,id) WHERE review_status='pending';
COMMIT;
