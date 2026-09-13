// Find a choir: approved listings from the Choir Directory in Notion, with filters.
(async function () {
  const S = window.SING;
  const WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const grid = document.getElementById("choirGrid"), count = document.getElementById("choirCount");
  const search = document.getElementById("choirSearch"), kindSel = document.getElementById("kindFilter");
  const voiceSel = document.getElementById("voiceFilter"), dayChips = document.getElementById("dayChips");
  const state = { q: "", kind: "", voice: "", days: new Set(), noAudition: false, accepting: false };

  const { choirs, offline } = await S.loadChoirs();
  document.getElementById("choirNote").hidden = !offline;
  choirs.sort((a, b) => (a.name || "").localeCompare(b.name || ""));

  const options = (values, all) => `<option value="">${all}</option>` +
    [...new Set(values.filter(Boolean))].sort().map(v => `<option>${S.esc(v)}</option>`).join("");
  kindSel.innerHTML = options(choirs.map(c => c.kind), "All kinds of groups");
  voiceSel.innerHTML = options(choirs.flatMap(c => c.voices || []), "All voices");
  dayChips.innerHTML = WEEK.map(d => `<button type="button" class="chip" data-day="${d}" aria-pressed="false" aria-label="${d}">${d.slice(0, 3)}</button>`).join("");

  function render() {
    const q = state.q.trim().toLowerCase();
    const shown = choirs.filter(c =>
      (!q || [c.name, c.kind, c.location, c.about, (c.voices || []).join(" ")].join(" ").toLowerCase().includes(q)) &&
      (!state.kind || c.kind === state.kind) &&
      (!state.voice || (c.voices || []).includes(state.voice)) &&
      (!state.days.size || (c.days || []).some(d => state.days.has(d))) &&
      (!state.noAudition || S.openToAll(c)) &&
      (!state.accepting || c.accepting === "Yes"));
    count.textContent = choirs.length ? `Showing ${shown.length} of ${choirs.length} groups` : "";
    grid.innerHTML = shown.map(c => S.choirCard(c)).join("") || `<p class="empty">${choirs.length
      ? "No groups match all of those. Try removing a filter."
      : 'No groups are listed yet. <a href="list-your-choir.html">Be the first</a>.'}</p>`;
  }

  const toggle = (btn, on) => btn.setAttribute("aria-pressed", String(on));
  search.addEventListener("input", () => { state.q = search.value; render(); });
  kindSel.addEventListener("change", () => { state.kind = kindSel.value; render(); });
  voiceSel.addEventListener("change", () => { state.voice = voiceSel.value; render(); });
  dayChips.addEventListener("click", ev => {
    const b = ev.target.closest("[data-day]"); if (!b) return;
    const d = b.dataset.day;
    state.days.has(d) ? state.days.delete(d) : state.days.add(d);
    toggle(b, state.days.has(d)); render();
  });
  const noAud = document.getElementById("noAudition"), acc = document.getElementById("accepting");
  noAud.addEventListener("click", () => { state.noAudition = !state.noAudition; toggle(noAud, state.noAudition); render(); });
  acc.addEventListener("click", () => { state.accepting = !state.accepting; toggle(acc, state.accepting); render(); });
  render();
})();
