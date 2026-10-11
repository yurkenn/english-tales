"""Inspect a signed APK and its AAB; no passwords or signing configuration are read."""
import argparse, hashlib, json, pathlib, struct, subprocess, zipfile

parser=argparse.ArgumentParser()
parser.add_argument('--sdk',required=True)
parser.add_argument('--jdk',required=True)
parser.add_argument('--build-tools',default='36.0.0')
args=parser.parse_args()
root=pathlib.Path(__file__).resolve().parents[1]
output=root/'native-android/app/build/outputs'
metadata=json.loads((output/'apk/release/output-metadata.json').read_text())
apk=output/'apk/release'/metadata['elements'][0]['outputFile']
aab=output/'bundle/release/app-release.aab'
assert metadata['applicationId']=='com.yurken.englishtales'
assert metadata['elements'][0]['versionCode']>=47
assert not apk.name.endswith('unsigned.apk')
tools=pathlib.Path(args.sdk)/'build-tools'/args.build_tools
suffix='.exe' if __import__('os').name=='nt' else ''
align=subprocess.run([str(tools/('zipalign'+suffix)),'-c','-P','16','4',str(apk)],capture_output=True,check=True)
env=dict(__import__('os').environ,JAVA_HOME=args.jdk)
signature=subprocess.run([str(tools/('apksigner.bat' if suffix else 'apksigner')),'verify','--verbose','--print-certs',str(apk)],capture_output=True,check=True,env=env).stdout.decode(errors='replace')
assert 'ef07c97355fdf76314c7aa946efca444d72d4830' in signature.lower(), 'APK upload signer differs from Play Console'
bundle=subprocess.run([str(pathlib.Path(args.jdk)/'bin'/('jarsigner'+suffix)),'-verify',str(aab)],capture_output=True,check=True).stdout.decode(errors='replace')
assert 'jar verified.' in bundle, 'AAB signature verification failed'
libraries=[]
alignment_errors=[]
with zipfile.ZipFile(apk) as archive:
    for name in archive.namelist():
        if not name.endswith('.so') or not name.startswith(('lib/arm64-v8a/','lib/x86_64/')):
            continue
        data=archive.read(name)
        assert data[:6]==b'\x7fELF\x02\x01', 'Expected little-endian ELF64'
        offset=struct.unpack_from('<Q',data,32)[0]
        size,count=struct.unpack_from('<HH',data,54)
        loads=[]
        for index in range(count):
            kind,flags,file_offset,address,physical,file_size,memory,alignment=struct.unpack_from('<IIQQQQQQ',data,offset+index*size)
            if kind==1:
                if alignment<16384: alignment_errors.append(name+' LOAD alignment')
                if file_offset%16384!=address%16384: alignment_errors.append(name+' LOAD offset')
                loads.append(alignment)
            if kind==0x6474e552:
                if (address+memory)%16384!=0:
                    alignment_errors.append(name+f' RELRO end 0x{address+memory:x} is not 16KB aligned')
        assert loads, 'ELF missing LOAD segments'
        libraries.append(name)
report={'versionCode':metadata['elements'][0]['versionCode'],'versionName':metadata['elements'][0]['versionName'],
        'apkSignerMatchesPlay':True,'aabSignatureVerified':True,'apkZipAlignment16KB':True,'elf64Libraries':libraries,
        'elf64AlignmentPassed':not alignment_errors,'alignmentErrors':alignment_errors,
        'apkSHA256':hashlib.sha256(apk.read_bytes()).hexdigest(),'aabSHA256':hashlib.sha256(aab.read_bytes()).hexdigest(),
        'limitation':'Static package inspection only; Play-generated split APKs and real 16KB devices still need testing.'}
path=output/'release-verification.json'
path.write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2))
if alignment_errors: raise SystemExit(1)
