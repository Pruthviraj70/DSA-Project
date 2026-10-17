"""Native traces used as an independent cross-target protocol oracle in browser tests."""
import ctypes, json, pathlib, subprocess
root = pathlib.Path(__file__).resolve().parent.parent
subprocess.run(['gcc','-std=c17','-shared','-fPIC','-Iengine/include','engine/src/engine.c','-o','.build/libengine.so'],cwd=root,check=True)
lib=ctypes.CDLL(str(root/'.build/libengine.so'))
for name in ['engine_next','engine_state','engine_error']:
    getattr(lib,name).restype=ctypes.c_char_p
fixtures=[]
for module in json.loads((root/'content/modules.json').read_text())['modules']:
    for op in range(len(module['operations'])):
        x=module['defaultInput'].copy();x['op']=op
        if module['id']=='graph':
            x['arg']=9 if op==1 else 4 if op==2 else 2
            x['index']=1
        assert lib.engine_config(x['module'],op,len(x['values']),x['arg'],x['index'],int(x['directed']))
        for i,v in enumerate(x['values']): assert lib.engine_value(i,v)
        for edge in x['edges']: assert lib.engine_edge(edge['from'],edge['to'],edge['weight'])
        assert lib.engine_graph_weight(x['weight'])
        assert lib.engine_start(),lib.engine_error()
        trace=[json.loads(lib.engine_state())]
        while event:=lib.engine_next():
            state=json.loads(event)
            previous=trace[-1]
            # An independent mutation replay for the sort event contract.
            if 4<=x['module']<=6:
                expected=previous['data'].copy()
                if state['kind']=='write': expected[state['a']]=state['value']
                elif state['kind']=='swap':
                    a,b=state['a'],state['b'];expected[a],expected[b]=expected[b],expected[a]
                assert expected==state['data'],(module['id'],state)
            trace.append(state)
            assert len(trace)<=4096
        fixtures.append({'id':module['id'],'input':x,'trace':trace})
(root/'.build/engine-fixtures.json').write_text(json.dumps(fixtures))
print(f'Generated and replay-validated {len(fixtures)} native protocol traces')
