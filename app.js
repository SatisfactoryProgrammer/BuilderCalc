const errorBox = document.querySelector('#error');
let entry = '0', stored = null, pending = null, replaceEntry = false, expression = '';
function gcd(a,b){a=a<0n?-a:a;b=b<0n?-b:b;while(b)[a,b]=[b,a%b];return a||1n}
function rat(n,d=1n){if(!d)throw Error('Cannot divide by zero.');if(d<0n){n=-n;d=-d}const g=gcd(n,d);return{n:n/g,d:d/g}}
function fromDecimal(s){s=String(s).trim();const neg=s.startsWith('-');if(neg)s=s.slice(1);const fraction=s.match(/^(\d+)\/(\d+)$/);if(fraction)return rat((neg?-1n:1n)*BigInt(fraction[1]),BigInt(fraction[2]));const [w,f='']=s.split('.');const d=10n**BigInt(f.length);return rat((neg?-1n:1n)*(BigInt(w||0)*d+BigInt(f||0)),d)}
function decimal(v,digits=6){const neg=v.n<0n,n=neg?-v.n:v.n,scale=10n**BigInt(digits),rounded=(n*scale*2n+v.d)/(2n*v.d),whole=rounded/scale,frac=(rounded%scale).toString().padStart(digits,'0').replace(/0+$/,'');return `${neg?'−':''}${whole}${frac?'.'+frac:''}`}
function operate(a,b,op){if(op==='+')return rat(a.n*b.d+b.n*a.d,a.d*b.d);if(op==='−')return rat(a.n*b.d-b.n*a.d,a.d*b.d);if(op==='×')return rat(a.n*b.n,a.d*b.d);return rat(a.n*b.d,a.d*b.n)}
function currentValue(){return fromDecimal(entry)}
function tapeResult(v,denominator){const d=BigInt(denominator),neg=v.n<0n,n=neg?-v.n:v.n,u=(n*d*2n+v.d)/(2n*v.d),w=u/d,r=u%d,g=gcd(r,d),fraction=r?`${r/g}/${d/g}`:'',sign=neg&&u?'−':'',mark=`${sign}${w===0n&&fraction?'':w}${fraction?' '+fraction:''}`;const rounded=rat((neg?-u:u),d);let error=rat(v.n*rounded.d-rounded.n*v.d,v.d*rounded.d);if(error.n<0n)error=rat(-error.n,error.d);return{mark,error,withinTolerance:error.n*64n<=error.d}}
function fractionSvg(n,d,extraClass=''){return`<svg class="fraction-svg ${extraClass}" viewBox="0 0 38 44" aria-hidden="true"><text x="19" y="17">${n}</text><path d="M4 22H34"/><text x="19" y="41">${d}</text></svg>`}
function render(){const value=currentValue();document.querySelector('#displayValue').textContent=decimal(value,6);document.querySelector('#expression').textContent=expression||'Inches';const marks=[2,4,8,16,32];document.querySelector('#tapeRows').innerHTML=marks.map(d=>{const result=tapeResult(value,d),label=`<span class="tape-label" aria-label="Nearest 1/${d} inch">Nearest ${fractionSvg(1,d,'tape-fraction')}<span>″</span></span>`;if(!result.withinTolerance)return`<div class="tape-row unavailable">${label}<strong>—</strong></div>`;const errorText=result.error.n===0n?'Exact':`off by ${decimal(result.error,6)}″`;return`<div class="tape-row">${label}<strong>${result.mark}″<small>${errorText}</small></strong></div>`}).join('');}
function appendDigit(d){if(replaceEntry){entry=d;replaceEntry=false}else if(entry==='0')entry=d;else if(entry.length<12)entry+=d;render()}
function clearAll(){entry='0';stored=null;pending=null;replaceEntry=false;expression='';errorBox.hidden=true;render()}
function chooseOperator(op){try{if(pending&&!replaceEntry){const value=operate(stored,currentValue(),pending);stored=value;entry=decimal(value,8); }else stored=currentValue();pending=op;expression=`${decimal(stored,6)} ${op}`;replaceEntry=true;errorBox.hidden=true;render()}catch(e){errorBox.textContent=e.message;errorBox.hidden=false}}
function equals(){if(!pending||!stored)return;try{const right=currentValue(),result=operate(stored,right,pending);expression=`${decimal(stored,6)} ${pending} ${decimal(right,6)} =`;entry=decimal(result,10);stored=null;pending=null;replaceEntry=true;errorBox.hidden=true;render()}catch(e){errorBox.textContent=e.message;errorBox.hidden=false}}
document.querySelectorAll('[data-digit]').forEach(b=>b.addEventListener('click',()=>appendDigit(b.dataset.digit)));
document.querySelectorAll('[data-op]').forEach(b=>b.addEventListener('click',()=>chooseOperator(b.dataset.op)));
document.querySelectorAll('.fraction-key').forEach(b=>b.addEventListener('click',()=>{const f=fromDecimal(b.dataset.fraction);const value=replaceEntry?f:rat(currentValue().n*f.d+f.n*currentValue().d,currentValue().d*f.d);entry=decimal(value,8);replaceEntry=false;render()}));
document.querySelector('[data-key="clear"]').addEventListener('click',clearAll);
document.querySelector('[data-key="sign"]').addEventListener('click',()=>{if(entry!=='0')entry=entry.startsWith('-')?entry.slice(1):'-'+entry;render()});
document.querySelector('[data-key="back"]').addEventListener('click',()=>{if(replaceEntry){entry='0';replaceEntry=false}else entry=entry.length>1?entry.slice(0,-1):'0';render()});
document.querySelector('[data-key="decimal"]').addEventListener('click',()=>{if(replaceEntry){entry='0';replaceEntry=false}if(!entry.includes('.'))entry+='.';render()});
document.querySelector('[data-key="equals"]').addEventListener('click',equals);
document.querySelector('#helpButton').addEventListener('click',()=>document.querySelector('#helpDialog').showModal());
document.querySelector('#gotIt').addEventListener('click',()=>document.querySelector('#helpDialog').close());
document.addEventListener('keydown',e=>{if(/^\d$/.test(e.key))appendDigit(e.key);else if(e.key==='.')document.querySelector('[data-key="decimal"]').click();else if(e.key==='Enter'||e.key==='=')equals();else if(e.key==='Escape')clearAll();else if(e.key==='Backspace')document.querySelector('[data-key="back"]').click();else if(['+','-','*','/'].includes(e.key))chooseOperator(({'+':'+','-':'−','*':'×','/':'÷'})[e.key])});
render();
if('serviceWorker'in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('./service-worker.js').catch(()=>{});
