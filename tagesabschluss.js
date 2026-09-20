const $=id=>document.getElementById(id);
function euro(v){return Number(v||0).toLocaleString("de-DE",{style:"currency",currency:"EUR"})}
function esc(v){return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[c]))}
let selectedRegister="Alle Kassen";

async function loadData(){
 if(KBCloud.cloudReady()) return await KBCloud.cloudGetReceipts();
 const sales=JSON.parse(localStorage.getItem("kb_sales")||"[]"),groups={};
 sales.forEach(x=>{let id=x.receiptId||x.timestamp;if(!groups[id])groups[id]={id,receipt_no:id.slice(0,8).toUpperCase(),register_id:x.registerId||"Kasse 1",payment:x.payment,created_at:x.timestamp,receipt_items:[]};groups[id].receipt_items.push(x)});
 return Object.values(groups).sort((a,b)=>String(b.created_at).localeCompare(String(a.created_at)));
}
function itemsOf(r){return r.receipt_items||[]}
function priceOf(i){return Number(i.price||0)}
function rateOf(i){return Number(i.commission_rate??i.commissionRate??(i.commission_enabled===false||i.commissionEnabled===false?0:.15))}
function filteredReceipts(receipts){return selectedRegister==="Alle Kassen"?receipts:receipts.filter(r=>(r.register_id||r.registerId||"Kasse 1")===selectedRegister)}

