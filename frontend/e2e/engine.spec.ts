import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
const fixtures=JSON.parse(readFileSync('../.build/engine-fixtures.json','utf8'));
test('all 34 operations match native C traces through actual browser WebAssembly',async({page})=>{
 await page.goto('/');
 const results=await page.evaluate(async(fixtures)=>{
  // Runtime import uses the same public client class as the application.
  const {EngineClient}=await import(/* @vite-ignore */ '/src/engine-client.ts');
  const results=[];
  for(const f of fixtures){const c=new EngineClient();try{
   const events=[await c.init(f.input)];let done=false;
   while(!done){const r=await c.advance(32);events.push(...r.events);done=r.done;if(events.length>4096)throw Error('Unbounded events');}
   results.push(events);
  }finally{c.close();}}
  return results;
 },fixtures);
 const source=await (await page.request.get('/engine/source.json')).json();
 for(let i=0;i<fixtures.length;i++){
  expect(results[i],fixtures[i].id).toEqual(fixtures[i].trace);
  for(const event of results[i])expect(source.locations[event.loc],`source location ${event.loc}`).toBeGreaterThan(0);
 }
});
test('worker reset is deterministic, batches are bounded and cancellation rejects pending work',async({page})=>{
 await page.goto('/');
 const result=await page.evaluate(async(input)=>{
  const {EngineClient}=await import(/* @vite-ignore */ '/src/engine-client.ts');
  const c=new EngineClient();const first=await c.init(input);const batch=await c.advance(99999);c.close();
  const second=new EngineClient();const reset=await second.init(input);second.close();
  const cancelled=new EngineClient();const pending=cancelled.init(input);cancelled.close();
  let rejected=false;try{await pending;}catch{rejected=true;}
  return {first,reset,length:batch.events.length,rejected};
 },fixtures.find((f:any)=>f.id==='quick-sort').input);
 expect(result.first).toEqual(result.reset);expect(result.length).toBeLessThanOrEqual(32);expect(result.rejected).toBe(true);
});
