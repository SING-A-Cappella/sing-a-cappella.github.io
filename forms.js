// Every submission form on the site (events, choir listings, performer applications):
// extra checks, shrinking the photo, sending it to the backend, and the thank-you message.
(function () {
  const S = window.SING;

  document.querySelectorAll("form.sing-form").forEach(form => {
    const startedAt = Date.now();
    const status = form.querySelector(".form-status");
    const button = form.querySelector('button[type="submit"]');
    const thanks = document.getElementById(form.dataset.thanks);
    form.querySelectorAll('input[type="date"]').forEach(i => { i.min = S.isoDay(S.today()); });

    form.addEventListener("submit", async ev => {
      ev.preventDefault();
      status.textContent = "";
      const problem = check(form);
      if (problem) {
        status.textContent = problem.message;
        problem.el.scrollIntoView({ block: "center", behavior: "smooth" });
        return;
      }

      const data = {};
      new FormData(form).forEach((v, k) => {
        if (v instanceof File) return;
        v = String(v).trim();
        data[k] = k in data ? [].concat(data[k], v) : v;
      });
      // Tick-box groups always arrive as lists, even with one or no ticks.
      form.querySelectorAll("[data-multi]").forEach(g => { data[g.dataset.multi] = [].concat(data[g.dataset.multi] || []); });
      const honeypot = data.website_hp || "";
      delete data.website_hp;

      const label = button.textContent;
      button.disabled = true;
      button.textContent = "Sending…";
      try {
        let image = null;
        const file = form.querySelector('input[type="file"]');
        if (file && file.files[0]) image = { data: (await S.shrinkImage(file.files[0], 1600)).split(",")[1] };
        const res = await S.send({ kind: form.dataset.kind, data, image, startedAt, website_hp: honeypot });
        if (!res || !res.ok) throw Object.assign(new Error(res && res.error), { friendly: !!(res && res.error) });
        form.hidden = true;
        thanks.hidden = false;
        thanks.querySelector(".preview-sent").hidden = !res.preview;
        thanks.scrollIntoView({ block: "center", behavior: "smooth" });
      } catch (e) {
        status.textContent = e.friendly ? e.message : `Sorry, that didn't send. Please try again, or email ${S.C.contactEmail}.`;
        button.disabled = false;
        button.textContent = label;
      }
    });
  });

  function check(form) {
    for (const g of form.querySelectorAll("[data-need-one]")) {
      if (!g.querySelector("input:checked")) return { el: g, message: `Please choose at least one ${g.dataset.needOne}.` };
    }
    const date = form.querySelector('[name="date"]'), end = form.querySelector('[name="endDate"]');
    if (date && end && end.value && end.value < date.value) return { el: end, message: "The last day is before the first day." };
    const file = form.querySelector('input[type="file"]');
    if (file && file.files[0] && !/^image\//.test(file.files[0].type)) return { el: file, message: "Please choose a photo (JPG or PNG)." };
    return null;
  }
})();
