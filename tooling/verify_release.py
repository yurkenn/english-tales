"""Inspect a signed APK and its AAB; no passwords or signing configuration are read."""
import argparse, hashlib, json, pathlib, subprocess, zipfile
from elf_alignment import check_elf64

parser=argparse.ArgumentParser()
parser.add_argument('--sdk',required=True)
parser.add_argument('--jdk',required=True)
parser.add_argument('--build-tools',default='36.0.0')
parser.add_argument('--expected-version-code',type=int,help='CI: the version code the build was asked to produce')
args=parser.parse_args()
root=pathlib.Path(__file__).resolve().parents[1]
output=root/'native-android/app/build/outputs'
metadata=json.loads((output/'apk/release/output-metadata.json').read_text())
apk=output/'apk/release'/metadata['elements'][0]['outputFile']
aab=output/'bundle/release/app-release.aab'
assert metadata['applicationId']=='com.yurken.englishtales'
assert metadata['elements'][0]['versionCode']>=48
assert not apk.name.endswith('unsigned.apk')
if args.expected_version_code is not None:
    assert metadata['elements'][0]['versionCode']==args.expected_version_code, 'Built version code differs from the requested one'
assert apk.stat().st_size<15*1024*1024, 'Release APK exceeds the 15 MB quality target'
tools=pathlib.Path(args.sdk)/'build-tools'/args.build_tools
suffix='.exe' if __import__('os').name=='nt' else ''
align=subprocess.run([str(tools/('zipalign'+suffix)),'-c','-P','16','4',str(apk)],capture_output=True,check=True)
env=dict(__import__('os').environ,JAVA_HOME=args.jdk)
signature=subprocess.run([str(tools/('apksigner.bat' if suffix else 'apksigner')),'verify','--verbose','--print-certs',str(apk)],capture_output=True,check=True,env=env).stdout.decode(errors='replace')
assert 'ef07c97355fdf76314c7aa946efca444d72d4830' in signature.lower(), 'APK upload signer differs from Play Console'
bundle=subprocess.run([str(pathlib.Path(args.jdk)/'bin'/('jarsigner'+suffix)),'-verify',str(aab)],capture_output=True,check=True).stdout.decode(errors='replace')
assert 'jar verified.' in bundle, 'AAB signature verification failed'
bundle_cert=subprocess.run([str(pathlib.Path(args.jdk)/'bin'/('keytool'+suffix)),'-printcert','-jarfile',str(aab)],capture_output=True,check=True).stdout.decode(errors='replace')
assert 'ef:07:c9:73:55:fd:f7:63:14:c7:aa:94:6e:fc:a4:44:d7:2d:48:30' in bundle_cert.lower(), 'AAB upload signer differs from Play Console'
libraries=[]
alignment_errors=[]
profiles={}
source_profiles=root/'native-android/app/src/main/generated/baselineProfiles'
for name in ('baseline-prof.txt','startup-prof.txt'):
    rules=(source_profiles/name).read_text().splitlines()
    app_rules=[rule for rule in rules if 'Lcom/yurken/englishtales/' in rule]
    assert app_rules, 'Application rules missing from source profile: '+name
    profiles[name]={'rules':len(rules),'applicationRules':len(app_rules)}
r8_profile=output.parent/'intermediates/r8_art_profile/release/minifyReleaseWithR8/baseline-prof.txt'
assert 'Lcom/yurken/englishtales/MainActivity;' in r8_profile.read_text(), 'Application startup rules did not reach the release R8 profile'

with zipfile.ZipFile(apk) as archive, zipfile.ZipFile(aab) as bundle_archive:
    for label, package, prefix in (
        ('apk',archive,'assets/dexopt/'),
        ('aab',bundle_archive,'BUNDLE-METADATA/com.android.tools.build.profiles/'),
    ):
        profiles[label]={}
        for name,magic in (('baseline.prof',b'pro\x00'),('baseline.profm',b'prm\x00')):
            data=package.read(prefix+name)
            assert len(data)>8 and data.startswith(magic), 'Invalid packaged profile: '+label+'/'+name
            profiles[label][name]={'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()}
    for package, prefix in ((archive, ''), (bundle_archive, 'base/dex/')):
        dex = b''.join(package.read(name) for name in package.namelist()
                       if name.startswith(prefix) and name.endswith('.dex'))
        assert b'https://gtuangjukckpuerczfxd.supabase.co' in dex, 'Production URL is missing from the compiled package'
        assert b'jukyylozahikjhtokayw.supabase.co' not in dex, 'Test service URL is present in a release package'
    # Play rejects a release whose advertising ID declaration and manifest disagree.
    assert b'com.google.android.gms.permission.AD_ID' in bundle_archive.read('base/manifest/AndroidManifest.xml'), 'AD_ID permission is missing from the AAB manifest'
    # Reported, not required: prebuilt dependency libraries may already be stripped.
    debug_symbols=sorted(name for name in bundle_archive.namelist()
                         if name.startswith('BUNDLE-METADATA/com.android.tools.build.debugsymbols/'))
    for name in archive.namelist():
        if not name.endswith('.so') or not name.startswith(('lib/arm64-v8a/','lib/x86_64/')):
            continue
        data=archive.read(name)
        assert data == bundle_archive.read('base/'+name), 'APK and AAB native binary differs: '+name
        alignment_errors.extend(name+' '+error for error in check_elf64(data))
        libraries.append(name)
report={'versionCode':metadata['elements'][0]['versionCode'],'versionName':metadata['elements'][0]['versionName'],
        'baselineProfilePackagingVerified':True,'baselineProfiles':profiles,
        'productionServiceVerified':True,'apkSignerMatchesPlay':True,'aabSignatureVerified':True,'apkZipAlignment16KB':True,'adIdPermission':True,'nativeDebugSymbols':debug_symbols,'elf64Libraries':libraries,
        'elf64AlignmentPassed':not alignment_errors,'alignmentErrors':alignment_errors,
        'apkBytes':apk.stat().st_size,'aabBytes':aab.stat().st_size,
        'apkSHA256':hashlib.sha256(apk.read_bytes()).hexdigest(),'aabSHA256':hashlib.sha256(aab.read_bytes()).hexdigest(),
        'limitation':'Static package inspection only; Play-generated split APKs and real 16KB devices still need testing.'}
path=output/'release-verification.json'
path.write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2))
if alignment_errors: raise SystemExit(1)
