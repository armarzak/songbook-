/* Local audio tempo analysis; shared by the browser, worker and verification scripts. */
(function(root){
  'use strict';
  const valid=n=>Number.isFinite(n)&&n>=30&&n<=240;
  const ascii=(b,a,n)=>String.fromCharCode(...b.subarray(a,a+n));
  const sync=b=>b.reduce((n,v)=>n*128+(v&127),0);
  function text(b){
    if(!b.length)return '';
    let enc=['iso-8859-1','utf-16','utf-16be','utf-8'][b[0]];
    try{return new TextDecoder(enc||'utf-8').decode(b.subarray(1)).replace(/\0/g,' ').trim()}catch{return ''}
  }
  function metadata(buffer){
    const b=new Uint8Array(buffer),v=new DataView(buffer);
    if(ascii(b,0,3)==='ID3'&&[2,3,4].includes(b[3])){
      const version=b[3],end=Math.min(b.length,10+sync(b.subarray(6,10)));
      // Compressed, unsynchronised and extended tags are left to audio analysis.
      if(b[5]&0xe0)return null;
      for(let i=10,steps=0;i+(version===2?6:10)<=end&&steps++<1000;){
        const width=version===2?3:4,head=version===2?6:10,key=ascii(b,i,width);
        if(!/^[A-Z0-9]+$/.test(key))break;
        const size=version===2?(b[i+3]*65536+b[i+4]*256+b[i+5]):version===4?sync(b.subarray(i+4,i+8)):v.getUint32(i+4);
        if(!size||i+head+size>end)break;
        const flags=version===2?0:v.getUint16(i+8);
        if(!flags&&['TBPM','TBP','TXXX','TXX'].includes(key)){
          const s=text(b.subarray(i+head,i+head+size));
          const raw=key==='TXXX'||key==='TXX'?s.match(/^(?:BPM|TEMPO)\s+(\d+(?:[.,]\d+)?)$/i)?.[1]:s;
          const bpm=Number(String(raw||'').replace(',','.'));
          if(valid(bpm))return {bpm:Math.round(bpm),source:'metadata',confidence:1};
        }
        i+=head+size;
      }
    }
    // MPEG-4/iTunes integer tmpo: moov/udta/meta/ilst/tmpo/data.
    function boxes(start,end,depth){
      if(depth>6)return null;
      for(let p=start,count=0;p+8<=end&&count++<10000;){
        const size=v.getUint32(p),type=ascii(b,p+4,4);
        if(size<8||p+size>end)break;
        if(type==='tmpo'){
          for(let q=p+8;q+18<=p+size;){
            const n=v.getUint32(q);if(n<18||q+n>p+size)break;
            if(ascii(b,q+4,4)==='data'){const bpm=v.getUint16(q+n-2);if(valid(bpm))return {bpm,source:'metadata',confidence:1}}
            q+=n;
          }
        }
        if(['moov','udta','meta','ilst'].includes(type)){
          const r=boxes(p+8+(type==='meta'?4:0),p+size,depth+1);if(r)return r;
        }
        p+=size;
      }
      return null;
    }
    return b.length>=8?boxes(0,b.length,0):null;
  }
  function estimate(samples,rate){
    const hop=Math.max(1,Math.round(rate/100)),fps=rate/hop,n=Math.floor(samples.length/hop);
    if(n<800)return null;
    const env=new Float32Array(n),a=1-Math.exp(-2*Math.PI*180/rate),z=1-Math.exp(-2*Math.PI*1600/rate);
    let low=0,mid=0,prev=[0,0,0],peak=0,total=0;
    for(let i=0;i<n;i++){
      const energy=[0,0,0];
      for(let j=i*hop;j<(i+1)*hop;j++){
        const x=samples[j];low+=a*(x-low);mid+=z*(x-mid);
        energy[0]+=low*low;energy[1]+=(mid-low)**2;energy[2]+=(x-mid)**2;total+=x*x;
      }
      let onset=0;
      for(let k=0;k<3;k++){const e=Math.log1p(1000*energy[k]/hop);onset+=Math.max(0,e-prev[k]);prev[k]=e}
      env[i]=onset;peak=Math.max(peak,onset);
    }
    if(peak<0.001||total/samples.length<1e-8)return null;
    // Smooth sub-frame jitter so fast beats do not collapse to every third pulse.
    const raw=env.slice();for(let i=1;i<n-1;i++)env[i]=(raw[i-1]+2*raw[i]+raw[i+1])/4;
    const length=Math.min(n,Math.round(20*fps)),windows=Math.min(7,Math.max(1,Math.floor(n/length))),votes=[];
    for(let w=0;w<windows;w++){
      const start=windows===1?0:Math.floor(w*(n-length)/(windows-1));
      let mean=0;for(let i=0;i<length;i++)mean+=env[start+i];mean/=length;
      const x=new Float32Array(length);let norm=0;
      for(let i=0;i<length;i++){x[i]=Math.max(0,env[start+i]-mean);norm+=x[i]*x[i]}
      if(norm<0.0001)continue;
      const corr=lag=>{
        let sum=0,p=0,q=0;const end=length-Math.ceil(lag)-1;
        for(let i=0;i<end;i++){const j=i+lag,k=Math.floor(j),y=x[k]*(1-j+k)+x[k+1]*(j-k);sum+=x[i]*y;p+=x[i]*x[i];q+=y*y}
        return sum/Math.sqrt(p*q||1);
      };
      const candidates=[];
      for(let bpm=45;bpm<=220;bpm+=0.5){
        const lag=fps*60/bpm,base=corr(lag),score=(base+0.25*corr(lag*2)+0.1*corr(lag*3)-0.25*corr(lag/2)-0.25*corr(lag/3))*Math.exp(-0.035*Math.log2(bpm/110)**2);
        candidates.push({bpm,score,base});
      }
      candidates.sort((a,b)=>b.score-a.score);
      if(candidates[0].base>=0.12)votes.push(candidates[0]);
    }
    if(!votes.length)return null;
    let winner=votes[0],support=0;
    for(const v of votes){let s=0;for(const other of votes)if(Math.abs(Math.log2(other.bpm/v.bpm))<0.045)s+=other.score;if(s>support){support=s;winner=v}}
    const matches=votes.filter(v=>Math.abs(Math.log2(v.bpm/winner.bpm))<0.045);
    const bpm=Math.round(matches.reduce((n,v)=>n+v.bpm*v.score,0)/matches.reduce((n,v)=>n+v.score,0));
    const confidence=Math.min(1,matches.length/windows)*Math.min(1,matches.reduce((n,v)=>n+v.base,0)/matches.length/0.6);
    return {bpm,source:'audio',confidence:Math.round(confidence*100)/100,alternatives:[bpm/2,bpm*2].filter(valid).map(Math.round),windows:votes.length};
  }
  const api={metadata,estimate};root.FCTempo=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof self!=='undefined'?self:globalThis);
