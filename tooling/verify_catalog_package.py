"""Verify the built APK contains the reviewed catalog and every exact cover resource."""
import argparse
import hashlib
import json
from pathlib import Path
import zipfile


def verify(apk):
    root = Path(__file__).resolve().parents[1]
    assets = root / 'native-android/app/src/main/assets/catalog'
    catalog_bytes = (assets / 'v2.json').read_bytes()
    catalog = json.loads(catalog_bytes)
    cover_code = (root / 'native-android/app/src/main/java/com/yurken/englishtales/ui/BookCover.kt').read_text()
    with zipfile.ZipFile(apk) as archive:
        if archive.read('assets/catalog/v2.json') != catalog_bytes:
            raise ValueError('APK catalog differs from source')
        if archive.read('assets/catalog/v1.json') != (assets / 'v1.json').read_bytes():
            raise ValueError('APK historical catalog differs from source')
        count = 0
        for story in catalog['stories']:
            key = story['coverKey']
            if key != 'cover_quiet_morning' and f'"{key}" -> R.drawable.{key}' not in cover_code:
                raise ValueError(f'Missing UI cover mapping: {key}')
            asset = story['coverAsset']
            matches = [name for name in archive.namelist() if name.startswith('res/') and name.endswith('/' + Path(asset['resource']).name)]
            if len(matches) != 1:
                raise ValueError(f'Missing/ambiguous APK cover: {key}')
            data = archive.read(matches[0])
            if len(data) != asset['resourceByteSize'] or hashlib.sha256(data).hexdigest() != asset['resourceSha256']:
                raise ValueError(f'APK cover mismatch: {key}')
            count += 1
    return {'catalogSHA256': hashlib.sha256(catalog_bytes).hexdigest(), 'stories': len(catalog['stories']),
            'verifiedApkCovers': count, 'historicalCatalogUnchanged': True}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('apk', type=Path)
    print(json.dumps(verify(parser.parse_args().apk), indent=2))
