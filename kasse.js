const $=id=>document.getElementById(id);

const sellerNumber=$("sellerNumber");
const sellerStatus=$("sellerStatus");
const size=$("size");
const toyButton=$("toyButton");
const price=$("price");
const continueButton=$("continueButton");

let isValidSeller=false;
let isToy=false;

function getSellers(){
  return JSON.parse(localStorage.getItem("kb_sellers")||"[]");
}

function checkSeller(){
  const number=sellerNumber.value.trim();

  sellerNumber.classList.remove("valid","invalid");
  sellerStatus.classList.remove("valid","invalid");

  if(!number){
    isValidSeller=false;
    sellerStatus.textContent="Bitte Verkäufernummer eingeben.";
    continueButton.disabled=true;
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
  updateContinue();
}

function updateContinue(){
  const hasPrice=parseFloat(price.value.replace(",", "."))>0;
  const hasSize=isToy || size.value.trim()!="";
  continueButton.disabled=!(isValidSeller && hasSize && hasPrice);
}

sellerNumber.addEventListener("input",checkSeller);
size.addEventListener("input",updateContinue);
price.addEventListener("input",updateContinue);

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
  updateContinue();
});

continueButton.addEventListener("click",()=>{
  // Der eigentliche Verkauf/Bezahlvorgang kommt im nächsten Schritt.
  alert("Artikel übernommen. Der nächste Schritt wird als Nächstes eingebaut.");
});

sellerNumber.addEventListener("blur",checkSeller);
