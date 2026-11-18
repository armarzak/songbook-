/* Party Mode: QR signaling + WebRTC data only, on a shared local network. */
window.FCParty = (() => {
  const peers = new Map(), transient = new Map(), originalFind = findSong;
  findSong = id => transient.get(id) || originalFind(id);
  const timing = {cur:-1, marks:[], wordMarks:null};
  let role='', guest=null, received=null, current=null, lastLine=-2, frame=0;
  let qrFrames=[], qrIndex=0, qrTimer=0, stream=null, scanTimer=0, scanBusy=false, uiEpoch=0;
  let outputPeer=null, outputKind='', messageCounter=0, busy=false;
  let scanParts=FCPProtocol.collector();
  let cameraAssist=false;const handshakeStreams=new Set();
  const badge=document.createElement('button');
  badge.className='party-badge';badge.hidden=true;badge.addEventListener('click',open);
  document.body.append(badge);

  const activePeers=()=>[...peers.values()].filter(p=>p.dc?.readyState==='open');
  const isGuest=()=>role==='guest';
  const say=text=>{const el=document.getElementById('party-note');if(el)el.textContent=text;else toast(text)};
  function diagnostics(){
    const describe=pc=>{
      const counts=sdp=>{const lines=(sdp||'').split('\n').filter(l=>l.startsWith('a=candidate:'));return {total:lines.length,mdns:lines.filter(l=>l.includes('.local')).length,udp:lines.filter(l=>/ udp /i.test(l)).length}};
      return {connection:pc.connectionState,ice:pc.iceConnectionState,signaling:pc.signalingState,local:counts(pc.localDescription?.sdp),remote:counts(pc.remoteDescription?.sdp)};
    };
    return {role:role||'none',cameraAssist,visibility:document.visibilityState,participants:activePeers().length,receivedAgoMs:received?Math.round(performance.now()-received.at):null,hasSong:!!current,markedLines:timing.marks.filter(v=>v!=null).length,peers:[...peers.values()].map(p=>({...describe(p.pc),channel:p.dc?.readyState||'none',rttMs:p.rtt?Math.round(p.rtt):null}))};
  }
  function updateStatus(){
    const connected=guest?.dc?.readyState==='open';
    const stale=received&&performance.now()-received.at>2200;
    const text=role==='host'?`Party · ведущий · участников: ${activePeers().length}`:
      connected?(stale?'Party · ждём ведущего':'Party · участник'):'Party · нет соединения';
    badge.hidden=!role;badge.textContent=text;
    document.body.classList.toggle('party-guest',isGuest());
    const el=document.getElementById('party-status');if(el)el.textContent=role?text:'Party не запущен';
    const debug=document.getElementById('party-diagnostics');if(debug)debug.textContent=JSON.stringify(diagnostics(),null,2);
    for(const p of peers.values()){
      const row=document.querySelector(`[data-peer-status="${p.id}"]`);
      if(row)row.textContent=p.dc?.readyState==='open'?'Подключён':p.pc.connectionState==='failed'?'Ошибка связи':'Ожидание соединения';
    }
  }
  function stopScanner(){
    clearTimeout(scanTimer);scanTimer=0;
    stream?.getTracks().forEach(t=>t.stop());stream=null;
  }
  function closeUI(){uiEpoch++;for(const s of handshakeStreams)s.getTracks().forEach(t=>t.stop());handshakeStreams.clear();stopScanner();clearInterval(qrTimer);qrTimer=0}
  function stop(){
    closeUI();cancelAnimationFrame(frame);frame=0;
    for(const p of peers.values()){clearTimeout(p.waitTimer);p.pc.close()}
    peers.clear();role='';guest=null;received=null;current=null;qrFrames=[];outputPeer=null;
    wordClear(timing);lineHL(-1,'cur');
    if(transient.has(S.cur)){S.cur=null;transient.clear();renderList()}else transient.clear();
    updateStatus();
  }
  function send(p,msg){
    if(p.dc?.readyState!=='open')return false;
    if(p.dc.bufferedAmount>2000000)return false;
    try{p.dc.send(JSON.stringify(msg));return true}catch{return false}
  }
  function songPacket(){
    if(S.view!=='song')return null;
    const s=findSong(S.cur);if(!s||s.demo)return null;
    // The active original is supported online; an offline party needs a local backing file.
    const backing=TR.el, hm=document.querySelector('#hitmosbox audio');
    const audio=backing&&!backing.paused?backing:hm&&!hm.paused?hm:backing||hm;
    const source=audio===hm?'hitmos':'backing';
    const tm=playbackTiming(s,source,document.getElementById('hitmosbox')?.dataset.audio);
    const song={id:s.id,title:s.title,artist:s.artist,body:s.body,capo:s.capo,bpm:s.bpm,beats:s.beats};
    const text=JSON.stringify({song,marks:tm.marks,words:tm.wmarks});
    return {text,key:text,time:Number.isFinite(audio?.currentTime)?audio.currentTime:0,
      duration:Number.isFinite(audio?.duration)?audio.duration:0,playing:!!audio&&!audio.paused&&!audio.ended,
      rate:audio?.playbackRate||1,scroll:SCR.scrollTop/Math.max(1,SCR.scrollHeight-SCR.clientHeight)};
  }
  function broadcast(only){
    const packet=songPacket();if(!packet){for(const p of activePeers())send(p,{type:'idle'});return;}
    for(const p of only?[only]:activePeers()){
      if(p.songKey!==packet.key){
        if(packet.text.length>700000){say('Песня слишком большая для Party');continue}
        if(p.dc.bufferedAmount>300000)continue;
        const id=++messageCounter;
        if(!send(p,{type:'song-begin',id,size:packet.text.length}))continue;
        let ok=true;
        for(let n=0;n<packet.text.length;n+=8000)ok=send(p,{type:'song-part',id,text:packet.text.slice(n,n+8000)})&&ok;
        ok=send(p,{type:'song-end',id})&&ok;if(!ok)continue;
        p.songKey=packet.key;
      }
      send(p,{type:'state',time:packet.time,duration:packet.duration,playing:packet.playing,rate:packet.rate,scroll:packet.scroll});
    }
  }
  function finiteMarks(a){return Array.isArray(a)&&a.length<=20000?a.map(v=>Number.isFinite(v)&&v>=0?v:null):[]}
  function receiveSong(data){
    const s=data?.song;
    if(!s||typeof s.title!=='string'||typeof s.artist!=='string'||typeof s.body!=='string'||s.body.length>600000)throw Error('Некорректная песня Party');
    const local=S.songs.find(x=>x.id===s.id&&x.body===s.body)||S.songs.find(x=>x.title===s.title&&x.artist===s.artist&&x.body===s.body);
    wordClear(timing);lastLine=-2;
    timing.marks=finiteMarks(data.marks);
    timing.wordMarks=Array.isArray(data.words)?data.words.map(v=>finiteMarks(v)):null;
    // Use the participant's own song when it matches. A different version stays temporary.
    transient.clear();
    current=local||{...s,id:'_party_remote',demo:true};
    if(!local)transient.set(current.id,current);
    trackStop();metroStop();countInStop();stopAuto();closeHitmos();
    renderSong(current.id);
    TR.el?.pause();
    toast(timing.marks.some(x=>x!=null)?'Party: текст синхронизирован с ведущим':'Party: без разметки повторяем прокрутку ведущего');
  }
  function follow(){
    cancelAnimationFrame(frame);frame=0;if(!isGuest())return;
    frame=requestAnimationFrame(follow);
    if(!received||!current||S.view!=='song'||S.cur!==current.id)return;
    const age=performance.now()-received.at;
    if(age>2200)return; // Freeze instead of running ahead after a dropped connection.
    const t=received.time+(received.playing?age/1000*received.rate:0);
    if(timing.marks.some(x=>x!=null)){
      let line=-1;timing.marks.forEach((m,i)=>{if(m!=null&&m<=t+.05)line=i});
      if(line!==lastLine||(line>=0&&!liEl(line)?.classList.contains('cur'))){lineHL(line,'cur',true);lastLine=line}
      timing.cur=line;wordFollow(t,timing);
    }else if(sheet.hidden){
      const y=received.scroll*Math.max(0,SCR.scrollHeight-SCR.clientHeight);
      if(Math.abs(SCR.scrollTop-y)>12)SCR.scrollTo({top:y,behavior:'smooth'});
    }
  }
  function onMessage(p,e){
    try{
      if(typeof e.data!=='string'||e.data.length>40000)return;
      const m=JSON.parse(e.data);
      if(m.type==='ping'){send(p,{type:'pong',at:m.at});return}
      if(m.type==='pong'){if(Number.isFinite(m.at))p.rtt=Math.max(0,Math.min(1000,performance.now()-m.at));return}
      if(!isGuest()||p!==guest)return;
      if(m.type==='idle'){received=null;return}
      if(m.type==='song-begin'&&Number.isInteger(m.size)&&m.size>0&&m.size<=700000)p.incoming={id:m.id,size:m.size,text:''};
      else if(m.type==='song-part'&&p.incoming?.id===m.id&&typeof m.text==='string'){
        p.incoming.text+=m.text;if(p.incoming.text.length>p.incoming.size)p.incoming=null;
      }else if(m.type==='song-end'&&p.incoming?.id===m.id){
        const data=p.incoming;p.incoming=null;if(data.text.length===data.size)receiveSong(JSON.parse(data.text));
      }else if(m.type==='state'&&Number.isFinite(m.time)&&Number.isFinite(m.rate)){
        received={time:Math.max(0,m.time)+(m.playing?(p.rtt||0)/2000:0),rate:Math.max(.1,Math.min(4,m.rate)),
          playing:m.playing===true,scroll:Math.max(0,Math.min(1,+m.scroll||0)),at:performance.now()};
        if(!frame)follow();
      }
    }catch{say('Не удалось принять данные Party. Подключитесь заново.')}
  }
  function bindChannel(p,dc){
    p.dc=dc;dc.onmessage=e=>onMessage(p,e);
    dc.onopen=()=>{
      clearTimeout(p.waitTimer);p.songKey=null;updateStatus();
      say(role==='host'?'Участник подключён. Можно пригласить следующего.':'Подключено. Закройте окно — песней управляет ведущий.');
      if(role==='host')broadcast(p);else follow();
    };
    dc.onclose=()=>{if(isGuest())received=null;updateStatus()};
    dc.onerror=()=>say('Сбой локальной связи Party');
  }
  function createPeer(id){
    const pc=new RTCPeerConnection({iceServers:[]}),p={id,pc};peers.set(id,p);
    pc.ondatachannel=e=>bindChannel(p,e.channel);
    pc.onconnectionstatechange=()=>{updateStatus();if(pc.connectionState==='failed')say('Нет локальной связи. Проверьте, что оба телефона в одной сети. Точка доступа может запрещать связь между устройствами.')};
    return p;
  }
  async function description(pc){
    if(pc.iceGatheringState!=='complete')await new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>{cleanup();reject(Error('Не удалось подготовить адреса подключения'))},12000);
      const changed=()=>{if(pc.iceGatheringState==='complete'){cleanup();resolve()}};
      function cleanup(){clearTimeout(timer);pc.removeEventListener('icegatheringstatechange',changed)}
      pc.addEventListener('icegatheringstatechange',changed);changed();
    });
    if(!pc.localDescription.sdp.includes('a=candidate:'))throw Error('Браузер не предоставил локальный адрес. Проверьте разрешения локальной сети.');
    return pc.localDescription.toJSON();
  }
  function supported(){
    if(!window.RTCPeerConnection||!window.CompressionStream||!window.DecompressionStream)throw Error('Для Party нужен современный Safari или Chrome');
  }
  async function prepareDescription(pc,make){
    const epoch=uiEpoch;let media=null;
    try{
      if(cameraAssist){
        if(!navigator.mediaDevices?.getUserMedia)throw Error('Камера недоступна в этом браузере');
        try{media=await navigator.mediaDevices.getUserMedia({video:true,audio:false})}catch{throw Error('Для проверки разрешите камеру или отключите помощь для точки доступа')}
        handshakeStreams.add(media);
      }
      if(epoch!==uiEpoch)throw Error('Подключение отменено');
      await pc.setLocalDescription(await make());
      const result=await description(pc);
      if(epoch!==uiEpoch)throw Error('Подключение отменено');
      return result;
    }finally{if(media){media.getTracks().forEach(t=>t.stop());handshakeStreams.delete(media)}}
  }
  async function invite(){
    supported();if(isGuest())throw Error('Сначала выйдите из текущей Party');
    for(const p of peers.values())if(p.dc?.readyState!=='open'){p.pc.close();clearTimeout(p.waitTimer);peers.delete(p.id)}
    if(activePeers().length>=8)throw Error('В этой версии можно подключить до 8 участников');
    role='host';updateStatus();const p=createPeer(crypto.randomUUID());
    try{
      bindChannel(p,p.pc.createDataChannel('firechords-party'));
      const local=await prepareDescription(p.pc,()=>p.pc.createOffer());
      qrFrames=await FCPProtocol.encode({app:'FireChordsParty',version:1,id:p.id,description:local});
      outputPeer=p.id;outputKind='offer';qrIndex=0;open();
    }catch(e){p.pc.close();peers.delete(p.id);throw e}
  }
  async function accept(value){
    supported();
    if(value.description.type==='answer'){
      const p=peers.get(value.id);
      if(role!=='host'||!p||p.pc.signalingState!=='have-local-offer')throw Error('Этот ответ не относится к ожидаемому приглашению');
      await p.pc.setRemoteDescription(value.description);qrFrames=[];outputPeer=null;
      p.waitTimer=setTimeout(()=>{if(p.dc?.readyState!=='open')say('Соединение не установлено. Проверьте точку доступа и повторите подключение.')},18000);
      open();say('Ответ принят. Устанавливаем локальную связь…');return;
    }
    if(role)throw Error('Сначала выйдите из текущей Party, чтобы подключиться к другому ведущему');
    role='guest';updateStatus();guest=createPeer(value.id);
    try{
      trackStop();metroStop();FireAlbumShelf.stop();stopAuto();closeHitmos();
      await guest.pc.setRemoteDescription(value.description);
      const local=await prepareDescription(guest.pc,()=>guest.pc.createAnswer());
      qrFrames=await FCPProtocol.encode({app:'FireChordsParty',version:1,id:value.id,description:local});
      outputKind='answer';outputPeer=value.id;qrIndex=0;open();
    }catch(e){stop();throw e}
  }
  function drawQR(){
    const el=document.getElementById('party-qr');if(!el||!qrFrames.length)return;
    const qr=qrcode(0,'M');qr.addData(qrFrames[qrIndex]);qr.make();
    el.innerHTML=qr.createSvgTag({cellSize:4,margin:16,scalable:true});
    document.getElementById('party-qr-page').textContent=`QR ${qrIndex+1} из ${qrFrames.length}`;
  }
  async function acceptFrame(text){
    const result=await scanParts.add(text);
    say(`Считано частей: ${result.count} из ${result.total}. Держите камеру перед QR.`);
    if(result.value){stopScanner();scanParts.reset();await accept(result.value)}
  }
  async function scan(){
    supported();stopScanner();scanParts.reset();
    const epoch=uiEpoch,video=document.getElementById('party-video');
    if(!video)return;
    video.hidden=false;
    try{
      const media=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'},width:{ideal:960}},audio:false});
      if(epoch!==uiEpoch||!video.isConnected||sheet.hidden){media.getTracks().forEach(t=>t.stop());return}
      stream=media;video.srcObject=media;await video.play();
      const canvas=document.createElement('canvas'),context=canvas.getContext('2d',{willReadFrequently:true});
      const tick=async()=>{
        if(!stream||epoch!==uiEpoch||!video.isConnected)return;
        if(video.readyState>=2&&!scanBusy){
          const scale=Math.min(1,900/video.videoWidth);canvas.width=Math.round(video.videoWidth*scale);canvas.height=Math.round(video.videoHeight*scale);
          context.drawImage(video,0,0,canvas.width,canvas.height);
          const image=context.getImageData(0,0,canvas.width,canvas.height),code=jsQR(image.data,image.width,image.height,{inversionAttempts:'dontInvert'});
          if(code?.data.startsWith('FCP1|')){scanBusy=true;try{await acceptFrame(code.data)}catch(e){say(e.message)}finally{scanBusy=false}}
        }
        if(stream&&epoch===uiEpoch)scanTimer=setTimeout(tick,140);
      };
      say('Наведите камеру на QR. Если частей несколько, дождитесь полного считывания.');tick();
    }catch(e){stopScanner();video.hidden=true;throw Error(e.name==='NotAllowedError'?'Разрешите камеру в настройках Safari. Также можно загрузить снимок QR.':'Камера недоступна. Попробуйте загрузить снимок QR.')}
  }
  async function scanImage(file){
    if(!file||file.size>20000000)throw Error('Выберите изображение QR размером до 20 МБ');
    const url=URL.createObjectURL(file),image=new Image();
    try{image.src=url;await image.decode();const scale=Math.min(1,1800/image.width),canvas=document.createElement('canvas');
      canvas.width=Math.round(image.width*scale);canvas.height=Math.round(image.height*scale);const c=canvas.getContext('2d');c.drawImage(image,0,0,canvas.width,canvas.height);
      const data=c.getImageData(0,0,canvas.width,canvas.height),qr=jsQR(data.data,data.width,data.height);
      if(!qr)throw Error('QR не найден на изображении');await acceptFrame(qr.data);
    }finally{URL.revokeObjectURL(url)}
  }
  function open(){
    closeUI();const hasQR=qrFrames.length>0;
    sheet.innerHTML=`<div class="panel party-panel" role="dialog" aria-label="FireChords Party"><div class="panel-top"><h2 class="ptitle">FireChords Party</h2><button class="btn" data-act="close">Закрыть</button></div>
      <p id="party-status" role="status"></p><p class="hint">Тестовый режим без интернета. Все телефоны подключите к точке доступа ведущего. FireChords, песни и минус сохраните заранее. Звук играет только у ведущего.</p>
      ${hasQR?`<h3>${outputKind==='offer'?'Приглашение участнику':'Ответ ведущему'}</h3><p>${outputKind==='offer'?'Участник: откройте Party → «Сканировать QR» и наведите камеру сюда. Затем ведущий сканирует ответ участника.':'Покажите этот QR ведущему: он нажимает «Сканировать QR» на своём телефоне.'}</p><div id="party-qr" class="party-qr"></div><div class="party-qr-nav"><button class="btn" data-party="prev" aria-label="Предыдущая часть QR">←</button><span id="party-qr-page"></span><button class="btn" data-party="next" aria-label="Следующая часть QR">→</button></div><p class="hint">Части QR меняются автоматически. Для одного участника — одно приглашение.</p>`:''}
      <label class="party-assist"><input id="party-camera-assist" type="checkbox" ${cameraAssist?'checked':''}> Помощь для точки доступа iPhone</label><p class="hint">Кратко включает камеру при подготовке QR, чтобы проверить доступ Safari к локальным адресам. Изображение не записывается и не передаётся. Включите на обоих телефонах перед новым подключением.</p><div class="actions">${!isGuest()?'<button class="btn primary" data-party="invite">'+(role?'Пригласить следующего':'Я ведущий · создать Party')+'</button>':''}<button class="btn" data-party="scan">Сканировать QR</button></div>
      <video id="party-video" autoplay muted playsinline hidden></video><label class="btn party-upload">Загрузить снимок QR<input id="party-image" type="file" accept="image/*" hidden></label>
      <p id="party-note" role="status">${role==='guest'?'После подключения закройте окно. Режим гитара / книга / караоке и размер текста каждый выбирает сам.':'Ведущий выбирает песню и запускает свой минус. Участники видят текст и аккорды.'}</p>
      <details><summary>Диагностика связи</summary><pre id="party-diagnostics" style="white-space:pre-wrap;font-size:12px"></pre></details>${role?'<button class="btn" data-party="stop">Выйти из Party</button>':''}<p class="hint">При потере связи текст остановится. Подключитесь заново через QR. Ведущий держит приложение открытым. Совместимость точки доступа iPhone пока требует проверки на двух телефонах.</p>
      </div>`;
    sheet.hidden=false;updateStatus();
    if(hasQR){drawQR();if(qrFrames.length>1)qrTimer=setInterval(()=>{qrIndex=(qrIndex+1)%qrFrames.length;drawQR()},1400)}
  }
  async function action(name){
    if(name==='next'||name==='prev'){if(qrFrames.length){clearInterval(qrTimer);qrIndex=(qrIndex+(name==='next'?1:qrFrames.length-1))%qrFrames.length;drawQR()}return}
    if(name==='scan')return scan();
    if(name==='stop'){stop();open();return}
    if(name==='invite'){if(busy)return;busy=true;say('Готовлю приглашение…');try{await invite()}finally{busy=false}}
  }
  document.addEventListener('click',e=>{const b=e.target.closest('[data-party]');if(b)action(b.dataset.party).catch(e=>say(e.message))});
  document.addEventListener('change',e=>{if(e.target.id==='party-camera-assist'){cameraAssist=e.target.checked;updateStatus()}if(e.target.id==='party-image'){const file=e.target.files[0];e.target.value='';scanImage(file).catch(e=>say(e.message))}});
  // The participant keeps display settings but never starts a second sound source.
  const forbidden=new Set(['t-play','v-play','v-reset','hitmos-play','edit','tr','t-mark','hm-start','hm-resume','scroll','metro','drums-open','ci-toggle','drum-pad','pads-groove','drummer-fill','drum-section']);
  document.addEventListener('click',e=>{const a=e.target.closest('[data-act]')?.dataset.act;if(isGuest()&&forbidden.has(a)){e.preventDefault();e.stopImmediatePropagation();toast('В Party музыкой управляет ведущий')}},true);
  document.addEventListener('play',e=>{if(isGuest()&&e.target instanceof HTMLMediaElement)e.target.pause()},true);
  new MutationObserver(()=>{if(sheet.hidden||!document.getElementById('party-video'))closeUI()}).observe(sheet,{childList:true,attributes:true,attributeFilter:['hidden']});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stopScanner();else if(isGuest()&&!frame)follow()});
  setInterval(()=>{if(role==='host')broadcast();updateStatus()},250);
  setInterval(()=>{for(const p of activePeers())send(p,{type:'ping',at:performance.now()})},2000);
  return {open,stop,isGuest,diagnostics};
})();
