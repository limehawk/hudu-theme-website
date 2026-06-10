import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  homePage,
  browsePage,
  themeDetailPage,
  notFoundPage,
} from "./render.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "out");
const PUBLIC = path.join(ROOT, "public");
const DATA = path.join(ROOT, "src/data/themes-data.json");
// Run `node scripts/extract.js` first to regenerate DATA from the local
// hudu-themes checkout (the `build` npm script chains both).
const HUDU_THEMES = path.resolve(
  process.env.HUDU_THEMES_DIR ?? path.join(ROOT, "../hudu-themes"),
  "themes",
);
const SITE_URL = "https://huduthemes.com";

const FEATURED_SLUGS = [
  "flexoki", "catppuccin", "tokyo-night", "gruvbox", "nord", "kanagawa",
];

const log = (msg) => console.log(`[build] ${msg}`);

function rmrf(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeFile(rel, content) {
  const full = path.join(OUT, rel);
  ensureDir(path.dirname(full));
  fs.writeFileSync(full, content);
}

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    ensureDir(dest);
    for (const entry of fs.readdirSync(src)) {
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
  } else {
    ensureDir(path.dirname(dest));
    fs.copyFileSync(src, dest);
  }
}

// ---------- data selection ----------

function getFeaturedThemes(themes) {
  const bySlug = new Map(themes.map((t) => [t.slug, t]));
  return FEATURED_SLUGS.map((s) => bySlug.get(s)).filter(Boolean);
}

function getPopularThemes(themes, count, exclude) {
  return themes
    .filter((t) => (t.stars ?? 0) > 0 && !exclude.has(t.slug))
    .sort((a, b) => (b.stars ?? 0) - (a.stars ?? 0) || a.name.localeCompare(b.name))
    .slice(0, count);
}

function getRandomThemes(themes, count, exclude) {
  const candidates = themes.filter((t) => !exclude.has(t.slug));
  const seed = new Date().toISOString().slice(0, 10);
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
  const shuffled = [...candidates];
  for (let i = shuffled.length - 1; i > 0; i--) {
    hash = ((hash << 5) - hash + i) | 0;
    const j = (hash >>> 0) % (i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, count);
}

// ---------- sitemap + robots ----------

function sitemapXml(themes) {
  const urls = [
    { loc: `${SITE_URL}/`, changefreq: "weekly", priority: "1.0" },
    { loc: `${SITE_URL}/themes/`, changefreq: "weekly", priority: "0.9" },
    ...themes.map((t) => ({
      loc: `${SITE_URL}/themes/${t.slug}/`,
      changefreq: "weekly",
      priority: "0.8",
    })),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `<url>
  <loc>${u.loc}</loc>
  <changefreq>${u.changefreq}</changefreq>
  <priority>${u.priority}</priority>
</url>`).join("\n")}
</urlset>`;
}

const robotsTxt = `User-agent: *
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml
`;

// ---------- tailwind ----------

function runTailwind() {
  log("running tailwindcss");
  const input = path.join(ROOT, "src/styles.css");
  const output = path.join(OUT, "styles.css");
  execSync(`npx @tailwindcss/cli -i ${input} -o ${output} --minify`, {
    cwd: ROOT,
    stdio: "inherit",
  });
}

// ---------- main ----------

function main() {
  log("clean out/");
  rmrf(OUT);
  ensureDir(OUT);

  log("read themes-data.json");
  const themes = JSON.parse(fs.readFileSync(DATA, "utf8"));
  log(`${themes.length} themes`);

  log("copy public/");
  copyRecursive(PUBLIC, OUT);

  log("render home");
  const featured = getFeaturedThemes(themes);
  const featuredSlugs = new Set(featured.map((t) => t.slug));
  const popular = getPopularThemes(themes, 6, featuredSlugs);
  const excludeSlugs = new Set([...featuredSlugs, ...popular.map((t) => t.slug)]);
  const discover = getRandomThemes(themes, 6, excludeSlugs);
  writeFile("index.html", homePage({ featured, popular, discover }));

  log("render browse");
  const buckets = [...new Set(themes.map((t) => t.bucket))];
  // Author dropdown: owners with >= 2 themes (singletons would triple the
  // list); direct ?author= URLs still work for any owner.
  const ownerCounts = new Map();
  for (const t of themes) {
    if (t.owner) ownerCounts.set(t.owner, (ownerCounts.get(t.owner) ?? 0) + 1);
  }
  const owners = [...ownerCounts.entries()]
    .filter(([, count]) => count >= 2)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
  writeFile("themes/index.html", browsePage({ themes, buckets, owners }));

  log(`render ${themes.length} theme detail pages`);
  for (const theme of themes) {
    writeFile(`themes/${theme.slug}/index.html`, themeDetailPage(theme));
  }

  log("copy theme.css files");
  let copied = 0;
  for (const theme of themes) {
    const src = path.join(HUDU_THEMES, theme.slug, "theme.css");
    if (!fs.existsSync(src)) {
      console.warn(`[build] missing theme.css for ${theme.slug} (${src})`);
      continue;
    }
    const dest = path.join(OUT, "themes", theme.slug, "theme.css");
    ensureDir(path.dirname(dest));
    fs.copyFileSync(src, dest);
    copied++;
  }
  log(`${copied} theme.css files copied`);

  log("render 404");
  writeFile("404.html", notFoundPage());

  log("write sitemap.xml + robots.txt");
  writeFile("sitemap.xml", sitemapXml(themes));
  writeFile("robots.txt", robotsTxt);

  runTailwind();

  log("done");
}

main();
