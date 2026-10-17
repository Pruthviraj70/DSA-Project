import {describe,it,expect} from 'vitest';
import {modules,initialInput,validate,registry} from './registry';
import {parseValues} from './Laboratory';
describe('released module contract',()=>{
 it('binds fourteen unique stable modules with complete learning content',()=>{
  expect(registry.registryVersion).toBe(1);expect(modules).toHaveLength(14);expect(new Set(modules.map(m=>m.id)).size).toBe(14);
  for(const m of modules){expect(m.version).toBe('1.0.0');expect(m.objectives.length).toBeGreaterThan(0);expect(m.example.length).toBeGreaterThan(15);expect(m.invariant.length).toBeGreaterThan(15);expect(m.operations.length).toBeGreaterThan(0);expect(m.question.correct).toBeLessThan(m.question.options.length);expect(validate(initialInput(m)),m.id).toBeUndefined();for(const pre of m.prerequisites)expect(modules.some(m=>m.id===pre)).toBe(true);}
 });
 it('rejects unsorted binary search, negative Dijkstra edges and invalid graph IDs',()=>{
  expect(validate({...initialInput(modules[2]),values:[2,1]})).toContain('sorted');
  expect(validate({...initialInput(modules[13]),edges:[{from:0,to:1,weight:-1}]})).toContain('nonnegative');
  expect(validate({...initialInput(modules[10]),values:[1,1]})).toContain('unique');
 });
 it('enforces limits and avoids sharing mutable defaults',()=>{
  const x=initialInput(modules[0]);x.values.push(9);expect(modules[0].defaultInput.values).toHaveLength(3);
  expect(validate({...x,values:Array(33).fill(0)})).toContain('32');expect(validate({...x,values:[1.2]})).toContain('integers');
 });
 it('parses empty, signed and duplicate inputs but rejects empty comma entries',()=>{
  expect(parseValues('')).toEqual([]);expect(parseValues('-1,2,2')).toEqual([-1,2,2]);expect(()=>parseValues('1,,2')).toThrow('empty');
 });
});
