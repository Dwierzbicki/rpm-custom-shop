import { chromium } from "playwright";

const sku = (process.argv[2] ?? "").trim();
if (!sku) {
  console.error("Usage: npm run fmic:sku-search -- KSB546");
  process.exit(1);
}

const normalized = sku.toUpperCase();
const searchUrl = `https://fmic.pl/?q=${encodeURIComponent(sku)}`;
const result = { status: "unknown", sku, checked: 0, reason: null, product: null };
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ locale: "pl-PL" });
  const response = await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {});
  const url = page.url();
  const title = await page.title();
  const body = await page.locator("body").innerText().catch(() => "");
  const hrefs = await page.locator("a[href]").evaluateAll((anchors) =>
    anchors.map((a) => ({ text: (a.innerText || "").trim(), href: a.href }))
      .filter((a) => a.href.startsWith("https://fmic.pl/"))
  );
  const matches = hrefs.filter((a) =>
    (a.text + " " + a.href).toUpperCase().includes(normalized)
  );
  result.checked = matches.length;
  const unique = [...new Map(matches.map((m) => [m.href, m])).values()];
  for (const match of unique.slice(0, 12)) {
    const candidate = await browser.newPage({ locale: "pl-PL" });
    try {
      const r = await candidate.goto(match.href, { waitUntil: "domcontentloaded", timeout: 15000 });
      if (!r?.ok()) continue;
      const candidateText = await candidate.locator("body").innerText();
      const exactSku = new RegExp(`(^|[^A-Za-z0-9])${sku.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")}($|[^A-Za-z0-9])`, "i");
      if (exactSku.test(candidateText)) {
        result.status = "found";
        result.product = { title: await candidate.title(), url: candidate.url() };
        result.reason = null;
        break;
      }
    } catch {
      // An inaccessible product page is not proof of absence.
    } finally {
      await candidate.close();
    }
  }
  if (result.status !== "found") {
    const explicitEmpty = /brak wyników|nie znaleziono produktów|nie znaleziono wyników|no results found|0 produktów/i.test(body);
    const expectedSearch = url.includes("q=") || url.includes("/search");
    if (response?.ok() && expectedSearch && explicitEmpty) {
      result.status = "not-found";
    } else {
      result.reason = !response?.ok()
        ? "search_http_error"
        : !expectedSearch
          ? "search_redirect"
          : matches.length
            ? "matching_links_unverified"
            : "no_matching_links_without_explicit_empty_state";
    }
  }
  if (process.env.FMIC_DEBUG === "1") {
    console.error("FMIC SEARCH DEBUG:", JSON.stringify({
      url, title, httpStatus: response?.status() ?? null,
      matches: unique.slice(0, 10), bodyPreview: body.slice(0, 700)
    }, null, 2));
  }
} catch (error) {
  result.reason = "search_error";
  if (process.env.FMIC_DEBUG === "1") console.error(error);
} finally {
  await browser.close();
}
console.log("FMIC SAFE SKU SEARCH:", JSON.stringify(result, null, 2));
