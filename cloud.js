
/* Central cloud storage for the Kleiderbörse.
   Uses Supabase REST without an additional library.
   Fill in cloud-config.js once with the project's URL and anon key. */
const KB_CLOUD = {
  get url(){ return (window.KB_CONFIG?.supabaseUrl || "").replace(/\/$/,""); },
  get key(){ return window.KB_CONFIG?.supabaseAnonKey || ""; },
  get register(){ return localStorage.getItem("kb_register") || "Kasse 1"; },
  set register(v){ localStorage.setItem("kb_register",v); }
};
function cloudReady(){ return !!(KB_CLOUD.url && KB_CLOUD.key); }
async function cloudFetch(path, options={}){
  if(!cloudReady()) throw new Error("Cloud ist noch nicht eingerichtet.");
  const headers={"apikey":KB_CLOUD.key,"Authorization":`Bearer ${KB_CLOUD.key}`,"Content-Type":"application/json",...(options.headers||{})};
  const r=await fetch(`${KB_CLOUD.url}/rest/v1/${path}`,{...options,headers});
  if(!r.ok) throw new Error(await r.text());
  const t=await r.text(); return t?JSON.parse(t):null;
}
async function cloudGetSellers(){
  return cloudFetch("sellers?select=*&order=name.asc");
}
async function cloudSaveSeller(s){
  const body={id:s.id,number:s.number,name:s.name,phone:s.phone||"",commission_enabled:s.commissionEnabled===true,commission_rate:Number(s.commissionRate??15)};
  const data=await cloudFetch("sellers?on_conflict=id",{method:"POST",headers:{"Prefer":"resolution=merge-duplicates,return=representation"},body:JSON.stringify(body)});
  return data?.[0]||body;
}
async function cloudDeleteSeller(id){
  await cloudFetch(`sellers?id=eq.${encodeURIComponent(id)}`,{method:"DELETE"});
}
async function cloudCreateReceipt(items,payment){
  const total=items.reduce((a,x)=>a+(Number(x.price)||0),0);
  const created=await cloudFetch("receipts",{method:"POST",headers:{"Prefer":"return=representation"},body:JSON.stringify({
    register_id:KB_CLOUD.register,payment,total
  })});
  const receipt=created[0];
  const rows=items.map(x=>({
    receipt_id:receipt.id,seller_number:String(x.sellerNumber),size:String(x.size),price:Number(x.price),
    commission_enabled:x.commissionEnabled===true,commission_rate:Number(x.commissionRate||0)
  }));
  await cloudFetch("receipt_items",{method:"POST",headers:{"Prefer":"return=minimal"},body:JSON.stringify(rows)});
  return receipt;
}
async function cloudGetReceipts(){
  return cloudFetch("receipts?select=*,receipt_items(*)&order=created_at.desc");
}
function cloudBanner(){
  if(document.getElementById("cloudStatus")) return;
  const el=document.createElement("div");el.id="cloudStatus";
  el.textContent=cloudReady()?`☁ Cloud verbunden · ${KB_CLOUD.register}`:"☁ Cloud noch nicht eingerichtet – aktuell wird lokal gespeichert";
  el.style.cssText="position:fixed;bottom:8px;left:50%;transform:translateX(-50%);z-index:9999;padding:8px 14px;border-radius:999px;background:#172033;color:#fff;font:600 13px system-ui;box-shadow:0 4px 14px #0002";
  document.body.appendChild(el);
}
function setRegister(v){KB_CLOUD.register=v;const e=document.getElementById("cloudStatus");if(e)e.textContent=`☁ ${cloudReady()?"Cloud verbunden":"Lokal"} · ${v}`;}
function registerPicker(){
  const wrap=document.createElement("div");
  wrap.style.cssText="display:flex;align-items:center;gap:8px";
  const s=document.createElement("select");
  s.id="registerSelect";s.style.cssText="font:700 16px system-ui;padding:8px 12px;border-radius:10px;border:1px solid #ffffff55;background:#fff;color:#172033";
  for(let i=1;i<=5;i++){const o=document.createElement("option");o.value=`Kasse ${i}`;o.textContent=`Kasse ${i}`;s.appendChild(o);}
  s.value=KB_CLOUD.register;s.onchange=()=>setRegister(s.value);
  wrap.appendChild(s);return wrap;
}
window.KBCloud={cloudReady,cloudGetSellers,cloudSaveSeller,cloudDeleteSeller,cloudCreateReceipt,cloudGetReceipts,cloudBanner,registerPicker,setRegister,KB_CLOUD};
