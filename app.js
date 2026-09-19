const commissionRate = 0.15;
const testArticles = {
  "1001": {id:"BO26-1001-000001", seller:"1001", description:"T-Shirt", size:"128", price:5},
  "1002": {id:"BO26-1002-000002", seller:"1002", description:"Jeans", size:"140", price:8},
  "2001": {id:"BO26-2001-000003", seller:"2001", description:"Pullover", size:"M", price:12}
};

let cart = JSON.parse(localStorage.getItem("kb_cart") || "[]");
let sales = JSON.parse(localStorage.getItem("kb_sales") || "[]");
let manualCounter = Number(localStorage.getItem("kb_counter") || 100);

const $ = id => document.getElementById(id);
const euro = n => new Intl.NumberFormat("de-DE",{style:"currency",currency:"EUR"}).format(n);

function save() {
  localStorage.setItem("kb_cart", JSON.stringify(cart));
  localStorage.setItem("kb_sales", JSON.stringify(sales));
  localStorage.setItem("kb_counter", String(manualCounter));
}

function toast(msg) {
  const el=$("toast"); el.textContent=msg; el.classList.add("show");
  setTimeout(()=>el.classList.remove("show"),2200);
}

function addArticle(article) {
  if (!article || !article.seller || !(article.price >= 0)) {
    toast("Artikel konnte nicht hinzugefügt werden.");
    return;
  }
  cart.push({...article, cartId: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()+Math.random())});
  save(); render();
  toast(`Artikel von Verkäufer ${article.seller} hinzugefügt.`);
  $("barcodeInput").value="";
  $("barcodeInput").focus();
}

function findArticle(code) {
  const clean=code.trim();
  if (testArticles[clean]) return testArticles[clean];
  // Unterstützt z.B. BO26-1234-000157 aus einer späteren Verkäufer-App.
  const parts=clean.split("-");
  if (parts.length>=3 && parts[1] && parts[2]) {
    const seller=parts[1];
    const price = null;
    // Ohne Datenbank kann die Test-Kasse nur bekannte Testartikel auflösen.
    return null;
  }
  return null;
}

$("addBtn").onclick=()=>{
  const code=$("barcodeInput").value;
  const article=findArticle(code);
  if(!article) {
    toast("Barcode nicht gefunden. Teste 1001, 1002 oder 2001.");
    return;
  }
  addArticle(article);
};

$("barcodeInput").addEventListener("keydown",e=>{
  if(e.key==="Enter") $("addBtn").click();
});

$("manualAddBtn").onclick=()=>{
  const seller=$("sellerInput").value.trim();
  const size=$("sizeInput").value.trim();
  const price=Number($("priceInput").value.replace(",", "."));
  if(!seller || !size || !(price>0)) { toast("Bitte Verkäufer, Größe und Preis eingeben."); return; }
  manualCounter++;
  addArticle({
    id:`TEST-${seller}-${String(manualCounter).padStart(6,"0")}`,
    seller, description:"Artikel", size, price
  });
  $("sellerInput").value=""; $("sizeInput").value=""; $("priceInput").value="";
};

$("clearCartBtn").onclick=()=>{
  if(cart.length && confirm("Warenkorb wirklich leeren?")) {cart=[];save();render();}
};

$("resetBtn").onclick=()=>{
  if(confirm("Testdaten dieser Kasse löschen?")) {
    cart=[]; sales=[]; localStorage.removeItem("kb_cart"); localStorage.removeItem("kb_sales"); render(); toast("Kasse zurückgesetzt.");
  }
};

document.querySelectorAll(".pay").forEach(btn=>{
  btn.onclick=()=>{
    if(!cart.length){toast("Der Warenkorb ist leer.");return;}
    const payment=btn.dataset.payment;
    const total=cart.reduce((s,a)=>s+a.price,0);
    const sale={id:"V"+Date.now(), timestamp:new Date().toISOString(), payment, items:cart.map(x=>({...x}))};
    sales.unshift(sale); cart=[]; save(); render();
    toast(`Verkauf ${euro(total)} · ${payment} · gespeichert`);
  };
});

