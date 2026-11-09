import {defineConfig,loadEnv} from 'vite';
import {execFileSync} from 'node:child_process';
import handler from './api/room.js';
import {approvedVideoScene,approvedFrameScene} from './src/media-config.js';

function releaseInfo(){
 let commit=process.env.VERCEL_GIT_COMMIT_SHA||null;
 if(!commit){try{commit=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim();}catch{}}
 return {app:'Orattice Chayakkada',release:'cinematic-scroll-v1',commit,newFilmConfigured:!!approvedVideoScene(),frameSequenceConfigured:!!approvedFrameScene(),features:['gsap-scroll-player','mobile-static-fallback','sound-toggle','success-only-celebration'],builtAt:new Date().toISOString()};
}

export default defineConfig(({mode})=>{
 const env=loadEnv(mode,process.cwd(),'');
 for(const key of ['SUPABASE_URL','SUPABASE_SECRET_KEY','SUPABASE_SERVICE_ROLE_KEY','SUPABASE_PUBLISHABLE_KEY','VITE_SUPABASE_URL','VITE_SUPABASE_PUBLISHABLE_KEY']){if(!process.env[key]&&env[key])process.env[key]=env[key];}
 return {plugins:[
  {name:'deployment-fingerprint',generateBundle(){this.emitFile({type:'asset',fileName:'release.json',source:JSON.stringify(releaseInfo(),null,2)+'\n'});},configureServer(server){server.middlewares.use('/release.json',(_req,res)=>{res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type','application/json');res.end(JSON.stringify(releaseInfo()));});}},
  {name:'tea-workspace-api',configureServer(server){server.middlewares.use('/api/room',async(req,res)=>{req.url='/api/room'+req.url;try{if(req.method==='POST'){let body='';for await(const chunk of req){body+=chunk;if(body.length>20000){res.statusCode=413;res.end('Request too large');return;}}req.body=JSON.parse(body||'{}');}await handler(req,res);}catch{res.statusCode=400;res.end(JSON.stringify({error:'Invalid request.'}));}});}},
 ]};
});
