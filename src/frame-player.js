import {approvedFrameScene} from './media-config.js';
// A bounded, on-demand frame renderer. Construction never fetches an image.
export function createFramePlayer({canvas,asset,onReady=()=>{}}){
 if(!approvedFrameScene(asset))throw Error('A new, approved cinematic asset is required.');
 const context=canvas.getContext('2d'),cache=new Map(),failed=new Set(),loading=new Map();
 let desired=0,active=false,disposed=false,queue=[];
 canvas.width=asset.width;canvas.height=asset.height;
 function draw(){if(!active||disposed||!context)return;const image=cache.get(desired);if(image){context.drawImage(image,0,0,canvas.width,canvas.height);canvas.dataset.frame=String(desired);onReady(desired);}}
 function pump(){
  if(!active||disposed)return;
  while(loading.size<3&&queue.length){
   const index=queue.shift();if(cache.has(index)||loading.has(index)||failed.has(index))continue;
   const image=new Image();image.decoding='async';loading.set(index,image);
   image.onload=()=>{loading.delete(index);if(disposed)return;cache.set(index,image);while(cache.size>24){const oldest=cache.keys().next().value;cache.delete(oldest);}draw();pump();};
   image.onerror=()=>{loading.delete(index);failed.add(index);pump();};
   image.src=asset.framePath+String(index+1).padStart(3,'0')+'.webp';
  }
 }
 function schedule(){queue=[desired,desired+1,desired-1,desired+2,desired-2].filter(i=>i>=0&&i<asset.frameCount);draw();pump();}
 return {
  setProgress(value){desired=Math.max(0,Math.min(asset.frameCount-1,Math.round(value*(asset.frameCount-1))));if(active)schedule();},
  resume(){if(disposed)return;active=true;schedule();},
  pause(){active=false;queue=[];},
  destroy(){disposed=true;active=false;queue=[];for(const image of loading.values()){image.onload=null;image.onerror=null;image.src='';}loading.clear();cache.clear();},
 };
}