function renderCart() {
  const el=$("cart");
  if(!cart.length){el.innerHTML='<div class="empty">Noch keine Artikel im Warenkorb.</div>';}
  else el.innerHTML=cart.map(a=>`
    <div class="cart-item">
      <div><div class="item-title">${escapeHtml(a.description)} · Gr. ${escapeHtml(a.size)}</div>
      <div class="item-meta">Verkäufer ${escapeHtml(a.seller)} · ${escapeHtml(a.id)}</div>
      <button class="remove" onclick="removeItem('${a.cartId}')">Entfernen</button></div>
      <div class="item-price">${euro(a.price)}</div>
    </div>`).join("");
  const subtotal=cart.reduce((s,a)=>s+a.price,0);
  $("itemCount").textContent=cart.length;
  $("subtotal").textContent=euro(subtotal);
  $("commission").textContent=euro(subtotal*commissionRate);
  $("total").textContent=euro(subtotal);
}
window.removeItem=id=>{cart=cart.filter(x=>x.cartId!==id);save();render();};

function renderSellers() {
  const map={};
  sales.forEach(s=>s.items.forEach(a=>{
    if(!map[a.seller]) map[a.seller]={sales:0, count:0};
    map[a.seller].sales+=a.price; map[a.seller].count++;
  }));
  const rows=Object.entries(map);
  if(!rows.length){$("sellerSummary").innerHTML='<div class="empty">Noch keine abgeschlossenen Verkäufe.</div>';return;}
  const max=Math.max(...rows.map(([,v])=>v.sales),1);
  $("sellerSummary").innerHTML=rows.sort((a,b)=>b[1].sales-a[1].sales).map(([seller,v])=>`
    <div class="seller-row">
      <div class="seller-number">${escapeHtml(seller)}</div>
      <div><div class="seller-bar"><span style="width:${Math.round(v.sales/max*100)}%"></span></div><small>${v.count} Artikel</small></div>
      <div class="seller-total">${euro(v.sales)}</div>
      <div class="seller-payout">${euro(v.sales*(1-commissionRate))}</div>
    </div>`).join("");
}

function renderSales() {
  const rows=sales.flatMap(s=>s.items.map(a=>({time:s.timestamp,payment:s.payment,...a})));
  if(!rows.length){$("sales").innerHTML='<div class="empty">Noch keine Verkäufe.</div>';return;}
  $("sales").innerHTML=`<div class="table-wrap"><table class="sales-table"><thead><tr><th>Zeit</th><th>Verkäufer</th><th>Artikel</th><th>Größe</th><th>Preis</th><th>Zahlung</th></tr></thead><tbody>${
    rows.map(r=>`<tr><td>${new Date(r.time).toLocaleString("de-DE")}</td><td>${escapeHtml(r.seller)}</td><td>${escapeHtml(r.description)}</td><td>${escapeHtml(r.size)}</td><td>${euro(r.price)}</td><td>${escapeHtml(r.payment)}</td></tr>`).join("")
  }</tbody></table></div>`;
}

function render(){renderCart();renderSellers();renderSales();}
function escapeHtml(v){return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));}

let stream=null;
$("cameraBtn").onclick=async()=>{
  if(!("BarcodeDetector" in window)){toast("Dieser Browser unterstützt den Kamera-Barcode-Test nicht.");return;}
  try{
    const detector=new BarcodeDetector({formats:["code_128","ean_13","ean_8","qr_code"]});
    stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment"}});
    $("video").srcObject=stream; await $("video").play();
    $("scanner").classList.remove("hidden"); $("scanStatus").textContent="Scanne…";
    const scan=async()=>{
      if(!stream)return;
      try{
        const codes=await detector.detect($("video"));
        if(codes.length){$("barcodeInput").value=codes[0].rawValue;stopCamera();$("addBtn").click();return;}
      }catch(e){}
      requestAnimationFrame(scan);
    };
    scan();
  }catch(e){toast("Kamera konnte nicht geöffnet werden.");}
};
function stopCamera(){
  if(stream){stream.getTracks().forEach(t=>t.stop());stream=null;}
  $("scanner").classList.add("hidden"); $("scanStatus").textContent="Bereit";
}
$("stopCameraBtn").onclick=stopCamera;

$("exportBtn").onclick=()=>{
  const rows=[["Verkaufs-ID","Datum","Verkäufer","Artikel","Größe","Preis","Zahlungsart"]];
  sales.forEach(s=>s.items.forEach(a=>rows.push([s.id,new Date(s.timestamp).toLocaleString("de-DE"),a.seller,a.description,a.size,a.price.toFixed(2).replace(".",","),s.payment])));
  const csv=rows.map(r=>r.map(v=>`"${String(v).replaceAll('"','""')}"`).join(";")).join("\\n");
  const blob=new Blob(["\\ufeff"+csv],{type:"text/csv;charset=utf-8"});
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="kleiderboerse-verkaeufe.csv";a.click();URL.revokeObjectURL(a.href);
};

render();
