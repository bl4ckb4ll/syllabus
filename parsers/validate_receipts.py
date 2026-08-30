#!/usr/bin/env ithon
"""Cheap structural validation for every committed crawl receipt."""

import argparse
import json
from pathlib import Path
import re

SHA40 = re.compile(r"^[0-9a-f]{40}$")
SHA256 = re.compile(r"^[0-9a-f]{64}$")
GENERAL = {"schema", "run_id", "event", "status", "recorded_at", "repository", "tool", "script"}
EVENTS = {"run_start", "coverage_assertion", "fetch", "parse", "replay", "run_end"}
STATUSES = {"PASS", "FAIL", "SKIP"}


def fail(path, line_no, message):
    raise ValueError(f"{path}:{line_no}: {message}")


def require_sha256(path, line_no, value, label):
    if not SHA256.fullmatch(value or ""):
        fail(path, line_no, label + " is not a SHA-256")


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
    if not SHA40.fullmatch(tool.get("commit", "")):
        fail(path, line_no, "tool commit is not a full SHA")

    if record["event"] == "fetch":
        if not record.get("url"):
            fail(path, line_no, "fetch has no URL")
        if tool.get("name") != "icu" or tool.get("repository") != "dilapidated-shed/icu":
            fail(path, line_no, "fetch receipt is not pinned to ICU")
        require_sha256(path, line_no, tool.get("binary_sha256"), "ICU binary hash")
        if record["status"] in {"PASS", "SKIP"}:
            output = record.get("output") or {}
            if not output.get("path"):
                fail(path, line_no, "successful fetch has no output path")
            require_sha256(path, line_no, output.get("sha256"), "fetch output hash")

    if record["event"] == "parse":
        if tool.get("name") != "ithon" or tool.get("repository") != "dilapidated-shed/ithon":
            fail(path, line_no, "parse receipt is not pinned to Ithon")
        require_sha256(path, line_no, tool.get("binary_sha256"), "Ithon binary hash")
        if not record.get("source_uri"):
            fail(path, line_no, "parse has no source URI")
        input_record = record.get("input") or {}
        if not input_record.get("path"):
            fail(path, line_no, "parse has no input path")
        require_sha256(path, line_no, input_record.get("sha256"), "parse input hash")
        if record["status"] == "PASS":
            output = record.get("output") or {}
            if not output.get("path"):
                fail(path, line_no, "successful parse has no output path")
            require_sha256(path, line_no, output.get("sha256"), "parse output hash")


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
