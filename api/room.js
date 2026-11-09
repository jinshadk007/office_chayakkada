import {randomUUID} from 'node:crypto';
import {passwordAccess,matchesPassword,sessionToken,requireRoomAccess,publicRoom,AccessError} from '../server/auth.js';
import {create,get,mutate,configuration} from '../server/store.js';
const actions=new Set(['add','remove','sponsor','unsponsor','prices','finish','payment','undoPayment']);
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 const reply=(status,data)=>{res.statusCode=status;res.setHeader('Content-Type','application/json');res.end(JSON.stringify(data));};
 try{
  const url=new URL(req.url,'http://localhost'),id=url.searchParams.get('id');
  if(req.method==='GET'&&url.searchParams.has('health'))return reply(200,configuration());
  if(req.method==='POST'&&!id){
   const company=typeof req.body?.company==='string'?req.body.company.trim().slice(0,80):'';
   if(!company)return reply(400,{error:'Enter your company name.'});
   const access=await passwordAccess(req.body?.password),roomId=randomUUID(),data=await create(roomId,company,access);
   return reply(201,{id:roomId,...publicRoom({data,revision:0}),token:sessionToken(roomId,access)});
  }
  if(!id||!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id))return reply(400,{error:'Invalid workspace link.'});
  if(!['GET','POST'].includes(req.method))return reply(405,{error:'Method not allowed.'});
  let room=await get(id);if(!room)return reply(404,{error:'Workspace not found. Check your invitation link.'});
  if(!room.data._access){
   // Existing email-protected rooms may be upgraded by a previously verified user.
   if(req.method==='POST'&&url.searchParams.get('access')==='setup'){
    const {requireUser}=await import('../server/legacy-auth.js');await requireUser(req);
    const access=await passwordAccess(req.body?.password);
    room=await mutate(id,{type:'_setAccess',access});
    return reply(200,{...publicRoom(room),token:sessionToken(id,room.data._access)});
   }
   return reply(409,{needsPassword:true,error:'This older workspace needs a shared password. Set it in the browser you previously signed in with, or create a new workspace.'});
  }
  if(req.method==='POST'&&url.searchParams.get('access')==='unlock'){
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
  if(e instanceof AccessError)return reply(e.status,{passwordRequired:e.status===401,error:e.message});
  if(e.name==='LegacyAuthError')return reply(e.status||401,{error:e.message});
  if(e.message==='DATABASE_NOT_CONFIGURED')return reply(503,{error:'The company workspace is not connected yet. Please ask the organiser to finish database setup.'});
  if(e.code==='PGRST205'||e.code==='42P01')return reply(503,{error:'The workspace database needs its initial setup. Please contact the organiser.'});
  if(/Enter |must be|already |Unknown action|round is full|room is busy/.test(e.message))return reply(400,{error:e.message});
  console.error('Workspace request failed:',e.name);reply(503,{error:'Cannot reach the workspace right now. Your change was not saved. Please try again.'});
 }
}
