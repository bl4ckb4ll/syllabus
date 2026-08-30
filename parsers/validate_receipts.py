#!/usr/bin/env ithon
"""Cheap structural validation for every committed crawl receipt."""

import argparse
import json
from pathlib import Path
import re

SHA40 = re.compile(r"^[0-9a-f]{40}$")
SHA256 = re.compile(r"^[0-9a-f]{64}$")
GENERAL = {"schema", "run_id", "event", "status", "recorded_at", "repository", "tool", "script"}
EVENTS = {"run_start", "fetch", "parse", "replay", "run_end"}
STATUSES = {"PASS", "FAIL", "SKIP"}


def fail(path, line_no, message):
    raise ValueError(f"{path}:{line_no}: {message}")


def validate_record(path, line_no, record):
    missing = GENERAL - set(record)
    if missing:
        fail(path, line_no, "missing keys: " + ", ".join(sorted(missing)))
    if record["schema"] != 1:
        fail(path, line_no, "unsupported schema")
    if record["event"] not in EVENTS:
        fail(path, line_no, "bad event")
    if record["status"] not in STATUSES:
        fail(path, line_no, "bad status")

    repository = record["repository"]
    if repository.get("name") != "isomorphisms/syllabi":
        fail(path, line_no, "wrong repository name")
    if not SHA40.fullmatch(repository.get("commit", "")):
        fail(path, line_no, "repository commit is not a full SHA")

    script = record["script"]
    if not SHA40.fullmatch(script.get("blob", "")):
        fail(path, line_no, "script blob is not a Git SHA")

    tool = record["tool"]
    if not isinstance(tool.get("argv"), list):
        fail(path, line_no, "tool argv must be a list")

    if record["event"] == "fetch":
        if not record.get("url"):
            fail(path, line_no, "fetch has no URL")
        if record["status"] in {"PASS", "SKIP"}:
            output = record.get("output") or {}
            if not output.get("path"):
                fail(path, line_no, "successful fetch has no output path")
            if not SHA256.fullmatch(output.get("sha256") or ""):
                fail(path, line_no, "successful fetch has no SHA-256")
        if tool.get("name") != "icu":
            fail(path, line_no, "fetch receipt is not ICU")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("root", nargs="?", default="crawling log")
    args = parser.parse_args()

    root = Path(args.root)
    files = sorted(root.rglob("*.ndjson"))
    records = 0
    for path in files:
        for line_no, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
            if not line.strip():
                continue
            try:
                record = json.loads(line)
            except json.JSONDecodeError as exc:
                fail(path, line_no, "invalid JSON: " + str(exc))
            validate_record(path, line_no, record)
            records += 1
    print(f"PASS receipts: {records} records in {len(files)} files")


if __name__ == "__main__":
    main()
