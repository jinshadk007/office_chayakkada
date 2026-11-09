import test from 'node:test';
import assert from 'node:assert/strict';
import {createAuthenticator,AuthError} from '../server/auth.js';
import handler from '../api/room.js';
import {safeReturnPath} from '../src/auth/paths.js';

const url='https://project.supabase.co',key='test-publishable-key';
test('server authentication rejects missing/malformed authorization before calling Supabase',async()=>{
 let calls=0;const authenticate=createAuthenticator({url,key,fetch:async()=>{calls++;throw Error('should not run')}});
 for(const header of [undefined,'','Basic credentials','Bearer','Bearer token extra',['Bearer token']])await assert.rejects(authenticate({headers:{authorization:header}}),e=>e instanceof AuthError&&e.status===401);
 assert.equal(calls,0);
});
test('server asks Supabase Auth to verify bearer tokens and returns verified identity',async()=>{
 const authenticate=createAuthenticator({url,key,fetch:async(input,options)=>{
  assert.equal(new URL(input).pathname,'/auth/v1/user');
  assert.equal(new Headers(options.headers).get('Authorization'),'Bearer opaque-token');
  return Response.json({id:'verified-user',email:'employee@example.com'});
 }});
 assert.equal((await authenticate({headers:{authorization:'Bearer opaque-token'}})).id,'verified-user');
});
test('invalid/expired bearer tokens are rejected instead of trusting their claims',async()=>{
 const authenticate=createAuthenticator({url,key,fetch:async()=>Response.json({message:'JWT expired',code:'bad_jwt'},{status:401})});
 await assert.rejects(authenticate({headers:{authorization:'Bearer invalid-token'}}),e=>e instanceof AuthError&&e.status===401);
});
test('anonymous users cannot create, read, or mutate workspaces',async()=>{
 for(const req of [{method:'POST',url:'/api/room',body:{company:'Private office'}},{method:'GET',url:'/api/room?id=00000000-0000-4000-8000-000000000000'},{method:'POST',url:'/api/room?id=00000000-0000-4000-8000-000000000000',body:{type:'payment',name:'A',amount:1}}]){
  let code,body;await handler({...req,headers:{}},{setHeader(){},set statusCode(value){code=value},end(value){body=JSON.parse(value)}});
  assert.equal(code,401);assert.match(body.error,/sign in/i);
 }
});
test('invitation destinations survive authentication without accepting open redirects',()=>{
 const origin='https://tea.example.com',room='00000000-0000-4000-8000-000000000000';
 assert.equal(safeReturnPath('/?room='+room,origin),'/?room='+room);
 for(const path of ['https://evil.example.com','//evil.example.com','/login','/auth/callback','/?room=<script>','javascript:alert(1)','/\\evil.example.com'])assert.equal(safeReturnPath(path,origin),'/');
});
