/* Desktop transport panel positioning; playback controls keep their own pointer gestures. */
(()=>{
 const panel=document.getElementById('tools'),desktop=matchMedia('(hover:hover) and (pointer:fine)');
 let saved=null,drag=null;try{saved=JSON.parse(localStorage.getItem('sb.tools.position'))}catch{}
 function place(x,y){const r=panel.getBoundingClientRect();x=Math.max(8,Math.min(innerWidth-r.width-8,x));y=Math.max(8,Math.min(innerHeight-r.height-8,y));panel.style.setProperty('--tools-x',x+'px');panel.style.setProperty('--tools-y',y+'px');return{x,y}}
 function sync(){if(!desktop.matches){panel.classList.remove('tools-floating');return}if(!panel.hidden&&!panel.querySelector('.tools-drag')){const handle=document.createElement('div');handle.className='tools-drag';handle.title='Перетащить панель · двойной щелчок — вернуть на место';handle.innerHTML='<span aria-hidden="true">⠿</span><span>Перетащить</span>';panel.prepend(handle)}if(saved&&!panel.hidden){panel.classList.add('tools-floating');saved=place(saved.x,saved.y)}}
 panel.addEventListener('pointerdown',e=>{const handle=e.target.closest('.tools-drag');if(!handle||!desktop.matches||e.button!==0)return;e.preventDefault();const r=panel.getBoundingClientRect();drag={id:e.pointerId,dx:e.clientX-r.left,dy:e.clientY-r.top};panel.classList.add('tools-floating');place(r.left,r.top);handle.setPointerCapture(e.pointerId)});
 panel.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.id)return;saved=place(e.clientX-drag.dx,e.clientY-drag.dy)});
 function end(e){if(!drag||e.pointerId!==drag.id)return;drag=null;if(saved)localStorage.setItem('sb.tools.position',JSON.stringify(saved))}
 panel.addEventListener('pointerup',end);panel.addEventListener('pointercancel',end);
 panel.addEventListener('dblclick',e=>{if(!e.target.closest('.tools-drag'))return;drag=null;saved=null;localStorage.removeItem('sb.tools.position');panel.classList.remove('tools-floating')});
 new MutationObserver(sync).observe(panel,{childList:true,attributes:true,attributeFilter:['hidden']});addEventListener('resize',sync);desktop.addEventListener('change',sync);sync();
})();