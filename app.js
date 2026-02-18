
/** ====== CONFIG ====== */
const CONFIG = {
  serverAddress: "sd-br7.blazebr.com:25575", // troque se quiser
  // API de status (mcsrvstat.us) - NÃO mostra versão base, só players online.
  statusApi: (addr) => `https://api.mcsrvstat.us/2/${encodeURIComponent(addr)}`,
  // WhatsApp
  whatsappPhone: "14998199235",
  discord: "https://discord.gg/rGhKcPuD8Y",
  // link comunidade (VOCÊ PRECISA COLOCAR)
  whatsappCommunity: "https://chat.whatsapp.com/GUggniyiQjSHgqJDEtUZyd"
};

/** ====== HELPERS ====== */
const brl = (n) => n.toLocaleString("pt-BR", { style:"currency", currency:"BRL" });
const escapeText = (s) => String(s).replace(/[&<>"']/g, (c)=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
const qs = (sel, el=document) => el.querySelector(sel);
const qsa = (sel, el=document) => [...el.querySelectorAll(sel)];

/** ====== STATUS ====== */
async function loadOnlineCount(){
  const el = qs("#onlineCount");
  if(!el) return;
  el.textContent = "…";
  try{
    const r = await fetch(CONFIG.statusApi(CONFIG.serverAddress), { cache:"no-store" });
    const data = await r.json();
    // mcsrvstat: players.online
    const online = data?.players?.online;
    if(typeof online === "number"){
      el.textContent = `${online}`;
    }else{
      el.textContent = "—";
    }
  }catch(e){
    el.textContent = "—";
  }
}

/** ====== CART (localStorage) ====== */
const CART_KEY = "rrpg_cart_v1";
function getCart(){
  try{ return JSON.parse(localStorage.getItem(CART_KEY) || "[]"); }catch{ return []; }
}
function setCart(items){
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  updateCartBadge();
}
function addToCart(product){
  const cart = getCart();
  const idx = cart.findIndex(i => i.id === product.id);
  if(idx >= 0) cart[idx].qty += 1;
  else cart.push({ ...product, qty: 1 });
  setCart(cart);
  openCart();
  renderCart();
}
function changeQty(id, delta){
  let cart = getCart();
  cart = cart.map(i => i.id === id ? ({...i, qty: Math.max(0, i.qty + delta)}) : i).filter(i => i.qty > 0);
  setCart(cart);
  renderCart();
}
function clearCart(){
  setCart([]);
  renderCart();
}
function cartTotal(cart){
  return cart.reduce((sum, i)=> sum + (i.price * i.qty), 0);
}
function updateCartBadge(){
  const el = qs("#cartCount");
  if(!el) return;
  const cart = getCart();
  const count = cart.reduce((s,i)=> s+i.qty, 0);
  el.textContent = count;
}

/** ====== DRAWER / MODAL ====== */
function openCart(){
  qs("#cartOverlay")?.classList.add("open");
  qs("#cartDrawer")?.classList.add("open");
}
function closeCart(){
  qs("#cartOverlay")?.classList.remove("open");
  qs("#cartDrawer")?.classList.remove("open");
}
function openTerms(){
  qs("#termsModal")?.classList.add("open");
}
function closeTerms(){
  qs("#termsModal")?.classList.remove("open");
  const cb = qs("#acceptTerms");
  if(cb) cb.checked = false;
  const btn = qs("#confirmWhats");
  if(btn) btn.disabled = true;
}
function renderCart(){
  const body = qs("#cartBody");
  const totalEl = qs("#cartTotal");
  const cart = getCart();
  if(!body || !totalEl) return;

  if(cart.length === 0){
    body.innerHTML = `<div class="cartEmpty">🛒<br><br>O seu baú está vazio...</div>`;
    totalEl.textContent = brl(0);
    return;
  }

  body.innerHTML = cart.map(i => `
    <div class="cartItem">
      <div class="top">
        <div class="n">${escapeText(i.name)}</div>
        <div class="price">${brl(i.price)}</div>
      </div>
      <div style="display:flex; justify-content:space-between; align-items:center; gap:10px;">
        <div class="muted" style="font-size:12px;">${escapeText(i.short || "")}</div>
        <div class="qty">
          <button onclick="window.__rrpg.changeQty('${i.id}', -1)">-</button>
          <div class="q">${i.qty}</div>
          <button onclick="window.__rrpg.changeQty('${i.id}', 1)">+</button>
        </div>
      </div>
    </div>
  `).join("");

  totalEl.textContent = brl(cartTotal(cart));
}
function buildWhatsUrl(){
  const cart = getCart();
  const total = cartTotal(cart);
  const lines = cart.map(i => `- ${i.name} (${i.qty}x) - ${brl(i.price)}`).join("\n");
  const msg = `Olá ReinadoRPG! Gostaria de finalizar minha compra:\n\n${lines}\n\n*Total: ${brl(total)}*`;
  const url = `https://api.whatsapp.com/send/?phone=${encodeURIComponent(CONFIG.whatsappPhone)}&text=${encodeURIComponent(msg)}&type=phone_number&app_absent=0`;
  return url;
}

/** ====== INIT ====== */
function initNavActive(){
  const path = location.pathname.replace(/\/+$/, "");
  qsa(".pill").forEach(a=>{
    const href = a.getAttribute("href")?.replace(/\/+$/, "");
    if(href && (href === path || (href !== "/" && path.startsWith(href)))) a.classList.add("active");
  });
}

function initFooter(){
  const y = qs("#year");
  if(y) y.textContent = new Date().getFullYear();
}

function initSocial(){
  const d = qs("#btnDiscord"); if(d) d.href = CONFIG.discord;
  const w = qs("#btnZap"); if(w) w.href = CONFIG.whatsappCommunity;
}

function initCartUi(){
  updateCartBadge();
  renderCart();

  qs("#openCart")?.addEventListener("click", ()=>{ openCart(); renderCart(); });
  qs("#cartOverlay")?.addEventListener("click", closeCart);
  qs("#closeCart")?.addEventListener("click", closeCart);

  qs("#checkout")?.addEventListener("click", ()=>{
    const cart = getCart();
    if(cart.length === 0) return;
    openTerms();
  });

  qs("#closeTerms")?.addEventListener("click", closeTerms);
  qs("#termsBackdrop")?.addEventListener("click", (e)=>{
    if(e.target?.id === "termsBackdrop") closeTerms();
  });

  qs("#acceptTerms")?.addEventListener("change", (e)=>{
    const btn = qs("#confirmWhats");
    if(btn) btn.disabled = !e.target.checked;
  });

  qs("#confirmWhats")?.addEventListener("click", ()=>{
    const url = buildWhatsUrl();
    window.location.href = url;
  });

  qs("#clearCart")?.addEventListener("click", clearCart);
}

/** Expose small API for inline buttons */
window.__rrpg = { addToCart, changeQty };


/** ====== "FONTE" SMALLCAPS (unicode) ====== */
const __SC_MAP = {
  "a":"ᴀ","b":"ʙ","c":"ᴄ","d":"ᴅ","e":"ᴇ","f":"ғ","g":"ɢ","h":"ʜ","i":"ɪ","j":"ᴊ","k":"ᴋ","l":"ʟ","m":"ᴍ","n":"ɴ","o":"ᴏ","p":"ᴘ","q":"ǫ","r":"ʀ","s":"s","t":"ᴛ","u":"ᴜ","v":"ᴠ","w":"ᴡ","x":"x","y":"ʏ","z":"ᴢ",
  "A":"ᴀ","B":"ʙ","C":"ᴄ","D":"ᴅ","E":"ᴇ","F":"ғ","G":"ɢ","H":"ʜ","I":"ɪ","J":"ᴊ","K":"ᴋ","L":"ʟ","M":"ᴍ","N":"ɴ","O":"ᴏ","P":"ᴘ","Q":"ǫ","R":"ʀ","S":"s","T":"ᴛ","U":"ᴜ","V":"ᴠ","W":"ᴡ","X":"x","Y":"ʏ","Z":"ᴢ"
};
function toSmallcaps(str){
  return String(str).split("").map(ch => __SC_MAP[ch] ?? ch).join("");
}
function applySmallcaps(){
  // aplica em títulos, navegação e botões (pra não destruir textos longos)
  const selectors = ["h1","h2","h3",".pill",".btn",".sectionTitle",".drawerHeader h3",".modalHead h3",".brand .title"];
  selectors.forEach(sel=>{
    document.querySelectorAll(sel).forEach(el=>{
      if(el.dataset.scDone === "1") return;
      const t = el.textContent;
      el.textContent = toSmallcaps(t);
      el.dataset.scDone = "1";
    });
  });
}

window.addEventListener("DOMContentLoaded", ()=>{
  initNavActive();
  applySmallcaps();
  initFooter();
  initSocial();
  initCartUi();
  loadOnlineCount();
});
