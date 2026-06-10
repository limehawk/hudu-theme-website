// Build themes-data.json from a local hudu-themes checkout.
// Replaces the omarchy site's GitHub scraper: all data lives in one repo.
//
//   HUDU_THEMES_DIR=../hudu-themes node scripts/extract.js
//
// Per theme dir (themes/<slug>/{theme.css,README.md}) we parse:
//  - palette tokens from the README's generated swatch tables
//  - mode (paired light vs synthesized) from the CSS header
//  - upstream credit line + source link from the README
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { hexToHsl } from "./colors.js";

// Hue bucket for filtering, keyed off the theme's dark background (the color
// you actually see most). Mirrors the omarchy site's bucket vocabulary.
function bucketForHex(hex) {
  const { h, s, l } = hexToHsl(hex);
  if (l < 12) return "black";
  if (l > 88) return "white";
  if (s < 12) return "grey";
  if (h < 15 || h >= 345) return "red";
  if (h < 40) return "orange";
  if (h < 65) return "yellow";
  if (h < 150) return "green";
  if (h < 180) return "teal";
  if (h < 200) return "cyan";
  if (h < 250) return "blue";
  if (h < 290) return "purple";
  return "pink";
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const THEMES_DIR = path.resolve(
  process.env.HUDU_THEMES_DIR ?? path.join(ROOT, "../hudu-themes"),
  "themes",
);
const OUT = path.join(ROOT, "src/data/themes-data.json");
// The omarchy site's registry carries per-repo GitHub star counts; join on
// the upstream repo URL so themes can be sorted by upstream popularity.
const OMARCHY_DATA = process.env.OMARCHY_DATA
  ?? path.resolve(ROOT, "../omarchy-theme-website/src/data/themes-data.json");

function loadStars() {
  if (!fs.existsSync(OMARCHY_DATA)) {
    console.warn("[extract] omarchy registry not found — stars default to 0");
    return new Map();
  }
  const reg = JSON.parse(fs.readFileSync(OMARCHY_DATA, "utf8"));
  const stars = new Map();
  for (const t of reg) {
    const key = `${t.github_owner}/${t.github_repo}`.toLowerCase();
    stars.set(key, Math.max(stars.get(key) ?? 0, t.stars ?? 0));
  }
  return stars;
}

function starsFor(sourceUrl, stars) {
  const m = sourceUrl?.match(/github\.com\/([^/]+)\/([^/#?]+)/);
  if (!m) return 0;
  const key = `${m[1]}/${m[2]}`.toLowerCase();
  // The distro repo's stars say nothing about an individual builtin theme's
  // popularity — don't let basecamp builtins drown the community themes.
  if (key === "basecamp/omarchy") return 0;
  return stars.get(key) ?? 0;
}

const HEX = /#[0-9a-fA-F]{6}\b/g;

function parseReadmeTables(md) {
  // Generated READMEs: base table rows "| token | swatch `#HEX` | light | dark |"
  // and accent rows "| Family | `#HEX600` | `#HEX400` |". Flexoki's hand-made
  // README uses the same base shape and a wider accent table; collecting the
  // hexes per row works for both.
  const base = {};
  const accents = {};
  for (const line of md.split("\n")) {
    if (!line.startsWith("|")) continue;
    const cells = line.split("|").map((c) => c.trim());
    const token = cells[1]?.replace(/\s*•$/, "").replace(/\s*\(derived\)$/i, "").toLowerCase();
    // Each swatch cell carries its hex twice (img alt + backtick code); dedupe
    // so hexes[1] is the second *distinct* value (the 400), not a repeat.
    const hexes = [...new Set((line.match(HEX) ?? []).map((h) => h.toUpperCase()))];
    if (!token || hexes.length === 0) continue;
    if (token === "black" || token === "paper" || token.startsWith("base-")) {
      base[token] = hexes[0].toUpperCase();
    } else if (["red", "orange", "yellow", "green", "cyan", "blue", "purple", "magenta"].includes(token)) {
      accents[token] = { 600: hexes[0].toUpperCase(), 400: (hexes[1] ?? hexes[0]).toUpperCase() };
    }
  }
  return { base, accents };
}

function creditFrom(md) {
  // Generated READMEs: credit is the first paragraph after the intro line.
  const lines = md.split("\n");
  const idx = lines.findIndex((l) => /^Palette /.test(l));
  const credit = idx >= 0 ? lines[idx] : null;
  const link = credit?.match(/\((https:\/\/[^)]+)\)/)?.[1] ?? null;
  const owner = credit?.match(/\[([^\]/]+)\//)?.[1] ?? null;
  return { credit_md: credit, source_url: link, owner };
}

function main() {
  const themes = [];
  const starsMap = loadStars();
  for (const slug of fs.readdirSync(THEMES_DIR).sort()) {
    const dir = path.join(THEMES_DIR, slug);
    const cssPath = path.join(dir, "theme.css");
    if (!fs.existsSync(cssPath)) continue;
    const css = fs.readFileSync(cssPath, "utf8");
    const md = fs.existsSync(path.join(dir, "README.md"))
      ? fs.readFileSync(path.join(dir, "README.md"), "utf8")
      : "";
    const { base, accents } = parseReadmeTables(md);
    if (!base.black || !base.paper || !accents.red) {
      console.warn(`[extract] skipping ${slug}: could not parse palette tables`);
      continue;
    }
    const header = css.slice(0, 400);
    const synthesized = /light (palette|half)[^|]*synthesized/i.test(header) || /light half synthesized/i.test(md);
    const handmade = slug === "flexoki";
    themes.push({
      slug,
      name: slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      handmade,
      modes: synthesized ? "dark-synth" : "light-dark",
      base,
      accents,
      primary: accents.cyan?.["400"] ?? accents.blue["400"],
      bucket: bucketForHex(accents.cyan?.["400"] ?? accents.blue["400"]),
      ...creditFrom(md),
      css_bytes: Buffer.byteLength(css),
    });
    themes[themes.length - 1].stars = starsFor(themes[themes.length - 1].source_url, starsMap);
  }
  fs.writeFileSync(OUT, JSON.stringify(themes, null, 1));
  console.log(`[extract] wrote ${themes.length} themes -> ${path.relative(ROOT, OUT)}`);
}

main();
