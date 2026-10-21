"""Fail closed unless the configured service probe executed all three checks."""
import argparse
import json
from pathlib import Path
import sys
import xml.etree.ElementTree as ET

CLASS = 'com.yurken.englishtales.data.ServiceDeviceTest'
EXPECTED = {
    'anotherAccountJobDoesNotUseCurrentCredentialsOrCreateItsDatabase',
    'repeatedSchedulingKeepsOneNetworkConstrainedPeriodicJob',
    'livePublishedContentDownloadsAndRestoresOffline',
}


def verify(directory):
    cases = []
    errors = []
    files = sorted(Path(directory).rglob('TEST-*.xml'))
    for path in files:
        try:
            root = ET.parse(path).getroot()
        except (ET.ParseError, OSError) as error:
            errors.append(f'{path.name}: {error}')
            continue
        for case in root.iter('testcase'):
            name = case.get('name', '')
            cases.append(name)
            if case.get('classname') != CLASS or name not in EXPECTED:
                errors.append(f'Unexpected test: {case.get("classname")}.{name}')
            if any(case.find(tag) is not None for tag in ('skipped', 'failure', 'error')):
                errors.append(f'Did not pass: {name}')
        for suite in root.iter('testsuite'):
            for field in ('failures', 'errors', 'skipped', 'disabled'):
                if suite.get(field, '0') not in ('0', '0.0', ''):
                    errors.append(f'{path.name}: {field}={suite.get(field)}')
    if not files:
        errors.append('No instrumentation XML reports found')
    for name in sorted(EXPECTED):
        if cases.count(name) != 1:
            errors.append(f'{name}: expected once, found {cases.count(name)}')
    return {'passed': not errors, 'expected': 3, 'executed': len(cases), 'errors': errors}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('directory', type=Path)
    parser.add_argument('--report', type=Path)
    args = parser.parse_args()
    result = verify(args.directory)
    output = json.dumps(result, indent=2) + '\n'
    if args.report:
        args.report.parent.mkdir(parents=True, exist_ok=True)
        args.report.write_text(output)
    print(output, end='')
    sys.exit(0 if result['passed'] else 1)
