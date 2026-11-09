import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {createSupabaseStore} from '../server/supabase-store.js';
import {change} from '../server/domain.js';

// Exercise the real Supabase SDK against a controlled PostgREST transport.
// This checks our adapter, not connectivity to a hosted project.
function fixture(){
 const rows=new Map(),calls=[];let conflict=false,fail=false;
 const fetch=async(input,options={})=>{
  const url=new URL(input),method=options.method||'GET';calls.push({url,method});
  assert.equal(url.pathname,'/rest/v1/tea_rooms');
  const headers=new Headers(options.headers);assert.equal(headers.get('apikey'),'test-server-key');
  if(fail)return Response.json({message:'unavailable',code:'08006'},{status:503});
  const id=url.searchParams.get('id')?.replace(/^eq\./,''),row=rows.get(id);
  if(method==='GET')return Response.json(row?[structuredClone(row)]:[]);
  const body=JSON.parse(options.body);
  if(method==='POST'){rows.set(body.id,structuredClone(body));return new Response(null,{status:201});}
  if(method==='PATCH'){
   if(conflict){conflict=false;change(row.data,{type:'add',name:'Other employee',drink:'tea',qty:1});row.revision++;}
   if(!row||row.revision!==Number(url.searchParams.get('revision')?.replace(/^eq\./,'')))return Response.json([]);
   Object.assign(row,structuredClone(body));return Response.json([{revision:row.revision}]);
  }
  throw Error('Unexpected method');
 };
 return {store:createSupabaseStore({url:'https://test-project.supabase.co',key:'test-server-key',fetch}),rows,calls,conflict(){conflict=true},fail(){fail=true}};
}
test('Supabase adapter persists rooms, orders, sponsor charges, and payments',async()=>{
 const f=fixture(),id=randomUUID();await f.store.create(id,'Test office');
 assert.equal((await f.store.get(id)).data.company,'Test office');
 await f.store.mutate(id,{type:'add',name:'Anjali',drink:'coffee',qty:2});
 await f.store.mutate(id,{type:'sponsor',name:'Meera'});
 await f.store.mutate(id,{type:'finish'});
 const paid=await f.store.mutate(id,{type:'payment',name:'Meera',amount:1500});
 assert.equal(paid.revision,4);assert.equal(paid.data.ledger[0].amount,4000);assert.equal(paid.data.ledger[0].name,'Meera');assert.equal(paid.data.ledger[1].amount,1500);
 assert.equal((await f.store.get(id)).data.orders.length,0);
});
test('Supabase revision conflict retries against the new state without losing orders',async()=>{
 const f=fixture(),id=randomUUID();await f.store.create(id,'Test office');f.conflict();
 const result=await f.store.mutate(id,{type:'add',name:'Anjali',drink:'tea',qty:1});
 assert.deepEqual(result.data.orders.map(o=>o.name),['Other employee','Anjali']);assert.equal(result.revision,2);
 assert.equal(f.calls.filter(c=>c.method==='PATCH').length,2);
});
test('missing Supabase room returns null and service errors do not become empty rooms',async()=>{
 const f=fixture();assert.equal(await f.store.get(randomUUID()),null);assert.equal(await f.store.mutate(randomUUID(),{type:'finish'}),null);
 f.fail();await assert.rejects(f.store.get(randomUUID()),{message:'SUPABASE_REQUEST_FAILED',code:'08006'});
});
