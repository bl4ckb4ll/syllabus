"""Rebuild the static reader corpus from the inputs named by its provenance table."""
import argparse
from pathlib import Path
import subprocess
import sys
import tempfile

HERE = Path(__file__).resolve().parent


def run(script, inputs, output):
    subprocess.run([sys.executable, HERE / script, inputs, output], check=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('inputs', type=Path)
    parser.add_argument('output', type=Path)
    args = parser.parse_args()

    # Stage both sets before replacing files, so a missing input or a rejected
    # source version cannot overwrite the published table with a partial set.
    with tempfile.TemporaryDirectory() as temporary:
        base = Path(temporary) / 'base'
        mit = Path(temporary) / 'mit'
        run('prepare_texts.py', args.inputs, base)
        run('verify_text_coverage.py', args.inputs, base)
        run('prepare_mit_texts.py', args.inputs, mit)

        base_rows = (base / 'provenance.tsv').read_bytes().splitlines()
        mit_rows = (mit / 'provenance.tsv').read_bytes().splitlines()
        if base_rows[0] != mit_rows[0]:
            raise ValueError('The two extractors disagree on provenance fields')

        args.output.mkdir(parents=True, exist_ok=True)
        for source in [*base.glob('*.json'), *mit.glob('*.json')]:
            (args.output / source.name).write_bytes(source.read_bytes())
        combined = b'\n'.join([*base_rows, *mit_rows[1:]]) + b'\n'
        (args.output / 'provenance.tsv').write_bytes(combined)


if __name__ == '__main__':
    main()
