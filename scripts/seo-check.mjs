import assert from "node:assert/strict";
import http from "node:http";
import { PRODUCTION_SITE_URL, resolveSiteUrl } from "../site.config.mjs";

const baseUrl = process.env.SEO_BASE_URL ?? "http://127.0.0.1:3107";
const canonicalOrigin = (process.env.SEO_CANONICAL_ORIGIN ?? "https://podium.milliondollar.agency").replace(/\/$/, "");

async function request(path) {
  const response = await fetch(new URL(path, baseUrl), { redirect: "manual" });
  return { response, body: await response.text() };
}

function meta(body, attribute, value) {
  const pattern = new RegExp(`<meta[^>]+${attribute}="${value}"[^>]+content="([^"]+)"`, "i");
  return body.match(pattern)?.[1] ?? null;
}

function canonical(body) {
  return body.match(/<link rel="canonical" href="([^"]+)"/i)?.[1] ?? null;
}

function title(body) {
  return body.match(/<title>(.*?)<\/title>/is)?.[1] ?? null;
}

function jsonLd(body) {
  return [...body.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)].map((match) =>
    JSON.parse(match[1])
  );
}

async function assertHostRedirect(path) {
  const target = new URL(baseUrl);
  if (target.protocol !== "http:") return;

  const result = await new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: target.hostname,
        port: target.port,
        path,
        method: "GET",
        headers: { Host: "leaderboard-mda.vercel.app" },
      },
      (response) => {
        response.resume();
        response.on("end", () => resolve(response));
      }
    );
    req.on("error", reject);
    req.end();
  });

  assert.equal(result.statusCode, 308, "Vercel alias should redirect permanently");
  assert.equal(result.headers.location, `${canonicalOrigin}${path}`, "Vercel alias should preserve path and query");
}

