let sellers=JSON.parse(localStorage.getItem("kb_sellers")||"[]");
let editId=null;
const $=id=>document.getElementById(id);

function save(){localStorage.setItem("kb_sellers",JSON.stringify(sellers))}
function initials(name){return name.trim().split(/\s+/).map(x=>x[0]).join("").slice(0,2).toUpperCase()}
function toast(text){const t=$("toast");t.textContent=text;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2000)}
function esc(v){return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}

function sorted(list){
  return [...list].sort((a,b)=>{
    const ap=a.name.trim().split(/\s+/).pop();
    const bp=b.name.trim().split(/\s+/).pop();
    return ap.localeCompare(bp,"de-DE",{sensitivity:"base"})||a.name.localeCompare(b.name,"de-DE",{sensitivity:"base"});
  });
}

function render(){
  const q=$("search").value.trim().toLocaleLowerCase("de-DE");
  const filtered=sorted(sellers).filter(s=>s.name.toLocaleLowerCase("de-DE").includes(q)||s.number.includes(q));
  $("count").textContent=`${sellers.length} ${sellers.length===1?"Verkäufer":"Verkäufer"}`;
  if(!filtered.length){
    $("list").innerHTML=sellers.length?'<div class="empty"><strong>Kein Treffer</strong>Bitte einen anderen Suchbegriff verwenden.</div>':'<div class="empty"><strong>Noch keine Verkäufer</strong>Tippe oben auf „Verkäufer hinzufügen“.</div>';
    return;
  }
  $("list").innerHTML=filtered.map(s=>`
    <article class="seller">
      <div class="avatar">${initials(s.name)}</div>
      <div>
        <div class="seller-name">${esc(s.name)}</div>
        <div class="seller-no">Verkäufernummer: ${esc(s.number)}</div>
        ${s.phone?`<div class="seller-phone">☎ ${esc(s.phone)}</div>`:""}
      </div>
      <div class="seller-actions">
        <button class="icon-btn" onclick="editSeller('${s.id}')" aria-label="Bearbeiten">✎</button>
        <button class="icon-btn delete" onclick="deleteSeller('${s.id}')" aria-label="Löschen">×</button>
      </div>
    </article>`).join("");
}
function openForm(){
  editId=null;$("formTitle").textContent="Verkäufer hinzufügen";$("number").value="";$("name").value="";$("phone").value="";$("error").textContent="";
  $("modal").classList.remove("hidden");setTimeout(()=>$("number").focus(),50);
}
function closeForm(){$("modal").classList.add("hidden")}
function editSeller(id){
  const s=sellers.find(x=>x.id===id);if(!s)return;
  editId=id;$("formTitle").textContent="Verkäufer bearbeiten";$("number").value=s.number;$("name").value=s.name;$("phone").value=s.phone||"";$("error").textContent="";
  $("modal").classList.remove("hidden");setTimeout(()=>$("name").focus(),50);
}
function saveSeller(){
  const number=$("number").value.trim(),name=$("name").value.trim(),phone=$("phone").value.trim();
  if(!number||!name){$("error").textContent="Bitte Verkäufernummer und Name eingeben.";return}
  if(sellers.some(s=>s.number===number&&s.id!==editId)){$("error").textContent="Diese Verkäufernummer ist bereits vergeben.";return}
  if(editId){const s=sellers.find(x=>x.id===editId);s.number=number;s.name=name;s.phone=phone;toast("Verkäufer geändert.")}
  else{sellers.push({id:crypto.randomUUID?crypto.randomUUID():String(Date.now()+Math.random()),number,name,phone});toast("Verkäufer angelegt.")}
  save();closeForm();render();
}
function deleteSeller(id){
  const s=sellers.find(x=>x.id===id);if(s&&confirm(`Verkäufer „${s.name}“ wirklich löschen?`)){sellers=sellers.filter(x=>x.id!==id);save();render();toast("Verkäufer gelöscht.")}
}
function goHome(){
  // Diese Seite ist als eigene Unterseite gedacht. Für die gemeinsame App wird die Startseite später an diese Navigation angebunden.
  window.location.href="start.html";
}
$("search").addEventListener("input",render);
$("phone").addEventListener("keydown",e=>{if(e.key==="Enter")saveSeller()});
render();
