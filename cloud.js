/* Kleiderbörse – Cloud / Supabase
   Direkte REST-Verbindung – keine externe Supabase-Bibliothek.
*/

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

function cloudReady(){
  return !!(KB_CLOUD.url && KB_CLOUD.key);
}

function authNow(){
  return Math.floor(Date.now()/1000);
}

function getAuthSession(){
  try{
    return JSON.parse(
      localStorage.getItem(KB_AUTH_KEY) || "null"
    );
  }catch(e){
    return null;
  }
}

function saveAuthSession(s){
  if(!s){
    clearAuthSession();
    return;
  }

  s.expires_at =
    Number(s.expires_at) ||
    authNow() + Number(s.expires_in || 3600);

  localStorage.setItem(
    KB_AUTH_KEY,
    JSON.stringify(s)
  );

  window.KB_AUTH_SESSION = s;
}

function clearAuthSession(){
  localStorage.removeItem(KB_AUTH_KEY);
  window.KB_AUTH_SESSION = null;
}

function authSessionValid(){
  const s = getAuthSession();

  return !!(
    s &&
    s.access_token &&
    Number(s.expires_at || 0) > authNow() + 60
  );
}

async function authRequest(path,body){

  const response = await fetch(
    KB_CLOUD.url + "/auth/v1/" + path,
    {
      method:"POST",
      headers:{
        "apikey":KB_CLOUD.key,
        "Content-Type":"application/json"
      },
      body:JSON.stringify(body)
    }
  );

  let data = null;

  try{
    data = await response.json();
  }catch(e){}

  if(!response.ok){
    throw new Error(
      data?.msg ||
      data?.message ||
      data?.error_description ||
      data?.error ||
      ("HTTP " + response.status)
    );
  }

  return data;
}

async function authLogin(email,password){

  if(!cloudReady()){
    throw new Error(
      "Cloud ist noch nicht eingerichtet."
    );
  }

  const data = await authRequest(
    "token?grant_type=password",
    {
      email:email,
      password:password
    }
  );

  if(!data?.access_token){
    throw new Error(
      "Supabase hat keine Sitzung zurückgegeben."
    );
  }

  saveAuthSession(data);
  hideLogin();
  updateCloudBanner();

  if(window.KB_LOGIN_WAIT_RESOLVE){
    window.KB_LOGIN_WAIT_RESOLVE(true);
    window.KB_LOGIN_WAIT_RESOLVE = null;
    window.KB_LOGIN_WAIT_PROMISE = null;
  }

  return data;
}

async function authRefresh(){

  const s = getAuthSession();

  if(!s?.refresh_token)
    return false;

  try{

    const data = await authRequest(
      "token?grant_type=refresh_token",
      {
        refresh_token:s.refresh_token
      }
    );

    if(!data?.access_token){
      clearAuthSession();
      return false;
    }

    saveAuthSession(data);
    hideLogin();
    updateCloudBanner();

    return true;

  }catch(e){

    clearAuthSession();
    return false;
  }
}

function apiHeaders(extra={}){

  const s = getAuthSession();

  return Object.assign(
    {
      "apikey":KB_CLOUD.key,
      "Authorization":
        "Bearer " + (s?.access_token || ""),
      "Content-Type":"application/json"
    },
    extra
  );
}

async function apiRequest(path,options={}){

  if(!cloudReady()){
    throw new Error(
      "Cloud ist noch nicht eingerichtet."
    );
  }

  const response = await fetch(
    KB_CLOUD.url + "/rest/v1/" + path,
    Object.assign(
      {},
      options,
      {
        headers:apiHeaders(
          options.headers || {}
        )
      }
    )
  );

  if(response.status === 401){
    throw new Error(
      "Sitzung abgelaufen. Bitte erneut anmelden."
    );
  }

  let data = null;
  const text = await response.text();

  if(text){
    try{
      data = JSON.parse(text);
    }catch(e){
      data = text;
    }
  }

  if(!response.ok){
    throw new Error(
      data?.message ||
      data?.details ||
      data?.hint ||
      data?.code ||
      (typeof data === "string" ? data : "") ||
      ("HTTP " + response.status)
    );
  }

  return data;
}
/* LOGIN */