async function render(){
 const allReceipts=await loadData(),receipts=filteredReceipts(allReceipts),items=receipts.flatMap(itemsOf);
 const total=items.reduce((a,x)=>a+priceOf(x),0);
 const cash=items.filter(x=>x.payment==="Bar").reduce((a,x)=>a+priceOf(x),0);
 const card=items.filter(x=>x.payment==="EC").reduce((a,x)=>a+priceOf(x),0);
 const paypal=items.filter(x=>x.payment==="PayPal").reduce((a,x)=>a+priceOf(x),0);
 const commission=items.reduce((a,x)=>a+priceOf(x)*rateOf(x),0),payout=total-commission;
 $("totalRevenue").textContent=euro(total);$("cashTotal").textContent=euro(cash);$("cardTotal").textContent=euro(card);$("paypalTotal").textContent=euro(paypal);
 $("commissionGross").textContent=euro(total);$("commission").textContent=euro(commission);$("payout").textContent=euro(payout);
 $("articleCount").textContent=`${items.length} ${items.length===1?"Artikel":"Artikel"}`;
 $("selectedRegisterText").textContent=`Anzeige: ${selectedRegister}`;

 const bySeller={};
 items.forEach(x=>{const n=String(x.seller_number??x.sellerNumber??"");if(!bySeller[n])bySeller[n]={count:0,gross:0,commission:0,payout:0};const p=priceOf(x),c=p*rateOf(x);bySeller[n].count++;bySeller[n].gross+=p;bySeller[n].commission+=c;bySeller[n].payout+=p-c});
 let sellerData=[];
 if(KBCloud.cloudReady()){try{sellerData=await KBCloud.cloudGetSellers()}catch(e){}}
 else sellerData=JSON.parse(localStorage.getItem("kb_sellers")||"[]");
 const sellerMap={};sellerData.forEach(s=>sellerMap[String(s.number)]=s);
 $("sellerRows").innerHTML=Object.entries(bySeller).sort((a,b)=>a[0].localeCompare(b[0],"de-DE")).map(([n,x])=>{const name=sellerMap[n]?.name||"Verkäufer "+n;return `<div class="seller-row"><div class="seller-name">${esc(name)}<div class="muted">Nr. ${esc(n)} · ${x.count} ${x.count===1?"Teil":"Teile"}</div></div><div><div class="muted">Umsatz</div><strong>${euro(x.gross)}</strong></div><div><div class="muted">Provision</div><strong>${euro(x.commission)}</strong></div><div><div class="muted">Auszahlung</div><strong>${euro(x.payout)}</strong></div><div class="seller-pdf-cell"><button type="button" class="seller-pdf-button" data-seller-number="${esc(n)}">PDF</button></div></div>`}).join("")||'<div class="seller-empty">Noch keine Verkäufe.</div>';
 document.querySelectorAll(".seller-pdf-button").forEach(btn=>btn.addEventListener("click",()=>saveSellerPdfByNumber(btn.dataset.sellerNumber, allReceipts, sellerData)));

 const regs={};
 allReceipts.forEach(r=>{
   const k=r.register_id||r.registerId||"Kasse 1";
   if(!regs[k])regs[k]={receipts:0,items:0,total:0,cash:0,card:0,paypal:0};
   const its=itemsOf(r);
   regs[k].receipts++;
   regs[k].items+=its.length;
   const receiptTotal=Number(r.total);
   const total=Number.isFinite(receiptTotal)&&receiptTotal>0?receiptTotal:its.reduce((a,x)=>a+priceOf(x),0);
   regs[k].total+=total;
   const pay=r.payment||"";
   if(pay==="Bar")regs[k].cash+=total;
   if(pay==="EC")regs[k].card+=total;
   if(pay==="PayPal")regs[k].paypal+=total;
 });
 $("registerRows").innerHTML=Object.entries(regs).sort((a,b)=>a[0].localeCompare(b[0],"de-DE",{numeric:true})).map(([k,x])=>`<div class="seller-row"><div class="seller-name"><strong>${esc(k)}</strong><div class="muted">${x.receipts} Bons · ${x.items} Artikel</div></div><div><div class="muted">Umsatz</div><strong>${euro(x.total)}</strong></div><div><div class="muted">Bar / EC</div><strong>${euro(x.cash)} / ${euro(x.card)}</strong></div><div><div class="muted">PayPal</div><strong>${euro(x.paypal)}</strong></div></div>`).join("")||'<div class="seller-empty">Noch keine Kassenbons.</div>';

 $("receiptRows").innerHTML=receipts.map(r=>{
   const its=itemsOf(r), receiptTotal=Number(r.total), totalR=Number.isFinite(receiptTotal)&&receiptTotal>0?receiptTotal:its.reduce((a,x)=>a+priceOf(x),0);
   const d=new Date(r.created_at);
   return `<details class="receipt-details"><summary><strong>Bon ${esc(r.receipt_no??r.id)}</strong> · ${esc(r.register_id||r.registerId||"Kasse 1")} · ${isNaN(d.getTime())?"":d.toLocaleString("de-DE")} · ${esc(r.payment||"")} · <b>${euro(totalR)}</b></summary><div style="padding:10px 14px">${its.length?its.map(x=>`<div class="receipt-line-meta">Verkäufer ${esc(x.seller_number??x.sellerNumber??"")} · ${esc(x.size??"")} · ${euro(priceOf(x))}</div>`).join(""):"<div class=\"receipt-line-meta\">Keine Einzelpositionen gespeichert.</div>"}</div></details>`;
 }).join("")||'<div class="seller-empty">Noch keine Kassenbons.</div>';
 const d=new Date();$("dateText").textContent=d.toLocaleDateString("de-DE",{weekday:"long",day:"2-digit",month:"2-digit",year:"numeric"});
}

async function resetSales(){
 const question=selectedRegister==="Alle Kassen"
   ? "Sollen wirklich ALLE gespeicherten Verkäufe und Kassenbons gelöscht werden? Die Verkäufer bleiben erhalten. Dieser Vorgang kann nicht rückgängig gemacht werden."
   : `Sollen die Verkäufe von ${selectedRegister} wirklich gelöscht werden? Die anderen Kassen bleiben erhalten. Dieser Vorgang kann nicht rückgängig gemacht werden.`;
 if(!confirm(question))return;
 try{
   if(KBCloud.cloudReady()){
     if(selectedRegister==="Alle Kassen"){
       await KBCloud.cloudResetReceipts();
     }else{
       await KBCloud.cloudResetReceiptsForRegister(selectedRegister);
     }
   }else{
     if(selectedRegister==="Alle Kassen"){
       localStorage.removeItem("kb_sales");
     }else{
       const sales=JSON.parse(localStorage.getItem("kb_sales")||"[]").filter(x=>(x.registerId||"Kasse 1")!==selectedRegister);
       localStorage.setItem("kb_sales",JSON.stringify(sales));
     }
   }
   alert(selectedRegister==="Alle Kassen"?"Alle Verkaufszahlen wurden zurückgesetzt.":`Die Verkaufszahlen von ${selectedRegister} wurden zurückgesetzt.`);
   await render();
 }catch(e){console.error(e);alert("Die Verkaufszahlen konnten nicht zurückgesetzt werden. Bitte Internetverbindung prüfen.")}
}


