import React,{useState,useRef} from 'react';
import {createRoot} from 'react-dom/client';
import {EngineClient} from './engine-client';
import type {EngineEvent} from './protocol';
function App(){
 const [state,setState]=useState<EngineEvent>();const [error,setError]=useState('');const client=useRef<EngineClient>(null);
 async function run(){client.current?.close();const c=new EngineClient();client.current=c;try{setState(await c.init({module:1,op:3,values:[3,1,4],arg:9,index:1,directed:false,edges:[]}));}catch(e){setError(String(e));}}
 return <main><h1>DSA Learning Lab</h1><button onClick={run}>Initialize C array</button><button onClick={async()=>{try{setState((await client.current!.advance()).events[0]);}catch(e){setError(String(e));}}}>Step</button><p role="alert">{error}</p><svg role="img" aria-label="Array state" viewBox="0 0 600 100">{state?.data.map((v,i)=><g key={i} transform={`translate(${i*70},10)`}><rect width="60" height="60" fill="#dfefea"/><text x="25" y="35">{v}</text></g>)}</svg><pre data-testid="engine-state">{JSON.stringify(state)}</pre></main>;
}
createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
