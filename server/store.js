import {fresh,change} from './domain.js';
import {publicSupabase} from '../config/supabase-public.js';
let db,remote;
function databaseSettings(){
 const {url}=publicSupabase({url:process.env.SUPABASE_URL||process.env.VITE_SUPABASE_URL});
 return {url,key:process.env.SUPABASE_SECRET_KEY||process.env.SUPABASE_SERVICE_ROLE_KEY};
}
export function configuration(){
 const {key}=databaseSettings();
 return {configured:!!key||!process.env.VERCEL,mode:key?'supabase':process.env.VERCEL?'unconfigured':'local'};
}
async function connection(){
 const {url,key}=databaseSettings();
 if(key){
  if(!remote){const {createSupabaseStore}=await import('./supabase-store.js');remote=createSupabaseStore({url,key});}
  return remote;
 }
 if(process.env.VERCEL)throw Error('DATABASE_NOT_CONFIGURED');
 if(!db){const {DatabaseSync}=await import('node:sqlite');const {mkdirSync}=await import('node:fs');mkdirSync('.local',{recursive:true});db=new DatabaseSync('.local/chayakkada.sqlite');db.exec('CREATE TABLE IF NOT EXISTS tea_rooms (id TEXT PRIMARY KEY, data TEXT NOT NULL, revision INTEGER NOT NULL DEFAULT 0)');}
 return null;
}
export async function create(id,company){const store=await connection();if(store)return store.create(id,company);const data=fresh(company);db.prepare('INSERT INTO tea_rooms (id,data) VALUES (?,?)').run(id,JSON.stringify(data));return data;}
export async function get(id){const store=await connection();if(store)return store.get(id);const row=db.prepare('SELECT data,revision FROM tea_rooms WHERE id=?').get(id);return row?{data:JSON.parse(row.data),revision:row.revision}:null;}
export async function mutate(id,action){const store=await connection();if(store)return store.mutate(id,action);for(let i=0;i<8;i++){const row=await get(id);if(!row)return null;const data=change(row.data,action);const result=db.prepare('UPDATE tea_rooms SET data=?,revision=revision+1 WHERE id=? AND revision=? RETURNING revision').all(JSON.stringify(data),id,row.revision);if(result.length)return {data,revision:result[0].revision};}throw Error('This room is busy. Please try again.');}
