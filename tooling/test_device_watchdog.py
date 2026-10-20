import unittest
from run_android_device_tests import startup_event


class StartupEventTest(unittest.TestCase):
    def test_only_an_active_first_launch_test_is_watched(self):
        for name in ('FirstLaunchJourneyTest', 'FirstLaunchReadinessTest'):
            line = f'started: journey(com.yurken.englishtales.{name})'
            self.assertEqual(line, startup_event(line))
            self.assertIsNone(startup_event(line + '\n' + line.replace('started:', 'finished:')))

    def test_another_test_after_startup_disarms_watchdog(self):
        self.assertIsNone(startup_event('started: first(FirstLaunchJourneyTest)\nfinished: first(FirstLaunchJourneyTest)\nstarted: next(AnotherTest)'))

    def test_run_status_and_unrelated_output_do_not_arm_watchdog(self):
        self.assertIsNone(startup_event('run started: 337 tests\nOther log line'))


if __name__ == '__main__':
    unittest.main()
