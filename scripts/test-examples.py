"""Compile/check all 185 displayed examples independently, then exercise representative behavior."""
import json,os,pathlib,subprocess,tempfile
ROOT=pathlib.Path(__file__).resolve().parent.parent
os.chdir(ROOT)
def run(*args):subprocess.run(args,check=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
java_home=os.environ.get('JAVA_HOME','')
javac=str(pathlib.Path(java_home)/'bin/javac') if java_home else 'javac'
java=str(pathlib.Path(java_home)/'bin/java') if java_home else 'java'
with tempfile.TemporaryDirectory(prefix='dsa-examples-') as temp:
    tmp=pathlib.Path(temp);bank=json.loads((ROOT/'content/examples.json').read_text())
    for id,example in bank.items():
        for lang,code in example['codes'].items():
            try:
                file=tmp/({'C':'example.c','C++':'example.cpp','Java':'Example.java','JavaScript':'example.js','Python':'example.py'}[lang]);file.write_text(code)
                if lang in ('C','C++'):run('gcc' if lang=='C' else 'g++','-std=c17' if lang=='C' else '-std=c++17','-Wall','-Wextra','-Werror','-fsyntax-only',str(file))
                elif lang=='Java':run(javac,'-d',temp,str(file))
                elif lang=='JavaScript':run('node','--check',str(file))
                else:compile(code,str(file),'exec')
            except subprocess.CalledProcessError as error:
                raise RuntimeError(f'{id}/{lang}: {error.stderr.decode()}') from error
    for compiler,file,standard in [('gcc','examples-c.c','c17'),('g++','examples-cpp.cpp','c++17')]:
        try:
            run(compiler,f'-std={standard}','-Wall','-Wextra','-Wno-misleading-indentation','-fsanitize=address,undefined','-g',f'scripts/tests/{file}','-o',str(tmp/'test'))
            subprocess.run([str(tmp/'test')],check=True)
        except subprocess.CalledProcessError as e:raise RuntimeError(e.stderr.decode() if e.stderr else str(e)) from e
    run(javac,'-d',temp,'content/examples/Examples.java','scripts/tests/ExamplesTest.java')
    subprocess.run([java,'-ea','-cp',temp,'ExamplesTest'],check=True)
    subprocess.run(['python3','scripts/tests/examples-python.py'],check=True)
    subprocess.run(['node','scripts/tests/examples-javascript.cjs'],check=True)
print(f'{len(bank)*5} displayed examples compile; representative behavior passed in all five languages')
