# Builds the Bible maps data for the app.
# Run: pip install shapely && mkdir -p out && python3 scripts/build-maps.py   → out/map/
# Then copy out/places.json to the afm-church repo under bible/, and out/map/* under bible/map/
# (served at theafmchurch.org/bible/places.json and theafmchurch.org/bible/map/).
#
# Sources:
#   Places: OpenBible.info Bible Geocoding Data (github.com/openbibleinfo/Bible-Geocoding-Data), CC BY 4.0.
#   Coastlines, lakes and rivers: Natural Earth 1:10m (naturalearthdata.com), public domain.
#   Map library: Leaflet 1.9.4 (BSD 2-clause).
#
# out/places.json (used by the app and the map page):
#   places:   [[name, lat, lon, kind, sure], ...]   sure: 2 = certain, 1 = likely, 0 = uncertain
#   books:    [ book [ chapter [[place, verse], ...] ] ]   the places named in each chapter (book 0 = Genesis)
#   journeys: [{id, title, ref, note, stops: [[place, label], ...]}]
# out/map/basemap.json: {"land": [...], "lakes": [...], "rivers": [...]} as GeoJSON-style coordinate arrays.
# out/map/index.html, leaflet.js, leaflet.css: the map page shown in the app.
import json, os, re, shutil, subprocess
from shapely.geometry import box, mapping, shape

BOOKS = ('Gen Exod Lev Num Deut Josh Judg Ruth 1Sam 2Sam 1Kgs 2Kgs 1Chr 2Chr Ezra Neh Esth Job Ps Prov Eccl Song Isa Jer '
         'Lam Ezek Dan Hos Joel Amos Obad Jonah Mic Nah Hab Zeph Hag Zech Mal Matt Mark Luke John Acts Rom 1Cor 2Cor Gal Eph '
         'Phil Col 1Thess 2Thess 1Tim 2Tim Titus Phlm Heb Jas 1Pet 2Pet 1John 2John 3John Jude Rev').split()
CHAPTERS = [50, 40, 27, 36, 34, 24, 21, 4, 31, 24, 22, 25, 29, 36, 10, 13, 10, 42, 150, 31, 12, 8, 66, 52, 5, 48, 12, 14, 3, 9,
            1, 4, 7, 3, 3, 3, 2, 14, 4, 28, 16, 24, 21, 28, 16, 16, 13, 6, 6, 4, 4, 5, 3, 6, 4, 3, 1, 13, 5, 5, 3, 5, 1, 1, 1, 22]
INDEX = {b: i for i, b in enumerate(BOOKS)}
OUT = 'out/map'
HERE = os.path.dirname(os.path.abspath(__file__))

# Journeys: stops in order, by OpenBible id, with the passage they come from.
JOURNEYS = [
    {'id': 'abraham', 'title': "Abraham's journey", 'ref': 'Genesis 11:31–22:19',
     'stops': [('Ur 2', 'Ur of the Chaldees'), ('Haran', ''), ('Shechem', ''), ('Bethel 1', ''), ('Egypt', ''), ('Bethel 1', ''),
               ('Mamre', 'Hebron (Mamre)'), ('Gerar', ''), ('Beersheba 1', ''), ('Moriah', 'Mount Moriah')]},
    {'id': 'exodus', 'title': 'The Exodus', 'ref': 'Exodus 12 – Deuteronomy 34',
     'note': 'The route of the Exodus is debated. This follows the traditional route; many of these sites are uncertain.',
     'stops': [('Rameses', ''), ('Succoth 2', 'Succoth'), ('Etham', ''), ('Pi-hahiroth', ''), ('Marah', ''), ('Elim', ''),
               ('Sin', 'Wilderness of Sin'), ('Rephidim', ''), ('Mount Sinai', ''), ('Kadesh-barnea', ''), ('Mount Hor 1', 'Mount Hor'),
               ('Moab 1', 'Plains of Moab'), ('Nebo 1', 'Mount Nebo')]},
    {'id': 'paul1', 'title': "Paul's first missionary journey", 'ref': 'Acts 13–14',
     'stops': [('Antioch 1', 'Antioch (Syria)'), ('Seleucia', ''), ('Salamis', ''), ('Paphos', ''), ('Perga', ''),
               ('Antioch 2', 'Antioch (Pisidia)'), ('Iconium', ''), ('Lystra', ''), ('Derbe', ''), ('Lystra', ''), ('Iconium', ''),
               ('Antioch 2', ''), ('Perga', ''), ('Attalia', ''), ('Antioch 1', '')]},
    {'id': 'paul2', 'title': "Paul's second missionary journey", 'ref': 'Acts 15:36–18:22',
     'stops': [('Antioch 1', 'Antioch (Syria)'), ('Derbe', ''), ('Lystra', ''), ('Iconium', ''), ('Troas', ''), ('Samothrace', ''),
               ('Neapolis', ''), ('Philippi', ''), ('Amphipolis', ''), ('Apollonia', ''), ('Thessalonica', ''), ('Berea', ''),
               ('Athens', ''), ('Corinth', ''), ('Cenchreae', ''), ('Ephesus', ''), ('Caesarea', ''), ('Jerusalem', ''), ('Antioch 1', '')]},
    {'id': 'paul3', 'title': "Paul's third missionary journey", 'ref': 'Acts 18:23–21:17',
     'stops': [('Antioch 1', 'Antioch (Syria)'), ('Iconium', 'Galatia and Phrygia'), ('Ephesus', ''), ('Troas', ''), ('Philippi', 'Macedonia'),
               ('Corinth', 'Greece'), ('Philippi', ''), ('Troas', ''), ('Assos', ''), ('Mitylene', ''), ('Chios', ''), ('Samos', ''),
               ('Miletus', ''), ('Cos', ''), ('Rhodes 2', 'Rhodes'), ('Patara', ''), ('Tyre', ''), ('Ptolemais', ''), ('Caesarea', ''),
               ('Jerusalem', '')]},
    {'id': 'rome', 'title': "Paul's journey to Rome", 'ref': 'Acts 27–28',
     'stops': [('Caesarea', ''), ('Sidon', ''), ('Myra', ''), ('Cnidus', ''), ('Fair Havens', 'Fair Havens (Crete)'), ('Malta', ''),
               ('Syracuse', ''), ('Rhegium', ''), ('Puteoli', ''), ('Forum of Appius', ''), ('Three Taverns', ''), ('Rome', '')]},
]

