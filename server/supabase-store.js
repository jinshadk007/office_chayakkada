import {createClient} from '@supabase/supabase-js';
import {fresh,change} from './domain.js';

// This client is server-only. Never expose its key through a VITE_ variable.
export function createSupabaseStore({url,key,fetch}) {
 const client=createClient(url,key,{
  auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},
  ...(fetch?{global:{fetch}}:{}),
 });
 const check=(error,status)=>{if(error){const failure=new Error('SUPABASE_REQUEST_FAILED');failure.code=error.code;failure.status=status;throw failure}};
 async function get(id){
  const {data,error,status}=await client.from('tea_rooms').select('data,revision').eq('id',id).maybeSingle();
  check(error,status);return data;
 }
 return {
  async officeIds(){
   const {data,error,status}=await client.from('tea_rooms').select('id').ilike('data->>company','Orattice').limit(2);
   check(error,status);return data;
  },
  async create(id,company,access){
   const data=fresh(company);if(access)data._access=access;
   const {error,status}=await client.from('tea_rooms').insert({id,data,revision:0});
   check(error,status);return data;
  },
  get,
  async mutate(id,action){
   for(let attempt=0;attempt<8;attempt++){
    const row=await get(id);if(!row)return null;
    const data=change(row.data,action),revision=row.revision+1;
    // Update only the revision we read. Retry against fresh state on conflict.
    const result=await client.from('tea_rooms').update({data,revision})
     .eq('id',id).eq('revision',row.revision).select('revision');
    check(result.error,result.status);
    if(result.data?.length)return {data,revision};
   }
   throw Error('This room is busy. Please try again.');
  },
 };
}
