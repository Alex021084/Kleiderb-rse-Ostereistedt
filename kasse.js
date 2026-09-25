const $=id=>document.getElementById(id);
const sellerNumber=$("sellerNumber"),sellerStatus=$("sellerStatus"),price=$("price"),toyButton=$("toyButton"),shoeButton=$("shoeButton");
const sizeButtons=[...document.querySelectorAll(".size-button")],keypadButtons=[...document.querySelectorAll(".right-panel .keypad button")];
const addButton=$("addButton"),finishButton=$("finishButton"),cancelEditButton=$("cancelEditButton"),articleTitle=$("articleTitle"),activeField=$("activeField");
const receiptItems=$("receiptItems"),itemCount=$("itemCount"),liveTotal=$("liveTotal");
const paymentModal=$("paymentModal"),finalReceipt=$("finalReceipt"),finalTotal=$("finalTotal"),finalCount=$("finalCount"),closePayment=$("closePayment");
const successModal=$("successModal"),successText=$("successText"),newSaleButton=$("newSaleButton");
const mobileKeypadModal=$("mobileKeypadModal"),mobileKeypadTitle=$("mobileKeypadTitle"),mobileSellerStatus=$("mobileSellerStatus"),mobilePriceValue=$("mobilePriceValue"),closeMobileKeypad=$("closeMobileKeypad");
const unassignedButton=$("unassignedButton"),unassignedModal=$("unassignedModal"),unassignedNoteInput=$("unassignedNote"),unassignedPhotoInput=$("unassignedPhoto"),unassignedPhotoPreview=$("unassignedPhotoPreview"),photoStatus=$("photoStatus"),closeUnassigned=$("closeUnassigned"),cancelUnassigned=$("cancelUnassigned"),saveUnassigned=$("saveUnassigned");
const openUnassignedList=$("openUnassignedList"),unassignedListModal=$("unassignedListModal"),closeUnassignedList=$("closeUnassignedList"),unassignedList=$("unassignedList"),unassignedListCount=$("unassignedListCount");
const shoeModal=$("shoeModal"),closeShoe=$("closeShoe"),shoeSizeButtons=[...document.querySelectorAll("[data-shoe-size]")];
let currentItems=[],editingIndex=null,isToy=false,isShoe=false,shoeSize="",activeInput="seller",sellers=[],savingSale=false,unassignedMode=false,unassignedNote="",unassignedPhoto="";

