const $=id=>document.getElementById(id);
const START_AT="2026-11-24T18:08:00.000Z";
const euro=v=>Number(v||0).toLocaleString("de-DE",{style:"currency",currency:"EUR"});
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
let sellers=[],records=[],statsByNumber=new Map();
function startAt(){let v=localStorage.getItem("kb_turnover_history_start");if(!v){v=START_AT;localStorage.setItem("kb_turnover_history_start",v)}return new Date(v)}
async function loadData(){
  if(window.KBCloud&&KBCloud.cloudReady()){
    sellers=await KBCloud.cloudGetSellers();
    const receipts=await KBCloud.cloudGetReceipts();
    records=(receipts||[]).flatMap(r=>(r.receipt_items||[]).map(i=>({
      sellerNumber:i.seller_number??i.sellerNumber,price:Number(i.price||0),
      timestamp:r.created_at||r.timestamp||i.timestamp,
      receiptId:r.id||r.id,commissionRate:i.commission_rate??i.commissionRate
    })));
  }else{
    sellers=JSON.parse(localStorage.getItem("kb_sellers")||"[]");
    records=JSON.parse(localStorage.getItem("kb_sales")||"[]").map(x=>({
      sellerNumber:x.seller_number??x.sellerNumber,price:Number(x.price||0),
      timestamp:x.timestamp,receiptId:x.receiptId,commissionRate:x.commissionRate
    }));
  }
  const cutoff=startAt().getTime();
  records=records.filter(x=>x.sellerNumber!==undefined&&x.sellerNumber!==null&&x.sellerNumber!==""&&x.timestamp&&new Date(x.timestamp).getTime()>=cutoff);
  statsByNumber.clear();
  for(const r of records){
    const key=String(r.sellerNumber);if(!statsByNumber.has(key))statsByNumber.set(key,{turnover:0,pieces:0,days:new Map()});
    const st=statsByNumber.get(key);st.turnover+=r.price;st.pieces++;
    const date=new Date(r.timestamp);const dayKey=date.toISOString().slice(0,10);
    if(!st.days.has(dayKey))st.days.set(dayKey,{date,turnover:0,pieces:0});
    const d=st.days.get(dayKey);d.turnover+=r.price;d.pieces++;
  }
  render();
}
function render(){
  const list=$("sellerList");
  const rows=sellers.map(s=>({...s,number:String(s.number??s.seller_number??""),name:String(s.name||"")}))
    .filter(s=>s.number)
    .map(s=>({seller:s,stats:statsByNumber.get(s.number)||{turnover:0,pieces:0,days:new Map()}}))
    .sort((a,b)=>b.stats.turnover-a.stats.turnover||a.seller.name.localeCompare(b.seller.name,"de"));
  $("sellerCount").textContent=`Verkäufer: ${rows.length}`;
  $("grandTotal").textContent=euro(rows.reduce((n,x)=>n+x.stats.turnover,0));
  if(!rows.length){list.innerHTML='<div class="empty">Keine gespeicherten Verkäufer vorhanden.</div>';return}
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
loadData().catch(e=>{$("sellerList").innerHTML='<div class="empty">Die Umsatzdaten konnten nicht geladen werden. Bitte Verbindung prüfen und erneut öffnen.</div>';console.error(e)});
