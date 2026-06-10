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

  // ---------- browse-page filter (only runs on /themes/) ----------
  const grid = document.querySelector("[data-theme-grid]");
  if (!grid) return;

  const cards = Array.from(grid.querySelectorAll("[data-theme-card]"));
  const countEl = document.querySelector("[data-theme-count]");
  const inputs = {
    q: document.querySelector('[name="q"]'),
    mode: document.querySelectorAll('[name="mode"]'),
    color: document.querySelectorAll('[name="color"]'),
  };

  const state = { q: "", mode: "", color: [] };

  function readURL() {
    const p = new URLSearchParams(location.search);
    state.q = p.get("q") ?? "";
    state.mode = p.get("mode") ?? "";
    state.color = p.getAll("color");
  }

  function writeURL() {
    const p = new URLSearchParams();
    if (state.q) p.set("q", state.q);
    if (state.mode) p.set("mode", state.mode);
    state.color.forEach((c) => p.append("color", c));
    const qs = p.toString();
    const url = qs ? `${location.pathname}?${qs}` : location.pathname;
    history.replaceState(null, "", url);
  }

  function syncInputs() {
    if (inputs.q) inputs.q.value = state.q;
    document.querySelectorAll("[data-clear]").forEach((btn) => {
      const target = btn.getAttribute("data-clear");
      const input = document.querySelector(`[name="${target}"]`);
      btn.hidden = !input || !input.value;
    });
    inputs.mode.forEach((b) => b.classList.toggle("is-active", b.value === state.mode));
    inputs.color.forEach((b) => b.classList.toggle("is-active", state.color.includes(b.value)));
    const allColors = document.querySelector("[data-color-all]");
    if (allColors) allColors.classList.toggle("is-active", state.color.length === 0);
  }

  function applyFilters() {
    let visible = 0;
    const lower = state.q.toLowerCase();
    cards.forEach((card) => {
      let show = true;
      if (state.mode && card.dataset.modes !== state.mode) show = false;
      if (show && state.color.length > 0 && !state.color.includes(card.dataset.bucket)) show = false;
      if (show && state.q && !card.dataset.name.toLowerCase().includes(lower)) show = false;
      card.hidden = !show;
      if (show) visible++;
    });

    if (countEl) countEl.textContent = `${visible} theme${visible !== 1 ? "s" : ""} available`;

    const empty = document.querySelector("[data-theme-empty]");
    if (empty) empty.hidden = visible !== 0;
  }

  function update() { writeURL(); syncInputs(); applyFilters(); }

  inputs.q?.addEventListener("input", () => { state.q = inputs.q.value; update(); });

  inputs.mode.forEach((b) => b.addEventListener("click", () => { state.mode = b.value; update(); }));
  inputs.color.forEach((b) => b.addEventListener("click", () => {
    const idx = state.color.indexOf(b.value);
    if (idx === -1) state.color.push(b.value); else state.color.splice(idx, 1);
    update();
  }));
  document.querySelector("[data-color-all]")?.addEventListener("click", () => { state.color = []; update(); });

  document.querySelectorAll("[data-clear]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.getAttribute("data-clear") === "q") state.q = "";
      update();
    });
  });

  window.addEventListener("popstate", () => { readURL(); syncInputs(); applyFilters(); });

  readURL();
  syncInputs();
  applyFilters();
})();
