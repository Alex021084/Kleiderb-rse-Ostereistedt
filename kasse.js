const $=id=>document.getElementById(id);

const sellerNumber=$("sellerNumber"), sellerStatus=$("sellerStatus");
const price=$("price"), toyButton=$("toyButton");
const sizeButtons=[...document.querySelectorAll(".size-button")];
const keypadButtons=[...document.querySelectorAll(".keypad button")];
const addButton=$("addButton"), finishButton=$("finishButton"), cancelEditButton=$("cancelEditButton");
const articleTitle=$("articleTitle"), activeField=$("activeField");
const receiptItems=$("receiptItems"), itemCount=$("itemCount"), liveTotal=$("liveTotal");
const paymentModal=$("paymentModal"), finalReceipt=$("finalReceipt"), finalTotal=$("finalTotal"), finalCount=$("finalCount");
const closePayment=$("closePayment"), successModal=$("successModal"), successText=$("successText"), newSaleButton=$("newSaleButton");

let currentItems=[], editingIndex=null, isToy=false, activeInput="seller";

function getSellers(){return JSON.parse(localStorage.getItem("kb_sellers")||"[]")}
function euro(v){return Number(v||0).toLocaleString("de-DE",{style:"currency",currency:"EUR"})}
function priceValue(){return parseFloat(price.value.replace(/\./g,"").replace(",","."))}

function setActiveInput(name){
  activeInput=name;
  sellerNumber.classList.toggle("active",name==="seller");
  price.classList.toggle("active",name==="price");
  activeField.textContent=name==="seller"?"Eingabe: Verkäufernummer":"Eingabe: Preis";
}

function checkSeller(){
  const n=sellerNumber.value.trim();
  sellerNumber.classList.remove("valid","invalid");
  sellerStatus.classList.remove("valid","invalid");
  if(!n){sellerStatus.textContent="Bitte Verkäufernummer eingeben."; update(); return false}
  const ok=getSellers().some(s=>String(s.number)===n);
  sellerNumber.classList.add(ok?"valid":"invalid");
  sellerStatus.classList.add(ok?"valid":"invalid");
  sellerStatus.textContent=ok?"✓ Verkäufernummer gefunden":"✕ Verkäufernummer nicht gefunden";
  update();
  return ok;
}

function currentSize(){
  const selected=document.querySelector(".size-button.selected");
  return isToy?"Spielzeug":(selected?selected.dataset.size:"");
}
function valid(){
  return checkSeller() && !!currentSize() && priceValue()>0;
}
function update(){
  const ok=(sellerNumber.value.trim()!="" && !!currentSize() && priceValue()>0 && getSellers().some(s=>String(s.number)===sellerNumber.value.trim()));
  addButton.disabled=!ok;
  finishButton.disabled=!(currentItems.length>0 || ok);
}

function selectSize(value){
  isToy=false;
  toyButton.classList.remove("active");
  toyButton.setAttribute("aria-pressed","false");
  sizeButtons.forEach(b=>b.classList.toggle("selected",b.dataset.size===String(value)));
  setActiveInput("price");
  update();
}
function selectToy(){
  isToy=!isToy;
  toyButton.classList.toggle("active",isToy);
  toyButton.setAttribute("aria-pressed",String(isToy));
  if(isToy) sizeButtons.forEach(b=>b.classList.remove("selected"));
  setActiveInput("price");
  update();
}

