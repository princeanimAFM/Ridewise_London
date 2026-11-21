# Builds the Hebrew and Greek (Strong's) data for the Bible's original-language feature.
# Run: mkdir -p out && python3 scripts/build-strongs.py   → out/kjv-strongs.json, out/strongs.json
# Then copy both to the afm-church repo under bible/ (served at theafmchurch.org/bible).
#
# Sources:
#   King James Version with Strong's numbers: eBible.org eng-kjv (public domain).
#   Strong's Hebrew and Greek dictionaries: Open Scriptures (github.com/openscriptures/strongs), CC BY-SA,
#   from James Strong's 1890/1894 dictionaries (public domain). Credited in the app.
#
# kjv-strongs.json: {"books": [ book [ chapter [ verse [ [word, number], ... ] ] ] ]}
#   number: Hebrew positive (H7225 → 7225), Greek negative (G5485 → -5485). Only words that carry a number.
# strongs.json: {"H2617": [lemma, transliteration, pronunciation, definition, kjv renderings, derivation], ...}
import io, json, re, subprocess, zipfile

BOOKS = 'GEN EXO LEV NUM DEU JOS JDG RUT 1SA 2SA 1KI 2KI 1CH 2CH EZR NEH EST JOB PSA PRO ECC SNG ISA JER LAM EZK DAN HOS JOL AMO OBA JON MIC NAM HAB ZEP HAG ZEC MAL MAT MRK LUK JHN ACT ROM 1CO 2CO GAL EPH PHP COL 1TH 2TH 1TI 2TI TIT PHM HEB JAS 1PE 2PE 1JN 2JN 3JN JUD REV'.split()
CHAPTERS = [50,40,27,36,34,24,21,4,31,24,22,25,29,36,10,13,10,42,150,31,12,8,66,52,5,48,12,14,3,9,1,4,7,3,3,3,2,14,4,28,16,24,21,28,16,16,13,6,6,4,4,5,3,6,4,3,1,13,5,5,3,5,1,1,1,22]

def get(url):
    return subprocess.run(['curl', '-sSfL', url], capture_output=True, check=True).stdout

# ---- KJV with Strong's numbers ----
z = zipfile.ZipFile(io.BytesIO(get('https://ebible.org/Scriptures/eng-kjv_usfm.zip')))
files = {re.search(r'\d+-(\w{3})eng-kjv\.usfm$', n).group(1): n for n in z.namelist() if re.search(r'\d+-\w{3}eng-kjv\.usfm$', n)}
TAG = re.compile(r'\\\+?w ([^|\\]*)\|strong="([HG])(\d+)"\\\+?w\*')
out, total = [], 0
for b, code in enumerate(BOOKS):
    text = z.read(files[code]).decode('utf-8-sig')
    text = re.sub(r'\\f .*?\\f\*', '', text, flags=re.S)   # footnotes
    text = re.sub(r'\\x .*?\\x\*', '', text, flags=re.S)   # cross references
    chapters, c, v = [], 0, 0
    for line in text.splitlines():
        m = re.match(r'\\c (\d+)', line)
        if m:
            c = int(m.group(1)); chapters.append([]); v = 0
            continue
        for part in re.split(r'(\\v \d+ )', line):
            mv = re.match(r'\\v (\d+) ', part)
            if mv:
                v = int(mv.group(1))
                while len(chapters[c - 1]) < v: chapters[c - 1].append([])
                continue
            if c and v:
                for w, lang, n in TAG.findall(part):
                    num = int(n) if lang == 'H' else -int(n)
                    chapters[c - 1][v - 1].append([w.strip(), num]); total += 1
    assert len(chapters) == CHAPTERS[b], (code, len(chapters))
    out.append(chapters)
json.dump({'books': out}, open('out/kjv-strongs.json', 'w'), ensure_ascii=False, separators=(',', ':'))
print('kjv-strongs.json:', total, 'tagged words')

# ---- Strong's dictionaries ----
def dictionary(url):
    js = get(url).decode('utf-8')
    return json.loads(js[js.index('{'):js.rindex('}') + 1])
heb = dictionary('https://raw.githubusercontent.com/openscriptures/strongs/master/hebrew/strongs-hebrew-dictionary.js')
grk = dictionary('https://raw.githubusercontent.com/openscriptures/strongs/master/greek/strongs-greek-dictionary.js')
tidy = lambda s: re.sub(r'\s+', ' ', (s or '')).strip().rstrip(';').strip()
dic = {}
for k, e in list(heb.items()) + list(grk.items()):
    num = k[0] + str(int(k[1:]))   # H0430 → H430
    dic[num] = [tidy(e.get('lemma')), tidy(e.get('xlit') or e.get('translit')), tidy(e.get('pron')), tidy(e.get('strongs_def')),
                tidy(e.get('kjv_def')), tidy(e.get('derivation'))]
json.dump(dic, open('out/strongs.json', 'w'), ensure_ascii=False, separators=(',', ':'))
print('strongs.json:', len(dic), 'entries')
