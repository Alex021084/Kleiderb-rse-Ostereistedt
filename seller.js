let sellers=[];
let editId=null;
const $=id=>document.getElementById(id);
const commissionInput=document.getElementById("commissionEnabled");
const commissionRateInput=document.getElementById("commissionRate");
const commissionRateWrap=document.getElementById("commissionRateWrap");
const streetInput=document.getElementById("street");
const houseNumberInput=document.getElementById("houseNumber");
const zipInput=document.getElementById("zip");
const cityInput=document.getElementById("city");
const emailInput=document.getElementById("email");
const payoutMethodInput=document.getElementById("payoutMethod");

function commissionRateValue(){let v=parseFloat((commissionRateInput?.value||"15").replace(",","."));if(!Number.isFinite(v))v=15;return Math.min(100,Math.max(0,v))}
function updateCommissionVisibility(){if(commissionRateWrap)commissionRateWrap.classList.toggle("hidden",!commissionInput?.checked)}
function getExtras(){try{return JSON.parse(localStorage.getItem("kb_seller_extras")||"{}")}catch(e){return {}}}
function saveExtras(x){try{localStorage.setItem("kb_seller_extras",JSON.stringify(x))}catch(e){console.error(e)}}
function splitLegacyAddress(v){
  const a=String(v||"").trim();
  if(!a)return {street:"",houseNumber:"",zip:"",city:""};
  const m=a.match(/^(.*?)[, ]+([0-9]+[A-Za-z]?)[, ]+([0-9]{5})[ ]+(.*)$/);
  if(m)return {street:m[1].trim(),houseNumber:m[2].trim(),zip:m[3].trim(),city:m[4].trim()};
  return {street:a,houseNumber:"",zip:"",city:""};
}
function addressParts(s){
  const p={street:s.street||"",houseNumber:s.houseNumber||"",zip:s.zip||"",city:s.city||""};
  if(!p.street&&!p.houseNumber&&!p.zip&&!p.city&&s.address) return splitLegacyAddress(s.address);
  return p;
}
function normalize(s){
  const e=getExtras()[String(s.number)]||{};
  return {...s,
    commissionEnabled:s.commissionEnabled===undefined?s.commission_enabled!==false:s.commissionEnabled,
    commissionRate:Number(s.commissionRate??s.commission_rate??15),
    phone:s.phone||"",
    salutation:s.salutation??e.salutation??"Frau",
    address:s.address??e.address??"",
    street:s.street??e.street??"",
    houseNumber:s.houseNumber??s.house_number??e.houseNumber??"",
    zip:s.zip??e.zip??"",
    city:s.city??e.city??"",
    email:s.email??e.email??"",
    payoutMethod:s.payoutMethod??s.payout_method??e.payoutMethod??"Bar",
    isParticipating:s.isParticipating===true || s.is_participating===true,
    signatureDocuments:s.signatureDocuments||s.signature_documents||{}
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
  const view=new URLSearchParams(location.search).get("liste")||"alle";
  const zipButton=$("downloadAllAgreements");
  if(zipButton){
    const showZip=view==="teilnehmend";
    zipButton.classList.toggle("hidden",!showZip);
    zipButton.style.display=showZip?"block":"none";
  }
  let a=sorted(sellers).filter(s=>(view!=="teilnehmend"||s.isParticipating===true) &&
    (s.name.toLocaleLowerCase("de-DE").includes(q)||s.number.includes(q)));
  $("count").textContent=view==="teilnehmend"
    ? `${sellers.filter(s=>s.isParticipating===true).length} teilnehmende Verkäufer`
    : `${sellers.length} gespeicherte Verkäufer`;
  const heading=document.getElementById("sellerViewTitle");
  if(heading) heading.textContent=view==="teilnehmend"?"Teilnehmende Verkäufer":"Alle gespeicherten Verkäufer";
  $("list").innerHTML=a.length?a.map(s=>view==="teilnehmend"
    ? `<article class="seller participant-compact"><label class="participation-toggle" title="Teilnahme an der aktuellen Börse"><input type="checkbox" ${s.isParticipating===true?"checked":""} onchange="toggleParticipation('${s.id}',this.checked)"></label><div class="participant-identity"><div class="participant-number">VK ${esc(s.number)}</div><div class="participant-name">${esc(s.name)}</div></div><div class="seller-actions compact-actions"><div class="signature-actions"><button class="signature-action ${s.signatureDocuments?.abgabe?.signature?'signed':'pending'}" onclick="openSignature('${s.id}','abgabe')">${s.signatureDocuments?.abgabe?.signature?'✓ Abgabe':'○ Abgabe'}</button><button class="signature-action ${s.signatureDocuments?.abholung?.signature?'signed':'pending'}" onclick="openSignature('${s.id}','abholung')">${s.signatureDocuments?.abholung?.signature?'✓ Abholung':'○ Abholung'}</button><button class="signature-pdf" title="Beide Dokumente als PDF" onclick="openSellerDocumentsPdf('${s.id}')">PDF</button></div><button class="report" title="Abrechnung" onclick="showReport('${s.id}')">€</button></div></article>`
    : `<article class="seller"><label class="participation-toggle" title="Teilnahme an der aktuellen Börse"><input type="checkbox" ${s.isParticipating===true?"checked":""} onchange="toggleParticipation('${s.id}',this.checked)"><span>Teilnahme</span></label><div class="avatar">${initials(s.name)}</div><div><div class="name">${esc(s.name)}</div><div class="no">Verkäufernummer: ${esc(s.number)}</div>${s.phone?`<div class="phone">☎ ${esc(s.phone)}</div>`:""}<span class="commission-badge ${s.commissionEnabled?"yes":"no"}">${s.commissionEnabled?`${s.commissionRate??15} % Provision`:"Keine Provision"}</span></div><div class="seller-actions"><button class="report" title="Abrechnung" onclick="showReport('${s.id}')">€</button><div class="seller-bottom-actions"><button class="small" title="Bearbeiten" onclick="editSeller('${s.id}')">✎</button><button class="small delete" title="Löschen" onclick="del('${s.id}')">×</button></div></div></article>`).join(""):'<div class="empty">'+(view==="teilnehmend"?'Noch keine Verkäufer für diese Börse ausgewählt.':'Noch keine Verkäufer angelegt.')+'</div>';
}
async function toggleParticipation(id,checked){
  const seller=sellers.find(x=>String(x.id)===String(id)); if(!seller)return;
  const previous=seller.isParticipating===true;
  seller.isParticipating=!!checked;
  try{
    if(KBCloud.cloudReady()) await KBCloud.cloudSaveSeller(seller);
    else localStorage.setItem("kb_sellers",JSON.stringify(sellers));
    render();
  }catch(error){
    seller.isParticipating=previous;
    render();
    alert("Teilnahme konnte nicht gespeichert werden. Bitte Cloud-Verbindung prüfen.\n\n"+(error.message||""));
  }
}

async function showReport(id){
  const s=sellers.find(x=>x.id===id);if(!s)return;
  const st=await sellerStats(s.number);
  $("reportTitle").textContent=`Abrechnung – ${s.name}`;$("reportSeller").textContent=`Verkäufernummer: ${s.number}`;
  $("reportPieces").textContent=st.pieces;$("reportTurnover").textContent=euro(st.turnover);$("reportPayout").textContent=euro(st.payout);
  const note=document.querySelector(".reportnote");if(note)note.textContent="Die Abrechnung berücksichtigt die beim jeweiligen Verkauf gespeicherte Provision.";
  document.documentElement.classList.add("modal-open");document.body.classList.add("modal-open");$("report").classList.remove("hidden");
}
function closeReport(){$("report").classList.add("hidden");document.documentElement.classList.remove("modal-open");document.body.classList.remove("modal-open")}
function openForm(){
  editId=null;$("number").value="";$("name").value="";$("phone").value="";if($("salutation"))$("salutation").value="Frau";
  if(streetInput)streetInput.value="";if(houseNumberInput)houseNumberInput.value="";
  if(zipInput)zipInput.value="";if(cityInput)cityInput.value="";
  if(emailInput)emailInput.value="";if(payoutMethodInput)payoutMethodInput.value="Bar";
  if(commissionInput)commissionInput.checked=true;if(commissionRateInput)commissionRateInput.value="15";updateCommissionVisibility();
  $("error").textContent="";document.documentElement.classList.add("modal-open");document.body.classList.add("modal-open");$("modalTitle").textContent="Verkäufer hinzufügen";$("modal").classList.remove("hidden");$("number").focus();
}
function closeForm(){$("modal").classList.add("hidden");document.documentElement.classList.remove("modal-open");document.body.classList.remove("modal-open")}
async function saveSeller(){
  let number=$("number").value.trim(),name=$("name").value.trim(),phone=$("phone").value.trim();
  let street=streetInput?.value.trim()||"",houseNumber=houseNumberInput?.value.trim()||"",zip=zipInput?.value.trim()||"",city=cityInput?.value.trim()||"";
  let address=[street,houseNumber,zip,city].filter(Boolean).join(", ");
  let email=emailInput?.value.trim()||"",payoutMethod=payoutMethodInput?.value||"Bar",salutation=$("salutation")?.value||"Frau";
  let commissionEnabled=commissionInput?commissionInput.checked:true,commissionRate=commissionRateValue();
  if(!number||!name){$("error").textContent="Bitte Nummer und Name eingeben.";return}
  if(sellers.some(s=>s.number===number&&s.id!==editId)){$("error").textContent="Diese Verkäufernummer ist bereits vergeben.";return}
  let s=editId?sellers.find(x=>x.id===editId):{id:crypto.randomUUID?crypto.randomUUID():Date.now().toString()};
  Object.assign(s,{number,name,phone,salutation,address,street,houseNumber,zip,city,email,payoutMethod,commissionEnabled,commissionRate,isParticipating:s.isParticipating===true});
  try{
    if(KBCloud.cloudReady()){
      await KBCloud.cloudSaveSeller(s);
    }else{
      let i=sellers.findIndex(x=>x.id===s.id);if(i<0)sellers.push(s);localStorage.setItem("kb_sellers",JSON.stringify(sellers))
    }
    const ex=getExtras();ex[String(number)]={address,street,houseNumber,zip,city,email,payoutMethod,salutation};saveExtras(ex);
    if(!sellers.some(x=>x.id===s.id))sellers.push(s);
    closeForm();render();
  }catch(e){$("error").textContent="Speichern fehlgeschlagen. Bitte Internetverbindung prüfen.";console.error(e)}
}
function editSeller(id){
  let s=sellers.find(x=>x.id===id);if(!s)return;editId=id;
  $("number").value=s.number;$("name").value=s.name;$("phone").value=s.phone||"";if($("salutation"))$("salutation").value=s.salutation||"Frau";
  const ap=addressParts(s);
  if(streetInput)streetInput.value=ap.street;if(houseNumberInput)houseNumberInput.value=ap.houseNumber;
  if(zipInput)zipInput.value=ap.zip;if(cityInput)cityInput.value=ap.city;
  if(emailInput)emailInput.value=s.email||"";if(payoutMethodInput)payoutMethodInput.value=s.payoutMethod||"Bar";
  if(commissionInput)commissionInput.checked=s.commissionEnabled===true;if(commissionRateInput)commissionRateInput.value=String(s.commissionRate??15).replace(".",",");
  updateCommissionVisibility();$("error").textContent="";document.documentElement.classList.add("modal-open");document.body.classList.add("modal-open");$("modalTitle").textContent="Verkäufer bearbeiten";$("modal").classList.remove("hidden");
}
async function del(id){
  let s=sellers.find(x=>x.id===id);if(!s||!confirm(`„${s.name}“ löschen?`))return;
  try{
    if(KBCloud.cloudReady())await KBCloud.cloudDeleteSeller(id);else localStorage.setItem("kb_sellers",JSON.stringify(sellers.filter(x=>x.id!==id)));
    const ex=getExtras();delete ex[String(s.number)];saveExtras(ex);
    sellers=sellers.filter(x=>x.id!==id);render()
  }catch(e){alert("Löschen fehlgeschlagen: " + (e?.message || e)); console.error(e)}
}

// Verkäufervereinbarungen: Abgabe und Abholung mit dauerhaft gespeicherter Unterschrift.
const AGREEMENT_TEXT={
 abgabe:"Ich bestätige, dass die von mir abgegebenen Kleidungsstücke mein Eigentum sind und ich diese freiwillig zum Verkauf auf der Kleiderbörse abgebe. Mir ist bekannt, dass der Veranstalter keine Haftung für Verlust, Diebstahl, Beschädigung oder sonstige Schäden an den abgegebenen Sachen übernimmt.",
 abholung:"Hiermit bestätige ich, meine nicht verkauften Kleidungsstücke sowie den Erlös aus den verkauften Artikeln vollständig erhalten zu haben. Mit meiner Unterschrift bestätige ich, dass die Abholung und Auszahlung abgeschlossen sind."
};
const PRIVACY_NOTICE=`Im Rahmen der Kleiderbörse erheben und speichern wir folgende personenbezogene Daten: Name, Telefonnummer und E-Mail-Adresse.

Die Daten werden ausschließlich zur Organisation und Durchführung der Kleiderbörse sowie zur Abwicklung des Verkaufs und der Auszahlung verwendet. Die Speicherung erfolgt digital in einer zugriffsgeschützten Cloud.

Nach Abschluss der Kleiderbörse und der vollständigen Abwicklung werden die Daten gelöscht, sofern keine gesetzlichen Aufbewahrungspflichten entgegenstehen.

Die Teilnehmer haben das Recht auf Auskunft, Berichtigung und Löschung ihrer personenbezogenen Daten im Rahmen der gesetzlichen Bestimmungen.`;
function todayGerman(){return new Date().toLocaleDateString("de-DE");}
function openSignature(id,type){
 const seller=sellers.find(x=>String(x.id)===String(id));if(!seller)return;
 const old=seller.signatureDocuments?.[type];
 if(old?.signature && !confirm("Für diesen Vorgang liegt bereits eine Unterschrift vor. Möchtest du sie wirklich ersetzen?"))return;
 const title=type==="abgabe"?"Abgabe":"Abholung";
 const modal=document.getElementById("signatureModal");
 modal.dataset.sellerId=id;modal.dataset.type=type;
 document.getElementById("signatureTitle").textContent=title+" – "+seller.name;
 document.getElementById("signatureText").textContent=AGREEMENT_TEXT[type];
 const privacyBox=document.getElementById("signaturePrivacy");
 if(privacyBox){privacyBox.classList.toggle("hidden",type!=="abgabe");}
 document.getElementById("signatureAccepted").checked=false;
 document.getElementById("signatureAccepted").onchange=updateSignatureCanvasLock;
 document.getElementById("signatureError").textContent="";
 clearSignatureCanvas();
 updateSignatureCanvasLock();
 document.documentElement.classList.add("modal-open");document.body.classList.add("modal-open");modal.classList.remove("hidden");
 setTimeout(resizeSignatureCanvas,80);
}
function closeSignature(){document.getElementById("signatureModal").classList.add("hidden");document.documentElement.classList.remove("modal-open");document.body.classList.remove("modal-open");}
const sigCanvas=document.getElementById("signatureCanvas");
const sigCtx=sigCanvas.getContext("2d");let sigDrawing=false,sigHasInk=false;
function resizeSignatureCanvas(){
 const rect=sigCanvas.getBoundingClientRect();if(!rect.width)return;
 const ratio=Math.max(1,window.devicePixelRatio||1);
 const old=sigHasInk?sigCanvas.toDataURL():null;
 sigCanvas.width=Math.round(rect.width*ratio);sigCanvas.height=Math.round(220*ratio);
 sigCtx.setTransform(ratio,0,0,ratio,0,0);sigCtx.lineWidth=3;sigCtx.lineCap="round";sigCtx.lineJoin="round";sigCtx.strokeStyle="#172033";
 if(old){const im=new Image();im.onload=()=>sigCtx.drawImage(im,0,0,rect.width,220);im.src=old;}
}
function clearSignatureCanvas(){sigHasInk=false;sigCtx.clearRect(0,0,sigCanvas.width,sigCanvas.height);}
function updateSignatureCanvasLock(){
 const accepted=document.getElementById("signatureAccepted").checked;
 const wrap=document.querySelector(".signature-canvas-wrap");
 if(wrap){wrap.classList.toggle("signature-locked",!accepted);wrap.setAttribute("aria-disabled",String(!accepted));}
}
function signaturePoint(e){const r=sigCanvas.getBoundingClientRect();return {x:e.clientX-r.left,y:e.clientY-r.top};}
sigCanvas.addEventListener("pointerdown",e=>{if(!document.getElementById("signatureAccepted").checked)return;e.preventDefault();sigCanvas.setPointerCapture(e.pointerId);sigDrawing=true;const p=signaturePoint(e);sigCtx.beginPath();sigCtx.moveTo(p.x,p.y);});
sigCanvas.addEventListener("pointermove",e=>{if(!sigDrawing||!document.getElementById("signatureAccepted").checked)return;e.preventDefault();const p=signaturePoint(e);sigCtx.lineTo(p.x,p.y);sigCtx.stroke();sigHasInk=true;});
["pointerup","pointercancel","lostpointercapture"].forEach(ev=>sigCanvas.addEventListener(ev,()=>sigDrawing=false));
function clearSignature(){clearSignatureCanvas();}
async function saveSignature(){
 const modal=document.getElementById("signatureModal"),id=modal.dataset.sellerId,type=modal.dataset.type;
 const seller=sellers.find(x=>String(x.id)===String(id));const err=document.getElementById("signatureError");
 if(!document.getElementById("signatureAccepted").checked){err.textContent="Bitte zuerst die Erklärung bestätigen.";return;}
 if(!sigHasInk){err.textContent="Bitte die Unterschrift im Feld leisten.";return;}
 const docs={...(seller.signatureDocuments||{})};
 docs[type]={text:AGREEMENT_TEXT[type],accepted:true,signature:sigCanvas.toDataURL("image/png"),date:new Date().toISOString(),dateDisplay:todayGerman()};
 const previous=seller.signatureDocuments;seller.signatureDocuments=docs;
 try{
  if(KBCloud.cloudReady()) await KBCloud.cloudSaveSeller(seller);
  else localStorage.setItem("kb_sellers",JSON.stringify(sellers));
  closeSignature();render();
 }catch(e){seller.signatureDocuments=previous;err.textContent="Speichern fehlgeschlagen. Bitte Cloud-Verbindung prüfen.";console.error(e);}
}
function openSellerDocumentsPdf(id){
 const seller=sellers.find(x=>String(x.id)===String(id));if(!seller)return;
 const d=seller.signatureDocuments||{};
 const section=(type,label)=>{const x=d[type];return `<section><h2>Bei der ${label}:</h2><p>${esc(AGREEMENT_TEXT[type])}</p>${type==="abgabe"?`<h3>Datenschutzhinweis</h3><p>${esc(PRIVACY_NOTICE).replace(/\\n\\n/g,"</p><p>")}</p>`:""}${x?.accepted?`<p><strong>Bestätigt am:</strong> ${esc(x.dateDisplay||"")}</p><img class="sig" src="${x.signature}" alt="Unterschrift"><p>${esc(seller.name)} · VK ${esc(seller.number)}</p>`:`<p class="missing">Noch nicht unterschrieben</p>`}</section>`};
 const w=window.open("","_blank");if(!w){alert("Safari hat das PDF-Fenster blockiert. Bitte Pop-ups für diese Seite erlauben.");return;}
 w.document.write(`<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Vereinbarung – ${esc(seller.name)}</title><style>body{font:16px Arial,sans-serif;color:#172033;padding:28px;line-height:1.6;max-width:900px;margin:auto}h1{font-size:25px;margin:20px 0 8px}h2{font-size:19px;margin-top:28px;color:#26364c}section{page-break-inside:avoid;border-bottom:1px solid #cbd3df;padding:0 0 22px;margin-bottom:22px}.sig{display:block;max-width:100%;height:100px;object-fit:contain;object-position:left center;border-bottom:1px solid #222}.missing{color:#a45b00;font-weight:bold}.agreement-pdf-toolbar{display:flex;justify-content:space-between;gap:14px;margin:0 0 22px}.agreement-back-button,.agreement-print-button{border:0;border-radius:11px;padding:13px 18px;font-size:16px;font-weight:700;cursor:pointer}.agreement-back-button{background:#edf1f8;color:#26364c}.agreement-print-button{background:#2456df;color:white;box-shadow:0 3px 10px rgba(36,86,223,.2)}@media print{.agreement-pdf-toolbar{display:none}body{padding:0}}</style></head><body><div class="agreement-pdf-toolbar"><button class="agreement-back-button" onclick="window.close();setTimeout(()=>{if(!window.closed)history.back()},120)">← Zurück</button><button class="agreement-print-button" onclick="window.print()">📄 PDF drucken / speichern</button></div><h1>Kleiderbörse – Vereinbarung</h1><p>${esc(seller.name)} · VK ${esc(seller.number)}</p>${section("abgabe","Abgabe der Kleidung")}${section("abholung","Abholung und Auszahlung")}</body></html>`);
 w.document.close();
}


// ZIP-Export aller unterschriebenen Vereinbarungen der aktuellen Teilnehmer.
function zipCrc32(bytes){
 let c=0xffffffff;
 for(let i=0;i<bytes.length;i++){c^=bytes[i];for(let k=0;k<8;k++)c=(c>>>1)^((c&1)?0xedb88320:0);}
 return (c^0xffffffff)>>>0;
}
function zipU16(v){return [v&255,(v>>>8)&255]}
function zipU32(v){return [v&255,(v>>>8)&255,(v>>>16)&255,(v>>>24)&255]}
function makeStoredZip(entries){
 const enc=new TextEncoder(),locals=[],centrals=[];let offset=0;
 for(const entry of entries){
  const name=enc.encode(entry.name),data=enc.encode(entry.content),crc=zipCrc32(data);
  const local=new Uint8Array([...zipU32(0x04034b50),...zipU16(20),...zipU16(0x0800),...zipU16(0),...zipU16(0),...zipU16(0),...zipU32(crc),...zipU32(data.length),...zipU32(data.length),...zipU16(name.length),...zipU16(0),...name,...data]);
  locals.push(local);
  const central=new Uint8Array([...zipU32(0x02014b50),...zipU16(20),...zipU16(20),...zipU16(0x0800),...zipU16(0),...zipU16(0),...zipU16(0),...zipU32(crc),...zipU32(data.length),...zipU32(data.length),...zipU16(name.length),...zipU16(0),...zipU16(0),...zipU16(0),...zipU16(0),...zipU32(0),...zipU32(offset),...name]);
  centrals.push(central);offset+=local.length;
 }
 const centralSize=centrals.reduce((n,x)=>n+x.length,0),count=entries.length;
 const end=new Uint8Array([...zipU32(0x06054b50),...zipU16(0),...zipU16(0),...zipU16(count),...zipU16(count),...zipU32(centralSize),...zipU32(offset),...zipU16(0)]);
 return new Blob([...locals,...centrals,end],{type:"application/zip"});
}
function agreementHtmlForZip(seller){
 const d=seller.signatureDocuments||seller.signature_documents||{};
 const block=(type,label)=>{const x=d[type];if(!x?.signature)return "";
 return `<section><h2>Bei der ${label}:</h2><p>${esc(x.text||AGREEMENT_TEXT[type])}</p>${type==="abgabe"?`<h3>Datenschutzhinweis</h3><p>${esc(PRIVACY_NOTICE).replace(/\\n\\n/g,"</p><p>")}</p>`:""}<p><strong>Bestätigt am:</strong> ${esc(x.dateDisplay||"")}</p><img class="sig" src="${x.signature}" alt="Unterschrift"><p>${esc(seller.name)} · VK ${esc(seller.number)}</p></section>`};
 return `<!doctype html><html lang="de"><meta charset="utf-8"><title>Vereinbarung ${esc(seller.name)}</title><style>body{font:16px Arial,sans-serif;line-height:1.6;padding:28px;color:#172033}h1{font-size:23px}h2{font-size:18px;margin-top:28px}section{page-break-inside:avoid;border-bottom:1px solid #bbb;padding-bottom:18px}.sig{display:block;max-width:100%;height:95px;object-fit:contain;object-position:left center;border-bottom:1px solid #222}</style><h1>Kleiderbörse – Vereinbarung</h1><p>${esc(seller.name)} · VK ${esc(seller.number)}</p>${block("abgabe","Abgabe der Kleidung")}${block("abholung","Abholung und Auszahlung")}</html>`;
}
async function downloadAllAgreementsZip(){
 const btn=$("downloadAllAgreements");if(!btn)return;
 const participants=sellers.filter(x=>x.isParticipating===true||x.is_participating===true);
 const entries=[];
 participants.forEach(s=>{
  const d=s.signatureDocuments||s.signature_documents||{};
  if(!d.abgabe?.signature&&!d.abholung?.signature)return;
  const safe=(String(s.name||"Verkaeufer").replace(/[^a-z0-9äöüß_-]+/gi,"_").replace(/^_+|_+$/g,"")||"Verkaeufer");
  entries.push({name:`VK_${String(s.number||"").replace(/[^a-z0-9_-]/gi,"")}_${safe}.html`,content:agreementHtmlForZip(s)});
 });
 if(!entries.length){alert("Es liegen noch keine unterschriebenen Vereinbarungen bei den teilnehmenden Verkäufern vor.");return;}
 btn.disabled=true;const old=btn.textContent;btn.textContent="ZIP wird erstellt …";
 try{
  const blob=makeStoredZip(entries),url=URL.createObjectURL(blob),a=document.createElement("a");
  a.href=url;a.download="Kleiderboerse_Vereinbarungen.zip";document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),30000);
 }catch(e){console.error(e);alert("ZIP konnte nicht erstellt werden: "+(e.message||"Unbekannter Fehler"))}
 finally{btn.disabled=false;btn.textContent=old;}
}
if($("downloadAllAgreements"))$("downloadAllAgreements").addEventListener("click",downloadAllAgreementsZip);

$("search").oninput=render;
if(commissionInput)commissionInput.addEventListener("change",updateCommissionVisibility);
updateCommissionVisibility();
loadSellers();
KBCloud.cloudBanner();


// Kompatibilität für die Verkäufer-Abrechnung:
// Die PDF-Abrechnung kann damit die beim Verkäufer gewählte Auszahlungsart auslesen.
window.getSellerPayoutMethod=function(sellerNumber){
  try{
    const extras=JSON.parse(localStorage.getItem("kb_seller_extras")||"{}");
    return extras[String(sellerNumber)]?.payoutMethod || "Bar";
  }catch(e){
    return "Bar";
  }
};
