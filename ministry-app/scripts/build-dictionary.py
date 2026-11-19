# Builds the Bible dictionary for the app.
# Run: mkdir -p out && python3 scripts/build-dictionary.py   → out/dictionary.json
# Then copy it to the afm-church repo under bible/ (served at theafmchurch.org/bible).
#
# Source: Easton's Bible Dictionary (M. G. Easton, 1897; public domain), from the CCEL ThML edition.
#
# dictionary.json: {"entries": [[term, body], ...]} in alphabetical order.
#   body: paragraphs separated by a blank line, with two kinds of links:
#     [[r:book.chapter.verse-toChapter.toVerse|label]]  a Bible reference (book 0 = Genesis; verse 0 = whole chapter)
#     [[e:term|label]]                                  another entry in the dictionary
import html, json, re, subprocess

BOOKS = ('Gen Exod Lev Num Deut Josh Judg Ruth 1Sam 2Sam 1Kgs 2Kgs 1Chr 2Chr Ezra Neh Esth Job Ps Prov Eccl Song Isa Jer '
         'Lam Ezek Dan Hos Joel Amos Obad Jonah Mic Nah Hab Zeph Hag Zech Mal Matt Mark Luke John Acts Rom 1Cor 2Cor Gal Eph '
         'Phil Col 1Thess 2Thess 1Tim 2Tim Titus Phlm Heb Jas 1Pet 2Pet 1John 2John 3John Jude Rev').split()
INDEX = {b: i for i, b in enumerate(BOOKS)}

xml = subprocess.run(['curl', '-sSfL', 'https://www.ccel.org/ccel/e/easton/ebd2.xml'], capture_output=True, check=True).stdout.decode('utf-8')

def ref(m):
    attrs, label = m.group(1), m.group(2)
    p = re.search(r'parsed="\|([^"]*)"', attrs)
    label = re.sub(r'<[^>]+>', '', label)
    if not p:
        return label
    b, c, v, c2, v2 = p.group(1).split(';')[0].strip('|').split('|')[:5]
    if b not in INDEX or c == '0':
        return label  # Apocrypha, or a book with no chapter
    code = f'{INDEX[b]}.{c}.{v}'
    if c2 != '0' and (c2, v2) != (c, v):
        code += f'-{c2}.{v2}'
    return f'[[r:{code}|{label}]]'

def link(m):
    term = html.unescape(m.group(1)).replace('+', ' ')
    return f'[[e:{term}|{m.group(2)}]]'

def clean(body):
    body = re.sub(r'<scripRef([^>]*)>(.*?)</scripRef>', ref, body, flags=re.S)
    body = re.sub(r'<a [^>]*term=([^"&]+)[^>]*>([^<]*)</a>', link, body)
    paras = re.findall(r'<p[^>]*>(.*?)</p>', body, flags=re.S) or [body]
    out = []
    for p in paras:
        p = re.sub(r'<[^>]+>', '', p)
        p = re.sub(r'\s+', ' ', html.unescape(p)).strip()
        if p:
            out.append(p)
    return '\n\n'.join(out)

start = xml.find('<term id="a-p1.11"')  # Aaron: skips the entry on the letter "A"
pairs = re.findall(r'<term[^>]*>(.*?)</term>\s*<def[^>]*>(.*?)</def>', xml[start:], flags=re.S)
entries = []
for term, body in pairs:
    term = re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', '', term))).strip()
    text = clean(body)
    if term and text:
        entries.append([term, text])
entries.sort(key=lambda e: e[0].lower())
json.dump({'entries': entries}, open('out/dictionary.json', 'w'), ensure_ascii=False, separators=(',', ':'))
refs = sum(e[1].count('[[r:') for e in entries)
print('dictionary.json:', len(entries), 'entries,', refs, 'Bible references')
