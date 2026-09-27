const $=id=>document.getElementById(id);
const KEY="kb_archives";
const FORMAT="kleiderboerse-archiv";
const VERSION=1;
let archives=[];
let archiveSource="cloud";
function euro(v){return Number(v||0).toLocaleString("de-DE",{style:"currency",currency:"EUR"})}
function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[c]))}
function loadLocalArchives(){try{return JSON.parse(localStorage.getItem(KEY)||"[]")}catch(e){return []}}
function saveLocalArchives(a){localStorage.setItem(KEY,JSON.stringify(a))}
function normalizeArchive(a){
  if(!a)return null;
  // Supabase liefert bei der Archivliste eine Zeile mit Metadaten plus
  // dem eigentlichen Snapshot im Feld "snapshot". Für die Anzeige
  // müssen die Snapshot-Daten mit den Metadaten zusammengeführt werden.
  const snap=(a.snapshot&&typeof a.snapshot==="object")?a.snapshot:{};
  const x=Object.assign({},snap,a);
  // Die DB-Metadaten dürfen die eigentlichen Snapshot-Daten nicht mit
  // einem leeren/fehlenden Wert überschreiben.
  if(!snap.sellers && a.sellers) x.sellers=a.sellers;
  if(!snap.receipts && a.receipts) x.receipts=a.receipts;
  if(!snap.sales && a.sales) x.sales=a.sales;
  if(!snap.sellerExtras && a.sellerExtras) x.sellerExtras=a.sellerExtras;
  return {...x,id:String(snap.id||a.id||crypto.randomUUID?.()||Date.now()),name:String(snap.name||a.name||"Börse"),savedAt:snap.savedAt||a.saved_at||a.savedAt||new Date().toISOString(),mode:snap.mode||"cloud",version:snap.version||"65"};
}
async function currentSnapshot(){
  let sellers=[],sales=[],receipts=null,mode="lokal";
  if(window.KBCloud&&KBCloud.cloudReady()){
    mode="cloud"; sellers=await KBCloud.cloudGetSellers(); receipts=await KBCloud.cloudGetReceipts();
  }else{
    sellers=JSON.parse(localStorage.getItem("kb_sellers")||"[]"); sales=JSON.parse(localStorage.getItem("kb_sales")||"[]");
  }
  let sellerExtras={};
  try{sellerExtras=JSON.parse(localStorage.getItem("kb_seller_extras")||"{}")}catch(e){}
  return {mode,sellers,sales,receipts,sellerExtras,register:localStorage.getItem("kb_register")||"Kasse 1",savedAt:new Date().toISOString(),version:"65"};
}
function salesFromSnapshot(a){
  if(a.mode!=="cloud")return a.sales||[];
  const out=[];(a.receipts||[]).forEach(r=>(r.receipt_items||[]).forEach(i=>out.push({receiptId:r.id,payment:r.payment,timestamp:r.created_at,registerId:r.register_id,sellerNumber:i.seller_number||"",unassignedNote:i.unassigned_note||"",unassignedPhoto:i.unassigned_photo||"",size:i.size,price:Number(i.price||0),commissionEnabled:i.commission_enabled===true,commissionRate:Number(i.commission_rate||0)})));return out;
}
function totals(a){const s=salesFromSnapshot(a);return {total:s.reduce((n,x)=>n+Number(x.price||0),0),items:s.length,sellers:(a.sellers||[]).length}}
function sourceLabel(){return archiveSource==="cloud"?"☁️ Cloud-Archiv":"📱 Lokales Archiv"}
function render(){
  const list=$("archiveList");
  if(!archives.length){list.innerHTML='<div class="archive-empty">Noch keine Börse archiviert.</div>';return;}
  list.innerHTML=archives.slice().sort((a,b)=>new Date(b.savedAt)-new Date(a.savedAt)).map(a=>{const t=totals(a),d=new Date(a.savedAt);return `<div class="archive-card"><div><strong>${esc(a.name)}</strong><div class="muted">${isNaN(d.getTime())?"":d.toLocaleString("de-DE")} · ${t.sellers} Verkäufer · ${t.items} Artikel · ${euro(t.total)}</div><div class="muted">${sourceLabel()}</div></div><div class="archive-actions"><button data-open="${esc(a.id)}">Öffnen</button><button data-export="${esc(a.id)}">⬇️ Export</button><button data-pdf="${esc(a.id)}">📄 PDF</button><button data-restore="${esc(a.id)}">Wiederherstellen</button><button class="danger" data-del="${esc(a.id)}">Löschen</button></div></div>`}).join("");
  list.querySelectorAll("[data-open]").forEach(b=>b.onclick=()=>openArchive(b.dataset.open));
  list.querySelectorAll("[data-export]").forEach(b=>b.onclick=()=>exportArchive(b.dataset.export));
  list.querySelectorAll("[data-pdf]").forEach(b=>b.onclick=()=>exportArchivePdf(b.dataset.pdf));
  list.querySelectorAll("[data-restore]").forEach(b=>b.onclick=()=>restoreArchive(b.dataset.restore));
  list.querySelectorAll("[data-del]").forEach(b=>b.onclick=()=>deleteArchive(b.dataset.del));
}
async function refreshArchives(){
  archiveSource="cloud";
  try{
    if(window.KBCloud&&KBCloud.cloudReady()){
      const rows=await KBCloud.cloudListArchives();
      archives=(rows||[]).map(normalizeArchive).filter(Boolean);
      // Die Cloud ist die führende Quelle. Lokale Kopien dürfen hier NICHT
      // automatisch wieder hochgeladen werden, weil ein auf einem Gerät
      // gelöschtes Archiv sonst von einem alten Browser-Cache erneut in die
      // Cloud geschrieben werden könnte.
      archives.sort((a,b)=>new Date(b.savedAt)-new Date(a.savedAt));
      render();
      return;
    }
  }catch(e){console.warn("Cloud-Archiv nicht erreichbar",e)}
  archiveSource="local";
  archives=loadLocalArchives().map(normalizeArchive).filter(Boolean);
  render();
}
async function saveArchiveCloudOrLocal(a){
  if(window.KBCloud&&KBCloud.cloudReady()){
    await KBCloud.cloudSaveArchive(a);
    archiveSource="cloud";
  }else{
    const arr=loadLocalArchives();arr.push(a);saveLocalArchives(arr);archiveSource="local";
  }
}
async function deleteArchive(id){
  if(!confirm("Dieses Archiv wirklich löschen?"))return;
  try{
    if(archiveSource==="cloud"&&window.KBCloud&&KBCloud.cloudReady()){
      await KBCloud.cloudDeleteArchive(id);
      archives=archives.filter(a=>a.id!==id);
      // Auch eventuell vorhandene lokale Kopien entfernen.
      // Sonst könnte ein alter Browser-Cache das gelöschte Archiv später
      // wieder anzeigen bzw. erneut in die Cloud schreiben.
      const local=loadLocalArchives().filter(a=>String(a?.id||"")!==String(id));
      saveLocalArchives(local);
    }else{
      archives=archives.filter(a=>a.id!==id);saveLocalArchives(archives);
    }
    await refreshArchives();
  }catch(e){console.error(e);alert("Das Archiv konnte nicht gelöscht werden.\n\n"+(e?.message||"Unbekannter Fehler"))}
}
async function restoreArchive(id){
  let a=archives.find(x=>x.id===id);
  if(!a)return;
  // Bei Cloud-Archiven den vollständigen Snapshot nochmals direkt aus der Cloud laden.
  try{
    if(archiveSource==="cloud"&&window.KBCloud&&KBCloud.cloudReady()){
      const cloudSnap=await KBCloud.cloudGetArchive(id);if(cloudSnap)a=normalizeArchive(cloudSnap);
    }
  }catch(e){console.warn("Cloud-Snapshot konnte nicht nachgeladen werden",e)}
  const isCloud=a.mode==="cloud";
  const text=isCloud?`„${a.name}“ wiederherstellen? Die aktuell gespeicherte Börse in der Cloud wird vollständig durch diese archivierte Börse ersetzt.`:`„${a.name}“ wiederherstellen? Die aktuell gespeicherten Verkäufer und Verkäufe auf diesem Gerät werden vollständig durch diese archivierte Börse ersetzt.`;
  if(!confirm(text))return;
  const buttons=document.querySelectorAll(`[data-restore="${CSS.escape(id)}"]`);buttons.forEach(b=>{b.disabled=true;b.textContent="Wird wiederhergestellt …"});
  try{
    if(isCloud){
      if(!window.KBCloud||!KBCloud.cloudReady())throw new Error("Die Cloud ist nicht eingerichtet.");
      await KBCloud.cloudRestoreSnapshot(a);
    }else{
      localStorage.setItem("kb_sellers",JSON.stringify(a.sellers||[]));localStorage.setItem("kb_sales",JSON.stringify(a.sales||[]));
      if(a.register)localStorage.setItem("kb_register",a.register);
    }
    localStorage.setItem("kb_seller_extras",JSON.stringify(a.sellerExtras||{}));
    if(a.register)localStorage.setItem("kb_register",a.register);
    alert(`„${a.name}“ wurde vollständig wiederhergestellt.`);window.location.href="index.html";
  }catch(e){console.error(e);alert("Die Börse konnte nicht vollständig wiederhergestellt werden.\n\n"+(e?.message||"Unbekannter Fehler"));buttons.forEach(b=>{b.disabled=false;b.textContent="Wiederherstellen"})}
}
function openArchive(id){
  const a=archives.find(x=>x.id===id);if(!a)return;const s=salesFromSnapshot(a),t=totals(a);$("detailPanel").hidden=false;$("detailTitle").textContent=a.name;const d=new Date(a.savedAt);$("detailMeta").textContent=`Archiviert am ${isNaN(d.getTime())?"":d.toLocaleString("de-DE")} · ${archiveSource==="cloud"?"Cloud-Sicherung":"Lokale Sicherung"}`;const by={};s.forEach(x=>{const n=String(x.sellerNumber||"").trim();if(!n)return;(by[n]||={count:0,total:0});by[n].count++;by[n].total+=Number(x.price||0)});$("detailBody").innerHTML=`<div class="stats"><div class="stat"><span>Verkäufer</span><strong>${t.sellers}</strong></div><div class="stat"><span>Artikel</span><strong>${t.items}</strong></div><div class="stat"><span>Umsatz</span><strong>${euro(t.total)}</strong></div><div class="stat"><span>Nicht zugeordnet</span><strong>${s.filter(x=>!String(x.sellerNumber||"").trim()).length}</strong></div></div><h3>Verkäufer</h3>${Object.entries(by).map(([n,x])=>{const seller=(a.sellers||[]).find(z=>String(z.number)===n);return `<div class="seller-card"><div><strong>${esc(seller?.name||("Verkäufer "+n))}</strong><div class="muted">Nr. ${esc(n)} · ${x.count} Artikel</div></div><strong>${euro(x.total)}</strong></div>`}).join("")||'<div class="archive-empty">Keine Verkäufe vorhanden.</div>'}`;window.scrollTo({top:document.body.scrollHeight,behavior:"smooth"})
}
function downloadText(filename,text){const blob=new Blob([text],{type:"application/json;charset=utf-8"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)}
function safeFileName(v){return String(v||"boerse").replace(/ä/g,"ae").replace(/ö/g,"oe").replace(/ü/g,"ue").replace(/Ä/g,"Ae").replace(/Ö/g,"Oe").replace(/Ü/g,"Ue").replace(/ß/g,"ss").replace(/[^a-zA-Z0-9_-]+/g,"_").replace(/^_+|_+$/g,"")||"boerse"}
function exportArchive(id){const a=archives.find(x=>x.id===id);if(!a)return;const payload={format:FORMAT,version:VERSION,exportedAt:new Date().toISOString(),archive:a};downloadText(`${safeFileName(a.name)}_${new Date(a.savedAt).toISOString().slice(0,10)}.json`,JSON.stringify(payload,null,2))}
async function importArchiveFile(file){
  if(!file)return;const text=await file.text();let data;try{data=JSON.parse(text)}catch(e){throw new Error("Die Datei ist keine gültige JSON-Sicherung.")}
  let incoming=[];if(data?.format===FORMAT&&data.archive)incoming=[data.archive];else if(Array.isArray(data?.archives))incoming=data.archives;else if(data?.id&&data?.sellers)incoming=[data];else throw new Error("Unbekanntes Kleiderbörsen-Archivformat.");
  let count=0;for(const raw of incoming){const a=normalizeArchive(raw);if(!a)continue;if(window.KBCloud&&KBCloud.cloudReady())await KBCloud.cloudSaveArchive(a);else{const arr=loadLocalArchives();const i=arr.findIndex(x=>String(x.id)===a.id);if(i>=0)arr[i]=a;else arr.push(a);saveLocalArchives(arr)}count++}
  await refreshArchives();alert(`${count} Archiv${count===1?"":"e"} erfolgreich importiert.`)
}
$("saveArchive").onclick=async()=>{const name=$("archiveName").value.trim();if(!name){alert("Bitte einen Namen für die Börse eingeben.");return}const btn=$("saveArchive");btn.disabled=true;try{const snap=await currentSnapshot();snap.id=crypto.randomUUID?crypto.randomUUID():String(Date.now());snap.name=name;await saveArchiveCloudOrLocal(snap);$("archiveName").value="";await refreshArchives();alert(`„${name}“ wurde ${archiveSource==="cloud"?"in der Cloud":"lokal"} archiviert.`)}catch(e){console.error(e);alert("Die Börse konnte nicht archiviert werden.\n\n"+(e?.message||"Unbekannter Fehler"))}finally{btn.disabled=false}}
$("importArchive").onclick=()=>$("archiveFile").click();$("archiveFile").onchange=async e=>{try{await importArchiveFile(e.target.files?.[0])}catch(err){console.error(err);alert("Import fehlgeschlagen.\n\n"+(err?.message||"Unbekannter Fehler"))}finally{e.target.value=""}};
$("closeDetail").onclick=()=>$("detailPanel").hidden=true;
refreshArchives();

/* PDF-Auswertung eines Archivs */
function reportItems(a){
  if(a.mode==="cloud" && Array.isArray(a.receipts)){
    const out=[];
    a.receipts.forEach(r=>(r.receipt_items||[]).forEach(i=>{
      const rawSize=String(i.size||"").trim();
      const category=/^schuhe(?:\s|$)/i.test(rawSize) ? "Schuhe" : (/^spielzeug(?:\s|$)/i.test(rawSize) ? "Spielzeug" : "Kleidung");
      out.push({
        sellerNumber:String(i.seller_number||""),price:Number(i.price||0),payment:String(r.payment||""),
        register:String(r.register_id||"Kasse 1"),created:r.created_at||"",size:category==="Kleidung"?rawSize:rawSize.replace(/^(Schuhe|Spielzeug)\s*/i,"").trim(),
        category,commissionEnabled:i.commission_enabled===true,commissionRate:Number(i.commission_rate||0),
        note:String(i.unassigned_note||""),photo:String(i.unassigned_photo||"")
      });
    }));
    return out;
  }
  return (a.sales||[]).map(x=>({
    sellerNumber:String(x.sellerNumber||""),price:Number(x.price||0),payment:String(x.payment||""),register:String(x.registerId||x.register||"Kasse 1"),
    created:x.timestamp||x.created_at||"",size:String(x.size||""),category:/^schuhe/i.test(String(x.size||""))?"Schuhe":(/^spielzeug/i.test(String(x.size||""))?"Spielzeug":"Kleidung"),
    commissionEnabled:x.commissionEnabled===true,commissionRate:Number(x.commissionRate||0),note:String(x.unassignedNote||""),photo:String(x.unassignedPhoto||"")
  }));
}
function reportData(a){
  const items=reportItems(a), extras=(a.sellerExtras&&typeof a.sellerExtras==="object")?a.sellerExtras:{};
  const sellerMap={};(a.sellers||[]).forEach(s=>sellerMap[String(s.number)]={...s});
  const bySeller={};
  items.forEach(i=>{
    const n=String(i.sellerNumber||""); if(!n)return;
    const s=bySeller[n]||(bySeller[n]={count:0,gross:0,commission:0,payout:0});
    s.count++;s.gross+=i.price;s.commission+=i.commissionEnabled?i.price*i.commissionRate:0;
  });
  Object.values(bySeller).forEach(s=>s.payout=s.gross-s.commission);
  const payments={},registers={},categories={Kleidung:{count:0,total:0},Schuhe:{count:0,total:0},Spielzeug:{count:0,total:0}};
  items.forEach(i=>{
    const p=i.payment||"Sonstige";payments[p]||(payments[p]={count:0,total:0});payments[p].count++;payments[p].total+=i.price;
    const r=i.register||"Kasse 1";registers[r]||(registers[r]={count:0,total:0});registers[r].count++;registers[r].total+=i.price;
    const c=categories[i.category]||categories.Kleidung;c.count++;c.total+=i.price;
  });
  const sellerRows=Object.entries(bySeller).map(([n,v])=>{const s=sellerMap[n]||{number:n,name:"Verkäufer "+n};const ex=extras[n]||{};return {number:n,name:String(s.name||"Verkäufer "+n),count:v.count,gross:v.gross,commission:v.commission,payout:v.payout,method:String(ex.payoutMethod||s.payoutMethod||"Bar")}}).sort((a,b)=>b.gross-a.gross);
  const unassigned=items.filter(i=>!i.sellerNumber.trim());
  return {items,sellerRows,payments,registers,categories,unassigned,total:items.reduce((n,i)=>n+i.price,0),commission:sellerRows.reduce((n,s)=>n+s.commission,0),sellers:(a.sellers||[]).length,activeSellers:sellerRows.length};
}
function pdfWinAnsiArchive(value){
  const map={"€":128,"‚":130,"ƒ":131,"„":132,"…":133,"†":134,"‡":135,"ˆ":136,"‰":137,"Š":138,"‹":139,"Œ":140,"Ž":142,"‘":145,"’":146,"“":147,"”":148,"•":149,"–":150,"—":151,"˜":152,"™":153,"š":154,"›":155,"œ":156,"ž":158,"Ÿ":159,"Ä":196,"Ö":214,"Ü":220,"ä":228,"ö":246,"ü":252,"ß":223};
  let out="";for(const ch of String(value??"")){const c=ch.charCodeAt(0);if(c<128)out+=String.fromCharCode(c);else if(map[ch]!=null)out+=String.fromCharCode(map[ch]);else out+="?";}return out;
}
function pdfEscapeArchive(v){return pdfWinAnsiArchive(v).replace(/\\/g,"\\\\").replace(/\(/g,"\\(").replace(/\)/g,"\\)")}
function bytesFromBinaryStringArchive(str){const out=new Uint8Array(str.length);for(let i=0;i<str.length;i++)out[i]=str.charCodeAt(i)&255;return out}
function archiveMoney(v){return Number(v||0).toLocaleString("de-DE",{minimumFractionDigits:2,maximumFractionDigits:2})+" €"}
function archiveDate(v){const d=new Date(v);return isNaN(d.getTime())?"":d.toLocaleString("de-DE")}
function archivePdfText(cmds,x,y,size,text,bold=false){cmds.push(`BT /${bold?"F2":"F1"} ${size} Tf ${x.toFixed(2)} ${(842-y).toFixed(2)} Td (${pdfEscapeArchive(text)}) Tj ET`)}
function archivePdfLine(cmds,x1,y1,x2,y2){cmds.push(`0.8 w 0.78 0.80 0.85 RG ${x1} ${(842-y1).toFixed(2)} m ${x2} ${(842-y2).toFixed(2)} l S`)}
function archivePdfRect(cmds,x,y,w,h,fill="0.97 0.98 0.99") {cmds.push(`${fill} rg ${x} ${(842-y-h).toFixed(2)} ${w} ${h} re f`)}
function archivePdfPageHeader(cmds,title,subtitle){archivePdfText(cmds,42,48,23,"Kleiderbörse Ostereistedt",true);archivePdfText(cmds,42,76,19,title,true);archivePdfText(cmds,42,98,10,subtitle,false);archivePdfLine(cmds,42,110,553,110)}
function archivePdfTable(cmds,headers,rows,widths,startY,rowH=22,fontSize=9){
  const x0=42;let x=x0;headers.forEach((h,i)=>{archivePdfText(cmds,x,startY,9,h,true);x+=widths[i]});archivePdfLine(cmds,x0,startY+6,x0+widths.reduce((a,b)=>a+b,0),startY+6);
  let y=startY+25;rows.forEach((row,ri)=>{if(y>810)return; x=x0;row.forEach((cell,i)=>{const max=Math.max(5,Math.floor(widths[i]/5.1));let str=String(cell??"");if(str.length>max)str=str.slice(0,max-1)+"…";archivePdfText(cmds,x,y,fontSize,str,false);x+=widths[i]});archivePdfLine(cmds,x0,y+7,x0+widths.reduce((a,b)=>a+b,0),y+7);y+=rowH});return y;
}
async function makeArchiveReportPdf(a){
  const d=reportData(a), pages=[];
  const addPage=cmds=>pages.push(cmds.join("\n"));
  let c=[];archivePdfPageHeader(c,"Börsen-Auswertung",`${a.name} · archiviert am ${archiveDate(a.savedAt)}`);
  archivePdfText(c,42,145,14,"Kennzahlen",true);
  const stats=[
    ["Verkäufer",String(d.activeSellers)], ["Verkaufte Artikel",String(d.items.length)], ["Umsatz",archiveMoney(d.total)],
    ["Provision",archiveMoney(d.commission)], ["Auszahlung",archiveMoney(d.total-d.commission)], ["Nicht zugeordnet",String(d.unassigned.length)+" · "+archiveMoney(d.unassigned.reduce((n,i)=>n+i.price,0))]
  ];
  stats.forEach((s,i)=>{const col=i%2,row=Math.floor(i/2),x=42+col*255,y=164+row*68;archivePdfRect(c,x,y,240,52);archivePdfText(c,x+12,y+20,9,s[0],false);archivePdfText(c,x+12,y+42,16,s[1],true)});
  let y=390;archivePdfText(c,42,y,14,"Zahlungsarten",true);y+=22;
  const payRows=Object.entries(d.payments).sort((a,b)=>b[1].total-a[1].total).map(([k,v])=>[k,String(v.count),archiveMoney(v.total)]);y=archivePdfTable(c,["Zahlungsart","Artikel","Umsatz"],payRows,[230,80,160],y,21,9)+22;
  archivePdfText(c,42,y,14,"Kassen",true);y+=22;
  const regRows=Object.entries(d.registers).sort((a,b)=>a[0].localeCompare(b[0],"de-DE")).map(([k,v])=>[k,String(v.count),archiveMoney(v.total)]);y=archivePdfTable(c,["Kasse","Artikel","Umsatz"],regRows,[230,80,160],y,21,9)+22;
  archivePdfText(c,42,y,14,"Artikelarten",true);y+=22;
  const catRows=Object.entries(d.categories).filter(([,v])=>v.count).map(([k,v])=>[k,String(v.count),archiveMoney(v.total)]);archivePdfTable(c,["Art","Artikel","Umsatz"],catRows,[230,80,160],y,21,9);
  archivePdfText(c,42,810,8,"Kleiderbörse Ostereistedt · Börsen-Auswertung",false);addPage(c);

  let sellerRows=d.sellerRows.map(s=>[s.number,s.name,String(s.count),archiveMoney(s.gross),archiveMoney(s.commission),archiveMoney(s.payout),s.method]);
  let idx=0;while(idx<sellerRows.length||idx===0){c=[];archivePdfPageHeader(c,"Verkäuferübersicht",`${a.name} · sortiert nach Umsatz`);const chunk=sellerRows.slice(idx,idx+25);archivePdfTable(c,["Nr.","Verkäufer","Art.","Umsatz","Prov.","Auszahlung","Art"],chunk,[34,150,34,80,70,90,80],130,21,8);archivePdfText(c,42,810,8,"Kleiderbörse Ostereistedt · Verkäuferübersicht",false);addPage(c);if(!chunk.length)break;idx+=chunk.length;}

  if(d.unassigned.length){let ui=0;while(ui<d.unassigned.length){c=[];archivePdfPageHeader(c,"Nicht zugeordnete Artikel",`${a.name} · Artikel ohne Verkäufernummer`);const chunk=d.unassigned.slice(ui,ui+28).map((i,n)=>[String(ui+n+1),archiveDate(i.created),archiveMoney(i.price),i.category,i.size||"",i.note||""]);archivePdfTable(c,["#","Zeit","Preis","Art","Größe","Notiz"],chunk,[28,105,65,65,65,183],130,20,7.5);archivePdfText(c,42,810,8,"Kleiderbörse Ostereistedt · Nicht zugeordnete Artikel",false);addPage(c);ui+=chunk.length;}}

  // Einzelverkaufsdaten als Anhang, damit die Auswertung auch als vollständige Dokumentation genutzt werden kann.
  let ai=0;while(ai<d.items.length){c=[];archivePdfPageHeader(c,"Verkaufsübersicht",`${a.name} · Einzelartikel`);const chunk=d.items.slice(ai,ai+30).map((i,n)=>[String(ai+n+1),i.sellerNumber||"-",i.category,i.size||"",archiveMoney(i.price),i.payment||"",i.register||""]);archivePdfTable(c,["#","Vk-Nr.","Art","Größe","Preis","Zahlung","Kasse"],chunk,[25,55,65,80,65,100,70],130,19,7.5);archivePdfText(c,42,810,8,"Kleiderbörse Ostereistedt · Verkaufsübersicht",false);addPage(c);ai+=chunk.length;}

  const objects=["<< /Type /Catalog /Pages 2 0 R >>",""];const pageNums=[];const contentNums=[];let next=3;
  pages.forEach(()=>{pageNums.push(next++);contentNums.push(next++)});objects[1]=`<< /Type /Pages /Kids [${pageNums.map(n=>n+" 0 R").join(" ")}] /Count ${pages.length} >>`;
  pages.forEach((commands,i)=>{objects[pageNums[i]-1]=`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /Font << /F1 ${next} 0 R /F2 ${next+1} 0 R >> >> /Contents ${contentNums[i]} 0 R >>`;objects[contentNums[i]-1]=`<< /Length ${commands.length} >>\nstream\n${commands}\nendstream`});
  const font1=next++,font2=next++;objects[font1-1]='<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>';objects[font2-1]='<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>';
  let pdf="%PDF-1.4\n%\xE2\xE3\xCF\xD3\n",offsets=[0];for(let i=0;i<objects.length;i++){offsets.push(pdf.length);pdf+=`${i+1} 0 obj\n${objects[i]}\nendobj\n`};const xref=pdf.length;pdf+=`xref\n0 ${objects.length+1}\n0000000000 65535 f \n`;for(let i=1;i<offsets.length;i++)pdf+=String(offsets[i]).padStart(10,"0")+" 00000 n \n";pdf+=`trailer\n<< /Size ${objects.length+1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;return new Blob([bytesFromBinaryStringArchive(pdf)],{type:"application/pdf"});
}
async function exportArchivePdf(id){
  let a=archives.find(x=>x.id===id);if(!a)return;
  const btn=document.querySelector(`[data-pdf="${CSS.escape(id)}"]`);if(btn){btn.disabled=true;btn.textContent="PDF wird erstellt …"}
  try{
    if(archiveSource==="cloud"&&window.KBCloud&&KBCloud.cloudReady()){const fresh=await KBCloud.cloudGetArchive(id);if(fresh)a=normalizeArchive(fresh)}
    const blob=await makeArchiveReportPdf(a),filename=`${safeFileName(a.name)}_Auswertung.pdf`,url=URL.createObjectURL(blob),link=document.createElement("a");link.href=url;link.target="_blank";link.rel="noopener";document.body.appendChild(link);link.click();setTimeout(()=>{link.remove();URL.revokeObjectURL(url)},60000);
  }catch(e){console.error(e);alert("Die PDF-Auswertung konnte nicht erstellt werden.\n\n"+(e?.message||"Unbekannter Fehler"))}finally{if(btn){btn.disabled=false;btn.textContent="📄 PDF"}}
}
