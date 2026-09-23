/* Kleiderbörse – Cloud / Supabase */

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

const KB_AUTH_KEY="kb_auth_session";
let kbSupabase=null;
let kbSupabasePromise=null;
let kbLoginWaitPromise=null;
let kbLoginWaitResolve=null;

function cloudReady(){
  return !!(KB_CLOUD.url && KB_CLOUD.key);
}

function authNow(){
  return Math.floor(Date.now()/1000);
}

function getAuthSession(){
  try{
    return JSON.parse(
      localStorage.getItem(KB_AUTH_KEY)||"null"
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
    authNow()+Number(s.expires_in||3600);

  localStorage.setItem(
    KB_AUTH_KEY,
    JSON.stringify(s)
  );

  window.KB_AUTH_SESSION=s;
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
    Number(s.expires_at||0)>authNow()+60
  );
}

async function getSupabaseClient(){

  if(kbSupabase) return kbSupabase;

  if(!cloudReady()){
    throw new Error(
      "Cloud ist noch nicht eingerichtet."
    );
  }

  if(!window.supabase?.createClient){

    if(!kbSupabasePromise){

      kbSupabasePromise=new Promise(
        (resolve,reject)=>{

          const script=
            document.createElement("script");

          script.src=
            "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";

          script.onload=()=>{
            if(window.supabase?.createClient){
              resolve();
            }else{
              reject(
                new Error(
                  "Supabase-Bibliothek konnte nicht geladen werden."
                )
              );
            }
          };

          script.onerror=()=>{
            reject(
              new Error(
                "Supabase-Bibliothek konnte nicht geladen werden."
              )
            );
          };

          document.head.appendChild(script);
        }
      );
    }

    await kbSupabasePromise;
  }

  kbSupabase=
    window.supabase.createClient(
      KB_CLOUD.url,
      KB_CLOUD.key
    );

  return kbSupabase;
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

    if(!email||!password){
      error.textContent=
        "Bitte E-Mail und Passwort eingeben.";
      return;
    }

    button.disabled=true;
    button.textContent="Anmelden …";

    try{
      await authLogin(email,password);
    }catch(e){
      error.textContent=
        e?.message||
        "Anmeldung fehlgeschlagen.";
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
    if(e.key==="Enter") login();
  };
}

function showLogin(){
  createLoginBox();

  const e=
    document.getElementById(
      "kbLoginOverlay"
    );

  if(e) e.style.display="flex";
}

function hideLogin(){

  const e=
    document.getElementById(
      "kbLoginOverlay"
    );

  if(e) e.style.display="none";
}

async function authLogin(email,password){

  const client=
    await getSupabaseClient();

  const {data,error}=
    await client.auth.signInWithPassword({
      email,
      password
    });

  if(error){
    throw new Error(
      "Supabase-Login: "+
      (error.message||"Anmeldung fehlgeschlagen.")
    );
  }

  if(!data?.session){
    throw new Error(
      "Supabase hat keine Sitzung zurückgegeben."
    );
  }

  saveAuthSession(data.session);
  hideLogin();
  updateCloudBanner();

  if(kbLoginWaitResolve){
    kbLoginWaitResolve(true);
    kbLoginWaitResolve=null;
    kbLoginWaitPromise=null;
  }

  return data.session;
}

async function authRefresh(){

  try{

    const client=
      await getSupabaseClient();

    const {data,error}=
      await client.auth.getSession();

    if(error||!data?.session){
      clearAuthSession();
      return false;
    }

    saveAuthSession(data.session);
    hideLogin();
    updateCloudBanner();

    return true;

  }catch(e){

    clearAuthSession();
    return false;
  }
}

async function ensureAuth(){

  if(!cloudReady())
    return false;

  if(authSessionValid())
    return true;

  if(await authRefresh())
    return true;

  showLogin();

  if(!kbLoginWaitPromise){

    kbLoginWaitPromise=
      new Promise(resolve=>{
        kbLoginWaitResolve=resolve;
      });
  }

  return kbLoginWaitPromise;
}

async function cloudClient(){

  if(!await ensureAuth()){
    throw new Error("Nicht angemeldet.");
  }

  return await getSupabaseClient();
}


/* VERKÄUFER */

async function cloudGetSellers(){

  const c=await cloudClient();

  const {data,error}=
    await c
      .from("sellers")
      .select("*")
      .order("name",{ascending:true});

  if(error)
    throw new Error(error.message);

  return data||[];
}

async function cloudSaveSeller(s){

  const c=await cloudClient();

  const body={
    id:s.id,
    number:s.number,
    name:s.name,
    phone:s.phone||"",
    commission_enabled:
      s.commissionEnabled===true,
    commission_rate:
      Number(s.commissionRate??15)
  };

  const {data,error}=
    await c
      .from("sellers")
      .upsert(body,{onConflict:"id"})
      .select()
      .single();

  if(error)
    throw new Error(error.message);

  return data;
}

async function cloudDeleteSeller(id){

  const c=await cloudClient();

  const {error}=
    await c
      .from("sellers")
      .delete()
      .eq("id",id);

  if(error)
    throw new Error(error.message);

  return true;
}


/* KASSENBON */

async function cloudCreateReceipt(
  items,
  payment
){

  const c=await cloudClient();

  const total=items.reduce(
    (sum,item)=>
      sum+(Number(item.price)||0),
    0
  );

  const {data:receipt,error:receiptError}=
    await c
      .from("receipts")
      .insert({
        register_id:KB_CLOUD.register,
        payment:payment,
        total:total
      })
      .select()
      .single();

  if(receiptError){
    throw new Error(
      "Kassenbon: "+
      receiptError.message
    );
  }

  const rows=items.map(item=>({

    receipt_id:receipt.id,

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

    size:String(item.size),

    price:Number(item.price),

    commission_enabled:
      item.commissionEnabled===true,

    commission_rate:
      Number(item.commissionRate||0)

  }));

  const {error:itemError}=
    await c
      .from("receipt_items")
      .insert(rows);

  if(itemError){

    try{
      await c
        .from("receipts")
        .delete()
        .eq("id",receipt.id);
    }catch(e){}

    throw new Error(
      "Artikel: "+
      itemError.message
    );
  }

  return receipt;
}


/* VERKÄUFE LADEN */

async function cloudGetReceipts(){

  const c=await cloudClient();

  const {data:receipts,error:receiptError}=
    await c
      .from("receipts")
      .select("*")
      .order("created_at",{ascending:false});

  if(receiptError){
    throw new Error(
      "Belege: "+
      receiptError.message
    );
  }

  if(!receipts?.length)
    return [];

  const {data:items,error:itemError}=
    await c
      .from("receipt_items")
      .select("*")
      .order("id",{ascending:true});

  if(itemError){
    throw new Error(
      "Artikel: "+
      itemError.message
    );
  }

  const byReceipt={};

  (items||[]).forEach(item=>{

    if(!byReceipt[item.receipt_id])
      byReceipt[item.receipt_id]=[];

    byReceipt[item.receipt_id].push(item);
  });

  return receipts.map(receipt=>({

    ...receipt,

    receipt_items:
      byReceipt[receipt.id]||[]

  }));
}


/* ARTIKEL ÄNDERN */

async function cloudUpdateReceiptItem(
  id,
  patch
){

  const c=await cloudClient();

  const {data,error}=
    await c
      .from("receipt_items")
      .update(patch)
      .eq("id",id)
      .select()
      .single();

  if(error)
    throw new Error(error.message);

  return data;
}


/* ABSCHLUSS */

async function cloudResetReceipts(){

  const c=await cloudClient();

  const {error}=
    await c
      .from("receipts")
      .delete()
      .gt("id",0);

  if(error)
    throw new Error(error.message);

  return true;
}

async function cloudResetReceiptsForRegister(
  registerId
){

  const c=await cloudClient();

  const {error}=
    await c
      .from("receipts")
      .delete()
      .eq("register_id",registerId);

  if(error)
    throw new Error(error.message);

  return true;
}


/* CLOUD-STATUS */

function cloudBanner(){

  if(!document.getElementById("cloudStatus")){

    const e=
      document.createElement("div");

    e.id="cloudStatus";

    e.style.cssText=
      "position:fixed;bottom:8px;left:50%;"+
      "transform:translateX(-50%);z-index:9999;"+
      "padding:8px 14px;border-radius:999px;"+
      "background:#172033;color:#fff;"+
      "font:600 13px system-ui;"+
      "box-shadow:0 4px 14px #0002";

    document.body.appendChild(e);
  }

  updateCloudBanner();
}

function updateCloudBanner(){

  const e=
    document.getElementById(
      "cloudStatus"
    );

  if(!e) return;

  if(!cloudReady()){

    e.textContent=
      "☁ Cloud noch nicht eingerichtet";

  }else if(authSessionValid()){

    e.textContent=
      `☁ Cloud verbunden · ${KB_CLOUD.register}`;

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
    "background:#fff;color:#172033";

  for(let i=1;i<=6;i++){

    const option=
      document.createElement("option");

    option.value=`Kasse ${i}`;
    option.textContent=`Kasse ${i}`;

    select.appendChild(option);
  }

  select.value=KB_CLOUD.register;

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


/* START */

(async()=>{

  if(!cloudReady())
    return;

  try{

    const client=
      await getSupabaseClient();

    const {data}=
      await client.auth.getSession();

    if(data?.session){

      saveAuthSession(data.session);
      hideLogin();

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
