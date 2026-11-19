/* Browser-only Google Drive audio sync. Access tokens never enter persistent storage. */
window.FCDrive=(()=>{
 const CLIENT_ID='179004700108-7k24hntra35o7m47nr2r3b6rjjis5206.apps.googleusercontent.com';
 const SCOPE='https://www.googleapis.com/auth/drive.file';
 let token='',expires=0,loading=null,running=false,files=[],folder='',status='Подключите тот же Google-аккаунт на компьютере и телефоне.';
 const valid=()=>!!token&&Date.now()<expires;
 function note(text){status=text;const el=document.getElementById('drive-status');if(el)el.textContent=text}
 function identity(){if(window.google?.accounts?.oauth2)return Promise.resolve();if(loading)return loading;loading=new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='https://accounts.google.com/gsi/client';script.onload=resolve;script.onerror=()=>{loading=null;script.remove();reject(Error('Не удалось загрузить вход Google. Проверьте интернет.'))};document.head.append(script)});return loading}
 async function api(path,options={}){
  if(!valid())throw Error('Войдите в Google Диск заново');
  const headers=new Headers(options.headers);headers.set('Authorization','Bearer '+token);
  const r=await fetch(path.startsWith('https://www.googleapis.com/')?path:'https://www.googleapis.com/drive/v3/'+path,{...options,headers});
  if(r.status===401){token='';expires=0;throw Error('Вход Google истёк. Подключите Диск заново.')}
  if(!r.ok){let message='';try{message=(await r.json()).error?.message||''}catch{}throw Error('Google Диск: '+r.status+(message?' · '+message:''))}return r;
 }
 async function list(query){let next='',all=[];do{const params=new URLSearchParams({q:query,fields:'nextPageToken,files(id,name,size,mimeType,appProperties,modifiedTime)',pageSize:'1000',spaces:'drive'});if(next)params.set('pageToken',next);const data=await(await api('files?'+params)).json();all.push(...data.files);next=data.nextPageToken||''}while(next);return all}
 const norm=s=>String(s||'').normalize('NFKC').toLowerCase().replace(/ё/g,'е').replace(/[^\p{L}\p{N}]+/gu,' ').trim();
 async function key(song){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(norm(song.artist)+'|'+norm(song.title))))].map(x=>x.toString(16).padStart(2,'0')).join('')}
 async function refresh(){files=await list("trashed = false and appProperties has { key='firechordsAudio' and value='1' }")}
 async function ensureFolder(){if(folder)return folder;const found=await list("trashed = false and mimeType = 'application/vnd.google-apps.folder' and appProperties has { key='firechordsFolder' and value='1' }");if(found.length){folder=found[0].id;return folder}const r=await api('files?fields=id',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'FireChords — минусы',mimeType:'application/vnd.google-apps.folder',appProperties:{firechordsFolder:'1'}})});folder=(await r.json()).id;return folder}
 async function find(song){const k=await key(song);return files.filter(f=>f.appProperties?.songKey===k||f.appProperties?.songId===song.id).sort((a,b)=>String(b.modifiedTime).localeCompare(String(a.modifiedTime)))[0]}
 async function ensureLocal(song){
  if(!valid())return null;const existing=await trackGet(song.id);if(existing)return existing;
  const file=await find(song);if(!file)return null;
  if(+file.size>150*1024*1024)throw Error('Минус больше 150 МБ: '+file.name);
  const r=await api('files/'+encodeURIComponent(file.id)+'?alt=media'),buf=await r.arrayBuffer();
  if(file.size&&buf.byteLength!==+file.size)throw Error('Минус скачался не полностью: '+file.name);
  const rec={buf,name:file.name,type:file.mimeType||'audio/mpeg',size:buf.byteLength,added:Date.now()};await trackPut(song.id,rec);
  await store.patch(song.id,{track:{...song.track,name:file.name,driveId:file.id},updatedAt:Date.now()});return rec;
 }
 async function upload(song){
  const rec=await trackGet(song.id);if(!rec)return 'missing';if(await find(song))return 'exists';
  const blob=rec.blob||new Blob([rec.buf],{type:rec.type||'audio/mpeg'});if(blob.size>150*1024*1024)throw Error('Минус больше 150 МБ: '+song.title);
  const parent=await ensureFolder(),songKey=await key(song),name=rec.name||song.track?.name||song.title+'.mp3';
  const started=await api('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&fields=id,name,size,mimeType,appProperties,modifiedTime',{method:'POST',headers:{'Content-Type':'application/json','X-Upload-Content-Type':blob.type||'audio/mpeg','X-Upload-Content-Length':String(blob.size)},body:JSON.stringify({name,parents:[parent],appProperties:{firechordsAudio:'1',songKey,songId:song.id}})});
  const location=started.headers.get('Location');if(!location||!location.startsWith('https://www.googleapis.com/'))throw Error('Google не выдал адрес загрузки');
  const file=await(await api(location,{method:'PUT',headers:{'Content-Type':blob.type||'audio/mpeg'},body:blob})).json();files.push(file);
  await store.patch(song.id,{track:{...song.track,name,driveId:file.id},updatedAt:Date.now()});return 'uploaded';
 }
 async function sync(mode){
  if(running)throw Error('Синхронизация уже идёт');if(!valid())throw Error('Сначала войдите в Google Диск');
  running=true;let done=0,skipped=0,errors=0;
  try{await refresh();const songs=S.songs.filter(s=>!s.demo&&!String(s.id).startsWith('_'));for(let i=0;i<songs.length;i++){
    note((mode==='upload'?'Загрузка на Диск':'Скачивание')+': '+(i+1)+' / '+songs.length+' · '+songs[i].title);
    try{if(mode==='upload'){const result=await upload(songs[i]);if(result==='uploaded')done++;else skipped++}else{if(await trackGet(songs[i].id)){skipped++;continue}if(await ensureLocal(songs[i]))done++;else skipped++}}catch(e){errors++;note(e.message);if(!valid())throw e}
  }
  const current=S.cur&&findSong(S.cur);if(current&&S.view==='song'&&(!TR.el||TR.el.paused))await trackLoad(current);
  note((mode==='upload'?'Загружено на Диск: ':'Скачано на устройство: ')+done+'. Без изменений: '+skipped+'. Ошибок: '+errors+'.');
  }finally{running=false}
 }
 function connect(){
  if(!window.google?.accounts?.oauth2){note('Подождите загрузки входа Google и нажмите ещё раз.');identity().catch(e=>note(e.message));return}
  const client=google.accounts.oauth2.initTokenClient({client_id:CLIENT_ID,scope:SCOPE,callback:result=>{
    if(result.error){note('Вход Google: '+result.error);return}token=result.access_token;expires=Date.now()+(+result.expires_in||3600)*1000-30000;files=[];folder='';note('Google Диск подключён.');sync('download').catch(e=>note(e.message));
  },error_callback:()=>note('Вход отменён или окно входа заблокировано браузером.')});client.requestAccessToken({prompt:'select_account'});
 }
 function open(){sheet.innerHTML='<div class="panel" role="dialog" aria-label="Google Диск — минусы"><div class="panel-top"><h2 class="ptitle">Google Диск · минусы</h2><button class="btn" data-act="close">Закрыть</button></div><p>Минусы хранятся в папке «FireChords — минусы» вашего Диска и скачиваются в память устройства для игры без интернета.</p><p id="drive-status" role="status"></p><div class="actions" style="flex-wrap:wrap"><button class="btn primary" data-drive="connect">Войти и скачать недостающие</button><button class="btn" data-drive="upload">Загрузить минусы этого устройства на Диск</button><button class="btn" data-drive="download">Скачать недостающие на это устройство</button><button class="btn" data-drive="disconnect">Отключить</button></div><p class="hint">Используйте один Google-аккаунт и одинаковые названия песен и исполнителей на устройствах. Уже имеющиеся файлы не заменяются и не удаляются. После замены минуса его облачную копию пока нужно удалить вручную в папке Диска и загрузить заново. Вход Google требуется при новом сеансе; офлайн-проигрывание скачанных файлов работает без входа.</p></div>';sheet.hidden=false;note(status);identity().catch(e=>note(e.message))}
 document.addEventListener('click',e=>{const b=e.target.closest('[data-drive]');if(!b)return;const action=b.dataset.drive;if(action==='connect')connect();else if(action==='disconnect'){if(running){note('Дождитесь окончания синхронизации.');return}token='';expires=0;files=[];folder='';note('Диск отключён. Скачанные минусы остались на устройстве.')}else sync(action).catch(e=>note(e.message))});
 return {open,ensureLocal,connected:valid};
})();
