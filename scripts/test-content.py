"""Negative curriculum tests: metadata errors must fail before content reaches learners."""
import copy, importlib.util, json, pathlib, unittest
ROOT=pathlib.Path(__file__).resolve().parent.parent
spec=importlib.util.spec_from_file_location('validator',ROOT/'scripts/validate-content.py')
v=importlib.util.module_from_spec(spec);spec.loader.exec_module(v)
class ContentValidation(unittest.TestCase):
    def setUp(self):
        self.c=json.loads((ROOT/'content/curriculum.json').read_text())
        self.b=[json.loads((ROOT/f'content/{f}').read_text()) for f in ['practice.json','assessments.private.json']]
    def rejects(self):
        with self.assertRaises(ValueError):v.validate(self.c,self.b)
    def test_complete_curriculum(self):self.assertEqual(v.validate(self.c,self.b),(14,118,91))
    def test_missing_example_is_rejected(self):
        runtime=json.loads((ROOT/'content/modules.json').read_text());examples=json.loads((ROOT/'content/examples.json').read_text())
        self.c['modules'][0]['slides'][0]['exampleId']='absent'
        with self.assertRaises(ValueError):v.validate_assets(self.c,runtime,examples)
    def test_new_module_cannot_assess_unrelated_concept(self):
        self.b[0]['sliding-window'][0]['concepts']=['heaps.heap-sort'];self.rejects()
    def test_invalid_new_runtime_operation(self):
        runtime=json.loads((ROOT/'content/modules.json').read_text());examples=json.loads((ROOT/'content/examples.json').read_text())
        self.c['modules'][-1]['slides'][0]['runtime']={'moduleId':'sliding-window','op':99}
        with self.assertRaises(ValueError):v.validate_assets(self.c,runtime,examples)
    def test_unknown_taught_concept(self):self.c['modules'][0]['slides'][0]['teaches']=['missing'];self.rejects()
    def test_unknown_question_concept(self):self.b[0]['arrays'][0]['concepts']=['missing'];self.rejects()
    def test_concept_outside_prerequisite_closure(self):self.b[0]['arrays'][0]['concepts']=['graph.dijkstra'];self.rejects()
    def test_unknown_prerequisite(self):self.c['modules'][0]['prerequisites']=['missing'];self.rejects()
    def test_cyclic_prerequisites(self):self.c['modules'][0]['prerequisites']=['arrays'];self.rejects()
    def test_material_after_quiz(self):
        slides=self.c['modules'][0]['slides'];slides.append(slides.pop(0));self.rejects()
    def test_concept_only_on_quiz_is_untaught(self):
        for m in self.c['modules']:
            for s in m['slides']:s['teaches']=[c for c in s['teaches'] if c!='arrays.model']
        self.c['modules'][1]['slides'][-1]['teaches']=['arrays.model'];self.b[0]['arrays'][0]['concepts']=['arrays.model'];self.rejects()
    def test_no_official_answer_keys_in_public_catalog(self):
        runtime=json.loads((ROOT/'content/modules.json').read_text());self.assertNotIn('question',runtime['modules'][0])
        public={q['prompt'] for qs in self.b[0].values() for q in qs}
        self.assertTrue(all(q['prompt'] not in public for qs in self.b[1].values() for q in qs))
if __name__=='__main__':unittest.main()
