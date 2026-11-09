import './style.css';
import {authClient} from './auth/client.js';
import {safeReturnPath} from './auth/paths.js';
import {renderAuth} from './auth/view.js';
const params=new URLSearchParams(location.search);
const authRoute=location.pathname==='/login'||location.pathname.startsWith('/auth/');
const next=safeReturnPath(authRoute?params.get('next'):location.pathname+location.search,location.origin);
let cleanup;
function login(message=''){
 cleanup?.();cleanup=undefined;
 history.replaceState(null,'','/login?next='+encodeURIComponent(next));
 renderAuth({client:authClient,next,message});
}
async function start(){
 document.querySelector('#app').innerHTML='<div class="auth-loading" role="status">Putting the kettle on…</div>';
 if(!authClient){login();return;}
 const {data,error}=await authClient.auth.getSession();
 if(error||!data.session){
  const expired=location.pathname.startsWith('/auth/');
  login(expired?'This email link is invalid or has expired. Sign in or request a new password reset.':'');return;
 }
 // Validate the cached session before mounting any workspace content.
 const verified=await authClient.auth.getUser();
 if(verified.error||!verified.data.user){
  login('Please sign in again to open your workspace.');return;
 }
 if(location.pathname==='/auth/reset'){
  renderAuth({client:authClient,next,mode:'password'});return;
 }
 if(authRoute){location.replace(next);return;}
 const {mountWorkspace}=await import('./workspace.js');
 cleanup=mountWorkspace(verified.data.user);
}
if(authClient){
 authClient.auth.onAuthStateChange(event=>{
  if(event==='SIGNED_OUT')login('You’ve signed out.');
  if(event==='PASSWORD_RECOVERY'){
   cleanup?.();cleanup=undefined;
   renderAuth({client:authClient,next,mode:'password'});
  }
 });
}
start().catch(()=>login('We couldn’t reach sign-in. Please check your connection and try again.'));
