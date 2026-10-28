"""Offline checks for UI coverage, printf safety, plural categories and content completeness."""
import collections
import json
from pathlib import Path
import re
import xml.etree.ElementTree as ET
from build_translations import build, LANGUAGES, DRAFTS, CATALOG
from translate_ui import LANGUAGES as UI_LANGUAGES, QUANTITIES, RES
from sync_turkish_resources import sync

FORMAT = re.compile(r'%(?:\d+\$)?[sdf]|%%')


def resources(directory):
    result = {}
    for file in directory.glob('*.xml'):
        for node in ET.parse(file).getroot():
            if node.tag not in ('string', 'plurals') or node.get('translatable') == 'false':
                continue
            name = node.get('name')
            assert name not in result, f'{directory.name}/{name}: duplicate resource'
            result[name] = node
    return result


def main():
    sync(check=True)
    english = resources(RES / 'values-en')
    assert resources(RES / 'values').keys() == english.keys(), 'Turkish/English resource coverage differs'
    for lang, (_, directory) in UI_LANGUAGES.items():
        actual = resources(RES / directory)
        assert actual.keys() == english.keys(), f'{lang}: resource coverage differs: {actual.keys() ^ english.keys()}'
        for key, source in english.items():
            target = actual[key]
            assert source.tag == target.tag, f'{lang}/{key}: resource kind changed'
            originals = [source] if source.tag == 'string' else list(source)
            values = [target] if target.tag == 'string' else list(target)
            if source.tag == 'plurals':
                assert {x.get('quantity') for x in target} == set(QUANTITIES[lang]), f'{lang}/{key}: plural categories'
            formats = {tuple(sorted(FORMAT.findall(x.text or ''))) for x in originals}
            for value in values:
                text = value.text or ''
                assert text.strip() and '\ufffd' not in text and 'ZXQ' not in text, f'{lang}/{key}: empty/corrupt/unrestored text'
                assert not re.search(r"\\{2,}['\"]", text), f'{lang}/{key}: over-escaped quote'
                assert text.count('\u2066') == text.count('\u2069'), f'{lang}/{key}: unbalanced bidi isolation'
                assert tuple(sorted(FORMAT.findall(text))) in formats, f'{lang}/{key}: format arguments differ'
        print(f'{lang}: {len(actual)} UI resources, format arguments and plurals passed')
    catalog = json.loads(CATALOG.read_text('utf-8'))
    assert build(catalog, {lang: json.loads((DRAFTS / f'{lang}.json').read_text('utf-8')) for lang in LANGUAGES}) == catalog
    print(f'All 10 content packs complete: {len(catalog["stories"])} stories, {sum(len(s["sentences"]) for s in catalog["stories"])} sentences and {len(catalog["words"])} dictionary words per language')


if __name__ == '__main__':
    main()
