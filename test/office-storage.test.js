import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {mkdtempSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {create,mutate,get,officeId} from '../server/store.js';
const folder=mkdtempSync(join(tmpdir(),'orattice-existing-'));process.env.TEA_SQLITE_PATH=join(folder,'tea.sqlite');after(()=>rmSync(folder,{recursive:true,force:true}));
test('ambiguous older Orattice books are not silently merged, replaced, or cleared',async()=>{const a=randomUUID(),b=randomUUID();await create(a,'Orattice');await create(b,'ORATTICE');await mutate(a,{type:'add',name:'Saved teammate',drink:'tea',qty:2});await assert.rejects(officeId(),error=>error.status===409);assert.equal((await get(a)).data.orders.length,1);assert.equal((await get(b)).data.company,'ORATTICE');});
