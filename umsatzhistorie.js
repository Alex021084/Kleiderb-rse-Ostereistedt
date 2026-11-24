const $=id=>document.getElementById(id);
const euro=v=>Number(v||0).toLocaleString("de-DE",{style:"currency",currency:"EUR"});
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
let sellers=[],records=[],statsByNumber=new Map();
async function loadData(){
  let sellerLoadError=null,historyLoadError=null;
  // Verkäufer zuerst und unabhängig laden: Ein Fehler der Historientabelle
  // darf niemals die gesamte Verkäuferliste verschwinden lassen.
  try{
    if(window.KBCloud&&KBCloud.cloudReady()){
      sellers=await KBCloud.cloudGetSellers();
    }else{
      sellers=JSON.parse(localStorage.getItem("kb_sellers")||"[]");
    }
  }catch(e){
    sellerLoadError=e;
    try{sellers=JSON.parse(localStorage.getItem("kb_sellers")||"[]");}
    catch(ignore){sellers=[];}
  }

  try{
    if(window.KBCloud&&KBCloud.cloudReady()){
      records=await KBCloud.cloudGetTurnoverHistory();
      records=(records||[]).map(x=>({
        sellerNumber:x.seller_number,
        sellerName:x.seller_name||"",
        price:Number(x.price||0),
        timestamp:x.created_at,
        receiptId:x.receipt_ref
      }));
    }else{
      records=JSON.parse(localStorage.getItem("kb_turnover_history")||"[]").map(x=>({
        sellerNumber:x.sellerNumber??x.seller_number,
        sellerName:x.sellerName||x.seller_name||"",
        price:Number(x.price||0),
        timestamp:x.timestamp||x.created_at,
        receiptId:x.receiptId
      }));
    }
  }catch(e){
    historyLoadError=e;
    // Lokale Offline-Datensätze zeigen, falls die Cloud-Tabelle noch nicht
    // erreichbar/eingerichtet ist. Die Verkäuferliste bleibt in jedem Fall sichtbar.
    try{
      records=JSON.parse(localStorage.getItem("kb_turnover_history")||"[]").map(x=>({
        sellerNumber:x.sellerNumber??x.seller_number,
        sellerName:x.sellerName||x.seller_name||"",
        price:Number(x.price||0),
        timestamp:x.timestamp||x.created_at,
        receiptId:x.receiptId
      }));
    }catch(ignore){records=[];}
  }

  statsByNumber.clear();
  for(const r of records){
    if(r.sellerNumber===undefined||r.sellerNumber===null||r.sellerNumber===""||!r.timestamp)continue;
    const key=String(r.sellerNumber);
    if(!statsByNumber.has(key))statsByNumber.set(key,{turnover:0,pieces:0,days:new Map()});
    const st=statsByNumber.get(key);st.turnover+=r.price;st.pieces++;
    const date=new Date(r.timestamp);if(Number.isNaN(date.getTime()))continue;
    const dayKey=date.toISOString().slice(0,10);
    if(!st.days.has(dayKey))st.days.set(dayKey,{date,turnover:0,pieces:0});
    const d=st.days.get(dayKey);d.turnover+=r.price;d.pieces++;
  }
  render();

  const warning=$("dataWarning");
  if(historyLoadError||sellerLoadError){
    const parts=[];
    if(historyLoadError)parts.push("Die Umsatzdatenbank ist nicht erreichbar oder noch nicht eingerichtet. Verkäufer werden trotzdem angezeigt; Umsätze erscheinen, sobald die Cloud-Tabelle korrekt eingerichtet ist.");
    if(sellerLoadError)parts.push("Die Cloud-Verkäuferliste konnte nicht geladen werden. Es werden – soweit vorhanden – lokal gespeicherte Verkäufer angezeigt.");
    warning.textContent=parts.join(" ");
    warning.classList.remove("hidden");
  }else{
    warning.classList.add("hidden");
    warning.textContent="";
  }
}
function render(){
  const list=$("sellerList");
  const sellerMap=new Map(sellers.map(s=>[String(s.number??s.seller_number??""),s]));
  for(const r of records){const n=String(r.sellerNumber??"");if(n&&!sellerMap.has(n))sellerMap.set(n,{number:n,name:r.sellerName||"Verkäufer"});}
  const rows=[...sellerMap.values()].map(s=>({...s,number:String(s.number??s.seller_number??""),name:String(s.name||"")}))
    .filter(s=>s.number)
    .map(s=>({seller:s,stats:statsByNumber.get(s.number)||{turnover:0,pieces:0,days:new Map()}}))
    .sort((a,b)=>b.stats.turnover-a.stats.turnover||a.seller.name.localeCompare(b.seller.name,"de"));
  $("sellerCount").textContent=`Verkäufer: ${rows.length}`;
  $("grandTotal").textContent=euro(rows.reduce((n,x)=>n+x.stats.turnover,0));
  if(!rows.length){list.innerHTML='<div class="empty">Noch keine gespeicherten Verkäufer vorhanden. Sobald Verkäufer angelegt sind, erscheinen sie hier.</div>';return}
  list.innerHTML=rows.map((x,i)=>{
    const medal=i===0?"🥇":i===1?"🥈":i===2?"🥉":String(i+1)+".";
    return `<div class="seller-row"><article class="seller-tile"><div class="rank ${i<3?"medal":""}">${medal}</div><div class="identity"><div class="name">${esc(x.seller.name)}</div><div class="number">VK ${esc(x.seller.number)}</div><div class="turnover">${euro(x.stats.turnover)}</div></div></article><button class="details" onclick="showDetails('${esc(x.seller.number)}')">Details</button></div>`;
  }).join("");
  window.historyRows=rows;
}
function showDetails(number){
  const entry=(window.historyRows||[]).find(x=>x.seller.number===String(number));if(!entry)return;
  const {seller,stats}=entry;$("detailTitle").textContent=seller.name;$("detailMeta").textContent=`Verkäufernummer: ${seller.number}`;
  const days=[...stats.days.entries()].sort((a,b)=>b[0].localeCompare(a[0]));
  $("detailRows").innerHTML=days.length?days.map(([key,d])=>`<div class="detail-row"><div><strong>Börse vom ${d.date.toLocaleDateString("de-DE")}</strong><small>${d.pieces} verkaufte ${d.pieces===1?"Teil":"Teile"}</small></div><strong>${euro(d.turnover)}</strong></div>`).join(""):'<div class="empty">Seit Einführung der Umsatzhistorie liegen noch keine Verkäufe vor.</div>';
  $("detailTotal").textContent=`${euro(stats.turnover)} · ${stats.pieces} Teile`;
  $("detailModal").classList.remove("hidden");
}
function closeDetails(){$("detailModal").classList.add("hidden")}
loadData().catch(e=>{
  const message=String(e?.message||e||"");
  const migrationMissing=/turnover_history|PGRST205|42P01|relation.*does not exist|schema cache/i.test(message);
  $("sellerList").innerHTML=`<div class="empty"><strong>${migrationMissing?"Umsatzhistorie noch nicht eingerichtet":"Umsatzdaten konnten nicht geladen werden"}</strong><br>${migrationMissing?"Bitte die Datei CLOUD-MIGRATION-V102-UMSATZHISTORIE.sql einmalig im Supabase SQL-Editor ausführen.":"Bitte Internetverbindung und Cloud-Anmeldung prüfen und die Seite erneut öffnen."}<br><small style="display:block;margin-top:10px;opacity:.75">Technischer Hinweis: ${esc(message).slice(0,220)}</small></div>`;
  console.error("Umsatzhistorie konnte nicht geladen werden:",e);
});
