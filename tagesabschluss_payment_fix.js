/* Tagesabschluss – Zahlungsarten-Fix
   Ersetzt in tagesabschluss.js die drei bisherigen Zeilen:
   const cash=items.filter(x=>x.payment==="Bar")...
   const card=items.filter(x=>x.payment==="EC")...
   const paypal=items.filter(x=>x.payment==="PayPal")...

   durch diesen Block:
*/

const cash=receipts.filter(r=>(r.payment||"")==="Bar").reduce((a,r)=>{
  const t=Number(r.total);
  return a+(Number.isFinite(t)&&t>0?t:itemsOf(r).reduce((s,x)=>s+priceOf(x),0));
},0);

const card=receipts.filter(r=>(r.payment||"")==="EC").reduce((a,r)=>{
  const t=Number(r.total);
  return a+(Number.isFinite(t)&&t>0?t:itemsOf(r).reduce((s,x)=>s+priceOf(x),0));
},0);

const paypal=receipts.filter(r=>(r.payment||"")==="PayPal").reduce((a,r)=>{
  const t=Number(r.total);
  return a+(Number.isFinite(t)&&t>0?t:itemsOf(r).reduce((s,x)=>s+priceOf(x),0));
},0);
