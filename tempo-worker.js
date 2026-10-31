'use strict';
importScripts('tempo-core.js');
self.onmessage=e=>{
  try{self.postMessage({result:self.FCTempo.estimate(e.data.samples,e.data.rate)})}
  catch{self.postMessage({error:'Не получилось проанализировать аудио.'})}
};
