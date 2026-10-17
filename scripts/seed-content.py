"""Generate a deterministic Flyway seed from the versioned curriculum (review before release).
Run only when preparing a new release: never rewrite an already deployed migration.
"""
import json,pathlib
root=pathlib.Path(__file__).resolve().parent.parent
modules=json.loads((root/'content/modules.json').read_text())['modules']
def q(v): return "'"+v.replace("'","''")+"'"
lines=["INSERT INTO roles(id,name) VALUES (1,'STUDENT'),(2,'INSTRUCTOR');"]
for m in modules:
 i=m['engineId']; slug=q(m['id']);title=q(m['title'])
 lines.extend([f'INSERT INTO topics(id,slug,title) VALUES ({i},{slug},{title});',f'INSERT INTO lessons(id,topic_id,slug,title,body) VALUES ({i},{i},{slug},{title},{q(m["explanation"])});',f'INSERT INTO algorithms(id,lesson_id,slug,title) VALUES ({i},{i},{slug},{title});',f'INSERT INTO algorithm_versions(id,algorithm_id,version,engine_version,complexity,invariants) VALUES ({i},{i},\'1.0.0\',\'1.0.0\',{q(m["complexity"])},{q(m["invariant"])});',f'INSERT INTO questions(id,lesson_id,stable_key) VALUES ({i},{i},{q(m["id"]+".concept.1")});',f'INSERT INTO question_revisions(id,question_id,revision,prompt,explanation) VALUES ({i},{i},1,{q(m["question"]["prompt"])},{q(m["question"]["explanation"])});'])
 for j,option in enumerate(m['question']['options']): lines.append(f'INSERT INTO answer_options(id,revision_id,ordinal,text,is_correct) VALUES ({i*10+j},{i},{j},{q(option)},{int(j==m["question"]["correct"])});')
ids={m['id']:m['engineId'] for m in modules}
for m in modules:
 for prerequisite in m['prerequisites']:lines.append(f'INSERT INTO topic_prerequisites VALUES ({m["engineId"]},{ids[prerequisite]});')
(root/'backend/src/main/resources/db/migration/V2__release_curriculum.sql').write_text('\n'.join(lines)+'\n')