function clearFields(){
  sellerNumber.value="";price.value="";
  sizeButtons.forEach(b=>b.classList.remove("selected"));
  isToy=false;toyButton.classList.remove("active");toyButton.setAttribute("aria-pressed","false");
  sellerNumber.classList.remove("valid","invalid");sellerStatus.className="seller-status";
  sellerStatus.textContent="Bitte Verkäufernummer eingeben.";
  setActiveInput("seller");
}
function nextArticle(){
  editingIndex=null;articleTitle.textContent="Artikel eingeben";addButton.textContent="Weiterer Artikel";
  cancelEditButton.classList.add("hidden");clearFields();update();
}
function saveItem(){
  if(!valid())return false;
  const item={sellerNumber:sellerNumber.value.trim(),size:currentSize(),price:priceValue()};
  if(editingIndex===null)currentItems.push(item);else currentItems[editingIndex]=item;
  render();nextArticle();return true;
}
function editItem(i){
  const x=currentItems[i];if(!x)return;
  editingIndex=i;articleTitle.textContent=`Artikel ${i+1} bearbeiten`;addButton.textContent="Änderung übernehmen";
  cancelEditButton.classList.remove("hidden");
  sellerNumber.value=x.sellerNumber;price.value=String(x.price).replace(".",",");
  if(x.size==="Spielzeug"){isToy=false;selectToy()}else{isToy=false;toyButton.classList.remove("active");sizeButtons.forEach(b=>b.classList.toggle("selected",b.dataset.size===x.size));setActiveInput("seller")}
  checkSeller();update();
}
function deleteItem(i){currentItems.splice(i,1);if(editingIndex===i)nextArticle();render()}
function esc(v){return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function render(){
  itemCount.textContent=`${currentItems.length} ${currentItems.length===1?"Artikel":"Artikel"}`;
  receiptItems.innerHTML=currentItems.length?currentItems.map((x,i)=>`
    <div class="receipt-line">
      <div><b>Artikel ${i+1}</b><div class="receipt-line-meta">Verkäufer ${esc(x.sellerNumber)} · ${esc(x.size)}</div></div>
      <b>${euro(x.price)}</b>
      <button type="button" class="receipt-action" onclick="editItem(${i})">✎</button>
      <button type="button" class="receipt-action receipt-delete" onclick="deleteItem(${i})">×</button>
    </div>`).join(""):'<div class="receipt-empty">Noch keine Artikel.</div>';
  liveTotal.textContent=euro(currentItems.reduce((a,x)=>a+x.price,0));update();
}
function showPayment(){
  if((sellerNumber.value.trim()||price.value)&&valid())saveItem();
  if(!currentItems.length)return;
  finalCount.textContent=`${currentItems.length} Artikel`;
  finalReceipt.innerHTML=currentItems.map((x,i)=>`<div class="receipt-line"><div><b>Artikel ${i+1}</b><div class="receipt-line-meta">Verkäufer ${esc(x.sellerNumber)} · ${esc(x.size)}</div></div><b>${euro(x.price)}</b></div>`).join("");
  finalTotal.textContent=euro(currentItems.reduce((a,x)=>a+x.price,0));paymentModal.classList.add("is-open");
}
function saveSale(payment){
  const sales=JSON.parse(localStorage.getItem("kb_sales")||"[]"),timestamp=new Date().toISOString();
  currentItems.forEach(x=>sales.push({...x,payment,timestamp}));
  localStorage.setItem("kb_sales",JSON.stringify(sales));
  paymentModal.classList.remove("is-open");
  successText.textContent=`${currentItems.length} Artikel · ${euro(currentItems.reduce((a,x)=>a+x.price,0))} · ${payment}`;
  successModal.classList.add("is-open");
}
function newSale(){currentItems=[];render();successModal.classList.remove("is-open");nextArticle()}

sellerNumber.addEventListener("click",()=>setActiveInput("seller"));
price.addEventListener("click",()=>setActiveInput("price"));

sizeButtons.forEach(b=>b.addEventListener("click",()=>selectSize(b.dataset.size)));
toyButton.addEventListener("click",selectToy);

keypadButtons.forEach(b=>b.addEventListener("click",()=>{
  const k=b.dataset.key;
  const field=activeInput==="seller"?sellerNumber:price;
  let v=field.value;
  if(k==="clear")v="";
  else if(k==="back")v=v.slice(0,-1);
  else if(k==="comma"){
    if(activeInput==="price" && !v.includes(","))v=v||"0,";
  }else{
    if(activeInput==="price" && v.includes(",")){
      const parts=v.split(",");
      if(parts[1].length>=2)return;
    }
    v+=k;
  }
  field.value=v;
  if(activeInput==="seller")checkSeller();else update();
}));

addButton.addEventListener("click",saveItem);
finishButton.addEventListener("click",showPayment);
cancelEditButton.addEventListener("click",nextArticle);
closePayment.addEventListener("click",()=>paymentModal.classList.remove("is-open"));
newSaleButton.addEventListener("click",newSale);
document.querySelectorAll(".payment").forEach(b=>b.addEventListener("click",()=>saveSale(b.dataset.payment)));

render();setActiveInput("seller");
