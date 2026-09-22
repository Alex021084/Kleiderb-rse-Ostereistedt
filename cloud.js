/* Kleiderbörse Cloud + sicherer Login
   Supabase REST ohne zusätzliche Bibliothek */

const KB_CLOUD = {
  get url(){
    return (window.KB_CONFIG?.supabaseUrl || "").replace(/\/$/,"");
  },
  get key(){
    return window.KB_CONFIG?.supabaseAnonKey || "";
  },
  get register(){
    return localStorage.getItem("kb_register") || "Kasse 1";
  },
  set register(v){
    localStorage.setItem("kb_register",v);
  }
};

const KB_AUTH_KEY = "kb_auth_session";

let kbLoginWaitPromise = null;
let kbLoginWaitResolve = null;

function cloudReady(){
  return !!(KB_CLOUD.url && KB_CLOUD.key);
}

function authNow(){
  return Math.floor(Date.now()/1000);
}

function getAuthSession(){
  try{
    return JSON.parse(localStorage.getItem(KB_AUTH_KEY) || "null");
  }catch(e){
    return null;
  }
}

function saveAuthSession(session){
  localStorage.setItem(KB_AUTH_KEY,JSON.stringify(session));
  window.KB_AUTH_SESSION=session;
}

function clearAuthSession(){
  localStorage.removeItem(KB_AUTH_KEY);
  window.KB_AUTH_SESSION=null;
}

function authSessionValid(){
  const s=getAuthSession();
  return !!(
    s &&
    s.access_token &&
    Number(s.expires_at || 0) > authNow()+60
  );
}

function createLoginBox(){
  if(document.getElementById("kbLoginOverlay")) return;

  const overlay=document.createElement("div");
  overlay.id="kbLoginOverlay";
  overlay.style.cssText=
    "position:fixed;inset:0;z-index:100000;background:#eef3f8;" +
    "display:flex;align-items:center;justify-content:center;padding:20px;";

  overlay.innerHTML=`
    <div style="
      width:min(430px,100%);
      background:white;
      border-radius:24px;
      padding:30px 24px;
      box-shadow:0 10px 40px #0002;
      font-family:system-ui,sans-serif;
    ">
      <div style="
        text-align:center;
        font-size:34px;
        margin-bottom:8px;
      ">🔐</div>

      <h2 style="
        text-align:center;
        margin:0 0 8px;
        color:#172033;
      ">Kleiderbörse Login</h2>

      <p style="
        text-align:center;
        color:#667085;
        margin:0 0 24px;
      ">Bitte anmelden, um die Cloud zu verwenden.</p>

      <input id="kbLoginEmail"
        type="email"
        autocomplete="username"
        placeholder="E-Mail-Adresse"
        style="
          width:100%;
          box-sizing:border-box;
          padding:15px;
          margin-bottom:12px;
          border:1px solid #ccd3dc;
          border-radius:12px;
          font-size:17px;
        ">

      <input id="kbLoginPassword"
        type="password"
        autocomplete="current-password"
        placeholder="Passwort"
        style="
          width:100%;
          box-sizing:border-box;
          padding:15px;
          margin-bottom:14px;
          border:1px solid #ccd3dc;
          border-radius:12px;
          font-size:17px;
        ">

      <button id="kbLoginButton"
        style="
          width:100%;
          border:0;
          border-radius:14px;
          padding:16px;
          background:#168a4a;
          color:white;
          font-size:18px;
          font-weight:700;
        ">
        Anmelden
      </button>

      <div id="kbLoginError" style="
        color:#c62828;
        text-align:center;
        margin-top:14px;
        min-height:22px;
        font-size:14px;
      "></div>
    </div>
  `;

  document.body.appendChild(overlay);

  const login=async()=>{
    const email=document.getElementById("kbLoginEmail").value.trim();
    const password=document.getElementById("kbLoginPassword").value;
    const error=document.getElementById("kbLoginError");
    const button=document.getElementById("kbLoginButton");

    error.textContent="";

    if(!email || !password){
      error.textContent="Bitte E-Mail und Passwort eingeben.";
      return;
    }

    button.disabled=true;
    button.textContent="Anmelden …";

    try{
      await authLogin(email,password);
    }catch(e){
      error.textContent=e?.message || "Anmeldung fehlgeschlagen.";
    }finally{
      button.disabled=false;
      button.textContent="Anmelden";
    }
  };

  document.getElementById("kbLoginButton").onclick=login;

  document.getElementById("kbLoginPassword").onkeydown=e=>{
    if(e.key==="Enter") login();
  };
}

function showLogin(){
  createLoginBox();
  const el=document.getElementById("kbLoginOverlay");
  if(el) el.style.display="flex";
}

