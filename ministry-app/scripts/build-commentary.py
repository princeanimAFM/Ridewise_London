# Builds the verse-by-verse commentary for the app.
# Run: mkdir -p out && python3 scripts/build-commentary.py   → out/commentary.json
# Then copy it to the afm-church repo under bible/ (served at theafmchurch.org/bible).
#
# Source: Matthew Henry's Concise Commentary on the Whole Bible (1706–1721; public domain), from the CCEL
# ThML edition.
#
# commentary.json: {"books": [ book [ chapter {"o": outline, "s": sections} ] ]}   (book 0 = Genesis)
#   outline:  [[title, fromVerse, toVerse], ...]   the chapter's parts
#   sections: [[fromVerse, toVerse, text], ...]    toVerse 0 = to the end of the chapter
#   text: paragraphs separated by a blank line; Bible references as [[r:book.chapter.verse|label]].
import html, json, re, subprocess

BOOKS = ('Gen Exod Lev Num Deut Josh Judg Ruth 1Sam 2Sam 1Kgs 2Kgs 1Chr 2Chr Ezra Neh Esth Job Ps Prov Eccl Song Isa Jer '
         'Lam Ezek Dan Hos Joel Amos Obad Jonah Mic Nah Hab Zeph Hag Zech Mal Matt Mark Luke John Acts Rom 1Cor 2Cor Gal Eph '
         'Phil Col 1Thess 2Thess 1Tim 2Tim Titus Phlm Heb Jas 1Pet 2Pet 1John 2John 3John Jude Rev').split()
INDEX = {b: i for i, b in enumerate(BOOKS)}

xml = subprocess.run(['curl', '-sSfL', 'https://www.ccel.org/ccel/h/henry/mhcc.xml'], capture_output=True, check=True).stdout.decode('utf-8')

def parsed(p):
    b, c, v, c2, v2 = p.split(';')[0].strip('|').split('|')[:5]
    return b, int(c), int(v), int(c2), int(v2)

def ref(m):
    attrs, label = m.group(1), re.sub(r'<[^>]+>', '', m.group(2))
    p = re.search(r'parsed="\|([^"]*)"', attrs)
    if not p:
        return label
    b, c, v, _, _ = parsed(p.group(1))
    if b not in INDEX or c == 0:
        return label
    return f'[[r:{INDEX[b]}.{c}.{v}|{label}]]'

def text(chunk):
    chunk = re.sub(r'<scripRef([^>]*)>(.*?)</scripRef>', ref, chunk, flags=re.S)
    out = []
    for p in re.findall(r'<p[^>]*>(.*?)</p>', chunk, flags=re.S):
        p = re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', '', p))).strip()
        if p:
            out.append(p)
    return '\n\n'.join(out)

books = [[] for _ in BOOKS]
sections = outlines = 0
# Book and chapter come from the headings (the edition's own references sometimes name the wrong book).
div1s = re.findall(r'<div1 title="([^"]+)"[^>]*>(.*?)</div1>', xml, flags=re.S)
div1s = [d for d in div1s if d[0] not in ('Title Page', 'Indexes')]
assert len(div1s) == 66, len(div1s)
for b, (name, book) in enumerate(div1s):
    chapters = [(int(c), d) for c, d in re.findall(r'<div2 title="Chapter (\d+)"[^>]*>(.*?)</div2>', book, flags=re.S)]
    if chapters and chapters[0][0] == 2:
        # 2 Kings and 2 Chronicles: chapter 1 sits before the first chapter heading, with no introduction.
        chapters.insert(0, (1, book[:book.find('<div2')]))
    for c, div2 in chapters:
        chs = books[b]
        while len(chs) < c:
            chs.append({'o': [], 's': []})
        ch = chs[c - 1]
        # The chapter's outline: a table of [part, verses].
        table = re.search(r'<table[^>]*>(.*?)</table>', div2, flags=re.S)
        if table:
            for row in re.findall(r'<tr[^>]*>(.*?)</tr>', table.group(1), flags=re.S):
                cells = re.findall(r'<td[^>]*>(.*?)</td>', row, flags=re.S)
                refs = re.findall(r'parsed="\|([^"]*)"', row)
                if len(cells) < 2 or not refs:
                    continue
                title = re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', '', cells[0]))).strip()
                _, _, v1, _, _ = parsed(refs[0])
                _, _, a, c2, v2 = parsed(refs[-1])
                ch['o'].append([title, v1, v2 if c2 else a])
                outlines += 1
            div2 = div2.replace(table.group(0), '')
        # The commentary, in parts headed "Verses 1–8", "Verse 9" or "Verses 9, 10".
        parts = re.split(r'<h3[^>]*>(.*?)</h3>', div2, flags=re.S)
        found = []
        if len(parts) == 1:
            t = text(parts[0])
            if t:
                found.append([1, 0, t])
        for head, body in zip(parts[1::2], parts[2::2]):
            nums = [int(n) for n in re.findall(r'\d+', re.sub(r'<[^>]+>', '', head))]
            t = text(body)
            if nums and t:
                found.append([nums[0], nums[-1] if len(nums) > 1 else nums[0], t])
        # Where the edition lost a heading, a part runs on until the next one (or to the end of the chapter).
        for i, part in enumerate(found):
            if part[1]:
                part[1] = found[i + 1][0] - 1 if i + 1 < len(found) else 0
        ch['s'] = found
        sections += len(found)

missing = [f'{BOOKS[b]} {c + 1}' for b, chs in enumerate(books) for c, ch in enumerate(chs) if not ch['s']]
json.dump({'books': books}, open('out/commentary.json', 'w'), ensure_ascii=False, separators=(',', ':'))
print('commentary.json:', sections, 'sections,', outlines, 'outline parts; chapters with no commentary:', missing)
print('chapters per book:', [len(x) for x in books])
