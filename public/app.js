// Browse-page filter state + Copy CSS button. No framework, no build step.

(function () {
  // ---------- Copy CSS (theme detail pages) ----------
  document.querySelectorAll("[data-copy-css]").forEach((btn) => {
    const slug = btn.getAttribute("data-slug");
    const label = btn.querySelector("[data-copy-label]");
    btn.addEventListener("click", async () => {
      try {
        const res = await fetch(`/themes/${slug}/theme.css`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const css = await res.text();
        await navigator.clipboard.writeText(css);
        if (label) {
          const orig = label.textContent;
          label.textContent = "Copied!";
          btn.classList.add("btn-copied");
          setTimeout(() => {
            label.textContent = orig;
            btn.classList.remove("btn-copied");
          }, 2000);
        }
      } catch {
        if (label) {
          const orig = label.textContent;
          label.textContent = "Copy failed";
          setTimeout(() => { label.textContent = orig; }, 2000);
        }
      }
    });
  });

  // ---------- author-link clicks (work everywhere) ----------
  // Clicking an author name on a theme card either filters the browse grid
  // (when already on /themes/) or navigates to /themes/?author=<name>.
  document.addEventListener("click", (e) => {
    const el = e.target.closest("[data-author-link]");
    if (!el) return;
    e.preventDefault();
    e.stopPropagation();
    const author = el.getAttribute("data-author-link");
    const input = document.querySelector('input[name="author"]');
    if (input) {
      document.dispatchEvent(new CustomEvent("author-filter", { detail: author }));
      input.scrollIntoView({ block: "nearest", behavior: "smooth" });
    } else {
      window.location.href = `/themes/?author=${encodeURIComponent(author)}`;
    }
  });

  // ---------- browse-page filter (only runs on /themes/) ----------
  const grid = document.querySelector("[data-theme-grid]");
  if (!grid) return;

  const cards = Array.from(grid.querySelectorAll("[data-theme-card]"));
  const countEl = document.querySelector("[data-theme-count]");
  const inputs = {
    q: document.querySelector('[name="q"]'),
    mode: document.querySelectorAll('[name="mode"]'),
    color: document.querySelectorAll('[name="color"]'),
    sort: document.querySelectorAll('[name="sort"]'),
    author: document.querySelector('input[name="author"]'),
  };

  const state = { q: "", mode: "", color: [], sort: "popular", author: "" };

  function readURL() {
    const p = new URLSearchParams(location.search);
    state.q = p.get("q") ?? "";
    state.mode = p.get("mode") ?? "";
    state.color = p.getAll("color");
    state.sort = p.get("sort") === "name" ? "name" : "popular";
    state.author = p.get("author") ?? "";
  }

  function writeURL() {
    const p = new URLSearchParams();
    if (state.q) p.set("q", state.q);
    if (state.mode) p.set("mode", state.mode);
    state.color.forEach((c) => p.append("color", c));
    if (state.sort !== "popular") p.set("sort", state.sort);
    if (state.author) p.set("author", state.author);
    const qs = p.toString();
    const url = qs ? `${location.pathname}?${qs}` : location.pathname;
    return url;
  }

  // Clicks are navigation-like: they push a history entry so Back unwinds
  // the filter change. Typing replaces in place (no entry per keystroke).
  function update(push = false) {
    const url = writeURL();
    if (url !== location.pathname + location.search) {
      history[push ? "pushState" : "replaceState"](null, "", url);
    }
    syncInputs(); applySort(); applyFilters();
  }

  function syncInputs() {
    if (inputs.q) inputs.q.value = state.q;
    document.querySelectorAll("[data-clear]").forEach((btn) => {
      const target = btn.getAttribute("data-clear");
      const input = document.querySelector(`[name="${target}"]`);
      btn.hidden = !input || !input.value;
    });
    inputs.mode.forEach((b) => b.classList.toggle("is-active", b.value === state.mode));
    inputs.sort.forEach((b) => b.classList.toggle("is-active", b.value === state.sort));
    if (inputs.author) inputs.author.value = state.author;
    inputs.color.forEach((b) => b.classList.toggle("is-active", state.color.includes(b.value)));
    const allColors = document.querySelector("[data-color-all]");
    if (allColors) allColors.classList.toggle("is-active", state.color.length === 0);
  }

  function applySort() {
    // Cards are baked in popular order (stars desc, name asc); reorder the
    // DOM nodes only when needed.
    const sorted = [...cards].sort((a, b) => {
      if (state.sort === "name") return a.dataset.name.localeCompare(b.dataset.name);
      return (+b.dataset.stars || 0) - (+a.dataset.stars || 0)
        || a.dataset.name.localeCompare(b.dataset.name);
    });
    sorted.forEach((card) => grid.appendChild(card));
  }

  function applyFilters() {
    let visible = 0;
    const lower = state.q.toLowerCase();
    cards.forEach((card) => {
      let show = true;
      if (state.mode && card.dataset.modes !== state.mode) show = false;
      if (show && state.color.length > 0 && !state.color.includes(card.dataset.bucket)) show = false;
      if (show && state.author && !card.dataset.owner.toLowerCase().includes(state.author.toLowerCase())) show = false;
      if (show && state.q && !card.dataset.name.toLowerCase().includes(lower)) show = false;
      card.hidden = !show;
      if (show) visible++;
    });

    if (countEl) countEl.textContent = `${visible} theme${visible !== 1 ? "s" : ""} available`;

    const empty = document.querySelector("[data-theme-empty]");
    if (empty) empty.hidden = visible !== 0;
  }

  inputs.q?.addEventListener("input", () => { state.q = inputs.q.value; update(); });

  inputs.mode.forEach((b) => b.addEventListener("click", () => { state.mode = b.value; update(true); }));
  inputs.sort.forEach((b) => b.addEventListener("click", () => { state.sort = b.value; update(true); }));
  inputs.author?.addEventListener("input", () => { state.author = inputs.author.value; update(); });
  document.addEventListener("author-filter", (e) => { state.author = e.detail; update(true); });
  inputs.color.forEach((b) => b.addEventListener("click", () => {
    const idx = state.color.indexOf(b.value);
    if (idx === -1) state.color.push(b.value); else state.color.splice(idx, 1);
    update(true);
  }));
  document.querySelector("[data-color-all]")?.addEventListener("click", () => { state.color = []; update(true); });

  document.querySelectorAll("[data-clear]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.getAttribute("data-clear");
      if (target === "q") state.q = "";
      if (target === "author") state.author = "";
      update(true);
    });
  });

  window.addEventListener("popstate", () => { readURL(); syncInputs(); applySort(); applyFilters(); });

  readURL();
  syncInputs();
  if (state.sort !== "popular") applySort();
  applyFilters();
})();
