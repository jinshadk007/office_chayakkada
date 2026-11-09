import {createTeaAudio} from './tea-audio.js';
import {referencePhoto,generatedScene,approvedVideoScene,approvedFrameScene} from './media-config.js';
import {createFramePlayer} from './frame-player.js';

export function createTeaExperience(){
 const preference=matchMedia('(prefers-reduced-motion: reduce)'),desktop=matchMedia('(min-width: 651px)');
 const scene=document.querySelector('.delivery-scene'),video=document.querySelector('#delivery-video'),still=document.querySelector('#delivery-still'),canvas=document.querySelector('#delivery-canvas'),toggle=document.querySelector('#motion-toggle'),playButton=document.querySelector('#play-film');
 const film=approvedVideoScene(generatedScene),frames=approvedFrameScene(generatedScene);
 let mediaFailed=false;
 let paused=preference.matches||!!navigator.connection?.saveData,disposed=false,inView=false,gsap,ScrollTrigger,context,loading,framePlayer=null,mode='photo',entryPlayed=false,orderBound=false,surprised=false,feedbackTimer,refreshFrame,seekFrame,scrollProgress=0;
 const jobs=new Set(),timers=new Set();
 const audio=createTeaAudio(document.querySelector('#sound-toggle'),enabled=>{video.muted=!(mode==='film'&&film?.audioApproved&&enabled)});
 const scrubMode=()=>frames?'frames':'video-scroll';
 if(film){
  mode=scrubMode();still.src=film.poster||referencePhoto.poster;video.poster=film.poster||referencePhoto.poster;
  video.querySelector('source').dataset.src=film.src;document.querySelector('#scene-disclosure').textContent=film.disclosure;
  playButton.hidden=false;
  if(film.captions?.startsWith('/media/approved/')&&!film.captions.includes('..')){const track=document.createElement('track');track.kind='captions';track.srclang='ml';track.label='Malayalam';track.default=true;track.src=film.captions;video.append(track);}
 }
 if(frames)framePlayer=createFramePlayer({canvas,asset:frames,onReady:()=>scene.classList.add('frame-ready')});
 function later(callback,delay){const id=setTimeout(()=>{timers.delete(id);if(!disposed)callback()},delay);timers.add(id);return id;}
 function animate(target,keyframes,options){if(paused||disposed||!target)return;const job=target.animate(keyframes,options);jobs.add(job);job.finished.catch(()=>{}).finally(()=>jobs.delete(job));}
 function ensureVideo(){if(!film||disposed||mediaFailed)return;const source=video.querySelector('source');if(!source.getAttribute('src')||video.error){source.src=source.dataset.src;video.load();}}
 function seek(){
  if(disposed||paused||!inView||mode!=='video-scroll'||!desktop.matches||!film||mediaFailed)return;
  if(!Number.isFinite(video.duration)||video.duration<=0){ensureVideo();return;}
  const time=scrollProgress*Math.max(0,video.duration-.1);
  if(!video.seeking&&Math.abs(video.currentTime-time)>.025){try{video.currentTime=time;}catch{/* Poster remains visible until media can seek. */}}
 }
 function queueSeek(){if(seekFrame||disposed)return;seekFrame=requestAnimationFrame(()=>{seekFrame=0;seek();});}
 const onVideoReady=()=>{scene.classList.add('video-ready');queueSeek();};
 video.addEventListener('loadeddata',onVideoReady);video.addEventListener('seeked',queueSeek);
 const onVideoError=()=>{mediaFailed=true;video.pause();scene.classList.remove('playing-film','video-ready');mode=film?scrubMode():'photo';playButton.textContent='Retry film';};video.addEventListener('error',onVideoError);video.querySelector('source').addEventListener('error',onVideoError);
 function showSurprise(){if(surprised||paused||disposed||!document.querySelector('#order-panel')?.offsetParent)return;surprised=true;const note=document.querySelector('#order-surprise');note.hidden=false;animate(note,[{opacity:0,transform:'translate(15px,4px) rotate(5deg)'},{opacity:1,transform:'translate(0,0) rotate(-2deg)'}],{duration:450,easing:'cubic-bezier(.2,.8,.2,1)',fill:'both'});later(()=>{note.hidden=true},3500);}
 function bindOrderReveal(){
  if(!gsap||!context||orderBound||paused||!document.querySelector('#order-panel')?.offsetParent)return;
  orderBound=true;context.add(()=>{gsap.from('.workspace-head,.drink-grid,.order-options,.add-order-footer',{y:12,opacity:.6,duration:.6,stagger:.08,ease:'power2.out',scrollTrigger:{trigger:'.workspace',start:'top 88%',once:true,onEnter:showSurprise}});});
 }
 async function setupAnimations(){
  if(paused||disposed||context)return;
  loading??=Promise.all([import('gsap'),import('gsap/ScrollTrigger')]);
  try{
   const [module,plugin]=await loading;if(paused||disposed||context)return;gsap=module.gsap;ScrollTrigger=plugin.ScrollTrigger;gsap.registerPlugin(ScrollTrigger);document.documentElement.classList.add('cinematic-enabled');
   context=gsap.context(()=>{
    if(!entryPlayed){gsap.from('.hero-line',{y:20,opacity:.55,duration:1,stagger:.13,ease:'power3.out'});entryPlayed=true;}
    if(desktop.matches){
     if(film){const progress={value:scrollProgress};gsap.fromTo(progress,{value:0},{value:1,ease:'none',scrollTrigger:{trigger:scene,start:()=>0,end:()=>'+='+Math.max(1,Math.min(850,innerHeight*.8,document.documentElement.scrollHeight-innerHeight)),scrub:.35,invalidateOnRefresh:true},onUpdate:()=>{scrollProgress=progress.value;if(mode==='frames'){framePlayer?.setProgress(scrollProgress);}else if(mode==='video-scroll')queueSeek();scene.style.setProperty('--scene-progress',String(scrollProgress));}});}
     gsap.to(scene,{y:-18,ease:'none',scrollTrigger:{trigger:'.workspace-main',start:'top top',end:'bottom bottom',scrub:.8}});
     gsap.to('.delivery-stamp',{rotation:25,ease:'none',scrollTrigger:{trigger:'.workspace-main',start:'top top',end:'bottom bottom',scrub:1}});
    }
   });bindOrderReveal();ScrollTrigger.refresh();
  }catch{/* Optional motion failure leaves the photo and ordering fully usable. */document.documentElement.classList.remove('cinematic-enabled');}
 }
 function syncMedia(){
  scene.classList.toggle('scene-offscreen',!inView||document.hidden);
  if(paused||!inView||document.hidden){video.pause();framePlayer?.pause();return;}
  if(mode==='film'){ensureVideo();video.play().catch(onVideoError);return;}
  if(!desktop.matches)return; // Phones use the static image + explicit film playback.
  if(mode==='frames'){framePlayer?.setProgress(scrollProgress);framePlayer?.resume();}
  else if(mode==='video-scroll'){video.pause();video.muted=true;ensureVideo();queueSeek();}
 }
 function paint(){
  document.documentElement.classList.toggle('motion-paused',paused);toggle.textContent=paused?'Enable motion':'Pause motion';toggle.setAttribute('aria-pressed',String(!paused));
  if(paused){video.pause();framePlayer?.pause();context?.revert();context=null;orderBound=false;document.documentElement.classList.remove('cinematic-enabled');for(const job of jobs)job.cancel();jobs.clear();scene.style.setProperty('--scene-progress','0');document.querySelector('#order-surprise').hidden=true;}
  else{setupAnimations();syncMedia();}
 }
 const onToggle=()=>{paused=!paused;paint();};const onPreference=e=>{paused=e.matches;paint();};
 const onViewport=()=>{context?.revert();context=null;orderBound=false;framePlayer?.pause();video.pause();scene.style.setProperty('--scene-progress','0');paint();};
 const onPlay=()=>{
  if(!film)return;
  if(mode==='film'){video.pause();mode=scrubMode();scene.classList.remove('playing-film');playButton.textContent='Play film';video.muted=true;syncMedia();return;}
  framePlayer?.pause();if(mediaFailed)video.querySelector('source').removeAttribute('src');mediaFailed=false;mode='film';if(paused){paused=false;paint();}ensureVideo();video.currentTime=0;video.muted=!(film.audioApproved&&audio.enabled);scene.classList.add('playing-film');playButton.textContent='Back to scroll';video.play().catch(onVideoError);
 };
 toggle.addEventListener('click',onToggle);playButton.addEventListener('click',onPlay);preference.addEventListener('change',onPreference);desktop.addEventListener('change',onViewport);
 const observer=new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;syncMedia();},{rootMargin:'100px'});observer.observe(scene);
 const onVisibility=()=>syncMedia();document.addEventListener('visibilitychange',onVisibility);
 paint();
 return {
  get paused(){return paused},
  refresh(){if(disposed)return;cancelAnimationFrame(refreshFrame);refreshFrame=requestAnimationFrame(()=>{bindOrderReveal();ScrollTrigger?.refresh();});},
  cupPicked(button){animate(button.querySelector('.drink-emoji'),[{transform:'translateY(0) rotate(0)'},{transform:'translateY(-7px) rotate(-8deg)',offset:.45},{transform:'translateY(0) rotate(0)'}],{duration:430,easing:'ease-out'});button.classList.add('cup-steaming');later(()=>button.classList.remove('cup-steaming'),1100);audio.effect('clink');},
  quantityChanged(input){animate(input,[{transform:'scale(1)'},{transform:'scale(1.16)',offset:.45},{transform:'scale(1)'}],{duration:250,easing:'ease-out'});audio.effect('tick');},
  orderStarted(){clearTimeout(feedbackTimer);document.querySelector('#order-celebration').hidden=true;document.querySelectorAll('.cinema-confetti').forEach(piece=>piece.remove());},
  succeeded(kind){
   if(disposed)return;
   if(kind!=='order'){if(!paused)animate(document.querySelector('.sponsor-banner'),[{boxShadow:'0 0 0 0 #9aad7333'},{boxShadow:'0 0 0 12px #9aad7300'}],{duration:650});return;}
   const feedback=document.querySelector('#order-celebration');feedback.dataset.successCount=String(Number(feedback.dataset.successCount||0)+1);feedback.hidden=false;clearTimeout(feedbackTimer);feedbackTimer=later(()=>{feedback.hidden=true},4200);
   if(!paused){animate(feedback,[{opacity:0,transform:'translateY(15px) scale(.96)'},{opacity:1,transform:'translateY(0) scale(1)'}],{duration:450,easing:'cubic-bezier(.2,.8,.2,1)'});animate(document.querySelector('.cup-pal'),[{transform:'translateY(0) rotate(-3deg)'},{transform:'translateY(-16px) rotate(9deg)'},{transform:'translateY(0) rotate(-3deg)'}],{duration:700});
    for(let i=0;i<14;i++){const piece=document.createElement('span');piece.className='cinema-confetti';piece.textContent=i%3?'✦':'☕';piece.style.setProperty('--drift',((i-7)*21)+'px');piece.style.setProperty('--spin',((i%2?1:-1)*100)+'deg');feedback.append(piece);later(()=>piece.remove(),1400);}
   }
   audio.effect('pour');audio.playApprovedVoice('order');
  },
  destroy(){disposed=true;clearTimeout(feedbackTimer);cancelAnimationFrame(refreshFrame);cancelAnimationFrame(seekFrame);for(const id of timers)clearTimeout(id);for(const job of jobs)job.cancel();jobs.clear();context?.revert();framePlayer?.destroy();video.pause();observer.disconnect();audio.destroy();toggle.removeEventListener('click',onToggle);playButton.removeEventListener('click',onPlay);preference.removeEventListener('change',onPreference);desktop.removeEventListener('change',onViewport);document.removeEventListener('visibilitychange',onVisibility);video.removeEventListener('loadeddata',onVideoReady);video.removeEventListener('seeked',queueSeek);video.removeEventListener('error',onVideoError);video.querySelector('source').removeEventListener('error',onVideoError);},
 };
}
