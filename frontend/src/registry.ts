import content from '../../content/modules.json';
import type {Input} from './protocol';
export const registry=content;
export type Module=typeof content.modules[number];
export const modules=content.modules;
export function initialInput(module:Module):Input {return structuredClone(module.defaultInput);}
export function validate(input:Input):string|undefined {
 const limit=input.module>=11?16:32;
 if(input.values.length>limit)return `Use at most ${limit} values.`;
 if(input.values.some(v=>!Number.isInteger(v)||Math.abs(v)>100000))return 'Use integers between -100000 and 100000.';
 if(!Number.isInteger(input.arg)||Math.abs(input.arg)>100000||!Number.isInteger(input.index))return 'Argument and index must be integers in range.';
 if(input.module===3&&input.values.some((v,i)=>i>0&&v<input.values[i-1]))return 'Binary search requires sorted ascending input.';
 if(input.module>=11&&(input.values.some(v=>v<1||v>31)||new Set(input.values).size!==input.values.length))return 'Graph node IDs must be unique integers in 1..31.';
 if(input.module===14&&input.edges.some(e=>e.weight<0))return 'Dijkstra requires nonnegative edge weights.';
}
