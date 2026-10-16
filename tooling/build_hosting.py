"""Build the public support site and authenticated studio; never include private settings."""
import json
from pathlib import Path
import shutil

ROOT = Path(__file__).resolve().parents[1]
WEB = ROOT / 'native-android' / 'web'
OUTPUT = ROOT / 'native-android' / 'build' / 'hosting'
PUBLIC = OUTPUT / 'public'
PROJECT = 'gtuangjukckpuerczfxd'
CONFIG = {'mode': 'cloud', 'url': f'https://{PROJECT}.supabase.co',
          'key': 'sb_publishable_cpLD8Aax1A2KuvwzUeA2dw_uXzn-Z4-'}

def build():
    # Only this generated directory is replaced. Device backups elsewhere are preserved.
    expected = (ROOT / 'native-android' / 'build' / 'hosting').resolve()
    assert OUTPUT.resolve() == expected
    if OUTPUT.exists():
        shutil.rmtree(OUTPUT)
    PUBLIC.mkdir(parents=True)
    for source in WEB.iterdir():
        if source.is_file():
            shutil.copy2(source, PUBLIC / source.name)
    studio = PUBLIC / 'studio'
    studio.mkdir()
    admin = ROOT / 'native-android' / 'backend' / 'admin'
    for name in ('index.html', 'styles.css', 'app.js', 'api.js', 'workflow.js', 'favicon.svg'):
        shutil.copy2(admin / name, studio / name)
    index = (studio / 'index.html').read_text(encoding='utf-8')
    for name in ('styles.css', 'app.js', 'favicon.svg'):
        index = index.replace(f'"/{name}"', f'"/studio/{name}"')
    (studio / 'index.html').write_text(index, encoding='utf-8')
    (PUBLIC / 'api').mkdir()
    (PUBLIC / 'api' / 'config.json').write_text(json.dumps(CONFIG), encoding='utf-8')
    headers = [
        {'key': 'X-Content-Type-Options', 'value': 'nosniff'},
        {'key': 'Referrer-Policy', 'value': 'no-referrer'},
        {'key': 'X-Frame-Options', 'value': 'DENY'},
        {'key': 'Permissions-Policy', 'value': 'camera=(), microphone=(), geolocation=()'},
        {'key': 'Content-Security-Policy', 'value': "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' blob: data:; media-src 'self' blob:; connect-src 'self' https://gtuangjukckpuerczfxd.supabase.co; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'"},
        {'key': 'Cache-Control', 'value': 'no-cache'},
    ]
    config = {'hosting': {'site': 'englishtales-app', 'public': 'public',
              'ignore': ['firebase.json', '**/.*'],
              'headers': [{'source': '**', 'headers': headers}],
              'rewrites': [{'source': '/api/config', 'destination': '/api/config.json'},
                           {'source': '/privacy', 'destination': '/privacy.html'},
                           {'source': '/delete-account', 'destination': '/delete-account.html'},
                           {'source': '/studio', 'destination': '/studio/index.html'},
                           # Q6: shared story links; the app opens them when installed, otherwise this page.
                           {'source': '/story/**', 'destination': '/story.html'}]}}
    (OUTPUT / 'firebase.json').write_text(json.dumps(config, indent=2), encoding='utf-8')
    print(f'Public site built: {PUBLIC}')

if __name__ == '__main__':
    build()
