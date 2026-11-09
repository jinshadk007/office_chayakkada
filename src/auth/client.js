import {createClient} from '@supabase/supabase-js';
import {publicSupabase} from '../../config/supabase-public.js';
import {safeReturnPath} from './paths.js';
const storageKey='chayakkada-auth';
const {url,key}=publicSupabase({url:import.meta.env.VITE_SUPABASE_URL,key:import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY});
export const authClient=url&&key?createClient(url,key,{
 auth:{storageKey,persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,flowType:'pkce'},
}):null;
export async function accessToken(){
 if(!authClient)throw Error('Sign-in is temporarily unavailable.');
 const {data,error}=await authClient.auth.getSession();
 if(error||!data.session?.access_token){await leaveWorkspace();throw Error('Please sign in again.');}
 return data.session.access_token;
}
export async function leaveWorkspace(){
 const next=safeReturnPath(location.pathname==='/'?location.pathname+location.search:new URLSearchParams(location.search).get('next'),location.origin);
 try{if(authClient)await authClient.auth.signOut({scope:'local'});}finally{
  // Clear this app’s persisted session even if the logout endpoint is offline.
  try{localStorage.removeItem(storageKey);localStorage.removeItem(storageKey+'-code-verifier');}catch{}
 }
 const destination='/login?next='+encodeURIComponent(next);
 if(location.pathname==='/login')history.replaceState(null,'',destination);else location.replace(destination);
}
