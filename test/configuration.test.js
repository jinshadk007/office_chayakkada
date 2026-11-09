import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {databaseProblem} from '../api/room.js';
test('missing production database key fails clearly instead of returning an empty tea book',()=>{
 const output=execFileSync(process.execPath,['--input-type=module','-e',`import handler from './api/room.js';let status;await handler({method:'GET',url:'/api/room?office=1',headers:{}},{setHeader(){},set statusCode(value){status=value},end(body){console.log(JSON.stringify({status,body:JSON.parse(body)}))}});`],{cwd:process.cwd(),env:{...process.env,VERCEL:'1',SUPABASE_SECRET_KEY:'',SUPABASE_SERVICE_ROLE_KEY:''},encoding:'utf8'});
 const result=JSON.parse(output);assert.equal(result.status,503);assert.equal(result.body.code,'DATABASE_NOT_CONFIGURED');assert.equal(result.body.data,undefined);assert.match(result.body.error,/No saved data has been cleared/);
});

test('database diagnostics distinguish missing schema, invalid credentials, and table permissions',()=>{assert.equal(databaseProblem({code:'PGRST205'}).code,'DATABASE_TABLE_MISSING');assert.equal(databaseProblem({status:401}).code,'DATABASE_KEY_REJECTED');assert.equal(databaseProblem({status:403,code:'42501'}).code,'DATABASE_PERMISSION_DENIED');assert.equal(databaseProblem({}).code,'DATABASE_UNAVAILABLE');});