function hideLogin(){
  const el=document.getElementById("kbLoginOverlay");
  if(el) el.style.display="none";
}

async function authLogin(email,password){
  if(!cloudReady()){
    throw new Error("Cloud ist noch nicht eingerichtet.");
  }
let r;

try{
  r=await fetch(
  
    `${KB_CLOUD.url}/auth/v1/token?grant_type=password`,
    {
      method:"POST",
      headers:{
        "apikey":KB_CLOUD.key,
        "Content-Type":"application/json"
      },
      body:JSON.stringify({email,password})
    }
  );
}catch(e){
  throw new Error(
    "Netzwerkfehler beim Supabase-Login. " +
    "URL: " + KB_CLOUD.url +
    " | Fehler: " + (e?.name || "unbekannt") +
    " | " + (e?.message || "unbekannt")
  );
}
  if(!r.ok){
    throw new Error(await r.text());
  }

  const data=await r.json();

  const session={
    ...data,
    expires_at:authNow()+Number(data.expires_in || 3600)
  };

  saveAuthSession(session);
  hideLogin();

  if(kbLoginWaitResolve){
    kbLoginWaitResolve(true);
    kbLoginWaitResolve=null;
    kbLoginWaitPromise=null;
  }

  return session;
}

async function authRefresh(){
  const old=getAuthSession();

  if(!old?.refresh_token || !cloudReady()){
    return false;
  }

  try{
    const r=await fetch(
      `${KB_CLOUD.url}/auth/v1/token?grant_type=refresh_token`,
      {
        method:"POST",
        headers:{
          "apikey":KB_CLOUD.key,
          "Content-Type":"application/json"
        },
        body:JSON.stringify({
          refresh_token:old.refresh_token
        })
      }
    );

    if(!r.ok){
      clearAuthSession();
      return false;
    }

    const data=await r.json();

    const session={
      ...data,
      expires_at:authNow()+Number(data.expires_in || 3600)
    };

    saveAuthSession(session);
    hideLogin();

    return true;
  }catch(e){
    clearAuthSession();
    return false;
  }
}

async function waitForLogin(){
  if(authSessionValid()){
    return true;
  }

  showLogin();

  if(!kbLoginWaitPromise){
    kbLoginWaitPromise=new Promise(resolve=>{
      kbLoginWaitResolve=resolve;
    });
  }

  return kbLoginWaitPromise;
}

async function ensureAuth(){
  if(!cloudReady()){
    return false;
  }

  if(authSessionValid()){
    return true;
  }

  if(await authRefresh()){
    return true;
  }

  return await waitForLogin();
}

async function cloudFetch(path,options={},retry=true){
  if(!cloudReady()){
    throw new Error("Cloud ist noch nicht eingerichtet.");
  }

  const authenticated=await ensureAuth();

  if(!authenticated){
    throw new Error("Nicht angemeldet.");
  }

  const session=getAuthSession();

  const headers={
    "apikey":KB_CLOUD.key,
    "Content-Type":"application/json",
    ...(options.headers || {}),
    "Authorization":`Bearer ${session.access_token}`
  };

  const r=await fetch(
    `${KB_CLOUD.url}/rest/v1/${path}`,
    {
      ...options,
      headers
    }
  );

  if(r.status===401 && retry){
    const refreshed=await authRefresh();

    if(refreshed){
      return cloudFetch(path,options,false);
    }

    showLogin();
    throw new Error("Sitzung abgelaufen.");
  }

  if(!r.ok){
    throw new Error(await r.text());
  }

  const t=await r.text();
  return t ? JSON.parse(t) : null;
}

async function cloudGetSellers(){
  return cloudFetch("sellers?select=*&order=name.asc");
}

async function cloudSaveSeller(s){
  const body={
    id:s.id,
    number:s.number,
    name:s.name,
    phone:s.phone||"",
    commission_enabled:s.commissionEnabled===true,
    commission_rate:Number(s.commissionRate??15)
  };

  const data=await cloudFetch(
    "sellers?on_conflict=id",
    {
      method:"POST",
      headers:{
        "Prefer":"resolution=merge-duplicates,return=representation"
      },
      body:JSON.stringify(body)
    }
  );

  return data?.[0]||body;
}

async function cloudDeleteSeller(id){
  await cloudFetch(
    `sellers?id=eq.${encodeURIComponent(id)}`,
    {method:"DELETE"}
  );
}

