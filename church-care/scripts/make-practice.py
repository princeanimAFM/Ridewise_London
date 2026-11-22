# Builds the practice copy of Church Care (demo mode, sample data, no database) from the real source.
# usage: make_practice.py <church-care dir> <existing practice dir>   (the practice config.js is kept as it is)
import os, shutil, sys
src, dst = sys.argv[1], sys.argv[2]
keep_config = open(os.path.join(dst, 'assets/config.js')).read()
for rel in ['team.html', 'index.html', 'sw.js', 'manifest.webmanifest'] + ['assets/' + f for f in os.listdir(os.path.join(src, 'assets')) if f != 'config.js']:
    shutil.copy2(os.path.join(src, rel), os.path.join(dst, rel))
open(os.path.join(dst, 'assets/config.js'), 'w').write(keep_config)
def edit(rel, pairs):
    p = os.path.join(dst, rel); s = open(p).read()
    for o, n in pairs:
        assert s.count(o) == 1, (rel, o[:50]); s = s.replace(o, n)
    open(p, 'w').write(s)
edit('assets/team.js', [('<b>Preview</b> with sample people. Nothing leaves this phone.',
                         '<b>Practice mode</b> with sample people. Nothing here is real, and nothing you do is saved for anyone else.')])
edit('team.html', [('<title>Church Care · The AFM Church</title>', '<title>Practice · Church Care</title>')])
edit('index.html', [('<title>Welcome · The AFM Church</title>', '<title>Practice · Church Care</title>'),
                    ('<meta name="robots" content="noai, noimageai">', '<meta name="robots" content="noindex, noai, noimageai">')])
print('practice copy rebuilt in', dst)
