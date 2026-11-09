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
  return Object.assign(
    {
      "apikey": KB_CLOUD.key,
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
    salutation:s.salutation || "Frau",
    address:s.address || "",
    street:s.street || "",
    house_number:s.houseNumber || "",
    zip:s.zip || "",
    city:s.city || "",
    email:s.email || "",
    payout_method:s.payoutMethod || "Bar",

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
  payment,
  paymentMeta={}
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

          total:total,
          payment_note:String(paymentMeta.note||""),
          cash_received:paymentMeta.cashReceived==null?null:Number(paymentMeta.cashReceived),
          change_given:paymentMeta.changeGiven==null?null:Number(paymentMeta.changeGiven)
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


/* KASSENBON-KORREKTUR MIT ÄNDERUNGSHISTORIE */
async function cloudEditReceipt(receiptId, payment, items, reason){
  await cloudClient();
  const all=await cloudGetReceipts();
  const current=all.find(r=>String(r.id)===String(receiptId));
  if(!current) throw new Error("Kassenbon wurde nicht gefunden. Bitte neu laden.");

  const oldSnapshot={
    id:current.id, receipt_no:current.receipt_no, register_id:current.register_id,
    payment:current.payment, total:Number(current.total||0), created_at:current.created_at,
    receipt_items:(current.receipt_items||[]).map(x=>({...x}))
  };
  const normalized=items.map(x=>({
    id:x.id||null, seller_number:x.seller_number?String(x.seller_number):null,
    unassigned_note:String(x.unassigned_note||""), size:String(x.size||""),
    price:Number(x.price||0), commission_enabled:x.commission_enabled!==false,
    commission_rate:Number(x.commission_rate??0.15)
  }));
  if(!normalized.length) throw new Error("Ein Kassenbon muss mindestens einen Artikel enthalten.");
  if(normalized.some(x=>!x.size.trim()||!Number.isFinite(x.price)||x.price<0)) throw new Error("Bitte Artikel und gültige Preise prüfen.");
  const total=normalized.reduce((sum,x)=>sum+x.price,0);
  const history=await apiRequest("receipt_edit_history",{
    method:"POST",headers:{"Prefer":"return=minimal"},
    body:JSON.stringify({
      receipt_id:current.id, reason:String(reason||"Nachträgliche Korrektur"),
      old_snapshot:oldSnapshot,
      new_snapshot:{payment,total,receipt_items:normalized.map(x=>({...x}))}
    })
  });

  await apiRequest("receipts?id=eq."+encodeURIComponent(receiptId),{
    method:"PATCH",headers:{"Prefer":"return=minimal"},
    body:JSON.stringify({payment,total})
  });

  const oldItems=current.receipt_items||[];
  const keepIds=normalized.filter(x=>x.id).map(x=>String(x.id));
  const removeIds=oldItems.filter(x=>!keepIds.includes(String(x.id))).map(x=>String(x.id));
  if(removeIds.length){
    await apiRequest("receipt_items?id=in.("+removeIds.map(encodeURIComponent).join(",")+")",{
      method:"DELETE",headers:{"Prefer":"return=minimal"}
    });
  }
  for(const item of normalized){
    const row={receipt_id:current.id,seller_number:item.seller_number,
      unassigned_note:item.unassigned_note,size:item.size,price:item.price,
      commission_enabled:item.commission_enabled,commission_rate:item.commission_rate};
    if(item.id){
      await apiRequest("receipt_items?id=eq."+encodeURIComponent(item.id),{
        method:"PATCH",headers:{"Prefer":"return=minimal"},body:JSON.stringify(row)
      });
    }else{
      await apiRequest("receipt_items",{
        method:"POST",headers:{"Prefer":"return=minimal"},body:JSON.stringify(row)
      });
    }
  }
  return {id:current.id,total};
}

async function cloudGetReceiptHistory(receiptId){
  await cloudClient();
  return await apiRequest("receipt_edit_history?select=*&receipt_id=eq."+
    encodeURIComponent(receiptId)+"&order=edited_at.desc") || [];
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

/* ARCHIV – KOMPLETTE BÖRSE WIEDERHERSTELLEN */
async function cloudRestoreSnapshot(snapshot){

  await cloudClient();

  const sellers=Array.isArray(snapshot?.sellers) ? snapshot.sellers : [];
  const receipts=Array.isArray(snapshot?.receipts) ? snapshot.receipts : [];

  // Aktuelle Verkäufe vollständig entfernen. receipt_items werden per
  // ON DELETE CASCADE zusammen mit den Kassenbons gelöscht.
  await apiRequest(
    "receipts?id=gt.0",
    {method:"DELETE",headers:{"Prefer":"return=minimal"}}
  );

  // Aktuelle Verkäufer entfernen. Einzelne Löschungen vermeiden Probleme
  // mit UUID-Filtern bei unterschiedlichen Supabase-Konfigurationen.
  const currentSellers=await apiRequest("sellers?select=id");
  for(const seller of (currentSellers||[])){
    if(seller?.id){
      await apiRequest(
        "sellers?id=eq."+encodeURIComponent(seller.id),
        {method:"DELETE",headers:{"Prefer":"return=minimal"}}
      );
    }
  }

  // Verkäufer aus dem Archiv wieder anlegen.
  if(sellers.length){
    const rows=sellers.map(s=>({
      id:s.id,
      number:String(s.number ?? ""),
      name:String(s.name ?? ""),
      phone:String(s.phone ?? ""),
      salutation:String(s.salutation ?? "Frau"),
      address:String(s.address ?? ""),
      street:String(s.street ?? ""),
      house_number:String(s.house_number ?? s.houseNumber ?? ""),
      zip:String(s.zip ?? ""),
      city:String(s.city ?? ""),
      email:String(s.email ?? ""),
      payout_method:String(s.payout_method ?? s.payoutMethod ?? "Bar"),
      commission_enabled:s.commission_enabled===true || s.commissionEnabled===true,
      commission_rate:Number(s.commission_rate ?? s.commissionRate ?? 15)
    }));

    await apiRequest(
      "sellers",
      {method:"POST",headers:{"Prefer":"return=minimal"},body:JSON.stringify(rows)}
    );
  }

  // Kassenbons und die dazugehörigen Artikel wiederherstellen.
  // Die neuen Bon-IDs werden automatisch erzeugt und für die Artikel verwendet.
  for(const oldReceipt of receipts){
    const items=Array.isArray(oldReceipt.receipt_items) ? oldReceipt.receipt_items : [];
    const calculatedTotal=items.reduce((sum,item)=>sum+Number(item.price||0),0);

    const created=await apiRequest(
      "receipts",
      {
        method:"POST",
        headers:{"Prefer":"return=representation"},
        body:JSON.stringify({
          register_id:String(oldReceipt.register_id || "Kasse 1"),
          payment:String(oldReceipt.payment || "Bar"),
          total:oldReceipt.total!=null ? Number(oldReceipt.total) : calculatedTotal,
          created_at:oldReceipt.created_at || new Date().toISOString()
        })
      }
    );

    const receipt=Array.isArray(created) ? created[0] : created;
    if(!receipt?.id){
      throw new Error("Ein archivierter Kassenbon konnte nicht wiederhergestellt werden.");
    }

    if(items.length){
      const itemRows=items.map(item=>({
        receipt_id:receipt.id,
        seller_number:item.seller_number ? String(item.seller_number) : null,
        unassigned_note:String(item.unassigned_note || ""),
        unassigned_photo:String(item.unassigned_photo || ""),
        size:String(item.size ?? ""),
        price:Number(item.price || 0),
        commission_enabled:item.commission_enabled===true,
        commission_rate:Number(item.commission_rate || 0)
      }));

      await apiRequest(
        "receipt_items",
        {method:"POST",headers:{"Prefer":"return=minimal"},body:JSON.stringify(itemRows)}
      );
    }
  }

  return true;
}

/* ARCHIV – CLOUD SPEICHERN / LADEN */
async function cloudListArchives(){
  await cloudClient();
  const data=await apiRequest('archives?select=*&order=saved_at.desc');
  return data||[];
}

async function cloudSaveArchive(snapshot){
  await cloudClient();
  const body={
    id:String(snapshot.id),
    name:String(snapshot.name||'Börse'),
    saved_at:snapshot.savedAt || new Date().toISOString(),
    snapshot:snapshot
  };
  const data=await apiRequest('archives?on_conflict=id',{
    method:'POST',
    headers:{'Prefer':'resolution=merge-duplicates,return=representation'},
    body:JSON.stringify(body)
  });
  return Array.isArray(data)?data[0]:data;
}

async function cloudDeleteArchive(id){
  await cloudClient();
  const data=await apiRequest('archives?id=eq.'+encodeURIComponent(id),{
    method:'DELETE',
    headers:{'Prefer':'return=representation'}
  });
  if(Array.isArray(data) && data.length===0){
    throw new Error('Das Archiv wurde in der Cloud nicht gefunden oder konnte nicht gelöscht werden.');
  }
  return true;
}

async function cloudGetArchive(id){
  await cloudClient();
  const data=await apiRequest('archives?id=eq.'+encodeURIComponent(id)+'&select=*');
  const row=Array.isArray(data)?data[0]:data;
  return row?.snapshot || null;
}

/* WECHSELGELD-STARTBESTAND – dauerhaft je Kasse gespeichert */
async function cloudGetRegisterFloat(registerId){
  await cloudClient();
  const rows=await apiRequest(
    "register_float_balances?register_id=eq."+encodeURIComponent(String(registerId))+"&select=register_id,amount,updated_at"
  );
  return Array.isArray(rows)&&rows.length?rows[0]:null;
}

async function cloudSaveRegisterFloat(registerId,amount){
  await cloudClient();
  const rows=await apiRequest("register_float_balances?on_conflict=register_id",{
    method:"POST",
    headers:{"Prefer":"resolution=merge-duplicates,return=representation"},
    body:JSON.stringify({
      register_id:String(registerId),
      amount:Number(amount),
      updated_at:new Date().toISOString()
    })
  });
  return Array.isArray(rows)?rows[0]:rows;
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

/* Cloud-Funktionen ergänzen die Rollen-Funktionen aus auth.js,
   statt window.KBAuth zu überschreiben. */
const _KBRoleAuth = window.KBAuth || {};
window.KBAuth = Object.assign(_KBRoleAuth, {

  get session(){
    return getAuthSession();
  },

  signIn:
    authLogin,

  refresh:
    authRefresh
});


window.KBCloud={

  cloudReady,

  cloudGetSellers,

  cloudSaveSeller,

  cloudDeleteSeller,

  cloudCreateReceipt,

  cloudGetReceipts,

  cloudUpdateReceiptItem,
  cloudEditReceipt,
  cloudGetReceiptHistory,

  cloudResetReceipts,

  cloudResetReceiptsForRegister,

  cloudRestoreSnapshot,

  cloudListArchives,
  cloudSaveArchive,
  cloudDeleteArchive,
  cloudGetArchive,
  cloudGetRegisterFloat,
  cloudSaveRegisterFloat,

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
