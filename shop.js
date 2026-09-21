// Shop.
// Live: products, prices, sizes, photos and stock come from Square (items in the "Website shop"
// category). Buy opens Square's checkout; print-on-demand items are then sent to Printful by the backend.
// Preview (no backend yet): example products that the team can reword, price and add to in edit mode.
(function () {
  const S = window.SING;
  if (S.pageOff()) return;
  const grid = document.getElementById("shopGrid");
  const money = (amount, currency) => new Intl.NumberFormat("en-CA", { style: "currency", currency: currency || "CAD" }).format(amount);

  if (new URLSearchParams(location.search).has("thanks")) document.getElementById("shopThanks").hidden = false;
  if (S.C.backendUrl) liveShop(); else previewShop();

  // ---------------- live, from Square ----------------
  async function liveShop() {
    grid.innerHTML = '<p class="empty">Loading the shop…</p>';
    const { products, shippingFee, offline } = await S.loadShop();
    grid.innerHTML = products.map(liveCard).join("") || `<p class="empty">${offline
      ? "The shop couldn't load just now. Please try again in a minute."
      : "New merch is on its way. Check back soon!"}</p>`;
    if (shippingFee > 0) document.getElementById("shipNote").textContent = `Shipping is a flat ${money(shippingFee)} per order.`;
    const editNote = document.getElementById("shopEditNote");
    const showEditNote = () => { editNote.hidden = !S.isEditing(); };
    document.addEventListener("sing:editing", showEditNote);
    showEditNote();
  }

  function liveCard(p) {
    const vars = p.variations;
    const firstOpen = vars.find(v => !v.soldOut);
    const low = vars.reduce((a, b) => (b.price < a.price ? b : a));
    const priceText = vars.some(v => v.price !== low.price) ? `From ${money(low.price, low.currency)}` : money(low.price, low.currency);
    const image = S.safeUrl(p.image);
    return `<article class="product">
      <div class="product-img">${image ? `<img src="${S.esc(image)}" alt="${S.esc(p.name)}" loading="lazy">` : '<span class="product-placeholder" aria-hidden="true">SING!</span>'}</div>
      <div class="product-body">
        ${p.pod ? '<span class="tag">Printed to order</span>' : ""}
        <h3>${S.esc(p.name)}</h3>
        <p class="price">${priceText}</p>
        ${p.description ? `<p>${S.esc(p.description)}</p>` : ""}
        <div class="buy-row">
          ${vars.length > 1 ? `<label class="inline-field">Choose
            <select class="variation">${vars.map(v => `<option value="${S.esc(v.id)}"${v.soldOut ? " disabled" : ""}${firstOpen && v.id === firstOpen.id ? " selected" : ""}>${S.esc(v.name)} · ${money(v.price, v.currency)}${v.soldOut ? " (sold out)" : ""}</option>`).join("")}</select>
          </label>` : ""}
          ${firstOpen ? `<button type="button" class="btn btn-red buy" data-variation="${S.esc(firstOpen.id)}">Buy</button>` : '<span class="btn btn-disabled">Sold out</span>'}
          <p class="form-status" role="alert"></p>
        </div>
      </div>
    </article>`;
  }

  grid.addEventListener("click", async ev => {
    const btn = ev.target.closest(".buy");
    if (!btn || !S.C.backendUrl) return;
    const card = btn.closest(".product"), select = card.querySelector(".variation");
    const status = card.querySelector(".form-status");
    const label = btn.textContent;
    btn.disabled = true; btn.textContent = "Opening checkout…"; status.textContent = "";
    try {
      const res = await S.send({ kind: "checkout", variationId: select ? select.value : btn.dataset.variation, quantity: 1 });
      if (!res.ok) throw Object.assign(new Error(res.error), { friendly: true });
      location.href = res.url;
    } catch (e) {
      status.textContent = e.friendly ? e.message : `Sorry, checkout didn't open. Please try again, or email ${S.C.contactEmail}.`;
      btn.disabled = false; btn.textContent = label;
    }
  });

  // ---------------- preview, before Square is connected ----------------
  function previewShop() {
    const KEY = "sing-shop-products";
    const EXAMPLES = [
      { id: "ex-tee", example: true, name: "SING! Edmonton t-shirt", price: "$25", description: "Soft cotton tee with the SING! logo.", image: "", buyUrl: "" },
      { id: "ex-tote", example: true, name: "Tote bag", price: "$20", description: "Room for sheet music, a water bottle and snacks.", image: "", buyUrl: "" },
      { id: "ex-sticker", example: true, name: "Sticker pack", price: "$5", description: "SING! stickers for your folder or water bottle.", image: "", buyUrl: "" },
    ];
    const load = () => { try { return JSON.parse(localStorage.getItem(KEY)); } catch (e) { return null; } };
    const save = () => { try { localStorage.setItem(KEY, JSON.stringify(products)); } catch (e) { alert("That photo is too big to save on this computer. Try a smaller one."); } };
    let products = load() || ((S.C.products || []).length ? S.C.products : EXAMPLES);

    function render() {
      const editing = S.isEditing();
      document.getElementById("shopPreview").hidden = false;
      grid.innerHTML = products.map((p, i) => {
        const buy = S.safeUrl(p.buyUrl);
        return `<article class="product" data-i="${i}">
          <div class="product-img">
            ${p.image ? `<img src="${S.esc(p.image)}" alt="">` : '<span class="product-placeholder" aria-hidden="true">SING!</span>'}
            ${editing ? '<label class="img-pick">Choose photo<input type="file" accept="image/*"></label>' : ""}
          </div>
          <div class="product-body">
            ${p.example ? '<span class="tag tag-example">Example</span>' : ""}
            <h3 data-field="name">${S.esc(p.name)}</h3>
            <p class="price" data-field="price">${S.esc(p.price)}</p>
            <p data-field="description">${S.esc(p.description)}</p>
            ${editing
              ? `<label class="inline-field">Checkout link<input type="url" data-field="buyUrl" value="${S.esc(p.buyUrl)}" placeholder="https://square.link/…"></label>
                 <button type="button" class="linklike remove">Remove this product</button>`
              : buy ? `<a class="btn btn-red" href="${S.esc(buy)}" target="_blank" rel="noopener">Buy</a>`
                    : '<span class="btn btn-disabled">Coming soon</span>'}
          </div>
        </article>`;
      }).join("") + (editing ? '<button type="button" class="product add-product">+ Add a product</button>' : "");
      if (editing) grid.querySelectorAll("[data-field]:not(input)").forEach(el => el.setAttribute("contenteditable", "plaintext-only"));
    }

    const productOf = el => { const card = el.closest(".product[data-i]"); return card && products[+card.dataset.i]; };

    grid.addEventListener("focusout", ev => {
      const el = ev.target, p = productOf(el);
      if (!p || !el.dataset.field) return;
      const value = el.tagName === "INPUT" ? el.value.trim() : el.textContent.trim();
      if (p[el.dataset.field] === value) return;
      p[el.dataset.field] = value;
      p.example = false;
      save();
    });
    grid.addEventListener("change", async ev => {
      if (ev.target.type !== "file" || !ev.target.files[0]) return;
      const p = productOf(ev.target);
      try { p.image = await S.shrinkImage(ev.target.files[0], 900); p.example = false; save(); render(); }
      catch (e) { alert("That photo couldn't be read. Try a JPG or PNG."); }
    });
    grid.addEventListener("click", ev => {
      if (ev.target.closest(".add-product")) {
        products.push({ id: "p" + Date.now(), name: "New product", price: "$", description: "Describe it here.", image: "", buyUrl: "" });
        save(); render();
        const names = grid.querySelectorAll(".product[data-i] h3");
        names[names.length - 1].focus();
      } else if (ev.target.closest(".remove")) {
        const p = productOf(ev.target);
        if (!confirm(`Remove “${p.name}” from the shop?`)) return;
        products.splice(products.indexOf(p), 1);
        save(); render();
      }
    });
    document.addEventListener("sing:editing", render);
    render();
  }
})();