def fetch(url):
    return subprocess.run(['curl', '-sSfL', url], capture_output=True, check=True).stdout

os.makedirs(OUT, exist_ok=True)

# ---------- Places ----------
GEO = 'https://raw.githubusercontent.com/openbibleinfo/Bible-Geocoding-Data/main/data/ancient.jsonl'
rows = [json.loads(l) for l in fetch(GEO).decode('utf-8').splitlines() if l.strip()]
places, ids = [], {}
books = [[[] for _ in range(n)] for n in CHAPTERS]
for r in rows:
    ident = (r.get('identifications') or [None])[0]
    res = (ident or {}).get('resolutions') or []
    if not res or not res[0].get('lonlat'):
        continue
    lon, lat = map(float, res[0]['lonlat'].split(','))
    score = ident['score']['time_total']
    sure = 2 if score >= 800 else 1 if score >= 400 else 0
    name = re.sub(r' \d+$', '', r['friendly_id'])
    ids[r['friendly_id']] = len(places)
    places.append([name, round(lat, 4), round(lon, 4), (r.get('types') or ['place'])[0], sure])
    seen = set()
    for v in r.get('verses', []):
        m = re.match(r'(\w+)\.(\d+)\.(\d+)', v['osis'])
        if not m or m.group(1) not in INDEX:
            continue
        b, c, n = INDEX[m.group(1)], int(m.group(2)), int(m.group(3))
        if c <= CHAPTERS[b] and (b, c, n) not in seen:
            seen.add((b, c, n))
            books[b][c - 1].append([len(places) - 1, n])
for chs in books:
    for ch in chs:
        ch.sort(key=lambda x: (x[1], x[0]))

journeys = []
for j in JOURNEYS:
    stops = []
    for pid, label in j['stops']:
        assert pid in ids, f'{j["id"]}: no place "{pid}"'
        stops.append([ids[pid], label])
    journeys.append({**{k: v for k, v in j.items() if k != 'stops'}, 'note': j.get('note', ''), 'stops': stops})

json.dump({'places': places, 'books': books, 'journeys': journeys}, open('out/places.json', 'w'), ensure_ascii=False, separators=(',', ':'))
mentions = sum(len(ch) for chs in books for ch in chs)
print('places.json:', len(places), 'places,', mentions, 'mentions,', len(journeys), 'journeys')

# ---------- Base map ----------
NE = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/'
AREA = box(-11, 4, 63, 50)  # Spain to Persia, Ethiopia to the Black Sea

def coords(geom, tol):
    geom = geom.intersection(AREA).simplify(tol, preserve_topology=True)
    if geom.is_empty:
        return []
    def r(c):
        return [[round(x, 3), round(y, 3)] for x, y in c]
    m = mapping(geom)
    t = m['type']
    if t == 'Polygon':
        return [[r(ring) for ring in m['coordinates']]]
    if t == 'MultiPolygon':
        return [[r(ring) for ring in poly] for poly in m['coordinates']]
    if t == 'LineString':
        return [r(m['coordinates'])]
    if t == 'MultiLineString':
        return [r(line) for line in m['coordinates']]
    if t == 'GeometryCollection':
        return [x for g in geom.geoms for x in coords(g, 0)]
    return []

def layer(name, tol, keep=lambda p: True):
    out = []
    for f in json.loads(fetch(NE + name + '.geojson'))['features']:
        if keep(f['properties']):
            out += coords(shape(f['geometry']), tol)
    return out

basemap = {
    'land': layer('ne_10m_land', 0.01),
    'lakes': layer('ne_10m_lakes', 0.005),
    'rivers': layer('ne_10m_rivers_lake_centerlines', 0.01, lambda p: (p.get('scalerank') or 99) <= 9),
}
json.dump(basemap, open(f'{OUT}/basemap.json', 'w'), separators=(',', ':'))
print('basemap.json:', {k: len(v) for k, v in basemap.items()}, os.path.getsize(f'{OUT}/basemap.json') // 1024, 'KB')

# ---------- The page ----------
LEAFLET = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/'
open(f'{OUT}/leaflet.js', 'wb').write(fetch(LEAFLET + 'leaflet.js'))
open(f'{OUT}/leaflet.css', 'wb').write(fetch(LEAFLET + 'leaflet.css'))
shutil.copy(os.path.join(HERE, 'map', 'index.html'), f'{OUT}/index.html')
print('index.html, leaflet.js, leaflet.css copied')
