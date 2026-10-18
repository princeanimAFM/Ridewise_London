# Builds the Bible versions for the app from eBible.org (public domain / CC BY-SA).
# Run: mkdir -p out && python3 scripts/build-bible.py   → out/<id>.json
# Then copy out/*.json to the afm-church repo under bible/ (served at theafmchurch.org/bible).
import json, re, zipfile, io, urllib.request, html, collections
USFM = 'GEN EXO LEV NUM DEU JOS JDG RUT 1SA 2SA 1KI 2KI 1CH 2CH EZR NEH EST JOB PSA PRO ECC SNG ISA JER LAM EZK DAN HOS JOL AMO OBA JON MIC NAM HAB ZEP HAG ZEC MAL MAT MRK LUK JHN ACT ROM 1CO 2CO GAL EPH PHP COL 1TH 2TH 1TI 2TI TIT PHM HEB JAS 1PE 2PE 1JN 2JN 3JN JUD REV'.split()
EN = ["Genesis","Exodus","Leviticus","Numbers","Deuteronomy","Joshua","Judges","Ruth","1 Samuel","2 Samuel","1 Kings","2 Kings","1 Chronicles","2 Chronicles","Ezra","Nehemiah","Esther","Job","Psalms","Proverbs","Ecclesiastes","Song of Solomon","Isaiah","Jeremiah","Lamentations","Ezekiel","Daniel","Hosea","Joel","Amos","Obadiah","Jonah","Micah","Nahum","Habakkuk","Zephaniah","Haggai","Zechariah","Malachi","Matthew","Mark","Luke","John","Acts","Romans","1 Corinthians","2 Corinthians","Galatians","Ephesians","Philippians","Colossians","1 Thessalonians","2 Thessalonians","1 Timothy","2 Timothy","Titus","Philemon","Hebrews","James","1 Peter","2 Peter","1 John","2 John","3 John","Jude","Revelation"]
# our id, eBible id, use local names
T = [('kjv','eng-kjv2006',False),('bsb','engbsb',False),('web','engwebp',False),('webbe','engwebpb',False),('asv','eng-asv',False),
     ('bbe','engBBE',False),('ylt','engylt',False),('dby','engDBY',False),('gnv','enggnv',False),
     ('lsv','englsv',False),('msb','engmsb',False),('rv','eng-rv',False),('webster','engwebster',False),('dra','engDRA',False),
     ('twi','twi',True),('asante','twiasante',True),('ewe','ewe',True),('hau','hausa',True),('lsg','fraLSG',True)]
ONLY = None
import sys
if len(sys.argv) > 1: ONLY = set(sys.argv[1:])
import subprocess
def get(url):
    return subprocess.run(['curl','-sSfL',url],capture_output=True,check=True).stdout
report={}
for tid, eid, local in T:
    if ONLY and tid not in ONLY: continue
    vpl = zipfile.ZipFile(io.BytesIO(get(f'https://ebible.org/Scriptures/{eid}_vpl.zip')))
    txt = [n for n in vpl.namelist() if n.endswith('_vpl.txt')][0]
    names = {}
    if local:
        u = zipfile.ZipFile(io.BytesIO(get(f'https://ebible.org/Scriptures/{eid}_usfx.zip')))
        bn = u.read('BookNames.xml').decode('utf-8-sig')
        for m in re.finditer(r'<book code="(\w+)"[^>]*short="([^"]*)"', bn): names[m.group(1)] = html.unescape(m.group(2)).strip()
    books, order = {}, []
    for line in vpl.read(txt).decode('utf-8-sig').splitlines():
        m = re.match(r'^(\S+) (\d+):(\d+) (.*)$', line)
        if not m: continue
        b, c, v, t = m.group(1), int(m.group(2)), int(m.group(3)), m.group(4)
        t = t.replace('¶', '')
        if tid in ('kjv', 'asv', 'ylt', 'dby', 'lsv', 'rv', 'webster'): t = t.replace('[', '').replace(']', '')
        if tid in ('bbe', 'dby'): t = t.replace('*', '')
        t = re.sub(r'\s+', ' ', t).strip()
        if tid == 'lsv': t = re.sub(r'\s*\|\|\s*', '\n', t)
        if b not in books: books[b] = {}; order.append(b)
        books[b].setdefault(c, {})[v] = t
    CANON = 'GEN EXO LEV NUM DEU JOS JDG RUT 1SA 2SA 1KI 2KI 1CH 2CH EZR NEH EST JOB PSA PRO ECC SOL ISA JER LAM EZE DAN HOS JOE AMO OBA JON MIC NAH HAB ZEP HAG ZEC MAL MAT MAR LUK JOH ACT ROM 1CO 2CO GAL EPH PHI COL 1TH 2TH 1TI 2TI TIT PHM HEB JAM 1PE 2PE 1JO 2JO 3JO JUD REV'.split()
    if len(order) > 66: order = [b for b in order if b in CANON]
    assert len(order) == 66, (tid, len(order), order[:5])
    data = []
    for i, b in enumerate(order):
        chs = books[b]; chapters = []
        for c in range(1, max(chs) + 1):
            vs = chs.get(c, {}); chapters.append([vs.get(v, '') for v in range(1, (max(vs) if vs else 0) + 1)])
        data.append({'id': b, 'name': (names.get(USFM[i]) or EN[i]) if local else EN[i], 'chapters': chapters})
    s = json.dumps({'books': data}, ensure_ascii=False, separators=(',', ':'))
    open(f'out/{tid}.json', 'w', encoding='utf-8').write(s)
    sym = collections.Counter(ch for bk in data for ch in ''.join(v for chs in bk['chapters'] for v in chs) if ch in '[]{}<>\\|*#@^~')
    report[tid] = (len(s.encode())//1024, sum(len(ch) for bk in data for ch in bk['chapters']), sym.most_common(4), data[42]['name'], data[42]['chapters'][2][15][:70])
for k, v in report.items(): print(k, v)
