const RATE=.15;
let sellers=JSON.parse(localStorage.getItem("kb3_sellers")||"[]");
let sales=JSON.parse(localStorage.getItem("kb3_sales")||"[]");
let cart=[];
let currentSeller=null;
let toyMode=false;

const $=id=>document.getElementById(id);
const euro=n=>new Intl.NumberFormat("de-DE",{style:"currency",currency:"EUR"}).format(n);
const todayKey=()=>new Date().toISOString().slice(0,10);

function save(){localStorage.setItem("kb3_sellers",JSON.stringify(sellers));localStorage.setItem("kb3_sales",JSON.stringify(sales));}
function esc(v){return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function toast(t){const x=$("toast");x.textContent=t;x.classList.add("show");setTimeout(()=>x.classList.remove("show"),2200)}
function fmtDate(iso){return new Date(iso).toLocaleString("de-DE",{dateStyle:"short",timeStyle:"short"})}

function statsForSeller(no){
  const items=sales.flatMap(s=>s.items).filter(i=>i.seller===no);
  const revenue=items.reduce((a,i)=>a+i.price,0);
  return {items,revenue,commission:revenue*RATE,payout:revenue*(1-RATE)};
}
function todaySales(){return sales.filter(s=>s.date===todayKey())}
function show(id){document.querySelectorAll(".view").forEach(v=>v.classList.remove("active"));$(id).classList.add("active");window.scrollTo(0,0)}
function showDashboard(){show("dashboard");currentSeller=null;renderDashboard()}
function openCashier(){show("cashier");renderCart();$("cashSeller").focus()}
function showSales(){show("salesView");renderSales()}
function openSellerForm(){$("sellerModal").classList.remove("hidden");$("newSellerNo").focus()}
function closeModal(){$("sellerModal").classList.add("hidden")}
function closePayment(){$("paymentModal").classList.add("hidden")}

function saveSeller(){
  const no=$("newSellerNo").value.trim(),name=$("newSellerName").value.trim();
  if(!no||!name){toast("Bitte Nummer und Namen eingeben.");return}
  if(sellers.some(s=>s.no===no)){toast("Diese Verkäufernummer gibt es bereits.");return}
  sellers.push({no,name});sellers.sort((a,b)=>a.no.localeCompare(b.no,undefined,{numeric:true}));
  save();closeModal();$("newSellerNo").value="";$("newSellerName").value="";renderDashboard();toast("Verkäufer angelegt.");
}
function sellerByNo(no){return sellers.find(s=>s.no===no)}

function renderDashboard(){
  $("dashSellerCount").textContent=sellers.length;
  const ts=todaySales(), items=ts.flatMap(s=>s.items), revenue=items.reduce((a,i)=>a+i.price,0);
  $("dashItemCount").textContent=items.length;$("dashRevenue").textContent=euro(revenue);$("dashCommission").textContent=euro(revenue*RATE);
  renderSellerList();renderPaymentSummary();
}
function renderSellerList(){
  if(!sellers.length){$("sellerList").innerHTML='<div class="empty">Noch keine Verkäufer angelegt.<br><button class="primary" onclick="openSellerForm()">＋ Ersten Verkäufer anlegen</button></div>';return}
  $("sellerList").innerHTML=sellers.map(s=>{
    const st=statsForSeller(s.no);
    const initials=s.name.split(/\s+/).map(x=>x[0]).join("").slice(0,2).toUpperCase();
    return `<div class="seller-card" onclick="openSeller('${esc(s.no)}')">
      <div class="avatar">${esc(initials)}</div>
      <div><div class="seller-name">${esc(s.name)}</div><div class="seller-meta">Nr. ${esc(s.no)} · ${st.items.length} verkaufte Teile</div></div>
      <div class="seller-money"><strong>${euro(st.revenue)}</strong><small>Auszahlung ${euro(st.payout)}</small></div>
      <div class="seller-arrow">›</div>
    </div>`
  }).join("");
}
function renderPaymentSummary(){
  const ts=todaySales(), types=["Bar","EC","PayPal"];
  $("paymentSummary").innerHTML=types.map(t=>{
    const n=ts.flatMap(s=>s.items).filter(i=>i.payment===t).reduce((a,i)=>a+i.price,0);
    const count=ts.filter(s=>s.payment===t).length;
    return `<div class="payment-box-small"><span>${t} · ${count} Kassenzettel</span><strong>${euro(n)}</strong></div>`
  }).join("");
}

function openSeller(no){
  currentSeller=no;const s=sellerByNo(no);if(!s)return;
  const st=statsForSeller(no);show("sellerDetail");
  $("sellerDetailTitle").textContent=s.name;$("sellerDetailSubtitle").textContent=`Verkäufernummer ${s.no}`;
  $("detailItems").textContent=st.items.length;$("detailRevenue").textContent=euro(st.revenue);
  $("detailCommission").textContent=euro(st.commission);$("detailPayout").textContent=euro(st.payout);
  $("sellerItems").innerHTML=st.items.length?`<table class="table"><thead><tr><th>Datum</th><th>Artikel</th><th>Größe / Art</th><th>Zahlung</th><th class="right">Preis</th></tr></thead><tbody>${st.items.map(i=>`<tr><td>${fmtDate(i.time)}</td><td>${i.type==="Spielzeug"?"🧸":"👕"}</td><td>${esc(i.type==="Spielzeug"?"Spielzeug":"Größe "+i.size)}</td><td>${esc(i.payment||"—")}</td><td class="right">${euro(i.price)}</td></tr>`).join("")}</tbody></table>`:'<div class="empty">Noch keine verkauften Artikel.</div>';
}

function toggleToy(){
  toyMode=!toyMode;$("toyBtn").classList.toggle("toy",toyMode);$("toyBtn").textContent=toyMode?"🧸 Spielzeug":"👕 Kleidung";
  $("cashSize").disabled=toyMode;$("cashSize").placeholder=toyMode?"Keine Größe nötig":"z. B. 128 / M";
  if(toyMode)$("cashSize").value="";
}
function addCashItem(){
  const seller=$("cashSeller").value.trim();
  const size=$("cashSize").value.trim();
  const price=Number($("cashPrice").value.replace(",","."));
  if(!seller||!sellerByNo(seller)){toast("Verkäufernummer nicht gefunden. Bitte zuerst anlegen.");return}
  if(!toyMode&&!size){toast("Bitte eine Größe eingeben oder Spielzeug auswählen.");return}
  if(!(price>0)){toast("Bitte einen gültigen Preis eingeben.");return}
  cart.push({id:crypto.randomUUID?crypto.randomUUID():String(Date.now()+Math.random()),seller,size:toyMode?"—":size,type:toyMode?"Spielzeug":"Kleidung",price,time:new Date().toISOString()});
  $("cashPrice").value="";$("cashSize").value="";$("entryHint").textContent=`Artikel für ${sellerByNo(seller).name} hinzugefügt.`;
  renderCart();$("cashPrice").focus();
}
function renderCart(){
  const total=cart.reduce((a,i)=>a+i.price,0);$("cartTotal").textContent=euro(total);
  $("receiptNo").textContent=cart.length?` · ${cart.length} Artikel`:" · neuer Bon";$("receiptDate").textContent=new Date().toLocaleTimeString("de-DE",{hour:"2-digit",minute:"2-digit"});
  $("receiptItems").innerHTML=cart.length?cart.map((i,n)=>{
    const s=sellerByNo(i.seller);
    return `<div class="receipt-row"><div><div class="receipt-main">${n+1}. ${i.type==="Spielzeug"?"🧸 Spielzeug":"👕 Kleidung"}</div><div class="receipt-sub">Verkäufer ${esc(i.seller)} · ${esc(s?.name||"")} · ${i.type==="Spielzeug"?"":`Größe ${esc(i.size)}`}</div><button class="remove-line" onclick="removeCartItem(${n})">Entfernen</button></div><div class="price">${euro(i.price)}</div></div>`
  }).join(""):'<div class="empty" style="margin-top:20px">Noch keine Artikel.<br>Links Artikel eingeben und hinzufügen.</div>';
}
function removeCartItem(n){cart.splice(n,1);renderCart()}
function clearCart(){cart=[];$("entryHint").textContent="";renderCart()}
function startPayment(){if(!cart.length){toast("Der Kassenzettel ist leer.");return}$("paymentModal").classList.remove("hidden")}
function finishPayment(payment){
  const total=cart.reduce((a,i)=>a+i.price,0), id="KB-"+Date.now();
  sales.push({id,date:todayKey(),time:new Date().toISOString(),payment,total,items:cart.map(i=>({...i,payment}))});
  save();closePayment();clearCart();toast(`Verkauf ${euro(total)} · ${payment} gespeichert.`);renderDashboard();
}
function renderSales(){
  if(!sales.length){$("allSales").innerHTML='<div class="empty">Noch keine abgeschlossenen Verkäufe.</div>';return}
  $("allSales").innerHTML=`<table class="table"><thead><tr><th>Datum</th><th>Bon</th><th>Artikel</th><th>Zahlung</th><th class="right">Gesamt</th></tr></thead><tbody>${[...sales].reverse().map(s=>`<tr><td>${fmtDate(s.time)}</td><td>${esc(s.id)}</td><td>${s.items.length}</td><td>${esc(s.payment)}</td><td class="right">${euro(s.total)}</td></tr>`).join("")}</tbody></table>`;
}

function printSeller(){
  if(!currentSeller)return;const s=sellerByNo(currentSeller),st=statsForSeller(currentSeller);
  const w=window.open("","_blank","width=800,height=900");
  w.document.write(`<html><head><title>Abrechnung ${esc(s.name)}</title><style>body{font-family:Arial;padding:35px;color:#172033}h1{margin-bottom:4px}table{width:100%;border-collapse:collapse;margin-top:25px}td,th{padding:9px;border-bottom:1px solid #ddd;text-align:left}.r{text-align:right}.total{font-size:18px;font-weight:bold}.box{padding:16px;background:#f3f5f8;margin-top:20px}@media print{button{display:none}}</style></head><body><h1>Kleiderbörse – Verkäuferabrechnung</h1><div>Verkäufer: <b>${esc(s.name)}</b> · Nr. ${esc(s.no)}</div><div>${new Date().toLocaleDateString("de-DE")}</div><table><tr><th>Artikel</th><th>Größe / Art</th><th>Zahlung</th><th class="r">Preis</th></tr>${st.items.map(i=>`<tr><td>${esc(i.type)}</td><td>${esc(i.type==="Spielzeug"?"—":i.size)}</td><td>${esc(i.payment||"—")}</td><td class="r">${euro(i.price)}</td></tr>`).join("")}</table><div class="box"><p>Verkaufte Teile: <b>${st.items.length}</b></p><p>Umsatz: <b>${euro(st.revenue)}</b></p><p>Provision −15 %: <b>${euro(st.commission)}</b></p><p class="total">Auszahlung: ${euro(st.payout)}</p></div><script>window.onload=()=>window.print()<\/script></body></html>`);
  w.document.close();
}
function printDaySummary(){
  const ts=todaySales(),items=ts.flatMap(s=>s.items),total=items.reduce((a,i)=>a+i.price,0);
  const vals=["Bar","EC","PayPal"].map(t=>[t,items.filter(i=>i.payment===t).reduce((a,i)=>a+i.price,0)]);
  const w=window.open("","_blank","width=700,height=800");
  w.document.write(`<html><head><title>Tagesabschluss</title><style>body{font-family:Arial;padding:35px;color:#172033}table{width:100%;border-collapse:collapse;margin-top:25px}td{padding:12px;border-bottom:1px solid #ddd}.r{text-align:right;font-weight:bold}.big{font-size:20px;font-weight:bold}</style></head><body><h1>Kleiderbörse – Tagesabschluss</h1><p>${new Date().toLocaleDateString("de-DE")}</p><table>${vals.map(v=>`<tr><td>${v[0]}</td><td class="r">${euro(v[1])}</td></tr>`).join("")}<tr><td class="big">Gesamt</td><td class="r big">${euro(total)}</td></tr><tr><td>15 % Provision</td><td class="r">${euro(total*RATE)}</td></tr><tr><td>Auszahlungen Verkäufer</td><td class="r">${euro(total*(1-RATE))}</td></tr></table><p>Verkaufte Teile: ${items.length}</p><script>window.onload=()=>window.print()<\/script></body></html>`);
  w.document.close();
}
function tick(){$("clock").textContent=new Date().toLocaleString("de-DE",{dateStyle:"short",timeStyle:"short"})}
setInterval(tick,1000);tick();renderDashboard();
