"""Ship the exact executed C source and stable annotation line numbers."""
import json, pathlib, re
root = pathlib.Path(__file__).resolve().parent.parent
source = (root / 'engine/src/engine.c').read_text()
locations = {}
for number, line in enumerate(source.splitlines(), 1):
    for loc in re.findall(r'@loc:([\w.-]+)', line):
        if loc in locations:
            raise ValueError(f'Duplicate source location {loc}')
        locations[loc] = number
(root / 'frontend/public/engine/source.json').write_text(json.dumps({'source': source, 'locations': locations}))