const home = await request("/");
assert.equal(home.response.status, 200);
assert.equal(title(home.body), "The Podium | Sponsored Service Provider Leaderboards");
assert.equal(canonical(home.body), canonicalOrigin);
assert.equal(meta(home.body, "property", "og:url"), canonicalOrigin);
assert.equal(meta(home.body, "property", "og:image"), `${canonicalOrigin}/og-image.jpg`);
assert.equal(meta(home.body, "property", "og:image:width"), "1200");
assert.equal(meta(home.body, "property", "og:image:height"), "630");
assert.match(home.body, /<link rel="icon"[^>]+sizes="512x512"/);
assert.match(home.body, /<link rel="apple-touch-icon"[^>]+sizes="180x180"/);
assert.match(home.body, /<h1[^>]*>Sponsored service provider leaderboards<\/h1>/);
assert.match(
  home.body,
  /Claim #(?:<!-- -->)?1/,
  "Homepage claim interface must be present in server-rendered HTML",
);
assert.match(home.body, /<label for="claim-destination-link"/, "Claim URL field must have a programmatic label");
assert.match(home.body, /<nav aria-label="Primary"/);
assert.match(home.body, /<nav aria-label="Service categories"/);
assert.match(home.body, /application\/ld\+json/);
assert.match(home.body, /<link rel="describedby" href="\/llms\.txt"/);
assert.match(home.body, /href="\/categories\//, "Homepage must expose crawlable category links");
assert.match(home.body, /rel="sponsored ugc nofollow noopener noreferrer"/, "Paid listings must be qualified");
assert.doesNotMatch(home.body, /fonts\.googleapis\.com|app\.lemonsqueezy\.com\/js\/lemon\.js/);
assert.ok(jsonLd(home.body).some((item) => item["@type"] === "WebSite"));
assert.ok(jsonLd(home.body).some((item) => item["@type"] === "CollectionPage"));
assert.ok(jsonLd(home.body).every((item) => !("numberOfItems" in item)), "CollectionPage must not use ItemList-only properties");

const sitemap = await request("/sitemap.xml");
assert.equal(sitemap.response.status, 200);
assert.doesNotMatch(sitemap.body, /localhost|\?category=|\/manage\/|\/admin|\/claim|\/success|\/r\//);
const categoryPath = sitemap.body.match(/<loc>[^<]+(\/categories\/[^<]+)<\/loc>/)?.[1];
assert.ok(categoryPath, "Sitemap must contain at least one category path");

const category = await request(categoryPath);
assert.equal(category.response.status, 200);
assert.equal(canonical(category.body), `${canonicalOrigin}${categoryPath}`);
assert.equal(meta(category.body, "property", "og:url"), `${canonicalOrigin}${categoryPath}`);
assert.match(title(category.body), /Service Providers Leaderboard \| The Podium$/);
assert.match(category.body, /<h1[^>]*>[^<]+ service provider leaderboard<\/h1>/);
assert.match(category.body, /BreadcrumbList|CollectionPage/);
assert.match(category.body, /href="\/categories\//);
const categoryGraph = jsonLd(category.body).find((item) => Array.isArray(item["@graph"]))?.["@graph"];
assert.ok(categoryGraph?.some((item) => item["@type"] === "CollectionPage"));
assert.ok(categoryGraph?.some((item) => item["@type"] === "BreadcrumbList"));
assert.ok(categoryGraph?.every((item) => !("numberOfItems" in item)));

const slug = categoryPath.split("/").pop();
const legacy = await request(`/?category=${slug}`);
assert.equal(legacy.response.status, 308);
assert.equal(legacy.response.headers.get("location"), categoryPath);

const legacyAll = await request("/?category=all");
assert.equal(legacyAll.response.status, 308);
assert.equal(legacyAll.response.headers.get("location"), "/");

const firstPage = await request(`${categoryPath}?page=1`);
assert.equal(firstPage.response.status, 308);
assert.equal(firstPage.response.headers.get("location"), categoryPath);

assert.equal((await request("/?page=invalid")).response.status, 404);
assert.equal((await request("/categories/not-a-real-category")).response.status, 404);
assert.equal((await request(`${categoryPath}?page=999999`)).response.status, 404);
assert.equal((await request(`/?category=${slug}&page=999999`)).response.status, 404);
assert.equal((await request("/?category=all&page=999999")).response.status, 404);

for (const [path, expectedTitle] of [
  ["/rules", "Leaderboard Rules | The Podium"],
  ["/terms", "Terms of Service | The Podium"],
  ["/privacy", "Privacy Notice | The Podium"],
  ["/refunds", "Refund Policy | The Podium"],
]) {
  const page = await request(path);
  assert.equal(page.response.status, 200);
  assert.equal(title(page.body), expectedTitle);
  assert.equal(canonical(page.body), `${canonicalOrigin}${path}`);
  assert.equal(meta(page.body, "property", "og:url"), `${canonicalOrigin}${path}`);
}

for (const [path, expected] of [
  [`/claim?category=${slug}`, "noindex, follow"],
  ["/admin/login", "noindex, nofollow"],
  ["/manage/not-a-real-token", "noindex, nofollow"],
  ["/success", "noindex, nofollow"],
]) {
  const page = await request(path);
  assert.equal(meta(page.body, "name", "robots"), expected, `${path} should be excluded from indexing`);
  if (path.startsWith("/manage/") || path === "/success") {
    assert.equal(page.response.headers.get("x-robots-tag"), "noindex, nofollow");
  }
}

const claim = await request(`/claim?category=${slug}`);
assert.match(claim.body, /app\.lemonsqueezy\.com\/js\/lemon\.js/);

const robots = await request("/robots.txt");
assert.equal(robots.response.status, 200);
assert.match(robots.body, /User-Agent: OAI-SearchBot/);
assert.match(robots.body, /Disallow: \/manage\//);
assert.match(robots.body, /Disallow: \/api\//);
assert.match(robots.body, /Disallow: \/r\//);
assert.doesNotMatch(robots.body, /Disallow: \/admin/);
assert.match(robots.body, new RegExp(`Sitemap: ${canonicalOrigin.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\/sitemap\\.xml`));

const llms = await request("/llms.txt");
assert.equal(llms.response.status, 200);
assert.match(llms.response.headers.get("content-type") ?? "", /^text\/plain/);
assert.match(llms.body, /^# The Podium\n/);
assert.match(llms.body, /## Leaderboards\n\n- \[/);
assert.match(llms.body, /## How it works\n\n- \[/);
assert.match(llms.body, /## Policies\n\n- \[/);
assert.doesNotMatch(llms.body, /localhost|\?category=/);
assert.match(llms.body, new RegExp(`\\(${canonicalOrigin.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}${categoryPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\)`));

const clickRedirect = await request("/r/not-a-uuid");
assert.equal(clickRedirect.response.status, 307);
assert.equal(clickRedirect.response.headers.get("x-robots-tag"), "noindex, nofollow");

const apiResponse = await request("/api/pricing/not-a-real-category");
assert.equal(apiResponse.response.headers.get("x-robots-tag"), "noindex, nofollow");

assert.equal(resolveSiteUrl({ NODE_ENV: "development" }), "http://localhost:3000");
assert.equal(
  resolveSiteUrl({ NODE_ENV: "production", NEXT_PUBLIC_SITE_URL: PRODUCTION_SITE_URL }),
  PRODUCTION_SITE_URL
);
assert.throws(() => resolveSiteUrl({ NODE_ENV: "production" }), /must be set/);
assert.throws(
  () => resolveSiteUrl({ NODE_ENV: "production", NEXT_PUBLIC_SITE_URL: "http://localhost:3000" }),
  /Production metadata must use/
);

await assertHostRedirect(`${categoryPath}?utm_source=seo-check`);

console.log(`SEO checks passed for ${baseUrl} using ${categoryPath}.`);
