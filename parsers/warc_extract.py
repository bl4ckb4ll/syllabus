#!/usr/bin/env ithon
"""Extract one replayable payload from a WARC file.

This is deliberately standard-library-only Python-compatible source. Repository
CI executes it with the pinned Ithon native build, never the runner's stock
Python interpreter.
"""

import argparse
import hashlib
import json
from pathlib import Path


def read_line(stream):
    line = stream.readline()
    if line == b"":
        return None
    return line.rstrip(b"\r\n")


def read_headers(stream):
    headers = {}
    while True:
        line = read_line(stream)
        if line is None:
            raise ValueError("truncated WARC headers")
        if line == b"":
            return headers
        if b":" not in line:
            raise ValueError("malformed WARC header: " + repr(line))
        key, value = line.split(b":", 1)
        headers[key.decode("ascii").strip().lower()] = value.decode("utf-8").strip()


def response_payload(content):
    if not content.startswith(b"HTTP/"):
        raise ValueError("WARC response record does not begin with an HTTP status line")
    for marker in (b"\r\n\r\n", b"\n\n"):
        pos = content.find(marker)
        if pos >= 0:
            return content[pos + len(marker):]
    raise ValueError("HTTP response headers are not terminated")


def records(path):
    with path.open("rb") as stream:
        while True:
            version = read_line(stream)
            while version == b"":
                version = read_line(stream)
            if version is None:
                return
            if not version.startswith(b"WARC/1."):
                raise ValueError("expected WARC version line, got " + repr(version))

            headers = read_headers(stream)
            if "content-length" not in headers:
                raise ValueError("WARC record has no Content-Length")
            length = int(headers["content-length"])
            content = stream.read(length)
            if len(content) != length:
                raise ValueError("truncated WARC record body")

            while True:
                pos = stream.tell()
                line = stream.readline()
                if line in (b"\r\n", b"\n"):
                    continue
                stream.seek(pos)
                break

            record_type = headers.get("warc-type", "")
            if record_type == "response":
                payload = response_payload(content)
            elif record_type == "resource":
                payload = content
            else:
                payload = None
            yield headers, payload


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    parser.add_argument("--uri", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--receipt")
    args = parser.parse_args()

    source = Path(args.input)
    wanted = args.uri
    matches = []
    for headers, payload in records(source):
        if headers.get("warc-target-uri") == wanted and payload is not None:
            matches.append((headers, payload))

    if len(matches) != 1:
        raise SystemExit("expected exactly one replayable WARC record for %s; found %d" % (wanted, len(matches)))

    headers, payload = matches[0]
    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_bytes(payload)

    if args.receipt:
        receipt = {
            "source_warc": str(source),
            "source_warc_sha256": hashlib.sha256(source.read_bytes()).hexdigest(),
            "warc_target_uri": wanted,
            "warc_record_id": headers.get("warc-record-id"),
            "output": str(output),
            "output_sha256": hashlib.sha256(payload).hexdigest(),
            "bytes": len(payload),
        }
        Path(args.receipt).write_text(json.dumps(receipt, sort_keys=True, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
