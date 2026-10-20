import tempfile
import unittest
from pathlib import Path
from verify_service_device_tests import CLASS, EXPECTED, verify


class ServiceDeviceReportTest(unittest.TestCase):
    def report(self, body):
        with tempfile.TemporaryDirectory() as directory:
            Path(directory, 'TEST-device.xml').write_text(body)
            return verify(directory)

    def cases(self):
        return ''.join(f'<testcase classname="{CLASS}" name="{name}" />' for name in sorted(EXPECTED))

    def test_all_three_pass(self):
        self.assertTrue(self.report('<testsuite>' + self.cases() + '</testsuite>')['passed'])

    def test_skipped_failed_or_errored_test_rejected(self):
        for tag in ('skipped', 'failure', 'error'):
            with self.subTest(tag=tag):
                cases = self.cases().replace(' />', f'><{tag}/></testcase>', 1)
                self.assertFalse(self.report('<testsuite>' + cases + '</testsuite>')['passed'])

    def test_missing_duplicate_and_unexpected_test_rejected(self):
        cases = self.cases()
        for body in ('', cases + cases, cases.replace(CLASS, 'WrongClass', 1), cases.replace(next(iter(EXPECTED)), 'wrongTest')):
            self.assertFalse(self.report('<testsuite>' + body + '</testsuite>')['passed'])

    def test_missing_xml_and_malformed_xml_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            self.assertFalse(verify(directory)['passed'])
        self.assertFalse(self.report('<incomplete')['passed'])

    def test_suite_failure_without_case_rejected(self):
        self.assertFalse(self.report('<testsuite failures="1">' + self.cases() + '</testsuite>')['passed'])


if __name__ == '__main__':
    unittest.main()
