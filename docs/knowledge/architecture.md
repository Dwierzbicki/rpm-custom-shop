# Architecture
2026-11-26 | W KODZIE
- Next.js 15 App Router (app/), React 19, TypeScript, Node 22, PostgreSQL, Cloudinary, Render. Źródła: package.json, README.md, app/lib/db.ts.
- Jeden pool getDbPool; ręczne produkty rpm_catalog (JSONB), usunięte rpm_catalog_deleted; dostawca rpm_fmic_catalog. app/lib/catalog-db.ts generuje SKU RPM-xxxxx.
- Wspólna taksonomia app/fmic-categories.ts i app/category-routing.ts; filtry app/lib/fmic-facets.ts.
- Publiczne /api/catalog/fmic deleguje do app/api/admin/fmic-preview/route.ts. Kod łączy manual i FMIC przed paginacją; cache zależy m.in. od danych manual. Admin dostawcy pozostaje osobny.
- Kanoniczny PDP /produkt/[slug]/[sku]; app/lib/read-product.ts wywołuje wspólny endpoint produktu, FmicProductPreview prezentuje oba źródła. app/lib/fmic-cart.ts zachowuje różne identyfikatory linii.
- app/api/orders/route.ts przyjmuje productId dla ręcznego katalogu; pełny wspólny checkout pozostaje zadaniem otwartym.
- Wdrożenie main przez Render; status live nie dowodzi poprawności funkcjonalnej. Strona nadal chroniona blokadą dostępu; nie zmieniaj bez uzgodnienia.
