import {voiceLines,isApprovedMedia} from './media-config.js';
// Procedural non-voice effects, made locally. No recordings or cloned voices.
export function createTeaAudio(button,onChange=()=>{}){
 let context=null,enabled=false,last=0,voice=null,destroyed=false;
 function paint(){button.textContent=enabled?'♪ Sound on':'♪ Sound off';button.setAttribute('aria-pressed',enabled);button.title='Optional soft tea-shop effects. Voice is used only when an approved asset is configured.';onChange(enabled);}
 async function toggle(){
  if(destroyed)return;
  if(enabled){enabled=false;voice?.pause();await context?.suspend();paint();return;}
  const Audio=window.AudioContext||window.webkitAudioContext;
  if(!Audio){button.textContent='Sound unavailable';button.disabled=true;return;}
  try{context??=new Audio();await context.resume();if(destroyed)return;enabled=true;paint();effect('clink');}catch{enabled=false;paint();}
 }
 function effect(kind){
  if(!enabled||context?.state!=='running'||document.hidden||destroyed)return;
  const now=context.currentTime;if(now-last<.13)return;last=now;
  if(kind==='pour'){
   const buffer=context.createBuffer(1,Math.floor(context.sampleRate*.4),context.sampleRate),data=buffer.getChannelData(0);
   for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*.35;
   const source=context.createBufferSource(),filter=context.createBiquadFilter(),gain=context.createGain();source.buffer=buffer;filter.type='lowpass';filter.frequency.value=1300;gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(.035,now+.06);gain.gain.exponentialRampToValueAtTime(.001,now+.38);source.connect(filter).connect(gain).connect(context.destination);source.start();source.stop(now+.4);return;
  }
  const oscillator=context.createOscillator(),gain=context.createGain();oscillator.type='sine';oscillator.frequency.setValueAtTime(kind==='tick'?650:1700,now);oscillator.frequency.exponentialRampToValueAtTime(kind==='tick'?450:1100,now+.12);gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(kind==='tick'?.015:.025,now+.008);gain.gain.exponentialRampToValueAtTime(.0001,now+.18);oscillator.connect(gain).connect(context.destination);oscillator.start();oscillator.stop(now+.2);
 }
 function playApprovedVoice(event){const asset=voiceLines[event];if(!enabled||!isApprovedMedia(asset))return;voice?.pause();voice=new window.Audio(asset.src);voice.volume=.6;voice.play().catch(()=>{});}
 const visibility=()=>{if(document.hidden){voice?.pause();context?.suspend();}else if(enabled)context?.resume().catch(()=>{});};
 button.addEventListener('click',toggle);document.addEventListener('visibilitychange',visibility);paint();
 return {effect,playApprovedVoice,get enabled(){return enabled},destroy(){destroyed=true;enabled=false;voice?.pause();context?.close().catch(()=>{});button.removeEventListener('click',toggle);document.removeEventListener('visibilitychange',visibility);}};
}
