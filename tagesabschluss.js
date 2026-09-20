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
function saveBlob(blob,filename){
  const a=document.createElement("a");
  a.href=URL.createObjectURL(blob);a.download=filename;document.body.appendChild(a);a.click();
  setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1500);
}
function makeSellerPdf(data){
  const {jsPDF}=window.jspdf;
  const doc=new jsPDF({unit:"mm",format:"a4"});
  const margin=18;
  let y=18;
  doc.setFont("helvetica","bold");doc.setFontSize(22);doc.text("Verkäufer-Abrechnung",margin,y);y+=10;
  doc.setFontSize(14);doc.text(data.seller.name||"Verkäufer",margin,y);y+=7;
  doc.setFont("helvetica","normal");doc.setFontSize(11);
  doc.text(`Verkäufernummer: ${data.seller.number}`,margin,y);y+=6;
  doc.text(`Abrechnung: ${dateStamp()}`,margin,y);y+=10;

  doc.setFillColor(242,244,248);doc.roundedRect(margin,y,174,43,4,4,"F");
  doc.setFont("helvetica","bold");doc.setFontSize(12);doc.text("Zusammenfassung",margin+6,y+8);
  doc.setFont("helvetica","normal");doc.setFontSize(11);
  doc.text("Verkaufte Artikel",margin+6,y+17);doc.text(String(data.rows.length),margin+150,y+17,{align:"right"});
  doc.text("Gesamtumsatz",margin+6,y+25);doc.text(euro(data.gross),margin+150,y+25,{align:"right"});
  doc.text("Provision",margin+6,y+33);doc.text(euro(data.commission),margin+150,y+33,{align:"right"});
  doc.setFont("helvetica","bold");doc.text("Auszahlung",margin+6,y+41);doc.text(euro(data.payout),margin+150,y+41,{align:"right"});
  y+=53;

  doc.setFontSize(13);doc.text("Zahlungsarten",margin,y);y+=7;doc.setFont("helvetica","normal");doc.setFontSize(10.5);
  [["Bar",data.payments.Bar],["EC",data.payments.EC],["PayPal",data.payments.PayPal]].forEach(([k,v])=>{doc.text(k,margin,y);doc.text(euro(v),margin+70,y,{align:"right"});y+=6});
  y+=3;

  doc.setFont("helvetica","bold");doc.setFontSize(13);doc.text("Verkaufte Artikel nach Größe / Kategorie",margin,y);y+=7;
  doc.setFont("helvetica","normal");doc.setFontSize(10.5);
  Object.entries(data.sizes).sort((a,b)=>a[0].localeCompare(b[0],"de-DE",{numeric:true})).forEach(([k,v])=>{if(y>270){doc.addPage();y=20}doc.text(k,margin,y);doc.text(`${v} ${v===1?"Artikel":"Artikel"}`,margin+70,y,{align:"right"});y+=6});
  y+=4;
  doc.setFont("helvetica","bold");doc.setFontSize(13);doc.text("Umsatz nach Kasse",margin,y);y+=7;
  doc.setFont("helvetica","normal");doc.setFontSize(10.5);
  Object.entries(data.registers).sort((a,b)=>a[0].localeCompare(b[0],"de-DE",{numeric:true})).forEach(([k,v])=>{if(y>270){doc.addPage();y=20}doc.text(k,margin,y);doc.text(euro(v),margin+70,y,{align:"right"});y+=6});
  y+=5;
  doc.setFontSize(8.5);doc.setTextColor(100);
  doc.text("Die Provision basiert auf dem beim jeweiligen Verkauf gespeicherten Provisionssatz.",margin,y);
  return doc.output("blob");
}
async function saveSellerPdfByNumber(number, receipts, sellers){
  try{
    const data=sellerPdfData(number,receipts,sellers);
    const filename=`Verkaeufer_${safeFilePart(data.seller.number)}_${safeFilePart(data.seller.name)}_${dateStamp()}.pdf`;
    saveBlob(makeSellerPdf(data),filename);
  }catch(e){console.error(e);alert("Die Verkäufer-PDF konnte nicht erstellt werden.")}
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
    if(!window.jspdf?.jsPDF || !window.JSZip) throw new Error("PDF-Bibliotheken konnten nicht geladen werden.");
    const zip=new JSZip();
    sellers.sort((a,b)=>String(a.name||"").localeCompare(String(b.name||""),"de-DE"));
    sellers.forEach(s=>{
      const data=sellerPdfData(s.number,receipts,sellers);
      const filename=`Verkaeufer_${safeFilePart(data.seller.number)}_${safeFilePart(data.seller.name)}_${dateStamp()}.pdf`;
      zip.file(filename,makeSellerPdf(data));
    });
    const blob=await zip.generateAsync({type:"blob"});
    saveBlob(blob,`Verkaeufer-Abrechnungen_${dateStamp()}.zip`);
  }catch(e){
    console.error(e);
    alert("Die PDFs konnten nicht erstellt werden. Bitte kurz prüfen, ob eine Internetverbindung besteht und die Seite neu geladen wurde.");
  }finally{if(button)button.disabled=false}
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
