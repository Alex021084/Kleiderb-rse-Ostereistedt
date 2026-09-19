const $=id=>document.getElementById(id);

const sellerNumber=$("sellerNumber");
const sellerStatus=$("sellerStatus");
const size=$("size");
const toyButton=$("toyButton");
const price=$("price");
const addButton=$("addButton");
const finishButton=$("finishButton");

const receiptItems=$("receiptItems");
const itemCount=$("itemCount");
const liveTotal=$("liveTotal");

const paymentModal=$("paymentModal");
const finalReceipt=$("finalReceipt");
const finalTotal=$("finalTotal");
const finalCount=$("finalCount");
const closePayment=$("closePayment");

const successModal=$("successModal");
const successText=$("successText");
const newSaleButton=$("newSaleButton");

let isValidSeller=false;
let isToy=false;
let currentItems=[];

function getSellers(){
  return JSON.parse(localStorage.getItem("kb_sellers")||"[]");
}

function euro(value){
  return Number(value||0).toLocaleString("de-DE",{style:"currency",currency:"EUR"});
}

function numberValue(){
  return parseFloat(price.value.replace(/\./g,"").replace(",","."));
}

function checkSeller(){
  const number=sellerNumber.value.trim();

  sellerNumber.classList.remove("valid","invalid");
  sellerStatus.classList.remove("valid","invalid");

  if(!number){
    isValidSeller=false;
    sellerStatus.textContent="Bitte Verkäufernummer eingeben.";
    updateButtons();
    return;
  }

  const exists=getSellers().some(s=>String(s.number)===number);

  if(exists){
    isValidSeller=true;
    sellerNumber.classList.add("valid");
    sellerStatus.classList.add("valid");
    sellerStatus.textContent="✓ Verkäufernummer gefunden";
  }else{
    isValidSeller=false;
    sellerNumber.classList.add("invalid");
    sellerStatus.classList.add("invalid");
    sellerStatus.textContent="✕ Verkäufernummer nicht gefunden";
  }
  updateButtons();
}

function currentItemValid(){
  const hasPrice=numberValue()>0;
  const hasSize=isToy || /^[0-9]+$/.test(size.value.trim());
  return isValidSeller && hasSize && hasPrice;
}

function updateButtons(){
  const valid=currentItemValid();
  addButton.disabled=!valid;
  finishButton.disabled=!(currentItems.length>0 || valid);
}

function resetItemFields(){
  sellerNumber.value="";
  size.value="";
  price.value="";
  isToy=false;
  toyButton.classList.remove("active");
  toyButton.setAttribute("aria-pressed","false");
  size.disabled=false;
  sellerNumber.classList.remove("valid","invalid");
  sellerStatus.classList.remove("valid","invalid");
  sellerStatus.textContent="Bitte Verkäufernummer eingeben.";
  sellerNumber.focus();
  updateButtons();
}

function addCurrentItem(){
  if(!currentItemValid()) return;

  currentItems.push({
    sellerNumber:sellerNumber.value.trim(),
    size:isToy ? "Spielzeug" : size.value.trim(),
    price:numberValue()
  });

  renderReceipt();
  resetItemFields();
}

function renderReceipt(){
  itemCount.textContent=`${currentItems.length} ${currentItems.length===1?"Artikel":"Artikel"}`;

  if(!currentItems.length){
    receiptItems.innerHTML='<div class="receipt-empty">Noch keine Artikel.</div>';
  }else{
    receiptItems.innerHTML=currentItems.map((item,index)=>`
      <div class="receipt-line">
        <div class="receipt-line-main">
          <div class="receipt-line-title">Artikel ${index+1}</div>
          <div class="receipt-line-meta">Verkäufer ${escapeHtml(item.sellerNumber)} · ${escapeHtml(item.size)}</div>
        </div>
        <div class="receipt-line-price">${euro(item.price)}</div>
      </div>
    `).join("");
  }

  const total=currentItems.reduce((sum,item)=>sum+item.price,0);
  liveTotal.textContent=euro(total);
  updateButtons();
}

function escapeHtml(value){
  return String(value).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
}

function showPayment(){
  if(currentItemValid()){
    addCurrentItem();
  }
  if(!currentItems.length) return;

  finalCount.textContent=`${currentItems.length} ${currentItems.length===1?"Artikel":"Artikel"}`;
  finalReceipt.innerHTML=currentItems.map((item,index)=>`
    <div class="receipt-line">
      <div class="receipt-line-main">
        <div class="receipt-line-title">Artikel ${index+1}</div>
        <div class="receipt-line-meta">Verkäufer ${escapeHtml(item.sellerNumber)} · ${escapeHtml(item.size)}</div>
      </div>
      <div class="receipt-line-price">${euro(item.price)}</div>
    </div>
  `).join("");

  const total=currentItems.reduce((sum,item)=>sum+item.price,0);
  finalTotal.textContent=euro(total);
  paymentModal.classList.add("is-open");
}

function saveSale(paymentType){
  const sales=JSON.parse(localStorage.getItem("kb_sales")||"[]");
  const timestamp=new Date().toISOString();

  currentItems.forEach(item=>{
    sales.push({
      sellerNumber:item.sellerNumber,
      size:item.size,
      price:item.price,
      payment:paymentType,
      timestamp
    });
  });

  localStorage.setItem("kb_sales",JSON.stringify(sales));

  const total=currentItems.reduce((sum,item)=>sum+item.price,0);
  paymentModal.classList.remove("is-open");
  successText.textContent=`${currentItems.length} ${currentItems.length===1?"Artikel":"Artikel"} · ${euro(total)} · ${paymentType}`;
  successModal.classList.add("is-open");
}

function resetSale(){
  currentItems=[];
  renderReceipt();
  successModal.classList.remove("is-open");
  resetItemFields();
}

sellerNumber.addEventListener("input",checkSeller);
sellerNumber.addEventListener("blur",checkSeller);
size.addEventListener("input",updateButtons);
price.addEventListener("input",updateButtons);

toyButton.addEventListener("click",()=>{
  isToy=!isToy;
  toyButton.classList.toggle("active",isToy);
  toyButton.setAttribute("aria-pressed",String(isToy));

  if(isToy){
    size.value="Spielzeug";
    size.disabled=true;
  }else{
    size.value="";
    size.disabled=false;
    size.focus();
  }
  updateButtons();
});

addButton.addEventListener("click",addCurrentItem);
finishButton.addEventListener("click",showPayment);
closePayment.addEventListener("click",()=>paymentModal.classList.add("hidden"));
newSaleButton.addEventListener("click",resetSale);

document.querySelectorAll(".payment").forEach(button=>{
  button.addEventListener("click",()=>saveSale(button.dataset.payment));
});

renderReceipt();
sellerNumber.focus();
