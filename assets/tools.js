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
function localISO(date=new Date()){const y=date.getFullYear(),m=String(date.getMonth()+1).padStart(2,"0"),d=String(date.getDate()).padStart(2,"0");return `${y}-${m}-${d}`}
function addMonthsClamped(date,months){const total=date.getFullYear()*12+date.getMonth()+months,y=Math.floor(total/12),m=((total%12)+12)%12,day=Math.min(date.getDate(),new Date(y,m+1,0).getDate());return new Date(y,m,day)}
function exactAge(start,end){
  if(end<start)return null;
  let totalMonths=(end.getFullYear()-start.getFullYear())*12+(end.getMonth()-start.getMonth());
  let anchor=addMonthsClamped(start,totalMonths);
  if(anchor>end){totalMonths--;anchor=addMonthsClamped(start,totalMonths)}
  return {y:Math.floor(totalMonths/12),m:totalMonths%12,d:daysBetween(anchor,end),total:daysBetween(start,end)};
}
function initAge(){
  $("#ageOn").value=localISO();
  $("#ageBtn").onclick=()=>{const dob=dateFromInput("#dob"),on=dateFromInput("#ageOn"),out=$("#ageResult"),detail=$("#ageDetail");if(!dob||!on){out.textContent="Choose both dates";detail.textContent="";return}const a=exactAge(dob,on);if(!a){out.textContent="Target date must be after birth date";detail.textContent="";return}out.textContent=`${a.y} years, ${a.m} months, ${a.d} days`;detail.textContent=`${fmt(a.total)} days total`;};
}
function initDiscount(){
  $("#discountBtn").onclick=()=>{const price=num("#price"),discount=num("#discount"),out=$("#discountResult"),detail=$("#discountDetail");if(!Number.isFinite(price)||!Number.isFinite(discount)||price<0){out.textContent="Enter valid values";detail.textContent="";return}const save=price*discount/100,final=price-save;out.textContent=fmt(final);detail.textContent=`You save ${fmt(save)} · ${fmt(discount)}% off`;};
}
function initDate(){
  const today=localISO();$("#baseDate").value=today;$("#dateA").value=today;$("#dateB").value=today;
  $("#offsetBtn").onclick=()=>{const base=dateFromInput("#baseDate"),amount=Math.trunc(num("#dayOffset"));if(!base||!Number.isFinite(amount)){ $("#offsetResult").textContent="Enter a valid date and number";return}base.setDate(base.getDate()+amount);$("#offsetResult").textContent=base.toLocaleDateString(undefined,{year:"numeric",month:"long",day:"numeric",weekday:"long"});};
  $("#differenceBtn").onclick=()=>{const a=dateFromInput("#dateA"),b=dateFromInput("#dateB");$("#differenceResult").textContent=a&&b?fmt(Math.abs(daysBetween(a,b)))+" days":"Choose both dates";};
}
function initAverage(){
  $("#averageBtn").onclick=()=>{const values=$("#numbers").value.split(/[\s,]+/).filter(Boolean).map(Number).filter(Number.isFinite),out=$("#averageResult"),detail=$("#averageDetail");if(!values.length){out.textContent="Add at least one number";detail.textContent="";return}const sorted=[...values].sort((a,b)=>a-b),sum=values.reduce((a,b)=>a+b,0),mid=Math.floor(sorted.length/2),median=sorted.length%2?sorted[mid]:(sorted[mid-1]+sorted[mid])/2;out.textContent=fmt(sum/values.length);detail.textContent=`Count ${values.length} · Sum ${fmt(sum)} · Median ${fmt(median)} · Min ${fmt(sorted[0])} · Max ${fmt(sorted.at(-1))}`;};
}
function initTip(){
  $("#tipBtn").onclick=()=>{
    const bill=num("#billAmount"),tip=num("#tipPercent"),people=Math.trunc(num("#peopleCount"));
    const out=$("#tipResult"),detail=$("#tipDetail");
    if(!Number.isFinite(bill)||!Number.isFinite(tip)||!Number.isFinite(people)||bill<0||tip<0||people<1){
      out.textContent="Enter valid values";detail.textContent="";return;
    }
    const tipAmount=bill*tip/100,total=bill+tipAmount,perPerson=total/people;
    out.textContent=fmt(perPerson);
    detail.textContent=`Total ${fmt(total)} · Tip ${fmt(tipAmount)} · ${people} ${people===1?"person":"people"}`;
  };
}
function timeToMinutes(value){
  if(!value||!/^[0-2]\d:[0-5]\d$/.test(value))return null;
  const [h,m]=value.split(":").map(Number);
  if(h>23)return null;
  return h*60+m;
}
function formatDuration(total){
  const h=Math.floor(total/60),m=total%60;
  return `${h} hr ${m} min`;
}
function formatClock(total){
  const dayShift=Math.floor(total/1440);
  const normalized=((total%1440)+1440)%1440;
  const h=String(Math.floor(normalized/60)).padStart(2,"0");
  const m=String(normalized%60).padStart(2,"0");
  return {time:`${h}:${m}`,dayShift};
}
function initTime(){
  $("#durationBtn").onclick=()=>{
    const start=timeToMinutes($("#startTime").value),end=timeToMinutes($("#endTime").value);
    const out=$("#durationResult"),detail=$("#durationDetail");
    if(start===null||end===null){out.textContent="Choose both times";detail.textContent="";return;}
    let duration=end-start,overnight=false;
    if(duration<0){duration+=1440;overnight=true;}
    out.textContent=formatDuration(duration);
    detail.textContent=`${fmt(duration)} minutes total${overnight?" · crosses midnight":""}`;
  };
  $("#addTimeBtn").onclick=()=>{
    const start=timeToMinutes($("#addStartTime").value),hours=Math.trunc(num("#addHours")),minutes=Math.trunc(num("#addMinutes"));
    const out=$("#addTimeResult"),detail=$("#addTimeDetail");
    if(start===null||!Number.isFinite(hours)||!Number.isFinite(minutes)){out.textContent="Enter a valid time and duration";detail.textContent="";return;}
    const added=hours*60+minutes,result=formatClock(start+added);
    out.textContent=result.time;
    detail.textContent=result.dayShift===0?"Same day":result.dayShift>0?`+${result.dayShift} day${result.dayShift===1?"":"s"}`:`${result.dayShift} day${result.dayShift===-1?"":"s"}`;
  };
}
function gcd(a,b){a=Math.abs(a);b=Math.abs(b);while(b){[a,b]=[b,a%b]}return a||1}
function simplifiedRatio(aRaw,bRaw){
  const a=Number(aRaw),b=Number(bRaw);
  if(!Number.isFinite(a)||!Number.isFinite(b)||a<=0||b<=0)return null;
  const decimals=s=>{const p=String(s).split(".")[1];return p?Math.min(p.length,6):0};
  const scale=10**Math.max(decimals(aRaw),decimals(bRaw));
  let ai=Math.round(a*scale),bi=Math.round(b*scale);
  const d=gcd(ai,bi);ai/=d;bi/=d;
  return [ai,bi];
}
function initRatio(){
  $("#simplifyRatioBtn").onclick=()=>{
    const r=simplifiedRatio($("#ratioA").value,$("#ratioB").value);
    $("#ratioResult").textContent=r?`${r[0]} : ${r[1]}`:"Enter two positive numbers";
  };
  $("#splitRatioBtn").onclick=()=>{
    const a=num("#splitA"),b=num("#splitB"),total=num("#splitTotal");
    const out=$("#splitRatioResult"),detail=$("#splitRatioDetail");
    if(!Number.isFinite(a)||!Number.isFinite(b)||!Number.isFinite(total)||a<=0||b<=0){
      out.textContent="Enter valid positive values";detail.textContent="";return;
    }
    const first=total*a/(a+b),second=total*b/(a+b);
    out.textContent=`${fmt(first)} : ${fmt(second)}`;
    detail.textContent=`Splits ${fmt(total)} in a ${fmt(a)}:${fmt(b)} ratio`;
  };
}
addBottomToolTabs();
const tool=document.body.dataset.tool;
if(tool==="percentage")initPercentage();
if(tool==="age")initAge();
if(tool==="discount")initDiscount();
if(tool==="date")initDate();
if(tool==="average")initAverage();
if(tool==="tip")initTip();
if(tool==="time")initTime();
if(tool==="ratio")initRatio();