function safeFilePart(value){
  return String(value||"").trim()
    .replace(/ä/g,"ae").replace(/ö/g,"oe").replace(/ü/g,"ue")
    .replace(/Ä/g,"Ae").replace(/Ö/g,"Oe").replace(/Ü/g,"Ue")
    .replace(/ß/g,"ss").replace(/[^a-zA-Z0-9_-]+/g,"_")
    .replace(/^_+|_+$/g,"") || "Verkaeufer";
}
function dateStamp(){
  const d=new Date();
  return `${String(d.getDate()).padStart(2,"0")}-${String(d.getMonth()+1).padStart(2,"0")}-${d.getFullYear()}`;
}
function sellerPdfData(sellerNumber, receipts, sellers){
  const seller= sellers.find(s=>String(s.number)===String(sellerNumber)) || {number:String(sellerNumber),name:"Verkäufer "+sellerNumber};
  const rows=[];
  receipts.forEach(r=>{
    const pay=r.payment||"";
    (r.receipt_items||[]).forEach(i=>{
      const n=i.seller_number??i.sellerNumber??"";
      if(String(n)!==String(sellerNumber)) return;
      rows.push({
        price:priceOf(i),
        size:String(i.size||""),
        payment:pay,
        register:r.register_id||r.registerId||"Kasse 1",
        created:r.created_at,
        commission:rateOf(i)
      });
    });
  });
  const gross=rows.reduce((a,x)=>a+x.price,0);
  const commission=rows.reduce((a,x)=>a+x.price*x.commission,0);
  const payout=gross-commission;
  const payments={Bar:0,EC:0,PayPal:0};
  rows.forEach(x=>{if(payments[x.payment]!==undefined)payments[x.payment]+=x.price});
  const sizes={};
  rows.forEach(x=>{const key=x.size||"Ohne Größe";sizes[key]=(sizes[key]||0)+1});
  const registers={};
  rows.forEach(x=>{registers[x.register]=(registers[x.register]||0)+x.price});
  return {seller,rows,gross,commission,payout,payments,sizes,registers};
}
async function saveBlob(blob,filename){
  const isPdf=blob.type==="application/pdf" || /\.pdf$/i.test(filename);
  // Bei einer einzelnen PDF öffnen wir direkt die echte PDF-Datei. So legt iPadOS
  // beim "Sichern unter" nur die PDF ab und keine zusätzliche Text/Webseiten-Datei.
  if(isPdf){
    try{
      const url=URL.createObjectURL(blob);
      const a=document.createElement("a");
      a.href=url;
      a.target="_blank";
      a.rel="noopener";
      document.body.appendChild(a);
      a.click();
      setTimeout(()=>{a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000)},1000);
      return true;
    }catch(e){ console.warn("PDF-Ansicht konnte nicht geöffnet werden",e); }
  }

  // Für die ZIP-Datei bleibt der iPad-Teilen-Dialog praktisch, weil sie direkt in
  // "Dateien" gespeichert werden kann.
  try{
    const file=new File([blob],filename,{type:blob.type||"application/octet-stream"});
    if(navigator.share && (!navigator.canShare || navigator.canShare({files:[file]}))){
      await navigator.share({files:[file],title:filename});
      return true;
    }
  }catch(e){
    if(e && e.name==="AbortError") return false;
    console.warn("Datei teilen nicht möglich",e);
  }
  try{
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=url;a.download=filename;a.rel="noopener";
    document.body.appendChild(a);a.click();
    setTimeout(()=>{URL.revokeObjectURL(url);a.remove()},3000);
    return true;
  }catch(e){
    console.error("Datei speichern fehlgeschlagen",e);
    try{window.open(URL.createObjectURL(blob),"_blank");return true}catch(_){return false}
  }
}
function pdfWinAnsi(value){
  const map={"€":128,"‚":130,"ƒ":131,"„":132,"…":133,"†":134,"‡":135,"ˆ":136,"‰":137,"Š":138,"‹":139,"Œ":140,"Ž":142,"‘":145,"’":146,"“":147,"”":148,"•":149,"–":150,"—":151,"˜":152,"™":153,"š":154,"›":155,"œ":156,"ž":158,"Ÿ":159,"Ä":196,"Ö":214,"Ü":220,"ä":228,"ö":246,"ü":252,"ß":223};
  let out="";
  for(const ch of String(value??"")){
    const c=ch.charCodeAt(0);
    if(c<128) out+=String.fromCharCode(c);
    else if(map[ch]!=null) out+=String.fromCharCode(map[ch]);
    else out+="?";
  }
  return out;
}
function pdfEscape(value){
  return pdfWinAnsi(value).replace(/\\/g,"\\\\").replace(/\(/g,"\\(").replace(/\)/g,"\\)");
}
function bytesFromBinaryString(str){
  const out=new Uint8Array(str.length);
  for(let i=0;i<str.length;i++) out[i]=str.charCodeAt(i)&255;
  return out;
}

