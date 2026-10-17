"""Native snapshots plus independent mutation replay, consumed by actual browser Wasm checks."""
import ctypes,json,pathlib,subprocess
root=pathlib.Path(__file__).resolve().parent.parent
subprocess.run(['gcc','-std=c17','-shared','-fPIC','-Iengine/include','engine/src/engine.c','-o','.build/libengine.so'],cwd=root,check=True)
lib=ctypes.CDLL(str(root/'.build/libengine.so'))
for name in ['engine_next','engine_state','engine_error']:getattr(lib,name).restype=ctypes.c_char_p
inputs=[]
for module in json.loads((root/'content/modules.json').read_text())['modules']:
 for op in range(len(module['operations'])):
  x=module['defaultInput'].copy();x['op']=op
  if module['id']=='graph':x['arg']=9 if op==1 else 4 if op==2 else 2;x['index']=1
  inputs.append((module['id'],x))
def edge(name,module,op,values,arg=0,index=0):inputs.append((name,dict(module=module,op=op,values=values,arg=arg,index=index,directed=False,weight=1,edges=[])))
edge('probe-tombstone-route',16,5,[0,10,8,20,16,30],8,16)
edge('probe-negative-rehash',16,4,[-1,9,7,4,15,6],0)
edge('chain-growth',15,2,[v for i in range(16) for v in (i*8-64,i)],999,7)
edge('factorial-safe-maximum',18,0,[],12)
edge('fibonacci-bounded-tree',18,3,[],10)
edge('recursive-empty-search',18,2,[],9)
edge('unique-empty',19,2,[])
edge('unique-equal',19,2,[5]*32)
edge('pair-wide-sum',19,0,[-100000,100000],0)
edge('fixed-all-negative',20,0,[-5,-2,-8],index=2)
edge('variable-zero-prefix',20,1,[0,0,5],5)
edge('variable-no-solution',20,1,[],7)
fixtures=[]
for id,x in inputs:
 assert lib.engine_config(x['module'],x['op'],len(x['values']),x['arg'],x['index'],int(x['directed']))
 for i,v in enumerate(x['values']):assert lib.engine_value(i,v)
 for item in x['edges']:assert lib.engine_edge(item['from'],item['to'],item['weight'])
 assert lib.engine_graph_weight(x['weight'])
 assert lib.engine_start(),lib.engine_error()
 trace=[json.loads(lib.engine_state())]
 while event:=lib.engine_next():
  state=json.loads(event);previous=trace[-1]
  if 4<=x['module']<=6 or x['module'] in [17,19]:
   expected=previous['data'].copy()
   if state['kind']=='write':expected[state['a']]=state['value']
   elif state['kind']=='swap':
    a,b=state['a'],state['b'];expected[a],expected[b]=expected[b],expected[a]
   elif state['kind']=='insert':expected.append(state['value'])
   elif state['kind']=='delete':
    tail=expected.pop()
    if expected:expected[0]=tail
   assert expected==state['data'],(id,state)
  if x['module']==18:
   before=len(previous['extended']['frames']);after=len(state['extended']['frames'])
   assert after-before=={'call':1,'return':-1}.get(state['kind'],0)
  trace.append(state);assert len(trace)<=4096
 assert not lib.engine_error(),lib.engine_error()
 assert trace[-1]['done']
 fixtures.append(dict(id=id,input=x,trace=trace))
(root/'.build/engine-fixtures.json').write_text(json.dumps(fixtures))
print(f'Generated and replay-validated {len(fixtures)} native protocol traces')
