# Builds the Bible cross-references for the app.
# Run: mkdir -p out && python3 scripts/build-crossrefs.py   → out/crossrefs.json
# Then copy it to the afm-church repo under bible/ (served at theafmchurch.org/bible).
#
# Source: OpenBible.info cross references (openbible.info/labs/cross-references), CC BY, built from the
# Treasury of Scripture Knowledge (public domain) and ranked by readers' votes. Credited in the app.
#
# crossrefs.json: {"books": [ book [ chapter [ verse [ ref, ... ] ] ] ]}, best first, at most 25 per verse.
#   ref: book * 1_000_000 + chapter * 1000 + verse (book 0 = Genesis), or [start, end] for a passage.
import io, json, subprocess, zipfile

BOOKS = ('Gen Exod Lev Num Deut Josh Judg Ruth 1Sam 2Sam 1Kgs 2Kgs 1Chr 2Chr Ezra Neh Esth Job Ps Prov Eccl Song Isa Jer '
         'Lam Ezek Dan Hos Joel Amos Obad Jonah Mic Nah Hab Zeph Hag Zech Mal Matt Mark Luke John Acts Rom 1Cor 2Cor Gal Eph '
         'Phil Col 1Thess 2Thess 1Tim 2Tim Titus Phlm Heb Jas 1Pet 2Pet 1John 2John 3John Jude Rev').split()
INDEX = {b: i for i, b in enumerate(BOOKS)}
PER_VERSE = 25

def code(ref):
    b, c, v = ref.split('.')
    return INDEX[b] * 1_000_000 + int(c) * 1000 + int(v)

raw = subprocess.run(['curl', '-sSfL', 'https://a.openbible.info/data/cross-references.zip'], capture_output=True, check=True).stdout
text = zipfile.ZipFile(io.BytesIO(raw)).read('cross_references.txt').decode('utf-8')
refs = {}
for line in text.splitlines()[1:]:
    src, dst, votes = line.split('\t')
    if int(votes) < 1:
        continue  # readers found it unhelpful
    parts = dst.split('-')
    to = code(parts[0]) if len(parts) == 1 else [code(parts[0]), code(parts[1])]
    refs.setdefault(code(src), []).append((int(votes), to))

books = [[] for _ in BOOKS]
total = 0
for at, lst in refs.items():
    b, c, v = at // 1_000_000, (at % 1_000_000) // 1000, at % 1000
    chapters = books[b]
    while len(chapters) < c: chapters.append([])
    verses = chapters[c - 1]
    while len(verses) < v: verses.append([])
    best = [to for _, to in sorted(lst, key=lambda x: -x[0])[:PER_VERSE]]
    verses[v - 1] = best
    total += len(best)
json.dump({'books': books}, open('out/crossrefs.json', 'w'), separators=(',', ':'))
print('crossrefs.json:', total, 'references for', len(refs), 'verses')
