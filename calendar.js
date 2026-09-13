// Community calendar page: SING! events plus approved community events, with filters and subscribe links.
(async function () {
  const S = window.SING;
  const list = document.getElementById("calList"), count = document.getElementById("calCount");
  const search = document.getElementById("calSearch");
  const typeSel = document.getElementById("typeFilter"), monthSel = document.getElementById("monthFilter");
  const areaSel = document.getElementById("areaFilter"), groupSel = document.getElementById("groupFilter");
  const freeBtn = document.getElementById("freeOnly"), joinBtn = document.getElementById("joinIn"), soonBtn = document.getElementById("soon");
  const clearBtn = document.getElementById("clearFilters");
  const BLANK = { source: "all", type: "", month: "", area: "", group: "", free: false, joinIn: false, soon: false, q: "" };
  const state = Object.assign({}, BLANK);
  // Things you can take part in, rather than sit and listen to.
  const JOIN_IN = ["Sing-along", "Open rehearsal", "Workshop or class", "Auditions"];

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
  const monthKey = i => i.date.slice(0, 7);
  const monthName = key => `${S.MONTHS_LONG[+key.slice(5, 7) - 1]} ${key.slice(0, 4)}`;

  const options = (sel, values, all, label) => {
    sel.innerHTML = `<option value="">${all}</option>` +
      values.map(v => `<option value="${S.esc(v)}">${S.esc(label ? label(v) : v)}</option>`).join("");
  };
  const unique = pick => [...new Set(items.map(pick).filter(Boolean))].sort();
  options(typeSel, unique(i => i.type), "All kinds of events");
  options(monthSel, [...new Set(items.map(monthKey))].sort(), "Any month", monthName);
  options(areaSel, unique(i => S.areaOf(i)), "Anywhere");
  options(groupSel, unique(i => (i.kind === "sing" ? "SING! Edmonton" : i.group)), "Any group");

  function matches(i) {
    const q = state.q.trim().toLowerCase();
    const soonLimit = S.isoDay(S.addDays(S.today(), 30));
    return (state.source === "all" || i.kind === state.source)
      && (!state.type || i.type === state.type)
      && (!state.month || monthKey(i) === state.month)
      && (!state.area || S.areaOf(i) === state.area)
      && (!state.group || (i.kind === "sing" ? "SING! Edmonton" : i.group) === state.group)
      && (!state.free || /free|pay what/i.test(i.price || ""))
      && (!state.joinIn || JOIN_IN.includes(i.type))
      && (!state.soon || i.date <= soonLimit)
      && (!q || [i.title, i.group, i.venue, i.address, i.description, i.type].join(" ").toLowerCase().includes(q));
  }

  function render() {
    const shown = items.filter(matches);
    const filtering = JSON.stringify(state) !== JSON.stringify(BLANK);
    clearBtn.hidden = !filtering;
    count.textContent = items.length ? (filtering ? `Showing ${shown.length} of ${items.length} events` : `${items.length} events coming up`) : "";
    let month = "";
    list.innerHTML = shown.map(i => {
      const head = monthKey(i) === month ? "" : `<li class="month-head">${monthName(monthKey(i))}</li>`;
      month = monthKey(i);
      return head + S.calendarRow(i, true);
    }).join("") || `<li class="empty">Nothing matches all of those. <button type="button" class="linklike" id="emptyClear">Clear the filters</button>, or <a href="submit-event.html">add your own event</a>.</li>`;
    const emptyClear = document.getElementById("emptyClear");
    if (emptyClear) emptyClear.addEventListener("click", clearAll);
    S.refreshEditable(list);
  }

  function clearAll() {
    Object.assign(state, BLANK);
    search.value = "";
    [typeSel, monthSel, areaSel, groupSel].forEach(s => { s.value = ""; });
    [freeBtn, joinBtn, soonBtn].forEach(b => b.setAttribute("aria-pressed", "false"));
    document.querySelectorAll(".seg button").forEach(x => x.setAttribute("aria-pressed", String(x.dataset.source === "all")));
    render();
  }

  document.querySelectorAll(".seg button").forEach(b => b.addEventListener("click", () => {
    state.source = b.dataset.source;
    document.querySelectorAll(".seg button").forEach(x => x.setAttribute("aria-pressed", String(x === b)));
    render();
  }));
  const bind = (el, key) => el.addEventListener("change", () => { state[key] = el.value; render(); });
  bind(typeSel, "type"); bind(monthSel, "month"); bind(areaSel, "area"); bind(groupSel, "group");
  const toggle = (btn, key) => btn.addEventListener("click", () => {
    state[key] = !state[key];
    btn.setAttribute("aria-pressed", String(state[key]));
    render();
  });
  toggle(freeBtn, "free"); toggle(joinBtn, "joinIn"); toggle(soonBtn, "soon");
  search.addEventListener("input", () => { state.q = search.value; render(); });
  clearBtn.addEventListener("click", clearAll);
  render();
})();
