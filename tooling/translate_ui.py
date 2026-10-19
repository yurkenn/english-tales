"""Explicit, resumable authoring tool; never used by the application or a normal build.

Only repository UI copy is submitted for machine translation. No accounts, stories,
credentials or user data are sent. Outputs require editorial review before a store release.
"""
import argparse
import concurrent.futures
import json
from pathlib import Path
import re
import time
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
RES = ROOT / 'native-android/app/src/main/res'
LANGUAGES = {'es-419': ('es', 'values-b+es+419'), 'pt-BR': ('pt', 'values-pt-rBR'),
             'id': ('id', 'values-in'), 'ar': ('ar', 'values-ar'), 'vi': ('vi', 'values-vi'),
             'hi': ('hi', 'values-hi'), 'ru': ('ru', 'values-ru'), 'bn': ('bn', 'values-bn'),
             'ur': ('ur', 'values-ur'), 'th': ('th', 'values-th')}
QUANTITIES = {'es-419': ('one', 'many', 'other'), 'pt-BR': ('one', 'many', 'other'),
              'id': ('other',), 'ar': ('zero', 'one', 'two', 'few', 'many', 'other'),
              'vi': ('other',), 'hi': ('one', 'other'), 'ru': ('one', 'few', 'many', 'other'),
              'bn': ('one', 'other'), 'ur': ('one', 'other'), 'th': ('other',)}
TOKEN = re.compile(r'%\d+\$[sdf]|%%|\\[ntr]|A1|A2|B1|English Tales|Google|TalkBack|FSRS')


def protect(text):
    markers = {}
    def replace(match):
        key = f'ZXQ{len(markers)}QXZ'
        markers[key] = match.group()
        return key
    return TOKEN.sub(replace, text.replace("\\'", "'").replace('\\"', '"')), markers


def translate_batch(texts, target):
    protected = [protect(s) for s in texts]
    params = [('client', 'dict-chrome-ex'), ('sl', 'en'), ('tl', target)]
    params += [('q', s) for s, _ in protected]
    url = 'https://translate.google.com/translate_a/t?' + urllib.parse.urlencode(params)
    for attempt in range(3):
        try:
            request = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(request, timeout=30) as response:
                translated = json.load(response)
            if not isinstance(translated, list) or len(translated) != len(texts):
                raise ValueError('Translation response count mismatch')
            result = []
            for source, value, (_, markers) in zip(texts, translated, protected):
                if not isinstance(value, str) or not value.strip():
                    raise ValueError('Empty translation')
                for key, token in markers.items():
                    if value.count(key) != 1:
                        raise ValueError(f'Lost protected token: {key}')
                    value = value.replace(key, token)
                # Apostrophes and quotes are special to aapt even inside XML text.
                value = value.replace("'", "\\'").replace('"', '\\"')
                if sorted(re.findall(r'%\d+\$[sdf]|%%', source)) != sorted(re.findall(r'%\d+\$[sdf]|%%', value)):
                    raise ValueError('Format arguments changed')
                result.append(value)
            return result
        except Exception:
            if attempt == 2:
                raise
            time.sleep(2 ** attempt)


def generate(lang):
    target, directory = LANGUAGES[lang]
    cache_path = ROOT / f'native-android/build/localization/{lang}.json'
    cache_path.parent.mkdir(parents=True, exist_ok=True)
    cache = json.loads(cache_path.read_text('utf-8')) if cache_path.exists() else {}
    sources = sorted({node.text or '' for file in (RES / 'values-en').glob('*.xml')
                      for node in ET.parse(file).getroot().iter()
                      if node.tag in ('string', 'item') and node.get('translatable') != 'false'})
    pending = [s for s in sources if s not in cache]
    while pending:
        batch, size = [], 0
        while pending and len(batch) < 18 and (not batch or size + len(pending[0]) < 1800):
            text = pending.pop(0)
            batch.append(text)
            size += len(text)
        try:
            values = translate_batch(batch, target)
        except Exception:
            # Some translators alter a marker only in longer context; isolate that request.
            values = [translate_batch([text], target)[0] for text in batch]
        cache.update(zip(batch, values))
        cache_path.write_text(json.dumps(cache, ensure_ascii=False, indent=2), 'utf-8')
        print(f'{lang}: {len(cache)}/{len(sources)}', flush=True)
    destination = RES / directory
    destination.mkdir(exist_ok=True)
    overrides = json.loads((ROOT / 'native-android/backend/content/translations/ui-overrides.json').read_text('utf-8'))[lang]
    for source in sorted((RES / 'values-en').glob('*.xml')):
        tree = ET.parse(source)
        for parent in tree.getroot():
            if parent.tag == 'string' and parent.get('translatable') != 'false':
                parent.text = overrides.get(parent.get('name'), cache[parent.text or ''])
            elif parent.tag == 'plurals':
                # Count-labelled editorial overrides avoid gender/number ambiguity in every category.
                originals = {x.get('quantity'): cache[x.text or ''] for x in parent}
                for child in list(parent):
                    parent.remove(child)
                for quantity in QUANTITIES[lang]:
                    ET.SubElement(parent, 'item', quantity=quantity).text = overrides.get(parent.get('name'), originals.get(quantity, originals['other']))
        for node in tree.getroot().iter():
            if node.tag in ('string', 'item') and node.text:
                node.text = node.text.replace('...', '…')
                node.text = re.sub(r"\\+(['\"])", lambda match: '\\' + match.group(1), node.text)
                if lang in ('ar', 'ur'):
                    # Keep numerator/denominator order in RTL goals, quiz counts and widget labels.
                    node.text = re.sub(r'(%[1-9]\d*\$[sd]\s*/\s*(?:%[1-9]\d*\$[sd]|[0-9]+))',
                                       lambda match: '\u2066' + match.group(1) + '\u2069', node.text)
        ET.indent(tree, space='    ')
        tree.write(destination / source.name, encoding='utf-8', xml_declaration=True)
    print(f'{lang}: resources written', flush=True)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--languages', nargs='+', choices=LANGUAGES, default=list(LANGUAGES))
    args = parser.parse_args()
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
        list(pool.map(generate, args.languages))
