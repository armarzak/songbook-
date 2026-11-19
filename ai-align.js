/* Conservative token alignment: unmatched lyrics get no fabricated timestamps. */
(function(root){
 const normalize=s=>String(s||'').normalize('NFKC').toLowerCase().replace(/ё/g,'е').replace(/[^\p{L}\p{N}]+/gu,'');
 function align(rows,chunks){
  const expected=[],heard=[];
  rows.forEach(row=>String(row.text||'').split(/\s+/).filter(Boolean).forEach((word,index)=>{const token=normalize(word);if(token)expected.push({token,li:row.li,index})}));
  for(const c of chunks||[]){const start=c.timestamp?.[0];if(!Number.isFinite(start)||start<0)continue;for(const word of String(c.text||'').split(/\s+/)){const token=normalize(word);if(token)heard.push({token,time:start})}}
  const n=expected.length,m=heard.length;if(!n||!m)throw Error('Нет распознанных слов для сопоставления');if((n+1)*(m+1)>8000000)throw Error('Слишком длинный текст: выберите более короткий файл');
  const width=m+1,dp=new Uint16Array((n+1)*width);
  for(let i=1;i<=n;i++)for(let j=1;j<=m;j++)dp[i*width+j]=expected[i-1].token===heard[j-1].token?dp[(i-1)*width+j-1]+1:Math.max(dp[(i-1)*width+j],dp[i*width+j-1]);
  const matched=new Map();let i=n,j=m;while(i&&j){if(expected[i-1].token===heard[j-1].token){matched.set(i-1,heard[j-1].time);i--;j--}else if(dp[(i-1)*width+j]>=dp[i*width+j-1])i--;else j--}
  const marks=[],wmarks=[],coverage=[];
  for(const row of rows){const indices=[];expected.forEach((v,k)=>{if(v.li===row.li)indices.push(k)});const found=indices.filter(k=>matched.has(k)),ratio=indices.length?found.length/indices.length:0;coverage[row.li]=ratio;
    marks[row.li]=null;wmarks[row.li]=null;
    if(found.length&&ratio>=.6&&expected[found[0]].index===0){marks[row.li]=matched.get(found[0]);if(found.length===indices.length)wmarks[row.li]=indices.map(k=>matched.get(k))}
  }
  return {marks,wmarks,coverage};
 }
 root.FCAIAlign={align};
})(typeof window==='undefined'?globalThis:window);
