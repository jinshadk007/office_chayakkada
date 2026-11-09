import {randomUUID} from 'node:crypto';
import {requireUser,AuthError} from '../server/auth.js';
import {create,get,mutate,configuration} from '../server/store.js';
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 const reply=(status,data)=>{res.statusCode=status;res.setHeader('Content-Type','application/json');res.end(JSON.stringify(data));};
 try{
 const url=new URL(req.url,'http://localhost');
 if(req.method==='GET'&&url.searchParams.has('health'))return reply(200,configuration());
 await requireUser(req);
 const id=url.searchParams.get('id');
 if(req.method==='POST'&&!id){const company=typeof req.body?.company==='string'?req.body.company.trim().slice(0,80):'';if(!company)return reply(400,{error:'Enter your company name.'});const roomId=randomUUID();const data=await create(roomId,company);return reply(201,{id:roomId,data,revision:0});}
 if(!id||!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id))return reply(400,{error:'Invalid workspace link.'});
 if(req.method==='GET'){const room=await get(id);return room?reply(200,room):reply(404,{error:'Workspace not found. Check your invitation link.'});}
 if(req.method==='POST'){const room=await mutate(id,req.body||{});return room?reply(200,room):reply(404,{error:'Workspace not found.'});}
 reply(405,{error:'Method not allowed.'});
 }catch(e){if(e instanceof AuthError)return reply(e.status,{error:e.message});if(e.message==='DATABASE_NOT_CONFIGURED')return reply(503,{error:'Connect Supabase in Vercel with SUPABASE_URL and a server-only SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY) to enable shared ordering.'});if(e.code==='PGRST205'||e.code==='42P01')return reply(503,{error:'The Supabase database needs the Chayakkada migration before ordering can start.'});if(/Enter |must be|already been|Unknown action|round is full|room is busy/.test(e.message))return reply(400,{error:e.message});console.error('Workspace request failed:',e.name);reply(503,{error:'Cannot reach the workspace right now. Your change was not saved. Please try again.'});}
}
