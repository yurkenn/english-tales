"""Build the app's WebP images from their PNG sources (requires cwebp; macOS sips for dimensions).

Covers: backend/content/covers/*.png -> res/drawable-nodpi/*.webp, fitted inside 600x900 px
(covers are drawn at most 140x200 dp, 560x800 px at xxxhdpi). The PNGs stay the source for
Storage uploads and checksums. Mascots are converted in place at their original size.
"""
import pathlib, subprocess, sys, tempfile, hashlib

root = pathlib.Path(__file__).resolve().parents[1] / 'native-android'
res = root / 'app/src/main/res/drawable-nodpi'
MAX_W, MAX_H = 600, 900

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
    covers = sorted((root / 'backend/content/covers').glob('cover_*.png'))
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
                    webp(source, output, 82, resize)
                    checked[digest] = output.read_bytes()
                if (res / (source.stem + '.webp')).read_bytes() != checked[digest]:
                    sys.exit(f'Cover WebP differs from reproducible PNG conversion: {source.name}')
        print(f'{len(covers)} PNG -> shipped WebP conversions verified')
        return
    for source in covers:
        width, height = size(source)
        scale = min(1.0, MAX_W / width, MAX_H / height)
        resize = (round(width * scale), round(height * scale)) if scale < 1 else None
        webp(source, res / (source.stem + '.webp'), 82, resize)
    for source in sorted(res.glob('mascot_*.png')):
        webp(source, source.with_suffix('.webp'), 90, alpha=True)
        source.unlink()
    print(f'{len(covers)} covers built into {res}')

if __name__ == '__main__':
    main()
