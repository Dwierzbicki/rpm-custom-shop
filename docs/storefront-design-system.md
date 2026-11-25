# RPM Custom — design system

Applies to storefront (PL and EN), authenticated back office and new modules.

- Canonical palette: `app/styles/design-tokens.css`. No independent pink, blue or other primary accent in admin or storefront. `--bo-*` aliases in admin must reference shared RPM tokens.
- Background, raised surfaces, borders and text use shared tokens. Primary actions use `--rpm-color-accent`; hover uses `--rpm-color-accent-hover`. Green denotes success/availability; amber denotes warnings; errors must have a textual explanation, not color alone.
- Shared typography: Arial/Helvetica/sans-serif; compact controls, consistent 6–10 px corner radii and visible keyboard focus. Preserve responsive layouts and readable text in both languages.
- Brand assets: use the shared `brand-assets.json` manifest and `brand-library.ts`; source externally only from confirmed brand assets, preserve provenance. Do not infer brands from compatibility references. Hide unavailable logos rather than showing broken images. Normalize assets at build time, not at catalogue request time.
- New UI must be checked on desktop and mobile, in PL and EN. Keep admin read paths lightweight; no schema migrations or external image fetching on listing requests.
