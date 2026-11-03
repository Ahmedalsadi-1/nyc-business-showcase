const menuButton=document.querySelector('.menu-toggle');
const studioMenu=document.getElementById('studioMenu');
function closeMenu(){menuButton.setAttribute('aria-expanded','false');menuButton.setAttribute('aria-label','Open navigation');studioMenu.classList.remove('is-open');}
menuButton.addEventListener('click',()=>{const open=menuButton.getAttribute('aria-expanded')!=='true';menuButton.setAttribute('aria-expanded',String(open));menuButton.setAttribute('aria-label',open?'Close navigation':'Open navigation');studioMenu.classList.toggle('is-open',open);});
studioMenu.addEventListener('click',event=>{if(event.target.closest('a'))closeMenu();});
document.addEventListener('keydown',event=>{if(event.key==='Escape'){const open=menuButton.getAttribute('aria-expanded')==='true';closeMenu();if(open)menuButton.focus();}});
document.addEventListener('click',event=>{if(!event.target.closest('.site-header'))closeMenu();});
