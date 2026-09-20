const $=id=>document.getElementById(id);
const sellerNumber=$("sellerNumber"),sellerStatus=$("sellerStatus"),price=$("price"),toyButton=$("toyButton");
const sizeButtons=[...document.querySelectorAll(".size-button")],keypadButtons=[...document.querySelectorAll(".keypad button")];
const addButton=$("addButton"),finishButton=$("finishButton"),cancelEditButton=$("cancelEditButton"),articleTitle=$("articleTitle"),activeField=$("activeField");
const receiptItems=$("receiptItems"),itemCount=$("itemCount"),liveTotal=$("liveTotal");
const paymentModal=$("paymentModal"),finalReceipt=$("finalReceipt"),finalTotal=$("finalTotal"),finalCount=$("finalCount"),closePayment=$("closePayment");
const successModal=$("successModal"),successText=$("successText"),newSaleButton=$("newSaleButton");
let currentItems=[],editingIndex=null,isToy=false,activeInput="seller",sellers=[],savingSale=false;

function getSellers(){return sellers.length?sellers:JSON.parse(localStorage.getItem("kb_sellers")||"[]")}
function euro(v){return Number(v||0).toLocaleString("de-DE",{style:"currency",currency:"EUR"})}
function priceValue(){
 const raw=String(price.value||"").trim().replace(/\./g,",").replace(",", ".");
 return Number(raw)||0;
}
function setActive(n){activeInput=n;activeField.textContent=n==="seller"?"Verkäufernummer":"Preis";sellerNumber.classList.toggle("active",n==="seller");price.classList.toggle("active",n==="price")}
function checkSeller(){
 const n=sellerNumber.value.trim();sellerNumber.classList.remove("valid","invalid");sellerStatus.classList.remove("valid","invalid");
 if(!n){sellerStatus.textContent="Bitte Verkäufernummer eingeben.";update();return false}
 const ok=getSellers().some(s=>String(s.number)===n);sellerNumber.classList.add(ok?"valid":"invalid");sellerStatus.classList.add(ok?"valid":"invalid");
 sellerStatus.textContent=ok?"✓ Verkäufernummer gefunden":"✕ Verkäufernummer nicht gefunden";update();return ok
}
function currentSize(){const s=document.querySelector(".size-button.selected");return isToy?"Spielzeug":(s?s.dataset.size:"")}
function valid(){return getSellers().some(s=>String(s.number)===sellerNumber.value.trim())&&!!currentSize()&&priceValue()>0}
function update(){const ok=sellerNumber.value.trim()&&currentSize()&&priceValue()>0&&getSellers().some(s=>String(s.number)===sellerNumber.value.trim());addButton.disabled=!ok;finishButton.disabled=!(currentItems.length||ok)}
function selectSize(v){isToy=false;toyButton.classList.remove("active");sizeButtons.forEach(b=>b.classList.toggle("selected",b.dataset.size===String(v)));setActive("price");update()}
function selectToy(){isToy=!isToy;toyButton.classList.toggle("active",isToy);if(isToy)sizeButtons.forEach(b=>b.classList.remove("selected"));setActive("price");update()}
function clearFields(){sellerNumber.value="";price.value="";sizeButtons.forEach(b=>b.classList.remove("selected"));isToy=false;toyButton.classList.remove("active");sellerNumber.classList.remove("valid","invalid");sellerStatus.className="seller-status";sellerStatus.textContent="Bitte Verkäufernummer eingeben.";setActive("seller")}
function nextArticle(){editingIndex=null;articleTitle.textContent="Artikel eingeben";addButton.textContent="Weiterer Artikel";cancelEditButton.classList.add("hidden");clearFields();update()}
function saveItem(){if(!valid())return false;const item={sellerNumber:sellerNumber.value.trim(),size:currentSize(),price:priceValue()};if(editingIndex===null)currentItems.push(item);else currentItems[editingIndex]=item;render();nextArticle();return true}
function editItem(i){const x=currentItems[i];editingIndex=i;articleTitle.textContent=`Artikel ${i+1} bearbeiten`;addButton.textContent="Änderung übernehmen";cancelEditButton.classList.remove("hidden");sellerNumber.value=x.sellerNumber;price.value=String(x.price).replace(".",",");if(x.size==="Spielzeug"){isToy=false;selectToy()}else{isToy=false;toyButton.classList.remove("active");sizeButtons.forEach(b=>b.classList.toggle("selected",b.dataset.size===x.size));setActive("seller")}checkSeller();update()}
function deleteItem(i){currentItems.splice(i,1);if(editingIndex===i)nextArticle();render()}
function esc(v){return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function render(){itemCount.textContent=`${currentItems.length} ${currentItems.length===1?"Artikel":"Artikel"}`;receiptItems.innerHTML=currentItems.length?currentItems.map((x,i)=>`<div class="receipt-line"><div><b>Artikel ${i+1}</b><div class="receipt-line-meta">Verkäufer ${esc(x.sellerNumber)} · ${esc(x.size)}</div></div><b>${euro(x.price)}</b><button type="button" class="receipt-action" onclick="editItem(${i})">✎</button><button type="button" class="receipt-action receipt-delete" onclick="deleteItem(${i})">×</button></div>`).join(""):'<div class="receipt-empty">Noch keine Artikel.</div>';liveTotal.textContent=euro(currentItems.reduce((a,x)=>a+x.price,0));update()}
function showPayment(){if(valid())saveItem();if(!currentItems.length)return;finalCount.textContent=`${currentItems.length} Artikel`;finalReceipt.innerHTML=currentItems.map((x,i)=>`<div class="receipt-line"><div><b>Artikel ${i+1}</b><div class="receipt-line-meta">Verkäufer ${esc(x.sellerNumber)} · ${esc(x.size)}</div></div><b>${euro(x.price)}</b></div>`).join("");finalTotal.textContent=euro(currentItems.reduce((a,x)=>a+x.price,0));paymentModal.classList.add("is-open")}
async function saveSale(payment){
 if(savingSale)return;
 if(!currentItems.length)return;
 savingSale=true;
 try{
   const prepared=currentItems.map(x=>{
     const seller=getSellers().find(s=>String(s.number)===String(x.sellerNumber));
     const commissionEnabled=seller?seller.commissionEnabled===true:true;
     const commissionRate=commissionEnabled?Number(seller?.commissionRate??15)/100:0;
     return {...x,commissionEnabled,commissionRate};
   });
   let receiptNo=null;
   if(KBCloud.cloudReady()){
     const receipt=await KBCloud.cloudCreateReceipt(prepared,payment);
     receiptNo=receipt.receipt_no ?? receipt.id;
   }else{
     const sales=JSON.parse(localStorage.getItem("kb_sales")||"[]"),timestamp=new Date().toISOString();
     const receiptId=crypto.randomUUID?crypto.randomUUID():`${Date.now()}-${Math.random()}`;
     prepared.forEach(x=>sales.push({...x,payment,timestamp,receiptId,registerId:KBCloud.KB_CLOUD.register}));
     localStorage.setItem("kb_sales",JSON.stringify(sales));
     receiptNo=receiptId.slice(0,8).toUpperCase();
   }
   paymentModal.classList.remove("is-open");
   successText.textContent=`Bon ${receiptNo} · ${currentItems.length} Artikel · ${euro(currentItems.reduce((a,x)=>a+x.price,0))} · ${payment}`;
   successModal.classList.add("is-open");
 }catch(e){
   console.error(e);
   alert("Der Verkauf konnte nicht gespeichert werden. Bitte Internetverbindung prüfen.");
 }finally{savingSale=false}
}
function newSale(){currentItems=[];render();successModal.classList.remove("is-open");nextArticle()}

sellerNumber.addEventListener("click",()=>setActive("seller"));price.addEventListener("click",()=>setActive("price"));
sizeButtons.forEach(b=>b.addEventListener("click",()=>selectSize(b.dataset.size)));toyButton.addEventListener("click",selectToy);
keypadButtons.forEach(b=>b.addEventListener("click",()=>{
 const k=b.dataset.key;
 if(k==="confirm"){
   if(activeInput==="seller"){
     if(checkSeller()){
       setActive("price");
       price.focus({preventScroll:true});
     }
   }else{
     if(valid()) saveItem();
   }
   return;
 }
 const field=activeInput==="seller"?sellerNumber:price;
 let v=field.value;
 if(k==="clear")v="";
 else if(k==="back")v=v.slice(0,-1);
 else if(k==="comma"){
   // Komma ist ausschließlich für die Preiseingabe. Falls noch die Verkäufernummer aktiv ist,
   // automatisch auf Preis wechseln, damit das Komma auf dem iPad zuverlässig funktioniert.
   if(activeInput!=="price"){
     setActive("price");
     v=price.value;
   }
   if(!/[,.]/.test(v)) v=v||"0,";
 }else{
   if(activeInput==="price"){
     // Falls ein Dezimaltrennzeichen vorhanden ist, maximal zwei Nachkommastellen zulassen.
     const normalized=v.replace(".",",");
     if(/[,.]/.test(normalized) && normalized.split(",")[1].length>=2) return;
   }
   v+=k;
 }
 field.value=v;
 if(activeInput==="seller")checkSeller();else update();
}));
addButton.addEventListener("click",saveItem);finishButton.addEventListener("click",showPayment);cancelEditButton.addEventListener("click",nextArticle);
closePayment.addEventListener("click",()=>paymentModal.classList.remove("is-open"));newSaleButton.addEventListener("click",newSale);
document.querySelectorAll(".payment").forEach(b=>b.addEventListener("click",()=>saveSale(b.dataset.payment)));
function getSelectedRegister(){
  const q=new URLSearchParams(window.location.search).get("kasse");
  if(q && /^[1-5]$/.test(q)){
    const r=`Kasse ${q}`;
    try{localStorage.setItem("kb_register",r);}catch(e){}
    return r;
  }
  return localStorage.getItem("kb_register") || "Kasse 1";
}

async function initCloud(){
  if(KBCloud.cloudReady()){
    try{sellers=(await KBCloud.cloudGetSellers()).map(s=>({...s,commissionEnabled:s.commission_enabled!==false,commissionRate:Number(s.commission_rate??15)}));}
    catch(e){console.error(e);alert("Cloud nicht erreichbar. Bitte Internetverbindung prüfen.");}
  }else{sellers=JSON.parse(localStorage.getItem("kb_sellers")||"[]").map(s=>({...s,commissionEnabled:s.commissionEnabled===undefined?true:s.commissionEnabled,commissionRate:Number(s.commissionRate??15)}));}
  const selectedRegister=getSelectedRegister();
  const title=document.getElementById("registerTitle");
  const pageTitle=document.getElementById("pageTitle");
  if(title) title.textContent=selectedRegister;
  if(pageTitle) pageTitle.textContent=selectedRegister;
  if(window.KBCloud && KBCloud.KB_CLOUD) KBCloud.KB_CLOUD.register=selectedRegister;
  KBCloud.cloudBanner();render();setActive("seller");
}
initCloud();