function sellerMoneyHtml(v){
  const n=Number(v||0);
  const number=n.toLocaleString("de-DE",{minimumFractionDigits:2,maximumFractionDigits:2});
  return `${number} &euro;`;
}
function sellerPrintHtml(data){
  const escHtml=s=>String(s??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  const rows=Object.entries(data.sizes||{}).sort((a,b)=>a[0].localeCompare(b[0],"de-DE",{numeric:true}));
  const articles=rows.length
    ? rows.map(([k,v])=>`<tr><td>${escHtml(k)}</td><td>${v} ${v===1?"Teil":"Teile"}</td></tr>`).join("")
    : `<tr><td colspan="2">Keine Artikel</td></tr>`;
  const provision=data.commission>0 ? `<div class="row"><span>Provision</span><strong>− ${sellerMoneyHtml(data.commission)}</strong></div>` : "";
  return `<!doctype html>
<html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Verkäufer_${escHtml(data.seller.number)}_${escHtml(data.seller.name)}</title>
<style>
@page{size:A4 portrait;margin:0}
*{box-sizing:border-box}
body{margin:0;background:#fff;color:#172033;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif}
.page{width:210mm;min-height:297mm;padding:18mm 18mm 16mm;margin:0 auto}
.header{background:#3159d8;color:#fff;border-radius:6mm;padding:8mm 10mm 7mm;margin-bottom:9mm}
.brand{font-size:24px;font-weight:800;letter-spacing:.1px}.subtitle{font-size:13px;margin-top:2mm;opacity:.94}
.info{display:flex;justify-content:space-between;gap:10mm;margin-bottom:9mm}
.label{font-size:10px;color:#687386}.name{font-size:20px;font-weight:800;margin-top:1mm}.meta{font-size:11px;color:#4f5b6c;margin-top:2mm}
.card{border:1px solid #dfe4ec;border-radius:4mm;padding:6mm 8mm;margin-bottom:6mm}
h2{font-size:12px;letter-spacing:.8px;margin:0 0 5mm;color:#344054}
.row{display:flex;justify-content:space-between;align-items:center;padding:3mm 0;border-bottom:1px solid #edf0f4;font-size:12px}
.row:last-child{border-bottom:0}.row strong{font-size:13px}
.payout{background:#eaf7ef;border:0;padding:4.5mm 8mm}.payout span,.payout strong{color:#087443}.payout strong{font-size:19px}
table{width:100%;border-collapse:collapse;font-size:12px}
th{text-align:left;font-size:10px;color:#687386;padding:0 0 3mm;border-bottom:1px solid #cfd5df}
td{padding:4mm 0;border-bottom:1px solid #edf0f4}td:last-child{text-align:right;font-weight:700}
.footer{margin-top:16mm;font-size:9px;color:#7a8494;text-align:center}
.printbar{position:sticky;top:0;background:#fff;padding:12px;text-align:center;border-bottom:1px solid #ddd}
.printbar button{font-size:18px;padding:12px 22px;border:0;border-radius:12px;background:#3159d8;color:#fff;font-weight:700}
@media print{.printbar{display:none}.page{margin:0}}
</style></head>
<body>
<div class="printbar"><button onclick="window.print()">PDF / Drucken</button></div>
<div class="page">
  <div class="header"><div class="brand">Kleiderbörse</div><div class="subtitle">Verkäufer-Abrechnung</div></div>
  <div class="info">
    <div><div class="label">Verkäufer</div><div class="name">${escHtml(data.seller.name||"Verkäufer")}</div><div class="meta">Verkäufernummer: ${escHtml(data.seller.number)}</div></div>
    <div style="text-align:right"><div class="label">Datum</div><div class="meta" style="font-size:12px">${escHtml(dateStamp())}</div></div>
  </div>
  <div class="card">
    <h2>ÜBERSICHT</h2>
    <div class="row"><span>Verkaufte Teile</span><strong>${data.rows.length}</strong></div>
    <div class="row"><span>Gesamtumsatz</span><strong>${sellerMoneyHtml(data.gross)}</strong></div>
    ${provision}
  </div>
  <div class="card payout"><div class="row"><span><strong>AUSZAHLUNG</strong></span><strong>${sellerMoneyHtml(data.payout)}</strong></div></div>
  <div class="card">
    <h2>VERKAUFTE ARTIKEL</h2>
    <table><thead><tr><th>Größe / Kategorie</th><th>Anzahl</th></tr></thead><tbody>${articles}</tbody></table>
  </div>
  <div class="footer">Kleiderbörse · Verkäufer-Abrechnung</div>
</div>
</body></html>`;
}
async function saveSellerPdfByNumber(number, receipts, sellers){
  try{
    const data=sellerPdfData(number,receipts,sellers);
    const title=`Verkäufer_${safeFilePart(data.seller.number)}_${String(data.seller.name||"Verkäufer").trim().replace(/[\\/:*?"<>|]/g,"_")}_${dateStamp()}`;
    const html=sellerPrintHtml(data);
    const win=window.open("about:blank","_blank");
    if(!win){ alert("Das PDF-Fenster konnte nicht geöffnet werden. Bitte Pop-ups für diese Seite erlauben."); return; }
    win.document.open(); win.document.write(html); win.document.close();
    win.document.title=title;
    setTimeout(()=>{try{win.focus();win.print()}catch(e){}},500);
  }catch(e){console.error(e);alert("Die Verkäufer-Abrechnung konnte nicht geöffnet werden.")}
}
function pdfText(x,y,size,text,bold=false){
  return `BT /${bold?"F2":"F1"} ${size} Tf ${x} ${y} Td (${pdfEscape(text)}) Tj ET`;
}
function pdfRect(x,y,w,h,fill){
  return `${fill?"0.91 0.95 1 rg":"0.85 0.88 0.93 RG 0.7 w"} ${x} ${y} ${w} ${h} ${fill?"f":"S"}`;
}
function pdfRoundRect(x,y,w,h,r,fill,stroke=true){
  const k=0.5522848, c=r*k;
  let out=`${fill?"0.91 0.95 1 rg":""}${stroke&&!fill?"0.86 0.88 0.92 RG 0.8 w":""}`;
  out+=`${x+r} ${y} m ${x+w-r} ${y} l ${x+w-c} ${y} ${x+w} ${y+r-c} ${x+w} ${y+r} c `;
  out+=`${x+w} ${y+h-r} l ${x+w} ${y+h-c} ${x+w-c} ${y+h} ${x+w-r} ${y+h} c `;
  out+=`${x+r} ${y+h} l ${x+c} ${y+h} ${x} ${y+h-c} ${x} ${y+h-r} c `;
  out+=`${x} ${y+r} l ${x} ${y+c} ${x+c} ${y} ${x+r} ${y} c `;
  out+=fill?"f":"S";
  return out;
}
function makeSellerPdf(data){
  // Diese PDF folgt bewusst dem gleichen A4-Aufbau wie die Einzelabrechnung
  // (die Ansicht hinter dem einzelnen "PDF"-Button): blauer Kopf, Infozeile,
  // Übersicht, grüne Auszahlung und Artikeltabelle.
  const W=595.28,H=841.89;
  const x=51, w=493, right=x+w;
  const c=[];
  const rows=Object.entries(data.sizes||{}).sort((a,b)=>a[0].localeCompare(b[0],"de-DE",{numeric:true}));

  // Header: 18 mm Seitenrand, 6 mm Radius, 8/7 mm Innenabstand.
  c.push(pdfRoundRect(x,694,w,96,17,false,false));
  c.push("0.19 0.35 0.85 rg 51 694 493 96 re f");
  c.push(pdfText(75,750,24,"Kleiderbörse",true));
  c.push(pdfText(75,727,13,"Verkäufer-Abrechnung",false));

  // Verkäufer / Datum
  c.push(pdfText(x,666,8,"Verkäufer",false));
  c.push(pdfText(x,642,20,String(data.seller.name||"Verkäufer"),true));
  c.push(pdfText(x,621,11,`Verkäufernummer: ${data.seller.number}`));
  c.push(pdfText(506,666,8,"Datum",false));
  c.push(pdfText(506,645,11,dateStamp(),false));

  // Übersichtskarte
  c.push(pdfRoundRect(x,485,w,118,12,false,true));
  c.push(pdfText(69,570,12,"ÜBERSICHT",true));
  c.push(pdfText(69,541,12,"Verkaufte Teile"));
  c.push(pdfText(514,541,13,String(data.rows.length),true));
  c.push("0.93 0.94 0.96 RG 69 529 m 526 529 l S");
  c.push(pdfText(69,510,12,"Gesamtumsatz"));
  c.push(pdfText(454,510,13,sellerMoneyPlain(data.gross),true));
  if(data.commission>0){
    c.push("0.93 0.94 0.96 RG 69 498 m 526 498 l S");
    c.push(pdfText(69,479,12,"Provision"));
    c.push(pdfText(449,479,13,"- "+sellerMoneyPlain(data.commission),true));
  }

  // Auszahlungskarte
  c.push(pdfRoundRect(x,412,w,55,12,true,false));
  c.push("0.91 0.97 0.93 rg 51 412 493 55 re f");
  c.push(pdfText(69,433,15,"AUSZAHLUNG",true));
  c.push(pdfText(465,431,19,sellerMoneyPlain(data.payout),true));

  // Artikelkarte. Höhe wächst bei vielen Kategorien, bleibt aber auf einer A4-Seite.
  const cardH=Math.max(145, Math.min(250, 92 + rows.length*24));
  const cardY=412-18-cardH;
  c.push(pdfRoundRect(x,cardY,w,cardH,12,false,true));
  c.push(pdfText(69,cardY+cardH-30,12,"VERKAUFTE ARTIKEL",true));
  c.push(pdfText(69,cardY+cardH-58,10,"Größe / Kategorie",true));
  c.push(pdfText(526,cardY+cardH-58,10,"Anzahl",true));
  c.push("0.80 0.83 0.88 RG 69 "+(cardY+cardH-68)+" m 526 "+(cardY+cardH-68)+" l S");
  let y=cardY+cardH-91;
  if(rows.length){
    for(const [k,v] of rows){
      if(y<cardY+22) break;
      c.push(pdfText(69,y,11,k));
      c.push(pdfText(470,y,11,`${v} ${v===1?"Teil":"Teile"}`,true));
      y-=24;
    }
  }else{
    c.push(pdfText(69,y,11,"Keine Artikel"));
  }

  c.push(pdfText(51,57,9,"Kleiderbörse · Verkäufer-Abrechnung"));

  const content=c.join("\n");
  const objects=[];
  objects.push("<< /Type /Catalog /Pages 2 0 R >>");
  objects.push("<< /Type /Pages /Kids [3 0 R] /Count 1 >>");
  objects.push("<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>");
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>");
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>");
  const stream=content+"\n";
  objects.push(`<< /Length ${stream.length} >>\nstream\n${stream}endstream`);
  let pdf="%PDF-1.4\n%\xE2\xE3\xCF\xD3\n";
  const offsets=[0];
  for(let i=0;i<objects.length;i++){
    offsets.push(pdf.length);
    pdf+=`${i+1} 0 obj\n${objects[i]}\nendobj\n`;
  }
  const xref=pdf.length;
  pdf+=`xref\n0 ${objects.length+1}\n0000000000 65535 f \n`;
  for(let i=1;i<offsets.length;i++) pdf+=String(offsets[i]).padStart(10,"0")+" 00000 n \n";
  pdf+=`trailer\n<< /Size ${objects.length+1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new Blob([bytesFromBinaryString(pdf)],{type:"application/pdf"});
}
function sellerMoneyPlain(v){
  return Number(v||0).toLocaleString("de-DE",{minimumFractionDigits:2,maximumFractionDigits:2})+" €";
}
function cleanPdfFilename(name,number){
  return `${String(name||"Verkäufer").trim().replace(/[\\/:*?"<>|]/g,"_")} - Vk-Nr. ${String(number)}.pdf`;
}
async function saveAllSellerPdfs(){
  const button=$("saveAllSellerPdf");
  if(button)button.disabled=true;
  try{
    const receipts=await loadData();
    let sellers=[];
    if(KBCloud.cloudReady()) sellers=await KBCloud.cloudGetSellers();
    else sellers=JSON.parse(localStorage.getItem("kb_sellers")||"[]");
    if(!sellers.length){alert("Es sind keine Verkäufer vorhanden.");return}
    sellers.sort((a,b)=>String(a.name||"").localeCompare(String(b.name||""),"de-DE"));
    const folder="Verkäufer-Abrechnungen";
    const entries=[{name:folder+"/",data:new Uint8Array()}];
    for(const seller of sellers){
      const data=sellerPdfData(seller.number,receipts,sellers);
      const pdf=makeSellerPdf(data);
      entries.push({name:`${folder}/${cleanPdfFilename(data.seller.name,data.seller.number)}`,data:new Uint8Array(await pdf.arrayBuffer())});
    }
    const zip=makeZip(entries);
    await saveBlob(zip,"Verkäufer-Abrechnungen.zip");
  }catch(e){
    console.error(e);
    alert("Die ZIP-Datei mit den Verkäufer-PDFs konnte nicht erstellt werden.");
  }finally{if(button)button.disabled=false}
}

function crc32(bytes){
  let table=crc32.table;
  if(!table){table=[];for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=(c&1)?(0xEDB88320^(c>>>1)):(c>>>1);table[n]=c>>>0;}crc32.table=table;}
  let c=0xFFFFFFFF;for(const b of bytes)c=table[(c^b)&255]^(c>>>8);return (c^0xFFFFFFFF)>>>0;
}
function u16(v){return new Uint8Array([v&255,(v>>>8)&255]);}
function u32(v){return new Uint8Array([v&255,(v>>>8)&255,(v>>>16)&255,(v>>>24)&255]);}
function concatBytes(parts){let len=parts.reduce((n,p)=>n+p.length,0),out=new Uint8Array(len),o=0;for(const p of parts){out.set(p,o);o+=p.length;}return out;}
function makeZip(entries){
  const enc=new TextEncoder(), locals=[], centrals=[];let offset=0;
    for(const entry of entries){
    const name=enc.encode(entry.name), data=new Uint8Array(entry.data||[]), crc=crc32(data);
    const local=concatBytes([new Uint8Array([80,75,3,4,20,0,0x00,0x08,0,0,0,0,0,0]),u32(crc),u32(data.length),u32(data.length),u16(name.length),u16(0),name,data]);
    locals.push(local);
    const central=concatBytes([new Uint8Array([80,75,1,2,20,0,20,0,0x00,0x08,0,0,0,0,0,0]),u32(crc),u32(data.length),u32(data.length),u16(name.length),u16(0),u16(0),u16(0),u16(0),u32(0),u32(offset),name]);
    centrals.push(central);offset+=local.length;
  }
  const body=concatBytes(locals), cd=concatBytes(centrals);
  const end=new Uint8Array([80,75,5,6,0,0,0,0,(entries.length&255),(entries.length>>>8)&255,(entries.length&255),(entries.length>>>8)&255,cd.length&255,(cd.length>>>8)&255,(cd.length>>>16)&255,(cd.length>>>24)&255,body.length&255,(body.length>>>8)&255,(body.length>>>16)&255,(body.length>>>24)&255,0,0]);
  return new Blob([body,cd,end],{type:"application/zip"});
}

$("refreshButton").addEventListener("click",render);
$("saveAllSellerPdf").addEventListener("click",saveAllSellerPdfs);
$("resetSalesButton").addEventListener("click",resetSales);
document.querySelectorAll(".register-filter-button").forEach(btn=>btn.addEventListener("click",()=>{
 selectedRegister=btn.dataset.register;
 document.querySelectorAll(".register-filter-button").forEach(b=>b.classList.toggle("selected",b===btn));
 render();
}));
KBCloud.cloudBanner();render();
