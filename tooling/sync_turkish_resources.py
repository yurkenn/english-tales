"""Mirror canonical Turkish strings into an explicit locale, preventing secondary-English fallback."""
import argparse
from copy import deepcopy
from pathlib import Path
import xml.etree.ElementTree as ET

RES = Path(__file__).resolve().parents[1] / 'native-android/app/src/main/res'


def expected_resources():
    files = {}
    for source in sorted((RES / 'values').glob('*.xml')):
        root = ET.Element('resources')
        root.append(ET.Comment(' Generated from values: python tooling/sync_turkish_resources.py '))
        for node in ET.parse(source).getroot():
            if node.tag in ('string', 'plurals') and node.get('translatable') != 'false':
                root.append(deepcopy(node))
        if len(root) == 1:
            continue
        ET.indent(root, space='    ')
        files[source.name] = ET.tostring(root, encoding='unicode', xml_declaration=True) + '\n'
    return files


def sync(check=False):
    target = RES / 'values-tr'
    expected = expected_resources()
    if not check:
        target.mkdir(exist_ok=True)
    for name, text in expected.items():
        if check:
            assert (target / name).read_text('utf-8') == text, f'Turkish resource mirror is stale: {name}'
        else:
            (target / name).write_text(text, 'utf-8')
    assert {p.name for p in target.glob('*.xml')} == set(expected), 'Unexpected Turkish resource file'


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true')
    sync(parser.parse_args().check)
    print('Explicit Turkish locale matches canonical resources')
