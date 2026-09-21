// Home page: countdown, festival weekend, what's on, past seasons, newsletter.
(async function () {
  const S = window.SING, F = S.C.festival;
  const start = S.parseDate(F.start);

  // ---- Live countdown to the first festival day, in Edmonton time wherever the visitor is ----
  // The seconds tick for the eye only; screen readers get the day count once, not every second.
  const cd = document.getElementById("countdown");
  const target = Date.parse(`${F.start}T${F.startTime || "00:00"}:00${F.utcOffset || "-07:00"}`);
  const over = target + F.days * 86400000;
  const pad = (n, w) => String(n).padStart(w, "0");
  const unit = (n, w, label) => `<span class="cd-u"><b style="min-width:${w}ch">${pad(n, w)}</b>${label}</span>`;
  let spoken = "";
  function tick() {
    const now = Date.now(), ms = target - now;
    if (ms <= 0) {
      clearInterval(timer);
      cd.innerHTML = now < over ? "<b>It's festival weekend!</b>" : "";
      cd.removeAttribute("aria-hidden");
      return;
    }
    const s = Math.floor(ms / 1000), d = Math.floor(s / 86400), h = Math.floor(s / 3600) % 24, m = Math.floor(s / 60) % 60;
    cd.innerHTML = unit(d, d > 99 ? 3 : 2, d === 1 ? "day" : "days") + unit(h, 2, "hrs") + unit(m, 2, "min") + unit(s % 60, 2, "sec")
      + `<span class="cd-l">until the festival</span>`;
    const say = `${d} day${d === 1 ? "" : "s"} until the festival`;
    if (say !== spoken) { spoken = say; document.getElementById("countdownSr").textContent = say; }
  }
  const timer = setInterval(tick, 1000);
  tick();

  const { sing, community } = await S.loadCalendar();

  // ---- Festival weekend, grouped by day (always all festival days) ----
  const byDay = {};
  for (let i = 0; i < F.days; i++) byDay[S.isoDay(S.addDays(start, i))] = [];
  sing.filter(e => e.parent === F.name && e.date).forEach(e => (byDay[e.date.slice(0, 10)] ||= []).push(e));
  document.getElementById("festivalDays").innerHTML = Object.keys(byDay).sort().map(key => {
    const d = S.parseDate(key);
    const slots = byDay[key].sort((a, b) => (a.type === "Workshop" ? -1 : 1) - (b.type === "Workshop" ? -1 : 1));
    return `<div class="day">
      <div class="day-name" data-edit="day.${key}.name">${S.DAYS[d.getDay()]}</div>
      <div class="day-date">${S.MONTHS[d.getMonth()]} ${d.getDate()}</div>
      ${slots.length ? slots.map(e => `<div class="slot">
          <span class="slot-type">${S.esc(e.type)}</span>
          <span class="slot-title" data-edit="event.${S.esc(e.id)}">${S.esc(S.publicTitle(e))}${e.tentative ? ' <span class="soon">— announcing soon</span>' : ""}${e.time ? ` · ${S.clockTime(e.time)}` : ""}</span>
        </div>`).join("") : `<div class="slot"><span class="soon">Details coming soon</span></div>`}
    </div>`;
  }).join("");

  // ---- What's on: the next few SING! and community events ----
  const next = S.upcoming(S.calendarItems(sing, community)).slice(0, 5);
  document.getElementById("calendarList").innerHTML = next.map(it => S.calendarRow(it, false)).join("")
    || `<li class="empty">New dates coming soon.</li>`;

  // ---- Past seasons (SING!'s own events) ----
  const past = sing.filter(e => !e.parent && !e.tentative && e.title && e.date && S.parseDate(e.endDate || e.date) < S.today());
  const byYear = {};
  past.forEach(e => (byYear[e.date.slice(0, 4)] ||= []).push(e));
  document.getElementById("pastList").innerHTML = Object.keys(byYear).sort().reverse().map(y =>
    `<div class="past-year"><h3>${y}</h3><ul>${byYear[y].map(e => `<li>${S.esc(S.tidy(e.title))}</li>`).join("")}</ul></div>`
  ).join("");

  S.refreshEditable();
})();
