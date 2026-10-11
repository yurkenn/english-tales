"""Check native ELF alignment in any APK without requiring release credentials."""
import sys
import zipfile
from elf_alignment import check_elf64

failures=[]
count=0
with zipfile.ZipFile(sys.argv[1]) as package:
    for name in package.namelist():
        if name.startswith(('lib/arm64-v8a/','lib/x86_64/')) and name.endswith('.so'):
            count+=1
            failures.extend(name+': '+error for error in check_elf64(package.read(name)))
if failures:
    print('\n'.join(failures))
    raise SystemExit(1)
print(f'Native ELF alignment passed ({count} 64-bit libraries).')
