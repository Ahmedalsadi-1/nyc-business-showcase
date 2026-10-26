(() => {
 const scenes=[...document.querySelectorAll('.scroll-story')];
 if(!scenes.length)return;
 const enabled=matchMedia('(min-width:901px) and (min-height:600px) and (prefers-reduced-motion:no-preference)');
 document.documentElement.classList.add('scroll-ready');
 for(const scene of scenes){
  const chapters=[...scene.querySelectorAll('.scroll-chapter')],links=[...scene.querySelectorAll('.scroll-links a')],thumbs=[...scene.querySelectorAll('.taste-thumbs a')],image=scene.querySelector('.taste-view img'),progress=scene.querySelector('progress'),current=scene.querySelector('.scroll-current');let selected=-1,frame=0;
  function select(index,movePhoto=true){if(index===selected)return;selected=index;scene.dataset.activeChapter=String(index);chapters.forEach((chapter,i)=>chapter.classList.toggle('is-current',i===index));links.forEach((link,i)=>link.setAttribute('aria-current',String(i===index)));const heading=chapters[index]?.querySelector('h2')?.textContent||'';current.textContent=heading;progress.value=(index+1)/chapters.length;progress.setAttribute('aria-valuetext',heading);if(!movePhoto)return;const thumb=thumbs[Math.min(index,thumbs.length-1)];if(!thumb||!image)return;const next=thumb.getAttribute('href');if(image.getAttribute('src')!==next){image.src=next;image.alt=thumb.querySelector('img')?.alt||image.alt;if(enabled.matches)image.animate([{opacity:.55,transform:'scale(1.015)'},{opacity:1,transform:'scale(1)'}],{duration:420,easing:'cubic-bezier(.22,1,.36,1)'});}thumbs.forEach(a=>a.setAttribute('aria-current',String(a===thumb)));}
  function sync(){frame=0;if(!enabled.matches){selected=-1;return;}const box=scene.getBoundingClientRect();if(box.bottom<0||box.top>innerHeight)return;let closest=0,distance=Infinity;chapters.forEach((chapter,index)=>{const r=chapter.getBoundingClientRect(),value=Math.abs(r.top+r.height*.5-innerHeight*.5);if(value<distance){distance=value;closest=index;}});select(closest);}
  function schedule(){if(!frame)frame=requestAnimationFrame(sync);}
  thumbs.forEach((thumb,index)=>thumb.addEventListener('click',()=>select(Math.min(index,chapters.length-1),false)));
  window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',schedule,{passive:true});enabled.addEventListener('change',()=>{selected=-1;schedule();});schedule();
 }
})();
