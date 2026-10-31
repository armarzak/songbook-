/* Backing-track BPM stays in song.track.tempo, alongside portable song metadata. */
(function(){
  'use strict';
  const jobs=new Map(),states=new Map();
  const signature=r=>[r.name,r.size,r.added].join(':');
  function refresh(id){
    if(S.cur!==id)return;
    document.querySelectorAll('[data-tempo-panel]').forEach(el=>{el.innerHTML=panel(findSong(id))});
  }
  function panel(s){
    if(!s||!s.track)return '';
    const state=states.get(s.id),raw=s.track.tempo,t=raw&&Number.isFinite(raw.bpm)&&raw.bpm>=30&&raw.bpm<=240?raw:null,busy=jobs.has(s.id);
    const msg=busy?'Определяю темп минуса…':state||(!t?'Определите темп прямо из минуса — без микрофона.':'');
    return `<div class="fc-tempo"><p class="hint" role="status">${esc(msg)}</p>`+
      (t?`<p class="hint">Темп минуса: <b>${t.bpm} BPM</b> · ${t.source==='metadata'?'из файла':t.confidence>=0.65?'по аудио':'по аудио, проверьте на слух'}</p>`:'')+
      `<div class="actions"><button class="btn" data-act="t-tempo" ${busy?'disabled':''}>${t?'Проверить темп минуса':'Определить темп минуса'}</button>`+
      (t?`<button class="btn" data-act="t-tempo-use" data-factor="1">Применить ${t.bpm} BPM</button>`+
      [0.5,2].filter(k=>t.bpm*k>=30&&t.bpm*k<=240).map(k=>`<button class="btn" data-act="t-tempo-use" data-factor="${k}">${k===2?'×2':'÷2'} · ${Math.round(t.bpm*k)}</button>`).join(''):'')+'</div></div>';
  }
  async function analyze(id){
    if(jobs.has(id))return jobs.get(id);
    const task=run(id);jobs.set(id,task);refresh(id);
    try{await task}finally{jobs.delete(id);refresh(id)}
  }
  async function run(id){
    let worker=null;
    try{
      const song=findSong(id),rec=await trackGet(id);if(!song?.track)return;if(!rec){states.set(id,'Минус не загружен на это устройство. Сначала выберите или скачайте файл.');return}
      const sig=signature(rec),buffer=rec.buf?rec.buf.slice(0):await rec.blob.arrayBuffer();
      states.delete(id);
      let result=FCTempo.metadata(buffer);
      if(!result){
        if(!window.Worker)throw new Error('Автоопределение недоступно в этом браузере. Темп можно задать вручную.');
        const Context=window.OfflineAudioContext||window.webkitOfflineAudioContext;
        if(!Context)throw new Error('Этот браузер не умеет анализировать аудиофайл.');
        const context=new Context(1,1,8000);
        const audio=await context.decodeAudioData(buffer);
        // Limit the working signal to five minutes, preserving intro and main sections.
        const count=Math.min(audio.length,audio.sampleRate*300),samples=new Float32Array(count);
        for(let channel=0;channel<audio.numberOfChannels;channel++){
          const data=audio.getChannelData(channel);
          for(let i=0;i<count;i++)samples[i]+=data[i]/audio.numberOfChannels;
        }
        result=await new Promise((ok,no)=>{
          worker=new Worker('tempo-worker.js');
          const timer=setTimeout(()=>{worker.terminate();no(new Error('Анализ занял слишком много времени. Попробуйте ещё раз.'))},30000);
          worker.onmessage=e=>{clearTimeout(timer);e.data.error?no(new Error(e.data.error)):ok(e.data.result)};
          worker.onerror=()=>{clearTimeout(timer);no(new Error('Не загрузился анализатор. Откройте приложение с интернетом и повторите.'))};
          worker.postMessage({samples,rate:audio.sampleRate},[samples.buffer]);
        });
      }
      if(!result){states.set(id,'Устойчивый темп не найден. Задайте BPM вручную или используйте «Тап».');return}
      // Import, replacement, deletion and manual BPM edits may finish while analysis runs.
      const current=findSong(id),latest=await trackGet(id);
      if(!current?.track||!latest||signature(latest)!==sig||current.track.name!==rec.name)return;
      const tempo={...result,analyzedAt:Date.now(),version:1};
      const patch={track:{...current.track,tempo},updatedAt:Date.now()};
      const pendingManual=S.cur===id&&M.bpm!==Number(current.bpm||100);
      const autoApply=!Number(current.bpm)&&!pendingManual&&(result.source==='metadata'||result.confidence>=0.65);
      if(autoApply)patch.bpm=result.bpm;
      await store.patch(id,patch);
      if(autoApply&&S.cur===id){metroLoad(findSong(id));renderTools()}
      states.set(id,autoApply?'Темп определён и сохранён.':`Найдено ${result.bpm} BPM. ${current.bpm?'Заданный темп песни сохранён.':'Проверьте и примените результат.'}`);
      if(S.cur===id)toast(`Темп минуса: ${result.bpm} BPM${autoApply?' — сохранён':''}`);
    }catch(e){states.set(id,e.message||'Не получилось определить темп. Можно задать его вручную.')}
    finally{if(worker)worker.terminate()}
  }
  async function apply(id,factor){
    const song=findSong(id),bpm=Math.round(song?.track?.tempo?.bpm*factor);
    if(!Number.isFinite(bpm)||bpm<30||bpm>240)return;
    try{
      await store.patch(id,{bpm,updatedAt:Date.now()});
      if(S.cur===id){metroLoad(findSong(id));renderTools();if(!sheet.hidden&&document.getElementById('m-num'))openMetro()}
      states.set(id,`Сохранён темп песни: ${bpm} BPM.`);refresh(id);toast(`Темп песни: ${bpm} BPM`);
    }catch(e){saveErr(e)}
  }
  document.addEventListener('click',e=>{
    const b=e.target.closest('[data-act]');if(!b)return;
    if(b.dataset.act==='t-tempo')void analyze(S.cur);
    if(b.dataset.act==='t-tempo-use')void apply(S.cur,Number(b.dataset.factor));
  });
  window.FCBackingTempo={analyze,html:s=>s?.track?`<div data-tempo-panel>${panel(s)}</div>`:''};
})();
