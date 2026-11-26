-- App automatically falls back to reviewed JSON snapshots if the optional table is absent.
-- Run with normal migration authorization; invalidate/restart application cache after rollback.
BEGIN;
SET LOCAL lock_timeout='3s';
SELECT pg_advisory_xact_lock(9382862);
DROP TRIGGER IF EXISTS rpm_variant_members_v1_sync ON rpm_variant_families;
DROP FUNCTION IF EXISTS rpm_refresh_variant_members_v1();
DROP TABLE IF EXISTS rpm_variant_members_v1;
COMMIT;
