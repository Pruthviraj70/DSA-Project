export interface Input { module:number; op:number; values:number[]; arg:number; index:number; directed:boolean; edges:{from:number;to:number;weight:number}[] }
export interface EngineEvent {
 protocol:1; seq:number;kind:string;loc:string;a:number;b:number;value:number;done:boolean;found:number;data:number[];
 nodes:{id:number;value:number;next:number;left:number;right:number}[];root:number;head:number;
 edges:{id:number;from:number;to:number;weight:number}[];dist:(number|null)[];frontier:number[];
 counters:Record<string,number>;
}
export type Request = {id:number;type:'init';input:Input}|{id:number;type:'advance';limit:number};
export interface Reply {id:number;events:EngineEvent[];done:boolean;error?:string}
export interface Wasm {ccall:(name:string,returnType:string|null,argTypes:string[],args:number[])=>number|string;UTF8ToString:(pointer:number)=>string}
