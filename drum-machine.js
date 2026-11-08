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
  const defaults={enabled:false,section:'verse',intensity:55,complexity:45,fills:35,humanize:25,swing:0,kit:'acoustic',reverb:15,delay:0};
  function settings(v={}){v=v&&typeof v==='object'?v:{};const o={...defaults,...v};o.enabled=v.enabled===true;o.kit=['acoustic','studio','electronic'].includes(o.kit)?o.kit:'acoustic';o.section=['intro','verse','chorus'].includes(o.section)?o.section:'verse';for(const k of ['intensity','complexity','fills','humanize','swing','reverb','delay'])o[k]=Number.isFinite(+o[k])?Math.max(0,Math.min(100,+o[k])):defaults[k];return o}
  function random(bar,step,salt){let n=Math.imul(bar+1,73856093)^Math.imul(step+1,19349663)^Math.imul(salt+1,83492791);n=Math.imul(n^(n>>>16),2246822507);return (n>>>0)/4294967296}
  // Original generator: preserve a groove's anchors and vary the surrounding performance.
  function performanceHits(id,step,bar,options={},forcedFill=false){
    const o=settings(options),p=pattern(id),length=p.beats*p.division;
    if(!o.enabled)return hits(id,step).map(h=>({...h,offset:0}));
    const section=o.section==='intro'?.65:o.section==='chorus'?1.2:1;
    const complexity=Math.min(1,o.complexity/100*section),level=(.4+o.intensity/100*.7)*section;
    let out=hits(id,step).filter(h=>!(h.kind==='hat'&&step%p.division!==0&&complexity<.25));
    if(step%p.division!==0&&random(bar,step,1)<complexity*.28&&!out.some(h=>h.kind==='snare'||h.kind==='rim'||h.kind==='clap'||h.kind==='ghost'))out.push({kind:'ghost',velocity:.18});
    if(id!=='reggae'&&step%p.division===p.division-1&&random(bar,step,2)<complexity*.22&&!out.some(h=>h.kind==='kick'))out.push({kind:'kick',velocity:.5});
    const fill=forcedFill||(bar%4===3&&random(bar,0,3)<o.fills/100);
    if(fill&&step>=length-p.division){out=out.filter(h=>h.kind!=='hat'&&h.kind!=='open'&&h.kind!=='ghost');if(step%2===0||complexity>.6)out.push({kind:step<length-Math.ceil(p.division/2)?'snare':'tom',velocity:.55+random(bar,step,6)*.2})}
    if(bar>0&&bar%4===0&&step===0&&o.section==='chorus')out.push({kind:'open',velocity:.55});
    return out.map((h,i)=>({...h,velocity:Math.max(.08,Math.min(1,h.velocity*level*(1+(random(bar,step,10+i)-.5)*o.humanize/180))),offset:Math.max(0,(random(bar,step,20+i)-.5)*o.humanize/100*.018)}));
  }
  function liveStepSeconds(bpm,id,step,options={}){const o=settings(options),p=pattern(id),base=stepSeconds(bpm,id);return base*(1+(o.enabled&&p.division%2===0?(step%2===0?1:-1)*o.swing/100*.5:0))}
  const states=new WeakMap(),active=new Set(),liveStates=new Set();
  function state(ctx,destination){
    let s=states.get(ctx);if(s&&s.destination===destination)return s;
    const noise=ctx.createBuffer(1,Math.ceil(ctx.sampleRate),ctx.sampleRate),data=noise.getChannelData(0);let seed=1729;
    for(let i=0;i<data.length;i++){seed=(1664525*seed+1013904223)>>>0;data[i]=(seed/4294967296)*2-1}
    const bus=ctx.createGain(),compressor=ctx.createDynamicsCompressor();bus.gain.value=.65;compressor.threshold.value=-12;compressor.knee.value=12;compressor.ratio.value=5;compressor.attack.value=.003;compressor.release.value=.12;bus.connect(compressor);
    const dry=ctx.createGain(),verb=ctx.createConvolver(),wet=ctx.createGain(),delay=ctx.createDelay(2),echo=ctx.createGain(),feedback=ctx.createGain();
    const impulse=ctx.createBuffer(2,Math.ceil(ctx.sampleRate*1.6),ctx.sampleRate);
    for(let ch=0;ch<2;ch++){const a=impulse.getChannelData(ch);for(let i=0;i<a.length;i++)a[i]=(data[(i+ch*271)%data.length])*Math.pow(1-i/a.length,3)}
    verb.buffer=impulse;feedback.gain.value=.24;
    compressor.connect(dry);dry.connect(destination);compressor.connect(verb);verb.connect(wet);wet.connect(destination);compressor.connect(delay);delay.connect(echo);echo.connect(destination);delay.connect(feedback);feedback.connect(delay);
    wet.gain.value=0;echo.gain.value=0;
    s={noise,bus,destination,ctx,kit:'acoustic',dry,wet,delay,echo,nodes:[bus,compressor,dry,verb,wet,delay,echo,feedback]};states.set(ctx,s);liveStates.add(s);return s;
  }
  function voice(ctx,s,kind,t,velocity){
    const gain=ctx.createGain();gain.connect(s.bus);velocity*=s.kit==='studio'?.88:1;
    function attach(source,end){active.add(source);source.onended=()=>{active.delete(source);source.disconnect();gain.disconnect()};source.connect(gain);source.start(t);source.stop(end)}
    if(kind==='kick'||kind==='rim'||kind==='tom'){
      const osc=ctx.createOscillator();osc.type=kind==='kick'?'sine':'triangle';osc.frequency.setValueAtTime(kind==='kick'?(s.kit==='electronic'?180:130):kind==='tom'?220:1150,t);osc.frequency.exponentialRampToValueAtTime(kind==='kick'?45:kind==='tom'?75:460,t+(kind==='kick'||kind==='tom'?.12:.025));
      const duration=kind==='kick'||kind==='tom'?(s.kit==='electronic'?.44:s.kit==='studio'?.18:.28):.055;gain.gain.setValueAtTime(.0001,t);gain.gain.exponentialRampToValueAtTime(velocity*(kind==='kick'?1.05:kind==='tom'?.65:.3),t+.002);gain.gain.exponentialRampToValueAtTime(.0001,t+duration);attach(osc,t+duration+.01);return;
    }
    const source=ctx.createBufferSource(),filter=ctx.createBiquadFilter();source.buffer=s.noise;filter.type='highpass';filter.frequency.value=kind==='hat'||kind==='open'?6800:kind==='clap'?1400:900;source.connect(filter);filter.connect(gain);
    const duration=(kind==='open'?.22:kind==='hat'?.045:kind==='clap'?.13:.16)*(s.kit==='studio'?.65:s.kit==='electronic'?1.25:1);
    gain.gain.setValueAtTime(.0001,t);gain.gain.exponentialRampToValueAtTime(Math.max(.0002,velocity*(kind==='hat'||kind==='open'?.26:.55)),t+.001);
    if(kind==='clap'){gain.gain.setValueAtTime(.04,t+.012);gain.gain.setValueAtTime(velocity*.55,t+.018);gain.gain.setValueAtTime(.04,t+.028);gain.gain.setValueAtTime(velocity*.5,t+.035)}
    gain.gain.exponentialRampToValueAtTime(.0001,t+duration);
    active.add(source);source.onended=()=>{active.delete(source);source.disconnect();filter.disconnect();gain.disconnect()};source.start(t);source.stop(t+duration+.01);
    if(kind==='snare'||kind==='ghost'){
      const osc=ctx.createOscillator(),body=ctx.createGain();osc.type='triangle';osc.frequency.setValueAtTime(190,t);osc.frequency.exponentialRampToValueAtTime(115,t+.1);body.gain.setValueAtTime(velocity*.22,t);body.gain.exponentialRampToValueAtTime(.0001,t+.13);osc.connect(body);body.connect(s.bus);active.add(osc);osc.onended=()=>{active.delete(osc);osc.disconnect();body.disconnect()};osc.start(t);osc.stop(t+.14);
    }
  }
  function play(ctx,destination,id,step,time,volume=.7,options={},bar=0,forcedFill=false){const s=state(ctx,destination),o=settings(options);s.kit=o.kit;s.wet.gain.setTargetAtTime(o.reverb/100*.65,ctx.currentTime,.03);s.echo.gain.setTargetAtTime(o.delay/100*.55,ctx.currentTime,.03);s.delay.delayTime.setTargetAtTime(Math.min(1.8,60/(options.bpm||120)*.75),ctx.currentTime,.03);s.bus.gain.setValueAtTime(Math.max(0,Math.min(1,volume))*.65,ctx.currentTime);for(const hit of performanceHits(id,step,bar,options,forcedFill))voice(ctx,s,hit.kind,Math.max(ctx.currentTime,time+hit.offset),hit.velocity)}
  function volume(ctx,value){const s=states.get(ctx);if(s)s.bus.gain.setTargetAtTime(Math.max(0,Math.min(1,value))*.65,ctx.currentTime,.02)}
  function stop(){for(const node of active){try{node.stop()}catch{}}active.clear();for(const s of liveStates){for(const node of s.nodes)try{node.disconnect()}catch{}states.delete(s.ctx)}liveStates.clear()}
  const api={settings,performanceHits,liveStepSeconds,patterns,pattern,hits,stepSeconds,play,volume,stop};root.FireDrums=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
