"""Inspect captured PDFs after npm run test:email-flow. Requires pypdf and pdfplumber."""
import argparse
import json
import re
import subprocess
from pathlib import Path
from pypdf import PdfReader
import pdfplumber

root = Path(__file__).resolve().parents[1]
source = root / 'test-results/email-e2e'
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--render-dir', type=Path, help='Also render representative copies using pdftoppm')
parser.add_argument('--pdf-dir', type=Path, help='Inspect PDFs rendered directly from the component during layout development')
args = parser.parse_args()
if args.render_dir:
    args.render_dir.mkdir(parents=True, exist_ok=True)
compact = lambda value: re.sub(r'\s+', '', value).replace('\u200b', '').lower()
internal = {'adviser_name', 'date_of_appointment', 'source', 'if_other_please_specify_source_details'}
results = []
saved_files = list(source.glob('detailed-*/*-saved.json'))
assert len(saved_files) == 4, 'Run npm run test:email-flow first to capture all four detailed journeys.'
for saved_file in saved_files:
    saved = json.loads(saved_file.read_text(encoding='utf-8'))
    kind = saved_file.name.replace('-saved.json', '')
    for audience in ['client', 'adviser']:
        path = (args.pdf_dir or saved_file.parent) / f'{kind}-{audience}.pdf'
        reader = PdfReader(path)
        texts = [page.extract_text() for page in reader.pages]
        with pdfplumber.open(path) as document:
            # Remove repeated page furniture before matching an answer split across pages.
            bodies = [page.crop((0, 85, page.width, page.height - 56)).extract_text() or '' for page in document.pages]
            text = compact('\n'.join(bodies))
            titles = {step['title'] for step in saved['submission_data']['steps']}
            for index, body in enumerate(bodies):
                assert body.strip().splitlines()[-1] not in titles, (kind, audience, 'orphaned section heading', index + 1)
            # Group separately styled words so a small follow-up label laid over
            # a larger answer cannot disappear inside one extracted text string.
            for index, page in enumerate(document.pages):
                words = sorted(page.extract_words(extra_attrs=['fontname', 'size']), key=lambda word: word['top'])
                for number, word in enumerate(words):
                    for other in words[number + 1:]:
                        if other['top'] >= word['bottom'] - 1:
                            break
                        width = min(word['x1'], other['x1']) - max(word['x0'], other['x0'])
                        height = min(word['bottom'], other['bottom']) - max(word['top'], other['top'])
                        assert width <= 1 or height <= 1, (kind, audience, 'overlapping text', index + 1, word['text'], other['text'])
        answers = [answer for step in saved['submission_data']['steps'] for answer in step['answers']]
        if audience == 'client':
            answers = [a for a in answers if a['id'] not in internal and not a['id'].startswith('admin_')]
            assert 'private-internal-note' not in text
            assert 'private-adviser-entry' not in text
            assert 'private-client-source' not in text
        missing = [a['id'] for a in answers if compact(a['display']) not in text]
        assert not missing, (kind, audience, missing)
        assert all(f'Page {index+1} of {len(texts)}' in page for index, page in enumerate(texts))
        assert str(reader.metadata['/Author'].get_object()) == 'Morgan Financial'
        overflow = []
        with pdfplumber.open(path) as document:
            for index, page in enumerate(document.pages):
                outside = [char for char in page.chars if char['text'].strip() and (char['x0'] < 38 or char['x1'] > page.width - 38)]
                if outside: overflow.append({'page': index+1, 'characters': ''.join(c['text'] for c in outside)})
        assert not overflow, (kind, audience, 'text outside page margins', overflow)
        results.append({'form': kind, 'audience': audience, 'pages': len(texts), 'checkedAnswers': len(answers), 'allAnswersPresent': True, 'outsideMargins': overflow, 'orphanedHeadings': False, 'overlappingText': False})
        if args.render_dir and (audience == 'client' or kind == 'mortgage'):
            subprocess.run(['pdftoppm', '-png', '-scale-to', '1400', str(path), str(args.render_dir / f'{kind}-{audience}')], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

private_files = list(source.glob('automatic-*/*-private-check.pdf'))
assert len(private_files) == 6, 'Automatic/manual privacy fixtures are missing.'
for path in private_files:
    text = compact('\n'.join(page.extract_text() for page in PdfReader(path).pages))
    for marker in ['PRIVATE-INTERNAL-NOTE', 'PRIVATE-ADVISER-ENTRY', 'PRIVATE-CLIENT-SOURCE']:
        assert (compact(marker) in text) == ('-adviser-' in path.name), (path.name, marker)
    if path.name.startswith('mortgage-'):
        assert 'public-bankruptcy-details' in text, path.name
report = {'detailedPdfs': results, 'automaticAndManualPrivacyPdfs': len(private_files)}
(root / 'test-results/pdf-content.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
print(json.dumps(report, indent=2))
