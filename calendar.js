// Community calendar page: SING! events plus approved community events, with filters and subscribe links.
(async function () {
  const S = window.SING;
  const list = document.getElementById("calList");
  const typeSel = document.getElementById("typeFilter");
  const search = document.getElementById("calSearch");
  const state = { source: "all", type: "", q: "" };

  // ---- Subscribe buttons ----
  const urls = S.subscribeUrls();
  const google = document.getElementById("subGoogle"), apple = document.getElementById("subApple");
  const copy = document.getElementById("subCopy"), note = document.getElementById("subNote");
  if (urls) {
    google.href = urls.google;
    apple.href = urls.webcal;
    copy.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(urls.https);
        note.textContent = "Link copied. Paste it into your calendar app's “subscribe from a web address” option.";
      } catch (e) { note.textContent = urls.https; }
    });
  } else {
    [google, apple, copy].forEach(b => { b.classList.add("btn-disabled"); b.removeAttribute("href"); b.setAttribute("aria-disabled", "true"); });
    copy.disabled = true;
    note.textContent = "Preview: the subscribe buttons switch on once the calendar is connected.";
  }

  // ---- Events ----
  const { sing, community, offline } = await S.loadCalendar();
  document.getElementById("calNote").hidden = !offline;
  const items = S.upcoming(S.calendarItems(sing, community));

  const types = [...new Set(items.map(i => i.type).filter(Boolean))].sort();
  typeSel.innerHTML = `<option value="">All kinds of events</option>` + types.map(t => `<option>${S.esc(t)}</option>`).join("");

  function render() {
    const q = state.q.trim().toLowerCase();
    const shown = items.filter(i =>
      (state.source === "all" || i.kind === state.source) &&
      (!state.type || i.type === state.type) &&
      (!q || [i.title, i.group, i.venue, i.address, i.description, i.type].join(" ").toLowerCase().includes(q)));
    let month = "";
    list.innerHTML = shown.map(i => {
      const d = S.parseDate(i.date), m = `${S.MONTHS_LONG[d.getMonth()]} ${d.getFullYear()}`;
      const head = m === month ? "" : `<li class="month-head">${m}</li>`;
      month = m;
      return head + S.calendarRow(i, true);
    }).join("") || `<li class="empty">Nothing matches that yet. Running something? <a href="submit-event.html">Add your event</a>.</li>`;
    S.refreshEditable(list);
  }

  document.querySelectorAll(".seg button").forEach(b => b.addEventListener("click", () => {
    state.source = b.dataset.source;
    document.querySelectorAll(".seg button").forEach(x => x.setAttribute("aria-pressed", String(x === b)));
    render();
  }));
  typeSel.addEventListener("change", () => { state.type = typeSel.value; render(); });
  search.addEventListener("input", () => { state.q = search.value; render(); });
  render();
})();
