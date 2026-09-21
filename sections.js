/* Which parts of the site are switched on.
   Written by Festival HQ (Website → Sections → Publish), so nobody has to edit HTML to take a
   half-finished section off the site. Loaded in the <head> of every page, before anything is
   drawn, so a hidden section never flashes up.

   Keys are "home.something" for blocks on the front page and "page.something" for whole pages.
   Anything not listed is on. `?hide=` and `?show=` in the address are for previewing inside the
   app — they change nothing for anyone else. With `?hq=1` inside Festival HQ's preview, parts
   that are off stay visible but faded, each with its own switch. */
window.SING_SECTIONS = {
  updated: "2026-09-21T22:00:00+00:00",
  off: ["page.quiz", "page.shop", "page.volunteer"]
};
(function () {
  var S = window.SING_SECTIONS || {};
  var off = (S.off || []).slice(), q = null;
  try {
    q = new URLSearchParams(location.search);
    (q.get("hide") || "").split(",").filter(Boolean).forEach(function (k) { if (off.indexOf(k) < 0) off.push(k); });
    (q.get("show") || "").split(",").filter(Boolean).forEach(function (k) { off = off.filter(function (x) { return x !== k; }); });
  } catch (e) { }
  S.effective = off;
  var hq = !!(q && q.get("hq") === "1" && window.parent !== window);
  var clean = function (k) { return String(k).replace(/[^a-z0-9.-]/gi, ""); };

  var HQ_CSS = 'section[data-section],main[data-section]{position:relative}' +
    '.hq-sw{position:absolute;top:10px;right:10px;z-index:50;display:flex;align-items:center;gap:8px;font:600 13px/1 Poppins,system-ui,sans-serif;' +
    'background:#fff;color:#1c244b;border:0;border-radius:999px;padding:6px 8px 6px 12px;box-shadow:0 2px 10px rgba(0,0,0,.25);cursor:pointer}' +
    '.hq-sw i{width:34px;height:20px;border-radius:99px;background:#c9ccd6;position:relative;transition:background .15s}' +
    '.hq-sw i:after{content:"";position:absolute;top:2px;left:2px;width:16px;height:16px;border-radius:50%;background:#fff;transition:left .15s}' +
    '.hq-sw.on i{background:#17994f}.hq-sw.on i:after{left:16px}' +
    'main[data-section]>.hq-sw{position:sticky;top:10px;float:right;margin:10px}';
  var st = document.createElement("style");
  (document.head || document.documentElement).appendChild(st);
  function css() {
    return off.map(function (k) {
      k = clean(k);
      // In the preview, whole sections and pages fade instead of vanishing, so they can be switched back on.
      return hq ? '[data-section="' + k + '"]:not(section):not(main){display:none!important}' +
        'section[data-section="' + k + '"]>*:not(.hq-sw),main[data-section="' + k + '"]>*:not(.hq-sw){opacity:.3;filter:grayscale(1)}'
        : '[data-section="' + k + '"]{display:none!important}';
    }).join("") + (hq ? HQ_CSS : "");
  }
  function apply() {
    st.textContent = css();
    var btns = document.querySelectorAll(".hq-sw");
    for (var i = 0; i < btns.length; i++) {
      var on = off.indexOf(btns[i].getAttribute("data-key")) < 0;
      btns[i].className = "hq-sw" + (on ? " on" : "");
      btns[i].setAttribute("aria-checked", String(on));
      btns[i].firstChild.nodeValue = on ? "Showing " : "Hidden ";
    }
  }
  apply();

  document.addEventListener("DOMContentLoaded", function () {
    var main = document.querySelector("main[data-section]");
    if (hq) {
      var parts = document.querySelectorAll("section[data-section],main[data-section]");
      for (var i = 0; i < parts.length; i++) {
        var b = document.createElement("button");
        b.type = "button"; b.className = "hq-sw"; b.setAttribute("role", "switch");
        b.setAttribute("data-key", parts[i].getAttribute("data-section"));
        b.appendChild(document.createTextNode(""));
        b.appendChild(document.createElement("i"));
        b.addEventListener("click", function (ev) {
          ev.preventDefault(); ev.stopPropagation();
          window.parent.postMessage({ type: "sing-section-toggle", key: this.getAttribute("data-key") }, "*");
        });
        parts[i].insertBefore(b, parts[i].firstChild);
      }
      apply();
      // Festival HQ sends the whole list back after every change, so the page never reloads.
      window.addEventListener("message", function (ev) {
        if (ev.source !== window.parent || !ev.data || ev.data.type !== "sing-sections-set" || !Array.isArray(ev.data.off)) return;
        off = ev.data.off.map(String); S.effective = off; apply();
      });
      return;
    }
    /* A whole page that's off: say so plainly rather than showing an empty shell. */
    if (!main || off.indexOf(main.dataset.section) < 0) return;
    main.style.display = "";
    main.innerHTML = '<section class="section"><div class="wrap" style="max-width:640px;text-align:center">' +
      '<h1 class="h-small">Not quite ready</h1>' +
      '<p>This part of the site is still being put together. Everything else is up and running.</p>' +
      '<p><a class="btn btn-red" href="index.html">Back to the festival</a></p></div></section>';
  });
})();
