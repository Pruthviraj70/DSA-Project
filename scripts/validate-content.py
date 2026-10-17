"""Reject invalid curriculum dependencies, concepts, quiz ordering and question coverage."""
import json,pathlib,sys
ROOT=pathlib.Path(__file__).resolve().parent.parent
def validate(curriculum,banks):
    modules={m['id']:m for m in curriculum['modules']}
    if len(modules)!=len(curriculum['modules']):raise ValueError('Duplicate module ID')
    concepts={c['id'] for c in curriculum['concepts']}
    if len(concepts)!=len(curriculum['concepts']):raise ValueError('Duplicate concept ID')
    closure={}
    def ancestors(id,path=()):
        if id not in modules:raise ValueError(f'Unknown prerequisite: {id}')
        if id in path:raise ValueError(f'Cyclic prerequisites: {path+(id,)}')
        if id not in closure:
            closure[id]=set()
            for p in modules[id]['prerequisites']:closure[id]|={p}|ancestors(p,path+(id,))
        return closure[id]
    # Detect cycles without allowing an unfinished closure to short-circuit recursion.
    def cycles(id,path=()):
        if id not in modules:raise ValueError(f'Unknown prerequisite: {id}')
        if id in path:raise ValueError('Cyclic prerequisites')
        for p in modules[id]['prerequisites']:cycles(p,path+(id,))
    for id in modules:cycles(id);ancestors(id)
    taught={}
    for id,m in modules.items():
        slides=m['slides'];ids=[s['id'] for s in slides]
        if len(set(ids))!=len(ids):raise ValueError(f'Duplicate slide ID: {id}')
        if len(slides)<3 or slides[-1]['kind']!='quiz' or slides[-2]['kind']!='faq':raise ValueError(f'FAQ must immediately precede final quiz: {id}')
        if sum(s['kind']=='quiz' for s in slides)!=1:raise ValueError(f'Exactly one final quiz required: {id}')
        taught[id]=set()
        for s in slides:
            unknown=set(s['teaches'])-concepts
            if unknown:raise ValueError(f'Unknown taught concept: {unknown}')
            if s['kind']!='quiz':taught[id].update(s['teaches'])
            if s['kind'] not in ('quiz','faq') and not s['paragraphs']:raise ValueError(f'Empty teaching slide: {id}/{s["id"]}')
    question_ids=set()
    for bank in banks:
        if set(bank)!=set(modules):raise ValueError('Question bank must cover exactly the catalog modules')
        for id,questions in bank.items():
            available=taught[id].union(*(taught[p] for p in closure[id]))
            if not questions:raise ValueError(f'Empty quiz: {id}')
            for q in questions:
                if q['id'] in question_ids:raise ValueError('Duplicate question ID')
                question_ids.add(q['id'])
                if not q['concepts'] or set(q['concepts'])-concepts:raise ValueError('Unknown question concept')
                if set(q['concepts'])-available:raise ValueError(f'Untaught/outside prerequisite closure: {id}/{q["id"]}')
                if not 0<=q['correctIndex']<len(q['options']) or len(set(q['options']))!=len(q['options']):raise ValueError('Invalid answer options')
                if not q['explanation'].strip():raise ValueError('Missing feedback')
    for alias,target in curriculum['aliases'].items():
        if target['moduleId'] not in modules or target['slideId'] not in [s['id'] for s in modules[target['moduleId']]['slides']]:raise ValueError('Invalid alias target')
    return len(modules),len(concepts),len(question_ids)
def main():
    curriculum=json.loads((ROOT/'content/curriculum.json').read_text())
    banks=[json.loads((ROOT/f'content/{p}').read_text()) for p in ['practice.json','assessments.private.json']]
    result=validate(curriculum,banks)
    official={q['prompt'] for qs in banks[1].values() for q in qs}
    assert not official.intersection(q['prompt'] for qs in banks[0].values() for q in qs),'Practice and recorded questions must be distinct'
    for p in (ROOT/'frontend/src').glob('**/*'):
        if p.suffix in ['.ts','.tsx']:assert '.private.json' not in p.read_text(),f'Private bank imported in {p}'
    print(f'Validated {result[0]} modules, {result[1]} concepts and {result[2]} aligned questions')
if __name__=='__main__':main()