async function cloudCreateReceipt(items,payment){
  const total=items.reduce(
    (a,x)=>a+(Number(x.price)||0),
    0
  );

  const created=await cloudFetch(
    "receipts",
    {
      method:"POST",
      headers:{
        "Prefer":"return=representation"
      },
      body:JSON.stringify({
        register_id:KB_CLOUD.register,
        payment,
        total
      })
    }
  );

  const receipt=created[0];

  const rows=items.map(x=>({
    receipt_id:receipt.id,
    seller_number:x.sellerNumber
      ? String(x.sellerNumber)
      : null,
    unassigned_note:x.unassignedNote
      ? String(x.unassignedNote)
      : "",
    unassigned_photo:x.unassignedPhoto
      ? String(x.unassignedPhoto)
      : "",
    size:String(x.size),
    price:Number(x.price),
    commission_enabled:x.commissionEnabled===true,
    commission_rate:Number(x.commissionRate||0)
  }));

  await cloudFetch(
    "receipt_items",
    {
      method:"POST",
      headers:{
        "Prefer":"return=minimal"
      },
      body:JSON.stringify(rows)
    }
  );

  return receipt;
}

async function cloudGetReceipts(){
  const receipts=await cloudFetch(
    "receipts?select=*&order=created_at.desc"
  );

  if(!receipts?.length) return [];

  const items=await cloudFetch(
    "receipt_items?select=*&order=id.asc"
  );

  const byReceipt={};

  (items||[]).forEach(x=>{
    (byReceipt[x.receipt_id] ||= []).push(x);
  });

  return receipts.map(r=>({
    ...r,
    receipt_items:byReceipt[r.id]||[]
  }));
}

async function cloudUpdateReceiptItem(id,patch){
  return cloudFetch(
    `receipt_items?id=eq.${encodeURIComponent(id)}`,
    {
      method:"PATCH",
      headers:{
        "Prefer":"return=minimal"
      },
      body:JSON.stringify(patch)
    }
  );
}

async function cloudResetReceipts(){
  await cloudFetch(
    "receipts?id=gt.0",
    {
      method:"DELETE",
      headers:{
        "Prefer":"return=minimal"
      }
    }
  );
}

async function cloudResetReceiptsForRegister(registerId){
  await cloudFetch(
    `receipts?register_id=eq.${encodeURIComponent(registerId)}`,
    {
      method:"DELETE",
      headers:{
        "Prefer":"return=minimal"
      }
    }
  );
}

function cloudBanner(){
  if(document.getElementById("cloudStatus")) return;

  const el=document.createElement("div");
  el.id="cloudStatus";

  const loggedIn=authSessionValid();

  el.textContent=
    !cloudReady()
      ? "☁ Cloud noch nicht eingerichtet – aktuell wird lokal gespeichert"
      : loggedIn
        ? `☁ Cloud verbunden · ${KB_CLOUD.register}`
        : "☁ Bitte anmelden";

  el.style.cssText=
    "position:fixed;bottom:8px;left:50%;" +
    "transform:translateX(-50%);z-index:9999;" +
    "padding:8px 14px;border-radius:999px;" +
    "background:#172033;color:#fff;" +
    "font:600 13px system-ui;" +
    "box-shadow:0 4px 14px #0002";

  document.body.appendChild(el);
}

function setRegister(v){
  KB_CLOUD.register=v;

  const e=document.getElementById("cloudStatus");

  if(e){
    e.textContent=
      cloudReady() && authSessionValid()
        ? `☁ Cloud verbunden · ${v}`
        : `☁ Lokal · ${v}`;
  }
}

function registerPicker(){
  const wrap=document.createElement("div");

  wrap.style.cssText=
    "display:flex;align-items:center;gap:8px";

  const s=document.createElement("select");

  s.id="registerSelect";

  s.style.cssText=
    "font:700 16px system-ui;" +
    "padding:8px 12px;" +
    "border-radius:10px;" +
    "border:1px solid #ffffff55;" +
    "background:#fff;color:#172033";

  for(let i=1;i<=6;i++){
    const o=document.createElement("option");
    o.value=`Kasse ${i}`;
    o.textContent=`Kasse ${i}`;
    s.appendChild(o);
  }

  s.value=KB_CLOUD.register;
  s.onchange=()=>setRegister(s.value);

  wrap.appendChild(s);

  return wrap;
}

window.KBAuth={
  get session(){
    return getAuthSession();
  },
  signIn:authLogin,
  refresh:authRefresh
};

window.KBCloud={
  cloudReady,
  cloudGetSellers,
  cloudSaveSeller,
  cloudDeleteSeller,
  cloudCreateReceipt,
  cloudGetReceipts,
  cloudUpdateReceiptItem,
  cloudResetReceipts,
  cloudResetReceiptsForRegister,
  cloudBanner,
  registerPicker,
  setRegister,
  KB_CLOUD
};

/* Vorhandene Anmeldung prüfen */
(async()=>{
  if(!cloudReady()) return;

  if(authSessionValid()){
    hideLogin();
    return;
  }

  if(await authRefresh()){
    return;
  }

  showLogin();
})();
