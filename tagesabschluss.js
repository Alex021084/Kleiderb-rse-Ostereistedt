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
function makeSimplePdf(lines){
  const content=["BT"];
  let y=800;
  for(const line of lines){
    const size=line.size||11;
    content.push(`/F1 ${size} Tf`);
    content.push(`1 0 0 1 52 ${y} Tm`);
    content.push(`(${pdfEscape(line.text)}) Tj`);
    y-=line.gap||18;
  }
  content.push("ET");
  const stream=content.join("\n");
  const objects=[];
  objects.push("<< /Type /Catalog /Pages 2 0 R >>");
  objects.push("<< /Type /Pages /Kids [3 0 R] /Count 1 >>");
  objects.push("<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>");
  objects.push(`<< /Length ${bytesFromBinaryString(stream).length} >>\nstream\n${stream}\nendstream`);
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>");
  let pdf="%PDF-1.4\n%\xE2\xE3\xCF\xD3\n";
  const offsets=[0];
  for(let i=0;i<objects.length;i++){
    offsets.push(bytesFromBinaryString(pdf).length);
    pdf+=`${i+1} 0 obj\n${objects[i]}\nendobj\n`;
  }
  const xref=bytesFromBinaryString(pdf).length;
  pdf+=`xref\n0 ${objects.length+1}\n0000000000 65535 f \n`;
  for(let i=1;i<offsets.length;i++) pdf+=String(offsets[i]).padStart(10,"0")+" 00000 n \n";
  pdf+=`trailer\n<< /Size ${objects.length+1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new Blob([bytesFromBinaryString(pdf)],{type:"application/pdf"});
}
function makeSellerPdf(data){
  const lines=[];
  const add=(text,size=11,gap=18)=>lines.push({text,size,gap});
  add("Verkaeufer-Abrechnung",22,30);
  add(data.seller.name||"Verkaeufer",15,22);
  add(`Verkaeufernummer: ${data.seller.number}`,11,18);
  add(`Abrechnung: ${dateStamp()}`,11,28);
  add("Zusammenfassung",14,22);
  add(`Verkaufte Artikel: ${data.rows.length}`,11,18);
  add(`Gesamtumsatz: ${euro(data.gross)}`,11,18);
  add(`Provision: ${euro(data.commission)}`,11,18);
  add(`Auszahlung: ${euro(data.payout)}`,13,26);
  add("Zahlungsarten",14,22);
  add(`Bar: ${euro(data.payments.Bar)}`,11,18);
  add(`EC: ${euro(data.payments.EC)}`,11,18);
  add(`PayPal: ${euro(data.payments.PayPal)}`,11,26);
  add("Verkaufte Artikel nach Groesse / Kategorie",14,22);
  const sizeEntries=Object.entries(data.sizes).sort((a,b)=>a[0].localeCompare(b[0],"de-DE",{numeric:true}));
  if(sizeEntries.length) sizeEntries.forEach(([k,v])=>add(`${k}: ${v} ${v===1?"Artikel":"Artikel"}`,10.5,16));
  else add("Keine Artikel",10.5,16);
  add("Umsatz nach Kasse",14,22);
  const regEntries=Object.entries(data.registers).sort((a,b)=>a[0].localeCompare(b[0],"de-DE",{numeric:true}));
  if(regEntries.length) regEntries.forEach(([k,v])=>add(`${k}: ${euro(v)}`,10.5,16));
  else add("Keine Verkaeufe",10.5,16);
  add("Provision basiert auf dem beim Verkauf gespeicherten Provisionssatz.",8.5,12);
  return makeSimplePdf(lines);
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
    const name=enc.encode(entry.name), data=new Uint8Array(entry.data), crc=crc32(data);
    const local=concatBytes([new Uint8Array([80,75,3,4,20,0,0,0,0,0,0,0,0,0]),u32(crc),u32(data.length),u32(data.length),u16(name.length),u16(0),name,data]);
    locals.push(local);
    const central=concatBytes([new Uint8Array([80,75,1,2,20,0,20,0,0,0,0,0,0,0]),u32(crc),u32(data.length),u32(data.length),u16(name.length),u16(0),u16(0),u16(0),u16(0),u32(0),u32(offset),name]);
    centrals.push(central);offset+=local.length;
  }
  const body=concatBytes(locals), cd=concatBytes(centrals);
  const end=new Uint8Array([80,75,5,6,0,0,0,0,(entries.length&255),(entries.length>>>8)&255,(entries.length&255),(entries.length>>>8)&255,cd.length&255,(cd.length>>>8)&255,(cd.length>>>16)&255,(cd.length>>>24)&255,body.length&255,(body.length>>>8)&255,(body.length>>>16)&255,(body.length>>>24)&255,0,0]);
  return new Blob([body,cd,end],{type:"application/zip"});
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
    const zipEntries=[];
    sellers.sort((a,b)=>String(a.name||"").localeCompare(String(b.name||""),"de-DE"));
    for(const s of sellers){
      const data=sellerPdfData(s.number,receipts,sellers);
      const filename=`Verkaeufer_${safeFilePart(data.seller.number)}_${safeFilePart(data.seller.name)}_${dateStamp()}.pdf`;
      zipEntries.push({name:filename,data:new Uint8Array(await makeSellerPdf(data).arrayBuffer())});
    }
    const blob=makeZip(zipEntries);
    saveBlob(blob,`Verkaeufer-Abrechnungen_${dateStamp()}.zip`);
  }catch(e){
    console.error(e);
    alert("Die Verkäufer-PDFs konnten nicht erstellt werden. Bitte die Seite einmal neu laden und erneut versuchen.");
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
