import {createClient} from '@supabase/supabase-js';
import {fresh,change} from './domain.js';

// This client is server-only. Never expose its key through a VITE_ variable.
export function createSupabaseStore({url,key,fetch}) {
 const client=createClient(url,key,{
  auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},
  ...(fetch?{global:{fetch}}:{}),
 });
 const check=error=>{if(error){const failure=new Error('SUPABASE_REQUEST_FAILED');failure.code=error.code;throw failure}};
 async function get(id){
  const {data,error}=await client.from('tea_rooms').select('data,revision').eq('id',id).maybeSingle();
  check(error);return data;
 }
 return {
  async create(id,company){
   const data=fresh(company);
   const {error}=await client.from('tea_rooms').insert({id,data,revision:0});
   check(error);return data;
  },
  get,
  async mutate(id,action){
   for(let attempt=0;attempt<8;attempt++){
    const row=await get(id);if(!row)return null;
    const data=change(row.data,action),revision=row.revision+1;
    // Update only the revision we read. Retry against fresh state on conflict.
    const result=await client.from('tea_rooms').update({data,revision})
     .eq('id',id).eq('revision',row.revision).select('revision');
    check(result.error);
    if(result.data?.length)return {data,revision};
   }
   throw Error('This room is busy. Please try again.');
  },
 };
}
