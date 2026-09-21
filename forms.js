// Every submission form on the site (events, choir listings, performer applications):
// extra checks, shrinking the photo, sending it to the backend, and the thank-you message.
(function () {
  const S = window.SING;

  // Files sent with a performer application. Keep in step with UPLOAD_TYPES and the
  // MAX_ numbers in backend/sing-website.gs, which checks all of this again.
  const MB = 1024 * 1024;
  const MAX_FILE = 20 * MB, MAX_TOTAL = 45 * MB, MAX_COUNT = { sample: 3, rider: 1 };
  const TYPES = {
    sample: {
      mimes: ["audio/mpeg", "audio/mp3", "audio/mp4", "audio/x-m4a", "audio/aac", "audio/wav", "audio/x-wav", "audio/wave",
        "audio/aiff", "audio/x-aiff", "audio/flac", "audio/x-flac", "audio/ogg", "audio/opus", "audio/webm", "video/mp4", "video/quicktime"],
      exts: ["mp3", "m4a", "aac", "wav", "aif", "aiff", "flac", "ogg", "opus", "mp4", "mov"],
    },
    rider: {
      mimes: ["application/pdf", "image/jpeg", "image/png", "image/gif", "image/webp", "image/heic", "image/heif"],
      exts: ["pdf", "jpg", "jpeg", "png", "gif", "webp", "heic", "heif"],
    },
  };
  // Some computers don't say what a file is, so then its ending (.mp3, .pdf) decides.
  const typeOk = (role, file) => {
    const type = (file.type || "").toLowerCase();
    if (TYPES[role].mimes.includes(type)) return true;
    const ext = (/\.([a-z0-9]+)$/i.exec(file.name) || [])[1];
    return (!type || type === "application/octet-stream") && !!ext && TYPES[role].exts.includes(ext.toLowerCase());
  };
  const megabytes = n => (n / MB < 10 ? (n / MB).toFixed(1) : Math.round(n / MB)) + " MB";
  const uploadsIn = form => [...form.querySelectorAll("input[data-upload]")]
    .flatMap(input => [...input.files].map(file => ({ file, role: input.dataset.upload, input })));

  document.querySelectorAll("form.sing-form").forEach(form => {
    const startedAt = Date.now();
    const status = form.querySelector(".form-status");
    const progress = form.querySelector(".form-progress");
    const button = form.querySelector('button[type="submit"]');
    const thanks = document.getElementById(form.dataset.thanks);
    form.querySelectorAll('input[type="date"]').forEach(i => { i.min = S.isoDay(S.today()); });

    // Say straight away if a chosen file won't fit, rather than after the whole form is filled in.
    form.querySelectorAll("input[data-upload]").forEach(input => input.addEventListener("change", () => {
      const problem = checkUploads(form);
      status.textContent = problem ? problem.message : "";
    }));

    form.addEventListener("submit", async ev => {
      ev.preventDefault();
      status.textContent = "";
      form.querySelectorAll('[aria-invalid="true"]').forEach(el => { el.removeAttribute("aria-invalid"); el.removeAttribute("aria-describedby"); });
      const problem = check(form);
      if (problem) {
        status.textContent = problem.message;
        // Screen readers hear which field and why; the keyboard lands right on it.
        if (!status.id) status.id = (form.id || "form") + "Status";
        const field = problem.el.matches("input, select, textarea") ? problem.el : problem.el.querySelector("input, select, textarea");
        if (field) { field.setAttribute("aria-invalid", "true"); field.setAttribute("aria-describedby", status.id); }
        problem.el.scrollIntoView({ block: "center", behavior: S.motion });
        if (field) field.focus({ preventScroll: true });
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

      const uploads = uploadsIn(form);
      const say = text => { if (progress) progress.textContent = text; };
      const label = button.textContent;
      button.disabled = true;
      button.textContent = "Sending…";
      let res;
      try {
        let image = null;
        const file = form.querySelector('input[type="file"]:not([data-upload])');
        if (file && file.files[0]) image = { data: (await S.shrinkImage(file.files[0], 1600)).split(",")[1] };
        const payload = { kind: form.dataset.kind, data, image, startedAt, website_hp: honeypot };
        if (uploads.length) {
          payload.uploads = { sample: uploads.filter(u => u.role === "sample").length, rider: uploads.filter(u => u.role === "rider").length };
          say("Sending your application…");
        }
        res = await S.send(payload);
        if (!res || !res.ok) throw Object.assign(new Error(res && res.error), { friendly: !!(res && res.error) });
      } catch (e) {
        say("");
        status.textContent = e.friendly ? e.message : `Sorry, that didn't send. Please try again, or email ${S.C.contactEmail}.`;
        button.disabled = false;
        button.textContent = label;
        return;
      }

      // The application is safe in Notion now. Each file goes on its own with the one-time key
      // that came back, so a file that fails never takes the application (or the other files) with it.
      const missed = [];
      for (let i = 0; i < uploads.length; i++) {
        const u = uploads[i];
        button.textContent = `Sending ${i + 1} of ${uploads.length}…`;
        say(`Application sent. Sending file ${i + 1} of ${uploads.length}: ${u.file.name}`);
        try {
          if (!res.uploadKey && !res.preview) throw new Error("no upload key came back");
          const r = await S.send({
            kind: "applicationFile", key: res.uploadKey, role: u.role, name: u.file.name, type: u.file.type,
            data: await asBase64(u.file), startedAt, website_hp: honeypot,
          });
          if (!r || !r.ok) throw new Error(r && r.error);
        } catch (e) {
          console.warn("A file didn't send:", u.file.name, e.message);
          missed.push(u.file.name);
        }
      }

      say("");
      form.hidden = true;
      thanks.hidden = false;
      thanks.querySelector(".preview-sent").hidden = !res.preview;
      const note = thanks.querySelector(".upload-missed");
      if (note && missed.length) {
        const one = missed.length === 1, email = S.esc(S.C.contactEmail);
        note.innerHTML = `Your application arrived, but ${one ? "this file" : "these files"} didn't: ${missed.map(n => `“${S.esc(n)}”`).join(", ")}. ` +
          `Please email ${one ? "it" : "them"} to <a href="mailto:${email}">${email}</a> with your group's name and we'll add ${one ? "it" : "them"} to your application.`;
        note.hidden = false;
      }
      thanks.scrollIntoView({ block: "center", behavior: S.motion });
      // The form just vanished, so put keyboard focus on the thank-you instead of nowhere.
      const heading = thanks.querySelector("h2, h3") || thanks;
      heading.setAttribute("tabindex", "-1");
      heading.focus({ preventScroll: true });
    });
  });

  function asBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(",")[1] || "");
      reader.onerror = () => reject(new Error("That file couldn't be read."));
      reader.readAsDataURL(file);
    });
  }

  function check(form) {
    for (const g of form.querySelectorAll("[data-need-one]")) {
      if (!g.querySelector("input:checked")) return { el: g, message: `Please choose at least one ${g.dataset.needOne}.` };
    }
    const date = form.querySelector('[name="date"]'), end = form.querySelector('[name="endDate"]');
    if (date && end && end.value && end.value < date.value) return { el: end, message: "The last day is before the first day." };
    const file = form.querySelector('input[type="file"]:not([data-upload])');
    if (file && file.files[0] && !/^image\//.test(file.files[0].type)) return { el: file, message: "Please choose a photo (JPG or PNG)." };
    return checkUploads(form);
  }

  function checkUploads(form) {
    const uploads = uploadsIn(form);
    for (const role of Object.keys(MAX_COUNT)) {
      const mine = uploads.filter(u => u.role === role);
      if (mine.length > MAX_COUNT[role]) {
        return { el: mine[0].input, message: role === "rider" ? "Please choose just one tech rider." : `Please choose up to ${MAX_COUNT[role]} audio or video files.` };
      }
    }
    for (const u of uploads) {
      if (!typeOk(u.role, u.file)) {
        return { el: u.input, message: u.role === "rider"
          ? `“${u.file.name}” isn't a PDF or a photo. Please choose one of those for the tech rider.`
          : `“${u.file.name}” isn't an audio, MP4 or MOV file. Please choose one of those, or add a link instead.` };
      }
      if (!u.file.size) return { el: u.input, message: `“${u.file.name}” seems to be empty. Please choose it again.` };
      if (u.file.size > MAX_FILE) {
        return { el: u.input, message: `“${u.file.name}” is ${megabytes(u.file.size)}, and each file can be up to 20 MB. Please add it as a link instead.` };
      }
    }
    const total = uploads.reduce((sum, u) => sum + u.file.size, 0);
    if (total > MAX_TOTAL) {
      return { el: uploads[0].input, message: `Your files add up to ${megabytes(total)}, and the form can send 45 MB altogether. Please add the biggest one as a link instead.` };
    }
    return null;
  }
})();
