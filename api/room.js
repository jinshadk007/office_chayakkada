import {OFFICE_NAME} from '../config/orattice.js';
import {passwordAccess,matchesPassword,sessionToken,requireRoomAccess,publicRoom,AccessError} from '../server/auth.js';
import {create,get,mutate,configuration,officeId} from '../server/store.js';
const actions=new Set(['add','remove','sponsor','unsponsor','prices','finish','payment','undoPayment']);
export function databaseProblem(error){
 if(error.message==='DATABASE_NOT_CONFIGURED')return {code:'DATABASE_NOT_CONFIGURED',error:'Orattice’s saved tea book is not connected yet. No saved data has been cleared.',action:'In Vercel Production settings, add SUPABASE_SECRET_KEY and redeploy.'};
 if(error.code==='PGRST205'||error.code==='42P01')return {code:'DATABASE_TABLE_MISSING',error:'Orattice’s tea book needs its first-time database setup.',action:'Run supabase/migrations/202611090001_create_tea_rooms.sql in the Supabase SQL Editor.'};
 if(error.status===401)return {code:'DATABASE_KEY_REJECTED',error:'The database could not verify its server key.',action:'Use a secret key from the same Supabase project, not a publishable key. Save it as SUPABASE_SECRET_KEY in Vercel and redeploy.'};
 if(error.status===403||error.code==='42501')return {code:'DATABASE_PERMISSION_DENIED',error:'The server cannot access the saved tea book.',action:'Use the project secret/service-role key, and apply the database migration that grants service_role access.'};
 if(error.status===409)return {code:'DATABASE_BOOK_AMBIGUOUS',error:error.message,action:'Ask the organiser to select the existing Orattice book. No records were changed.'};
 return {code:'DATABASE_UNAVAILABLE',error:'Cannot reach the saved tea book right now. No saved data has been cleared.',action:'Check the project URL, that Supabase is active, and the Vercel function logs.'};
}
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 const reply=(status,data)=>{res.statusCode=status;res.setHeader('Content-Type','application/json');res.end(JSON.stringify(data));};
 try{
  const url=new URL(req.url,'http://localhost');
  if(req.method==='GET'&&url.searchParams.has('health')){const config=configuration();try{if(!config.configured)throw Error('DATABASE_NOT_CONFIGURED');const book=await get(await officeId());return reply(200,{...config,ready:true,bookExists:!!book});}catch(error){return reply(503,{...config,ready:false,...databaseProblem(error)});}}
  if(!['GET','POST'].includes(req.method))return reply(405,{error:'Method not allowed.'});
  if(req.body?.company&&req.body.company!==OFFICE_NAME)return reply(400,{error:'This tea corner is just for Orattice.'});
  const id=await officeId();
  if(url.searchParams.has('id')&&url.searchParams.get('id')!==id)return reply(404,{error:'This tea corner is just for Orattice. Open the home page.'});
  let room=await get(id);
  if(req.method==='GET'&&url.searchParams.has('office'))return reply(200,{id,company:OFFICE_NAME,needsSetup:!room,needsUpgrade:!!room&&!room.data._access});
  if(!room){
   if(req.method!=='POST'||url.searchParams.get('access')!=='setup')return reply(404,{error:'Orattice’s tea corner needs its one-time password setup.'});
   const access=await passwordAccess(req.body?.password);
   try{const data=await create(id,OFFICE_NAME,access);return reply(201,{id,...publicRoom({data,revision:0}),token:sessionToken(id,access)});}
   catch(error){
    // Simultaneous first visits must never overwrite the book or its password.
    if(error.code!=='23505'&&!(error.code==='ERR_SQLITE_ERROR'&&/UNIQUE constraint failed/.test(error.message)))throw error;
    room=await get(id);if(!room)throw error;
    if(!await matchesPassword(req.body?.password,room.data._access))return reply(409,{error:'The team password was just set. Ask your teammate for it, then refresh.'});
    return reply(200,{id,...publicRoom(room),token:sessionToken(id,room.data._access)});
   }
  }
  if(!room.data._access){
   // Existing email-protected rooms may be upgraded by a previously verified user.
   if(req.method==='POST'&&url.searchParams.get('access')==='setup'){
    const {requireUser}=await import('../server/legacy-auth.js');await requireUser(req);
    const access=await passwordAccess(req.body?.password);
    room=await mutate(id,{type:'_setAccess',access});
    return reply(200,{...publicRoom(room),token:sessionToken(id,room.data._access)});
   }
   return reply(409,{needsPassword:true,error:'This existing Orattice tea book needs its one-time password setup. Open it in the browser previously signed in, or ask the organiser to migrate access. Your orders and payments are preserved.'});
  }
  if(req.method==='POST'&&['unlock','setup'].includes(url.searchParams.get('access'))){
   const access=room.data._access;
   if(access.failed>=10&&Date.now()-access.windowStart<60000)return reply(429,{error:'Too many incorrect attempts. Please wait a minute.'});
   if(!await matchesPassword(req.body?.password,access)){
    await mutate(id,{type:'_failedAccess'});
    return reply(401,{passwordRequired:true,error:'That password isn’t correct. Please try again.'});
   }
   room=await mutate(id,{type:'_resetAccessFailures'});
   return reply(200,{...publicRoom(room),token:sessionToken(id,room.data._access)});
  }
  requireRoomAccess(req,id,room.data._access);
  if(req.method==='GET')return reply(200,publicRoom(room));
  if(!actions.has(req.body?.type))return reply(400,{error:'Unknown action.'});
  room=await mutate(id,req.body);
  return reply(200,publicRoom(room));
 }catch(e){
  if(e.status===409)return reply(409,{error:e.message});
  if(e instanceof AccessError)return reply(e.status,{passwordRequired:e.status===401,error:e.message});
  if(e.name==='LegacyAuthError')return reply(e.status||401,{error:e.message});
  if(e.message==='DATABASE_NOT_CONFIGURED'||e.message==='SUPABASE_REQUEST_FAILED'){const problem=databaseProblem(e);return reply(503,{code:problem.code,error:problem.error});}
  if(/Enter |must be|already |Unknown action|round is full|room is busy/.test(e.message))return reply(400,{error:e.message});
  console.error('Workspace request failed:',e.name);reply(503,{error:'Cannot reach the workspace right now. Your change was not saved. Please try again.'});
 }
}
