/* Artwork is bundled for offline use; only songs present in this library open. */
window.FireAlbumShelf=(()=>{
  let dispose=()=>{},signature='';
  const norm=s=>String(s||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-zа-яё0-9]+/g,' ').trim();
  const albums=[{"key": "stadium", "album": "Stadium Arcadium", "artist": "Red Hot Chili Peppers", "titles": ["snow hey oh"], "source": "https://is1-ssl.mzstatic.com/image/thumb/Music5/v4/5e/49/35/5e493511-d87b-5aa2-b379-30fffbae902b/093624932154.jpg/300x300bb.jpg", "matchArtist": "red hot chili peppers"}, {"key": "californication", "album": "Greatest Hits", "artist": "Red Hot Chili Peppers", "titles": ["californication"], "source": "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/94/d4/24/94d42473-eb0e-229b-dd84-900a1874a91d/093624931980.jpg/300x300bb.jpg", "matchArtist": "red hot chili peppers"}, {"key": "ok-computer", "album": "OK Computer", "artist": "Radiohead", "titles": ["no surprises", "karma police"], "source": "https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/07/60/ba/0760ba0f-148c-b18f-d0ff-169ee96f3af5/634904078164.png/300x300bb.jpg", "matchArtist": "radiohead"}, {"key": "parachutes", "album": "Parachutes", "artist": "Coldplay", "titles": ["yellow"], "source": "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/f5/93/8c/f5938c49-964c-31d1-4b33-78b634f71fb7/190295978075.jpg/300x300bb.jpg", "matchArtist": "coldplay"}, {"key": "origin", "album": "Origin of Symmetry", "artist": "Muse", "titles": ["feeling good"], "source": "https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/0c/c8/0b/0cc80b73-aa09-492d-4fcc-984cab29acfa/825646096909.jpg/300x300bb.jpg", "matchArtist": "muse"}, {"key": "morning-glory", "album": "(What's the Story) Morning Glory?", "artist": "Oasis", "titles": ["wonderwall"], "source": "https://is1-ssl.mzstatic.com/image/thumb/Music113/v4/04/92/e0/0492e08b-cbcc-9969-9ad6-8f5a0888068c/5051961007107.jpg/300x300bb.jpg", "matchArtist": "oasis"}, {"key": "in-your-honor", "album": "In Your Honor", "artist": "Foo Fighters", "titles": ["best of you"], "source": "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/03/15/58/0315584b-0c8d-93c8-2342-55b3fc3fa88b/828767967257.jpg/300x300bb.jpg", "matchArtist": "foo fighters"}, {"key": "the-bends", "album": "The Bends", "artist": "Radiohead", "titles": ["fake plastic trees"], "source": "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/1b/a9/5c/1ba95cac-b245-d386-63fb-6b857aa9dce8/634904078065.png/300x300bb.jpg", "matchArtist": "radiohead"}];
  function stop(){dispose();dispose=()=>{};signature=''}
  function mount(root,songs,open){
    if(!root)return;
    const items=albums.map(a=>({a,s:songs.find(s=>a.titles.includes(norm(s.title))&&norm(s.artist).includes(norm(a.matchArtist)))})).filter(x=>x.s);
    const key=items.map(x=>x.s.id).join('|');
    if(key===signature&&root.querySelector('.album-shelf-stage'))return;
    stop();root.replaceChildren();root.hidden=items.length<3;if(root.hidden)return;signature=key;
    root.innerHTML='<div class="album-shelf-head"><h2>Твоя музыка</h2><div class="album-shelf-controls"><button type="button" data-shelf="prev" aria-label="Предыдущая обложка">‹</button><button type="button" data-shelf="pause" aria-label="Приостановить движение обложек" aria-pressed="false">Ⅱ</button><button type="button" data-shelf="next" aria-label="Следующая обложка">›</button></div></div><div class="album-shelf-stage" role="group" aria-label="Песни по обложкам альбомов"></div><p class="album-shelf-caption"><strong></strong><span></span></p>';
    const stage=root.querySelector('.album-shelf-stage'),caption=root.querySelector('.album-shelf-caption'),pause=root.querySelector('[data-shelf="pause"]');
    const buttons=items.map(({a,s})=>{
      const b=document.createElement('button');b.type='button';b.className='album-cover';b.setAttribute('aria-label','Открыть «'+s.title+'» — '+s.artist);
      const img=document.createElement('img');img.src='album-art/'+a.key+'.jpg';img.alt=a.artist+' — '+a.album;img.width=300;img.height=300;img.draggable=false;b.append(img);b.addEventListener('click',()=>{if(!dragged)open(s.id)});stage.append(b);return b;
    });
    const motion=matchMedia('(prefers-reduced-motion: reduce)');
    let pos=0,raf=0,last=0,visible=true,hover=false,focused=false,manual=motion.matches,pointer=null,dragged=false,width=0,size=132,selected=-1,closed=false;
    function draw(){
      if(!root.isConnected){stop();return}
      const step=size*.92,total=items.length;
      buttons.forEach((b,i)=>{
        const d=((i-pos+total*1.5)%total+total)%total-total/2;
        const x=d*step,edge=Math.min(1,Math.abs(x)/(width*.55||1));
        b.style.transform=`translateX(calc(-50% + ${x.toFixed(2)}px)) rotateY(${(-edge*68*Math.sign(d)).toFixed(2)}deg) scale(${(1-edge*.12).toFixed(3)})`;
        b.style.zIndex=String(100-Math.round(Math.abs(d)*10));b.style.opacity=String(Math.max(0,1-Math.max(0,edge-.72)*1.5));
        const shown=Math.abs(x)<width/2+size/3;b.style.visibility=shown?'visible':'hidden';b.tabIndex=shown?0:-1;
      });
      const i=((Math.round(pos)%total)+total)%total;
      if(i!==selected){selected=i;caption.firstElementChild.textContent=items[i].s.title;caption.lastElementChild.textContent=items[i].s.artist}
    }
    function tick(t){raf=0;if(closed)return;if(last)pos=(pos+Math.min(t-last,50)/6500)%items.length;last=t;draw();if(!closed)raf=requestAnimationFrame(tick)}
    function sync(){cancelAnimationFrame(raf);raf=0;last=0;if(!closed&&visible&&!document.hidden&&!manual&&!motion.matches&&!hover&&!focused&&!pointer)raf=requestAnimationFrame(tick)}
    function resize(){width=stage.clientWidth;size=buttons[0].offsetWidth;draw()}
    const ro=new ResizeObserver(resize);ro.observe(stage);
    const io=new IntersectionObserver(([e])=>{visible=e.isIntersecting;sync()});io.observe(stage);
    const visibility=()=>sync(),motionChange=()=>{if(motion.matches){manual=true;updatePause()}sync()};
    document.addEventListener('visibilitychange',visibility);motion.addEventListener('change',motionChange);
    function updatePause(){pause.textContent=manual?'▷':'Ⅱ';pause.setAttribute('aria-pressed',String(manual));pause.setAttribute('aria-label',manual?'Включить движение обложек':'Приостановить движение обложек')}
    root.querySelectorAll('[data-shelf]').forEach(b=>b.addEventListener('click',()=>{
      if(b.dataset.shelf==='pause'){manual=!manual;updatePause()}
      else{pos=Math.round(pos)+(b.dataset.shelf==='next'?1:-1);pos=(pos+items.length)%items.length;draw()}
      sync();
    }));
    stage.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse'){hover=true;sync()}});
    stage.addEventListener('pointerleave',()=>{hover=false;sync()});
    stage.addEventListener('focusin',()=>{focused=true;sync()});stage.addEventListener('focusout',e=>{focused=stage.contains(e.relatedTarget);sync()});
    stage.addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();pos+=e.key==='ArrowRight'?1:-1;draw()}});
    stage.addEventListener('pointerdown',e=>{if(e.button>0)return;pointer={id:e.pointerId,x:e.clientX,y:e.clientY,pos};dragged=false;sync()});
    stage.addEventListener('pointermove',e=>{if(!pointer||e.pointerId!==pointer.id)return;const dx=e.clientX-pointer.x;if(!dragged&&Math.abs(dx)>8&&Math.abs(dx)>Math.abs(e.clientY-pointer.y)){dragged=true;stage.setPointerCapture(e.pointerId)}if(dragged){pos=pointer.pos-dx/(size*.92);draw()}});
    const end=()=>{pointer=null;sync()};stage.addEventListener('pointerup',end);stage.addEventListener('pointercancel',end);
    dispose=()=>{closed=true;cancelAnimationFrame(raf);ro.disconnect();io.disconnect();document.removeEventListener('visibilitychange',visibility);motion.removeEventListener('change',motionChange)};
    updatePause();resize();sync();
  }
  return {mount,stop};
})();
