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
function analyzeServerParts(records){
 const groups=new Map();
 for(const r of records){const id=partIdentity(r);if(!id)continue;if(!groups.has(id))groups.set(id,{id,part:r.part,profile:r.profile||'',rows:[]});groups.get(id).rows.push(r);}
 return [...groups.values()].sort((a,b)=>String(a.part).localeCompare(String(b.part))).map(g=>({...g,day:analysisMetrics(g.rows.filter(r=>r.shift==='DAY')),night:analysisMetrics(g.rows.filter(r=>r.shift==='NIGHT')),combined:analysisMetrics(g.rows)}));
}
const api={historyMetrics,analysisMetrics,filterAnalysisRecords,analyzeServerParts,validNumber,reliable,metrics,filterRecords,partIdentity,analyzeParts};if(typeof module!=='undefined'&&module.exports)module.exports=api;root.ProductionMetrics=api;
})(typeof globalThis!=='undefined'?globalThis:this);
