import {workspacePath} from './workspace-links.js';
import {accessToken,leaveWorkspace} from './auth/client.js';
export function mountWorkspace(user){
let active=true;
const icons={cup:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M5 8h12v7a5 5 0 0 1-5 5H10a5 5 0 0 1-5-5V8Z"/><path d="M17 9h2a3 3 0 0 1 0 6h-2M8 2v3m4-3v3m4-3v3M3 22h18"/></svg>',copy:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="8" y="8" width="12" height="13" rx="2"/><path d="M15 8V3H3v13h5"/></svg>',wa:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M20.5 11.5a8.5 8.5 0 0 1-12.7 7.4L3 20l1.2-4.6A8.5 8.5 0 1 1 20.5 11.5Z"/><path d="M8 7c0 5 3 8 8 8l1-2-3-1-1 1-3-3 1-1-1-3Z"/></svg>'};
const menu=[{id:'tea',name:'Tea',sub:'The office classic',emoji:'☕'},{id:'coffee',name:'Coffee',sub:'A little pick-me-up',emoji:'☕'},{id:'black',name:'Black tea',sub:'Light & refreshing',emoji:'🍵'},{id:'lemon',name:'Lemon tea',sub:'A bright little break',emoji:'🍋'}];
let state={company:'',orders:[],prices:{tea:1200,coffee:2000,black:1000,lemon:1500},ledger:[],sponsor:null};
let roomId=new URLSearchParams(location.search).get('room'),revision=-1,selected='tea',busy=false,paymentName='',polling=false,currentTab='order',connected=false;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:2}).format(n/100);
const total=()=>state.orders.reduce((n,o)=>n+o.qty*o.unitPrice,0);
const drinkName=id=>menu.find(m=>m.id===id)?.name||id;
function toast(message){if(!active)return;const el=document.querySelector('#toast');el.textContent=message;el.classList.add('visible');clearTimeout(window.toastTimer);window.toastTimer=setTimeout(()=>el.classList.remove('visible'),4000)}
async function request(method='GET',body){const token=await accessToken();const res=await fetch('/api/room'+(roomId?'?id='+encodeURIComponent(roomId):''),{method,headers:{Authorization:'Bearer '+token,...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});const json=await res.json();if(res.status===401){await leaveWorkspace();throw Error('Please sign in again.');}if(!res.ok)throw Error(json.error||'Could not save. Try again.');return json}
function accept(data){if(!active||data.revision<revision)return;state=data.data;revision=data.revision;renderOrders();renderBook();document.querySelector('#connection').textContent='● Live workspace';document.querySelector('#connection').classList.remove('offline')}
async function act(action){if(busy)return false;busy=true;document.querySelector('#order-form button[type=submit]').disabled=true;try{accept(await request('POST',action));return true}catch(e){toast(e.message);return false}finally{busy=false;document.querySelector('#order-form button[type=submit]')?.toggleAttribute('disabled',!roomId)}}
async function sync(){if(!active||!connected||!roomId||busy||polling)return;polling=true;try{const data=await request();if(data.revision!==revision)accept(data);document.querySelector('#connection').textContent='● Live workspace';document.querySelector('#connection').classList.remove('offline')}catch(e){if(!active)return;document.querySelector('#connection').textContent='● Reconnecting…';document.querySelector('#connection').classList.add('offline')}finally{polling=false}}
function summary(){return `☕ ${state.company} — Tea break\n\n`+state.orders.map(o=>`${o.name}: ${o.qty} × ${drinkName(o.drink)}${o.note?' ('+o.note+')':''}`).join('\n')+'\n\n'+menu.map(m=>{const q=state.orders.filter(o=>o.drink===m.id).reduce((n,o)=>n+o.qty,0);return q?`${q} ${m.name}`:''}).filter(Boolean).join(' · ')+`\nTotal: ${money(total())}`+(state.sponsor?`\nThis round is on ${state.sponsor.name} 💚`:'')}
async function copy(text,message){try{await navigator.clipboard.writeText(text);toast(message)}catch{document.querySelector('#copy-fallback').value=text;document.querySelector('#copy-dialog').showModal()}}
function inviteLink(){return location.origin+location.pathname+'?room='+roomId}
function recentWorkspaces(){
 try{const entries=JSON.parse(localStorage.getItem('tea-workspaces:'+user.id)||'[]');return Array.isArray(entries)?entries.filter(e=>typeof e.name==='string'&&workspacePath(e.path,location.origin)).slice(0,3):[];}catch{return [];}
}
function rememberWorkspace(){
 try{const path='/?room='+roomId;localStorage.setItem('tea-workspaces:'+user.id,JSON.stringify([{name:state.company,path},...recentWorkspaces().filter(e=>e.path!==path)].slice(0,3)));}catch{}
}
function showTab(tab,focus=false){
 currentTab=tab;
 document.querySelector('#order-panel').hidden=tab!=='order';
 document.querySelector('#book-panel').hidden=tab!=='book';
 document.querySelectorAll('[data-tab]').forEach(button=>{const chosen=button.dataset.tab===tab;button.setAttribute('aria-selected',chosen);button.tabIndex=chosen?0:-1;if(chosen&&focus)button.focus()});
}
function render(){
const recent=recentWorkspaces();
document.querySelector('#app').innerHTML=`
<header><a class="brand" href="/" aria-label="Chayakkada home"><span class="brand-icon">${icons.cup}</span>chayakkada<span class="brand-dot">.</span></a><div class="account"><span class="account-avatar" aria-hidden="true">${esc((user.email||'You')[0].toUpperCase())}</span><span class="account-email" title="${esc(user.email)}">${esc(user.email)}</span><button id="sign-out">Sign out</button></div></header>
<main class="workspace-main">
<section class="intro"><div class="eyebrow"><span></span> YOUR OFFICE TEA CORNER</div><h1>A little break.<br>A little <em>together.</em><span class="flower">✳</span></h1><p>Everyone picks their cup.<br>One happy order for the whole office.</p><div class="intro-bottom"><span class="tiny-cup">${icons.cup}</span><span>A shared tea round.<br><strong>A little less work. A little more warmth.</strong></span></div><div class="tea-art" aria-hidden="true"><div class="steam s1"></div><div class="steam s2"></div><div class="steam s3"></div><div class="cup-handle"></div><div class="big-cup"><div class="tea-surface"></div><span>take it<br><i>easy.</i></span></div><div class="saucer"></div><div class="art-leaf leaf-one"></div><div class="art-leaf leaf-two"></div><span class="art-caption">a cup of good company</span></div></section>
<div class="workspace-area">
<section class="setup-card" id="workspace-setup" ${roomId?'hidden':''}><span class="eyebrow">YOU’RE IN. LET’S PUT THE KETTLE ON.</span><h2>Your office tea corner</h2><p class="setup-description">Create a space for your company, or join your team’s tea round.</p>
<form id="company-form"><label class="field-label" for="company">Company name</label><div class="company-wrap"><span aria-hidden="true">▦</span><input id="company" maxlength="80" placeholder="e.g. Acme Studio" required autocomplete="organization"><span class="saved" id="saved"></span></div><button id="create-room" class="primary create-room" type="submit">Create company workspace <span>＋</span></button></form>
<div class="setup-or"><span>or join your team</span></div><form id="join-form"><label class="field-label" for="join-link">Have an invitation link?</label><div class="join-input"><input id="join-link" type="text" placeholder="Paste your company’s invite link" required aria-describedby="join-message"><button type="submit" class="join-button">Join →</button></div><p id="join-message" class="inline-message" role="status"></p></form>
${recent.length?`<div class="recent-workspaces"><span class="eyebrow">PICK UP WHERE YOU LEFT OFF</span>${recent.map(e=>`<a href="${esc(workspacePath(e.path,location.origin))}"><span class="recent-icon">${icons.cup}</span><span>${esc(e.name)}</span><span aria-hidden="true">→</span></a>`).join('')}</div>`:''}
<p class="setup-foot">Invite your teammates. Gather the orders. Share with the tea shop.</p></section>
<div id="workspace-loading" class="workspace-state" ${!roomId?'hidden':''}><span class="loading-cup">${icons.cup}</span><h2>Opening your tea corner…</h2><p>Your company’s round will be here in a moment.</p></div>
<div id="workspace-error" class="workspace-state" hidden><span class="loading-cup">${icons.cup}</span><h2>We couldn’t open this workspace.</h2><p id="workspace-error-message"></p><button id="retry-workspace" class="primary">Try again</button><a href="/">Back to your workspaces</a></div>
<section class="company-heading" id="room-tools" hidden><div><span class="eyebrow">YOUR COMPANY WORKSPACE</span><h2 id="workspace-company"></h2><span id="connection" role="status">Connecting…</span></div><button id="invite">${icons.copy} Invite team</button></section>
<nav class="workspace-tabs" role="tablist" aria-label="Workspace" id="workspace-tabs" hidden><button role="tab" id="order-tab" data-tab="order" aria-selected="true" aria-controls="order-panel">${icons.cup} Tea round <span id="tab-cups">0</span></button><button role="tab" id="book-tab" data-tab="book" aria-selected="false" aria-controls="book-panel" tabindex="-1">▤ Pattu book <span id="tab-due"></span></button></nav>
<div id="order-panel" role="tabpanel" aria-labelledby="order-tab" hidden>
<section class="workspace"><div class="workspace-head"><span class="step">01</span><div><h2>What are you having?</h2><p>Your cup. Your way.</p></div></div><form id="order-form"><label class="field-label" for="person">Your name</label><input id="person" maxlength="60" placeholder="What should we call you?" required autocomplete="given-name"><fieldset><legend class="field-label">Pick your cup</legend><div class="drink-grid">${menu.map(m=>`<button type="button" class="drink ${m.id===selected?'selected':''}" data-drink="${m.id}" aria-pressed="${m.id===selected}"><span class="drink-emoji ${m.id}">${m.emoji}</span><strong>${m.name}</strong><small>${m.sub}</small><span class="drink-price" data-price="${m.id}">${money(state.prices[m.id])}</span><span class="drink-check">✓</span></button>`).join('')}</div></fieldset><div class="order-options"><div><label class="field-label" for="quantity">How many?</label><div class="counter"><button type="button" id="minus" aria-label="One fewer">−</button><input id="quantity" type="number" min="1" max="50" value="1" aria-label="Number of drinks"><button type="button" id="plus" aria-label="One more">+</button></div></div><div class="note-field"><label class="field-label" for="note">Any preferences? <span>(optional)</span></label><input id="note" maxlength="100" placeholder="Less sugar, extra strong…"></div></div><div class="add-order-footer"><span id="your-order-price">${money(state.prices[selected])}</span><button class="primary add" type="submit">Add my order <span>＋</span></button></div></form><p class="form-foot">Your order appears for everyone in this workspace.</p></section>
<section class="round"><div class="round-heading"><div><span class="eyebrow">EVERYONE’S TEA, TOGETHER</span><h2 id="round-name">The office round</h2></div><span class="round-count" id="round-count"></span></div><div id="sponsor-box"></div><div id="orders"></div><div id="share-actions"></div><div class="local-note">One person sends the combined order to the tea shop.</div></section>
</div>
<div id="book-panel" role="tabpanel" aria-labelledby="book-tab" hidden><section class="pattu" id="pattu"><div class="round-heading"><div><span class="eyebrow">A LITTLE TRUST, A LITTLE TEA</span><h2>Pattu book <span lang="ml">പറ്റുപുസ്തകം</span></h2></div><span class="book-symbol">▤</span></div><p class="book-help">Who owes what, all in one little book. Finish a tea round to record dues.</p><div id="book-content"></div><details class="price-settings"><summary>Drink prices <span>₹</span></summary><p>Set your shop’s prices before ordering. Existing orders keep their original price.</p><form id="prices-form"><div class="prices-grid">${menu.map(m=>`<label>${m.name}<input required type="number" min="0" max="1000" step="0.01" data-edit-price="${m.id}" value="${state.prices[m.id]/100}" aria-label="${m.name} price in rupees"></label>`).join('')}</div><button class="primary" type="submit">Save prices</button></form></details><p class="local-note">Payments are recorded here after you receive them.</p></section></div>
<p class="workspace-sharing" id="workspace-sharing" hidden>Only share your invite with teammates. Signed-in people with the link can manage this workspace. <a href="/">Switch workspace</a></p>
</div></main>
<footer><span class="footer-brand">${icons.cup} Small breaks. Better days.</span><span>Made with a little warmth <span class="heart">♡</span></span></footer><div id="toast" role="status" aria-live="polite"></div>
<dialog id="copy-dialog"><h2>Copy & share</h2><p>Select the text below and copy it.</p><textarea id="copy-fallback" rows="10" readonly></textarea><button class="primary" id="close-dialog">Done</button></dialog>
<dialog id="sponsor-dialog"><form id="sponsor-form"><span class="eyebrow">A SMALL ACT OF KINDNESS</span><h2>This round’s on me 💚</h2><p>Cover the whole team’s tea, including drinks added later. The total goes against your name in the Pattu book.</p><label class="field-label" for="sponsor-name">Sponsor’s name</label><input id="sponsor-name" required maxlength="60" placeholder="Your name"><button class="primary" type="submit">Treat the team</button><button type="button" class="dialog-cancel" data-close="sponsor-dialog">Maybe next time</button></form></dialog>
<dialog id="payment-dialog"><form id="payment-form"><h2>A little less to owe.</h2><p id="payment-person"></p><label class="field-label" for="payment-amount">Amount received (₹)</label><input required id="payment-amount" type="number" min="0.01" step="0.01"><p class="book-help">Record money you’ve already received. This doesn’t transfer money.</p><button class="primary" type="submit">Record payment</button><button type="button" class="dialog-cancel" data-close="payment-dialog">Cancel</button></form></dialog>`;
bind();renderOrders();renderBook();
}
function updateOrderPrice(){
 const qty=Number(document.querySelector('#quantity').value)||1;
 document.querySelector('#your-order-price').textContent=money(state.prices[selected]*qty);
}
async function openWorkspace(){
 document.querySelector('#workspace-error').hidden=true;document.querySelector('#workspace-loading').hidden=false;
 try{connectUI(await request());}catch(e){if(!active)return;document.querySelector('#workspace-loading').hidden=true;document.querySelector('#workspace-error').hidden=false;document.querySelector('#workspace-error-message').textContent=e.message;}
}
function renderOrders(){
 const count=state.orders.reduce((n,o)=>n+o.qty,0);
 document.querySelector('#round-name').textContent=(state.company||'Your office')+'’s order';
 document.querySelector('#tab-cups').textContent=count;updateOrderPrice();
 document.querySelector('#round-count').textContent=`${count} ${count===1?'cup':'cups'}`;
 document.querySelectorAll('[data-price]').forEach(el=>el.textContent=money(state.prices[el.dataset.price]));
 document.querySelector('#sponsor-box').innerHTML=roomId?(state.sponsor?`<div class="sponsor-banner"><span>💚</span><div><strong>This round’s on ${esc(state.sponsor.name)}!</strong><small>One kind person. Everyone’s tea covered.</small></div><button id="unsponsor" aria-label="Remove sponsor">×</button></div>`:'<button class="sponsor-offer" id="sponsor">♡ Feeling generous? <strong>Sponsor this round</strong></button>'):'';
 document.querySelector('#sponsor')?.addEventListener('click',()=>{document.querySelector('#sponsor-name').value=document.querySelector('#person').value;document.querySelector('#sponsor-dialog').showModal()});
 document.querySelector('#unsponsor')?.addEventListener('click',async()=>{if(confirm('Remove the sponsor? Each person will owe for their own drinks.'))await act({type:'unsponsor'})});
 document.querySelector('#orders').innerHTML=count?`<div class="order-list">${state.orders.map(o=>`<div class="order-row"><span class="avatar">${esc(o.name[0]?.toUpperCase())}</span><div class="order-person"><strong>${esc(o.name)}</strong><small>${esc(drinkName(o.drink))}${o.note?' · '+esc(o.note):''}</small></div><div class="order-cost"><strong>${money(o.qty*o.unitPrice)}</strong><small>× ${o.qty}</small></div><button class="remove" data-remove="${o.id}" aria-label="Remove ${esc(o.name)}’s order">×</button></div>`).join('')}</div><div class="total-line"><span>${count} ${count===1?'drink':'drinks'} · ${state.sponsor?'Covered by sponsor':'Pay after your tea'}</span><strong>${money(total())} in total</strong></div>`:'<div class="empty"><span class="empty-icon">'+icons.cup+'</span><h3>The kettle’s on. Who’s first?</h3><p>Add a name and pick a drink.<br>Your team’s orders appear here, together.</p></div>';
 document.querySelector('#share-actions').innerHTML=`<button class="primary whatsapp" id="whatsapp" ${!count?'disabled':''}>${icons.wa} Send order to tea shop <span>→</span></button><div class="secondary-actions"><button id="copy-order" ${!count?'disabled':''}>${icons.copy} Copy order</button><button id="copy-link" ${!roomId?'disabled':''}>${icons.copy} Invite employees</button></div>${count?'<button class="finish-round" id="finish-round">Finish round & add to Pattu book →</button><p class="finish-hint">After tea is delivered. Keeps dues, starts a fresh round.</p>':''}`;
 document.querySelectorAll('[data-remove]').forEach(b=>b.onclick=()=>act({type:'remove',id:b.dataset.remove}));
 document.querySelector('#whatsapp').onclick=()=>window.open('https://wa.me/?text='+encodeURIComponent(summary()),'_blank','noopener,noreferrer');
 document.querySelector('#copy-order').onclick=()=>copy(summary(),'Order copied. Send it to your tea shop.');
 document.querySelector('#copy-link').onclick=()=>copy(inviteLink(),'Workspace link copied. Invite your team!');
 document.querySelector('#finish-round')?.addEventListener('click',async()=>{if(confirm('Tea delivered? Record '+money(total())+' in the Pattu book and start a fresh round?')){if(await act({type:'finish'})){showTab('book',true);toast('Round recorded. Ready for a fresh cup!')}}});
}
function balances(){const people=new Map();for(const e of state.ledger){const key=e.name.toLocaleLowerCase();const p=people.get(key)||{name:e.name,due:0,paid:0};if(e.type==='charge')p.due+=e.amount;else{p.due-=e.amount;p.paid+=e.amount}people.set(key,p)}return [...people.values()]}
function renderBook(){
 const people=balances(),due=people.reduce((n,p)=>n+p.due,0),paid=people.reduce((n,p)=>n+p.paid,0);
 document.querySelector('#tab-due').textContent=due?money(due):'';
 document.querySelector('#book-content').innerHTML=`<div class="book-totals"><div><span>To collect</span><strong id="total-due">${money(due)}</strong></div><div><span>Payments received</span><strong>${money(paid)}</strong></div></div>${people.length?`<div class="book-people">${people.map((p,i)=>`<div class="book-person"><span class="avatar">${esc(p.name[0]?.toUpperCase())}</span><div><strong>${esc(p.name)}</strong><small>${p.due?money(p.due)+' to pay':'All settled ✓'}</small></div><button class="collect" data-person="${i}" ${p.due<=0?'disabled':''}>${p.due>0?'Record payment':'Paid ✓'}</button></div>`).join('')}</div><details class="book-history"><summary>View history <span>${state.ledger.length} entries</span></summary>${[...state.ledger].reverse().map(e=>`<div class="history-row"><div><strong>${esc(e.name)}</strong><small>${esc(e.description)} · ${new Date(e.at).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}</small></div><span class="${e.type==='payment'?'paid':''}">${e.type==='payment'?'−':'+'}${money(e.amount)}</span>${e.type==='payment'?`<button data-undo="${e.id}" aria-label="Undo payment by ${esc(e.name)}">Undo</button>`:''}</div>`).join('')}</details><button class="export-book" id="export-book">${icons.copy} Copy balances</button>`:'<p class="book-empty">A clean page. Finish your first round to start the book.</p>'}`;
 document.querySelectorAll('[data-person]').forEach(b=>b.onclick=()=>{const p=people[+b.dataset.person];paymentName=p.name;document.querySelector('#payment-person').textContent=p.name+' · '+money(p.due)+' due';const amount=document.querySelector('#payment-amount');amount.value=(p.due/100).toFixed(2);amount.max=(p.due/100).toFixed(2);document.querySelector('#payment-dialog').showModal()});
 document.querySelectorAll('[data-undo]').forEach(b=>b.onclick=async()=>{if(confirm('Undo this payment record? The amount will be owed again.'))await act({type:'undoPayment',id:b.dataset.undo})});
 document.querySelector('#export-book')?.addEventListener('click',()=>copy(`${state.company} — Pattu book\n\n`+people.map(p=>`${p.name}: ${money(p.due)} due`).join('\n')+`\n\nTotal to collect: ${money(due)}`,'Balances copied.'));
}
function bind(){
 document.querySelector('#sign-out').onclick=async()=>{active=false;document.querySelector('#app').replaceChildren();await leaveWorkspace()};
 document.querySelector('#company-form').onsubmit=async e=>{e.preventDefault();const company=document.querySelector('#company').value.trim();if(!company){document.querySelector('#company').focus();toast('Enter your company name first.');return}const button=document.querySelector('#create-room');if(button.disabled)return;button.disabled=true;button.textContent='Creating workspace…';try{const data=await request('POST',{company});roomId=data.id;history.replaceState(null,'',inviteLink());connectUI(data);toast('Workspace ready. Invite your employees!')}catch(e){toast(e.message)}finally{button.disabled=false;button.textContent='Create company workspace ＋'}};
 document.querySelector('#join-form').onsubmit=e=>{e.preventDefault();const path=workspacePath(document.querySelector('#join-link').value,location.origin);if(path)location.assign(path);else document.querySelector('#join-message').textContent='Paste a valid invitation link from your teammate.'};
 document.querySelector('#retry-workspace').onclick=openWorkspace;
 document.querySelectorAll('[data-tab]').forEach(button=>{button.onclick=()=>showTab(button.dataset.tab);button.onkeydown=e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();showTab(e.key==='Home'?'order':e.key==='End'?'book':currentTab==='order'?'book':'order',true)}}});
 document.querySelector('#invite').onclick=()=>copy(inviteLink(),'Workspace link copied. Send it to your team!');
 document.querySelectorAll('[data-drink]').forEach(b=>b.onclick=()=>{selected=b.dataset.drink;document.querySelectorAll('[data-drink]').forEach(x=>{x.classList.toggle('selected',x===b);x.setAttribute('aria-pressed',x===b)});updateOrderPrice()});
 const q=document.querySelector('#quantity');document.querySelector('#minus').onclick=()=>{q.value=Math.max(1,(+q.value||1)-1);updateOrderPrice()};document.querySelector('#plus').onclick=()=>{q.value=Math.min(50,(+q.value||1)+1);updateOrderPrice()};q.oninput=updateOrderPrice;
 document.querySelector('#order-form').onsubmit=async e=>{e.preventDefault();if(!roomId){toast('Create a company workspace first.');document.querySelector('#company').focus();return}const name=document.querySelector('#person').value.trim();if(!name)return;if(await act({type:'add',name,drink:selected,qty:+q.value,note:document.querySelector('#note').value})){try{localStorage.setItem('tea-person:'+user.id,name)}catch{}document.querySelector('#note').value='';q.value=1;updateOrderPrice();toast('Your order is in. Everyone can see it!')}};
 document.querySelector('#sponsor-form').onsubmit=async e=>{e.preventDefault();if(await act({type:'sponsor',name:document.querySelector('#sponsor-name').value})){document.querySelector('#sponsor-dialog').close();toast('A little generosity goes a long way 💚')}};
 document.querySelector('#payment-form').onsubmit=async e=>{e.preventDefault();if(await act({type:'payment',name:paymentName,amount:Math.round(Number(document.querySelector('#payment-amount').value)*100)})){document.querySelector('#payment-dialog').close();toast('Payment recorded. Thank you!')}};
 document.querySelector('#prices-form').onsubmit=async e=>{e.preventDefault();if(!roomId){toast('Create a workspace first.');return}const prices=Object.fromEntries([...document.querySelectorAll('[data-edit-price]')].map(el=>[el.dataset.editPrice,Math.round(Number(el.value)*100)]));if(await act({type:'prices',prices}))toast('Prices saved for new orders.');};
 document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>document.getElementById(b.dataset.close).close());document.querySelector('#close-dialog').onclick=()=>document.querySelector('#copy-dialog').close();
 try{document.querySelector('#person').value=localStorage.getItem('tea-person:'+user.id)||user.user_metadata?.full_name||user.user_metadata?.name||''}catch{}
}
function connectUI(data){
 if(!active)return;connected=true;
 document.querySelector('#workspace-setup').hidden=true;
 document.querySelector('#workspace-loading').hidden=true;
 document.querySelector('#workspace-error').hidden=true;
 document.querySelector('#room-tools').hidden=false;
 document.querySelector('#workspace-tabs').hidden=false;
 document.querySelector('#workspace-sharing').hidden=false;
 document.querySelector('#workspace-company').textContent=data.data.company;
 document.querySelector('#order-form button[type=submit]').disabled=false;
 accept(data);rememberWorkspace();showTab(currentTab);
 document.querySelectorAll('[data-edit-price]').forEach(el=>el.value=state.prices[el.dataset.editPrice]/100);
}
render();
if(roomId)openWorkspace();
const timer=setInterval(()=>{if(!document.hidden)sync()},2500);window.addEventListener('focus',sync);
return ()=>{active=false;clearInterval(timer);window.removeEventListener('focus',sync);clearTimeout(window.toastTimer);document.querySelector('#app').replaceChildren();};
}
