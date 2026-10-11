(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const store = {
    get: (k, d) => { try { return JSON.parse(localStorage.getItem("cn12kh_" + k)) ?? d; } catch { return d; } },
    set: (k, v) => { try { localStorage.setItem("cn12kh_" + k, JSON.stringify(v)); } catch {} }
  };

  const S = {
    lang: store.get("lang", "en"), theme: store.get("theme", "dark"), cur: store.get("cur", "USD"),
    tab: "flights", view: "home",
    wish: new Set(store.get("wish", [])), bookings: [],
    bk: null // current booking draft
  };

  const bkKey = () => "bookings_" + (Auth.current()?.id ?? "guest");
  const t = k => I18N[S.lang][k] ?? k;
  const money = usd => S.cur === "USD" ? "$" + usd.toLocaleString("en-US") : (usd * RATE).toLocaleString("en-US") + " ៛";

  /* ---------- toast ---------- */
  function toast(msg) {
    const el = document.createElement("div");
    el.className = "toast"; el.textContent = msg;
    $("#toasts").append(el);
    setTimeout(() => el.remove(), 2600);
  }

  /* ---------- theme / lang / currency ---------- */
  function applyPrefs() {
    document.documentElement.dataset.theme = S.theme;
    document.documentElement.lang = S.lang;
    document.body.classList.toggle("km", S.lang === "km");
    $("#themeBtn").textContent = S.theme === "dark" ? "☀️" : "🌙";
    document.querySelectorAll("#langSeg button").forEach(b => b.classList.toggle("on", b.dataset.lang === S.lang));
    document.querySelectorAll("#curSeg button").forEach(b => b.classList.toggle("on", b.dataset.cur === S.cur));
    store.set("lang", S.lang); store.set("theme", S.theme); store.set("cur", S.cur);
  }

  function translateStatic() {
    document.querySelectorAll("[data-i18n]").forEach(e => e.textContent = t(e.dataset.i18n));
    document.querySelectorAll("[data-i18n-ph]").forEach(e => e.placeholder = t(e.dataset.i18nPh));
  }

  /* ---------- tabs + forms ---------- */
  function renderTabs() {
    $("#tabs").innerHTML = TABS.map(x =>
      `<button type="button" class="tab ${x.id === S.tab ? "on" : ""}" data-tab="${x.id}"><span>${x.icon}</span>${t(x.id)}</button>`).join("");
  }

  function renderForm() {
    const today = new Date().toISOString().slice(0, 10);
    const f = FORMS[S.tab].map(x => {
      let input;
      if (x.t === "select") input = `<select name="${x.k}">${x.o.map(o => `<option value="${o}">${t(o)}</option>`).join("")}</select>`;
      else if (x.t === "num") input = `<input type="number" name="${x.k}" min="1" value="1">`;
      else if (x.t === "date") input = `<input type="date" name="${x.k}" min="${today}" value="${today}">`;
      else if (x.t === "time") input = `<input type="time" name="${x.k}" value="09:00">`;
      else input = `<input name="${x.k}" list="places" autocomplete="off">`;
      return `<div class="field ${x.full ? "full" : ""}"><label>${t(x.k)}</label>${input}</div>`;
    }).join("");
    $("#svcForm").innerHTML = f + `<datalist id="places">${PLACES.map(p => `<option value="${p}">`).join("")}</datalist>` +
      `<button class="btn" type="submit">${t(CTA[S.tab])}</button>`;
  }

  /* ---------- destinations ---------- */
  const heartBtn = id => `<button class="heart" data-heart="${id}" aria-label="Wishlist">${S.wish.has(id) ? "❤️" : "🤍"}</button>`;
  const destCard = d => `
    <article class="card" data-dest="${d.id}">
      <div class="img" style="background:${d.bg}"><span>${d.emoji}</span>${heartBtn(d.id)}<em class="rate">⭐ ${d.rating}</em></div>
      <div class="body"><h4>${d.name[S.lang]}</h4><div class="price">${money(d.usd)}</div></div>
    </article>`;

  function renderDests() {
    $("#destGrid").innerHTML = DESTS.map(destCard).join("");
    const w = DESTS.filter(d => S.wish.has(d.id));
    $("#wishGrid").innerHTML = w.length ? w.map(destCard).join("") : `<p class="empty" style="grid-column:1/-1">${t("noWish")}</p>`;
  }

  function toggleWish(id) {
    S.wish.has(id) ? (S.wish.delete(id), toast(t("removedWish"))) : (S.wish.add(id), toast(t("addedWish")));
    store.set("wish", [...S.wish]);
    renderDests(); renderBottom();
  }

  /* ---------- other views ---------- */
  function renderBookings() {
    if (!Auth.current()) { $("#bookingList").innerHTML = `<p class="empty">${t("guestMsg")}</p><p style="text-align:center"><button class="btn" data-auth="login">${t("login")}</button></p>`; return; }
    $("#bookingList").innerHTML = S.bookings.length ? S.bookings.slice().reverse().map(b => `
      <div class="row"><span class="ic">🎫</span><div class="grow"><b>${b.title}</b><br><small>${b.ref} · ${b.date}</small></div><b>${money(b.usd)}</b></div>`).join("")
      : `<p class="empty">${t("noBookings")}</p>`;
  }
  function renderOffers() {
    $("#offerList").innerHTML = ["off1", "off2", "off3"].map((k, i) =>
      `<div class="row"><span class="ic">${["🏨", "🌴", "📱"][i]}</span><div class="grow">${t(k)}</div><button class="btn" data-offer="${i}">${t("bookNow")}</button></div>`).join("");
  }
  function renderProfile() {
    const u = Auth.current(), box = $("#profileBox"); box.style.display = "block";
    box.innerHTML = u ? `<div class="row"><div class="avatar">${u.name[0].toUpperCase()}</div><div class="grow"><b></b><br><small></small></div></div>
      <div class="row"><span class="grow">${t("bookings")}</span><b>${S.bookings.length}</b></div>
      <div class="row"><span class="grow">${t("wishlist")}</span><b>${S.wish.size}</b></div>
      <div class="row"><span class="grow">${t("rate")}</span></div>
      ${u.role === "admin" ? `<button class="btn" data-view="admin" style="width:100%;margin-bottom:8px">🛡️ ${t("adminPanel")}</button>` : ""}
      <button class="btn ghost" data-logout style="width:100%">${t("logout")}</button>`
      : `<div class="row"><span class="grow">${t("guestMsg")}</span></div>
      <button class="btn" data-auth="login" style="width:100%;margin-bottom:8px">${t("login")}</button>
      <button class="btn ghost" data-auth="signup" style="width:100%">${t("signup")}</button>`;
    if (u) { box.querySelector(".grow b").textContent = u.name; box.querySelector(".grow small").textContent = u.email; }
  }

  function renderBottom() {
    const items = [["home", "🏠"], ["bookings", "🧳"], ["wishlist", "❤️"], ["offers", "🏷️"], ["profile", "👤"]];
    $("#bottomNav").innerHTML = items.map(([id, ic]) => `
      <button data-view="${id}" class="${S.view === id ? "on" : ""}"><span>${ic}</span>${t(id)}
      ${id === "wishlist" && S.wish.size ? `<i class="badge">${S.wish.size}</i>` : ""}</button>`).join("");
  }

  function showView(v) {
    if (v === "admin" && !Auth.isAdmin()) v = "home";
    S.view = v;
    document.querySelectorAll(".view").forEach(e => e.hidden = e.id !== "view-" + v);
    $("#app").classList.toggle("wide", v === "gallery" || v === "admin");
    if (v === "gallery") Gallery.show();
    if (v === "admin") Auth.renderAdmin();
    renderBottom(); $("#app").scrollTo?.({ top: 0 }); window.scrollTo({ top: 0 });
  }

  /* ---------- booking modal ---------- */
  const STEPS = 4;
  function openBooking(opts) {
    if (!Auth.current()) { toast("🔐 " + t("loginFirst")); return Auth.openModal("login"); }
    S.bk = { step: 1, title: opts.title, usd: opts.usd, date: new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10),
             name: "", email: "", pay: "card", ref: "CN-" + Math.random().toString(36).slice(2, 8).toUpperCase() };
    $("#overlay").hidden = false; renderModal();
  }
  function closeModal() { $("#overlay").hidden = true; S.bk = null; }

  function qrSvg(seed) {
    let h = 0; for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    const n = 21, cell = 6; let r = "";
    const finder = (x, y) => (x < 7 && y < 7) || (x > n - 8 && y < 7) || (x < 7 && y > n - 8);
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      h = (h * 1664525 + 1013904223) >>> 0;
      let on = h >>> 28 > 7;
      if (finder(x, y)) { const fx = x % (n - 7), fy = y % (n - 7); on = Math.max(Math.abs(fx % 7 - 3), Math.abs(fy % 7 - 3)) !== 2; }
      if (on) r += `<rect x="${x * cell}" y="${y * cell}" width="${cell}" height="${cell}" fill="#0f172a"/>`;
    }
    return `<svg viewBox="0 0 ${n * cell} ${n * cell}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="QR">${r}</svg>`;
  }

  function renderModal() {
    const b = S.bk;
    $("#stepDots").innerHTML = Array.from({ length: STEPS }, (_, i) => `<i class="${i < b.step ? "on" : ""}"></i>`).join("");
    let body = "", foot = "";
    if (b.step === 1) {
      body = `<h3>${t("summary")}</h3>
        <div class="sumbox"><div><b>${b.title}</b></div><b>${money(b.usd)}</b></div>
        <div class="field"><label>${t("tripDate")}</label><input type="date" id="bkDate" value="${b.date}"></div>`;
      foot = `<button class="btn" data-next>${t("next")}</button>`;
    } else if (b.step === 2) {
      body = `<h3>${t("details")}</h3>
        <div class="field"><label>${t("fullName")}</label><input id="bkName" value="${b.name}"></div>
        <div class="field"><label>${t("email")}</label><input id="bkEmail" type="email" value="${b.email}"></div>`;
      foot = `<button class="btn ghost" data-back>${t("back")}</button><button class="btn" data-next>${t("next")}</button>`;
    } else if (b.step === 3) {
      body = `<h3>${t("payment")}</h3>
        <div class="pay">${PAYMENTS.map(p => `<button data-pay="${p.id}" class="${b.pay === p.id ? "on" : ""}">${p.label}</button>`).join("")}</div>
        <div class="sumbox"><span>${t("total")}</span><b>${money(b.usd)}</b></div>`;
      foot = `<button class="btn ghost" data-back>${t("back")}</button><button class="btn" data-next>${t("pay")}</button>`;
    } else {
      body = `<h3>✅ ${t("done")}</h3>
        <div class="ticket"><b>${t("voucher")}</b><div>${b.title}</div><div class="dash"></div>
        ${qrSvg(b.ref)}<div>${t("ref")}: <b>${b.ref}</b></div><small>${b.date} · ${b.name}</small></div>`;
      foot = `<button class="btn ghost" data-download>${t("download")}</button><button class="btn" data-close>${t("close")}</button>`;
    }
    $("#modalBody").innerHTML = `<div class="m-body">${body}</div>`;
    $("#modalFoot").innerHTML = foot;
  }

  function nextStep() {
    const b = S.bk;
    if (b.step === 1) b.date = $("#bkDate").value || b.date;
    if (b.step === 2) {
      b.name = $("#bkName").value.trim(); b.email = $("#bkEmail").value.trim();
      if (!b.name) return toast(t("fillName"));
    }
    if (b.step === 3) {
      S.bookings.push({ title: b.title, usd: b.usd, date: b.date, ref: b.ref });
      store.set(bkKey(), S.bookings); toast("🎉 " + t("booked"));
    }
    b.step++; renderModal();
  }

  /* ---------- events ---------- */
  document.addEventListener("click", e => {
    const q = s => e.target.closest(s);
    let el;
    if (q("#avatarBtn")) Auth.current() ? showView("profile") : Auth.openModal("login");
    else if ((el = q("[data-auth]"))) Auth.openModal(el.dataset.auth);
    else if (q("[data-logout]")) { Auth.logout(); showView("home"); }
    else if ((el = q("[data-lang]"))) { S.lang = el.dataset.lang; refresh(); }
    else if ((el = q("[data-cur]"))) { S.cur = el.dataset.cur; refresh(); }
    else if (q("#themeBtn")) { S.theme = S.theme === "dark" ? "light" : "dark"; applyPrefs(); }
    else if ((el = q("[data-tab]"))) { S.tab = el.dataset.tab; renderTabs(); renderForm(); }
    else if ((el = q("[data-heart]"))) { e.stopPropagation(); toggleWish(el.dataset.heart); }
    else if ((el = q("[data-dest]"))) { const d = DESTS.find(x => x.id === el.dataset.dest); openBooking({ title: d.name[S.lang], usd: d.usd }); }
    else if ((el = q("[data-view]"))) showView(el.dataset.view);
    else if (q("#promoBtn")) openBooking({ title: "☀️ " + t("summer"), usd: 499 });
    else if ((el = q("[data-offer]"))) openBooking({ title: t("off" + (+el.dataset.offer + 1)), usd: 299 });
    else if (q("#closeModal") || q("[data-close]") || e.target.id === "overlay") closeModal();
    else if (q("[data-next]")) nextStep();
    else if (q("[data-back]")) { S.bk.step--; renderModal(); }
    else if ((el = q("[data-pay]"))) { S.bk.pay = el.dataset.pay; renderModal(); }
    else if (q("[data-download]")) toast("⬇️ " + t("downloaded"));
    else if ((el = q("#suggest button"))) { $("#uSearch").value = el.textContent; $("#suggest").innerHTML = ""; }
    else if (!q(".search")) $("#suggest").innerHTML = "";
  });

  $("#svcForm").addEventListener("submit", e => {
    e.preventDefault();
    const v = new FormData(e.target);
    const place = v.get("to") || v.get("city") || v.get("dest") || v.get("dropoff") || "";
    toast("🔎 " + t("searching") + (place ? ": " + place : "…"));
    const usd = { flights: 420, hotels: 85, taxi: 12, tours: 60, activities: 35 }[S.tab];
    setTimeout(() => openBooking({ title: `${TABS.find(x => x.id === S.tab).icon} ${t(S.tab)}${place ? " · " + place : ""}`, usd }), 600);
  });

  $("#uSearch").addEventListener("input", e => {
    const q = e.target.value.trim().toLowerCase();
    $("#suggest").innerHTML = q ? PLACES.filter(p => p.toLowerCase().includes(q)).slice(0, 5)
      .map(p => `<button type="button">📍 ${p}</button>`).join("").replace(/📍 /g, "") : "";
  });

  document.addEventListener("keydown", e => { if (e.key === "Escape" && S.bk) closeModal(); });

  /* ---------- init ---------- */
  function refresh() {
    S.bookings = store.get(bkKey(), []);
    $("#avatarBtn").textContent = Auth.current()?.name[0].toUpperCase() ?? "👤";
    applyPrefs(); translateStatic(); renderTabs(); renderForm();
    renderDests(); renderBookings(); renderOffers(); renderProfile(); renderBottom();
    if (S.view === "admin") Auth.renderAdmin();
    document.dispatchEvent(new Event("cn:refresh"));
  }
  window.CN = { t, toast };
  Auth.onChange(() => { if (S.view === "admin" && !Auth.isAdmin()) showView("home"); refresh(); });
  refresh();
})();
