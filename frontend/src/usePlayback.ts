import {useState,useRef,useEffect,useCallback} from 'react';
import {EngineClient} from './engine-client';
import type {Input,EngineEvent} from './protocol';
export function usePlayback(onComplete?:(event:EngineEvent)=>void){
 const [history,setHistory]=useState<EngineEvent[]>([]);const [cursor,setCursor]=useState(0);const [playing,setPlaying]=useState(false);const [busy,setBusy]=useState(false);const [error,setError]=useState('');const [speed,setSpeed]=useState(350);
 const client=useRef<EngineClient|null>(null);const historyRef=useRef<EngineEvent[]>([]);const cursorRef=useRef(0);const busyRef=useRef(false);const callback=useRef(onComplete);callback.current=onComplete;
 const [prediction,setPrediction]=useState<EngineEvent|null>(null);const [feedback,setFeedback]=useState('');
 const store=useCallback((events:EngineEvent[])=>{if(historyRef.current.length+events.length>4096)throw Error('History limit reached. Reduce the input and reset.');const all=[...historyRef.current,...events];historyRef.current=all;setHistory(all);cursorRef.current=all.length-1;setCursor(all.length-1);if(events.at(-1)?.done){setPlaying(false);callback.current?.(events.at(-1)!);}},[]);
 const run=useCallback(async(input:Input)=>{
  client.current?.close();const c=new EngineClient();client.current=c;setPlaying(false);setError('');setPrediction(null);setFeedback('');setHistory([]);historyRef.current=[];cursorRef.current=0;setCursor(0);setBusy(true);busyRef.current=true;
  try{const initial=await c.init(input);if(client.current===c)store([initial]);}
  catch(error){if(client.current===c)setError((error as Error).message);}
  finally{if(client.current===c){busyRef.current=false;setBusy(false);}}
 },[store]);
 const step=useCallback(async()=>{
  if(busyRef.current||!client.current||prediction)return;
  if(cursorRef.current<historyRef.current.length-1){cursorRef.current++;setCursor(cursorRef.current);return;}
  if(historyRef.current.at(-1)?.done){setPlaying(false);return;}
  const c=client.current;busyRef.current=true;setBusy(true);
  try{const response=await c.advance(1);if(client.current===c)store(response.events);}
  catch(error){if(client.current===c){setError((error as Error).message);setPlaying(false);}}
  finally{if(client.current===c){busyRef.current=false;setBusy(false);}}
 },[prediction,store]);
 const seek=useCallback((index:number)=>{setPlaying(false);cursorRef.current=Math.max(0,Math.min(historyRef.current.length-1,index));setCursor(cursorRef.current);},[]);
 const predict=async()=>{setPlaying(false);if(busyRef.current||!client.current||historyRef.current.at(-1)?.done)return;setFeedback('');
  if(cursorRef.current<historyRef.current.length-1){setPrediction(historyRef.current[cursorRef.current+1]);return;}
  const c=client.current;busyRef.current=true;setBusy(true);try{const r=await c.advance(1);if(client.current===c)setPrediction(r.events[0]??null);}catch(e){if(client.current===c)setError((e as Error).message);}finally{if(client.current===c){busyRef.current=false;setBusy(false);}}
 };
 const answer=(kind:string)=>{if(!prediction)return;setFeedback(`${kind===prediction.kind?'Correct':'Keep exploring'}: the next event is ${prediction.kind} at ${prediction.loc}.`);
  if(prediction.seq===historyRef.current.at(-1)!.seq+1)store([prediction]);else seek(cursorRef.current+1);setPrediction(null);
 };
 useEffect(()=>{if(!playing)return;const timer=setTimeout(()=>void step(),speed);return()=>clearTimeout(timer);},[playing,step,speed,cursor,history,busy]);
 useEffect(()=>()=>{client.current?.close();client.current=null;},[]);
 const event=history[cursor];
 return {history,cursor,event,playing,setPlaying,busy,error,speed,setSpeed,run,step,seek,prediction,predict,answer,feedback,done:!!event?.done};
}
