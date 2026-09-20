const $=id=>document.getElementById(id);
const sellerNumber=$("sellerNumber"),sellerStatus=$("sellerStatus"),size=$("size"),toyButton=$("toyButton"),price=$("price");
const addButton=$("addButton"),finishButton=$("finishButton"),cancelEditButton=$("cancelEditButton"),articleTitle=$("articleTitle");
const receiptItems=$("receiptItems"),itemCount=$("itemCount"),liveTotal=$("liveTotal");
const paymentModal=$("paymentModal"),finalReceipt=$("finalReceipt"),finalTotal=$("finalTotal"),finalCount=$("finalCount");
const closePayment=$("closePayment"),successModal=$("successModal"),successText=$("successText"),newSaleButton=$("newSaleButton");
let isValidSeller=false,isToy=false,currentItems=[],editingIndex=null;

function sellers(){return JSON.parse(localStorage.getItem("kb_sellers")||"[]")}
function euro(v){return Number(v||0).toLocaleString("de-DE",{style:"currency",currency:"EUR"})}
function priceValue(){return parseFloat(price.value.replace(/\./g,"").replace(",","."))}
function checkSeller(){
  const n=sellerNumber.value.trim(); sellerNumber.classList.remove("valid","invalid"); sellerStatus.classList.remove("valid","invalid");
  if(!n){isValidSeller=false;sellerStatus.textContent="Bitte Verkäufernummer eingeben.";update();return}
  isValidSeller=sellers().some(x=>String(x.number)===n);
  sellerNumber.classList.add(isValidSeller?"valid":"invalid"); sellerStatus.classList.add(isValidSeller?"valid":"invalid");
  sellerStatus.textContent=isValidSeller?"✓ Verkäufernummer gefunden":"✕ Verkäufernummer nicht gefunden"; update();
}
function valid(){
  return isValidSeller && (isToy||/^[0-9]+$/.test(size.value.trim())) && priceValue()>0
}
function update(){addButton.disabled=!valid();finishButton.disabled=!(currentItems.length||valid())}
function toy(on){isToy=on;toyButton.classList.toggle("active",on);toyButton.setAttribute("aria-pressed",String(on));size.disabled=on;if(on)size.value="Spielzeug";else size.value=""}
function clearFields(){sellerNumber.value="";size.value="";price.value="";toy(false);sellerNumber.classList.remove("valid","invalid");sellerStatus.className="seller-status";sellerStatus.textContent="Bitte Verkäufernummer eingeben."}
function nextArticle(){editingIndex=null;articleTitle.textContent="Artikel eingeben";addButton.textContent="Weiterer Artikel";cancelEditButton.classList.add("hidden");clearFields();update();sellerNumber.focus()}
function saveItem(){
  checkSeller();
  if(!valid()) return false;
  const item={sellerNumber:sellerNumber.value.trim(),size:isToy?"Spielzeug":size.value.trim(),price:priceValue()};
  if(editingIndex===null) currentItems.push(item);
  else currentItems[editingIndex]=item;
  render();
  nextArticle();
  return true;
}
function editItem(i){
  const x=currentItems[i]; if(!x)return; editingIndex=i; articleTitle.textContent=`Artikel ${i+1} bearbeiten`;addButton.textContent="Änderung übernehmen";cancelEditButton.classList.remove("hidden");
  sellerNumber.value=x.sellerNumber;price.value=String(x.price).replace(".",",");toy(x.size==="Spielzeug");if(!isToy)size.value=x.size;checkSeller();sellerNumber.focus()
}
function deleteItem(i){currentItems.splice(i,1);if(editingIndex===i)nextArticle();render()}
function esc(v){return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function render(){
  itemCount.textContent=`${currentItems.length} Artikel`;
  receiptItems.innerHTML=currentItems.length?currentItems.map((x,i)=>`<div class="receipt-line"><div><b>Artikel ${i+1}</b><div class="receipt-line-meta">Verkäufer ${esc(x.sellerNumber)} · ${esc(x.size)}</div></div><b>${euro(x.price)}</b><button class="receipt-action" onclick="editItem(${i})">✎</button><button class="receipt-action receipt-delete" onclick="deleteItem(${i})">×</button></div>`).join(""):'<div class="receipt-empty">Noch keine Artikel.</div>';
  liveTotal.textContent=euro(currentItems.reduce((a,x)=>a+x.price,0));update()
}
function showPayment(){
  checkSeller();
  if(valid()) saveItem();
  if(!currentItems.length) return;
  finalCount.textContent=`${currentItems.length} Artikel`;
  finalReceipt.innerHTML=currentItems.map((x,i)=>`<div class="receipt-line"><div><b>Artikel ${i+1}</b><div class="receipt-line-meta">Verkäufer ${esc(x.sellerNumber)} · ${esc(x.size)}</div></div><b>${euro(x.price)}</b></div>`).join("");
  finalTotal.textContent=euro(currentItems.reduce((a,x)=>a+x.price,0));paymentModal.classList.add("is-open")
}
function saveSale(payment){
  const sales=JSON.parse(localStorage.getItem("kb_sales")||"[]"),time=new Date().toISOString();
  currentItems.forEach(x=>sales.push({...x,payment,timestamp:time}));localStorage.setItem("kb_sales",JSON.stringify(sales));
  const total=currentItems.reduce((a,x)=>a+x.price,0);paymentModal.classList.remove("is-open");successText.textContent=`${currentItems.length} Artikel · ${euro(total)} · ${payment}`;successModal.classList.add("is-open")
}
function newSale(){currentItems=[];render();successModal.classList.remove("is-open");nextArticle()}
sellerNumber.addEventListener("input",checkSeller);sellerNumber.addEventListener("blur",checkSeller);size.addEventListener("input",update);price.addEventListener("input",update);
sellerNumber.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();if(isValidSeller)size.focus()}});
size.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();if(isToy)price.focus();else if(/^[0-9]+$/.test(size.value.trim()))price.focus()}});
price.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();if(valid())saveItem()}});
toyButton.addEventListener("click",()=>{toy(!isToy);if(isToy)price.focus();update()});
function bindAction(button, handler){
  let lastTouch=0;
  button.addEventListener("touchend", e=>{
    e.preventDefault();
    lastTouch=Date.now();
    handler();
  }, {passive:false});
  button.addEventListener("click", e=>{
    if(Date.now()-lastTouch<700) return;
    handler();
  });
}
bindAction(addButton,saveItem);
bindAction(finishButton,showPayment);
bindAction(cancelEditButton,nextArticle);
bindAction(closePayment,()=>paymentModal.classList.remove("is-open"));
bindAction(newSaleButton,newSale);
document.querySelectorAll(".payment").forEach(b=>bindAction(b,()=>saveSale(b.dataset.payment)));
render();sellerNumber.focus();
