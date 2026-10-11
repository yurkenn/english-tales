"""Check the Git index without printing credentials; run before checkpoints and in CI."""
import base64
import json
import re
import subprocess
import sys

names=subprocess.check_output(['git','ls-files','-z']).decode().split('\0')
failures=[]
for name in filter(None,names):
    if re.search(r'(^|/)(node_modules|\.gradle|build)/|\.(jks|keystore|apk|aab|tar)$|(^|/)(supabase|local|signing)\.properties$|(^|/)credentials\.(json|md)$|(^|/)\.env($|\.(?!.*example$))',name):
        failures.append((name,'private configuration or generated artifact'))
    data=subprocess.check_output(['git','show',':'+name])
    if b'\x00' in data:
        continue
    try:
        content=data.decode('utf-8-sig')
    except UnicodeDecodeError:
        continue
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
