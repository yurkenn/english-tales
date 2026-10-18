"""Validate Claude's content drafts and merge all language maps into the offline catalog.

Stable English text, IDs, revisions, covers and legacy Turkish fields are preserved.
The same maps are accepted by the backend's existing catalog exporter/editor.
"""
import argparse
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / 'native-android/app/src/main/assets/catalog/v1.json'
DRAFTS = ROOT / 'native-android/backend/content/translations'
LANGUAGES = ('es-419', 'pt-BR', 'id', 'ar', 'vi', 'hi', 'ru', 'bn', 'ur', 'th')


def build(catalog, drafts):
    # Deep copy so validation never partially mutates the caller's input.
    catalog = json.loads(json.dumps(catalog))
    words = {w['id']: w for w in catalog['words']}
    stories = {s['id']: s for s in catalog['stories']}
    tags = {t['id']: t for t in catalog['tags']}
    for lang in LANGUAGES:
        draft = drafts[lang]
        assert draft['lang'] == lang, f'{lang}: wrong language'
        assert set(draft['words']) == set(words), f'{lang}: word IDs differ'
        assert set(draft['stories']) == set(stories), f'{lang}: story IDs differ'
        assert set(draft['tags']) == set(tags), f'{lang}: tag IDs differ'
        assert set(draft['genres']) == {s['genre'] for s in stories.values()}, f'{lang}: genres differ'
        def text(value):
            assert isinstance(value, str) and value.strip(), f'{lang}: empty translation'
            assert '\ufffd' not in value and '\x00' not in value, f'{lang}: corrupt text'
            return value
        for key, word in words.items():
            word.setdefault('translations', {})[lang] = text(draft['words'][key])
        for key, story in stories.items():
            translated = draft['stories'][key]
            story.setdefault('descriptions', {})[lang] = text(translated['description'])
            assert set(translated['sentences']) == {s['id'] for s in story['sentences']}, f'{lang}/{key}: sentence IDs differ'
            for sentence in story['sentences']:
                sentence.setdefault('translations', {})[lang] = text(translated['sentences'][sentence['id']])
        for key, tag in tags.items():
            tag.setdefault('names', {})[lang] = text(draft['tags'][key])
    return catalog


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    catalog = json.loads(CATALOG.read_text('utf-8'))
    output = build(catalog, {lang: json.loads((DRAFTS / f'{lang}.json').read_text('utf-8')) for lang in LANGUAGES})
    if args.check:
        assert output == catalog, 'Bundled translations are stale: run python tooling/build_translations.py'
    else:
        CATALOG.write_text(json.dumps(output, ensure_ascii=False, indent=2) + '\n', 'utf-8')
    print(f'{len(LANGUAGES)} languages: {len(output["stories"])} stories, '
          f'{sum(len(s["sentences"]) for s in output["stories"])} sentences, {len(output["words"])} words each')