function createLoginBox(){

  if(document.getElementById("kbLoginOverlay"))
    return;

  const overlay=document.createElement("div");

  overlay.id="kbLoginOverlay";

  overlay.style.cssText=
    "position:fixed;inset:0;z-index:100000;" +
    "background:#eef3f8;" +
    "display:flex;align-items:center;" +
    "justify-content:center;padding:20px;";

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
      ">
        Bitte anmelden, um die Cloud zu verwenden.
      </p>

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

      <div id="kbLoginError"
        style="
          color:#c62828;
          text-align:center;
          margin-top:14px;
          min-height:22px;
          font-size:14px;
        ">
      </div>

    </div>
  `;

  document.body.appendChild(overlay);

  const login=async()=>{

    const email=
      document.getElementById(
        "kbLoginEmail"
      ).value.trim();

    const password=
      document.getElementById(
        "kbLoginPassword"
      ).value;

    const error=
      document.getElementById(
        "kbLoginError"
      );

    const button=
      document.getElementById(
        "kbLoginButton"
      );

    error.textContent="";

    if(!email || !password){
      error.textContent=
        "Bitte E-Mail und Passwort eingeben.";
      return;
    }

    button.disabled=true;
    button.textContent="Anmelden …";

    try{

      await authLogin(
        email,
        password
      );

    }catch(e){

      error.textContent=
        "Supabase-Login: " +
        (e?.message ||
        "Anmeldung fehlgeschlagen.");

    }finally{

      button.disabled=false;
      button.textContent="Anmelden";
    }
  };

  document.getElementById(
    "kbLoginButton"
  ).onclick=login;

  document.getElementById(
    "kbLoginPassword"
  ).onkeydown=e=>{
    if(e.key==="Enter")
      login();
  };
}

function showLogin(){

  createLoginBox();

  const e=
    document.getElementById(
      "kbLoginOverlay"
    );

  if(e)
    e.style.display="flex";
}

function hideLogin(){

  const e=
    document.getElementById(
      "kbLoginOverlay"
    );

  if(e)
    e.style.display="none";
}


/* VERKÄUFER */

async function cloudClient(){

  if(!cloudReady()){
    throw new Error("Cloud ist noch nicht eingerichtet.");
  }

  if(authSessionValid()){
    return true;
  }

  if(await authRefresh()){
    return true;
  }

  showLogin();
  throw new Error("Bitte anmelden.");
}
async function cloudGetSellers(){

  await cloudClient();

  const data=
    await apiRequest(
      "sellers?select=*&order=name.asc"
    );

  return data || [];
}

async function cloudSaveSeller(s){

  await cloudClient();

  const body={

    id:s.id,

    number:s.number,

    name:s.name,

    phone:s.phone || "",

    commission_enabled:
      s.commissionEnabled === true,

    commission_rate:
      Number(s.commissionRate ?? 15)
  };

  const data=
    await apiRequest(
      "sellers?on_conflict=id",
      {
        method:"POST",

        headers:{
          "Prefer":
            "resolution=merge-duplicates,return=representation"
        },

        body:JSON.stringify(body)
      }
    );

  return Array.isArray(data)
    ? data[0]
    : data;
}

async function cloudDeleteSeller(id){

  await cloudClient();

  await apiRequest(
    "sellers?id=eq." +
    encodeURIComponent(id),
    {
      method:"DELETE",
      headers:{
        "Prefer":"return=minimal"
      }
    }
  );

  return true;
}


/* KASSENBON */

async function cloudCreateReceipt(
  items,
  payment
){

  await cloudClient();

  const total=
    items.reduce(
      (sum,item)=>
        sum + (Number(item.price) || 0),
      0
    );

  const receiptData=
    await apiRequest(
      "receipts",
      {
        method:"POST",

        headers:{
          "Prefer":"return=representation"
        },

        body:JSON.stringify({
          register_id:
            KB_CLOUD.register,

          payment:payment,

          total:total
        })
      }
    );

  const receipt=
    Array.isArray(receiptData)
      ? receiptData[0]
      : receiptData;

  if(!receipt?.id){

    throw new Error(
      "Kassenbon konnte nicht angelegt werden."
    );
  }

  const rows=
    items.map(item=>({

      receipt_id:
        receipt.id,

      seller_number:
        item.sellerNumber
          ? String(item.sellerNumber)
          : null,

      unassigned_note:
        item.unassignedNote
          ? String(item.unassignedNote)
          : "",

      unassigned_photo:
        item.unassignedPhoto
          ? String(item.unassignedPhoto)
          : "",

      size:
        String(item.size),

      price:
        Number(item.price),

      commission_enabled:
        item.commissionEnabled === true,

      commission_rate:
        Number(item.commissionRate || 0)
    }));

  try{

    await apiRequest(
      "receipt_items",
      {
        method:"POST",

        headers:{
          "Prefer":"return=minimal"
        },

        body:JSON.stringify(rows)
      }
    );

  }catch(e){

    try{

      await apiRequest(
        "receipts?id=eq." +
        encodeURIComponent(receipt.id),
        {
          method:"DELETE",
          headers:{
            "Prefer":"return=minimal"
          }
        }
      );

    }catch(ignore){}

    throw new Error(
      "Artikel: " + e.message
    );
  }

  return receipt;
}


/* VERKÄUFE LADEN */

async function cloudGetReceipts(){

  await cloudClient();

  const receipts=
    await apiRequest(
      "receipts?select=*&order=created_at.desc"
    );

  if(!receipts?.length)
    return [];

  const items=
    await apiRequest(
      "receipt_items?select=*&order=id.asc"
    );

  const byReceipt={};

  (items || []).forEach(item=>{

    if(!byReceipt[item.receipt_id])
      byReceipt[item.receipt_id]=[];

    byReceipt[item.receipt_id].push(item);
  });

  return receipts.map(receipt=>({

    ...receipt,

    receipt_items:
      byReceipt[receipt.id] || []
  }));
}


/* ARTIKEL ÄNDERN */

async function cloudUpdateReceiptItem(
  id,
  patch
){

  await cloudClient();

  const data=
    await apiRequest(
      "receipt_items?id=eq." +
      encodeURIComponent(id),
      {
        method:"PATCH",

        headers:{
          "Prefer":"return=representation"
        },

        body:JSON.stringify(patch)
      }
    );

  return Array.isArray(data)
    ? data[0]
    : data;
}


/* ABSCHLUSS */

async function cloudResetReceipts(){

  await cloudClient();

  await apiRequest(
    "receipts?id=gt.0",
    {
      method:"DELETE",
      headers:{
        "Prefer":"return=minimal"
      }
    }
  );

  return true;
}

async function cloudResetReceiptsForRegister(
  registerId
){

  await cloudClient();

  await apiRequest(
    "receipts?register_id=eq." +
    encodeURIComponent(registerId),
    {
      method:"DELETE",
      headers:{
        "Prefer":"return=minimal"
      }
    }
  );

  return true;
}
/* CLOUD-STATUS */

function cloudBanner(){

  if(!document.getElementById("cloudStatus")){

    const e=document.createElement("div");

    e.id="cloudStatus";

    e.style.cssText=
      "position:fixed;bottom:8px;left:50%;"+
      "transform:translateX(-50%);z-index:9999;"+
      "padding:8px 14px;border-radius:999px;"+
      "background:#172033;color:#fff;"+
      "font:600 13px system-ui;"+
      "box-shadow:0 4px 14px #0002;";

    document.body.appendChild(e);
  }

  updateCloudBanner();
}


function updateCloudBanner(){

  const e=
    document.getElementById(
      "cloudStatus"
    );

  if(!e)
    return;

  if(!cloudReady()){

    e.textContent=
      "☁ Cloud noch nicht eingerichtet";

  }else if(authSessionValid()){

    e.textContent=
      "☁ Cloud verbunden · " +
      KB_CLOUD.register;

  }else{

    e.textContent=
      "☁ Bitte anmelden";
  }
}


/* KASSEN */

function setRegister(v){

  KB_CLOUD.register=v;

  updateCloudBanner();
}


function registerPicker(){

  const wrap=
    document.createElement("div");

  const select=
    document.createElement("select");

  select.id="registerSelect";

  select.style.cssText=
    "font:700 16px system-ui;"+
    "padding:8px 12px;"+
    "border-radius:10px;"+
    "border:1px solid #ffffff55;"+
    "background:#fff;color:#172033;";

  for(let i=1;i<=6;i++){

    const option=
      document.createElement("option");

    option.value=
      "Kasse " + i;

    option.textContent=
      "Kasse " + i;

    select.appendChild(option);
  }

  select.value=
    KB_CLOUD.register;

  select.onchange=()=>{
    setRegister(select.value);
  };

  wrap.appendChild(select);

  return wrap;
}


/* ÖFFENTLICH */

window.KBAuth={

  get session(){
    return getAuthSession();
  },

  signIn:
    authLogin,

  refresh:
    authRefresh
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


/* START */

(async()=>{

  if(!cloudReady())
    return;

  try{

    if(authSessionValid()){

      hideLogin();

    }else if(
      await authRefresh()
    ){

      // Sitzung erfolgreich erneuert.

    }else{

      clearAuthSession();

      showLogin();
    }

  }catch(e){

    console.error(
      "Cloud-Start:",
      e
    );

    showLogin();
  }

  updateCloudBanner();

})();
