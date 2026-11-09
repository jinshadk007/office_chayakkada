import test from 'node:test';
import assert from 'node:assert/strict';
import {workspacePath} from '../src/workspace-links.js';
const origin='https://tea.example.com',id='00000000-0000-4000-8000-000000000000';
test('join accepts same-site invitation URLs and workspace IDs',()=>{for(const value of [id,'/?room='+id,origin+'/?room='+id,'  '+origin+'/?room='+id+'  '])assert.equal(workspacePath(value,origin),'/?room='+id);});
test('join rejects external, malformed, and executable links',()=>{for(const value of ['',null,{},'https://evil.example.com/?room='+id,'//evil.example.com/?room='+id,'javascript:alert(1)','/?room=invalid',origin+'/login?room='+id])assert.equal(workspacePath(value,origin),null);});
