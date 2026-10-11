/* Client-side demo auth: accounts live in this browser's localStorage.
   For real users you need a backend (see README note). */
const Auth = (() => {
  const $ = (s, r = document) => r.querySelector(s);
  const K = "cn12kh_users", SK = "cn12kh_session", FK = "cn12kh_fails";
  const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
  const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
  const t = k => CN.t(k);
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const hex = b => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, "0")).join("");
  const rnd = n => hex(crypto.getRandomValues(new Uint8Array(n)));
  const norm = e => e.trim().toLowerCase();

  async function hash(pw, salt) {
    const km = await crypto.subtle.importKey("raw", new TextEncoder().encode(pw), "PBKDF2", false, ["deriveBits"]);
    const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt: new TextEncoder().encode(salt), iterations: 120000, hash: "SHA-256" }, km, 256);
    return hex(bits);
  }

  let users = load(K, []), mode = "login", listeners = [], query = "";
  const current = () => { const id = load(SK, null); const u = users.find(x => x.id === id); return u && u.status === "active" ? u : null; };
  const isAdmin = () => current()?.role === "admin";
  const emit = () => listeners.forEach(f => f());
  const activeAdmins = () => users.filter(u => u.role === "admin" && u.status === "active").length;

  /* login throttle: 5 wrong tries -> 60 s lock */
  const fails = () => load(FK, {});
  const lockLeft = e => { const f = fails()[e]; return f && f.until > Date.now() ? Math.ceil((f.until - Date.now()) / 1000) : 0; };
  const addFail = e => { const a = fails(), f = a[e] || { n: 0 }; f.n++; if (f.n >= 5) { f.until = Date.now() + 60000; f.n = 0; } a[e] = f; save(FK, a); };
  const clearFail = e => { const a = fails(); delete a[e]; save(FK, a); };

  async function signup(name, email, pw) {
    users = load(K, []); name = name.trim(); email = norm(email);
    if (!name) return "errName";
    if (!/^\S+@\S+\.\S+$/.test(email)) return "errEmail";
    if (pw.length < 8) return "errPw";
    if (users.some(u => u.email === email)) return "errExists";
    if (!crypto?.subtle) return "errCrypto";
    const salt = rnd(16);
    const u = { id: rnd(8), name, email, salt, hash: await hash(pw, salt), role: users.length ? "user" : "admin", status: "active", created: Date.now(), last: Date.now() };
    users.push(u); save(K, users); save(SK, u.id); emit(); return null;
  }

  async function login(email, pw) {
    users = load(K, []); email = norm(email);
    if (!crypto?.subtle) return "errCrypto";
    if (lockLeft(email)) return "errLock";
    const u = users.find(x => x.email === email);
    const ok = u && (await hash(pw, u.salt)) === u.hash;
    if (!ok) { addFail(email); return "errCreds"; }
    if (u.status !== "active") return "errSusp";
    clearFail(email); u.last = Date.now(); save(K, users); save(SK, u.id); emit(); return null;
  }

  function logout() { try { localStorage.removeItem(SK); } catch {} CN.toast(t("signedOut")); emit(); }

  /* ----- modal ----- */
  function openModal(m = "login") { mode = m; renderModal(); $("#authOverlay").hidden = false; setTimeout(() => $(mode === "signup" ? "#aName" : "#aEmail")?.focus(), 50); }
  const closeModal = () => { $("#authOverlay").hidden = true; };
  function renderModal(err = "") {
    $("#authBody").innerHTML = `<div class="m-body"><h3>${t(mode)}</h3>
      <form id="authForm" novalidate class="m-body">
        ${mode === "signup" ? `<div class="field"><label>${t("fullName")}</label><input id="aName" autocomplete="name"></div>` : ""}
        <div class="field"><label>${t("email")}</label><input id="aEmail" type="email" autocomplete="email"></div>
        <div class="field"><label>${t("password")}</label><input id="aPw" type="password" autocomplete="${mode === "signup" ? "new-password" : "current-password"}"></div>
        <p class="err" role="alert">${err ? esc(t(err)) : ""}</p>
        <button class="btn" type="submit">${t(mode)}</button>
      </form>
      <p class="switch">${t(mode === "login" ? "noAcc" : "haveAcc")} <button type="button" data-auth-switch>${t(mode === "login" ? "signup" : "login")}</button></p></div>`;
  }

  document.addEventListener("submit", async e => {
    if (e.target.id !== "authForm") return;
    e.preventDefault();
    const btn = e.target.querySelector("button[type=submit]"); btn.disabled = true;
    const email = $("#aEmail").value, pw = $("#aPw").value;
    const err = mode === "signup" ? await signup($("#aName").value, email, pw) : await login(email, pw);
    if (err) { renderModal(err); $("#aEmail").value = email; return; }
    closeModal(); CN.toast("👋 " + t(mode === "signup" ? "created" : "welcome"));
  });
  document.addEventListener("click", e => {
    if (e.target.closest("#closeAuth") || e.target.id === "authOverlay") closeModal();
    else if (e.target.closest("[data-auth-switch]")) { mode = mode === "login" ? "signup" : "login"; renderModal(); }
    const b = e.target.closest("[data-act]"); if (b) act(b.dataset.act, b.dataset.id);
  });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && !$("#authOverlay").hidden) closeModal(); });

  /* ----- admin panel ----- */
  function renderAdmin(full = true) {
    const root = $("#adminRoot"); if (!root) return;
    if (!isAdmin()) { root.innerHTML = ""; return; }
    users = load(K, []);
    if (full || !$("#uQ")) root.innerHTML = `<div class="stats" id="uStats"></div><div class="field"><input id="uQ" placeholder="${esc(t("searchUsers"))}" value="${esc(query)}"></div><div id="uList"></div>`;
    const n = u => load("cn12kh_bookings_" + u.id, []).length;
    $("#uStats").innerHTML = [[t("users"), users.length], [t("admin"), users.filter(u => u.role === "admin").length], [t("suspended"), users.filter(u => u.status !== "active").length]]
      .map(([l, v]) => `<div class="stat-box"><b>${v}</b><small>${esc(l)}</small></div>`).join("");
    const me = current(), q = query.toLowerCase();
    $("#uList").innerHTML = users.filter(u => !q || (u.name + u.email).toLowerCase().includes(q)).map(u => `
      <div class="row"><span class="avatar">${esc(u.name[0]?.toUpperCase() || "?")}</span>
        <div class="grow"><b>${esc(u.name)}</b> <span class="tag">${t(u.role === "admin" ? "admin" : "profile")}</span>
          <span class="tag ${u.status}">${t(u.status === "active" ? "active" : "suspended")}</span><br>
          <small>${esc(u.email)} · ${t("bookings")}: ${n(u)}</small></div>
        <div class="acts">
          <button class="btn ghost sm" data-act="role" data-id="${u.id}">${t(u.role === "admin" ? "makeUser" : "makeAdmin")}</button>
          ${u.id === me.id ? "" : `<button class="btn ghost sm" data-act="status" data-id="${u.id}">${t(u.status === "active" ? "suspend" : "activate")}</button>
          <button class="btn ghost sm danger" data-act="del" data-id="${u.id}">${t("del")}</button>`}
        </div></div>`).join("");
  }
  document.addEventListener("input", e => { if (e.target.id === "uQ") { query = e.target.value.trim(); renderAdmin(false); } });

  function act(a, id) {
    if (!isAdmin()) return;
    users = load(K, []); const u = users.find(x => x.id === id), me = current(); if (!u) return;
    const lastAdm = u.role === "admin" && u.status === "active" && activeAdmins() <= 1;
    if (a === "role") { if (lastAdm) return CN.toast(t("lastAdmin")); u.role = u.role === "admin" ? "user" : "admin"; }
    else if (a === "status") { if (u.id === me.id) return; if (lastAdm) return CN.toast(t("lastAdmin")); u.status = u.status === "active" ? "suspended" : "active"; }
    else if (a === "del") {
      if (u.id === me.id) return; if (lastAdm) return CN.toast(t("lastAdmin")); if (!confirm(t("confirmDel"))) return;
      users = users.filter(x => x.id !== u.id); try { localStorage.removeItem("cn12kh_bookings_" + u.id); } catch {}
    } else return;
    save(K, users); emit(); renderAdmin(false);
  }

  window.addEventListener("storage", () => { users = load(K, []); emit(); });
  return { current, isAdmin, openModal, logout, renderAdmin, onChange: f => listeners.push(f) };
})();
window.Auth = Auth;
