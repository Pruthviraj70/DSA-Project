"""Prepare V4 for this update only; future releases must add a new migration, not rewrite V4."""
import importlib.util,json,pathlib
ROOT=pathlib.Path(__file__).resolve().parent.parent
spec=importlib.util.spec_from_file_location('validation',ROOT/'scripts/validate-content.py');validation=importlib.util.module_from_spec(spec);spec.loader.exec_module(validation)
c=json.loads((ROOT/'content/curriculum.json').read_text());bank=json.loads((ROOT/'content/assessments.private.json').read_text());practice=json.loads((ROOT/'content/practice.json').read_text());validation.validate(c,[bank,practice])
def q(value):return "'"+value.replace("'","''")+"'"
def lesson(id):return f'(SELECT id FROM lessons WHERE slug={q(id)})'
def topic(id):return f'(SELECT id FROM topics WHERE slug={q(id)})'
def slide(module,id):return f'(SELECT id FROM lesson_slides WHERE lesson_id={lesson(module)} AND slide_key={q(id)})'
def question(id):return f'(SELECT id FROM questions WHERE stable_key={q(id)})'
def revision(id):return f'(SELECT id FROM question_revisions WHERE question_id={question(id)} AND revision=1)'
lines=['-- Guarded content inserts: rerunning this seed creates no duplicates and changes no historical rows.']
for concept in c['concepts']:
 lines.append(f'INSERT INTO curriculum_concepts(id,title) SELECT {q(concept["id"])},{q(concept["title"])} WHERE NOT EXISTS (SELECT 1 FROM curriculum_concepts WHERE id={q(concept["id"])});')
for m in c['modules']:
 id=m['id'];lines.extend([f'INSERT INTO topics(slug,title) SELECT {q(id)},{q(m["title"])} WHERE NOT EXISTS (SELECT 1 FROM topics WHERE slug={q(id)});',f'INSERT INTO lessons(topic_id,slug,title,body) SELECT {topic(id)},{q(id)},{q(m["title"])},{q(m["description"])} WHERE NOT EXISTS (SELECT 1 FROM lessons WHERE slug={q(id)});'])
 for i,s in enumerate(m['slides']):
  lines.append(f'INSERT INTO lesson_slides(lesson_id,slide_key,ordinal,title,kind) SELECT {lesson(id)},{q(s["id"])},{i},{q(s["title"])},{q(s["kind"])} WHERE NOT EXISTS (SELECT 1 FROM lesson_slides WHERE lesson_id={lesson(id)} AND slide_key={q(s["id"])});')
  for concept in s['teaches']:lines.append(f'INSERT INTO slide_concepts SELECT {slide(id,s["id"])},{q(concept)} WHERE NOT EXISTS (SELECT 1 FROM slide_concepts WHERE slide_id={slide(id,s["id"])} AND concept_id={q(concept)});')
 for i,item in enumerate(bank[id]):
  key=item['id']
  lines.append(f'INSERT INTO questions(lesson_id,stable_key) SELECT {lesson(id)},{q(key)} WHERE NOT EXISTS (SELECT 1 FROM questions WHERE stable_key={q(key)});')
  lines.append(f'INSERT INTO question_revisions(question_id,revision,prompt,explanation) SELECT {question(key)},1,{q(item["prompt"])},{q(item["explanation"])} WHERE NOT EXISTS (SELECT 1 FROM question_revisions WHERE question_id={question(key)} AND revision=1);')
  for j,option in enumerate(item['options']):lines.append(f'INSERT INTO answer_options(revision_id,ordinal,text,is_correct) SELECT {revision(key)},{j},{q(option)},{int(j==item["correctIndex"])} WHERE NOT EXISTS (SELECT 1 FROM answer_options WHERE revision_id={revision(key)} AND ordinal={j});')
  for concept in item['concepts']:lines.append(f'INSERT INTO question_concepts SELECT {revision(key)},{q(concept)} WHERE NOT EXISTS (SELECT 1 FROM question_concepts WHERE revision_id={revision(key)} AND concept_id={q(concept)});')
  lines.append(f'INSERT INTO curriculum_questions(lesson_id,question_id,revision_id,ordinal) SELECT {lesson(id)},{question(key)},{revision(key)},{i} WHERE NOT EXISTS (SELECT 1 FROM curriculum_questions WHERE lesson_id={lesson(id)} AND question_id={question(key)});')
for m in c['modules']:
 for p in m['prerequisites']:lines.append(f'INSERT INTO topic_prerequisites SELECT {topic(m["id"])},{topic(p)} WHERE NOT EXISTS (SELECT 1 FROM topic_prerequisites WHERE topic_id={topic(m["id"])} AND prerequisite_id={topic(p)});')
lines.append("INSERT INTO algorithm_versions(algorithm_id,version,engine_version,complexity,invariants) SELECT a.id,'1.1.0','1.1.0',old.complexity,old.invariants FROM algorithms a JOIN algorithm_versions old ON old.algorithm_id=a.id AND old.version='1.0.0' WHERE NOT EXISTS (SELECT 1 FROM algorithm_versions current WHERE current.algorithm_id=a.id AND current.version='1.1.0');")
(ROOT/'backend/src/main/resources/db/migration/V4__aligned_curriculum.sql').write_text('\n'.join(lines)+'\n')
print('Prepared additive V4 curriculum seed')
