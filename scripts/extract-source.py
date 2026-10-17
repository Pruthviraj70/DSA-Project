"""Ship the exact executed C source and stable annotation line numbers."""
import json, pathlib, re, sys
root = pathlib.Path(__file__).resolve().parent.parent
source = (root / 'engine/src/engine.c').read_text()
locations = {}
for number, line in enumerate(source.splitlines(), 1):
    for loc in re.findall(r'@loc:([\w.-]+)', line):
        if loc in locations:
            raise ValueError(f'Duplicate source location {loc}')
        matches = list(re.finditer(r'\bemit\([^;\n]*"' + re.escape(loc) + r'"', source))
        if loc == 'engine.ready':
            matches = list(re.finditer(r'e\.loc\s*=\s*"engine.ready"', source))
        if len(matches) != 1:
            raise ValueError(f'Location {loc} must identify exactly one executed emission/ready assignment')
        locations[loc] = source[:matches[0].start()].count('\n') + 1
assert locations, 'No source locations found'
(root / (sys.argv[1] if len(sys.argv)>1 else 'frontend/public/engine/source.json')).write_text(json.dumps({'source': source, 'locations': locations}))
