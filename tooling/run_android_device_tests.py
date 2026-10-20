"""Run CI device tests, capturing ART stacks instead of hanging indefinitely at first launch."""
import os
from pathlib import Path
import re
import subprocess
import sys
import time

ROOT = Path(__file__).resolve().parents[1]
ANDROID = ROOT / 'native-android'
EVIDENCE = ANDROID / 'build/device-watchdog'


def startup_event(log):
    events = [line for line in log.splitlines() if re.match(r'^(started|finished): ', line)]
    if not events:
        return None
    last = events[-1]
    if last.startswith('started: ') and any(name in last for name in ('FirstLaunchJourneyTest', 'FirstLaunchReadinessTest')):
        return last
    return None


def adb(*args, timeout=20):
    return subprocess.run(['adb', *args], capture_output=True, text=True, timeout=timeout)


def capture_stall():
    EVIDENCE.mkdir(parents=True, exist_ok=True)
    pid = adb('shell', 'pidof', 'com.yurken.englishtales').stdout.strip()
    if re.fullmatch(r'\d+', pid):
        adb('shell', 'kill', '-3', pid)
        time.sleep(3)
    for name, command in (
        ('logcat.txt', ('logcat', '-d', '-t', '5000')),
        ('activities.txt', ('shell', 'dumpsys', 'activity', 'activities')),
        ('processes.txt', ('shell', 'dumpsys', 'activity', 'processes')),
    ):
        result = adb(*command)
        (EVIDENCE / name).write_text(result.stdout + result.stderr)
    result = adb('pull', '/data/anr', str(EVIDENCE / 'anr'), timeout=30)
    (EVIDENCE / 'pull-anr.txt').write_text(result.stdout + result.stderr)


def main():
    if os.environ.get('CI') != 'true' or adb('shell', 'getprop', 'ro.kernel.qemu').stdout.strip() != '1':
        raise SystemExit('The watchdog only runs on the CI emulator')
    # The hosted google_apis image is userdebug; restart adbd before instrumentation starts.
    print(adb('root').stdout, flush=True)
    adb('wait-for-device', timeout=30).check_returncode()
    adb('logcat', '-c').check_returncode()
    process = subprocess.Popen(['bash', 'gradlew', ':app:connectedDebugAndroidTest'], cwd=ANDROID)
    event = None
    since = None
    try:
        while process.poll() is None:
            log = adb('logcat', '-d', '-v', 'raw', '-s', 'TestRunner:I').stdout
            current = startup_event(log)
            if current != event:
                event, since = current, time.monotonic() if current else None
            if since is not None and time.monotonic() - since >= 180:
                print(f'::error::First-launch watchdog: {event} exceeded 180 seconds; capturing ART stacks', flush=True)
                capture_stall()
                return 1
            time.sleep(5)
        return process.returncode
    finally:
        if process.poll() is None:
            process.terminate()
            try:
                process.wait(timeout=30)
            except subprocess.TimeoutExpired:
                process.kill()
                process.wait()


if __name__ == '__main__':
    sys.exit(main())
