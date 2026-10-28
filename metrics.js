/* Pure calculations; shared by the browser and Node verification. */
(function(root){
'use strict';
const validNumber=v=>typeof v==='number'&&Number.isFinite(v)&&v>=0;
function reliable(r){return r.ratesReliable===false?false:(r.quality==='FULL_REPORT'||r.ratesReliable===true)&&validNumber(r.pcs)&&r.pcs>0&&validNumber(r.total_sec)&&r.total_sec>0;}
function metrics(rows){
 if(!rows.length)return {pcs:null,secPerPc:null,pcsPerHour:null,robots:0,records:0};
 const pcsKnown=rows.every(r=>validNumber(r.pcs));
 const pcs=pcsKnown?rows.reduce((sum,r)=>sum+r.pcs,0):null;
 // A recorded zero-piece row does not invalidate an average when its zero time is explicit.
 const ratesKnown=rows.every(r=>reliable(r)||(r.quality==='FULL_REPORT'&&r.ratesReliable!==false&&r.pcs===0&&r.total_sec===0));
 const sec=rows.reduce((sum,r)=>sum+(validNumber(r.total_sec)?r.total_sec:0),0);
 return {pcs,secPerPc:ratesKnown&&pcs>0&&sec>0?sec/pcs:null,pcsPerHour:ratesKnown&&pcs>0&&sec>0?3600*pcs/sec:null,robots:new Set(rows.map(r=>r.robot)).size,records:rows.length};
}
function partIdentity(p){return String(p.part_id||p.part||'');}
function filterRecords(records,filters){return records.filter(r=>(!filters.from||r.date>=filters.from)&&(!filters.to||r.date<=filters.to)&&(!filters.shift||r.shift===filters.shift)&&(!filters.robot||String(r.robot)===filters.robot)).flatMap(r=>{
 if(!filters.part&&!filters.profile)return [r];
 const parts=(r.parts||[]).filter(p=>(!filters.part||partIdentity(p)===filters.part)&&(!filters.profile||p.profile===filters.profile));
 if(!parts.length)return [];
 const pcs=parts.every(p=>validNumber(p.pcs))?parts.reduce((s,p)=>s+p.pcs,0):null;
 const total_sec=parts.every(p=>validNumber(p.total_sec))?parts.reduce((s,p)=>s+p.total_sec,0):null;
 return [{...r,pcs,total_sec,parts,ratesReliable:r.ratesReliable!==false&&r.quality==='FULL_REPORT'&&parts.every(p=>p.ratesReliable!==false),partFiltered:true}];
 });}
function analyzeParts(records){
 const groups=new Map();
 for(const r of records){
  const rowParts=new Map();
  for(const p of r.parts||[]){const id=partIdentity(p);if(!id)continue;if(!rowParts.has(id))rowParts.set(id,[]);rowParts.get(id).push(p);}
  for(const [id,parts] of rowParts){
   if(!groups.has(id))groups.set(id,{id,part:parts[0].part,profile:parts[0].profile||'',rows:[]});
   groups.get(id).rows.push({date:r.date,shift:r.shift,robot:r.robot,quality:r.quality,ratesReliable:id!=='UNKNOWN'&&r.ratesReliable!==false&&parts.every(p=>p.ratesReliable!==false),pcs:parts.every(p=>validNumber(p.pcs))?parts.reduce((s,p)=>s+p.pcs,0):null,total_sec:parts.every(p=>validNumber(p.total_sec))?parts.reduce((s,p)=>s+p.total_sec,0):null});
  }
 }
 return [...groups.values()].sort((a,b)=>String(a.part).localeCompare(String(b.part))).map(g=>({...g,day:metrics(g.rows.filter(r=>r.shift==='DAY')),night:metrics(g.rows.filter(r=>r.shift==='NIGHT')),combined:metrics(g.rows)}));
}
function historyMetrics(rows){
 const total=metrics(rows);const eligible=rows.filter(reliable);const paired=metrics(eligible);
 return {...total,secPerPc:paired.secPerPc,pcsPerHour:paired.pcsPerHour,eligiblePCS:paired.pcs===null?0:paired.pcs,eligibleRecords:eligible.length,totalRecords:rows.length};
}
function analysisMetrics(rows){
 // Server Analysis runs are a separate grain. Never inherit shift-report quality.
 return metrics(rows.map(r=>({...r,quality:'FULL_REPORT',ratesReliable:validNumber(r.pcs)&&r.pcs>0&&validNumber(r.total_sec)&&r.total_sec>0})));
}
function filterAnalysisRecords(records,f){return records.filter(r=>(!f.from||r.date>=f.from)&&(!f.to||r.date<=f.to)&&(!f.shift||r.shift===f.shift)&&(!f.robot||String(r.robot)===f.robot)&&(!f.part||partIdentity(r)===f.part)&&(!f.profile||r.profile===f.profile));}
// Match Python round(value, 2) on the underlying IEEE-754 value, including ties-to-even.
function serverRound2(value){
 if(typeof value!=='number'||!Number.isFinite(value))return null;
 const sign=value<0?-1:1;value=Math.abs(value);if(value===0)return 0;
 const view=new DataView(new ArrayBuffer(8));view.setFloat64(0,value,false);const bits=view.getBigUint64(0,false);const exponent=Number((bits>>52n)&2047n);let numerator=(bits&((1n<<52n)-1n))+(exponent?1n<<52n:0n);const power=(exponent?exponent-1023:1-1023)-52;numerator*=100n;
 let rounded;if(power>=0)rounded=numerator<<BigInt(power);else{const denominator=1n<<BigInt(-power);rounded=numerator/denominator;const remainder=numerator%denominator;if(remainder*2n>denominator||(remainder*2n===denominator&&rounded%2n===1n))rounded++;}
 return sign*Number(rounded)/100;
}
function weightedMedian(rows){
 const points=rows.filter(r=>validNumber(r.pcs)&&r.pcs>0&&validNumber(r.total_sec)&&r.total_sec>0).map(r=>({value:serverRound2(r.total_sec/r.pcs),weight:Math.trunc(r.pcs)})).filter(p=>p.value>0&&p.weight>0).sort((a,b)=>a.value-b.value);
 if(!points.length)return null;const half=points.reduce((s,p)=>s+p.weight,0)/2;let cumulative=0;for(const p of points){cumulative+=p.weight;if(cumulative>=half)return p.value;}return points[points.length-1].value;
}
function serverWeightedMedianPoints(points){
 const values=points.map(p=>({value:serverRound2(p.value),weight:Math.max(0,Math.trunc(p.weight||0))})).filter(p=>p.value!==null&&p.value>0&&p.weight>0).sort((a,b)=>a.value-b.value);
 if(!values.length)return null;const half=values.reduce((s,p)=>s+p.weight,0)/2;let sum=0;for(const p of values){sum+=p.weight;if(sum>=half)return p.value;}return values[values.length-1].value;
}
function normalAnalysisRows(rows){
 const valid=rows.filter(r=>validNumber(r.pcs)&&r.pcs>0&&validNumber(r.total_sec)&&r.total_sec>0);
 if(valid.length<5||valid.reduce((s,r)=>s+r.pcs,0)<500)return valid;
 const points=valid.map(r=>({value:serverRound2(r.total_sec/r.pcs),weight:r.pcs}));const median=serverWeightedMedianPoints(points);if(median===null)return valid;
 const mad=serverWeightedMedianPoints(points.map(p=>({value:Math.abs(p.value-median),weight:p.weight})));
 const threshold=Math.max(6,median*.18,(mad||0)*1.4826*4);
 const kept=valid.filter((r,i)=>Math.abs(points[i].value-median)<=threshold);return kept.length?valid.filter(r=>(partIdentity(r)!=='SC:ST01S400001'&&r.pcs>30)||kept.includes(r)):valid;
}
function manuallyExcluded(r){return (r.date==='2026-09-10'&&r.shift==='NIGHT'&&String(r.robot)==='9'&&r.brand==='CROBOTP'&&r.part_id==='CT:49335-20400'&&r.view_mode==='NIGHT_STANDARD'&&r.segment===1&&r.pcs===77&&r.first==='20:14'&&r.last==='01:12')||(r.date==='2026-09-15'&&r.shift==='DAY'&&String(r.robot)==='3'&&r.brand==='CROBOTP'&&r.part_id==='CT:49331-20304'&&r.view_mode==='DAY_STANDARD'&&r.segment===1&&r.pcs===3&&r.first==='12:00'&&r.last==='-')||(r.date==='2026-09-15'&&r.shift==='DAY'&&String(r.robot)==='3'&&r.brand==='CROBOTP'&&r.part_id==='CT:900-20000'&&r.view_mode==='DAY_STANDARD'&&r.segment===2&&r.pcs===2&&r.first==='-'&&r.last==='-')||(r.date==='2026-09-15'&&r.shift==='DAY'&&String(r.robot)==='3'&&r.brand==='CROBOTP'&&r.part_id==='CT:49331-20304'&&r.view_mode==='DAY_STANDARD'&&r.segment===3&&r.pcs===2&&r.first==='-'&&r.last==='12:13')||(r.date==='2026-09-16'&&r.shift==='NIGHT'&&String(r.robot)==='7'&&r.brand==='CROBOTP'&&r.part_id==='JK:49178-20050'&&r.view_mode==='NIGHT_STANDARD'&&r.segment===1&&r.pcs===2283&&r.first==='20:11'&&r.last==='06:50')||(r.date==='2026-09-19'&&r.shift==='DAY'&&String(r.robot)==='9'&&r.brand==='CROBOTP'&&r.part_id==='CT:49335-20400'&&r.view_mode==='DAY_STANDARD'&&r.segment===1&&r.pcs===1648&&r.first==='08:28'&&r.last==='19:58')||(r.date==='2026-09-27'&&r.shift==='DAY'&&String(r.robot)==='8'&&r.brand==='CROBOTP'&&r.part_id==='SC:49335-13320'&&r.view_mode==='DAY_EXTENDED'&&r.segment===1&&r.pcs===14&&r.first==='10:17'&&r.last==='16:25')||(r.date==='2026-10-06'&&r.shift==='NIGHT'&&String(r.robot)==='6'&&r.brand==='DENSO'&&r.part_id==='JK:49435-20100'&&r.view_mode==='NIGHT_STANDARD'&&r.segment===1&&r.pcs===43&&r.first==='23:24'&&r.last==='02:40')||(r.date==='2026-10-12'&&r.shift==='DAY'&&String(r.robot)==='3'&&r.brand==='CROBOTP'&&r.part_id==='CT:49173-20435'&&r.view_mode==='DAY_STANDARD'&&r.segment===1&&r.pcs===9&&r.first==='16:39'&&r.last==='18:54')||r.date==='2026-09-16'&&r.shift==='NIGHT'&&String(r.robot)==='9'&&r.brand==='CROBOTP'&&r.part_id==='CT:49335-20400'&&r.view_mode==='NIGHT_STANDARD'&&r.segment===1&&r.pcs===2126&&r.first==='20:12'&&r.last==='07:59';}
function adjustAnalysisRecords(rows){
 const groups=new Map();for(const r of rows){const id=partIdentity(r);if(!groups.has(id))groups.set(id,[]);groups.get(id).push(r);}
 const retained=new Set();for(const group of groups.values())for(const r of normalAnalysisRows(group))retained.add(r);
 return rows.map(r=>({...r,rateIncluded:retained.has(r)&&!manuallyExcluded(r),manualRateExclusion:manuallyExcluded(r)}));
}
function adjustedMetrics(rows){
 const totals=analysisMetrics(rows),included=rows.filter(r=>r.rateIncluded===true),rates=analysisMetrics(included);
 return {...totals,secPerPc:rates.secPerPc,pcsPerHour:rates.pcsPerHour,includedPCS:rates.pcs||0,includedRecords:included.length,excludedPCS:totals.pcs===null?0:totals.pcs-(rates.pcs||0),excludedRecords:rows.length-included.length};
}
function analyzeAdjustedParts(rows){
 const groups=new Map();for(const r of rows){const id=partIdentity(r);if(!id)continue;if(!groups.has(id))groups.set(id,{id,part:r.part,profile:r.profile||'',rows:[]});groups.get(id).rows.push(r);}
 return [...groups.values()].sort((a,b)=>String(a.part).localeCompare(String(b.part))).map(g=>({...g,day:adjustedMetrics(g.rows.filter(r=>r.shift==='DAY')),night:adjustedMetrics(g.rows.filter(r=>r.shift==='NIGHT')),combined:adjustedMetrics(g.rows)}));
}
function analyzeServerParts(records){
 const groups=new Map();
 for(const r of records){const id=partIdentity(r);if(!id)continue;if(!groups.has(id))groups.set(id,{id,part:r.part,profile:r.profile||'',rows:[]});groups.get(id).rows.push(r);}
 return [...groups.values()].sort((a,b)=>String(a.part).localeCompare(String(b.part))).map(g=>({...g,medianSecPerPc:weightedMedian(g.rows),day:analysisMetrics(g.rows.filter(r=>r.shift==='DAY')),night:analysisMetrics(g.rows.filter(r=>r.shift==='NIGHT')),combined:analysisMetrics(g.rows)}));
}
const api={manuallyExcluded,normalAnalysisRows,adjustAnalysisRecords,adjustedMetrics,analyzeAdjustedParts,serverWeightedMedianPoints,serverRound2,weightedMedian,historyMetrics,analysisMetrics,filterAnalysisRecords,analyzeServerParts,validNumber,reliable,metrics,filterRecords,partIdentity,analyzeParts};if(typeof module!=='undefined'&&module.exports)module.exports=api;root.ProductionMetrics=api;
})(typeof globalThis!=='undefined'?globalThis:this);
