"""Check the Git index without printing credentials; run before checkpoints and in CI."""
import base64
import json
import re
import subprocess
import sys

names=subprocess.check_output(['git','ls-files','-z']).decode().split('\0')
failures=[]
# The content-admin web tooling is JavaScript; the mobile application is Kotlin.
legacy_mobile_roots={'app','components','hooks','services','store','providers','theme','i18n'}
legacy_mobile_files={'package.json','package-lock.json','yarn.lock','pnpm-lock.yaml',
    'bun.lock','bun.lockb','app.json','app.config.js','app.config.ts','App.js','App.tsx',
    'index.js','metro.config.js','babel.config.js','eas.json'}
for name in filter(None,names):
    if name in legacy_mobile_files or name.split('/')[0] in legacy_mobile_roots or name.endswith(('.tsx','.jsx')):
        failures.append((name,'legacy React Native/Expo mobile source; use native-android'))
    if re.search(r'(^|/)(node_modules|\.gradle|build)/|\.(jks|keystore|apk|aab|tar)$|(^|/)(supabase|local|signing)\.properties$|(^|/)credentials\.(json|md)$|(^|/)\.env($|\.(?!.*example$))',name):
        failures.append((name,'private configuration or generated artifact'))
    data=subprocess.check_output(['git','show',':'+name])
    if b'\x00' in data:
        continue
    try:
        content=data.decode('utf-8-sig')
    except UnicodeDecodeError:
        continue
    # Screen text lives in strings.xml so it can be reviewed and translated (Q3.1).
    template=r'\$\{(?:[^{}]|\{[^{}]*\})*\}'
    if name.startswith('native-android/app/src/main/java/') and name.endswith('.kt') and any(re.search(r'[A-Za-zÇĞİÖŞÜçğıöşü]{2}',re.sub(template+r'|\$\w+','',literal)) for literal in re.findall(r'\bText\(\s*"((?:'+template+r'|[^"\\\n])*)"',content)):
        failures.append((name,'hard-coded screen text; move it to res/values/strings.xml'))
    if re.search(r'^(<<<<<<< |=======\s*$|>>>>>>> )',content,re.M):
        failures.append((name,'unresolved merge conflict'))
    if re.search(r'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|\b(?:ghp_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,}|sb_secret_[A-Za-z0-9_-]{20,})',content):
        failures.append((name,'private credential'))
    for token in re.findall(r'\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+',content):
        try:
            part=token.split('.')[1]
            claims=json.loads(base64.urlsafe_b64decode(part+'='*((-len(part))%4)))
            if claims.get('role')=='service_role' or claims.get('sub'):
                failures.append((name,'privileged or personal JWT'))
        except (ValueError,UnicodeDecodeError):
            pass
if failures:
    for name,reason in sorted(set(failures)):
        print(f'{name}: {reason}')
    sys.exit(1)
print(f'Repository checks passed ({len(list(filter(None,names)))} tracked files).')
