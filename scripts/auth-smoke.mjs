import {createServer} from 'node:http';
import {spawn} from 'node:child_process';
import {existsSync} from 'node:fs';
import {once} from 'node:events';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';

// Local fake Supabase Auth: exercises the SDK and API guards without live credentials.
const user={id:'00000000-0000-4000-8000-000000000001',email:'employee@example.com',aud:'authenticated',role:'authenticated',app_metadata:{provider:'email'},user_metadata:{}};
const token='verified-test-access-token';let recoveryURL,updatedPassword=false;
const session=()=>({access_token:token,refresh_token:'test-refresh-token',token_type:'bearer',expires_in:3600,user});
const auth=createServer(async(req,res)=>{
 res.setHeader('Access-Control-Allow-Origin','*');res.setHeader('Access-Control-Expose-Headers','X-Supabase-Api-Version');res.setHeader('Access-Control-Allow-Headers','*');res.setHeader('Access-Control-Allow-Methods','GET,POST,PUT,OPTIONS');
 res.setHeader('Content-Type','application/json');res.setHeader('X-Supabase-Api-Version','2024-01-01');if(req.method==='OPTIONS'){res.end();return;}
 const url=new URL(req.url,'http://localhost');let body='';for await(const part of req)body+=part;const data=body?JSON.parse(body):{};
 const reply=(code,value)=>{res.statusCode=code;res.end(JSON.stringify(value));};
 if(url.pathname==='/auth/v1/token'){
  if(data.password==='correct-password'||data.refresh_token)return reply(200,session());
  return reply(400,{code:'invalid_credentials',msg:'Invalid login credentials'});
 }
 if(url.pathname==='/auth/v1/user'){
  if(req.headers.authorization!=='Bearer '+token)return reply(401,{code:'bad_jwt',msg:'Invalid JWT'});
  if(req.method==='PUT')updatedPassword=!!data.password;
  return reply(200,user);
 }
 if(url.pathname==='/auth/v1/signup')return reply(200,{...user,email:data.email,identities:[]});
 if(url.pathname==='/auth/v1/recover'){recoveryURL=url.searchParams.get('redirect_to');return reply(200,{});}
 if(url.pathname==='/auth/v1/logout')return reply(204,{});
 reply(404,{msg:'Unknown test endpoint'});
});
let vite,browser,debugPage;
try{
 auth.listen(0,'127.0.0.1');await once(auth,'listening');const authURL='http://127.0.0.1:'+auth.address().port;
 vite=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','5176','--strictPort'],{env:{...process.env,SUPABASE_URL:'',SUPABASE_SECRET_KEY:'',SUPABASE_SERVICE_ROLE_KEY:'',SUPABASE_PUBLISHABLE_KEY:'',VITE_SUPABASE_URL:authURL,VITE_SUPABASE_PUBLISHABLE_KEY:'test-publishable-key',VERCEL:''},stdio:['ignore','pipe','pipe']});
 let logs='';vite.stdout.on('data',d=>logs+=d);vite.stderr.on('data',d=>logs+=d);
 const base='http://127.0.0.1:5176';let ready=false;
 for(let i=0;i<100;i++){try{if((await fetch(base)).ok){ready=true;break}}catch{}await new Promise(r=>setTimeout(r,100));}
 assert.ok(ready,'Vite must start: '+logs);
 for(const method of ['GET','POST'])assert.equal((await fetch(base+'/api/room?id=00000000-0000-4000-8000-000000000000',{method,headers:{'Content-Type':'application/json'},...(method==='POST'?{body:JSON.stringify({type:'payment',name:'A',amount:1})}:{})})).status,401);
 browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH||existsSync('/usr/bin/chromium')?{executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium'}:{}),args:['--no-sandbox']});
 const context=await browser.newContext({viewport:{width:1440,height:1100}}),page=await context.newPage();debugPage=page;const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base);await page.waitForURL(/\/login/);assert.equal(await page.locator('#pattu').count(),0);assert.equal(await page.locator('#company').count(),0);
 await page.locator('#auth-email').fill(user.email);await page.locator('#auth-password').fill('incorrect-password');await page.locator('#toggle-password').click();assert.equal(await page.locator('#auth-password').getAttribute('type'),'text');await page.locator('#toggle-password').click();assert.equal(await page.locator('#auth-password').getAttribute('type'),'password');await page.locator('#auth-submit').click();await page.locator('#auth-message').filter({hasText:'isn’t correct'}).waitFor();
 await page.locator('[data-mode="forgot"]').click();await page.locator('#auth-email').fill(user.email);await page.locator('#auth-submit').click();await page.locator('#auth-message').filter({hasText:'reset link'}).waitFor();assert.match(recoveryURL,/\/auth\/reset/);
 await page.locator('[data-mode="login"]:visible').click();await page.locator('[data-mode="signup"]').click();await page.locator('#auth-email').fill('new@example.com');await page.locator('#auth-password').fill('correct-password');await page.locator('#auth-submit').click();await page.locator('#auth-success-message').filter({hasText:'Check your email'}).waitFor();
 await page.locator('[data-mode="login"]:visible').click();await page.locator('#auth-email').fill(user.email);await page.locator('#auth-password').fill('correct-password');await page.locator('#auth-submit').click();await page.locator('#company').waitFor();
 assert.equal(await page.locator('#order-panel').isVisible(),false);assert.equal(await page.locator('#pattu').isVisible(),false);await page.locator('#join-link').fill('https://untrusted.example.com/?room=00000000-0000-4000-8000-000000000000');await page.locator('#join-form button').click();await page.locator('#join-message').filter({hasText:'valid invitation'}).waitFor();
 await page.locator('#company').fill('Authenticated office');await page.locator('#create-room').click();await page.waitForURL(/room=/);const invitation=page.url();
 await page.locator('#person').fill('Anjali');await page.locator('.add').click();await page.locator('.order-row').waitFor();assert.equal(await page.locator('#workspace-setup').isVisible(),false);assert.equal(await page.locator('#pattu').isVisible(),false);await page.locator('#book-tab').click();await page.locator('#pattu').waitFor();assert.equal(await page.locator('#order-panel').isVisible(),false);await page.locator('#book-tab').press('ArrowLeft');await page.locator('#order-panel').waitFor();assert.equal(await page.locator('#order-tab').getAttribute('aria-selected'),'true');
 const second=await browser.newContext({viewport:{width:390,height:844}}),employee=await second.newPage();employee.on('pageerror',e=>errors.push(e.message));
 await employee.goto(invitation);await employee.waitForURL(/\/login\?next=/);assert.equal(await employee.locator('#pattu').count(),0);
 await employee.locator('#auth-email').fill(user.email);await employee.locator('#auth-password').fill('correct-password');await employee.locator('#auth-submit').click();await employee.waitForURL(invitation);await employee.locator('.order-row').waitFor();await employee.screenshot({path:'/tmp/chayakkada-frontend-order-mobile.png',fullPage:true});
 assert.equal(await employee.locator('#your-order-price').textContent(),'₹12.00');await employee.locator('#plus').click();assert.equal(await employee.locator('#your-order-price').textContent(),'₹24.00');await employee.locator('#minus').click();await employee.locator('#person').fill('Rahul');await employee.locator('.add').click();await page.waitForFunction(()=>document.querySelectorAll('.order-row').length===2);
 for(const width of [320,390,768,1440]){await employee.setViewportSize({width,height:900});assert.equal(await employee.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'workspace width '+width);}
 await employee.reload();await employee.locator('#workspace-company').waitFor();assert.equal(await employee.locator('.order-row').count(),2);
 // Reset route uses the authenticated recovery session and updates Supabase Auth.
 await employee.locator('#sponsor').click();await employee.locator('#sponsor-name').fill('Meera');await employee.locator('#sponsor-form button[type=submit]').click();await employee.locator('.sponsor-banner').waitFor();employee.once('dialog',d=>d.accept());await employee.locator('#finish-round').click();await employee.locator('#pattu').waitFor();assert.equal(await employee.locator('#book-tab').getAttribute('aria-selected'),'true');assert.equal(await employee.locator('#total-due').textContent(),'₹24.00');await employee.locator('[data-person]').click();await employee.locator('#payment-amount').fill('12');await employee.locator('#payment-form button[type=submit]').click();await employee.waitForFunction(()=>document.querySelector('#total-due').textContent==='₹12.00');await employee.setViewportSize({width:390,height:844});await employee.screenshot({path:'/tmp/chayakkada-frontend-book-mobile.png',fullPage:true});await employee.locator('#order-tab').click();
 await employee.goto(base+'/auth/reset?next='+encodeURIComponent(new URL(invitation).pathname+new URL(invitation).search));await employee.locator('#auth-password').fill('a-new-correct-password');await employee.locator('#auth-submit').click();await employee.waitForURL(invitation);assert.equal(updatedPassword,true);
 await page.goto(base+'/?room=00000000-0000-4000-8000-000000000000');await page.locator('#workspace-error').waitFor();assert.equal(await page.locator('#order-panel').isVisible(),false);await page.goto(base);await page.locator('.recent-workspaces a').filter({hasText:'Authenticated office'}).waitFor();await page.screenshot({path:'/tmp/chayakkada-frontend-setup-desktop.png',fullPage:true});await page.locator('#join-link').fill(invitation);await page.locator('#join-form button').click();await page.waitForURL(invitation);await page.locator('#workspace-company').waitFor();await page.screenshot({path:'/tmp/chayakkada-frontend-order-desktop.png',fullPage:true});
 await employee.locator('#sign-out').click();await employee.waitForURL(/\/login/);assert.equal(await employee.locator('#pattu').count(),0);assert.equal(await employee.evaluate(()=>localStorage.getItem('chayakkada-auth')),null);
 await employee.goto(invitation);await employee.waitForURL(/\/login/);assert.equal(await employee.locator('#pattu').count(),0);
 for(const width of [320,390,768,1440]){await employee.setViewportSize({width,height:900});assert.equal(await employee.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'login width '+width);}
 await employee.setViewportSize({width:1440,height:1000});await employee.screenshot({path:'/tmp/chayakkada-frontend-login-desktop.png',fullPage:true});await employee.setViewportSize({width:390,height:844});await employee.screenshot({path:'/tmp/chayakkada-auth-mobile.png',fullPage:true});
 // Tampering with browser storage does not bypass the server or the route gate.
 await employee.evaluate(()=>localStorage.setItem('chayakkada-auth',JSON.stringify({access_token:'forged-token',refresh_token:'fake-refresh',expires_at:Math.floor(Date.now()/1000)+3600,user:{id:'forged-user',email:'fake@example.com'},token_type:'bearer'})));
 await employee.goto(invitation);await employee.locator('#auth-submit').waitFor();assert.equal(await employee.locator('#pattu').count(),0);
 assert.equal((await fetch(base+'/api/room?id='+new URL(invitation).searchParams.get('room'),{headers:{Authorization:'Bearer forged-token'}})).status,401);
 assert.deepEqual(errors,[]);
 console.log('PASS: anonymous API rejection; login gate; invalid credentials; password visibility; signup confirmation; create/join workspace; recent workspaces; error state; keyboard tabs; price preview; sponsor; round finalization; payment; recovery email; login; invitation return; two employee sessions; persistence; password update; sign-out; forged session rejection; responsive login/workspace at 320/390/768/1440. Auth transport simulated locally; no live Supabase account or emails used.');
}catch(error){if(debugPage){console.error('Browser state:',debugPage.url(),await debugPage.locator('#auth-message').textContent().catch(()=>''));await debugPage.screenshot({path:'/tmp/chayakkada-auth-failure.png',fullPage:true}).catch(()=>{});}throw error;}finally{
 await browser?.close();vite?.kill('SIGTERM');auth.closeAllConnections();auth.close();
}
