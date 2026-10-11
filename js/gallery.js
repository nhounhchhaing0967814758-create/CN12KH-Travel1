/* Photo gallery: 25 destinations, photos fetched live from Wikimedia Commons (CORS-enabled API).
   Nothing is hard-coded: titles, credits, licenses and links come straight from Commons metadata. */
const Gallery = (() => {
  const $ = (s, r = document) => r.querySelector(s);
  const t = k => CN.t(k);
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const MIN_SHOWN = 5, MAX_SHOWN = 8;

  const P = [
    ["Banteay Meanchey","បន្ទាយមានជ័យ",'"Banteay Meanchey" OR "Banteay Chhmar" OR Poipet'],
    ["Battambang","បាត់ដំបង",'Battambang'],
    ["Kampong Cham","កំពង់ចាម",'"Kampong Cham"'],
    ["Kampong Chhnang","កំពង់ឆ្នាំង",'"Kampong Chhnang"'],
    ["Kampong Speu","កំពង់ស្ពឺ",'"Kampong Speu" OR "Kirirom"'],
    ["Kampong Thom","កំពង់ធំ",'"Kampong Thom" OR Sambor Prei Kuk'],
    ["Kampot","កំពត",'Kampot'],
    ["Kandal","កណ្តាល",'"Kandal Province" OR "Oudong" OR "Udong"'],
    ["Kep","កែប",'"Kep Province" OR "Kep, Cambodia"'],
    ["Koh Kong","កោះកុង",'"Koh Kong"'],
    ["Kratié","ក្រចេះ",'Kratie OR Kratié'],
    ["Mondulkiri","មណ្ឌលគិរី",'Mondulkiri OR Mondulkiri Province'],
    ["Oddar Meanchey","ឧត្តរមានជ័យ",'"Oddar Meanchey" OR "Anlong Veng" OR "Preah Chan Reach"'],
    ["Pailin","ប៉ៃលិន",'Pailin'],
    ["Phnom Penh","ភ្នំពេញ",'"Phnom Penh"'],
    ["Preah Sihanouk","ព្រះសីហនុ",'"Preah Sihanouk" OR Sihanoukville OR "Ream National Park"'],
    ["Preah Vihear","ព្រះវិហារ",'"Preah Vihear" OR "Koh Ker"'],
    ["Pursat","ពោធិ៍សាត់",'Pursat OR "Tonle Sap" Pursat'],
    ["Ratanakiri","រតនគិរី",'Ratanakiri OR Banlung'],
    ["Siem Reap","សៀមរាប",'"Siem Reap" OR Angkor'],
    ["Stung Treng","ស្ទឹងត្រែង",'"Stung Treng"'],
    ["Svay Rieng","ស្វាយរៀង",'"Svay Rieng"'],
    ["Takeo","តាកែវ",'Takeo OR "Phnom Da" OR "Angkor Borei"'],
    ["Tboung Khmum","ត្បូងឃ្មុំ",'"Tboung Khmum" OR "Tbong Khmum"'],
    ["Prey Veng","ព្រៃវែង",'"Prey Veng"']
  ].map(([en, km, q]) => ({ en, km, q, s: en.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z]+/g, "-") }));

  const BAD = /\b(map|flag|logo|seal|locator|coat of arms|diagram|stamp|banknote|poster|screenshot|plan|chart|signature|scan)\b/i;
  const API = "https://commons.wikimedia.org/w/api.php";
  const state = {}; P.forEach(p => state[p.s] = { status: "idle", items: [] });
  let built = false, active = "all", term = "", obs = null, lb = { list: [], i: 0 };

  const plain = h => new DOMParser().parseFromString(h || "", "text/html").body.textContent.replace(/\s+/g, " ").trim();

  async function fetchProvince(p) {
    const ck = "cn12kh_gal1_" + p.s;
    try { const c = JSON.parse(localStorage.getItem(ck)); if (c && Date.now() - c.ts < 6048e5) return c.items; } catch {}
    const params = new URLSearchParams({ action: "query", format: "json", origin: "*", generator: "search", gsrnamespace: "6", gsrlimit: "50",
      gsrsearch: `(${p.q}) Cambodia filetype:bitmap`, prop: "imageinfo", iiprop: "url|size|mime|extmetadata", iiurlwidth: "800", iiextmetadatalanguage: "en" });
    const r = await fetch(API + "?" + params);
    if (!r.ok) throw new Error("HTTP " + r.status);
    const j = await r.json();
    const pages = Object.values(j.query?.pages || {}).sort((a, b) => a.index - b.index);
    let all = [];
    for (const pg of pages) {
      const ii = pg.imageinfo?.[0];
      if (!ii || ii.mime !== "image/jpeg" || ii.width < 1200) continue;
      const name = pg.title.replace(/^File:/, "").replace(/\.[a-z]+$/i, "").replace(/_/g, " ");
      if (BAD.test(name)) continue;
      const m = ii.extmetadata || {}, v = k => m[k]?.value;
      all.push({
        name, desc: plain(v("ImageDescription")).slice(0, 220),
        cats: (v("Categories") || "").split("|").filter(c => c && !/(self-published|^cc-|^pd|licen[cs]e|^files |^uploaded|quality|featured|valued|^media|^images)/i.test(c)).slice(0, 3),
        artist: plain(v("Artist")) || "", lic: v("LicenseShortName") || "", licUrl: v("LicenseUrl") || "",
        attr: v("AttributionRequired") === "true", restr: plain(v("Restrictions")),
        thumb: ii.thumburl || ii.url, full: ii.width >= 1920 && ii.thumburl ? ii.thumburl.replace(/\/\d+px-(?=[^/]*$)/, "/1920px-") : ii.url,
        orig: ii.url, page: ii.descriptionurl, w: ii.width, h: ii.height, lat: v("GPSLatitude"), lon: v("GPSLongitude")
      });
    }
    all.sort((a, b) => (b.w >= 1920) - (a.w >= 1920));              // prefer Full-HD+, keep relevance order inside groups
    const seen = new Set(), pick = [], rest = [];
    for (const it of all) {                                         // avoid 5 shots of the same scene
      const stem = it.name.toLowerCase().replace(/[\d_\-\s()]+/g, " ").slice(0, 22);
      (seen.has(stem) ? rest : pick).push(it); seen.add(stem);
    }
    const items = pick.concat(rest).slice(0, MAX_SHOWN);
    try { localStorage.setItem(ck, JSON.stringify({ ts: Date.now(), items })); } catch {}
    return items;
  }

  async function load(p) {
    const st = state[p.s]; if (st.status === "loading" || st.status === "ok") return;
    st.status = "loading"; paint(p);
    try { st.items = await fetchProvince(p); st.status = "ok"; } catch (e) { st.status = "err"; }
    paint(p); progress(); applyFilter();
  }

  const where = p => p.en === "Phnom Penh" ? "Phnom Penh (capital), Cambodia" : p.en + " Province, Cambodia";
  function paint(p) {
    const st = state[p.s], g = $("#gal-" + p.s), stat = $("#stat-" + p.s); if (!g) return;
    if (st.status === "loading") { g.innerHTML = Array(5).fill('<div class="ph sk"></div>').join(""); stat.textContent = "…"; }
    else if (st.status === "err") { g.innerHTML = `<button class="btn ghost" data-retry="${p.s}">${t("retry")}</button>`; stat.textContent = "⚠"; }
    else if (st.status === "ok") {
      g.innerHTML = st.items.map((it, k) => `
        <figure class="ph" data-s="${p.s}" data-i="${k}">
          <img loading="lazy" src="${esc(it.thumb)}" alt="${esc(it.name)} – ${esc(p.en)}, Cambodia">
          <figcaption><b>${esc(it.name)}</b><span>📍 ${esc(where(p))}</span>${it.desc ? `<em>${esc(it.desc)}</em>` : ""}
            <a href="${esc(it.page)}" target="_blank" rel="noopener noreferrer">${t("viewOrig")} ↗</a></figcaption></figure>`).join("") || `<p class="empty">${t("noResults")}</p>`;
      stat.textContent = st.items.length >= MIN_SHOWN ? `✓ ${st.items.length} ${t("photosWord")}` : `⚠ ${st.items.length}/${MIN_SHOWN}`;
    } else { g.innerHTML = '<div class="ph sk"></div>'.repeat(5); stat.textContent = ""; }
    const chip = $(`[data-g="${p.s}"]`); if (chip) chip.dataset.ok = st.status === "ok" ? (st.items.length >= MIN_SHOWN ? "1" : "0") : "";
  }

  function progress() {
    const ready = P.filter(p => state[p.s].status === "ok" && state[p.s].items.length >= MIN_SHOWN).length;
    const n = P.reduce((a, p) => a + state[p.s].items.length, 0);
    const el = $("#gProg"); if (!el) return;
    el.querySelector("span").textContent = `${ready}/25 ${t("ready")} · ${n} ${t("photosWord")}`;
    el.querySelector("i").style.width = ready / 25 * 100 + "%";
  }

  function applyFilter() {
    const q = term.toLowerCase();
    P.forEach(p => {
      const sec = $("#prov-" + p.s); if (!sec) return;
      const nameHit = !q || p.en.toLowerCase().includes(q) || p.km.includes(term);
      let any = false;
      sec.querySelectorAll("figure.ph[data-i]").forEach(f => {
        const it = state[p.s].items[+f.dataset.i];
        const hit = nameHit || (it.name + " " + it.desc + " " + it.artist).toLowerCase().includes(q);
        f.hidden = !hit; any = any || hit;
      });
      sec.hidden = !((active === "all" || active === p.s) && (nameHit || any));
    });
    const none = P.every(p => $("#prov-" + p.s)?.hidden);
    $("#gNone").hidden = !none;
  }

  async function loadAll() {
    const queue = P.filter(p => state[p.s].status !== "ok"); const worker = async () => { while (queue.length) await load(queue.shift()); };
    await Promise.all([worker(), worker(), worker()]);
  }

  function toCsv() {
    const rows = [["destination_en", "destination_km", "attraction (Commons file title)", "location", "width", "height", "photographer", "license", "license_url", "source_page", "original_file"]];
    P.forEach(p => state[p.s].items.forEach(it => rows.push([p.en, p.km, it.name, where(p), it.w, it.h, it.artist, it.lic, it.licUrl, it.page, it.orig])));
    const csv = "\ufeff" + rows.map(r => r.map(c => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\r\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" })); a.download = "cambodia-photos.csv"; a.click();
    URL.revokeObjectURL(a.href);
  }

  /* ----- lightbox ----- */
  function openLb(s, i) { lb = { list: state[s].items, i, p: P.find(x => x.s === s) }; showLb(); $("#lb").hidden = false; document.body.style.overflow = "hidden"; }
  function showLb() {
    const it = lb.list[lb.i], p = lb.p;
    $("#lbImg").src = it.full; $("#lbImg").alt = it.name;
    const restr = [it.attr ? "Attribution required" : "", /SA/i.test(it.lic) ? "Share-alike" : "", it.restr].filter(Boolean).join(" · ");
    $("#lbCap").innerHTML = `<h4>${esc(it.name)}</h4>
      <p>📍 ${esc(where(p))}${it.lat ? ` · ${(+it.lat).toFixed(4)}, ${(+it.lon).toFixed(4)}` : ""} · ${it.w}×${it.h}px</p>
      ${it.desc ? `<p>${esc(it.desc)}</p>` : ""}
      ${it.cats.length ? `<p><small>Commons: ${it.cats.map(esc).join(" · ")}</small></p>` : ""}
      <p>${t("photographer")}: ${esc(it.artist || "see source page")}<br>${t("license")}: ${it.licUrl ? `<a href="${esc(it.licUrl)}" target="_blank" rel="noopener noreferrer">${esc(it.lic)}</a>` : esc(it.lic || "see source page")}${restr ? ` (${esc(restr)})` : ""}</p>
      <p><a href="${esc(it.page)}" target="_blank" rel="noopener noreferrer">${t("viewOrig")} ↗</a> · <a href="${esc(it.orig)}" target="_blank" rel="noopener noreferrer">${t("fullRes")} ↗</a></p>
      <small>${lb.i + 1} / ${lb.list.length}</small>`;
  }
  const stepLb = d => { lb.i = (lb.i + d + lb.list.length) % lb.list.length; showLb(); };
  const closeLb = () => { $("#lb").hidden = true; $("#lbImg").src = ""; document.body.style.overflow = ""; };

  function ensureLb() {
    if ($("#lb")) return;
    document.body.insertAdjacentHTML("beforeend", `<div class="lb" id="lb" hidden role="dialog" aria-modal="true"><button class="lb-x" aria-label="Close">✕</button>
      <button class="lb-p" aria-label="Previous">‹</button><button class="lb-n" aria-label="Next">›</button><img id="lbImg" alt=""><div class="lb-cap" id="lbCap"></div></div>`);
    const lbEl = $("#lb"); let x0 = null;
    lbEl.addEventListener("click", e => { if (e.target.closest(".lb-x") || e.target === lbEl) closeLb(); else if (e.target.closest(".lb-p")) stepLb(-1); else if (e.target.closest(".lb-n")) stepLb(1); });
    lbEl.addEventListener("touchstart", e => x0 = e.touches[0].clientX, { passive: true });
    lbEl.addEventListener("touchend", e => { if (x0 !== null && Math.abs(e.changedTouches[0].clientX - x0) > 50) stepLb(e.changedTouches[0].clientX < x0 ? 1 : -1); x0 = null; });
    document.addEventListener("keydown", e => { if (lbEl.hidden) return; if (e.key === "Escape") closeLb(); if (e.key === "ArrowRight") stepLb(1); if (e.key === "ArrowLeft") stepLb(-1); });
  }

  /* ----- render ----- */
  function render() {
    $("#galleryRoot").innerHTML = `
      <div class="g-head"><h2>${t("galleryTitle")}</h2><p>${t("gallerySub")}</p>
        <div class="field"><input id="gSearch" type="search" placeholder="${esc(t("searchGallery"))}" value="${esc(term)}"></div>
        <div class="gchips"><button class="gchip" data-g="all">${t("all")}</button>${P.map(p => `<button class="gchip" data-g="${p.s}">${esc(p.en)}</button>`).join("")}</div>
        <div class="g-prog" id="gProg"><span></span><div><i></i></div></div>
        <div class="g-tools"><button class="btn ghost sm" data-gall>${t("loadAll")}</button><button class="btn ghost sm" data-gcsv>${t("exportCsv")}</button></div>
        <p class="g-note">${t("galNote")}</p></div>
      <div id="gSections">${P.map((p, i) => `<section class="prov" id="prov-${p.s}" data-s="${p.s}">
        <header class="prov-h"><span class="num">${String(i + 1).padStart(2, "0")}</span><div><h3>${esc(p.en)}</h3><div class="kh">${p.km}</div></div><span class="stat" id="stat-${p.s}"></span></header>
        <div class="gal" id="gal-${p.s}"></div></section>`).join("")}</div>
      <p class="empty" id="gNone" hidden>${t("noResults")}</p>`;
    document.querySelectorAll(".gchip").forEach(c => c.classList.toggle("on", c.dataset.g === active));
    P.forEach(paint); progress(); applyFilter();
    obs?.disconnect();
    obs = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { const p = P.find(x => x.s === e.target.dataset.s); if (state[p.s].status === "idle") load(p); } }), { rootMargin: "300px" });
    document.querySelectorAll(".prov").forEach(s => obs.observe(s));
  }

  document.addEventListener("click", e => {
    if (!e.target.closest("#galleryRoot")) return;
    let el;
    if ((el = e.target.closest(".gchip"))) {
      active = el.dataset.g; document.querySelectorAll(".gchip").forEach(c => c.classList.toggle("on", c === el));
      if (active !== "all") load(P.find(p => p.s === active)); applyFilter();
      $("#prov-" + active)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    else if ((el = e.target.closest("[data-retry]"))) { state[el.dataset.retry].status = "idle"; load(P.find(p => p.s === el.dataset.retry)); }
    else if (e.target.closest("[data-gall]")) loadAll();
    else if (e.target.closest("[data-gcsv]")) toCsv();
    else if (!e.target.closest("a") && (el = e.target.closest("figure.ph[data-i]"))) openLb(el.dataset.s, +el.dataset.i);
  });
  let deb; document.addEventListener("input", e => { if (e.target.id === "gSearch") { clearTimeout(deb); deb = setTimeout(() => { term = e.target.value.trim(); applyFilter(); }, 200); } });
  document.addEventListener("cn:refresh", () => { if (built) render(); });

  return { show() { ensureLb(); if (!built) { built = true; render(); } } };
})();
window.Gallery = Gallery;
