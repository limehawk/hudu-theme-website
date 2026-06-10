# hudu themes

[![huduthemes.com](https://img.shields.io/badge/huduthemes.com-visit%20site-blue?style=flat-square)](https://huduthemes.com)
[![License: MIT](https://img.shields.io/badge/license-MIT-green?style=flat-square)](LICENSE)

> Browse and preview drop-in CSS themes for [Hudu](https://hudu.com). Filter by color and mode, preview light and dark palettes, and copy one stylesheet into Hudu's Custom CSS.

## Features

- **261 themes** — color schemes ported from popular terminal and editor palettes, sourced from [limehawk/hudu-themes](https://github.com/limehawk/hudu-themes)
- **Live previews** — every theme renders a mini replica of Hudu's Admin page straight from its palette tokens, in dark and light modes (no screenshots)
- **Filtering & sorting** — browse by hue, mode (real light+dark vs synthesized light), or name; sort by popularity (upstream GitHub stars) or alphabetically
- **One-paste install** — copy the CSS, paste it into Hudu Admin → Design → Custom CSS, save, hard-refresh

## How it works

This is a static site. `scripts/extract.js` reads a local checkout of the
[hudu-themes](https://github.com/limehawk/hudu-themes) repo (default
`../hudu-themes`, override with `HUDU_THEMES_DIR`) and writes
`src/data/themes-data.json`. `scripts/build.js` renders every page from that
data, copies each theme's `theme.css` into the output, and runs Tailwind.

```sh
bun install
bun run build   # extract + build into out/
bun run dev     # build + serve on :3000
```

## Adding a theme

Themes live in the [hudu-themes](https://github.com/limehawk/hudu-themes) repo —
add one there and rebuild this site.

## Disclaimer

huduthemes.com is an independent community site, not affiliated with or endorsed by Hudu Technologies. Theme palettes belong to their respective upstream authors.

## License

MIT
