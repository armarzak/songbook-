import {pipeline,env} from './vendor/transformers-2.17.2.min.js';
import './ai-align.js';
env.allowLocalModels=false;
env.useBrowserCache=true;
env.backends.onnx.wasm.numThreads=1;
env.backends.onnx.wasm.wasmPaths='https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2/dist/';
let transcriber;
self.onmessage=async e=>{
 const {samples,rows,language}=e.data;
 try{
  if(!transcriber)transcriber=await pipeline('automatic-speech-recognition','Xenova/whisper-tiny',{quantized:true,progress_callback:p=>self.postMessage({type:'progress',text:p.status==='progress'?'Загрузка модели: '+Math.round(p.progress||0)+'%':'Подготовка модели…'})});
  self.postMessage({type:'progress',text:'Распознаю аудио в браузере…'});
  const options={return_timestamps:'word',chunk_length_s:30,stride_length_s:5,task:'transcribe'};
  if(language!=='auto')options.language=language;
  const result=await transcriber(samples,options);
  let alignment=null,warning='';try{alignment=self.FCAIAlign.align(rows,result.chunks)}catch(e){warning=e.message}
  self.postMessage({type:'result',text:result.text,chunks:result.chunks,alignment,warning});
 }catch(e){self.postMessage({type:'error',text:e.message||String(e)})}
};
