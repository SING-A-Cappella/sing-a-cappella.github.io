// Shared by every page: header and footer, date helpers, loading events and
// choirs from the backend, sending forms, and the team's edit-in-place mode.
(function () {
  const C = window.SING_CONFIG || {};

  // ---------- helpers ----------
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const MONTHS_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const parseDate = s => { const [y, m, d] = s.slice(0, 10).split("-").map(Number); return new Date(y, m - 1, d); };
  const isoDay = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const today = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
  const clockTime = t => {
    const m = /^(\d{1,2}):(\d{2})/.exec(t || ""); if (!m) return t || "";
    const h = +m[1]; return `${h % 12 || 12}${m[2] === "00" ? "" : ":" + m[2]}${h < 12 ? "am" : "pm"}`;
  };
  // Only ever link to real web addresses that people submitted.
  const safeUrl = u => (/^https?:\/\/\S+$/i.test(String(u || "").trim()) ? String(u).trim() : "");
  // Unannounced SING! events never show their working title from Notion.
  const publicTitle = e => e.title || e.hint || (e.type === "Workshop" ? "Workshops" : "Concert");
  // Tidy Notion titles for the public: "2026 Education Week (Apr 27-May 1)" → "Education Week".
  const tidy = t => t.replace(/\s*[\[(].*?[\])]/g, "").replace(/^\d{4}\s+/, "").replace(/:\s*Live in Edmonton$/, " — live in Edmonton").trim();

  // ---------- header & footer ----------
  /* Where the site's own files are, as seen from this page: "" for most pages, "../" for an
     event's own page, "/" for the 404 page (shown at whatever address was typed, like an old
     /events/x/ link). Worked out from how the page loads site.css, so menu links always work. */
  const ROOT = document.querySelector('link[href$="site.css"]').getAttribute("href").replace(/site\.css$/, "");
  const LOGO = ROOT + "images/sing-logo.png";
  const here = (location.pathname.split("/").pop() || "index").replace(/\.html$/, "") || "index";
  const section = { "submit-event": "calendar", "list-your-choir": "choirs" }[here] || here;
  /* The fourth item is the section key, so a page switched off in Festival HQ also disappears
     from the menu and the footer (see sections.js). */
  const NAV = [
    ["index.html#festival", "Festival 2027", "festival", "home.festival"],
    ["calendar.html", "Calendar", "calendar", "page.calendar"],
    ["choirs.html", "Find a choir", "choirs", "page.choirs"],
    ["perform.html", "Perform", "perform", "page.perform"],
    ["shop.html", "Shop", "shop", "page.shop"],
    ["index.html#involved", "Get involved", "involved", "home.involved"],
  ];

  const header = `
<div class="edit-bar" id="editBar" hidden>
  <strong>Editing the website</strong>
  <span>Click any words to change them. Changes are saved on this computer for now.</span>
  <button type="button" id="editCopy">Copy my changes</button>
  <button type="button" id="editReset">Undo all my changes</button>
  <button type="button" id="editDone">Done</button>
</div>
<header class="top">
  <a class="brand" href="${ROOT}index.html" aria-label="SING! Edmonton home"><img src="${LOGO}" alt="SING! Edmonton" width="56" height="50"></a>
  <button class="menu-btn" type="button" aria-expanded="false" aria-controls="mainNav">Menu</button>
  <nav class="nav" id="mainNav" aria-label="Main">
    ${NAV.map(([href, label, key, sect]) => `<a href="${ROOT}${href}"${sect ? ` data-section="${sect}"` : ""}${key === section ? ' aria-current="page"' : ""}>${label}</a>`).join("")}
  </nav>
  <a class="btn btn-red btn-small" href="${ROOT}index.html#tickets" data-edit="nav.cta">Tickets</a>
</header>`;

  const footer = `
<footer class="footer">
  <div class="wrap footer-grid">
    <div>
      <img class="footer-logo" src="${LOGO}" alt="SING! Edmonton" width="80" height="71">
      <p class="tagline" data-edit="foot.tagline">Sing together, listen together, SING! Edmonton.</p>
    </div>
    <div>
      <h2 class="footer-h">Join in</h2>
      <p data-section="page.calendar"><a href="${ROOT}calendar.html">Community calendar</a></p>
      <p data-section="page.submit-event"><a href="${ROOT}submit-event.html">Add your event</a></p>
      <p><span data-section="page.choirs"><a href="${ROOT}choirs.html">Find a choir</a></span> <span data-section="page.quiz">· <a href="${ROOT}quiz.html">Quiz</a></span></p>
      <p data-section="page.list-your-choir"><a href="${ROOT}list-your-choir.html">List your group</a></p>
      <p data-section="page.perform"><a href="${ROOT}perform.html">Perform at SING!</a></p>
      <p data-section="page.volunteer"><a href="${ROOT}volunteer.html">Volunteer</a></p>
      <p><a href="${ROOT}sponsor.html">Sponsor SING!</a></p>
      <p data-section="page.shop"><a href="${ROOT}shop.html">Shop</a></p>
    </div>
    <div>
      <h2 class="footer-h">About</h2>
      <p><a href="${ROOT}about.html">Who we are</a></p>
      <p><a href="${ROOT}what-its-like.html">Never been to a show?</a></p>
      <p><a href="${ROOT}faq.html">Questions</a></p>
      <p><a href="${ROOT}access.html">Access</a></p>
      <p><a href="${ROOT}privacy.html">Privacy</a></p>
    </div>
    <div>
      <h2 class="footer-h">Say hi</h2>
      <p><a href="mailto:${esc(C.contactEmail)}">${esc(C.contactEmail)}</a></p>
      <p class="social">
        <a href="https://www.instagram.com/singedmonton/" target="_blank" rel="noopener">Instagram</a>
        <a href="https://www.facebook.com/singedmonton/" target="_blank" rel="noopener">Facebook</a>
        <a href="https://www.tiktok.com/@singedmonton" target="_blank" rel="noopener">TikTok</a>
        <a href="https://www.youtube.com/channel/UCJ4mS-R2DdVRvRpy5VI4snQ" target="_blank" rel="noopener">YouTube</a>
      </p>
      <p>Use <b>#SINGEDMONTON</b> to be featured</p>
    </div>
    <div>
      <h2 class="footer-h">SING! Prairies Society</h2>
      <p data-edit="foot.charity">A registered Canadian charity</p>
      <p><span data-section="page.policies"><a href="${ROOT}policies.html">Our policies</a> · </span><a href="${ROOT}privacy.html">Privacy</a></p>
      <p><a href="https://www.canadahelps.org/en/charities/sing-prairies-society/" target="_blank" rel="noopener">Donate</a></p>
    </div>
  </div>
  <p class="fine">© ${new Date().getFullYear()} SING! Prairies Society · <button type="button" class="linklike" id="editStart">Team: edit this page</button></p>
</footer>`;

  const main = document.querySelector("main");
  if (main) { main.id = main.id || "main"; main.setAttribute("tabindex", "-1"); }
  // Points at whatever the page calls its main area (the home page's is "top").
  const skipLink = `<a class="skip" href="#${main ? main.id : "main"}">Skip to the main content</a>`;
  const headerSlot = document.getElementById("siteHeader");
  if (headerSlot) headerSlot.outerHTML = skipLink + header;
  const footerSlot = document.getElementById("siteFooter");
  if (footerSlot) footerSlot.outerHTML = footer;

  const top = document.querySelector(".top");
  const menuBtn = document.querySelector(".menu-btn");
  const setMenu = open => { top.classList.toggle("open", open); menuBtn.setAttribute("aria-expanded", String(open)); };
  if (menuBtn) {
    menuBtn.addEventListener("click", () => setMenu(!top.classList.contains("open")));
    // The phone menu closes the way everything else does: tapping a link, tapping outside, or Esc.
    top.querySelectorAll(".nav a").forEach(a => a.addEventListener("click", () => setMenu(false)));
    document.addEventListener("click", ev => { if (top.classList.contains("open") && !top.contains(ev.target)) setMenu(false); });
    document.addEventListener("keydown", ev => {
      if (ev.key === "Escape" && top.classList.contains("open")) { setMenu(false); menuBtn.focus(); }
    });
  }
  // Listings gathered from groups' own websites say so, instead of saying "example".
  const seededCalendar = () => !!(window.SING_COMMUNITY_SEED && window.SING_COMMUNITY_SEED.length);
  const seededChoirs = () => !!(window.SING_CHOIRS_SEED && window.SING_CHOIRS_SEED.length);
  document.querySelectorAll("[data-preview-note]").forEach(el => {
    el.hidden = !!C.backendUrl;
    const seeded = el.dataset.previewNote === "calendar" ? seededCalendar() : el.dataset.previewNote === "choirs" ? seededChoirs() : false;
    if (seeded && el.dataset.seededText) el.textContent = el.dataset.seededText;
  });

  // ---------- backend ----------
  // Reading uses JSONP (a <script> tag) because Apps Script can't answer a browser's
  // cross-site check for plain JSON. Same trick as the One Place calendar feed.
  function jsonp(params) {
    return new Promise((resolve, reject) => {
      const cb = "singFeed" + Math.random().toString(36).slice(2);
      const s = document.createElement("script");
      const done = () => { clearTimeout(timer); delete window[cb]; s.remove(); };
      const timer = setTimeout(() => { done(); reject(new Error("timeout")); }, 15000);
      window[cb] = data => { done(); resolve(data); };
      s.onerror = () => { done(); reject(new Error("load")); };
      s.src = C.backendUrl + "?" + new URLSearchParams(Object.assign({}, params, { callback: cb }));
      document.head.appendChild(s);
    });
  }

  async function send(payload) {
    if (!C.backendUrl) { await new Promise(r => setTimeout(r, 400)); return { ok: true, preview: true }; }
    const res = await fetch(C.backendUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" }, // plain text avoids a cross-site check Apps Script can't answer
      body: JSON.stringify(payload),
    });
    return res.json();
  }

  function shrinkImage(file, max) {
    return new Promise((resolve, reject) => {
      const img = new Image(), url = URL.createObjectURL(file);
      img.onload = () => {
        const s = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        resolve(c.toDataURL("image/jpeg", 0.85));
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("That photo couldn't be read. Try a JPG or PNG.")); };
      img.src = url;
    });
  }

  // ---------- calendar data ----------
  function exampleEvents() {
    const t = today();
    return [
      { id: "ex1", title: "Fall Harmony Night", group: "Example Community Choir", type: "Concert", date: isoDay(addDays(t, 12)), time: "19:30", venue: "Example Hall", address: "", description: "This is an example of how a submitted concert looks on the calendar.", price: "$20, students $15", link: "", image: "" },
      { id: "ex2", title: "Open rehearsal: come sing with us", group: "Example Vocal Collective", type: "Open rehearsal", date: isoDay(addDays(t, 26)), time: "19:00", endTime: "21:00", venue: "Example Community League", address: "", description: "Try a rehearsal before you join. No experience needed.", price: "Free", link: "", image: "" },
      { id: "ex3", title: "Barbershop tag workshop", group: "Example Chorus", type: "Workshop or class", date: isoDay(addDays(t, 41)), time: "13:00", venue: "Example Church Hall", address: "", description: "Learn a few classic barbershop tags in an afternoon.", price: "$10", link: "", image: "" },
    ].map(e => Object.assign({ example: true }, e));
  }

  let calendarPromise;
  function loadCalendar() {
    return calendarPromise || (calendarPromise = (async () => {
      const snapshot = (window.SING_EVENTS && window.SING_EVENTS.events) || [];
      if (!C.backendUrl) return { sing: snapshot, community: seededCalendar() ? window.SING_COMMUNITY_SEED : exampleEvents(), preview: true };
      try {
        const d = await jsonp({ feed: "calendar" });
        if (d.ok) return { sing: d.sing && d.sing.length ? d.sing : snapshot, community: d.community || [] };
      } catch (e) { /* fall through to the snapshot */ }
      return { sing: snapshot, community: [], offline: true };
    })());
  }

  // SING! events (top level only) and community events, as one date-ordered list.
  function calendarItems(sing, community) {
    const fest = C.festival && C.festival.name;
    // "kind" says whose event it is; "source" (on community listings) is the page it came from.
    const a = sing.filter(e => !e.parent && e.date).map(e => ({
      id: e.id, kind: "sing", featured: e.title === fest, title: publicTitle(e), tentative: e.tentative,
      type: e.type, date: e.date, endDate: e.endDate, time: e.time, link: e.ticketUrl || "",
    }));
    const b = community.filter(e => e.date).map(e => Object.assign({}, e, { kind: "community" }));
    return a.concat(b).sort((x, y) => (x.date + (x.time || "")).localeCompare(y.date + (y.time || "")));
  }
  const upcoming = items => items.filter(i => parseDate(i.endDate || i.date) >= today());

  function whenText(it) {
    const d = parseDate(it.date);
    if (it.featured) {
      const end = addDays(parseDate(C.festival.start), (C.festival.days || 1) - 1);
      return `Concerts, workshops & more · ${MONTHS_LONG[d.getMonth()]} ${d.getDate()}–${end.getDate()}`;
    }
    const parts = [];
    if (it.endDate && it.endDate !== it.date) {
      const e = parseDate(it.endDate);
      parts.push(`${MONTHS[d.getMonth()]} ${d.getDate()} – ${MONTHS[e.getMonth()]} ${e.getDate()}`);
    } else parts.push(DAYS[d.getDay()]);
    if (it.time) parts.push(clockTime(it.time) + (it.endTime ? "–" + clockTime(it.endTime) : ""));
    return parts.join(" · ");
  }

  function calendarRow(it, full) {
    const d = parseDate(it.date);
    const link = safeUrl(it.link), image = safeUrl(it.image);
    const action = it.featured ? `<a class="btn btn-red" href="index.html#festival">See the weekend</a>`
      : link ? `<a class="btn btn-red" href="${esc(link)}" target="_blank" rel="noopener">${it.kind === "sing" ? "Tickets" : it.type === "Concert" ? "Tickets & info" : "Details"}</a>` : "";
    const kicker = (it.example ? '<span class="tag tag-example">Example</span>' : "")
      + (it.kind === "sing" ? '<span class="tag tag-sing">SING!</span>' : `<span class="tag">${esc(it.group)}</span>`)
      // A week-long thing isn't "a concert", so only single-day events get a type tag.
      + (it.type && !it.featured && !(it.endDate && it.endDate !== it.date) ? `<span class="cal-type">${esc(it.type)}</span>` : "");
    const details = full ? `
        ${it.kind === "community" && it.description ? `<p class="cal-desc">${esc(it.description)}</p>` : ""}
        ${it.price || it.address || it.source ? `<p class="cal-facts">${it.price ? `<span>${esc(it.price)}</span>` : ""}${it.address ? `<a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(it.address)}" target="_blank" rel="noopener">${esc(it.address)}</a>` : ""}${safeUrl(it.source) ? `<a class="listed" href="${esc(safeUrl(it.source))}" target="_blank" rel="noopener">Listed from ${esc(it.sourceName || "their website")}</a>` : ""}</p>` : ""}
        <p class="cal-facts"><a class="listed" href="${esc(addToCalendarUrl(it))}" target="_blank" rel="noopener" aria-label="Add ${esc(it.title)} to my calendar">Add to my calendar</a></p>` : "";
    return `<li class="cal-row${it.featured ? " featured" : ""}${full ? " full" : ""}">
      <div class="cal-date"><span class="cal-month">${MONTHS[d.getMonth()]} ${d.getFullYear()}</span><span class="cal-day">${d.getDate()}</span></div>
      <div class="cal-body">
        <div class="cal-kicker">${kicker}</div>
        <div class="cal-title"${it.kind === "sing" ? ` data-edit="event.${esc(it.id)}"` : ""}>${esc(it.title)}${it.tentative ? ' <span class="soon">— details coming soon</span>' : ""}</div>
        <div class="cal-meta">${esc([whenText(it), it.venue].filter(Boolean).join(" · "))}</div>
        ${details}
      </div>
      ${full && image ? `<img class="cal-img" src="${esc(image)}" alt="" loading="lazy">` : ""}
      ${action}
    </li>`;
  }

  // "Add to my calendar" for one event — Google Calendar's own add-an-event page.
  function addToCalendarUrl(it) {
    const stamp = (day, time) => day.replace(/-/g, "") + (time ? "T" + time.replace(":", "") + "00" : "");
    const endDay = it.endDate || it.date;
    let dates;
    if (it.time) {
      const endTime = it.endTime || (it.endDate ? it.time : `${String(Math.min(23, +it.time.slice(0, 2) + 2)).padStart(2, "0")}:${it.time.slice(3, 5)}`);
      dates = `${stamp(it.date, it.time)}/${stamp(endDay, endTime)}`;
    } else {
      const next = addDays(parseDate(endDay), 1);
      dates = `${stamp(it.date)}/${isoDay(next).replace(/-/g, "")}`;
    }
    const params = new URLSearchParams({
      action: "TEMPLATE", ctz: "America/Edmonton", dates,
      text: it.kind === "sing" ? `SING! Edmonton: ${it.title}` : `${it.title} — ${it.group || ""}`.trim(),
      location: [it.venue, it.address].filter(Boolean).join(", "),
      details: [it.description, safeUrl(it.link)].filter(Boolean).join("\n\n"),
    });
    return "https://calendar.google.com/calendar/render?" + params;
  }

  // Which part of town an event is in, worked out from its address or venue name.
  const AREAS = ["St. Albert", "Sherwood Park", "Spruce Grove", "Stony Plain", "Fort Saskatchewan",
    "Beaumont", "Leduc", "Morinville", "Alberta Beach", "Edmonton"];
  function areaOf(it) {
    const where = `${it.venue || ""} ${it.address || ""}`;
    const found = AREAS.find(a => where.toLowerCase().includes(a.toLowerCase().replace(".", "")) || where.includes(a));
    return found || (it.kind === "sing" ? "Edmonton" : "");
  }

  function subscribeUrls() {
    if (!C.backendUrl) return null;
    const https = C.backendUrl + "?feed=ics", webcal = https.replace(/^https:/, "webcal:");
    return { https, webcal, google: "https://calendar.google.com/calendar/r?cid=" + encodeURIComponent(webcal) };
  }

  // ---------- choir directory data ----------
  function exampleChoirs() {
    return [
      { id: "c1", name: "Example Community Choir", kind: "Choir", voices: ["Mixed voices"], days: ["Tuesday"], time: "7:00–9:00pm", location: "Example church hall, Old Strathcona", season: "September to May", joining: "Open to everyone (no audition)", accepting: "Yes", joiningDetails: "Just come to a rehearsal. No need to read music.", ages: "Adults", fees: "$150 a season", about: "An example listing, showing how a choir appears in the directory.", website: "", publicEmail: "", image: "" },
      { id: "c2", name: "Example Vocal Collective", kind: "A cappella group", voices: ["Mixed voices"], days: ["Sunday"], time: "6:00–8:30pm", location: "Downtown", season: "Year round", joining: "Audition required", accepting: "Waitlist", joiningDetails: "Auditions each August. Prepare a verse and chorus of any song.", ages: "18+", fees: "", about: "Contemporary a cappella covers and arrangements.", website: "", publicEmail: "", image: "" },
      { id: "c3", name: "Example Youth Singers", kind: "Children or youth choir", voices: ["Children & youth"], days: ["Wednesday", "Saturday"], time: "4:30–6:00pm", location: "West Edmonton", season: "September to June", joining: "Chat with the director first", accepting: "Yes", joiningDetails: "A friendly voice check to find the right group.", ages: "8–17", fees: "Sliding scale", about: "Building confident young singers.", website: "", publicEmail: "", image: "" },
    ].map(c => Object.assign({ example: true }, c));
  }
  function loadChoirs() {
    if (!C.backendUrl) return Promise.resolve({ choirs: seededChoirs() ? window.SING_CHOIRS_SEED : exampleChoirs(), preview: true });
    return jsonp({ feed: "choirs" })
      .then(d => ({ choirs: d.ok ? d.choirs || [] : [], offline: !d.ok }))
      .catch(() => ({ choirs: [], offline: true }));
  }

  // ---------- shop (products come from Square through the backend) ----------
  function loadShop() {
    return jsonp({ feed: "shop" })
      .then(d => ({ products: d.ok ? d.products || [] : [], shippingFee: d.shippingFee || 0, offline: !d.ok }))
      .catch(() => ({ products: [], shippingFee: 0, offline: true }));
  }

  // ---------- newsletter sign-up, wherever it appears ----------
  // Goes straight to Mailchimp's own sign-up address (read through a <script> tag, like the feeds).
  function bindSignup(form) {
    const note = form.parentElement.querySelector(".signup-note");
    const say = text => { note.textContent = text; note.hidden = false; };
    form.addEventListener("submit", ev => {
      ev.preventDefault();
      const mc = C.mailchimpSignupUrl;
      if (!mc) return say("Thanks! (Preview: sign-ups aren't connected to the mailing list yet.)");
      const cb = "mcSignup" + Date.now();
      const s = document.createElement("script");
      window[cb] = r => {
        delete window[cb]; s.remove();
        say(r.result === "success" ? "Thanks! Check your inbox to confirm your subscription."
          : String(r.msg || "That didn't work. Please try again.").replace(/<[^>]+>/g, "").replace(/^\d+ - /, ""));
      };
      s.onerror = () => say("That didn't work. Please try again.");
      s.src = mc.replace("/post?", "/post-json?") + "&" + new URLSearchParams({ EMAIL: form.email.value, FNAME: form.fname ? form.fname.value : "", c: cb });
      document.head.appendChild(s);
    });
  }

  // A short sign-up block any page can drop in with <div data-signup="…heading…"></div>
  document.querySelectorAll("[data-signup]").forEach((slot, i) => {
    slot.className = "wrap narrow signup-block";
    slot.innerHTML = `
      <h2 data-edit="signup.title.${i}">${esc(slot.dataset.signup || "Be first to hear")}</h2>
      <p data-edit="signup.body.${i}">Lineup announcements and first word when tickets go on sale, about once a month.</p>
      <form class="signup">
        <label class="sr" for="signupEmail${i}">Email</label>
        <input id="signupEmail${i}" name="email" type="email" placeholder="Email address" required autocomplete="email">
        <button class="btn btn-red" type="submit">Sign me up</button>
      </form>
      <p class="signup-note" role="status" hidden></p>`;
  });
  document.querySelectorAll("form.signup").forEach(bindSignup);

  // ---------- one choir's card, shared by the directory and the quiz ----------
  const openToAll = c => /no audition/i.test(c.joining || "");
  const ACCEPTING = { Yes: ["badge-gold", "Taking new members"], Waitlist: ["badge-grey", "Waitlist"], "Not right now": ["badge-grey", "Not taking new members right now"] };
  const initials = name => (name || "").split(/\s+/)
    .filter(w => /^[A-Za-z0-9]/.test(w) && !/^(the|of|and)$/i.test(w))
    .slice(0, 3).map(w => w[0].toUpperCase()).join("") || "♪";

  function choirCard(c, opts) {
    const o = opts || {};
    const days = c.days || [];
    const dayText = days.length > 2 ? days.map(d => d.slice(0, 3)).join(", ") : days.map(d => d + "s").join(" & ");
    const site = safeUrl(c.website), img = safeUrl(c.image);
    const email = /^[^@\s<>"]+@[^@\s<>"]+\.[^@\s<>"]+$/.test(c.publicEmail || "") ? c.publicEmail : "";
    const fact = (k, v) => (v ? `<dt>${k}</dt><dd>${esc(v)}</dd>` : "");
    const accept = ACCEPTING[c.accepting];
    const updated = c.verified || c.updated ? parseDate(c.verified || c.updated) : null;
    return `<article class="choir">
      ${img ? `<img class="choir-img" src="${esc(img)}" alt="" loading="lazy">`
            : `<div class="choir-img choir-img-blank" aria-hidden="true">${esc(initials(c.name))}</div>`}
      <div class="choir-body">
        <div class="cal-kicker">${c.example ? '<span class="tag tag-example">Example</span>' : ""}${c.kind ? `<span class="cal-type">${esc(c.kind)}</span>` : ""}</div>
        <h3>${esc(c.name)}</h3>
        ${(o.reasons || []).length ? `<ul class="tags why">${o.reasons.map(r => `<li>${esc(r)}</li>`).join("")}</ul>` : ""}
        <div class="badges">
          ${c.joining ? `<span class="badge ${openToAll(c) ? "badge-green" : "badge-navy"}">${esc(c.joining)}</span>` : ""}
          ${accept ? `<span class="badge ${accept[0]}">${accept[1]}</span>` : ""}
        </div>
        ${c.about ? `<p>${esc(c.about)}</p>` : ""}
        <dl class="facts">
          ${fact("Rehearsals", [dayText, c.time].filter(Boolean).join(", "))}
          ${fact("Where", c.location)}${fact("Season", c.season)}
          ${fact("Voices", (c.voices || []).join(", "))}${fact("Ages", c.ages)}${fact("Fees", c.fees)}
          ${fact("To join", c.joiningDetails)}
        </dl>
        <div class="choir-links">
          ${site ? `<a class="btn btn-navy btn-small" href="${esc(site)}" target="_blank" rel="noopener">Visit their website</a>` : ""}
          ${email ? `<a class="btn btn-outline btn-small" href="mailto:${esc(email)}?subject=${encodeURIComponent("Joining " + c.name)}">Email them</a>` : ""}
        </div>
        ${safeUrl(c.source) ? `<p class="updated">${updated ? `Checked ${MONTHS_LONG[updated.getMonth()]} ${updated.getFullYear()} · ` : ""}from <a class="listed" href="${esc(safeUrl(c.source))}" target="_blank" rel="noopener">${esc(c.sourceName || "their website")}</a> · <a href="list-your-choir.html">is this your group?</a></p>`
          : updated ? `<p class="updated">Listing updated ${MONTHS_LONG[updated.getMonth()]} ${updated.getFullYear()}</p>` : ""}
      </div>
    </article>`;
  }

  // ---------- edit in place ----------
  const EDITS = "sing-website-edits", MODE = "sing-website-editing";
  let editing = false;
  const loadEdits = () => { try { return JSON.parse(localStorage.getItem(EDITS)) || {}; } catch (e) { return {}; } };

  function refreshEditable(root) {
    // Published wording lives in config.js; this computer's unpublished edits sit on top.
    const edits = Object.assign({}, C.publishedEdits || {}, loadEdits());
    (root || document).querySelectorAll("[data-edit]").forEach(el => {
      const saved = edits[el.dataset.edit];
      if (saved != null && document.activeElement !== el) el.innerHTML = saved;
      if (editing) el.setAttribute("contenteditable", "plaintext-only"); else el.removeAttribute("contenteditable");
    });
  }
  function setEditing(on) {
    editing = on;
    try { on ? sessionStorage.setItem(MODE, "1") : sessionStorage.removeItem(MODE); } catch (e) {}
    document.body.classList.toggle("editing", on);
    document.getElementById("editBar").hidden = !on;
    refreshEditable();
    document.dispatchEvent(new CustomEvent("sing:editing", { detail: on }));
  }
  // While editing, clicking a button's words edits them instead of following the link.
  document.addEventListener("click", ev => {
    if (editing && ev.target.closest("a") && ev.target.closest("[data-edit]")) ev.preventDefault();
  }, true);
  document.addEventListener("focusout", ev => {
    const el = ev.target.closest && ev.target.closest("[data-edit]");
    if (!editing || !el) return;
    const edits = loadEdits(); edits[el.dataset.edit] = el.innerHTML;
    try { localStorage.setItem(EDITS, JSON.stringify(edits)); } catch (e) {}
  });
  document.getElementById("editStart").addEventListener("click", () => { setEditing(true); window.scrollTo({ top: 0 }); });
  document.getElementById("editDone").addEventListener("click", () => setEditing(false));
  // Edits only live on this computer until they're copied into config.js, so hand them over in one go.
  document.getElementById("editCopy").addEventListener("click", async () => {
    let products = null;
    try { products = JSON.parse(localStorage.getItem("sing-shop-products")); } catch (e) {}
    const changes = JSON.stringify({ publishedEdits: loadEdits(), products: products || undefined }, null, 2);
    try {
      await navigator.clipboard.writeText(changes);
      alert("Copied! Paste it into a message to Claude and your changes will be published.");
    } catch (e) { prompt("Copy this and send it to Claude:", changes); }
  });
  document.getElementById("editReset").addEventListener("click", () => {
    if (!confirm("Put all the words back the way they were?")) return;
    try { localStorage.removeItem(EDITS); } catch (e) {}
    location.reload();
  });

  window.SING = {
    C, MONTHS, MONTHS_LONG, DAYS, esc, parseDate, isoDay, addDays, today, clockTime, safeUrl, publicTitle, tidy,
    send, shrinkImage, loadCalendar, calendarItems, upcoming, calendarRow, subscribeUrls, loadChoirs, loadShop, areaOf, choirCard, openToAll,
    refreshEditable, isEditing: () => editing, preview: !C.backendUrl,
    // Scrolling glides, unless someone has asked their device for less motion.
    get motion() { return window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth"; },
  };

  refreshEditable();
  let resume = false;
  try { resume = sessionStorage.getItem(MODE) === "1"; } catch (e) {}
  if (resume || new URLSearchParams(location.search).has("edit")) setEditing(true);
})();
