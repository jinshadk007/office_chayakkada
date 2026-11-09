import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,readFileSync,rmSync,readdirSync} from 'node:fs';
import {execFileSync,spawnSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const folder=mkdtempSync(join(tmpdir(),'cinematic-export-'));after(()=>rmSync(folder,{recursive:true,force:true}));
test('export refuses unapproved source material before touching it',()=>{const approval=join(folder,'unapproved.json');writeFileSync(approval,'{}');const result=spawnSync(process.execPath,['scripts/prepare-cinematic.mjs',join(folder,'no-film.mp4'),approval,join(folder,'rejected')],{encoding:'utf8'});assert.notEqual(result.status,0);assert.match(result.stderr,/Consent/);assert.equal(readdirSync(folder).includes('rejected'),false);});
test('export produces actual numbered frames, seekable silent film, poster, and dimensions',()=>{
 // A generated color fixture tests file processing only, not AI/identity generation.
 const input=join(folder,'synthetic-test.mp4'),approval=join(folder,'test-approval.json'),output=join(folder,'review');
 execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-f','lavfi','-i','testsrc=size=120x160:rate=12','-t','1','-c:v','libx264','-pix_fmt','yuv420p',input]);
 writeFileSync(approval,JSON.stringify({subjectConsent:true,voiceConsent:true,storyboardApproved:true,newlyGeneratedFilm:true,consentReference:'AUTOMATED_TEST_ONLY',assetLicense:'Synthetic fixture',voiceLicense:'No real voice in test',publicationApproved:false}));
 execFileSync(process.execPath,['scripts/prepare-cinematic.mjs',input,approval,output]);const info=JSON.parse(readFileSync(join(output,'provenance.json'),'utf8'));assert.equal(info.frames,12);assert.equal(info.width,240);assert.equal(info.height,320);assert.equal(info.publicationApproved,false);assert.ok(readdirSync(output).includes('film-silent.mp4'));assert.ok(readdirSync(output).includes('poster.jpg'));
});
