(() => {
 'use strict';
 const root=document.documentElement,hero=document.querySelector('.museum-hero'),story=document.querySelector('.museum-story'),navigation=document.querySelector('.scroll-chapters');
 if(!hero||!story||!navigation)return;
 const chapters=[...navigation.querySelectorAll('a[href^="#"]')].map(link=>({link,section:document.getElementById(link.hash.slice(1))})).filter(item=>item.section);
 if(!chapters.length)return;
 const motion=matchMedia('(prefers-reduced-motion: reduce)'),desktop=matchMedia('(min-width:901px) and (min-height:600px)');
 const clamp=value=>Math.max(0,Math.min(1,value));let queued=false;
 function render(){queued=false;const first=chapters[0].section.getBoundingClientRect(),last=chapters[chapters.length-1].section.getBoundingClientRect(),travel=last.bottom-first.top-innerHeight*.45;root.style.setProperty('--chapter-progress',clamp((innerHeight*.35-first.top)/Math.max(1,travel)).toFixed(4));let current=chapters[0];for(const item of chapters)if(item.section.getBoundingClientRect().top<=innerHeight*.46)current=item;for(const item of chapters){if(item===current)item.link.setAttribute('aria-current','location');else item.link.removeAttribute('aria-current');}if(!motion.matches&&desktop.matches){const rect=hero.getBoundingClientRect(),opening=clamp(-rect.top/Math.max(1,rect.height*.85)),scene=story.getBoundingClientRect(),progress=clamp((innerHeight*.35-scene.top)/Math.max(1,scene.height-innerHeight*.5)),distance=Number(document.body.dataset.scrollTravel)||12;root.style.setProperty('--hero-open',(.97+opening*.03).toFixed(4));root.style.setProperty('--photo-drift',((.5-progress)*distance).toFixed(2)+'px');}else{root.style.removeProperty('--hero-open');root.style.removeProperty('--photo-drift');}}
 function schedule(){if(!queued){queued=true;requestAnimationFrame(render);}}
 root.classList.add('museum-scroll-ready');window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',schedule,{passive:true});motion.addEventListener('change',schedule);desktop.addEventListener('change',schedule);render();
})();
