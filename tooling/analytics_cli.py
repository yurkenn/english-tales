#!/usr/bin/env python3
"""Google Analytics acceptance checks using a separate, local gcloud OAuth session."""
import argparse
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import urllib.error
import urllib.parse
import urllib.request

ADMIN = "https://analyticsadmin.googleapis.com/v1beta"
DATA = "https://analyticsdata.googleapis.com/v1beta"
READ = "https://www.googleapis.com/auth/analytics.readonly"
EDIT = "https://www.googleapis.com/auth/analytics.edit"


class AccessError(RuntimeError):
    pass


class Analytics:
    def __init__(self, token, property_id, stream_id="6404716366"):
        if not all(re.fullmatch(r"[0-9]+", value) for value in (property_id, stream_id)):
            raise AccessError("Property and stream IDs must contain only digits.")
        self.stream = stream_id
        self.token = token
        self.property = f"properties/{property_id}"

    def request(self, base, resource, body=None):
        data = None if body is None else json.dumps(body).encode()
        req = urllib.request.Request(
            f"{base}/{resource}", data=data,
            headers={"Authorization": f"Bearer {self.token}",
                     "Content-Type": "application/json"},
        )
        try:
            with urllib.request.urlopen(req, timeout=30) as response:
                return json.load(response)
        except urllib.error.HTTPError as exc:
            # Only expose Google's structured error codes, never raw response/token data.
            try:
                error = json.load(exc).get("error", {})
                status = error.get("status", "API_ERROR")
                reasons = [d.get("reason", "") for d in error.get("details", [])]
                label = " ".join(str(v) for v in [status, *reasons])
                label = re.sub(r"[^A-Z_ ]", "", label)[:160]
            except (ValueError, AttributeError, TypeError):
                label = "API_ERROR"
            raise AccessError(f"Google Analytics HTTP {exc.code}: {label}") from None
        except (urllib.error.URLError, TimeoutError):
            raise AccessError("Google Analytics network request failed.") from None

    def ensure_mode(self):
        page_token = None
        while True:
            suffix = f"?pageToken={urllib.parse.quote(page_token, safe='')}" if page_token else ""
            page = self.request(ADMIN, f"{self.property}/customDimensions{suffix}")
            for dimension in page.get("customDimensions", []):
                if dimension.get("parameterName") == "mode" and dimension.get("scope") == "EVENT":
                    return {"created": False, "dimension": dimension}
            page_token = page.get("nextPageToken")
            if not page_token:
                break
        dimension = self.request(ADMIN, f"{self.property}/customDimensions", {
            "parameterName": "mode", "displayName": "Practice mode", "scope": "EVENT",
            "description": "practice_completed: choice, card, match, spell",
        })
        return {"created": True, "dimension": dimension}

    def inspect(self):
        return {
            "property": self.request(ADMIN, self.property),
            "retention": self.request(ADMIN, f"{self.property}/dataRetentionSettings"),
            "streams": self.request(ADMIN, f"{self.property}/dataStreams"),
            "realtime": self.request(DATA, f"{self.property}:runRealtimeReport", {
                "dimensions": [{"name": "eventName"}],
                "metrics": [{"name": "eventCount"}],
                "dimensionFilter": {"filter": {"fieldName": "streamId", "stringFilter": {
                    "matchType": "EXACT", "value": self.stream}}},
                "limit": "100",
            }),
            "note": "Realtime is filtered to the English Tales Android stream. Empty results do not prove consent behavior or successful SDK delivery.",
        }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--gcloud", default="gcloud", help="Path to Google Cloud CLI")
    parser.add_argument("--config-dir", type=Path, required=True,
                        help="Dedicated private directory OUTSIDE any Git checkout")
    parser.add_argument("--property", default="400061574")
    parser.add_argument("--stream", default="6404716366")
    commands = parser.add_subparsers(dest="command", required=True)
    login = commands.add_parser("login", help="Interactive Google consent; opens local browser")
    login.add_argument("--client-id-file", type=Path, required=True)
    login.add_argument("--allow-edit", action="store_true", help="Also authorize mode dimension creation")
    commands.add_parser("inspect", help="Read property, retention, streams and Android realtime")
    commands.add_parser("ensure-practice-mode", help="Create EVENT mode only if absent; needs edit consent")
    args = parser.parse_args()
    executable = shutil.which(args.gcloud)
    if executable is None:
        raise AccessError("gcloud is missing; install Google Cloud CLI or pass --gcloud PATH.")
    config = args.config_dir.expanduser().resolve()
    if any((p / '.git').exists() for p in [config, *config.parents]):
        raise AccessError("Choose a config directory outside a Git checkout.")
    config.mkdir(mode=0o700, parents=True, exist_ok=True)
    config.chmod(0o700)
    env = {**os.environ, "CLOUDSDK_CONFIG": str(config),
           "CLOUDSDK_CORE_DISABLE_USAGE_REPORTING": "true"}
    if args.command == "login":
        try:
            client = json.loads(args.client_id_file.expanduser().read_text())
            if not client.get("installed", {}).get("client_id"):
                raise ValueError()
        except (OSError, ValueError, AttributeError):
            raise AccessError("Provide a Google Desktop OAuth client JSON (installed client).") from None
        scopes = READ + ("," + EDIT if args.allow_edit else "")
        return subprocess.call([executable, "auth", "application-default", "login",
            f"--client-id-file={args.client_id_file.expanduser().resolve()}",
            f"--scopes={scopes}", "--disable-quota-project"], env=env)
    result = subprocess.run([executable, "auth", "application-default", "print-access-token"],
                            env=env, capture_output=True, text=True)
    token = result.stdout.strip()
    if result.returncode or not token:
        raise AccessError("No usable Analytics session. Run login first; no credentials were printed.")
    api = Analytics(token, args.property, args.stream)
    output = api.inspect() if args.command == "inspect" else api.ensure_mode()
    print(json.dumps(output, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except (AccessError, OSError) as exc:
        print(f"Analytics CLI: {exc}", file=sys.stderr)
        sys.exit(1)
