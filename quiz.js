// "Which choir is your choir?" — six questions, then the groups from the directory that fit best.
// Everything happens in the browser; nothing is sent anywhere.
(async function () {
  const S = window.SING;
  const box = document.getElementById("quiz"), results = document.getElementById("quizResults");
  const WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const STYLES = [
    ["Pop, rock and songs off the radio", /pop|rock|contemporary|indie|covers|broadway|musical theatre|cabaret/i],
    ["Classical and choral", /classical|choral|sacred|renaissance|symphonic|chamber|mass|requiem|early music|baroque|oratorio/i],
    ["Barbershop harmony", /barbershop|sweet adelines/i],
    ["Jazz and swing", /jazz|swing/i],
    ["Gospel and spirituals", /gospel|spiritual|worship/i],
    ["Songs from around the world", /ukrainian|german|welsh|french|swiss|slavic|folk|world|african|multicultural|traditional/i],
    ["A cappella, no instruments at all", /a cappella|acappella|vocal band/i],
  ];

  const { choirs, offline } = await S.loadChoirs();
  document.getElementById("quizNote").hidden = !offline;
  const areas = [...new Set(choirs.map(c => S.areaOf({ venue: c.location, address: c.location })).filter(Boolean))].sort();

  const QUESTIONS = [
    { id: "who", ask: "Who's looking for a choir?", options: [
      ["An adult, me", "adult"], ["A teenager", "teen"], ["A child", "child"],
      ["Me — and I'd rather sing in the daytime", "daytime"],
    ] },
    { id: "experience", ask: "How much singing have you done?", options: [
      ["None at all", "none"], ["A bit — school, church, the car", "some"], ["Plenty, and I read music", "lots"],
    ] },
    { id: "audition", ask: "How do you feel about auditioning?", options: [
      ["I'd rather not, thanks", "no"], ["A friendly chat is fine", "chat"], ["Happy to audition", "yes"],
    ] },
    { id: "days", ask: "Which nights could you rehearse?", multi: true, skip: "Any night works",
      options: WEEK.map(d => [d, d]) },
    { id: "area", ask: "Where would you travel to?", skip: "Anywhere in the area",
      options: areas.map(a => [a, a]) },
    { id: "style", ask: "What would you love to sing?", skip: "Anything, really",
      options: STYLES.map(s => [s[0], s[0]]) },
    { id: "now", ask: "Do you want to start soon?", options: [
      ["Yes, somewhere with room for me", "yes"], ["I don't mind waiting for the right group", "any"],
    ] },
  ];

  const answers = {};
  let step = 0;

  // ---- scoring ----
  const isYouthGroup = c => /child|youth/i.test(c.kind || "") || /grade|kinder|\b4–6\b|\b8–17\b/i.test(c.ages || "");
  const daytime = c => {
    const t = (c.time || "").toLowerCase();
    if (/am\b/.test(t)) return true;
    const m = /^(\d{1,2})/.exec(t);
    return !!m && +m[1] <= 4 && /pm/.test(t);
  };

  function score(c) {
    let points = 0;
    const why = [];
    const text = `${c.name} ${c.kind || ""} ${c.about || ""} ${(c.voices || []).join(" ")}`;

    if (answers.who === "child") { if (isYouthGroup(c)) { points += 5; why.push("For young singers"); } else points -= 8; }
    if (answers.who === "teen") { if (isYouthGroup(c)) { points += 4; why.push("Takes teenagers"); } else if (/18|19|20|adult/i.test(c.ages || "")) points -= 5; }
    if (answers.who === "adult" && isYouthGroup(c)) points -= 7;
    if (answers.who === "daytime") { if (daytime(c)) { points += 5; why.push("Sings in the daytime"); } else points -= 4; }

    const open = S.openToAll(c), chat = /chat with the director/i.test(c.joining || ""), audition = /audition required/i.test(c.joining || "");
    if (answers.audition === "no") { if (open) { points += 5; why.push("No audition"); } else if (chat) points += 1; else if (audition) points -= 7; }
    if (answers.audition === "chat") { if (chat) { points += 4; why.push("Just a chat to join"); } else if (open) points += 3; else points -= 2; }
    if (answers.audition === "yes" && audition) { points += 2; why.push("Auditioned group"); }
    if (answers.experience === "none") { if (open) points += 3; if (/no experience|beginner|never sung|by ear|do not need to read|don't need to read/i.test(`${c.about || ""} ${c.joiningDetails || ""}`)) { points += 4; why.push("Good with beginners"); } if (audition) points -= 4; }
    if (answers.experience === "lots" && audition) points += 2;

    const wanted = answers.days || [];
    if (wanted.length && (c.days || []).length) {
      const hit = (c.days || []).filter(d => wanted.includes(d));
      if (hit.length) { points += 4; why.push(`Rehearses ${hit.map(d => d + "s").join(" & ")}`); }
      else points -= 5;
    }

    if (answers.area) {
      const where = c.location || "";
      if (where.toLowerCase().includes(answers.area.toLowerCase().replace(".", "")) || where.includes(answers.area)) { points += 3; why.push(`In ${answers.area}`); }
      else if (where && answers.area !== "Edmonton") points -= 3;
    }

    if (answers.style) {
      const pattern = (STYLES.find(s => s[0] === answers.style) || [])[1];
      if (pattern && pattern.test(text)) { points += 5; why.push(answers.style.replace(/^./, ch => ch.toUpperCase())); }
    }

    if (answers.now === "yes") {
      if (c.accepting === "Yes") { points += 3; why.push("Taking new members"); }
      else if (c.accepting === "Waitlist") points -= 2;
      else if (c.accepting === "Not right now") points -= 6;
    }

    if (c.days && c.time) points += 1; // a listing people can actually act on
    return { points, why: why.slice(0, 4) };
  }

  // ---- screens ----
  function renderQuestion() {
    const q = QUESTIONS[step];
    const chosen = answers[q.id];
    box.innerHTML = `
      <p class="quiz-progress">Question ${step + 1} of ${QUESTIONS.length}</p>
      <h2 class="quiz-ask" tabindex="-1">${S.esc(q.ask)}</h2>
      <div class="quiz-options" role="group" aria-label="${S.esc(q.ask)}">
        ${q.options.map(([label, value]) => `<button type="button" class="quiz-option" data-value="${S.esc(value)}"
            aria-pressed="${q.multi ? String((chosen || []).includes(value)) : String(chosen === value)}">${S.esc(label)}</button>`).join("")}
      </div>
      <div class="quiz-nav">
        ${step ? '<button type="button" class="linklike" id="quizBack">← Back</button>' : ""}
        ${q.skip ? `<button type="button" class="linklike" id="quizSkip">${S.esc(q.skip)} →</button>` : ""}
        ${q.multi ? '<button type="button" class="btn btn-red" id="quizNext">Next</button>' : ""}
      </div>`;

    box.querySelectorAll(".quiz-option").forEach(btn => btn.addEventListener("click", () => {
      const value = btn.dataset.value;
      if (q.multi) {
        const list = answers[q.id] = answers[q.id] || [];
        const at = list.indexOf(value);
        at < 0 ? list.push(value) : list.splice(at, 1);
        btn.setAttribute("aria-pressed", String(at < 0));
      } else {
        answers[q.id] = value;
        next();
      }
    }));
    const back = document.getElementById("quizBack"), skip = document.getElementById("quizSkip"), nxt = document.getElementById("quizNext");
    if (back) back.addEventListener("click", () => { step--; renderQuestion(); });
    if (skip) skip.addEventListener("click", () => { delete answers[q.id]; next(); });
    if (nxt) nxt.addEventListener("click", next);
    box.querySelector(".quiz-ask").focus();
  }

  function next() {
    step++;
    if (step < QUESTIONS.length) renderQuestion(); else showResults();
  }

  function showResults() {
    const scored = choirs.map(c => Object.assign({ c }, score(c)))
      .filter(r => r.points > 0)
      .sort((a, b) => b.points - a.points)
      .slice(0, 8);
    box.hidden = true;
    results.hidden = false;
    results.innerHTML = `
      <div class="quiz-result-head">
        <p class="eyebrow red">Your matches</p>
        <h2>${scored.length ? (scored.length === 1 ? "One group looks right" : `${scored.length} groups look right`) : "Nothing quite matched"}</h2>
        <p class="section-lede">${scored.length
          ? "Closest first. Most groups are happy for you to come and watch a rehearsal before you decide."
          : "That's a fussy combination! Try the full directory, or loosen a night or two."}</p>
        <div class="head-actions">
          <button type="button" class="btn btn-navy" id="quizAgain">Start again</button>
          <a class="btn btn-outline" href="choirs.html">Browse all ${choirs.length} groups</a>
        </div>
      </div>
      <div class="choir-grid">${scored.map(r => S.choirCard(r.c, { reasons: r.why })).join("")}</div>`;
    document.getElementById("quizAgain").addEventListener("click", () => {
      Object.keys(answers).forEach(k => delete answers[k]);
      step = 0;
      results.hidden = true;
      box.hidden = false;
      renderQuestion();
      box.scrollIntoView({ block: "center", behavior: "smooth" });
    });
    results.scrollIntoView({ block: "start", behavior: "smooth" });
  }

  renderQuestion();
})();
