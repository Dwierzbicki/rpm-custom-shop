-- Run only after explicit authorization and backup. Transactional additive migration.
BEGIN;
SET LOCAL lock_timeout='3s';
SET LOCAL statement_timeout='60s';
SELECT pg_advisory_xact_lock(9382862);
LOCK TABLE rpm_variant_families IN SHARE ROW EXCLUSIVE MODE;
CREATE TABLE IF NOT EXISTS rpm_variant_members_v1 (
 family_id text NOT NULL REFERENCES rpm_variant_families(id) ON DELETE CASCADE,
 sku text NOT NULL,
 color text NOT NULL,
 identity jsonb NOT NULL,
 PRIMARY KEY(family_id,sku)
);
CREATE INDEX IF NOT EXISTS rpm_variant_members_v1_sku ON rpm_variant_members_v1(sku,family_id);
CREATE OR REPLACE FUNCTION rpm_refresh_variant_members_v1() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP='UPDATE' THEN
  IF OLD.id=NEW.id AND OLD.scope=NEW.scope AND OLD.decision=NEW.decision AND OLD.present=NEW.present
   AND OLD.fingerprint=NEW.fingerprint AND OLD.reviewed_fingerprint IS NOT DISTINCT FROM NEW.reviewed_fingerprint
   AND OLD.reviewed_members IS NOT DISTINCT FROM NEW.reviewed_members THEN RETURN NEW; END IF;
 END IF;
 DELETE FROM rpm_variant_members_v1 WHERE family_id=NEW.id;
 IF NEW.scope IN ('colors','hel') AND NEW.decision='approved' AND NEW.present AND NEW.fingerprint=NEW.reviewed_fingerprint THEN
  INSERT INTO rpm_variant_members_v1(family_id,sku,color,identity)
  SELECT NEW.id,m->>'sku',m->>'color',jsonb_build_array(m->>'name',m->>'brand',m->>'mpn',m->>'ean',m->'category')
  FROM jsonb_array_elements(NEW.reviewed_members) m;
 END IF;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS rpm_variant_members_v1_sync ON rpm_variant_families;
CREATE TRIGGER rpm_variant_members_v1_sync AFTER INSERT OR UPDATE ON rpm_variant_families
 FOR EACH ROW EXECUTE FUNCTION rpm_refresh_variant_members_v1();
-- Rebuild derived records only, never delete/modify catalog or decisions.
DELETE FROM rpm_variant_members_v1;
INSERT INTO rpm_variant_members_v1(family_id,sku,color,identity)
SELECT f.id,m->>'sku',m->>'color',jsonb_build_array(m->>'name',m->>'brand',m->>'mpn',m->>'ean',m->'category')
FROM rpm_variant_families f CROSS JOIN LATERAL jsonb_array_elements(f.reviewed_members) m
WHERE f.scope IN ('colors','hel') AND f.decision='approved' AND f.present AND f.fingerprint=f.reviewed_fingerprint;
ANALYZE rpm_variant_members_v1;
COMMIT;
