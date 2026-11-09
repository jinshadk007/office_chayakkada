import {createClient} from '@supabase/supabase-js';

export class AuthError extends Error {
 constructor(message,status=401){super(message);this.status=status;}
}

// getUser verifies the token with Supabase Auth; decoded JWT claims alone are not trusted.
export function createAuthenticator({url,key,fetch}) {
 const client=createClient(url,key,{
  auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},
  ...(fetch?{global:{fetch}}:{}),
 });
 return async req=>{
  const header=req.headers?.authorization;
  const match=typeof header==='string'&&/^Bearer ([^\s]+)$/i.exec(header);
  if(!match)throw new AuthError('Please sign in to access your workspace.');
  const {data,error}=await client.auth.getUser(match[1]);
  if(error){
   if(error.status===429||error.status>=500||error.name==='AuthRetryableFetchError')throw new AuthError('Sign-in cannot be verified right now. Please try again.',503);
   throw new AuthError('Your session has expired. Please sign in again.');
  }
  if(!data.user?.id)throw new AuthError('Please sign in again.');
  return data.user;
 };
}
let authenticate;
export async function requireUser(req){
 // Reject anonymous requests even when deployment configuration is incomplete.
 if(typeof req.headers?.authorization!=='string'||!/^Bearer [^\s]+$/i.test(req.headers.authorization))throw new AuthError('Please sign in to access your workspace.');
 const url=process.env.SUPABASE_URL||process.env.VITE_SUPABASE_URL;
 const key=process.env.SUPABASE_PUBLISHABLE_KEY||process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
 if(!url||!key)throw new AuthError('Sign-in is temporarily unavailable. Please try again later.',503);
 authenticate??=createAuthenticator({url,key});
 return authenticate(req);
}
