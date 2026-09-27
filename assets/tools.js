const $=s=>document.querySelector(s);
const fmt=n=>Number.isFinite(n)?new Intl.NumberFormat(undefined,{maximumFractionDigits:6}).format(n):"—";
function num(id){return Number($(id).value)}
function daysBetween(a,b){return Math.round((Date.UTC(b.getFullYear(),b.getMonth(),b.getDate())-Date.UTC(a.getFullYear(),a.getMonth(),a.getDate()))/86400000)}
function addBottomToolTabs(){
  const top=document.querySelector(".tool-tabs"),ad=document.querySelector(".ad-slot");
  if(!top||!ad||document.querySelector(".more-tools"))return;
  const section=document.createElement("section");section.className="more-tools";
  const label=document.createElement("div");label.className="more-tools-label";label.textContent="Try another calculator";
  const tabs=top.cloneNode(true);tabs.classList.add("bottom-tabs");tabs.setAttribute("aria-label","More calculators");
  section.append(label,tabs);ad.insertAdjacentElement("afterend",section);
}
function initPercentage(){
  $("#percentOfBtn").onclick=()=>{const p=num("#percent"),v=num("#percentValue");$("#percentOfResult").textContent=Number.isFinite(p)&&Number.isFinite(v)?fmt(v*p/100):"Enter valid numbers"};
  $("#whatPercentBtn").onclick=()=>{const x=num("#part"),y=num("#whole");$("#whatPercentResult").textContent=Number.isFinite(x)&&Number.isFinite(y)&&y!==0?fmt(x/y*100)+"%":"Enter valid numbers"};
  $("#changeBtn").onclick=()=>{const old=num("#oldValue"),now=num("#newValue");$("#changeResult").textContent=Number.isFinite(old)&&Number.isFinite(now)&&old!==0?fmt((now-old)/Math.abs(old)*100)+"%":"Enter valid numbers"};
}
function dateFromInput(id){const v=$(id).value;if(!v)return null;const [y,m,d]=v.split("-").map(Number);return new Date(y,m-1,d)}
function exactAge(start,end){
  if(end<start)return null;
  let y=end.getFullYear()-start.getFullYear(),m=end.getMonth()-start.getMonth(),d=end.getDate()-start.getDate();
  if(d<0){m--;const prev=new Date(end.getFullYear(),end.getMonth(),0);d+=prev.getDate()}
  if(m<0){y--;m+=12}
  return {y,m,d,total:daysBetween(start,end)};
}
function initAge(){
  const today=new Date(),iso=today.toISOString().slice(0,10);$("#ageOn").value=iso;
  $("#ageBtn").onclick=()=>{const dob=dateFromInput("#dob"),on=dateFromInput("#ageOn"),out=$("#ageResult"),detail=$("#ageDetail");if(!dob||!on){out.textContent="Choose both dates";detail.textContent="";return}const a=exactAge(dob,on);if(!a){out.textContent="Target date must be after birth date";detail.textContent="";return}out.textContent=`${a.y} years, ${a.m} months, ${a.d} days`;detail.textContent=`${fmt(a.total)} days total`;};
}
function initDiscount(){
  $("#discountBtn").onclick=()=>{const price=num("#price"),discount=num("#discount"),out=$("#discountResult"),detail=$("#discountDetail");if(!Number.isFinite(price)||!Number.isFinite(discount)||price<0){out.textContent="Enter valid values";detail.textContent="";return}const save=price*discount/100,final=price-save;out.textContent=fmt(final);detail.textContent=`You save ${fmt(save)} · ${fmt(discount)}% off`;};
}
function initDate(){
  const today=new Date().toISOString().slice(0,10);$("#baseDate").value=today;$("#dateA").value=today;$("#dateB").value=today;
  $("#offsetBtn").onclick=()=>{const base=dateFromInput("#baseDate"),amount=Math.trunc(num("#dayOffset"));if(!base||!Number.isFinite(amount)){ $("#offsetResult").textContent="Enter a valid date and number";return}base.setDate(base.getDate()+amount);$("#offsetResult").textContent=base.toLocaleDateString(undefined,{year:"numeric",month:"long",day:"numeric",weekday:"long"});};
  $("#differenceBtn").onclick=()=>{const a=dateFromInput("#dateA"),b=dateFromInput("#dateB");$("#differenceResult").textContent=a&&b?fmt(Math.abs(daysBetween(a,b)))+" days":"Choose both dates";};
}
function initAverage(){
  $("#averageBtn").onclick=()=>{const values=$("#numbers").value.split(/[\s,]+/).filter(Boolean).map(Number).filter(Number.isFinite),out=$("#averageResult"),detail=$("#averageDetail");if(!values.length){out.textContent="Add at least one number";detail.textContent="";return}const sorted=[...values].sort((a,b)=>a-b),sum=values.reduce((a,b)=>a+b,0),mid=Math.floor(sorted.length/2),median=sorted.length%2?sorted[mid]:(sorted[mid-1]+sorted[mid])/2;out.textContent=fmt(sum/values.length);detail.textContent=`Count ${values.length} · Sum ${fmt(sum)} · Median ${fmt(median)} · Min ${fmt(sorted[0])} · Max ${fmt(sorted.at(-1))}`;};
}
addBottomToolTabs();
const tool=document.body.dataset.tool;
if(tool==="percentage")initPercentage();
if(tool==="age")initAge();
if(tool==="discount")initDiscount();
if(tool==="date")initDate();
if(tool==="average")initAverage();