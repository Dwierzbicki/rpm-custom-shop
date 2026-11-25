# FMIC standalone worker
Default: embedded mode, existing deployment unchanged. External mode is opt-in.
Do not provision a paid service without approval. Use a single background worker instance on the same private network and database as the storefront.

Cutover:
1. Pause audit and descriptions using the existing admin controls; wait for active requests to finish. Confirm supplier permission before enabling enrichment.
2. Deploy the storefront with FMIC_WORKER_MODE=external (do not set FMIC_WORKER_PROCESS on web service). Wait for the old web instance to terminate. Both instrumentation and worker entrypoints respect external mode, including admin Start actions.
3. Create the worker using the same commit. Build command: npm ci --include=dev. Start command: npm run fmic:worker. Set FMIC_WORKER_MODE=external, DATABASE_URL (same database, use private connection), DATABASE_SSL matching existing service, FMIC_ENRICHMENT_ALLOWED only if authorized. Runner sets its own process marker. No public port or HTTP server required. Keep one replica.
4. Start existing queues via admin. Check heartbeat and progress; no reseed necessary for an already enabled queue, no deletion/reset of state.
5. Rollback: pause queues; stop external worker; remove external mode from web service and redeploy; resume queues. Never run both modes simultaneously.
Limits unchanged: one audit image per cycle, 5-second delay, 30-second backoff for 429/503, pause at 403; descriptions maintain DB request gate and manual priority. No automatic publishing. External worker pool max 4 connections, web pool max 10. RSS guard remains 320 MiB. Graceful shutdown waits up to 25 seconds, then exits; existing session locks are released by PostgreSQL on disconnect. Cache remains process-local, 15-second TTL applies to cross-process image updates.
Manual XML import and manual single-product actions remain in the web service. This change separates the two continuous background loops only.
