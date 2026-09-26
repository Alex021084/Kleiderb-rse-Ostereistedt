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
  list.innerHTML=archives.slice().sort((a,b)=>new Date(b.savedAt)-new Date(a.savedAt)).map(a=>{const t=totals(a),d=new Date(a.savedAt);return `<div class="archive-card"><div><strong>${esc(a.name)}</strong><div class="muted">${isNaN(d.getTime())?"":d.toLocaleString("de-DE")} · ${t.sellers} Verkäufer · ${t.items} Artikel · ${euro(t.total)}</div><div class="muted">${sourceLabel()}</div></div><div class="archive-actions"><button data-open="${esc(a.id)}">Öffnen</button><button data-export="${esc(a.id)}">⬇️ Export</button><button data-restore="${esc(a.id)}">Wiederherstellen</button><button class="danger" data-del="${esc(a.id)}">Löschen</button></div></div>`}).join("");
  list.querySelectorAll("[data-open]").forEach(b=>b.onclick=()=>openArchive(b.dataset.open));
  list.querySelectorAll("[data-export]").forEach(b=>b.onclick=()=>exportArchive(b.dataset.export));
  list.querySelectorAll("[data-restore]").forEach(b=>b.onclick=()=>restoreArchive(b.dataset.restore));
  list.querySelectorAll("[data-del]").forEach(b=>b.onclick=()=>deleteArchive(b.dataset.del));
}
async function refreshArchives(){
  archiveSource="cloud";
  try{
    if(window.KBCloud&&KBCloud.cloudReady()){
      const rows=await KBCloud.cloudListArchives();
      archives=(rows||[]).map(normalizeArchive).filter(Boolean);
      // Alte lokale Archive einmalig in die Cloud übernehmen, sofern sie dort noch nicht existieren.
      const local=loadLocalArchives();
      const ids=new Set(archives.map(a=>a.id));
      for(const old of local){
        const a=normalizeArchive(old);
        // Nur bereits cloudfähige Archive automatisch übernehmen.
        // Alte rein lokale Snapshots enthalten ggf. keine Cloud-Kassenbons.
        if(a&&a.mode==="cloud"&&!ids.has(a.id)){
          try{await KBCloud.cloudSaveArchive(a);archives.push(a);ids.add(a.id)}catch(e){console.warn("Lokales Cloud-Archiv konnte nicht übernommen werden",e)}
        }
      }
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
    }else{
      archives=archives.filter(a=>a.id!==id);saveLocalArchives(archives);
    }
    render();
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
