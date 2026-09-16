"""Verify an offline source pack and optionally extract it into a new folder."""
import argparse
import hashlib
import json
import pathlib
import zipfile

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('pack', type=pathlib.Path)
parser.add_argument('--extract', type=pathlib.Path)
args = parser.parse_args()
manifest = json.loads((args.pack / 'manifest.json').read_text(encoding='utf-8'))
assert manifest['format'] == 1, 'Unsupported manifest'
assert manifest['archive']['name'] == 'FactFind-Pro-source.zip', 'Unexpected archive path'
archive = args.pack / manifest['archive']['name']
assert hashlib.sha256(archive.read_bytes()).hexdigest() == manifest['archive']['sha256'], 'Archive checksum mismatch'
expected = {'FactFind-Pro/' + item['path']: item for item in manifest['files']}
with zipfile.ZipFile(archive) as zipped:
    actual = {info.filename: info for info in zipped.infolist() if not info.is_dir()}
    assert set(actual) == set(expected), 'Archive contents do not match the manifest'
    for name, info in actual.items():
        assert not pathlib.PurePosixPath(name).is_absolute() and '..' not in pathlib.PurePosixPath(name).parts, 'Unsafe path'
        assert '\\' not in name and ':' not in name, 'Unsafe path'
        assert (info.external_attr >> 16) & 0o170000 != 0o120000, 'Symlink is not allowed'
        data = zipped.read(info)
        assert len(data) == expected[name]['bytes'], 'File size mismatch'
        assert hashlib.sha256(data).hexdigest() == expected[name]['sha256'], 'File checksum mismatch'
    if args.extract:
        assert not args.extract.exists(), 'Extraction directory must be new'
        args.extract.mkdir(parents=True)
        # Write verified files explicitly; no unvalidated directory entries are extracted.
        for name, info in actual.items():
            target = args.extract.joinpath(*pathlib.PurePosixPath(name).parts)
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(zipped.read(info))
print(json.dumps({'verified_commit': manifest['commit'], 'files': len(expected), 'extracted': bool(args.extract)}))
