const fs=require('fs'),vm=require('vm'),a=require('node:assert/strict');const html=fs.readFileSync(require('path').join(__dirname,'../index.html'),'utf8');const code=html.slice(html.indexOf('let raf=0,lastT=null,acc=0,wake=null,autoEndLine=null;'),html.indexOf('async function startScroll()',html.indexOf('/* ---------- autoscroll')));
let stopped=false,frame,stage=false;const SCR={scrollTop:0,scrollHeight:3000,clientHeight:800,getBoundingClientRect:()=>({bottom:800}),scrollBy(x,y){this.scrollTop+=y}};
const last={isConnected:true,textContent:'Last line',getBoundingClientRect:()=>({bottom:1800-SCR.scrollTop})};
const S={view:'song',stage:false,scroll:{on:true,speed:70}};const ctx={S,SCR,tools:{hidden:false,getBoundingClientRect:()=>({top:700})},document:{querySelectorAll:()=>[last]},stopAuto:()=>{S.scroll.on=false;stopped=true},renderTools:()=>{},requestAnimationFrame:f=>{frame=f;return 1}};
vm.createContext(ctx);vm.runInContext(code,ctx);ctx.tick(0);for(let t=100;t<=30000&&S.scroll.on;t+=100)frame(t);
a(stopped);a.equal(SCR.scrollTop,1112);a.equal(last.getBoundingClientRect().bottom,688);a(SCR.scrollTop<2200);
// Already beyond the lyric end: stop without rewinding the user's manual position.
SCR.scrollTop=1500;S.scroll.on=true;stopped=false;ctx.tick(31000);a(stopped);a.equal(SCR.scrollTop,1500);
S.stage=true;a.equal(ctx.autoScrollLimit(),2200);console.log('PASS final lyric stops above toolbar, excludes trailing panels, no rewind after manual scrolling, stage page limit preserved');
