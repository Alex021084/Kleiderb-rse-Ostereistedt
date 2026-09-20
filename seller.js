let sellers=JSON.parse(localStorage.getItem("kb_sellers")||"[]");let editId=null;const $=id=>document.getElementById(id);
const commissionInput = document.getElementById("commissionEnabled");
const commissionRateInput = document.getElementById("commissionRate");
const commissionRateWrap = document.getElementById("commissionRateWrap");

function commissionRateValue(){
  let v=parseFloat((commissionRateInput?.value||"15").replace(",","."));
  if(!Number.isFinite(v)) v=15;
  return Math.min(100,Math.max(0,v));
}
function updateCommissionVisibility(){
  if(commissionRateWrap) commissionRateWrap.classList.toggle("hidden",!commissionInput?.checked);
}
function save(){localStorage.setItem("kb_sellers",JSON.stringify(sellers))}
function esc(v){return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function initials(n){return n.trim().split(/\s+/).map(x=>x[0]).join("").slice(0,2).toUpperCase()}
function sorted(a){return [...a].sort((x,y)=>{let xn=x.name.trim().split(/\s+/).pop(),yn=y.name.trim().split(/\s+/).pop();return xn.localeCompare(yn,"de-DE",{sensitivity:"base"})||x.name.localeCompare(y.name,"de-DE")})}

function getSales(){
  return JSON.parse(localStorage.getItem("kb_sales")||"[]");
}

function sellerStats(number){
  const sales=getSales().filter(s=>String(s.sellerNumber)===String(number));
  const pieces=sales.length;
  const turnover=sales.reduce((sum,s)=>sum+(Number(s.price)||0),0);
  const commission=sales.reduce((sum,s)=>{
    const rate=Number(s.commissionRate ?? (s.commissionEnabled===false?0:0.15));
    return sum+(Number(s.price)||0)*rate;
  },0);
  const payout=turnover-commission;
  return {pieces,turnover,commission,payout};
}

function euro(v){
  return Number(v||0).toLocaleString("de-DE",{style:"currency",currency:"EUR"});
}

function render(){
  let q=$("search").value.toLocaleLowerCase("de-DE");
  let a=sorted(sellers).filter(s=>s.name.toLocaleLowerCase("de-DE").includes(q)||s.number.includes(q));
  $("count").textContent=`${sellers.length} Verkäufer`;
  $("list").innerHTML=a.length?a.map(s=>`
    <article class="seller">
      <div class="avatar">${initials(s.name)}</div>
      <div>
        <div class="name">${esc(s.name)}</div>
        <div class="no">Verkäufernummer: ${esc(s.number)}</div>
        ${s.phone?`<div class="phone">☎ ${esc(s.phone)}</div>`:""}
        <span class="commission-badge ${s.commissionEnabled!==false?"yes":"no"}">${s.commissionEnabled!==false?`${s.commissionRate ?? 15} % Provision`:"Keine Provision"}</span>
      </div>
      <div class="seller-actions">
        <button class="report" title="Abrechnung" onclick="showReport('${s.id}')">€</button>
        <div class="seller-bottom-actions">
          <button class="small" title="Bearbeiten" onclick="editSeller('${s.id}')">✎</button>
          <button class="small delete" title="Löschen" onclick="del('${s.id}')">×</button>
        </div>
      </div>
    </article>`).join(""):'<div class="empty">Noch keine Verkäufer angelegt.</div>';
}

function showReport(id){
  const s=sellers.find(x=>x.id===id);
  if(!s)return;
  const st=sellerStats(s.number);
  $("reportTitle").textContent=`Abrechnung – ${s.name}`;
  $("reportSeller").textContent=`Verkäufernummer: ${s.number}`;
  $("reportPieces").textContent=st.pieces;
  $("reportTurnover").textContent=euro(st.turnover);
  $("reportPayout").textContent=euro(st.payout);
  const note=document.querySelector(".reportnote");
  if(note) note.textContent=`Die Abrechnung wird aus den erfassten Verkäufen dieser Verkäufernummer berechnet. Die beim Verkauf gespeicherte Provision wird berücksichtigt.`;
  $("report").classList.remove("hidden");
}

function closeReport(){$("report").classList.add("hidden")}

function openForm(){
  editId=null;
  $("number").value="";
  $("name").value="";
  $("phone").value="";
  if (commissionInput) commissionInput.checked=true;
  if (commissionRateInput) commissionRateInput.value="15";
  updateCommissionVisibility();
  $("error").textContent="";
  $("modalTitle").textContent="Verkäufer hinzufügen";
  $("modal").classList.remove("hidden");
  $("number").focus();
}
function closeForm(){$("modal").classList.add("hidden")}

function saveSeller(){
  let number=$("number").value.trim(),name=$("name").value.trim(),phone=$("phone").value.trim();
  let commissionEnabled=commissionInput ? commissionInput.checked : true;
  let commissionRate=commissionEnabled ? commissionRateValue() : 0;
  if(!number||!name){$("error").textContent="Bitte Nummer und Name eingeben.";return}
  if(sellers.some(s=>s.number===number&&s.id!==editId)){$("error").textContent="Diese Verkäufernummer ist bereits vergeben.";return}
  if(editId){
    let s=sellers.find(x=>x.id===editId);
    s.number=number;s.name=name;s.phone=phone;s.commissionEnabled=commissionEnabled;s.commissionRate=commissionRate
  }else{
    sellers.push({id:crypto.randomUUID?crypto.randomUUID():Date.now().toString(),number,name,phone,commissionEnabled,commissionRate})
  }
  save();closeForm();render()
}

function editSeller(id){
  let s=sellers.find(x=>x.id===id);if(!s)return;
  editId=id;
  $("number").value=s.number;
  $("name").value=s.name;
  $("phone").value=s.phone||"";
  if (commissionInput) commissionInput.checked=s.commissionEnabled!==false;
  if (commissionRateInput) commissionRateInput.value=String(s.commissionRate ?? 15).replace(".",",");
  updateCommissionVisibility();
  $("error").textContent="";
  $("modalTitle").textContent="Verkäufer bearbeiten";
  $("modal").classList.remove("hidden")
}

function del(id){
  let s=sellers.find(x=>x.id===id);
  if(s&&confirm(`„${s.name}“ löschen?`)){sellers=sellers.filter(x=>x.id!==id);save();render()}
}

$("search").oninput=render;
render();

if(commissionInput) commissionInput.addEventListener("change",updateCommissionVisibility);
updateCommissionVisibility();
