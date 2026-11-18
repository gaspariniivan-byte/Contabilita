const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const euro=n=>new Intl.NumberFormat('it-IT',{style:'currency',currency:'EUR'}).format(n||0);
const months=['Gen','Feb','Mar','Apr','Mag','Giu','Lug','Ago','Set','Ott','Nov','Dic'];
const LS_TX='ivanTxV2', LS_ALIAS='ivanMerchantAliases';
let tx=JSON.parse(localStorage.getItem(LS_TX)||'null') || JSON.parse(localStorage.getItem('ivanTx')||'null') || window.SEED_TRANSACTIONS || [];
let aliases=JSON.parse(localStorage.getItem(LS_ALIAS)||'{}');
let cats=[...new Set([...(window.SEED_CATEGORIES||[]),...tx.map(x=>x.category)])].filter(Boolean).sort((a,b)=>a.localeCompare(b,'it'));
let bankRows=[];
function persist(){localStorage.setItem(LS_TX,JSON.stringify(tx));localStorage.setItem(LS_ALIAS,JSON.stringify(aliases))}
function norm(s=''){return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim()}
function years(){return [...new Set(tx.map(x=>x.date?.slice(0,4)).filter(Boolean))].sort().reverse()}
function fillSelect(el,items,allText=null){let v=el.value;el.innerHTML=(allText!==null?`<option value="">${allText}</option>`:'')+items.map(x=>`<option value="${x}">${x}</option>`).join('');if([...el.options].some(o=>o.value===v))el.value=v}
function setupSelects(){fillSelect($('#category'),cats);fillSelect($('#ocrCategory'),cats);fillSelect($('#txCategory'),cats,'Tutte le categorie');['homeYear','txYear','anYear','medYear'].forEach(id=>fillSelect($('#'+id),years()));const y=String(new Date().getFullYear());['homeYear','txYear','anYear','medYear'].forEach(id=>{if(years().includes(y))$('#'+id).value=y});}
function selected(y,m){return tx.filter(x=>(!y||x.date?.startsWith(y))&&(!m||x.date?.slice(5,7)===m))}
function amount(x){return Number(x.cash||0)+Number(x.account||0)}
function expenses(a){return a.filter(x=>amount(x)<0)}
function navTo(id){$$('nav button').forEach(b=>b.classList.toggle('active',b.dataset.view===id));$$('.view').forEach(v=>v.classList.toggle('active',v.id===id));renderAll()}
function renderHome(){const a=selected($('#homeYear').value,$('#homeMonth').value),ex=expenses(a),inc=a.filter(x=>amount(x)>0);const spend=-ex.reduce((s,x)=>s+amount(x),0),income=inc.reduce((s,x)=>s+amount(x),0),med=-ex.filter(x=>norm(x.category)==='mediche').reduce((s,x)=>s+amount(x),0);$('#kpis').innerHTML=[['Spese',euro(spend)],['Entrate',euro(income)],['Saldo',euro(income-spend)],['Mediche',euro(med)]].map(([l,v])=>`<div class=kpi><span>${l}</span><strong>${v}</strong></div>`).join('');const sums={};ex.forEach(x=>sums[x.category]=(sums[x.category]||0)-amount(x));let arr=Object.entries(sums).sort((a,b)=>b[1]-a[1]).slice(0,10),max=arr[0]?.[1]||1;$('#topCats').innerHTML=arr.map(([c,v])=>`<div class=barRow><span>${c}</span><div class=bar><i style="width:${v/max*100}%"></i></div><b>${euro(v)}</b></div>`).join('')||'<p class=muted>Nessun dato.</p>';const yr=$('#homeYear').value;let ms=Array(12).fill(0);expenses(selected(yr,'')).forEach(x=>ms[+x.date.slice(5,7)-1]-=amount(x));max=Math.max(...ms,1);$('#monthlyBars').innerHTML=ms.map((v,i)=>`<div class=barRow><span>${months[i]}</span><div class=bar><i style="width:${v/max*100}%"></i></div><b>${euro(v)}</b></div>`).join('')}
function txHtml(x){const raw=x.merchantRaw&&x.merchantRaw!==x.merchant?` · origine: ${escapeHtml(x.merchantRaw)}`:'';return `<div class=tx><div><b>${escapeHtml(x.description||x.category)}</b><div class=meta>${x.date} · ${escapeHtml(x.category)} · ${escapeHtml(x.merchant||'')}${raw}${x.note?` · <span title="${escapeHtml(x.note)}">📝 Nota</span>`:""}</div></div><strong class="${amount(x)<0?'neg':'pos'}">${euro(amount(x))}</strong><div class=txActions><button onclick="editTx('${x.id}')">Modifica</button><button class=danger onclick="deleteTx('${x.id}')">Elimina</button></div></div>`}
function escapeHtml(s=''){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function renderTransactions(){let a=selected($('#txYear').value,''),q=norm($('#search').value),c=$('#txCategory').value;a=a.filter(x=>(!c||x.category===c)&&(!q||norm([x.category,x.description,x.merchant,x.merchantRaw].join(' ')).includes(q))).sort((a,b)=>b.date.localeCompare(a.date));$('#txList').innerHTML=a.slice(0,500).map(txHtml).join('')||'<p class=muted>Nessun movimento.</p>'}
function renderAnalysis(){const a=expenses(selected($('#anYear').value,$('#anMonth').value)),sums={};a.forEach(x=>sums[x.category]=(sums[x.category]||0)-amount(x));const arr=Object.entries(sums).sort((a,b)=>b[1]-a[1]),total=arr.reduce((s,x)=>s+x[1],0);let cum=0;$('#pareto').innerHTML='<table><thead><tr><th>Categoria</th><th>Spesa</th><th>%</th><th>Cumulata</th></tr></thead><tbody>'+arr.map(([c,v])=>{cum+=v;return `<tr><td>${escapeHtml(c)}</td><td>${euro(v)}</td><td>${total?(v/total*100).toFixed(1):0}%</td><td>${total?(cum/total*100).toFixed(1):0}%</td></tr>`}).join('')+'</tbody></table>'}
function renderMedical(){const y=$('#medYear').value,a=expenses(selected(y,'')).filter(x=>norm(x.category)==='mediche').sort((a,b)=>b.date.localeCompare(a.date));const tot=-a.reduce((s,x)=>s+amount(x),0);$('#medicalSummary').innerHTML=`<p><b>Totale ${y}: ${euro(tot)}</b> · ${a.length} voci</p>`;$('#medicalList').innerHTML=a.map(txHtml).join('')}
function renderStats(){const bank=tx.filter(x=>x.source==='Banca').length,ocr=tx.filter(x=>x.source==='OCR').length;$('#dbStats').innerHTML=`<p><b>${tx.length}</b> movimenti · <b>${years().length}</b> anni · <b>${Object.keys(aliases).length}</b> associazioni esercenti · <b>${bank}</b> importati da banca · <b>${ocr}</b> da OCR.</p>`}
function renderAll(){renderHome();renderTransactions();renderAnalysis();renderMedical();renderStats()}
function resetForm(){$('#txForm').reset();$('#editId').value='';$('#formTitle').textContent='Nuovo movimento';$('#saveBtn').textContent='Registra';$('#cancelEdit').hidden=true;$('#date').value=new Date().toISOString().slice(0,10);$('#rememberAlias').checked=true;$('#note').value=''}
window.editTx=id=>{const x=tx.find(t=>t.id===id);if(!x)return;$('#editId').value=id;$('#date').value=x.date;$('#kind').value=amount(x)<0?'expense':'income';$('#category').value=x.category;$('#amount').value=Math.abs(amount(x));$('#payment').value=x.cash!=null?'cash':'account';$('#description').value=x.description||'';$('#note').value=x.note||'';$('#merchantRaw').value=x.merchantRaw||x.merchant||'';$('#merchant').value=x.merchant||'';$('#diesel').value=x.diesel??'';$('#petrol').value=x.petrol??'';$('#formTitle').textContent='Modifica movimento';$('#saveBtn').textContent='Salva modifiche';$('#cancelEdit').hidden=false;navTo('add')}
window.deleteTx=id=>{const x=tx.find(t=>t.id===id);if(!x)return;if(confirm(`Eliminare il movimento ${x.date} · ${x.description||x.category} · ${euro(amount(x))}?`)){tx=tx.filter(t=>t.id!==id);persist();setupSelects();renderAll()}}
function rememberAlias(raw,display){if(raw&&display&&norm(raw)!==norm(display))aliases[norm(raw)]={display,raw}}
function applyAlias(raw){return aliases[norm(raw)]?.display||raw}
function submitForm(e){e.preventDefault();let val=Math.abs(+$('#amount').value);if($('#kind').value==='expense')val=-val;const id=$('#editId').value||crypto.randomUUID(),old=tx.find(x=>x.id===id);const rec={id,date:$('#date').value,category:$('#category').value,cash:$('#payment').value==='cash'?val:null,account:$('#payment').value==='account'?val:null,description:$('#description').value.trim(),note:$('#note').value.trim(),merchantRaw:$('#merchantRaw').value.trim(),merchant:$('#merchant').value.trim(),diesel:$('#diesel').value?+$('#diesel').value:null,petrol:$('#petrol').value?+$('#petrol').value:null,source:old?.source||'App',bankRef:old?.bankRef||null,...(old?.reconciled!==undefined?{reconciled:old.reconciled}:{})};if($('#rememberAlias').checked)rememberAlias(rec.merchantRaw,rec.merchant);if(old)tx=tx.map(x=>x.id===id?rec:x);else tx.push(rec);persist();setupSelects();resetForm();renderAll();alert(old?'Movimento aggiornato':'Movimento registrato');navTo('transactions')}
function csvDownload(rows,name){const csv=rows.map(r=>r.map(v=>`"${String(v??'').replaceAll('"','""')}"`).join(';')).join('\n');const blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'}),u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=name;a.click();URL.revokeObjectURL(u)}
function parseOCR(t){
 const lines=t.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
 const money=s=>{const m=String(s).match(/(?:^|\s|€)(\d{1,5}[,.]\d{2})(?!\s*%)/);return m?Number(m[1].replace(',','.')):null};
 let total=null;
 // Accettiamo solo un importo nella riga del totale, oppure subito sotto se la riga è vuota.
 for(const re of [/\btotale\s+complessivo\b/i,/\btotale\s+da\s+pagare\b/i,/\bimporto\s+pagato\b/i,/^\s*totale\b/i]){
  for(let i=0;i<lines.length;i++){
   if(!re.test(lines[i]))continue;
   const after=lines[i].slice(lines[i].search(re)+lines[i].match(re)[0].length);
   const val=money(after);
   if(val!==null){total=val;break}
  }
  if(total!==null)break;
 }
 const dateMatch=t.match(/\b([0-3]?\d)[\/.\-]([01]?\d)[\/.\-](20\d{2}|\d{2})\b/);
 let iso='';if(dateMatch){const y=dateMatch[3].length===2?'20'+dateMatch[3]:dateMatch[3];const d=+dateMatch[1],m=+dateMatch[2];const test=new Date(Date.UTC(+y,m-1,d));if(test.getUTCDate()===d&&test.getUTCMonth()===m-1)iso=`${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`}
 const merchantRaw=lines.find(l=>/\b(?:soc\.?\s*coop|s\.?r\.?l\.?|s\.?p\.?a\.?|coop\s+alleanza)\b/i.test(l))||lines.find(l=>/\b(?:supermercato|farmacia|negozio|market)\b/i.test(l))||lines.find(l=>/[A-Za-zÀ-ÿ]{4,}/.test(l))||'';
 const store=lines.find(l=>/\b(?:supermercato|punto\s+vendita|negozio)\b/i.test(l));
 const merchant=applyAlias(merchantRaw)!==merchantRaw?applyAlias(merchantRaw):(store||merchantRaw);
 const low=norm(t);let category='';if(/farmacia|parafarmacia/.test(low))category=cats.find(c=>norm(c)==='mediche')||'';else if(/benzina|diesel|gasolio|carburante/.test(low))category=cats.find(c=>norm(c).includes('carbur'))||'';else if(/ristorante|pizzeria|trattoria/.test(low))category=cats.find(c=>norm(c).includes('ristor'))||'';else if(/supermercato|conad|lidl|coop|despar/.test(low))category=cats.find(c=>norm(c)==='spesa')||'';
 return {iso,total,merchantRaw,merchant,category};
}
function fillOcrDraft(p){$('#ocrDate').value=p.iso||'';$('#ocrAmount').value=p.total??'';$('#ocrMerchantRaw').value=p.merchantRaw||'';$('#ocrMerchant').value=p.merchant||'';if(p.category)$('#ocrCategory').value=p.category}
function parseDateAny(s){s=String(s||'').trim();let m=s.match(/(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4})/);if(m){let y=m[3].length===2?'20'+m[3]:m[3];return `${y}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`}let d=new Date(s);return isNaN(d)?'':d.toISOString().slice(0,10)}
function parseAmountAny(s){if(typeof s==='number')return s;s=String(s||'').replace(/\s/g,'').replace(/\.(?=\d{3}(?:\D|$))/g,'').replace(',','.').replace(/[^0-9+\-.]/g,'');return Number(s)||0}
function splitCsvLine(line,delim){const out=[];let cur='',q=false;for(let i=0;i<line.length;i++){const ch=line[i];if(ch==='"'){if(q&&line[i+1]==='"'){cur+='"';i++}else q=!q}else if(ch===delim&&!q){out.push(cur);cur=''}else cur+=ch}out.push(cur);return out}
function detectDelimiter(text){const first=text.split(/\r?\n/)[0]||'';return [';','\t',','].sort((a,b)=>first.split(b).length-first.split(a).length)[0]}
function findHeader(headers,patterns){return headers.findIndex(h=>patterns.some(p=>norm(h).includes(p)))}
function parseBankCsv(text){const delim=detectDelimiter(text),lines=text.split(/\r?\n/).filter(l=>l.trim()),rows=lines.map(l=>splitCsvLine(l,delim));if(rows.length<2)return[];const h=rows[0];let di=findHeader(h,['data contabile','data operazione','data']),ai=findHeader(h,['importo','amount','valore']),debi=findHeader(h,['addebiti','dare']),credi=findHeader(h,['accrediti','avere']),xi=findHeader(h,['descrizione','causale','operazione','dettagli']);return rows.slice(1).map((r,i)=>{let a=ai>=0?parseAmountAny(r[ai]):((credi>=0?Math.abs(parseAmountAny(r[credi])):0)-(debi>=0?Math.abs(parseAmountAny(r[debi])):0));return{id:'bank-'+i,date:parseDateAny(r[di]),amount:a,description:(r[xi]||r.join(' ')).trim(),raw:r}}).filter(x=>x.date&&x.amount)}
function dayDiff(a,b){return Math.abs((new Date(a)-new Date(b))/86400000)}
function matchBankRow(r){const candidates=tx.filter(x=>x.account!=null&&Math.abs(amount(x)-r.amount)<0.011&&dayDiff(x.date,r.date)<=3);if(!candidates.length)return null;candidates.sort((a,b)=>dayDiff(a.date,r.date)-dayDiff(b.date,r.date));return candidates[0]}
function renderBank(){if(!bankRows.length){$('#bankPreview').innerHTML='';return}$('#bankPreview').innerHTML=bankRows.map((r,i)=>{const m=matchBankRow(r);return `<div class=bankRow><div><b>${r.date}</b> · <strong class="${r.amount<0?'neg':'pos'}">${euro(r.amount)}</strong></div><div>${escapeHtml(r.description)}</div>${m?`<div class=match><span class=badge>Probabile corrispondenza</span><br>${escapeHtml(m.description||m.category)} · ${m.date} · ${euro(amount(m))}</div><button onclick="linkBank(${i},'${m.id}')">Conferma corrispondenza</button>`:`<div class=match><span class=badge>Non registrato</span></div><button onclick="importBank(${i})">Classifica e importa</button>`}</div>`}).join('')}
window.linkBank=(i,id)=>{const r=bankRows[i],x=tx.find(t=>t.id===id);if(!x)return;x.bankRef={date:r.date,amount:r.amount,description:r.description};x.reconciled=true;persist();bankRows.splice(i,1);renderBank();renderAll()}
window.importBank=i=>{const r=bankRows[i];resetForm();$('#date').value=r.date;$('#kind').value=r.amount<0?'expense':'income';$('#amount').value=Math.abs(r.amount);$('#payment').value='account';$('#merchantRaw').value=r.description;$('#merchant').value=applyAlias(r.description);$('#description').value=r.description;$('#editId').value='';sessionStorage.setItem('pendingBank',JSON.stringify(r));bankRows.splice(i,1);navTo('add')}
function exportAllCsv(){csvDownload([['DATA','CATEGORIA','CONTANTI','CONTO','DESCRIZIONE','RAGIONE_SOCIALE_ORIGINALE','ESERCENTE','DIESEL','BENZINA','FONTE','RICONCILIATO','NOTE'],...tx.sort((a,b)=>a.date.localeCompare(b.date)).map(x=>[x.date,x.category,x.cash??'',x.account??'',x.description,x.merchantRaw||'',x.merchant||'',x.diesel??'',x.petrol??'',x.source||'',x.reconciled?'SI':'NO',x.note||''])],`contabilita_${new Date().toISOString().slice(0,10)}.csv`)}
function exportJson(){const data={version:2,exportedAt:new Date().toISOString(),transactions:tx,aliases,categories:cats};const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=`contabilita_backup_${new Date().toISOString().slice(0,10)}.json`;a.click();URL.revokeObjectURL(u)}
function setup(){setupSelects();if(!$('#homeMonth').dataset.ready){['homeMonth','anMonth'].forEach(id=>{for(let i=0;i<12;i++)$('#'+id).insertAdjacentHTML('beforeend',`<option value="${String(i+1).padStart(2,'0')}">${months[i]}</option>`);$('#'+id).dataset.ready='1'})}resetForm();renderAll()}
$$('nav button').forEach(b=>b.onclick=()=>navTo(b.dataset.view));['homeYear','homeMonth','txYear','txCategory','anYear','anMonth','medYear'].forEach(id=>$('#'+id).onchange=renderAll);$('#search').oninput=renderTransactions;$('#txForm').onsubmit=e=>{const pending=sessionStorage.getItem('pendingBank');submitForm(e);if(pending){const r=JSON.parse(pending),last=tx[tx.length-1];if(last){last.source='Banca';last.bankRef={date:r.date,amount:r.amount,description:r.description};last.reconciled=true;persist()}sessionStorage.removeItem('pendingBank');renderAll()}};$('#cancelEdit').onclick=()=>resetForm();$('#merchantRaw').onblur=()=>{if(!$('#merchant').value.trim())$('#merchant').value=applyAlias($('#merchantRaw').value.trim())};$('#ocrMerchantRaw').onblur=()=>{$('#ocrMerchant').value=applyAlias($('#ocrMerchantRaw').value.trim())};
$('#exportMedical').onclick=()=>{let a=expenses(selected($('#medYear').value,'')).filter(x=>norm(x.category)==='mediche');csvDownload([['DATA','GENERE','CASH','CONTO C.','MERCEOLOGICO','RAGIONE SOCIALE','ESERCENTE'],...a.map(x=>[x.date,x.category,x.cash??'',x.account??'',x.description,x.merchantRaw||'',x.merchant||''])],`spese_mediche_${$('#medYear').value}.csv`)};
let imgFile=null,previewUrl=null,cropImage=null,previewCanvas=null;
// Normalized corner order: TL, TR, BR, BL. All values are in [0,1].
let corners=[],drag=null,previewVersion=0,selectionVersion=0;
const clamp=(v,min,max)=>Math.min(max,Math.max(min,v));
const initialCorners=()=>[{x:.04,y:.04},{x:.96,y:.04},{x:.96,y:.96},{x:.04,y:.96}];
const cornerMid=(i)=>({x:(corners[i].x+corners[(i+1)%4].x)/2,y:(corners[i].y+corners[(i+1)%4].y)/2});
const cross=(a,b,c)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
function validCorners(p){
 const area=Math.abs(p.reduce((s,q,i)=>s+q.x*p[(i+1)%4].y-q.y*p[(i+1)%4].x,0))/2;
 if(area<.003)return false;
 for(let i=0;i<4;i++)if(cross(p[i],p[(i+1)%4],p[(i+2)%4])<.0005)return false;
 return p.every(q=>q.x>=0&&q.x<=1&&q.y>=0&&q.y<=1);
}
function markSelectionChanged(){selectionVersion++;previewCanvas=null;$('#cropResult').hidden=true;$('#cropFeedback').textContent='Selezione modificata: aggiorna l’anteprima prima dell’OCR.'}
function drawCrop(){
 const stage=$('#cropStage'),im=$('#cropPhoto');if(!im.clientWidth||!corners.length)return;
 const w=im.clientWidth,h=im.clientHeight,points=corners.map(p=>`${(p.x*w).toFixed(2)},${(p.y*h).toFixed(2)}`).join(' ');
 $('#cropOverlay').setAttribute('viewBox',`0 0 ${w} ${h}`);
 $('#cropOutline').setAttribute('points',points);
 $('#cropShade').setAttribute('d',`M0 0H${w}V${h}H0Z M${corners.map(p=>`${p.x*w} ${p.y*h}`).join('L')}Z`);
 const handles=$('#cropHandles');handles.replaceChildren();
 const ns='http://www.w3.org/2000/svg';
 for(let i=0;i<8;i++){
  const corner=i<4,p=corner?corners[i]:cornerMid(i-4),x=p.x*w,y=p.y*h;
  const el=document.createElementNS(ns,corner?'circle':'rect');
  if(corner){el.setAttribute('cx',x);el.setAttribute('cy',y);el.setAttribute('r','8')}
  else{el.setAttribute('x',x-8);el.setAttribute('y',y-8);el.setAttribute('width','16');el.setAttribute('height','16');el.setAttribute('rx','3')}
  el.setAttribute('fill',corner?'#22c55e':'#2563eb');el.setAttribute('stroke','white');el.setAttribute('stroke-width','2');
  el.dataset.handle=String(i);el.style.touchAction='none';handles.appendChild(el);
  // Larger invisible touch target, for comfortable editing on phones.
  const hit=document.createElementNS(ns,'circle');hit.setAttribute('cx',x);hit.setAttribute('cy',y);hit.setAttribute('r','17');hit.setAttribute('fill','transparent');hit.dataset.handle=String(i);hit.style.touchAction='none';handles.appendChild(hit);
 }
}
function resetCrop(){corners=initialCorners();markSelectionChanged();drawCrop()}
$('#cropReset').onclick=resetCrop;
$('#cropPhoto').onload=drawCrop;
window.addEventListener('resize',drawCrop);
const stage=$('#cropStage');
stage.addEventListener('pointerdown',e=>{
 const id=e.target.dataset.handle;if(id===undefined)return;
 const rect=$('#cropPhoto').getBoundingClientRect();
 drag={id:Number(id),x:e.clientX,y:e.clientY,orig:corners.map(p=>({...p})),w:rect.width,h:rect.height,pointer:e.pointerId};
 stage.setPointerCapture(e.pointerId);e.preventDefault();
});
stage.addEventListener('pointermove',e=>{
 if(!drag||e.pointerId!==drag.pointer)return;
 const dx=(e.clientX-drag.x)/drag.w,dy=(e.clientY-drag.y)/drag.h;
 const next=drag.orig.map(p=>({...p})),id=drag.id;
 if(id<4){next[id].x=clamp(next[id].x+dx,0,1);next[id].y=clamp(next[id].y+dy,0,1)}
 else{
  const side=id-4,other=(side+1)%4;
  // Top/bottom: vertical only. Left/right: horizontal only.
  if(side===0||side===2){for(const k of [side,other])next[k].y=clamp(next[k].y+dy,0,1)}
  else{for(const k of [side,other])next[k].x=clamp(next[k].x+dx,0,1)}
 }
 if(validCorners(next)){corners=next;markSelectionChanged();drawCrop()}
 e.preventDefault();
});
for(const ev of ['pointerup','pointercancel','lostpointercapture'])stage.addEventListener(ev,()=>drag=null);
function chooseReceipt(file){
 if(!file)return;imgFile=file;if(previewUrl)URL.revokeObjectURL(previewUrl);
 previewUrl=URL.createObjectURL(file);$('#receiptPreview').hidden=true;$('#cropPanel').hidden=false;
 $('#cropPhoto').src=previewUrl;resetCrop();$('#ocrBtn').disabled=false;
 $('#ocrStatus').textContent='Immagine pronta: regola gli otto punti, controlla l’anteprima e poi avvia OCR.';
 for(const id of ['ocrText','ocrDate','ocrAmount','ocrMerchantRaw','ocrMerchant'])$('#'+id).value='';
}
$('#receiptImage').onchange=e=>chooseReceipt(e.target.files[0]);
$('#receiptCamera').onchange=e=>chooseReceipt(e.target.files[0]);
// Solve an 8x8 linear system with partial pivoting for a projective transform.
function solve8(a,b){
 const m=a.map((r,i)=>[...r,b[i]]);
 for(let c=0;c<8;c++){
  let pivot=c;for(let r=c+1;r<8;r++)if(Math.abs(m[r][c])>Math.abs(m[pivot][c]))pivot=r;
  if(Math.abs(m[pivot][c])<1e-10)throw Error('Prospettiva non valida: regola gli angoli.');
  [m[c],m[pivot]]=[m[pivot],m[c]];
  const d=m[c][c];for(let j=c;j<9;j++)m[c][j]/=d;
  for(let r=0;r<8;r++)if(r!==c){const f=m[r][c];for(let j=c;j<9;j++)m[r][j]-=f*m[c][j]}
 }
 return m.map(r=>r[8]);
}
function homography(dest,src){
 const a=[],b=[];
 for(let i=0;i<4;i++){
  const {x,y}=dest[i],{x:u,y:v}=src[i];
  a.push([x,y,1,0,0,0,-u*x,-u*y]);b.push(u);
  a.push([0,0,0,x,y,1,-v*x,-v*y]);b.push(v);
 }
 return solve8(a,b);
}
function warpPerspective(bitmap,quad,maxSide){
 const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
 const source=quad.map(p=>({x:p.x*bitmap.width,y:p.y*bitmap.height}));
 const ow=(distance(source[0],source[1])+distance(source[3],source[2]))/2;
 const oh=(distance(source[0],source[3])+distance(source[1],source[2]))/2;
 const scale=Math.min(1,maxSide/Math.max(ow,oh));
 const w=Math.max(1,Math.round(ow*scale)),h=Math.max(1,Math.round(oh*scale));
 const dest=[{x:0,y:0},{x:w-1,y:0},{x:w-1,y:h-1},{x:0,y:h-1}];
 const H=homography(dest,source);
 const srcCanvas=document.createElement('canvas');srcCanvas.width=bitmap.width;srcCanvas.height=bitmap.height;
 const sc=srcCanvas.getContext('2d',{willReadFrequently:true});sc.drawImage(bitmap,0,0);
 const pixels=sc.getImageData(0,0,bitmap.width,bitmap.height).data;
 const out=document.createElement('canvas');out.width=w;out.height=h;
 const ctx=out.getContext('2d',{willReadFrequently:true}),result=ctx.createImageData(w,h),d=result.data;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const den=H[6]*x+H[7]*y+1,sx=(H[0]*x+H[1]*y+H[2])/den,sy=(H[3]*x+H[4]*y+H[5])/den;
  const i=(y*w+x)*4;
  if(!Number.isFinite(sx)||!Number.isFinite(sy)||sx<0||sy<0||sx>bitmap.width-1||sy>bitmap.height-1){d[i]=d[i+1]=d[i+2]=255;d[i+3]=255;continue}
  const x0=Math.floor(sx),y0=Math.floor(sy),x1=Math.min(x0+1,bitmap.width-1),y1=Math.min(y0+1,bitmap.height-1),fx=sx-x0,fy=sy-y0;
  const ids=[(y0*bitmap.width+x0)*4,(y0*bitmap.width+x1)*4,(y1*bitmap.width+x0)*4,(y1*bitmap.width+x1)*4];
  for(let c=0;c<3;c++)d[i+c]=pixels[ids[0]+c]*(1-fx)*(1-fy)+pixels[ids[1]+c]*fx*(1-fy)+pixels[ids[2]+c]*(1-fx)*fy+pixels[ids[3]+c]*fx*fy;
  d[i+3]=255;
 }
 ctx.putImageData(result,0,0);return out;
}
async function prepareReceipt(file){
 const bitmap=await createImageBitmap(file);
 try{
  const enabled=$('#cropEnable').checked,enhance=$('#ocrEnhance').checked,highDef=$('#ocrHighDef').checked,maxSide=highDef?3600:(enhance?1900:3200);
  let canvas;
  if(enabled){canvas=warpPerspective(bitmap,corners,maxSide)}
  else{const scale=Math.min(1,maxSide/Math.max(bitmap.width,bitmap.height));canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height)}
  if(enhance){const ctx=canvas.getContext('2d',{willReadFrequently:true}),im=ctx.getImageData(0,0,canvas.width,canvas.height),d=im.data;
   for(let i=0;i<d.length;i+=4){const gray=.299*d[i]+.587*d[i+1]+.114*d[i+2];const v=clamp((gray-128)*1.35+140,0,255);d[i]=d[i+1]=d[i+2]=v}ctx.putImageData(im,0,0)}
  return canvas;
 }finally{bitmap.close()}
}
$('#cropPreviewBtn').onclick=async()=>{
 if(!imgFile)return;
 $('#cropPreviewBtn').disabled=true;$('#cropFeedback').textContent='Elaborazione prospettica in corso…';
 const version=selectionVersion;
 try{
  const canvas=await prepareReceipt(imgFile);
  if(version!==selectionVersion)return;
  previewCanvas=canvas;previewVersion=version;
  $('#cropResultImage').src=canvas.toDataURL('image/jpeg',.9);$('#cropResult').hidden=false;
  $('#cropFeedback').textContent='Anteprima pronta. Puoi modificare la selezione o avviare OCR.';
 }catch(e){$('#cropFeedback').textContent='Impossibile raddrizzare: '+(e.message||String(e))}
 finally{$('#cropPreviewBtn').disabled=false}
};
$('#cropBack').onclick=()=>{$('#cropResult').hidden=true;$('#cropFeedback').textContent='Regola i punti e genera una nuova anteprima.'};
$('#cropEnable').onchange=markSelectionChanged;
$('#ocrEnhance').onchange=markSelectionChanged;
$('#ocrHighDef').onchange=markSelectionChanged;
$('#cropDownload').onclick=async()=>{
 if(!imgFile)return;
 const btn=$('#cropDownload');btn.disabled=true;
 try{
  const canvas=previewCanvas&&previewVersion===selectionVersion?previewCanvas:await prepareReceipt(imgFile);
  const blob=await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('Creazione PNG non riuscita')),'image/png'));
  const url=URL.createObjectURL(blob),link=document.createElement('a');
  link.href=url;link.download='scontrino_raddrizzato_'+new Date().toISOString().slice(0,10)+'.png';document.body.appendChild(link);link.click();link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),60000);
  $('#cropFeedback').textContent='PNG generato: controlla la cartella Download del dispositivo.';
 }catch(e){$('#cropFeedback').textContent='Esportazione non riuscita: '+(e.message||String(e))}
 finally{btn.disabled=false}
};
$('#ocrBtn').onclick=async()=>{
 if(!imgFile)return;$('#ocrBtn').disabled=true;$('#ocrStatus').textContent='Preparazione immagine…';
 try{
  if(!window.Tesseract)throw Error('Libreria Tesseract non caricata: controlla la connessione.');
  const input=previewCanvas&&previewVersion===selectionVersion?previewCanvas:await prepareReceipt(imgFile);
  const r=await Tesseract.recognize(input,'ita',{logger:m=>{if(m.status==='recognizing text')$('#ocrStatus').textContent=`OCR ${Math.round(m.progress*100)}%`}});
  const text=r.data.text||'';$('#ocrText').value=text;
  const meaningful=text.match(/[A-Za-zÀ-ÿ]{3,}/g)||[];
  if(meaningful.length<4){$('#ocrStatus').textContent='Testo poco leggibile. Prova a disattivare «Migliora contrasto», oppure regola il ritaglio. Nessun dato registrato.';return}
  const parsed=parseOCR(text);fillOcrDraft(parsed);$('#ocrStatus').textContent=parsed.total===null?'Totale non riconosciuto con certezza: inseriscilo manualmente. Nessun dato salvato.':'Lettura terminata: verifica attentamente importo, data ed esercente. Nessun dato salvato.';
 }catch(e){$('#ocrStatus').textContent='OCR non disponibile: '+(e?.message||String(e))}finally{$('#ocrBtn').disabled=false}
};
$('#useOcr').onclick=()=>{resetForm();$('#date').value=$('#ocrDate').value||'';$('#amount').value=$('#ocrAmount').value;$('#merchantRaw').value=$('#ocrMerchantRaw').value;$('#merchant').value=$('#ocrMerchant').value;$('#category').value=$('#ocrCategory').value;$('#description').value=$('#ocrDescription').value;navTo('add')};
$('#bankFile').onchange=async e=>{const f=e.target.files[0];if(!f)return;const text=await f.text();bankRows=parseBankCsv(text);$('#bankStatus').textContent=bankRows.length?`${bankRows.length} movimenti letti. Controlla le proposte prima di importare.`:'Non sono riuscito a riconoscere i movimenti nel CSV.';renderBank()};
$('#exportJson').onclick=exportJson;$('#exportCsv').onclick=exportAllCsv;$('#importJson').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{const d=JSON.parse(await f.text());if(!Array.isArray(d.transactions))throw Error('Formato non riconosciuto');if(confirm(`Importare ${d.transactions.length} movimenti sostituendo l'archivio locale attuale?`)){tx=d.transactions;aliases=d.aliases||{};cats=[...new Set([...(d.categories||[]),...tx.map(x=>x.category)])].filter(Boolean).sort();persist();setupSelects();renderAll();alert('Backup importato')}}catch(err){alert('Backup non valido: '+err.message)}};
let deferredPrompt;window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e;$('#installBtn').hidden=false});$('#installBtn').onclick=async()=>{if(deferredPrompt){deferredPrompt.prompt();deferredPrompt=null}};if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});setup();
