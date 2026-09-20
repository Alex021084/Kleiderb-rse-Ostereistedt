const $=id=>document.getElementById(id);
function euro(v){return Number(v||0).toLocaleString("de-DE",{style:"currency",currency:"EUR"})}
function loadSales(){return JSON.parse(localStorage.getItem("kb_sales")||"[]")}
function render(){
 const sales=loadSales();
 const total=sales.reduce((a,x)=>a+Number(x.price||0),0);
 const cash=sales.filter(x=>x.payment==="Bar").reduce((a,x)=>a+Number(x.price||0),0);
 const card=sales.filter(x=>x.payment==="EC").reduce((a,x)=>a+Number(x.price||0),0);
 const paypal=sales.filter(x=>x.payment==="PayPal").reduce((a,x)=>a+Number(x.price||0),0);

 // The commission rule is stored with each sale so changing a seller later
 // does not alter already completed sales.
 const commission=sales.reduce((a,x)=>a+Number(x.price||0)*Number(x.commissionRate ?? (x.commissionEnabled===false?0:0.15)),0);
 const payout=total-commission;

 $("totalRevenue").textContent=euro(total);
 $("cashTotal").textContent=euro(cash);
 $("cardTotal").textContent=euro(card);
 $("paypalTotal").textContent=euro(paypal);
 $("commissionGross").textContent=euro(total);
 $("commission").textContent=euro(commission);
 $("payout").textContent=euro(payout);
 $("articleCount").textContent=`${sales.length} ${sales.length===1?"Artikel":"Artikel"}`;

 const bySeller={};
 sales.forEach(x=>{
   const n=String(x.sellerNumber||"");
   if(!bySeller[n]) bySeller[n]={count:0,gross:0,commission:0,payout:0,commissionEnabled:true};
   const rate=Number(x.commissionRate ?? (x.commissionEnabled===false?0:0.15));
   bySeller[n].count++;
   bySeller[n].gross+=Number(x.price||0);
   bySeller[n].commission+=Number(x.price||0)*rate;
   bySeller[n].payout+=Number(x.price||0)*(1-rate);
   if(rate===0) bySeller[n].commissionEnabled=false;
 });
 const sellerList=Object.entries(bySeller).sort((a,b)=>a[0].localeCompare(b[0],"de-DE"));
 $("sellerRows").innerHTML=sellerList.length ? sellerList.map(([n,x])=>{
   const seller=JSON.parse(localStorage.getItem("kb_sellers")||"[]").find(s=>String(s.number)===n);
   const name=seller?.name || "Verkäufer "+n;
   return `<div class="seller-row">
     <div class="seller-name">${esc(name)}<div class="muted">Nr. ${esc(n)} · ${x.count} ${x.count===1?"Teil":"Teile"} · ${x.commissionEnabled?"15 % Provision":"Keine Provision"}</div></div>
     <div><div class="muted">Umsatz</div><strong>${euro(x.gross)}</strong></div>
     <div><div class="muted">Provision</div><strong>${euro(x.commission)}</strong></div>
     <div><div class="muted">Auszahlung</div><strong>${euro(x.payout)}</strong></div>
   </div>`;
 }).join("") : '<div class="seller-empty">Noch keine Verkäufe.</div>';

 const d=new Date();
 $("dateText").textContent=d.toLocaleDateString("de-DE",{weekday:"long",day:"2-digit",month:"2-digit",year:"numeric"});
}
function esc(v){return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}$("refreshButton").addEventListener("click",render);
render();
