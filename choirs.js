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

  const openToAll = c => /no audition/i.test(c.joining || "");
  const initials = name => (name || "").split(/\s+/)
    .filter(w => /^[A-Za-z0-9]/.test(w) && !/^(the|of|and)$/i.test(w))
    .slice(0, 3).map(w => w[0].toUpperCase()).join("") || "♪";
  const ACCEPTING = { Yes: ["badge-gold", "Taking new members"], Waitlist: ["badge-grey", "Waitlist"], "Not right now": ["badge-grey", "Not taking new members right now"] };

  function card(c) {
    const days = c.days || [];
    const dayText = days.length > 2 ? days.map(d => d.slice(0, 3)).join(", ") : days.map(d => d + "s").join(" & ");
    const site = S.safeUrl(c.website), img = S.safeUrl(c.image);
    const email = /^[^@\s<>"]+@[^@\s<>"]+\.[^@\s<>"]+$/.test(c.publicEmail || "") ? c.publicEmail : "";
    const fact = (k, v) => (v ? `<dt>${k}</dt><dd>${S.esc(v)}</dd>` : "");
    const accept = ACCEPTING[c.accepting];
    const updated = c.updated ? S.parseDate(c.updated) : null;
    return `<article class="choir">
      ${img ? `<img class="choir-img" src="${S.esc(img)}" alt="" loading="lazy">`
            : `<div class="choir-img choir-img-blank" aria-hidden="true">${S.esc(initials(c.name))}</div>`}
      <div class="choir-body">
        <div class="cal-kicker">${c.example ? '<span class="tag tag-example">Example</span>' : ""}${c.kind ? `<span class="cal-type">${S.esc(c.kind)}</span>` : ""}</div>
        <h3>${S.esc(c.name)}</h3>
        <div class="badges">
          ${c.joining ? `<span class="badge ${openToAll(c) ? "badge-green" : "badge-navy"}">${S.esc(c.joining)}</span>` : ""}
          ${accept ? `<span class="badge ${accept[0]}">${accept[1]}</span>` : ""}
        </div>
        ${c.about ? `<p>${S.esc(c.about)}</p>` : ""}
        <dl class="facts">
          ${fact("Rehearsals", [dayText, c.time].filter(Boolean).join(", "))}
          ${fact("Where", c.location)}${fact("Season", c.season)}
          ${fact("Voices", (c.voices || []).join(", "))}${fact("Ages", c.ages)}${fact("Fees", c.fees)}
          ${fact("To join", c.joiningDetails)}
        </dl>
        <div class="choir-links">
          ${site ? `<a class="btn btn-navy btn-small" href="${S.esc(site)}" target="_blank" rel="noopener">Visit their website</a>` : ""}
          ${email ? `<a class="btn btn-outline btn-small" href="mailto:${S.esc(email)}?subject=${encodeURIComponent("Joining " + c.name)}">Email them</a>` : ""}
        </div>
        ${updated ? `<p class="updated">Listing updated ${S.MONTHS_LONG[updated.getMonth()]} ${updated.getFullYear()}</p>` : ""}
      </div>
    </article>`;
  }

  function render() {
    const q = state.q.trim().toLowerCase();
    const shown = choirs.filter(c =>
      (!q || [c.name, c.kind, c.location, c.about, (c.voices || []).join(" ")].join(" ").toLowerCase().includes(q)) &&
      (!state.kind || c.kind === state.kind) &&
      (!state.voice || (c.voices || []).includes(state.voice)) &&
      (!state.days.size || (c.days || []).some(d => state.days.has(d))) &&
      (!state.noAudition || openToAll(c)) &&
      (!state.accepting || c.accepting === "Yes"));
    count.textContent = choirs.length ? `Showing ${shown.length} of ${choirs.length} groups` : "";
    grid.innerHTML = shown.map(card).join("") || `<p class="empty">${choirs.length
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
