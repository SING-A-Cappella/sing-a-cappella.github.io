// Home page: countdown, festival weekend, what's on, past seasons, newsletter.
(async function () {
  const S = window.SING, F = S.C.festival;
  const start = S.parseDate(F.start);

  const days = Math.round((start - S.today()) / 86400000);
  const cd = document.getElementById("countdown");
  if (days > 1) cd.innerHTML = `<b>${days}</b> days until the festival`;
  else if (days > -F.days) cd.innerHTML = "<b>It's festival weekend!</b>";

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
