let sellers=[];
let editId=null;
const $=id=>document.getElementById(id);
const commissionInput=document.getElementById("commissionEnabled");
const commissionRateInput=document.getElementById("commissionRate");
const commissionRateWrap=document.getElementById("commissionRateWrap");
const addressInput=document.getElementById("address");
const emailInput=document.getElementById("email");
const payoutMethodInput=document.getElementById("payoutMethod");

function commissionRateValue(){let v=parseFloat((commissionRateInput?.value||"15").replace(",","."));if(!Number.isFinite(v))v=15;return Math.min(100,Math.max(0,v))}
function updateCommissionVisibility(){if(commissionRateWrap)commissionRateWrap.classList.toggle("hidden",!commissionInput?.checked)}
function getExtras(){try{return JSON.parse(localStorage.getItem("kb_seller_extras")||"{}")}catch(e){return {}}}
function saveExtras(x){try{localStorage.setItem("kb_seller_extras",JSON.stringify(x))}catch(e){console.error(e)}}
function normalize(s){
  const e=getExtras()[String(s.number)]||{};
  return {...s,
    commissionEnabled:s.commissionEnabled===undefined?s.commission_enabled!==false:s.commissionEnabled,
    commissionRate:Number(s.commissionRate??s.commission_rate??15),
    phone:s.phone||"",
    address:s.address??e.address??"",
    email:s.email??e.email??"",
    payoutMethod:s.payoutMethod??s.payout_method??e.payoutMethod??"Bar"
  }
}
function esc(v){return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function initials(n){return n.trim().split(/\s+/).map(x=>x[0]).join("").slice(0,2).toUpperCase()}
function sorted(a){return [...a].sort((x,y)=>{let xn=x.name.trim().split(/\s+/).pop(),yn=y.name.trim().split(/\s+/).pop();return xn.localeCompare(yn,"de-DE",{sensitivity:"base"})||x.name.localeCompare(y.name,"de-DE")})}
function euro(v){return Number(v||0).toLocaleString("de-DE",{style:"currency",currency:"EUR"})}

async function loadSellers(){
  try{
    if(KBCloud.cloudReady()) sellers=(await KBCloud.cloudGetSellers()).map(normalize);
    else sellers=JSON.parse(localStorage.getItem("kb_sellers")||"[]").map(normalize);
  }catch(e){
    console.error(e); sellers=JSON.parse(localStorage.getItem("kb_sellers")||"[]").map(normalize);
  }
  render();
}
async function getSales(){if(KBCloud.cloudReady())return await KBCloud.cloudGetReceipts();return JSON.parse(localStorage.getItem("kb_sales")||"[]").map(x=>({receipt_items:[x]}))}
function flattenSales(receipts){return receipts.flatMap(r=>(r.receipt_items||[]).map(i=>({...i,price:Number(i.price||0),sellerNumber:i.seller_number??i.sellerNumber,commissionRate:i.commission_rate??i.commissionRate,commissionEnabled:i.commission_enabled??i.commissionEnabled})))}
async function sellerStats(number){
  const rows=flattenSales(await getSales()).filter(s=>String(s.sellerNumber)===String(number));
  const pieces=rows.length,turnover=rows.reduce((a,s)=>a+s.price,0);
  const commission=rows.reduce((a,s)=>a+s.price*Number(s.commissionRate ?? (s.commissionEnabled===false?0:.15)),0);
  return {pieces,turnover,commission,payout:turnover-commission};
}
async function render(){
  let q=($("search").value||"").toLocaleLowerCase("de-DE");
  let a=sorted(sellers).filter(s=>s.name.toLocaleLowerCase("de-DE").includes(q)||s.number.includes(q));
  $("count").textContent=`${sellers.length} Verkäufer`;
  $("list").innerHTML=a.length?a.map(s=>`<article class="seller"><div class="avatar">${initials(s.name)}</div><div><div class="name">${esc(s.name)}</div><div class="no">Verkäufernummer: ${esc(s.number)}</div>${s.phone?`<div class="phone">☎ ${esc(s.phone)}</div>`:""}<span class="commission-badge ${s.commissionEnabled?"yes":"no"}">${s.commissionEnabled?`${s.commissionRate??15} % Provision`:"Keine Provision"}</span></div><div class="seller-actions"><button class="report" title="Abrechnung" onclick="showReport('${s.id}')">€</button><div class="seller-bottom-actions"><button class="small" title="Bearbeiten" onclick="editSeller('${s.id}')">✎</button><button class="small delete" title="Löschen" onclick="del('${s.id}')">×</button></div></div></article>`).join(""):'<div class="empty">Noch keine Verkäufer angelegt.</div>';
}
async function showReport(id){
  const s=sellers.find(x=>x.id===id);if(!s)return;
  const st=await sellerStats(s.number);
  $("reportTitle").textContent=`Abrechnung – ${s.name}`;$("reportSeller").textContent=`Verkäufernummer: ${s.number}`;
  $("reportPieces").textContent=st.pieces;$("reportTurnover").textContent=euro(st.turnover);$("reportPayout").textContent=euro(st.payout);
  const note=document.querySelector(".reportnote");if(note)note.textContent="Die Abrechnung berücksichtigt die beim jeweiligen Verkauf gespeicherte Provision.";
  $("report").classList.remove("hidden");
}
function closeReport(){$("report").classList.add("hidden")}
function openForm(){
  editId=null;$("number").value="";$("name").value="";$("phone").value="";
  if(addressInput)addressInput.value="";if(emailInput)emailInput.value="";if(payoutMethodInput)payoutMethodInput.value="Bar";
  if(commissionInput)commissionInput.checked=true;if(commissionRateInput)commissionRateInput.value="15";updateCommissionVisibility();
  $("error").textContent="";$("modalTitle").textContent="Verkäufer hinzufügen";$("modal").classList.remove("hidden");$("number").focus();
}
function closeForm(){$("modal").classList.add("hidden")}
async function saveSeller(){
  let number=$("number").value.trim(),name=$("name").value.trim(),phone=$("phone").value.trim();
  let address=addressInput?.value.trim()||"",email=emailInput?.value.trim()||"",payoutMethod=payoutMethodInput?.value||"Bar";
  let commissionEnabled=commissionInput?commissionInput.checked:true,commissionRate=commissionRateValue();
  if(!number||!name){$("error").textContent="Bitte Nummer und Name eingeben.";return}
  if(sellers.some(s=>s.number===number&&s.id!==editId)){$("error").textContent="Diese Verkäufernummer ist bereits vergeben.";return}
  let s=editId?sellers.find(x=>x.id===editId):{id:crypto.randomUUID?crypto.randomUUID():Date.now().toString()};
  Object.assign(s,{number,name,phone,address,email,payoutMethod,commissionEnabled,commissionRate});
  try{
    if(KBCloud.cloudReady()){
      const cloudSeller={...s};
      delete cloudSeller.address;delete cloudSeller.email;delete cloudSeller.payoutMethod;
      await KBCloud.cloudSaveSeller(cloudSeller);
    }else{
      let i=sellers.findIndex(x=>x.id===s.id);if(i<0)sellers.push(s);localStorage.setItem("kb_sellers",JSON.stringify(sellers))
    }
    const ex=getExtras();ex[String(number)]={address,email,payoutMethod};saveExtras(ex);
    if(!sellers.some(x=>x.id===s.id))sellers.push(s);
    closeForm();render();
  }catch(e){$("error").textContent="Speichern fehlgeschlagen. Bitte Internetverbindung prüfen.";console.error(e)}
}
function editSeller(id){
  let s=sellers.find(x=>x.id===id);if(!s)return;editId=id;
  $("number").value=s.number;$("name").value=s.name;$("phone").value=s.phone||"";
  if(addressInput)addressInput.value=s.address||"";if(emailInput)emailInput.value=s.email||"";if(payoutMethodInput)payoutMethodInput.value=s.payoutMethod||"Bar";
  if(commissionInput)commissionInput.checked=s.commissionEnabled===true;if(commissionRateInput)commissionRateInput.value=String(s.commissionRate??15).replace(".",",");
  updateCommissionVisibility();$("error").textContent="";$("modalTitle").textContent="Verkäufer bearbeiten";$("modal").classList.remove("hidden");
}
async function del(id){
  let s=sellers.find(x=>x.id===id);if(!s||!confirm(`„${s.name}“ löschen?`))return;
  try{
    if(KBCloud.cloudReady())await KBCloud.cloudDeleteSeller(id);else localStorage.setItem("kb_sellers",JSON.stringify(sellers.filter(x=>x.id!==id)));
    const ex=getExtras();delete ex[String(s.number)];saveExtras(ex);
    sellers=sellers.filter(x=>x.id!==id);render()
  }catch(e){alert("Löschen fehlgeschlagen: " + (e?.message || e)); console.error(e)}
}
$("search").oninput=render;
if(commissionInput)commissionInput.addEventListener("change",updateCommissionVisibility);
updateCommissionVisibility();
loadSellers();
KBCloud.cloudBanner();
