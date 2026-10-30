"""Build the app's WebP images from their PNG sources (requires cwebp; macOS sips for dimensions).

Covers: backend/content/covers/*.png and art/published-covers/*.webp -> drawable-nodpi/*.webp,
fitted inside 420x618 px (the maximum 140x206 dp cover at xxhdpi). Original published files
stay intact for provenance checks. Mascots are converted in place at their original size.
"""
import pathlib, subprocess, sys, tempfile, hashlib, json

root = pathlib.Path(__file__).resolve().parents[1] / 'native-android'
res = root / 'app/src/main/res/drawable-nodpi'
MAX_W, MAX_H = 420, 618
COVER_QUALITY = 82

def size(path):
    out = subprocess.run(['sips', '-g', 'pixelWidth', '-g', 'pixelHeight', str(path)], capture_output=True, text=True, check=True).stdout
    values = [int(line.split(':')[1]) for line in out.splitlines() if 'pixel' in line]
    return values[0], values[1]

def webp(source, target, quality, resize=None, alpha=False):
    args = ['cwebp', '-quiet', '-mt', '-m', '6', '-q', str(quality), '-metadata', 'none']
    if alpha: args += ['-alpha_q', '100', '-exact']
    if resize: args += ['-resize', str(resize[0]), str(resize[1])]
    subprocess.run(args + [str(source), '-o', str(target)], check=True)

def main():
    covers = sorted([*(root / 'backend/content/covers').glob('cover_*.png'),
                     *(root / 'art/published-covers').glob('cover_*.webp')])
    if len({source.stem for source in covers}) != len(covers):
        sys.exit('Duplicate cover source names')
    if not covers: sys.exit('No cover sources found')
    if '--check-covers' in sys.argv:
        # Reproduce source -> WebP bytes in a temporary directory, never touching shipped assets.
        with tempfile.TemporaryDirectory(prefix='tales-covers-') as temporary:
            checked = {}
            for source in covers:
                digest = hashlib.sha256(source.read_bytes()).hexdigest()
                if digest not in checked:
                    width, height = size(source)
                    scale = min(1.0, MAX_W / width, MAX_H / height)
                    resize = (round(width * scale), round(height * scale)) if scale < 1 else None
                    output = pathlib.Path(temporary) / (digest + '.webp')
                    webp(source, output, COVER_QUALITY, resize)
                    checked[digest] = output.read_bytes()
                if (res / (source.stem + '.webp')).read_bytes() != checked[digest]:
                    sys.exit(f'Cover WebP differs from reproducible PNG conversion: {source.name}')
        print(f'{len(covers)} original -> shipped WebP conversions verified')
        return
    for source in covers:
        width, height = size(source)
        scale = min(1.0, MAX_W / width, MAX_H / height)
        resize = (round(width * scale), round(height * scale)) if scale < 1 else None
        webp(source, res / (source.stem + '.webp'), COVER_QUALITY, resize)
    for source in sorted(res.glob('mascot_*.png')):
        webp(source, source.with_suffix('.webp'), 90, alpha=True)
        source.unlink()
    catalog_path = root / 'app/src/main/assets/catalog/v2.json'
    if catalog_path.exists():
        catalog = json.loads(catalog_path.read_text())
        for story in catalog['stories']:
            asset = story['coverAsset']
            data = (root / asset['resource']).read_bytes()
            asset['resourceSha256'] = hashlib.sha256(data).hexdigest()
            asset['resourceByteSize'] = len(data)
        catalog_path.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + '\n')
    print(f'{len(covers)} covers built into {res}')

if __name__ == '__main__':
    main()
