/* Which parts of the site are switched on.
   Written by Festival HQ (Website → Sections → Publish), so nobody has to edit HTML to take a
   half-finished section off the site. Loaded in the <head> of every page, before anything is
   drawn, so a hidden section never flashes up.

   Keys are "home.something" for blocks on the front page and "page.something" for whole pages.
   Anything not listed is on. `?hide=` and `?show=` in the address are for previewing inside the
   app — they change nothing for anyone else. */
window.SING_SECTIONS = {
  updated: "2026-09-18T04:24:00+00:00",
  off: []
};
(function () {
  var S = window.SING_SECTIONS || {};
  var off = (S.off || []).slice();
  try {
    var q = new URLSearchParams(location.search);
    (q.get("hide") || "").split(",").filter(Boolean).forEach(function (k) { if (off.indexOf(k) < 0) off.push(k); });
    (q.get("show") || "").split(",").filter(Boolean).forEach(function (k) { off = off.filter(function (x) { return x !== k; }); });
  } catch (e) { }
  S.effective = off;
  if (!off.length) return;

  var css = off.map(function (k) { return '[data-section="' + k.replace(/"/g, "") + '"]{display:none!important}'; }).join("");
  var st = document.createElement("style");
  st.textContent = css;
  (document.head || document.documentElement).appendChild(st);

  /* A whole page that's off: say so plainly rather than showing an empty shell. */
  document.addEventListener("DOMContentLoaded", function () {
    var main = document.querySelector("main[data-section]");
    if (!main || off.indexOf(main.dataset.section) < 0) return;
    main.style.display = "";
    main.innerHTML = '<section class="section"><div class="wrap" style="max-width:640px;text-align:center">' +
      '<h1 class="h-small">Not quite ready</h1>' +
      '<p>This part of the site is still being put together. Everything else is up and running.</p>' +
      '<p><a class="btn btn-red" href="index.html">Back to the festival</a></p></div></section>';
  });
})();
