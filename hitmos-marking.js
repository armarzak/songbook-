/* Original recording timings are deliberately independent of the backing track's TR state. */
window.FCHitmosMark=(()=>{
  const state={marking:false,id:null,audio:'',player:null,marks:[],n:0,raf:0,current:-1};
  function update(){
    const p=state.player;if(!p)return;
    const t=p.currentTime||0,d=Number.isFinite(p.duration)?p.duration:0;
    const time=document.getElementById('hm-mark-time');if(time)time.textContent=fmtTime(t)+' / '+fmtTime(d);
    const seek=document.getElementById('hm-mark-seek');if(seek){seek.max=d||0;seek.value=t;seek.disabled=!d}
    const toggle=document.querySelector('[data-act="hm-toggle"]');
    if(toggle){toggle.innerHTML=p.paused?ICON.play:ICON.pause;toggle.setAttribute('aria-label',p.paused?'Играть оригинал Hitmos':'Пауза оригинала Hitmos')}
    const label=document.getElementById('hm-mark-main');if(label)label.textContent='Строка '+(state.marks.length+1)+' из '+state.n;
  }
  function follow(){
    cancelAnimationFrame(state.raf);state.raf=0;
    const p=state.player;if(!p||!p.isConnected)return;
    if(state.marking)update();
    else if(S.view==='song'&&S.cur===state.id&&(!TR.el||TR.el.paused)){
      const timing=playbackTiming(findSong(state.id),'hitmos',state.audio),marks=timing.marks;let current=-1;
      marks.forEach((time,i)=>{if(time!=null&&time<=p.currentTime+.05)current=i});
      if(current!==state.current){state.current=current;lineHL(current,'cur',!p.paused)}
      state.cur=current;state.marks=marks;state.wordMarks=timing.wmarks;
      wordFollow(p.currentTime,state);
    }
    if(!p.paused)state.raf=requestAnimationFrame(follow);
  }
  function bind(player,song,audio){
    player.addEventListener('play',()=>{
      if(state.marking&&state.player!==player)finish(true);
      wordClear();wordClear(state);Object.assign(state,{id:song.id,audio,player,current:-1});follow();
    });
    player.addEventListener('pause',update);
    player.addEventListener('loadedmetadata',update);
    player.addEventListener('seeked',()=>{if(state.player===player)follow()});
    player.addEventListener('ended',()=>{if(state.marking&&state.player===player)finish(true)});
  }
  function start(){
    if(TR.marking){toast('Сначала завершите разметку минуса');return}
    const song=findSong(S.cur),box=document.getElementById('hitmosbox'),player=box?.querySelector('audio');
    if(!song||!player){toast('Сначала загрузите оригинал во встроенный плеер Hitmos');return}
    if(state.marking)return;
    const n=document.querySelectorAll('.ln[data-li]').length;
    if(!n){toast('В песне нет строк текста');return}
    closeSheet();pauseBackingForHitmos();exitStage();wordClear();wordClear(state);
    Object.assign(state,{marking:true,id:song.id,audio:box.dataset.audio,player,marks:[],n,current:-1});
    document.getElementById('markbar')?.remove();lineHL(-1,'cur');lineHL(0,'next',true);
    const bar=document.createElement('div');bar.id='markbar';bar.className='markbar';
    bar.innerHTML=`<div class="mark-player"><div class="grp"><button data-act="hm-toggle" aria-label="Пауза оригинала Hitmos">${ICON.pause}</button><strong>Hitmos</strong><span class="tt" id="hm-mark-time"></span></div><input id="hm-mark-seek" type="range" min="0" max="0" step="0.05" value="0" aria-label="Перемотка оригинала Hitmos" style="width:100%;height:32px;accent-color:var(--accent)"></div><p>Разметка оригинала Hitmos. Тайминги минуса сохраняются отдельно.</p><div class="mk-btns"><button class="btn" data-act="hm-undo">Назад</button><button class="btn primary mk-main" data-act="hm-tap" id="hm-mark-main">Строка 1 из ${n}</button><button class="btn" data-act="hm-done">Готово</button></div><button class="link2" data-act="hm-cancel">Отменить разметку Hitmos</button>`;
    document.body.append(bar);renderTools();update();
    player.currentTime=0;player.play().then(follow).catch(()=>{update();toast('Нажмите ▶ в панели разметки Hitmos')});
  }
  function tap(){
    if(!state.marking||!state.player)return;
    if(state.player.paused){toast('Включите оригинал перед отметкой строки');return}
    const time=Math.round(state.player.currentTime*100)/100,last=state.marks.at(-1);
    if(last!=null&&time<last){toast('После перемотки назад нажмите «Назад» для исправления нужной строки');return}
    state.marks.push(time);
    if(state.marks.length>=state.n){finish(true);return}
    lineHL(state.marks.length,'next',true);update();
  }
  function undo(){
    if(!state.marking||!state.marks.length)return;
    state.marks.pop();state.player.currentTime=Math.max(0,(state.marks.at(-1)||0)-.5);
    lineHL(state.marks.length,'next',true);update();
  }
  async function finish(save){
    if(!state.marking)return;
    const {id,audio,marks}=state;const result=marks.slice();
    state.marking=false;state.player?.pause();cancelAnimationFrame(state.raf);state.raf=0;
    document.getElementById('markbar')?.remove();lineHL(-1,'next');
    if(S.view==='song')renderTools();
    if(!save||!result.length)return;
    try{
      const now=Date.now();await store.patch(id,{hitmosMarks:result,hitmosMarksAudio:audio,hitmosMarksAt:now,hitmosTimingSource:'hitmos',hitmosTimingSourceAt:now,updatedAt:now});
      refreshTimingPickers(findSong(id));
      const button=document.querySelector('[data-act="hm-start"]');if(button&&S.cur===id)button.textContent='Разметить строки Hitmos заново';
      toast('Разметка Hitmos сохранена: '+result.length+' '+plural(result.length,'строка','строки','строк'));
    }catch(e){saveErr(e)}
  }
  function close(){if(state.marking)finish(true);cancelAnimationFrame(state.raf);state.raf=0;state.current=-1;wordClear(state);lineHL(-1,'cur')}
  function refresh(){if(state.marking)return;wordClear(state);state.current=-1;if(state.player?.isConnected)follow()}
  document.addEventListener('pointerdown',e=>{
    if(e.button>0||!e.target.closest?.('[data-act="hm-tap"]'))return;
    tap();e.preventDefault();
  });
  document.addEventListener('click',e=>{
    const action=e.target.closest?.('[data-act]')?.dataset.act;
    if(action==='hm-start')start();
    else if(action==='hm-tap'&&e.detail===0)tap();
    else if(action==='hm-undo')undo();
    else if(action==='hm-done')finish(true);
    else if(action==='hm-cancel')finish(false);
    else if(action==='hm-toggle'&&state.player){if(state.player.paused)state.player.play().then(follow).catch(()=>toast('Не удалось запустить Hitmos'));else state.player.pause()}
  });
  document.addEventListener('input',e=>{if(e.target.id==='hm-mark-seek'&&state.marking){state.player.currentTime=+e.target.value;update()}});
  return {bind,start,close,finish,refresh,get marking(){return state.marking}};
})();
