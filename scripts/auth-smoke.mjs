import {spawn} from 'node:child_process';
import {existsSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
let vite,browser,page;const folder=mkdtempSync(join(tmpdir(),'orattice-browser-'));
try{
 vite=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','5176','--strictPort'],{env:{...process.env,SUPABASE_SECRET_KEY:'',SUPABASE_SERVICE_ROLE_KEY:'',TEA_SQLITE_PATH:join(folder,'tea.sqlite'),VERCEL:''},stdio:['ignore','pipe','pipe']});let logs='';vite.stdout.on('data',d=>logs+=d);vite.stderr.on('data',d=>logs+=d);
 const base='http://127.0.0.1:5176';let ready=false;for(let i=0;i<100;i++){try{if((await fetch(base)).ok){ready=true;break}}catch{}await new Promise(r=>setTimeout(r,100));}assert.ok(ready,logs);
 browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH||existsSync('/usr/bin/chromium')?{executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium'}:{}),args:['--no-sandbox']});
 const a=await browser.newContext({viewport:{width:1440,height:1050},permissions:['clipboard-read','clipboard-write']});page=await a.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base);await page.locator('#unlock-password').waitFor();assert.equal(page.url(),base+'/');assert.equal(await page.locator('#company').count(),0);assert.equal(await page.locator('#join-form').count(),0);assert.equal(await page.locator('input[type=email]').count(),0);assert.match(await page.locator('h1').textContent(),/Orattice/);
 await page.waitForFunction(()=>document.querySelector('#delivery-video').readyState>=2);assert.equal(await page.locator('#delivery-video').evaluate(v=>v.muted),true);await page.waitForFunction(()=>document.querySelector('#delivery-video').currentTime>0.1);await page.locator('#motion-toggle').click();assert.equal(await page.locator('#delivery-video').evaluate(v=>v.paused),true);await page.locator('#motion-toggle').click();
 await page.locator('#unlock-password').fill('tea-time');await page.locator('#unlock-button').click();await page.locator('#workspace-company').waitFor();assert.equal(page.url(),base+'/');
 await page.locator('#person').fill('Anjali');await page.locator('.add').click();await page.locator('.order-row').waitFor();await page.waitForFunction(()=>document.querySelector('#toast').textContent.includes('Productivity'));
 const b=await browser.newContext({viewport:{width:390,height:844}}),employee=await b.newPage();employee.on('pageerror',e=>errors.push(e.message));await employee.goto(base);await employee.locator('#unlock-password').waitFor();assert.equal(await employee.locator('#order-panel').isVisible(),false);
 await employee.locator('#unlock-password').fill('wrong-password');await employee.locator('#unlock-button').click();await employee.locator('#unlock-message').filter({hasText:'isn’t correct'}).waitFor();
 await employee.locator('#unlock-password').fill('tea-time');await employee.locator('#unlock-button').click();await employee.locator('.order-row').waitFor();assert.equal(employee.url(),base+'/');
 await employee.locator('#person').fill('Rahul');await employee.locator('.add').click();await page.waitForFunction(()=>document.querySelectorAll('.order-row').length===2);await page.locator('#copy-link').click();assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),base+'/');
 await page.locator('#copy-order').click();assert.match(await page.evaluate(()=>navigator.clipboard.readText()),/Orattice.*[\s\S]*Anjali.*[\s\S]*Rahul/);
 await employee.reload();await employee.locator('#workspace-company').waitFor();assert.equal(await employee.locator('.order-row').count(),2);
 // Inspect both tabs and media in desktop and phone layouts, including reduced motion.
 for(const width of [320,390,768,1440]){await employee.setViewportSize({width,height:900});assert.equal(await employee.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'order width '+width);}
 await page.locator('#motion-toggle').click();await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:'/tmp/orattice-desktop.png',fullPage:true});await employee.setViewportSize({width:390,height:844});await employee.locator('#motion-toggle').click();await employee.screenshot({path:'/tmp/orattice-mobile.png',fullPage:true});
 await employee.emulateMedia({reducedMotion:'reduce'});await employee.waitForFunction(()=>document.querySelector('#delivery-video').paused);assert.equal(await employee.locator('html').evaluate(el=>el.classList.contains('motion-paused')),true);
 await employee.locator('#sponsor').click();await employee.locator('#sponsor-name').fill('Meera');await employee.locator('#sponsor-form button[type=submit]').click();await employee.locator('.sponsor-banner').waitFor();assert.equal(await employee.locator('.tea-confetti').count(),0);
 employee.once('dialog',d=>d.accept());await employee.locator('#finish-round').click();await employee.locator('#pattu').waitFor();assert.equal(await employee.locator('#total-due').textContent(),'₹24.00');
 await employee.locator('[data-person]').click();await employee.locator('#payment-amount').fill('12');await employee.locator('#payment-form button[type=submit]').click();await employee.waitForFunction(()=>document.querySelector('#total-due').textContent==='₹12.00');await employee.screenshot({path:'/tmp/orattice-book-mobile.png',fullPage:true});
 for(const width of [320,390,768,1440]){await employee.setViewportSize({width,height:900});assert.equal(await employee.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'book width '+width);}
 await employee.reload();await employee.locator('#book-tab').click();assert.equal(await employee.locator('#total-due').textContent(),'₹12.00');
 await employee.locator('#sign-out').click();await employee.locator('#unlock-password').waitFor();assert.equal(await employee.locator('#order-panel').isVisible(),false);assert.equal((await fetch(base+'/api/room')).status,401);
 assert.equal((await fetch(base+'/api/room',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({company:'Another company',password:'tea-time'})})).status,400);
 // Restart the backend and prove orders/payments are stored on disk, not in memory.
 vite.kill('SIGTERM');await new Promise(r=>vite.once('exit',r));
 vite=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','5176','--strictPort'],{env:{...process.env,SUPABASE_SECRET_KEY:'',SUPABASE_SERVICE_ROLE_KEY:'',TEA_SQLITE_PATH:join(folder,'tea.sqlite'),VERCEL:''},stdio:['ignore','pipe','pipe']});vite.stdout.on('data',()=>{});vite.stderr.on('data',()=>{});
 let restored;for(let i=0;i<100;i++){try{const res=await fetch(base+'/api/room?access=unlock',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:'tea-time'})});if(res.ok){restored=await res.json();break}}catch{}await new Promise(r=>setTimeout(r,100));}assert.equal(restored.data.ledger.reduce((s,e)=>s+(e.type==='charge'?e.amount:-e.amount),0),1200);
 assert.deepEqual(errors,[]);console.log('PASS: Orattice-only root; no company/email/join setup; one shared password; two employee browsers; video loads muted; pause; reduced motion; playful reactions; copy order/site; refresh; sponsor; payments; responsive order/book at 320/390/768/1440; lock; multi-company creation blocked; backend restart preserves ledger.');
}catch(error){if(page)await page.screenshot({path:'/tmp/orattice-test-failure.png',fullPage:true}).catch(()=>{});throw error;}finally{await browser?.close();vite?.kill('SIGTERM');rmSync(folder,{recursive:true,force:true});}
