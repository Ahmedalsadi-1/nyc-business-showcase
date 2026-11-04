const $ = id => document.getElementById(id);
const office = document.querySelector('.office');
const stage = document.querySelector('.office-stage');
const projects = [...document.querySelectorAll('.work-case')].map(project => ({
  title: project.querySelector('h3').textContent,
  image: project.querySelector('.desktop-shot').getAttribute('src')
}));
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let world;
let frame = 0;
let currentProject = -1;

function renderOffice() {
  frame = 0;
  const distance = office.offsetHeight - stage.offsetHeight;
  const progress = distance > 0 ? Math.max(0, Math.min(1, -office.getBoundingClientRect().top / distance)) : 0;
  stage.classList.toggle('is-awake', progress >= .09 || reducedMotion.matches);
  stage.classList.toggle('is-showing', progress >= .23 || reducedMotion.matches);
  stage.style.setProperty('--approach', Math.min(1, progress / .37));
  const index = Math.min(projects.length - 1, Math.max(0, Math.floor((progress - .32) / (.68 / projects.length))));
  if (index !== currentProject) {
    currentProject = index;
    const project = projects[index];
    $('office-shot').src = project.image;
    $('office-shot').alt = project.title + ' website concept';
    $('office-title').textContent = project.title;
    $('office-count').textContent = '0' + (index + 1) + ' / 0' + projects.length;
  }
  world?.set(reducedMotion.matches ? 0 : progress, index, progress >= .09 || reducedMotion.matches, progress >= .23 || reducedMotion.matches);
  $('office-status').textContent = reducedMotion.matches ? 'Selected website concepts' :
    progress < .09 ? 'Scroll to wake the computer ↓' :
    progress < .23 ? 'Starting up…' : 'Scroll to browse the work ↓';
}

function scheduleOffice() {
  if (!frame) frame = requestAnimationFrame(renderOffice);
}
function updateMotion() {
  office.classList.toggle('office-motion', !reducedMotion.matches);
  renderOffice();
}
addEventListener('scroll', scheduleOffice, {passive: true});
addEventListener('resize', () => { world?.resize(); scheduleOffice(); });
reducedMotion.addEventListener('change', updateMotion);
$('wake-desk').addEventListener('click', event => {
  event.preventDefault();
  if (reducedMotion.matches) {
    document.getElementById('work').scrollIntoView();
    return;
  }
  const start = scrollY + office.getBoundingClientRect().top;
  scrollTo({top: start + (office.offsetHeight - stage.offsetHeight) * .39, behavior: 'smooth'});
});
updateMotion();

if (!reducedMotion.matches && !navigator.connection?.saveData) {
  const viewport = document.querySelector('.office-world');
  import('./office-world.js?v=desk3d').then(({createOffice}) => {
    world = createOffice(viewport, projects);
    renderOffice();
    stage.classList.add('has-world');
    viewport.querySelector('canvas').addEventListener('webglcontextlost', () => {
      stage.classList.remove('has-world');
    });
  }).catch(() => {
    // The illustrated desk remains usable when WebGL is unavailable.
  });
}

const dialog=$('briefDialog');$('openBrief').hidden=false;$('openBrief').onclick=()=>{dialog.showModal();$('briefBusiness').focus();};$('closeBrief').onclick=()=>dialog.close();$('briefForm').onsubmit=event=>{event.preventDefault();$('briefText').value=`Website project brief\n\nBusiness: ${$('briefBusiness').value.trim()}\nCurrent website: ${$('briefWebsite').value.trim()||'Not provided'}\n\nWhat I want to improve:\n${$('briefGoal').value.trim()}\n\nFor discussion with the studio. Scope, pricing and next steps to be agreed.`;$('briefOutput').hidden=false;$('briefStatus').textContent='Brief prepared. Nothing has been sent.';$('briefText').focus();};$('copyBrief').onclick=async()=>{try{await navigator.clipboard.writeText($('briefText').value);$('briefStatus').textContent='Copied. Share your brief with the studio when you are ready.';}catch{$('briefText').focus();$('briefText').select();$('briefStatus').textContent='Select and copy the brief above.';}};
