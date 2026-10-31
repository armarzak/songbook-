/* An original SVG fretboard driven by alphaTab's score/player, without audio recognition. */
(function(){
  'use strict';
  const NS='http://www.w3.org/2000/svg',names=['C','C♯','D','D♯','E','F','F♯','G','G♯','A','A♯','B'];
  const pitch=n=>names[((n%12)+12)%12];
  const svg=(tag,attrs,parent,text)=>{const e=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,String(v));if(text!==undefined)e.textContent=text;parent.appendChild(e);return e};
  class Fretboard{
    constructor(api,host){
      this.api=api;this.host=host;this.track=0;this.last=[];this.cleanups=[];this.left=lsGet('sb.gp.left')==='1';
      host.innerHTML='<div class="fc-neck-top"><b>Гриф</b><span class="fc-neck-tuning"></span><button class="btn fc-neck-hand" type="button" aria-pressed="false">Левша</button><button class="btn fc-neck-hide" type="button" aria-expanded="true">Скрыть</button></div><div class="fc-neck-scroll"></div><p class="fc-neck-status" aria-live="off">Ноты выбранной дорожки</p>';
      this.board=host.querySelector('.fc-neck-scroll');this.status=host.querySelector('.fc-neck-status');
      this.hand=host.querySelector('.fc-neck-hand');this.hand.setAttribute('aria-pressed',String(this.left));
      this.hand.onclick=()=>{this.left=!this.left;lsSet('sb.gp.left',this.left?'1':'0');this.hand.setAttribute('aria-pressed',String(this.left));this.render();this.update(this.last)};
      host.querySelector('.fc-neck-hide').onclick=e=>{const hidden=!this.board.hidden;this.board.hidden=hidden;this.status.hidden=hidden;e.target.textContent=hidden?'Показать':'Скрыть';e.target.setAttribute('aria-expanded',String(!hidden))};
      this.listen(api.scoreLoaded,()=>this.select(0));
      this.listen(api.activeBeatsChanged,args=>{this.last=args.activeBeats||[];this.update(this.last)});
      this.listen(api.playerStateChanged,e=>{if(e.stopped){this.last=[];this.update([])}});
      this.listen(api.playerFinished,()=>{this.last=[];this.update([])});
      this.listen(api.beatMouseDown,beat=>{this.last=[beat];this.update(this.last)});
      this.listen(api.noteMouseDown,note=>{this.last=[note.beat];this.update(this.last)});
      this.listen(api.playerPositionChanged,e=>{
        // Cursor events handle playback; tick lookup also refreshes stopped seeks/rewinds.
        if(api.playerState!==1&&api.tickCache){const lookup=api.tickCache.findBeat(new Set([this.track]),e.currentTick),b=lookup?.beat||lookup?.currentBeat;this.last=lookup?.beatLookup?.highlightedBeats?.map(item=>item.beat)||(b?[b]:[]);this.update(this.last)}
      });
      if(api.score)this.select(0);
    }
    listen(event,fn){if(event?.on){event.on(fn);this.cleanups.push(()=>event.off(fn))}}
    select(index){
      this.track=Number(index)||0;const track=this.api.score?.tracks[this.track];
      this.staff=track?.staves.find(s=>!s.isPercussion&&s.tuning?.length);
      this.last=[];this.render();this.update([]);
    }
    render(){
      this.board.replaceChildren();this.dots=new Map();
      const tuning=this.staff?.tuning;
      if(!tuning?.length){this.host.querySelector('.fc-neck-tuning').textContent='';this.status.textContent='Для этой дорожки нет струнного грифа';return}
      const count=tuning.length,frets=24,width=1120,height=34+count*21,pad=42,step=(width-pad-18)/(frets+1),x=f=>this.left?width-(pad+f*step):pad+f*step;
      this.host.querySelector('.fc-neck-tuning').textContent=tuning.slice().reverse().map(pitch).join(' · ')+(this.staff.capo?` · капо ${this.staff.capo}`:'');
      const view=svg('svg',{viewBox:`0 0 ${width} ${height}`,role:'img','aria-label':'Гриф: открытая струна и лады от 1 до 24'},this.board);
      svg('rect',{x:0,y:16,width,height:height-28,rx:8,fill:'#30241e'},view);
      for(let f=0;f<=frets;f++){
        const xx=x(f);
        svg('line',{x1:xx,y1:17,x2:xx,y2:height-12,stroke:f===0?'#f2dfba':'#9e9185','stroke-width':f===0?4:1},view);
        svg('text',{x:f===0?x(0)-step/2*(this.left?-1:1):x(f)-step/2*(this.left?-1:1),y:11,'text-anchor':'middle',fill:'#a6a6a6','font-size':11},view,String(f));
      }
      for(const f of [3,5,7,9,12,15,17,19,21,24]){
        const xx=x(f)-step/2*(this.left?-1:1),ys=f%12===0?[height*0.38,height*0.68]:[height*0.53];
        for(const y of ys)svg('circle',{cx:xx,cy:y,r:3,fill:'#b7a58f',opacity:0.55},view);
      }
      for(let row=0;row<count;row++){
        const y=27+row*21,string=count-row;
        svg('line',{x1:17,y1:y,x2:width-17,y2:y,stroke:'#d4cbc2','stroke-width':0.65+row*0.18},view);
        for(let fret=0;fret<=frets;fret++){
          const xx=fret===0?x(0)-step/2*(this.left?-1:1):x(fret)-step/2*(this.left?-1:1);
          const g=svg('g',{visibility:'hidden'},view);
          svg('circle',{cx:xx,cy:y,r:8.8,fill:'#ffb648',stroke:'#ffdf8e','stroke-width':1.2},g);
          svg('text',{x:xx,y:y+3.5,'text-anchor':'middle','font-size':10,'font-weight':700,fill:'#20170b'},g,String(fret));
          this.dots.set(`${string}:${fret}`,g);
        }
      }
    }
    update(beats){
      if(!this.staff)return;
      const active=new Set(),labels=[];
      for(const beat of beats){
        if(beat.voice?.bar?.staff!==this.staff||beat.isRest)continue;
        for(const n of beat.notes||[]){
          if(n.string<1||n.fret<0||n.isDead)continue;
          const key=`${n.string}:${n.fret}`;active.add(key);
          labels.push(`${pitch(Number.isFinite(n.realValue)?n.realValue:this.staff.tuning[this.staff.tuning.length-n.string]+n.fret)} · ${this.staff.tuning.length+1-n.string} стр., ${n.fret===0?'открытая':n.fret+' лад'}`);
        }
      }
      for(const [key,dot] of this.dots)dot.setAttribute('visibility',active.has(key)?'visible':'hidden');
      this.status.textContent=labels.length?labels.join('   /   '):'Ноты выбранной дорожки';
      const first=this.dots.get(active.values().next().value);
      if(first&&!this.board.hidden){const r=first.getBoundingClientRect(),p=this.board.getBoundingClientRect();if(r.left<p.left+12||r.right>p.right-12)this.board.scrollLeft+=r.left-p.left-p.width/2}
    }
    destroy(){for(const fn of this.cleanups)fn();this.cleanups=[];this.host.replaceChildren()}
  }
  window.FCFretboard=Fretboard;
})();
