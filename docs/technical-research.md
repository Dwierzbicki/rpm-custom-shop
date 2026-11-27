# RPM Technical Research — phase 1

The existing Power Builder's curated candidates, exact SKU/name checks, live prices and cart validation remain authoritative. New project selectors collect fuel, internals, priority and parts budget. Fuel feeds the existing estimation model; the budget is compared with the selected, priced subtotal. No AI inference or optimization is presented as active. NA, supercharger and Drag require distinct rules and are not enabled.

## Prepared evidence storage

`scripts/sql/technical-research-v1.sql` is a proposed additive migration, NOT applied automatically. Review, back up and apply only with operator approval. Each observation is tied to source and SKU, product identity snapshot, parameter, units, measurement conditions, HTTPS source, source locator, short supporting excerpt and review history. Conflicting observations remain separate. Only reviewed evidence whose identity still matches the current catalogue may later be used by a rule or displayed as verified. Approval is not a compatibility certificate.

## Next stages

1. Admin-only review API, role authorization and audit trail; read-only preview; manual approval.
2. Manufacturer-first research adapter with explicit request/cost limits and documented source permissions. Treat retrieved content as untrusted data, no instructions or tool calls from pages. Use a managed search service or allowlisted domains, protect against SSRF, private-address redirects, arbitrary PDF size and timeouts. Never send customer PII.
3. Extract structured evidence, normalize units, retain conditions and conflicting claims. Reject unsupported exact-variant claims and stale SKU identity. Do not equate catalogue marketing horsepower with verified capacity.
4. Deterministic checks and ranking over real catalogue SKU pools; review unknowns. Start M54B30 turbo, expand only when validated. Recheck price, availability, geometry and required options before adding to cart.
5. Link approved evidence to PDP and Power Builder; include provenance and freshness. No paid API or new Render resource is provisioned in this phase.
