/* Original offline drum synthesis and practice grooves. No recordings or network dependencies. */
(function(root){
  'use strict';
  const patterns={
    rock:{name:'Рок',hint:'Бочка на 1 и 3, малый на 2 и 4',beats:4,division:4,kick:[0,8],snare:[4,12],hat:[0,2,4,6,8,10,12,14]},
    pop:{name:'Поп',hint:'Прямой ритм с дополнительной бочкой',beats:4,division:4,kick:[0,6,8,10],snare:[4,12],hat:[0,2,4,6,8,10,12,14]},
    blues:{name:'Блюз / шаффл',hint:'Триольное покачивание, 4/4',beats:4,division:3,kick:[0,6],snare:[3,9],hat:[0,2,3,5,6,8,9,11]},
    reggae:{name:'Регги',hint:'One drop: бочка и малый на третью долю',beats:4,division:4,kick:[8],rim:[8],hat:[0,2,4,6,8,10,12,14]},
    disco:{name:'Диско',hint:'Бочка в каждую долю, открытый хэт между ними',beats:4,division:4,kick:[0,4,8,12],clap:[4,12],hat:[0,4,8,12],open:[2,6,10,14]},
    funk:{name:'Фанк',hint:'Синкопы бочки и тихие призвуки малого',beats:4,division:4,kick:[0,3,6,10],snare:[4,12],ghost:[7,15],hat:[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15]},
    ballad:{name:'Баллада 6/8',hint:'Шесть восьмых: акценты на 1 и 4',beats:6,division:2,kick:[0],snare:[6],hat:[0,2,4,6,8,10]}
  };
  const instruments=['kick','snare','rim','clap','hat','open','ghost'];
  function pattern(id){return patterns[id]||patterns.rock}
  function hits(id,step){const p=pattern(id);return instruments.filter(k=>p[k]?.includes(step)).map(kind=>({kind,velocity:kind==='ghost'?.24:kind==='hat'?(step%p.division===0?.6:.4):.85}))}
  function stepSeconds(bpm,id){return 60/Math.max(30,Math.min(240,bpm))/pattern(id).division}
  const states=new WeakMap(),active=new Set();
  function state(ctx,destination){
    let s=states.get(ctx);if(s&&s.destination===destination)return s;
    const noise=ctx.createBuffer(1,Math.ceil(ctx.sampleRate),ctx.sampleRate),data=noise.getChannelData(0);let seed=1729;
    for(let i=0;i<data.length;i++){seed=(1664525*seed+1013904223)>>>0;data[i]=(seed/4294967296)*2-1}
    const bus=ctx.createGain(),compressor=ctx.createDynamicsCompressor();bus.gain.value=.65;compressor.threshold.value=-12;compressor.knee.value=12;compressor.ratio.value=5;compressor.attack.value=.003;compressor.release.value=.12;bus.connect(compressor);compressor.connect(destination);
    s={noise,bus,destination};states.set(ctx,s);return s;
  }
  function voice(ctx,s,kind,t,velocity){
    const gain=ctx.createGain();gain.connect(s.bus);
    function attach(source,end){active.add(source);source.onended=()=>{active.delete(source);source.disconnect();gain.disconnect()};source.connect(gain);source.start(t);source.stop(end)}
    if(kind==='kick'||kind==='rim'){
      const osc=ctx.createOscillator();osc.type=kind==='kick'?'sine':'triangle';osc.frequency.setValueAtTime(kind==='kick'?150:1150,t);osc.frequency.exponentialRampToValueAtTime(kind==='kick'?45:460,t+(kind==='kick'?.12:.025));
      const duration=kind==='kick'?.28:.055;gain.gain.setValueAtTime(.0001,t);gain.gain.exponentialRampToValueAtTime(velocity*(kind==='kick'?1.05:.3),t+.002);gain.gain.exponentialRampToValueAtTime(.0001,t+duration);attach(osc,t+duration+.01);return;
    }
    const source=ctx.createBufferSource(),filter=ctx.createBiquadFilter();source.buffer=s.noise;filter.type='highpass';filter.frequency.value=kind==='hat'||kind==='open'?6800:kind==='clap'?1400:900;source.connect(filter);filter.connect(gain);
    const duration=kind==='open'?.22:kind==='hat'?.045:kind==='clap'?.13:.16;
    gain.gain.setValueAtTime(.0001,t);gain.gain.exponentialRampToValueAtTime(Math.max(.0002,velocity*(kind==='hat'||kind==='open'?.26:.55)),t+.001);
    if(kind==='clap'){gain.gain.setValueAtTime(.04,t+.012);gain.gain.setValueAtTime(velocity*.55,t+.018);gain.gain.setValueAtTime(.04,t+.028);gain.gain.setValueAtTime(velocity*.5,t+.035)}
    gain.gain.exponentialRampToValueAtTime(.0001,t+duration);
    active.add(source);source.onended=()=>{active.delete(source);source.disconnect();filter.disconnect();gain.disconnect()};source.start(t);source.stop(t+duration+.01);
    if(kind==='snare'||kind==='ghost'){
      const osc=ctx.createOscillator(),body=ctx.createGain();osc.type='triangle';osc.frequency.setValueAtTime(190,t);osc.frequency.exponentialRampToValueAtTime(115,t+.1);body.gain.setValueAtTime(velocity*.22,t);body.gain.exponentialRampToValueAtTime(.0001,t+.13);osc.connect(body);body.connect(s.bus);active.add(osc);osc.onended=()=>{active.delete(osc);osc.disconnect();body.disconnect()};osc.start(t);osc.stop(t+.14);
    }
  }
  function play(ctx,destination,id,step,time,volume=.7){const s=state(ctx,destination);s.bus.gain.setValueAtTime(Math.max(0,Math.min(1,volume))*.65,ctx.currentTime);for(const hit of hits(id,step))voice(ctx,s,hit.kind,time,hit.velocity)}
  function volume(ctx,value){const s=states.get(ctx);if(s)s.bus.gain.setTargetAtTime(Math.max(0,Math.min(1,value))*.65,ctx.currentTime,.02)}
  function stop(){for(const node of active){try{node.stop()}catch{}}active.clear()}
  const api={patterns,pattern,hits,stepSeconds,play,volume,stop};root.FireDrums=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
