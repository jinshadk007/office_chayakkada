import {spawn} from 'node:child_process';
import {existsSync} from 'node:fs';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
let vite,browser,page;
try{
 vite=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','5176','--strictPort'],{env:{...process.env,SUPABASE_SECRET_KEY:'',SUPABASE_SERVICE_ROLE_KEY:'',VERCEL:''},stdio:['ignore','pipe','pipe']});let logs='';vite.stdout.on('data',d=>logs+=d);vite.stderr.on('data',d=>logs+=d);
 const base='http://127.0.0.1:5176';let ready=false;for(let i=0;i<100;i++){try{if((await fetch(base)).ok){ready=true;break}}catch{}await new Promise(r=>setTimeout(r,100));}assert.ok(ready,logs);
 browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH||existsSync('/usr/bin/chromium')?{executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium'}:{}),args:['--no-sandbox']});
 const a=await browser.newContext({viewport:{width:1440,height:1000},permissions:['clipboard-read','clipboard-write']});page=await a.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base);await page.locator('#company').waitFor();assert.equal(page.url(),base+'/');assert.equal(await page.locator('input[type=email]').count(),0);
 await page.locator('#company').fill('Simple office');await page.locator('#company-password').fill('tea-time');await page.locator('#create-room').click();await page.waitForURL(/room=/);await page.locator('#workspace-company').waitFor();const invitation=page.url();
 await page.locator('#person').fill('Anjali');await page.locator('.add').click();await page.locator('.order-row').waitFor();
 const b=await browser.newContext({viewport:{width:390,height:844}}),employee=await b.newPage();employee.on('pageerror',e=>errors.push(e.message));
 await employee.goto(invitation);await employee.locator('#unlock-password').waitFor();assert.equal(await employee.locator('#order-panel').isVisible(),false);assert.equal(await employee.locator('input[type=email]').count(),0);
 await employee.locator('#unlock-password').fill('wrong-password');await employee.locator('#unlock-button').click();await employee.locator('#unlock-message').filter({hasText:'isn’t correct'}).waitFor();
 await employee.locator('#unlock-password').fill('tea-time');await employee.locator('#unlock-button').click();await employee.locator('.order-row').waitFor();assert.equal(employee.url(),invitation);
 await employee.locator('#person').fill('Rahul');await employee.locator('.add').click();await page.waitForFunction(()=>document.querySelectorAll('.order-row').length===2);
 await page.locator('#copy-link').click();assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),invitation);assert.ok(!invitation.includes('password'));await page.locator('#copy-order').click();assert.match(await page.evaluate(()=>navigator.clipboard.readText()),/Anjali.*[\s\S]*Rahul/);
 await employee.reload();await employee.locator('#workspace-company').waitFor();assert.equal(await employee.locator('.order-row').count(),2);
 await employee.locator('#sponsor').click();await employee.locator('#sponsor-name').fill('Meera');await employee.locator('#sponsor-form button[type=submit]').click();await employee.locator('.sponsor-banner').waitFor();employee.once('dialog',d=>d.accept());await employee.locator('#finish-round').click();await employee.locator('#pattu').waitFor();assert.equal(await employee.locator('#total-due').textContent(),'₹24.00');
 await employee.locator('[data-person]').click();await employee.locator('#payment-amount').fill('12');await employee.locator('#payment-form button[type=submit]').click();await employee.waitForFunction(()=>document.querySelector('#total-due').textContent==='₹12.00');
 for(const width of [320,390,768,1440]){await employee.setViewportSize({width,height:900});assert.equal(await employee.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'width '+width);}
 await employee.locator('#sign-out').click();await employee.locator('#unlock-password').waitFor();assert.equal(await employee.locator('#order-panel').isVisible(),false);const id=new URL(invitation).searchParams.get('room');assert.equal(await employee.evaluate(id=>localStorage.getItem('tea-access:'+id),id),null);assert.equal((await fetch(base+'/api/room?id='+id)).status,401);
 await employee.setViewportSize({width:390,height:844});await employee.screenshot({path:'/tmp/chayakkada-password-inline.png',fullPage:true});
 await employee.goto(base);await employee.locator('#join-link').fill(invitation);await employee.locator('#join-form button').click();await employee.locator('#unlock-password').waitFor();assert.equal(employee.url(),invitation);
 assert.deepEqual(errors,[]);console.log('PASS: direct home without email/login page; password creation; wrong password; inline unlock; shared orders; invitation without password/token; copy order; reload; sponsorship; ledger; partial payment; responsive widths; lock; anonymous API rejection; join link. Real local password/session backend exercised.');
}catch(error){if(page)await page.screenshot({path:'/tmp/tea-password-test-failure.png',fullPage:true}).catch(()=>{});throw error;}finally{await browser?.close();vite?.kill('SIGTERM');}
