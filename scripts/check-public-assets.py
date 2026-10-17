"""Ensure the static release contains no recorded-assessment bank or exact question prompts."""
import json,pathlib
ROOT=pathlib.Path(__file__).resolve().parent.parent
dist=ROOT/'frontend/dist'
assert dist.exists(),'Build frontend first'
private=json.loads((ROOT/'content/assessments.private.json').read_text())
files=[p for p in dist.rglob('*') if p.is_file()]
for file in files:
    assert '.private.' not in file.name,file
    if file.suffix in ('.js','.json','.html'):
        text=file.read_text()
        for questions in private.values():
            for question in questions:
                assert question['prompt'] not in text,f'Recorded question leaked in {file}'
assert not (dist/'engine/source.json').exists(),'Obsolete source panel asset published'
print('Production assets contain no recorded question prompts, private banks or obsolete source panel asset')
