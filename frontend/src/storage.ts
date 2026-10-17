import type {Input} from './protocol';
export interface Checkpoint {key:string;owner:string;moduleId:string;completion:number}
export interface LocalExperiment {id:string;owner:string;title:string;moduleId:string;input:Input;configuration:{speed:number};engineVersion:string;createdAt:string}
let database:Promise<IDBDatabase>|undefined;
function db(){return database??=new Promise<IDBDatabase>((resolve,reject)=>{const request=indexedDB.open('dsa-learning-lab',1);request.onupgradeneeded=()=>{request.result.createObjectStore('checkpoints',{keyPath:'key'});request.result.createObjectStore('experiments',{keyPath:'id'});};request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});}
async function transact<T>(store:string,mode:IDBTransactionMode,operation:(s:IDBObjectStore)=>IDBRequest<T>):Promise<T>{
 const database=await db();return new Promise((resolve,reject)=>{const transaction=database.transaction(store,mode);const r=operation(transaction.objectStore(store));let result:T;r.onsuccess=()=>{result=r.result;};transaction.oncomplete=()=>resolve(result);transaction.onerror=()=>reject(transaction.error);transaction.onabort=()=>reject(transaction.error??Error('Local storage transaction aborted'));});
}
export const storage={
 checkpoints:()=>transact<Checkpoint[]>('checkpoints','readonly',s=>s.getAll()),
 async checkpoint(owner:string,moduleId:string,completion:number){const all=await this.checkpoints();const key=`${owner}:${moduleId}`;const previous=all.find(x=>x.key===key);return transact('checkpoints','readwrite',s=>s.put({key,owner,moduleId,completion:Math.max(previous?.completion??0,completion)}));},
 async acknowledge(key:string,completion:number){const database=await db();return new Promise<void>((resolve,reject)=>{const transaction=database.transaction('checkpoints','readwrite');const store=transaction.objectStore('checkpoints');const request=store.get(key);request.onsuccess=()=>{if(request.result&&request.result.completion<=completion)store.delete(key);};transaction.oncomplete=()=>resolve();transaction.onerror=()=>reject(transaction.error);});},
 experiments:()=>transact<LocalExperiment[]>('experiments','readonly',s=>s.getAll()),
 saveExperiment:(x:LocalExperiment)=>transact('experiments','readwrite',s=>s.put(x)),
 removeExperiment:(id:string)=>transact('experiments','readwrite',s=>s.delete(id))
};
