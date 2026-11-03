const dialog=document.querySelector('#project-viewer');
let selectedCase,opener;
function mode(size){document.querySelector('.viewer-stage').classList.toggle('mobile',size==='mobile');document.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===size)));const img=selectedCase.querySelector(size==='mobile'?'.mobile-shot':'.desktop-shot');document.querySelector('#viewer-image').src=img.src;document.querySelector('#viewer-image').alt=img.alt;}
document.querySelectorAll('.work-case').forEach(article=>{const button=document.createElement('button');button.type='button';button.className='preview-button';button.textContent='Compare desktop & mobile';article.querySelector('.work-copy').append(button);button.addEventListener('click',()=>{selectedCase=article;opener=button;document.querySelector('#viewer-title').textContent=article.querySelector('h3').textContent;document.querySelector('#viewer-open').href=article.querySelector('a').href;mode('desktop');dialog.showModal();});});
document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>mode(b.dataset.mode)));
document.querySelector('#close-viewer').addEventListener('click',()=>dialog.close());
dialog.addEventListener('close',()=>opener?.focus());
dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
