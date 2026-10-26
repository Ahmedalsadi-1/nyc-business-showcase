(()=>{
 const hero=document.querySelector('main>.hero'),chooser=document.querySelector('main>.chooser'),windowSection=document.querySelector('main>.shop-window'),visit=document.querySelector('main>.street-scene');
 if(!hero||!chooser||!windowSection)return;
 const config=JSON.parse(document.querySelector('#world-scroll-data')?.textContent||'{}'),reduced=matchMedia('(prefers-reduced-motion:reduce)'),wide=matchMedia('(min-width:1100px)');
 document.body.classList.add('world-story-enabled');
 const wrapper=document.createElement('div');wrapper.className='world-browse-story';chooser.before(wrapper);wrapper.append(chooser,windowSection);
 const sections=[hero,chooser,windowSection,...(visit?[visit]:[])];const labels=config.labels||['Overview','Your choice','Collection','Visit'];
 const rail=document.createElement('nav');rail.className='world-story-nav';rail.setAttribute('aria-label','Explore this page');
 sections.forEach((section,i)=>{if(!section.id)section.id='shop-story-'+(i+1);const a=document.createElement('a');a.href='#'+section.id;a.textContent=labels[i];rail.append(a);});
 const progress=document.createElement('span');progress.className='world-story-progress';progress.setAttribute('aria-hidden','true');progress.append(document.createElement('span'));rail.append(progress);document.querySelector('.site-nav').after(rail);
 const links=[...rail.querySelectorAll('a')],photo=hero.querySelector('.hero-photo'),pieces=[...windowSection.querySelectorAll('.window-piece')],streetCopy=visit?.querySelector('.street-copy');let queued=false;
 const clamp=(n,min=0,max=1)=>Math.min(max,Math.max(min,n));
 function configure(){const active=wide.matches&&!reduced.matches;chooser.classList.toggle('is-held',active&&chooser.offsetHeight<innerHeight-120);if(streetCopy)streetCopy.classList.toggle('is-held',active&&streetCopy.offsetHeight<innerHeight-130);queue();}
 function draw(){queued=false;const pageLength=Math.max(1,document.documentElement.scrollHeight-innerHeight);progress.firstChild.style.transform='scaleX('+clamp(scrollY/pageLength)+')';let current=0;sections.forEach((s,i)=>{if(s.getBoundingClientRect().top<innerHeight*.38)current=i;});links.forEach((a,i)=>{if(i===current)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});if(reduced.matches)return;if(photo&&innerWidth>700){const p=clamp(-hero.getBoundingClientRect().top/Math.max(1,hero.offsetHeight));const atelier=document.body.classList.contains('world-atelier');photo.style.transform='translate3d(0,'+(p*(atelier?18:10)).toFixed(1)+'px,0) scale('+(1+p*(atelier?.06:.035)).toFixed(4)+')';photo.style.clipPath='inset('+(Math.max(0,2-p*4)).toFixed(2)+'% '+(Math.max(0,2-p*4)).toFixed(2)+'%)';}if(innerWidth>700)pieces.forEach((piece,i)=>{const img=piece.querySelector('.window-object img');if(!img)return;const p=clamp((innerHeight*.75-piece.getBoundingClientRect().top)/innerHeight);img.style.transform='translate3d(0,'+((1-p)*12).toFixed(1)+'px,0) scale('+(1+p*.025).toFixed(4)+')';});}
 function queue(){if(!queued){queued=true;requestAnimationFrame(draw);}}
 addEventListener('scroll',queue,{passive:true});addEventListener('resize',configure,{passive:true});reduced.addEventListener('change',configure);wide.addEventListener('change',configure);new ResizeObserver(configure).observe(chooser);document.fonts?.ready.then(configure);configure();
 if(location.hash){const target=document.getElementById(decodeURIComponent(location.hash.slice(1)));if(target&&sections.includes(target))requestAnimationFrame(()=>target.scrollIntoView());}
})();
