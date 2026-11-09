export function renderAuth({client,next,mode='login',message=''}){
 const rememberedEmail=document.querySelector('#auth-email')?.value||'';
 const app=document.querySelector('#app');
 let pending=false;
 const titles={login:'Your tea break awaits.',signup:'Good company starts here.',forgot:'Let’s get you back in.',password:'A fresh start.'};
 const descriptions={login:'Sign in to join your office tea round.',signup:'Create an account. Join your team. Put the kettle on.',forgot:'We’ll email you a link to reset your password.',password:'Choose a new password for your account.'};
 app.innerHTML=`<header><a class="brand" href="/">☕ chayakkada<span class="brand-dot">.</span></a><span class="header-note">Small breaks. Better days.</span></header><main class="auth-main"><section class="auth-intro"><div class="eyebrow"><span></span> A LITTLE BREAK, TOGETHER</div><h1>${titles[mode]}</h1><p>${descriptions[mode]}</p><div class="auth-steps"><span><b>01</b> Sign in</span><span><b>02</b> Pick your cup</span><span><b>03</b> Take a break</span></div><div class="auth-illustration" aria-hidden="true">☕<span>good tea. good company.</span></div></section><section class="auth-card"><span class="eyebrow">YOUR OFFICE TEA CORNER</span><div class="auth-context">${next.includes('room=')?'↳ You’re joining your team’s tea corner':'Your everyday office tea break'}</div><h2>${mode==='signup'?'Create your account':mode==='forgot'?'Reset your password':mode==='password'?'Set a new password':'Welcome back'}</h2><form id="auth-form">${mode!=='password'?'<label class="field-label" for="auth-email">Email address</label><input id="auth-email" name="email" type="email" autocomplete="email" placeholder="you@company.com" maxlength="254" required>':''}${mode!=='forgot'?`<label class="field-label" for="auth-password">${mode==='password'?'New password':'Password'}</label><div class="password-input"><input id="auth-password" name="password" type="password" autocomplete="${mode==='login'?'current-password':'new-password'}" minlength="${mode==='login'?1:8}" ${mode!=='login'?'maxlength="128"':''} placeholder="${mode==='login'?'Your password':'At least 8 characters'}" required><button class="password-toggle" id="toggle-password" type="button" aria-controls="auth-password" aria-pressed="false">Show</button></div>${mode!=='login'?'<p class="password-hint">Use at least 8 characters.</p>':''}`:''}<p id="auth-message" role="status" aria-live="polite"></p><button class="primary" id="auth-submit" type="submit" ${!client?'disabled':''}>${mode==='signup'?'Create account':mode==='forgot'?'Send reset link':mode==='password'?'Save new password':'Sign in'}</button></form><div class="auth-success" id="auth-success" hidden><span class="success-envelope" aria-hidden="true">✉</span><h3>Check your inbox</h3><p id="auth-success-message"></p><button type="button" class="primary" data-mode="login">Back to sign in</button></div><div class="auth-links" id="auth-links">${mode==='login'?'<button data-mode="forgot">Forgot password?</button><p>New to the tea corner? <button data-mode="signup">Create an account</button></p>':mode!=='password'?'<button data-mode="login">Back to sign in</button>':'<button id="cancel-password">Sign out</button>'}</div><p class="auth-foot">${next.includes('room=')?'Your company invitation will be waiting after sign-in.':'One account. Your team’s everyday tea break.'}</p></section></main><footer><span>Small breaks. Better days.</span><span>Made with a little warmth ♡</span></footer>`;
 const emailInput=document.querySelector('#auth-email');if(emailInput)emailInput.value=rememberedEmail;
 const toggle=document.querySelector('#toggle-password');if(toggle)toggle.onclick=()=>{const field=document.querySelector('#auth-password'),visible=field.type==='password';field.type=visible?'text':'password';toggle.textContent=visible?'Hide':'Show';toggle.setAttribute('aria-pressed',visible)};
 const notice=document.querySelector('#auth-message');notice.textContent=!client?'Sign-in is temporarily unavailable. Please try again later.':message;
 const show=(text,error=false)=>{notice.textContent=text;notice.classList.toggle('auth-error',error)};
 document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>renderAuth({client,next,mode:b.dataset.mode}));
 document.querySelector('#cancel-password')?.addEventListener('click',async()=>{await client.auth.signOut({scope:'local'});location.replace('/login')});
 document.querySelector('#auth-form').onsubmit=async e=>{
  e.preventDefault();if(pending)return;pending=true;const button=document.querySelector('#auth-submit'),label=button.textContent;button.disabled=true;button.textContent=mode==='login'?'Signing you in…':mode==='signup'?'Creating your account…':mode==='forgot'?'Sending your link…':'Saving your password…';document.querySelectorAll('[data-mode]').forEach(b=>b.disabled=true);show('');
  const email=document.querySelector('#auth-email')?.value.trim(),password=document.querySelector('#auth-password')?.value;
  const callback=path=>location.origin+path+'?next='+encodeURIComponent(next);
  try{
   if(mode==='login'){
    const {error}=await client.auth.signInWithPassword({email,password});if(error)throw error;
    location.replace(next);
   }else if(mode==='signup'){
    const {data,error}=await client.auth.signUp({email,password,options:{emailRedirectTo:callback('/auth/callback')}});if(error)throw error;
    if(data.session)location.replace(next);else{document.querySelector('#auth-form').hidden=true;document.querySelector('#auth-links').hidden=true;document.querySelector('#auth-success').hidden=false;document.querySelector('#auth-success-message').textContent='Check your email to confirm your account, then return here to sign in.';document.querySelector('#auth-password').value='';}
   }else if(mode==='forgot'){
    const {error}=await client.auth.resetPasswordForEmail(email,{redirectTo:callback('/auth/reset')});if(error)throw error;
    show('If an account exists for this email, a reset link is on its way. Open it in this browser.');
   }else{
    const {error}=await client.auth.updateUser({password});if(error)throw error;
    location.replace(next);
   }
  }catch(error){
   const message=(error.code==='invalid_credentials'||/invalid login credentials/i.test(error.message))?'The email or password isn’t correct. Please try again.':error.code==='email_not_confirmed'?'Please confirm your email before signing in.':error.status===429?'Too many attempts. Please wait a little and try again.':error.message==='Failed to fetch'?'Couldn’t reach sign-in. Check your connection and try again.':error.message||'We couldn’t complete sign-in. Please try again.';
   show(message,true);
  }finally{pending=false;if(button.isConnected){button.disabled=false;button.textContent=label;document.querySelectorAll('[data-mode]').forEach(b=>b.disabled=false);}}
 };
}
