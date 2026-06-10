import { marked } from "marked";
import sanitizeHtml from "sanitize-html";
import { BUCKET_COLORS, hexToRgba } from "./colors.js";

// ---------- primitives ----------

export function escapeHtml(str) {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const attr = (v) => escapeHtml(v);

const THEMES_REPO = "https://github.com/limehawk/hudu-themes";

// ---------- shell ----------

const HEAD_FONTS = `
<link rel="preload" href="/fonts/jetbrains-mono-latin.woff2" as="font" type="font/woff2" crossorigin>
`.trim();

export function layout({ title, description, path, body }) {
  const fullTitle = title === "home"
    ? "Hudu Themes — Drop-in CSS Themes for Hudu"
    : `${title} | Hudu Themes`;
  const desc = description ?? "Drop-in CSS themes for Hudu. Browse 260+ color schemes, preview light and dark modes, and paste one stylesheet into Hudu's Custom CSS.";
  const canonical = `https://huduthemes.com${path}`;

  return `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(fullTitle)}</title>
<meta name="description" content="${attr(desc)}">
<link rel="canonical" href="${attr(canonical)}">
<link rel="icon" href="/favicon.ico">
<meta property="og:type" content="website">
<meta property="og:title" content="${attr(fullTitle)}">
<meta property="og:description" content="${attr(desc)}">
<meta property="og:url" content="${attr(canonical)}">
<meta property="og:site_name" content="Hudu Themes">
<meta name="twitter:card" content="summary">
${HEAD_FONTS}
<link rel="stylesheet" href="/styles.css">
</head>
<body class="font-sans antialiased min-h-screen flex flex-col">
${header()}
<main class="flex-1">${body}</main>
${footer()}
<script src="/app.js" defer></script>
</body>
</html>`;
}

function header() {
  return `<header class="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
  <div class="mx-auto max-w-6xl flex items-center justify-between px-6 h-14">
    <a href="/" class="flex items-center gap-2 font-mono text-sm tracking-tight text-foreground hover:text-foreground/80 transition-colors">
      <svg viewBox="0 0 32 32" class="size-5" aria-hidden="true">
        <rect width="32" height="32" rx="6" fill="currentColor" opacity="0.15"/>
        <rect x="4" y="6" width="10" height="10" rx="2" fill="#22c55e"/>
        <rect x="18" y="6" width="10" height="10" rx="2" fill="#a855f7"/>
        <rect x="4" y="18" width="10" height="10" rx="2" fill="#3b82f6"/>
        <rect x="18" y="18" width="10" height="10" rx="2" fill="#f97316"/>
      </svg>
      <span class="font-semibold">hudu themes</span>
    </a>
    <nav class="flex items-center gap-6">
      <a href="/themes/" class="font-mono text-xs text-muted-foreground hover:text-foreground transition-colors">browse</a>
      <a href="${THEMES_REPO}" target="_blank" rel="noopener noreferrer" class="font-mono text-xs text-muted-foreground hover:text-foreground transition-colors">github</a>
    </nav>
  </div>
</header>`;
}

function footer() {
  return `<footer class="border-t border-border/50 mt-auto">
  <div class="mx-auto max-w-6xl px-6 py-8 flex flex-col gap-6">
    <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
      <p class="font-mono text-xs text-muted-foreground sm:flex-1">
        <a href="/" class="hover:text-foreground transition-colors">hudu themes</a>
      </p>
      <a href="https://limehawk.io" target="_blank" rel="noopener noreferrer" class="group flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors">
        <span class="text-xs uppercase tracking-[0.3em] font-thin">A</span>
        <span class="text-2xl text-green-500 group-hover:text-green-400 transition-colors" style="font-family: 'Workbench', system-ui;">LIMEHAWK</span>
        <span class="text-xs uppercase tracking-[0.3em] font-thin">Project</span>
      </a>
      <div class="flex items-center justify-end gap-6 sm:flex-1">
        <a href="https://hudu.com/" target="_blank" rel="noopener noreferrer" class="font-mono text-xs text-muted-foreground hover:text-foreground transition-colors">hudu</a>
        <a href="${THEMES_REPO}" target="_blank" rel="noopener noreferrer" class="font-mono text-xs text-muted-foreground hover:text-foreground transition-colors">theme repo</a>
      </div>
    </div>
    <p class="text-center text-[10px] text-muted-foreground/60 leading-relaxed">
      This is an independent community site, not affiliated with or endorsed by Hudu Technologies. Theme palettes belong to their respective upstream authors. All trademarks belong to their respective owners.
    </p>
  </div>
</footer>`;
}

// ---------- mock Hudu dashboard preview ----------

// Resolve palette tokens for one mode. Dark uses the raw dark ramp + 400
// accents; light mirrors it on the paper side with 600 accents.
function modeTokens(theme, mode) {
  const b = theme.base;
  const dark = mode === "dark";
  return {
    bg: dark ? b.black : b.paper,
    nav: dark ? b["base-900"] : b["base-50"],
    sidebar: dark ? b["base-950"] : b["base-50"],
    card: dark ? b["base-950"] : b["base-50"],
    cardBorder: dark ? b["base-800"] : b["base-100"],
    border: dark ? b["base-900"] : b["base-100"],
    text: dark ? b["base-200"] : b.black,
    muted: dark ? b["base-500"] : b["base-600"],
    faint: dark ? b["base-700"] : b["base-300"],
    accents: ["red", "orange", "yellow", "green", "cyan", "blue", "purple", "magenta"]
      .map((f) => theme.accents[f]?.[dark ? "400" : "600"])
      .filter(Boolean),
  };
}

// A fake Hudu *admin page* rendered purely from palette tokens via inline
// styles: top nav, left sidebar, then color-coded admin sections — an
// accent-tinted header pill over a grid of icon tiles, the way the themes
// style Hudu's Admin screen — plus a row of all 8 accent dots. No
// screenshots, no per-theme CSS classes.
export function mockDashboard(theme, mode, { large = false } = {}) {
  const t = modeTokens(theme, mode);
  const dark = mode === "dark";
  const px = (n) => `${large ? Math.round(n * 1.6) : n}px`;

  const bar = (color, widthPct, h = 5) =>
    `<div style="background:${escapeHtml(color)};width:${widthPct}%;height:${px(h)};border-radius:9999px"></div>`;

  const tile = (accent, w) =>
    `<div style="display:flex;align-items:center;gap:${px(5)};min-width:0">
      <div style="background:${escapeHtml(accent)};width:${px(5)};height:${px(5)};border-radius:${px(1.5)};flex-shrink:0"></div>
      <div style="background:${escapeHtml(t.muted)};width:${w}%;height:${px(3.5)};border-radius:9999px"></div>
    </div>`;

  const section = (family, headerPct, widths) => {
    const accent = theme.accents[family]?.[dark ? "400" : "600"] ?? theme.primary;
    const tiles = widths.map((w) => tile(accent, w)).join("");
    return `<div style="display:flex;flex-direction:column;gap:${px(5)};min-width:0">
      <div style="background:${escapeHtml(hexToRgba(accent, 0.14))};border-radius:${px(4)};padding:${px(4)} ${px(7)}">
        <div style="background:${escapeHtml(accent)};width:${headerPct}%;height:${px(4)};border-radius:9999px"></div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:${px(5)} ${px(9)};padding:0 ${px(3)}">${tiles}</div>
    </div>`;
  };

  const sections = [
    section("cyan", 22, [78, 60, 70, 55, 82, 64]),
    section("blue", 30, [66, 80, 58]),
    section("orange", 26, [72, 56, 78]),
  ].join("");

  const dots = t.accents
    .map((c) => `<div style="background:${escapeHtml(c)};width:${px(7)};height:${px(7)};border-radius:9999px"></div>`)
    .join("");

  const sidebarRows = [70, 55, 80, 45, 60]
    .map((w, i) => bar(i === 0 ? t.muted : t.faint, w, 4))
    .join("");

  return `<div style="background:${escapeHtml(t.bg)};border-radius:${px(8)};overflow:hidden;width:100%;aspect-ratio:16/10;display:flex;flex-direction:column">
  <div style="background:${escapeHtml(t.nav)};border-bottom:1px solid ${escapeHtml(t.border)};height:${px(16)};display:flex;align-items:center;gap:${px(6)};padding:0 ${px(10)};flex-shrink:0">
    <div style="background:${escapeHtml(theme.primary)};width:${px(7)};height:${px(7)};border-radius:${px(2)};flex-shrink:0"></div>
    <div style="background:${escapeHtml(t.muted)};width:18%;height:${px(4)};border-radius:9999px"></div>
    <div style="background:${escapeHtml(t.faint)};width:10%;height:${px(4)};border-radius:9999px"></div>
    <div style="background:${escapeHtml(t.faint)};width:10%;height:${px(4)};border-radius:9999px"></div>
  </div>
  <div style="display:flex;flex:1;min-height:0">
    <div style="background:${escapeHtml(t.sidebar)};border-right:1px solid ${escapeHtml(t.border)};width:22%;padding:${px(8)};display:flex;flex-direction:column;gap:${px(7)};flex-shrink:0">${sidebarRows}</div>
    <div style="flex:1;padding:${px(10)};display:flex;flex-direction:column;gap:${px(9)};min-width:0">
      ${sections}
      <div style="display:flex;gap:${px(5)};align-items:center;margin-top:auto">${dots}</div>
    </div>
  </div>
</div>`;
}

// ---------- mini-replica of Hudu's real Admin page ----------

// Section banners + tiles as they appear on Hudu's Admin screen. Banner
// accent families are fixed (cyan/blue/red) and resolved per mode.
const ADMIN_SECTIONS = [
  {
    title: "BASIC SETUP",
    family: "cyan",
    tiles: ["General Settings", "Security", "Hudini", "Design", "Portal", "Users"],
  },
  {
    title: "CORE",
    family: "blue",
    tiles: ["Asset Layouts", "Process Templates", "Lists", "IPAM", "Racks", "Password Folders", "Flags"],
  },
  {
    title: "ACCOUNT ADMINISTRATION",
    family: "red",
    tiles: ["Integrations", "External Apps", "Hudu Bridge", "Import Data", "Export Data", "API Keys", "Email Setup"],
  },
];

// One consistent icon approach: tiny accent-tinted rounded squares holding a
// monochrome text glyph colored with the accent (no emoji — they don't theme).
const GLYPHS = ["⚙", "✦", "◆", "▣", "◈", "✚", "●", "▲", "■", "♦", "✱", "◐", "▤", "◧", "◎", "✷", "◍", "☰", "⬗", "◭"];

const REPLICA_BASE_TOKENS = [
  "black", "paper", "base-950", "base-900", "base-800", "base-700",
  "base-600", "base-500", "base-300", "base-200", "base-100", "base-50",
];

function adminReplicaAccents(theme, mode) {
  if (!REPLICA_BASE_TOKENS.every((k) => theme.base?.[k])) return null;
  if (!theme.primary) return null;
  const sub = mode === "dark" ? "400" : "600";
  const accents = {};
  for (const f of ["cyan", "blue", "red"]) {
    const hex = theme.accents?.[f]?.[sub];
    if (!hex) return null;
    accents[f] = hex;
  }
  return accents;
}

// Faithful mini Hudu Admin page rendered from palette tokens via inline
// styles. Same container API as mockDashboard (16/10, full width); falls
// back to the abstract mockDashboard when a needed token is missing.
export function adminPreview(theme, mode, { large = false } = {}) {
  const sectionAccents = adminReplicaAccents(theme, mode);
  if (!sectionAccents) return mockDashboard(theme, mode, { large });

  const t = modeTokens(theme, mode);
  const px = (n) => `${large ? Math.round(n * 1.6 * 10) / 10 : n}px`;
  let glyphIdx = 0;
  const nextGlyph = () => GLYPHS[glyphIdx++ % GLYPHS.length];

  const clip = "white-space:nowrap;overflow:hidden;text-overflow:ellipsis";

  // --- top nav ---
  const navItem = (label) =>
    `<span style="color:${escapeHtml(t.muted)};font-size:${px(5)};${clip}">${escapeHtml(label)}</span>`;
  const adminItem = `<span style="color:${escapeHtml(t.text)};font-size:${px(5)};font-weight:700;background:${escapeHtml(hexToRgba(theme.primary, 0.14))};border-bottom:${px(1.5)} solid ${escapeHtml(theme.primary)};border-radius:${px(2)} ${px(2)} 0 0;padding:${px(2)} ${px(4)};${clip}">Admin</span>`;
  const searchBox = `<div style="margin-left:auto;background:${escapeHtml(t.bg)};border:1px solid ${escapeHtml(t.cardBorder)};border-radius:9999px;width:20%;height:${px(8)};display:flex;align-items:center;gap:${px(3)};padding:0 ${px(5)};flex-shrink:0">
    <span style="color:${escapeHtml(t.faint)};font-size:${px(4.5)};line-height:1">⌕</span>
    <div style="background:${escapeHtml(t.faint)};width:55%;height:${px(2.5)};border-radius:9999px"></div>
  </div>`;
  const nav = `<div style="background:${escapeHtml(t.nav)};border-bottom:1px solid ${escapeHtml(t.border)};height:${px(17)};display:flex;align-items:center;gap:${px(7)};padding:0 ${px(8)};flex-shrink:0">
    <span style="color:${escapeHtml(theme.primary)};font-size:${px(5.5)};font-weight:800;letter-spacing:0.08em;max-width:18%;${clip}">${escapeHtml(theme.name.toUpperCase())}</span>
    ${navItem("Companies")}${navItem("Global")}${navItem("Central KB")}${navItem("My Vault")}${adminItem}
    ${searchBox}
  </div>`;

  // --- left sidebar: grouped nav ---
  const sidebarGroups = [
    { label: "BASIC SETUP", rows: ["General Settings", "Security", "Hudini", "Design", "Portal", "Users"] },
    { label: "CORE", rows: ["Asset Layouts", "Process Templates", "Lists"] },
    { label: "ACCOUNT ADMINISTR…", rows: ["Integrations", "External Apps"] },
  ];
  const sidebar = sidebarGroups.map((g, gi) => {
    const rows = (large ? g.rows : g.rows.slice(0, gi === 0 ? 4 : 2)).map((label) =>
      `<div style="display:flex;align-items:center;gap:${px(3)};min-width:0">
        <span style="color:${escapeHtml(t.muted)};font-size:${px(4.5)};line-height:1;flex-shrink:0">${nextGlyph()}</span>
        <span style="color:${escapeHtml(t.text)};font-size:${px(5)};${clip}">${escapeHtml(label)}</span>
      </div>`
    ).join("");
    return `<div style="display:flex;flex-direction:column;gap:${px(3.5)};min-width:0">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:${px(2)};min-width:0">
        <span style="color:${escapeHtml(t.muted)};font-size:${px(4)};font-weight:700;letter-spacing:0.08em;${clip}">${escapeHtml(g.label)}</span>
        <span style="color:${escapeHtml(t.faint)};font-size:${px(4)};line-height:1;flex-shrink:0">▾</span>
      </div>
      ${rows}
    </div>`;
  }).join("");

  // --- main: Admin heading + banner/tile sections ---
  const tile = (label, accent) =>
    `<div style="background:${escapeHtml(t.card)};border:1px solid ${escapeHtml(t.cardBorder)};border-radius:${px(3)};padding:${px(3)} ${px(4)};display:flex;align-items:center;gap:${px(3)};min-width:0">
      <span style="background:${escapeHtml(hexToRgba(accent, 0.16))};color:${escapeHtml(accent)};font-size:${px(4.5)};line-height:1;border-radius:${px(1.5)};width:${px(8)};height:${px(8)};display:flex;align-items:center;justify-content:center;flex-shrink:0">${nextGlyph()}</span>
      <span style="color:${escapeHtml(t.text)};font-size:${px(5)};font-weight:700;${clip}">${escapeHtml(label)}</span>
    </div>`;

  const sections = ADMIN_SECTIONS.map((s) => {
    const accent = sectionAccents[s.family];
    const tiles = (large ? s.tiles : s.tiles.slice(0, 3)).map((l) => tile(l, accent)).join("");
    return `<div style="display:flex;flex-direction:column;gap:${px(4)};min-width:0">
      <div style="background:${escapeHtml(hexToRgba(accent, 0.18))};border-radius:${px(3)};padding:${px(3)} ${px(6)}">
        <span style="color:${escapeHtml(accent)};font-size:${px(4.5)};font-weight:800;letter-spacing:0.1em;${clip};display:block">${escapeHtml(s.title)}</span>
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:${px(4)}">${tiles}</div>
    </div>`;
  }).join("");

  const main = `<div style="flex:1;padding:${px(8)} ${px(9)};display:flex;flex-direction:column;gap:${px(6)};min-width:0;overflow:hidden">
    <span style="color:${escapeHtml(t.text)};font-size:${px(9)};font-weight:800;line-height:1;${clip}">Admin</span>
    ${sections}
  </div>`;

  return `<div style="background:${escapeHtml(t.bg)};border-radius:${px(8)};overflow:hidden;width:100%;aspect-ratio:16/10;display:flex;flex-direction:column;font-family:ui-sans-serif,system-ui,sans-serif">
  ${nav}
  <div style="display:flex;flex:1;min-height:0">
    <div style="background:${escapeHtml(t.sidebar)};border-right:1px solid ${escapeHtml(t.border)};width:22%;padding:${px(7)} ${px(6)};display:flex;flex-direction:column;gap:${px(7)};flex-shrink:0;overflow:hidden">${sidebar}</div>
    ${main}
  </div>
</div>`;
}

// ---------- badges ----------

function modeBadgeText(theme) {
  return theme.modes === "light-dark" ? "light + dark" : "dark + synthesized light";
}

function modeBadge(theme) {
  return `<span class="badge-outline font-mono text-[10px] whitespace-nowrap">${modeBadgeText(theme)}</span>`;
}

function handmadeBadge(theme) {
  return theme.handmade
    ? `<span class="badge font-mono text-[10px] whitespace-nowrap">hand-made</span>`
    : "";
}

function starCount(theme) {
  return theme.stars > 0
    ? `<span class="inline-flex items-center gap-1 font-mono text-[10px] text-muted-foreground shrink-0" title="${attr(`${theme.stars} stars on GitHub`)}"><svg viewBox="0 0 16 16" width="11" height="11" fill="currentColor" aria-hidden="true" class="shrink-0 -mt-px"><path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.819 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z"></path></svg>${theme.stars}</span>`
    : "";
}

function bucketChip(theme) {
  const color = BUCKET_COLORS[theme.bucket] ?? "#888";
  return `<span class="inline-flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground" title="color: ${attr(theme.bucket)}">
    <span class="size-2.5 rounded-sm border border-white/10 shrink-0" style="background-color:${escapeHtml(color)}"></span>${escapeHtml(theme.bucket)}
  </span>`;
}

// ---------- theme card ----------

export function themeCard(theme) {
  return `<a data-theme-card
  data-name="${attr(theme.name)}"
  data-bucket="${attr(theme.bucket)}"
  data-modes="${attr(theme.modes)}"
  data-stars="${attr(theme.stars ?? 0)}"
  href="/themes/${attr(theme.slug)}/"
  class="theme-card group relative flex flex-col rounded-xl border border-border/40 bg-card overflow-hidden hover:border-[var(--card-accent)] transition-colors"
  style="--card-accent:${escapeHtml(theme.primary)}">
  <div class="relative p-2">${adminPreview(theme, "dark")}</div>
  <div class="p-3 pt-1 space-y-1.5 grow">
    <div class="flex items-start justify-between gap-2">
      <h3 class="font-mono text-sm font-medium text-foreground truncate">${escapeHtml(theme.name)}</h3>
      ${handmadeBadge(theme)}
    </div>
    <div class="flex items-center justify-between gap-2">
      <div class="flex items-center gap-2 min-w-0">
        ${bucketChip(theme)}
        ${starCount(theme)}
      </div>
      ${modeBadge(theme)}
    </div>
  </div>
</a>`;
}

// ---------- palette section ----------

const BASE_ORDER = [
  "black", "base-950", "base-900", "base-850", "base-800", "base-700",
  "base-600", "base-500", "base-300", "base-200", "base-150", "base-100",
  "base-50", "paper",
];

const ACCENT_ORDER = ["red", "orange", "yellow", "green", "cyan", "blue", "purple", "magenta"];

function paletteSection(theme) {
  const ramp = BASE_ORDER.filter((k) => theme.base[k]).map((k) =>
    `<div class="flex-1 h-10 first:rounded-l-lg last:rounded-r-lg" style="background-color:${escapeHtml(theme.base[k])}" title="${attr(`${k}: ${theme.base[k]}`)}"></div>`
  ).join("");

  const accents = ACCENT_ORDER.filter((f) => theme.accents[f]).map((f) => {
    const a = theme.accents[f];
    return `<div class="space-y-1.5">
      <p class="font-mono text-[10px] text-muted-foreground">${escapeHtml(f)}</p>
      <div class="flex rounded-md overflow-hidden border border-white/10">
        <div class="flex-1 h-8" style="background-color:${escapeHtml(a["600"])}" title="${attr(`${f}-600: ${a["600"]}`)}"></div>
        <div class="flex-1 h-8" style="background-color:${escapeHtml(a["400"])}" title="${attr(`${f}-400: ${a["400"]}`)}"></div>
      </div>
      <p class="font-mono text-[9px] text-muted-foreground/50">${escapeHtml(a["600"])} / ${escapeHtml(a["400"])}</p>
    </div>`;
  }).join("");

  return `<div class="space-y-3">
    <h2 class="font-mono text-xs text-muted-foreground uppercase tracking-wider">palette</h2>
    <div class="border border-border/40 rounded-xl bg-card p-6 space-y-6">
      <div class="space-y-2">
        <p class="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">base ramp — black → paper</p>
        <div class="flex border border-white/10 rounded-lg overflow-hidden">${ramp}</div>
      </div>
      <div class="space-y-2">
        <p class="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">accents — 600 (light) / 400 (dark)</p>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">${accents}</div>
      </div>
    </div>
  </div>`;
}

// ---------- credit markdown ----------

const SANITIZE_OPTS = {
  allowedTags: ["p", "a", "strong", "em", "code"],
  allowedAttributes: { a: ["href", "title", "target", "rel"] },
  allowedSchemes: ["http", "https", "mailto"],
  transformTags: {
    a: (tag, attrs) => ({
      tagName: "a",
      attribs: { ...attrs, target: "_blank", rel: "noopener noreferrer" },
    }),
  },
};

export function renderCredit(creditMd) {
  if (!creditMd) return "";
  const rawHtml = marked.parse(creditMd, { gfm: true, breaks: false });
  const sanitized = sanitizeHtml(rawHtml, SANITIZE_OPTS);
  return `<div class="credit-md text-xs text-muted-foreground leading-relaxed break-words">${sanitized}</div>`;
}

// ---------- pages ----------

export function homePage({ featured, popular, discover }) {
  const heroButtons = `<div class="flex flex-wrap items-center gap-3 pt-2">
    <a href="/themes/" class="btn-primary inline-flex items-center gap-2 font-mono px-3 h-8 rounded-md">browse themes <span aria-hidden="true">→</span></a>
    <a href="${THEMES_REPO}" target="_blank" rel="noopener noreferrer" class="btn-outline inline-flex items-center gap-2 font-mono px-3 h-8 rounded-md">view on github</a>
  </div>`;

  const section = (title, themes, viewAll) => themes.length === 0 ? "" : `<section class="pb-20">
    <div class="flex items-center justify-between mb-6">
      <h2 class="font-mono text-xs text-muted-foreground uppercase tracking-wider">${title}</h2>
      <a href="${viewAll}" class="font-mono text-xs text-muted-foreground hover:text-foreground transition-colors">view all →</a>
    </div>
    <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">${themes.map(themeCard).join("")}</div>
  </section>`;

  const body = `<div class="mx-auto max-w-6xl px-6">
  <section class="py-20 sm:py-28">
    <div class="max-w-2xl space-y-6">
      <h1 class="font-mono text-3xl sm:text-4xl font-bold tracking-tight text-foreground">drop-in CSS themes for Hudu</h1>
      <p class="text-base sm:text-lg text-muted-foreground leading-relaxed">
        Restyle your
        <a href="https://hudu.com/" target="_blank" rel="noopener noreferrer" class="text-foreground underline underline-offset-4 decoration-foreground/30 hover:decoration-foreground/60 transition-colors">Hudu</a>
        instance with one pasted stylesheet. 260+ color schemes ported from
        popular terminal and editor palettes, each with light and dark modes.
      </p>
      ${heroButtons}
    </div>
  </section>
  ${section("featured themes", featured, "/themes/")}
  ${section("popular", popular, "/themes/")}
  ${section("discover", discover, "/themes/")}
  <section class="pb-20 text-center">
    <a href="/themes/" class="btn-primary inline-flex items-center gap-2 font-mono px-3 h-8 rounded-md">browse all themes <span aria-hidden="true">→</span></a>
  </section>
</div>`;

  return layout({ title: "home", path: "/", body });
}

export function browsePage({ themes, buckets }) {
  // Bake the default sort (popular: stars desc, then name asc) into the HTML
  // so a default page load needs no JS reorder.
  const sorted = [...themes].sort(
    (a, b) => (b.stars ?? 0) - (a.stars ?? 0) || a.name.localeCompare(b.name),
  );
  const colorButtons = buckets.map((bucket) =>
    `<button type="button" name="color" value="${bucket}" title="${bucket}" class="color-dot size-4 rounded-sm shrink-0 transition-all" style="background-color:${BUCKET_COLORS[bucket] ?? "#888"}"></button>`
  ).join("");

  const filterPill = (name, value, label) =>
    `<button type="button" name="${name}" value="${value}" class="pill">${escapeHtml(label)}</button>`;

  const body = `<div class="mx-auto max-w-6xl px-6 py-10 space-y-8">
  <div>
    <h1 class="font-mono text-2xl font-bold tracking-tight text-foreground">themes</h1>
    <p class="mt-1 font-mono text-sm text-muted-foreground" data-theme-count>${sorted.length} theme${sorted.length !== 1 ? "s" : ""} available</p>
  </div>

  <div class="lg:sticky lg:top-14 z-30 -mx-6 px-6 py-4 bg-background/80 backdrop-blur-md border-b border-border/40 space-y-4">
    <div class="flex flex-col sm:flex-row gap-3">
      <div class="flex-1 relative">
        <input type="search" name="q" placeholder="find a theme..." autocomplete="off" class="w-full font-mono text-sm pl-3 pr-8 h-9 rounded-md border border-border/60 bg-input/40 focus:outline-none focus:ring-1 focus:ring-ring">
        <button type="button" data-clear="q" hidden class="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors font-mono text-sm leading-none size-5 inline-flex items-center justify-center rounded hover:bg-foreground/10" aria-label="Clear theme search">×</button>
      </div>
    </div>

    <div class="flex flex-wrap items-start gap-x-6 gap-y-3">
      <div class="space-y-1.5">
        <span class="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">modes</span>
        <div class="flex flex-wrap items-center gap-2">
          ${filterPill("mode", "", "all")}
          ${filterPill("mode", "light-dark", "light + dark")}
          ${filterPill("mode", "dark-synth", "dark + synthesized light")}
        </div>
      </div>
      <div class="space-y-1.5">
        <span class="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">sort</span>
        <div class="flex flex-wrap items-center gap-2">
          ${filterPill("sort", "popular", "popular")}
          ${filterPill("sort", "name", "name")}
        </div>
      </div>
      <div class="space-y-1.5">
        <span class="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">color</span>
        <div class="flex flex-wrap items-center gap-2">
          <button type="button" data-color-all class="pill">all</button>
          ${colorButtons}
        </div>
      </div>
    </div>
  </div>

  <div data-theme-grid class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
    ${sorted.map((t) => themeCard(t)).join("")}
  </div>
  <div data-theme-empty hidden class="py-20 text-center">
    <p class="font-mono text-sm text-muted-foreground">no themes found</p>
  </div>
</div>`;

  return layout({
    title: "Browse Themes",
    description: "Browse all Hudu CSS themes — filter by color and mode, preview palettes, copy one stylesheet.",
    path: "/themes/",
    body,
  });
}

function installSection(theme) {
  const steps = [
    `Copy the CSS with the button below (or download <code class="bg-muted/50 px-1 py-0.5 rounded font-mono text-[11px]">theme.css</code>).`,
    `In Hudu, go to <strong class="text-foreground">Admin → Design → Custom CSS</strong> and paste it in.`,
    `Save, then hard-refresh your browser (<code class="bg-muted/50 px-1 py-0.5 rounded font-mono text-[11px]">Ctrl/Cmd+Shift+R</code>).`,
  ];
  const stepsHtml = steps.map((s, i) =>
    `<li class="flex gap-3">
      <span class="font-mono text-xs text-muted-foreground shrink-0 size-5 inline-flex items-center justify-center rounded-full border border-border/60">${i + 1}</span>
      <span class="text-sm text-muted-foreground leading-relaxed">${s}</span>
    </li>`
  ).join("");

  const kb = theme.css_bytes ? ` (${Math.round(theme.css_bytes / 1024)} KB)` : "";

  return `<div class="space-y-2">
    <h2 class="font-mono text-xs text-muted-foreground uppercase tracking-wider">install</h2>
    <div class="border border-border/40 rounded-xl bg-card p-5 space-y-4">
      <ol class="space-y-3">${stepsHtml}</ol>
      <div class="border border-yellow-500/30 bg-yellow-500/5 rounded-lg p-3 text-xs text-muted-foreground leading-relaxed">
        <span class="font-mono text-yellow-500 uppercase tracking-wider">heads up</span> —
        back up any existing Custom CSS before pasting. The theme replaces the whole stylesheet.
      </div>
      <div class="space-y-2">
        <button type="button" data-copy-css data-slug="${attr(theme.slug)}" class="btn-primary w-full inline-flex items-center justify-center gap-2 font-mono px-3 h-9 rounded-md cursor-pointer">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          <span data-copy-label>Copy CSS</span>
        </button>
        <a href="/themes/${attr(theme.slug)}/theme.css" download="theme.css" class="btn-outline w-full inline-flex items-center justify-center gap-2 font-mono px-3 h-8 rounded-md">
          Download theme.css${escapeHtml(kb)}
        </a>
      </div>
    </div>
  </div>`;
}

export function themeDetailPage(theme) {
  const lightLabel = theme.modes === "dark-synth"
    ? `light <span class="text-muted-foreground/60">· synthesized from dark palette</span>`
    : "light";

  const previewSection = `<div class="space-y-3">
    <h2 class="font-mono text-xs text-muted-foreground uppercase tracking-wider">preview</h2>
    <div class="grid gap-4 sm:grid-cols-2">
      <div class="space-y-2">
        <p class="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">dark</p>
        <div class="border border-border/40 rounded-xl p-1.5 bg-card">${adminPreview(theme, "dark", { large: true })}</div>
      </div>
      <div class="space-y-2">
        <p class="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">${lightLabel}</p>
        <div class="border border-border/40 rounded-xl p-1.5 bg-card">${adminPreview(theme, "light", { large: true })}</div>
      </div>
    </div>
  </div>`;

  const creditHtml = theme.credit_md ? `<div class="space-y-2">
    <h2 class="font-mono text-xs text-muted-foreground uppercase tracking-wider">credit</h2>
    <div class="border border-border/40 rounded-xl bg-card p-5">${renderCredit(theme.credit_md)}</div>
  </div>` : "";

  const sourceLink = theme.source_url ? `<a href="${attr(theme.source_url)}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 font-mono text-xs text-muted-foreground hover:text-foreground transition-colors">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
      upstream palette${theme.owner ? ` — ${escapeHtml(theme.owner)}` : ""}
    </a>` : "";

  const starsLine = theme.stars > 0
    ? `<span class="inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground"><svg viewBox="0 0 16 16" width="11" height="11" fill="currentColor" aria-hidden="true" class="shrink-0 -mt-px"><path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.819 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z"></path></svg>${theme.stars} on GitHub</span>`
    : "";

  const body = `<div class="mx-auto max-w-6xl px-6 py-10">
  <nav class="mb-8 font-mono text-xs flex items-center gap-2 text-muted-foreground">
    <a href="/themes/" class="hover:text-foreground transition-colors">themes</a>
    <span aria-hidden="true">/</span>
    <span class="text-foreground">${escapeHtml(theme.name)}</span>
  </nav>
  <div class="grid gap-10 lg:grid-cols-[1fr_340px]">
    <div class="space-y-8 min-w-0">
      ${previewSection}
      ${paletteSection(theme)}
      ${creditHtml}
    </div>
    <aside class="space-y-6">
      <div class="sticky top-20 space-y-6">
        <div class="space-y-3">
        <h2 class="font-mono text-xs text-muted-foreground uppercase tracking-wider">about</h2>
        <div class="border border-border/40 rounded-xl bg-card p-5 space-y-4">
          <div class="space-y-2">
            <h2 class="font-mono text-lg font-medium">${escapeHtml(theme.name)}</h2>
            <div class="flex flex-wrap items-center gap-2">
              ${bucketChip(theme)}
              ${modeBadge(theme)}
              ${handmadeBadge(theme)}
            </div>
          </div>
          <div class="border-t border-border/40 pt-4 space-y-3">
            ${sourceLink}
            <a href="${THEMES_REPO}/tree/main/themes/${attr(theme.slug)}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 font-mono text-xs text-muted-foreground hover:text-foreground transition-colors">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>
              limehawk/hudu-themes/${escapeHtml(theme.slug)}
            </a>
            ${starsLine}
          </div>
        </div>
        </div>
        ${installSection(theme)}
      </div>
    </aside>
  </div>
</div>`;

  return layout({
    title: theme.name,
    description: `${theme.name} — a drop-in CSS theme for Hudu (${modeBadgeText(theme)}). Preview the palette and copy the stylesheet.`,
    path: `/themes/${theme.slug}/`,
    body,
  });
}

export function notFoundPage() {
  const body = `<div class="mx-auto max-w-6xl px-6 py-20 sm:py-32">
  <div class="max-w-lg space-y-6">
    <div class="font-mono text-sm text-muted-foreground space-y-1">
      <div>
        <span class="text-green-400/60">hudu</span><span class="text-muted-foreground"> → </span><span class="text-foreground">themes/???</span>
      </div>
      <div class="text-red-400/80">404: no such theme</div>
    </div>
    <h1 class="font-mono text-3xl font-bold tracking-tight text-foreground">404</h1>
    <p class="text-muted-foreground leading-relaxed">This page doesn't exist. Maybe the theme was removed, or the URL is wrong.</p>
    <div class="flex gap-3 pt-2">
      <a href="/themes/" class="btn-primary inline-flex items-center gap-2 font-mono px-3 h-8 rounded-md">browse themes</a>
      <a href="/" class="btn-outline inline-flex items-center gap-2 font-mono px-3 h-8 rounded-md">home</a>
    </div>
  </div>
</div>`;

  return layout({ title: "Not Found", path: "/404", body });
}