function getSellers(){return sellers.length?sellers:JSON.parse(localStorage.getItem("kb_sellers")||"[]")}
function euro(v){return Number(v||0).toLocaleString("de-DE",{style:"currency",currency:"EUR"})}
function priceValue(){
 const raw=String(price.value||"").trim().replace(/\./g,",").replace(",", ".");
 return Number(raw)||0;
}
function setActive(n){activeInput=n;activeField.textContent=n==="seller"?"Verkäufernummer":"Preis";sellerNumber.classList.toggle("active",n==="seller"&&!unassignedMode);price.classList.toggle("active",n==="price")}
function checkSeller(){
 if(unassignedMode){sellerNumber.classList.remove("valid","invalid");sellerStatus.className="seller-status";sellerStatus.textContent=unassignedNote?`Nicht zugeordnet · ${unassignedNote}`:"Nicht zugeordnet";update();return true}
 const n=sellerNumber.value.trim();sellerNumber.classList.remove("valid","invalid");sellerStatus.classList.remove("valid","invalid");
 if(!n){sellerStatus.textContent="Bitte Verkäufernummer eingeben.";update();return false}
 const seller=getSellers().find(s=>String(s.number)===n);
 const ok=!!seller;
 sellerNumber.classList.add(ok?"valid":"invalid");sellerStatus.classList.add(ok?"valid":"invalid");
 sellerStatus.textContent=ok?`✓ Verkäufernummer gefunden${String(seller.name||"").trim()?` · ${String(seller.name).trim()}`:""}`:"✕ Verkäufernummer nicht gefunden";update();return ok
}
function currentSize(){const s=document.querySelector(".size-button.selected");return isShoe?(shoeSize?`Schuhe ${shoeSize}`:""):isToy?"Spielzeug":(s?s.dataset.size:"")}
function valid(){return (unassignedMode || getSellers().some(s=>String(s.number)===sellerNumber.value.trim()))&&!!currentSize()&&priceValue()>0}
function update(){const sellerOk=unassignedMode||getSellers().some(s=>String(s.number)===sellerNumber.value.trim());const ok=sellerOk&&currentSize()&&priceValue()>0;addButton.disabled=!ok;finishButton.disabled=!(currentItems.length||ok)}
function selectSize(v){isToy=false;isShoe=false;shoeSize="";toyButton.classList.remove("active");shoeButton.classList.remove("active");sizeButtons.forEach(b=>b.classList.toggle("selected",b.dataset.size===String(v)));setActive("price");update()}
function selectToy(){isToy=!isToy;isShoe=false;shoeSize="";toyButton.classList.toggle("active",isToy);shoeButton.classList.remove("active");if(isToy)sizeButtons.forEach(b=>b.classList.remove("selected"));setActive("price");update()}
function openShoe(){shoeModal.classList.add("is-open")}
function selectShoe(v){isShoe=true;isToy=false;shoeSize=String(v);shoeButton.classList.add("active");toyButton.classList.remove("active");sizeButtons.forEach(b=>b.classList.remove("selected"));shoeModal.classList.remove("is-open");setActive("price");update()}
function clearFields(){sellerNumber.value="";price.value="";unassignedMode=false;unassignedNote="";unassignedPhoto="";unassignedPhotoInput.value="";unassignedPhotoPreview.src="";unassignedPhotoPreview.classList.add("hidden");photoStatus.textContent="Kein Foto";isShoe=false;shoeSize="";unassignedButton.classList.remove("active");unassignedButton.textContent="＋ Ohne Verkäufernummer";sellerNumber.disabled=false;sellerNumber.placeholder="Verkäufernummer auswählen";sizeButtons.forEach(b=>b.classList.remove("selected"));isToy=false;isShoe=false;shoeSize="";toyButton.classList.remove("active");shoeButton.classList.remove("active");sellerNumber.classList.remove("valid","invalid");sellerStatus.className="seller-status";sellerStatus.textContent="Bitte Verkäufernummer eingeben.";setActive("seller")}
function nextArticle(){editingIndex=null;articleTitle.textContent="Artikel eingeben";addButton.textContent="Weiterer Artikel";cancelEditButton.classList.add("hidden");clearFields();update()}
function saveItem(){if(!valid())return false;const item={sellerNumber:unassignedMode?"":sellerNumber.value.trim(),unassignedNote:unassignedMode?String(unassignedNote||"").trim():"",unassignedPhoto:unassignedMode?String(unassignedPhoto||""):"",size:currentSize(),price:priceValue()};if(editingIndex===null)currentItems.push(item);else currentItems[editingIndex]=item;render();nextArticle();return true}
function editItem(i){const x=currentItems[i];editingIndex=i;unassignedMode=!x.sellerNumber;unassignedNote=String(x.unassignedNote||"");unassignedPhoto=String(x.unassignedPhoto||"");setPhotoPreview(unassignedPhoto);unassignedButton.classList.toggle("active",unassignedMode);unassignedButton.textContent=unassignedMode?"✓ Ohne Verkäufernummer":"＋ Ohne Verkäufernummer";sellerNumber.disabled=unassignedMode;sellerNumber.placeholder=unassignedMode?"Nicht zugeordnet":"Verkäufernummer auswählen";articleTitle.textContent=`Artikel ${i+1} bearbeiten`;addButton.textContent="Änderung übernehmen";cancelEditButton.classList.remove("hidden");sellerNumber.value=x.sellerNumber||"";price.value=String(x.price).replace(".",",");if(x.size==="Spielzeug"){isToy=false;selectToy()}else if(String(x.size||"").startsWith("Schuhe ")){isToy=false;isShoe=true;shoeSize=String(x.size).replace(/^Schuhe\s*/,"");shoeButton.classList.add("active");toyButton.classList.remove("active");sizeButtons.forEach(b=>b.classList.remove("selected"));setActive("seller")}else{isToy=false;isShoe=false;shoeSize="";toyButton.classList.remove("active");shoeButton.classList.remove("active");sizeButtons.forEach(b=>b.classList.toggle("selected",b.dataset.size===x.size));setActive("seller")}checkSeller();update()}
function deleteItem(i){currentItems.splice(i,1);if(editingIndex===i)nextArticle();render()}
function esc(v){return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function render(){
 itemCount.textContent=`${currentItems.length} ${currentItems.length===1?"Artikel":"Artikel"}`;
 receiptItems.innerHTML=currentItems.length?currentItems.map((x,i)=>{
   const who=x.sellerNumber?`Verkäufer ${esc(x.sellerNumber)}`:`<span class="unassigned-meta">Nicht zugeordnet${x.unassignedNote?` · ${esc(x.unassignedNote)}`:""}${x.unassignedPhoto?" · 📷":""}</span>`;
   return `<div class="receipt-line"><div><b>Artikel ${i+1}</b><div class="receipt-line-meta">${who} · ${esc(x.size)}</div></div><b>${euro(x.price)}</b><button type="button" class="receipt-action" onclick="editItem(${i})">✎</button><button type="button" class="receipt-action receipt-delete" onclick="deleteItem(${i})">×</button></div>`;
 }).join(""):'<div class="receipt-empty">Noch keine Artikel.</div>';
 liveTotal.textContent=euro(currentItems.reduce((a,x)=>a+x.price,0));update()
}
function showPayment(){if(valid())saveItem();if(!currentItems.length)return;finalCount.textContent=`${currentItems.length} Artikel`;finalReceipt.innerHTML=currentItems.map((x,i)=>{const who=x.sellerNumber?`Verkäufer ${esc(x.sellerNumber)}`:`<span class="unassigned-meta">Nicht zugeordnet${x.unassignedNote?` · ${esc(x.unassignedNote)}`:""}${x.unassignedPhoto?" · 📷":""}</span>`;return `<div class="receipt-line"><div><b>Artikel ${i+1}</b><div class="receipt-line-meta">${who} · ${esc(x.size)}</div></div><b>${euro(x.price)}</b></div>`}).join("");finalTotal.textContent=euro(currentItems.reduce((a,x)=>a+x.price,0));paymentModal.classList.add("is-open")}
async function saveSale(payment){
 if(savingSale)return;
 if(!currentItems.length)return;
 savingSale=true;
 try{
   const prepared=currentItems.map(x=>{
     const seller=getSellers().find(s=>String(s.number)===String(x.sellerNumber));
     const commissionEnabled=x.sellerNumber ? (seller?seller.commissionEnabled===true:true) : false;
     const commissionRate=x.sellerNumber && commissionEnabled ? Number(seller?.commissionRate??15)/100:0;
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

async function loadUnassignedItems(){
  const register=KBCloud.KB_CLOUD.register || localStorage.getItem("kb_register") || "Kasse 1";
  let rows=[];
  if(KBCloud.cloudReady()){
    const receipts=await KBCloud.cloudGetReceipts();
    receipts.filter(r=>String(r.register_id)===String(register)).forEach(r=>{
      (r.receipt_items||[]).filter(x=>!x.seller_number).forEach(x=>rows.push({...x,receipt_id:r.id,receipt_no:r.receipt_no||r.receipt_no||r.id,register_id:r.register_id}));
    });
  }else{
    const sales=JSON.parse(localStorage.getItem("kb_sales")||"[]");
    sales.filter(x=>String(x.registerId||"")===String(register)&&!x.sellerNumber).forEach(x=>rows.push({...x}));
  }
  return rows;
}
function openUnassigned(){unassignedNoteInput.value=unassignedNote||"";setPhotoPreview(unassignedPhoto||"");unassignedModal.classList.add("is-open");setTimeout(()=>unassignedNoteInput.focus(),50)}
function closeUnassignedModal(){unassignedModal.classList.remove("is-open")}
function openUnassignedItems(){unassignedListModal.classList.add("is-open");renderUnassignedList()}
function closeUnassignedItems(){unassignedListModal.classList.remove("is-open")}
async function renderUnassignedList(){
  unassignedList.innerHTML='<div class="unassigned-loading">Lade offene Artikel …</div>';
  try{
    const rows=await loadUnassignedItems();
    unassignedListCount.textContent=`${rows.length} ${rows.length===1?'Artikel':'Artikel'} · ${KBCloud.KB_CLOUD.register||'Kasse 1'}`;
    if(!rows.length){unassignedList.innerHTML='<div class="unassigned-empty">Keine offenen Artikel in dieser Kasse.</div>';return;}
    unassignedList.innerHTML=rows.map((x,i)=>{
      const photo=x.unassigned_photo||x.unassignedPhoto||'';
      const note=x.unassigned_note||x.unassignedNote||'Keine Notiz';
      return `<div class="unassigned-card" data-row="${i}">
        <div class="unassigned-card-main">
          ${photo?`<img class="unassigned-card-photo" src="${esc(photo)}" alt="Foto">`:``}
          <div class="unassigned-card-info">
            <div class="unassigned-card-top"><b>${esc(x.size)}</b><strong>${euro(x.price)}</strong></div>
            <div class="unassigned-card-note">${esc(note)}</div>
            <div class="unassigned-card-meta">Bon: ${esc(x.receipt_no||x.receiptId||'–')}</div>
          </div>
        </div>
        <div class="assign-row"><input class="assign-input" inputmode="numeric" type="text" placeholder="Verkäufernummer"><button class="assign-button" type="button">Zuordnen</button></div>
      </div>`;
    }).join('');
    [...unassignedList.querySelectorAll('.unassigned-card')].forEach((card,i)=>{
      card.querySelector('.assign-button').addEventListener('click',()=>assignUnassigned(rows[i],card.querySelector('.assign-input').value.trim()));
    });
  }catch(e){console.error(e);unassignedList.innerHTML='<div class="unassigned-empty">Die offenen Artikel konnten nicht geladen werden.</div>';}
}
async function assignUnassigned(row,number){
  if(!number){alert('Bitte Verkäufernummer eingeben.');return;}
  const seller=getSellers().find(s=>String(s.number)===String(number));
  if(!seller){alert('Verkäufernummer nicht gefunden.');return;}
  const enabled=seller.commissionEnabled===true;
  const rate=enabled?Number(seller.commissionRate??15)/100:0;
  try{
    if(KBCloud.cloudReady()){
      await KBCloud.cloudUpdateReceiptItem(row.id,{seller_number:String(number),unassigned_note:'',unassigned_photo:'',commission_enabled:enabled,commission_rate:rate});
    }else{
      const sales=JSON.parse(localStorage.getItem('kb_sales')||'[]');
      const idx=sales.findIndex(x=>String(x.receiptId)===String(row.receiptId||row.receipt_id) && Number(x.price)===Number(row.price) && String(x.size)===String(row.size) && !x.sellerNumber);
      if(idx<0){alert('Artikel nicht gefunden.');return;}
      sales[idx].sellerNumber=String(number);sales[idx].unassignedNote='';sales[idx].commissionEnabled=enabled;sales[idx].commissionRate=rate;localStorage.setItem('kb_sales',JSON.stringify(sales));
    }
    await renderUnassignedList();
  }catch(e){console.error(e);alert('Die Zuordnung konnte nicht gespeichert werden.');}
}
function setPhotoPreview(data){unassignedPhoto=data||"";if(unassignedPhoto){unassignedPhotoPreview.src=unassignedPhoto;unassignedPhotoPreview.classList.remove("hidden");photoStatus.textContent="Foto vorhanden";}else{unassignedPhotoPreview.src="";unassignedPhotoPreview.classList.add("hidden");photoStatus.textContent="Kein Foto";}}
function resizePhoto(file){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>{const img=new Image();img.onload=()=>{const max=900,scale=Math.min(1,max/Math.max(img.width,img.height)),w=Math.max(1,Math.round(img.width*scale)),h=Math.max(1,Math.round(img.height*scale));const c=document.createElement("canvas");c.width=w;c.height=h;c.getContext("2d").drawImage(img,0,0,w,h);resolve(c.toDataURL("image/jpeg",0.72));};img.onerror=reject;img.src=reader.result;};reader.onerror=reject;reader.readAsDataURL(file);});}
unassignedPhotoInput.addEventListener("change",async()=>{const file=unassignedPhotoInput.files&&unassignedPhotoInput.files[0];if(!file)return;try{setPhotoPreview(await resizePhoto(file));}catch(e){console.error(e);alert("Das Foto konnte nicht verarbeitet werden.");}});
function applyUnassigned(){unassignedMode=true;unassignedNote=String(unassignedNoteInput.value||"").trim();sellerNumber.value="";sellerNumber.disabled=true;sellerNumber.placeholder="Nicht zugeordnet";sellerNumber.classList.remove("valid","invalid");unassignedButton.classList.add("active");unassignedButton.textContent="✓ Ohne Verkäufernummer";sellerStatus.className="seller-status";sellerStatus.textContent=unassignedNote?`Nicht zugeordnet · ${unassignedNote}`:"Nicht zugeordnet";setActive("price");closeUnassignedModal();update()}
unassignedButton.addEventListener("click",openUnassigned);openUnassignedList.addEventListener("click",openUnassignedItems);closeUnassignedList.addEventListener("click",closeUnassignedItems);closeUnassigned.addEventListener("click",closeUnassignedModal);cancelUnassigned.addEventListener("click",closeUnassignedModal);saveUnassigned.addEventListener("click",applyUnassigned);
function mobilePortrait(){return window.matchMedia("(max-width:700px) and (orientation:portrait) and (pointer:coarse)").matches;}
function updateMobileSellerStatus(){
  if(!mobileSellerStatus)return;
  if(activeInput!=="seller" || unassignedMode){
    mobileSellerStatus.textContent="";
    mobileSellerStatus.className="mobile-seller-status";
    return;
  }
  const n=sellerNumber.value.trim();
  if(!n){
    mobileSellerStatus.textContent="Bitte Verkäufernummer eingeben.";
    mobileSellerStatus.className="mobile-seller-status";
    return;
  }
  const seller=getSellers().find(s=>String(s.number)===n);
  if(seller){
    mobileSellerStatus.textContent=`✓ Verkäufernummer gefunden${String(seller.name||"").trim()?` · ${String(seller.name).trim()}`:""}`;
    mobileSellerStatus.className="mobile-seller-status valid";
  }else{
    mobileSellerStatus.textContent="✕ Verkäufernummer nicht gefunden";
    mobileSellerStatus.className="mobile-seller-status invalid";
  }
}
function openMobileKeypad(field){
  if(!mobilePortrait() || !mobileKeypadModal)return;
  setActive(field);
  if(mobileKeypadTitle)mobileKeypadTitle.textContent=field==="seller"?"Verkäufernummer":"Preis";
  if(mobilePriceValue){ mobilePriceValue.classList.toggle("show",field==="price"); mobilePriceValue.textContent=euro(priceValue()); }
  updateMobileSellerStatus();
  mobileKeypadModal.classList.add("is-open");
}
function closeMobileKeypadModal(){if(mobileKeypadModal)mobileKeypadModal.classList.remove("is-open");}
sellerNumber.addEventListener("click",()=>openMobileKeypad("seller"));
sellerNumber.addEventListener("pointerup",()=>openMobileKeypad("seller"));
price.addEventListener("click",()=>openMobileKeypad("price"));
price.addEventListener("pointerup",()=>openMobileKeypad("price"));
if(closeMobileKeypad)closeMobileKeypad.addEventListener("click",closeMobileKeypadModal);
if(mobileKeypadModal)mobileKeypadModal.addEventListener("click",e=>{if(e.target===mobileKeypadModal)closeMobileKeypadModal()});
sizeButtons.forEach(b=>b.addEventListener("click",()=>selectSize(b.dataset.size)));toyButton.addEventListener("click",selectToy);shoeButton.addEventListener("click",openShoe);closeShoe.addEventListener("click",()=>shoeModal.classList.remove("is-open"));shoeSizeButtons.forEach(b=>b.addEventListener("click",()=>selectShoe(b.dataset.shoeSize)));

const mobileKeypadButtons=[...document.querySelectorAll("#mobileKeypadModal .keypad button")];
mobileKeypadButtons.forEach(b=>b.addEventListener("click",()=>{
 const k=b.dataset.key;
 if(k==="confirm"){
   if(activeInput==="seller"&&!unassignedMode){
     if(checkSeller()){
       closeMobileKeypadModal();
       setActive("price");
     }
   }else if(valid()){
     closeMobileKeypadModal();
     setActive("price");
   }
   return;
 }
 const field=activeInput==="seller"&&!unassignedMode?sellerNumber:price;
 let v=field.value;
 if(k==="clear")v="";
 else if(k==="back")v=v.slice(0,-1);
 else if(k==="comma"){
   if(activeInput==="price"&&!/[,.]/.test(v))v=v?v+"," : "0,";
 }else{
   if(activeInput==="price"){
     const normalized=v.replace(".",",");
     if(/[,.]/.test(normalized)&&normalized.split(",")[1].length>=2)return;
   }
   v+=k;
 }
 field.value=v;
 if(activeInput==="seller"){checkSeller();updateMobileSellerStatus();}else update();
}));
keypadButtons.forEach(b=>b.addEventListener("click",()=>{
 const k=b.dataset.key;
 if(k==="confirm"){
   if(activeInput==="seller" && !unassignedMode){
     if(checkSeller()){
       setActive("price");
       price.focus({preventScroll:true});
     }
   }else{
     if(valid()){saveItem();closeMobileKeypadModal();}
   }
   return;
 }
 const field=activeInput==="seller"&&!unassignedMode?sellerNumber:price;
 let v=field.value;
 if(k==="clear")v="";
 else if(k==="back")v=v.slice(0,-1);
 else if(k==="comma"){
   // Dezimal-Komma: einmal pro Preis erlauben, auch bei leerem Feld.
   if(activeInput==="price"&&!/[,.]/.test(v)) v=v ? v+"," : "0,";
 }else{
   if(activeInput==="price"){
     // Falls ein Dezimaltrennzeichen vorhanden ist, maximal zwei Nachkommastellen zulassen.
     const normalized=v.replace(".",",");
     if(/[,.]/.test(normalized) && normalized.split(",")[1].length>=2) return;
   }
   v+=k;
 }
 if(activeInput==="price" && k==="comma" && !v.includes(",")) v=v.replace(".",",");
 field.value=v;
 if(activeInput==="seller")checkSeller();else { update(); if(mobilePriceValue){ mobilePriceValue.textContent=euro(priceValue()); mobilePriceValue.classList.add("show"); } }
}));
addButton.addEventListener("click",saveItem);finishButton.addEventListener("click",showPayment);cancelEditButton.addEventListener("click",nextArticle);
closePayment.addEventListener("click",()=>paymentModal.classList.remove("is-open"));newSaleButton.addEventListener("click",newSale);
document.querySelectorAll(".payment").forEach(b=>b.addEventListener("click",()=>saveSale(b.dataset.payment)));
function getSelectedRegister(){
  const q=new URLSearchParams(window.location.search).get("kasse");
  if(q && /^[1-6]$/.test(q)){
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
