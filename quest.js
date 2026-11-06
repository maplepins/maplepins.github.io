/* ============================================================
   MaplePins — Canada Parks Quest (Stardew-flavoured game skin)
   The whole product: one illustrated map, four layers.
   1) MAIN QUEST — the official Parks Canada 48: 37 national
      parks + 11 national park reserves. Only these count toward
      the big counter, EXP and levels.
   2) BONUS — Rouge National Urban Park, Canada's only National
      Urban Park: on the map and clearable, but NOT one of the
      official 48, so it never counts toward the counter or levels.
   3) SIDE QUESTS — curated famous provincial parks, one set per
      province (Ontario set ships now). Own markers, own counters.
   4) MY SPOTS — free personal campsite pins (tent markers).
      Never counted; stored separately from quest visits.
   Photos are downscaled to ~800px and kept as data URLs in
   localStorage for this demo. In production they belong in
   Supabase Storage, with only the file URL kept in the database.
   ============================================================ */
(function () {
'use strict';

/* ---------------- Reference data ---------------- */
var PROVINCES = [
  { code:'YT', name:'Yukon' }, { code:'NT', name:'Northwest Territories' },
  { code:'NU', name:'Nunavut' }, { code:'BC', name:'British Columbia' },
  { code:'AB', name:'Alberta' }, { code:'SK', name:'Saskatchewan' },
  { code:'MB', name:'Manitoba' }, { code:'ON', name:'Ontario' },
  { code:'QC', name:'Quebec' }, { code:'NB', name:'New Brunswick' },
  { code:'PE', name:'Prince Edward Island' }, { code:'NS', name:'Nova Scotia' },
  { code:'NL', name:'Newfoundland & Labrador' }
];
var PROVINCE_BY_CODE = {};
PROVINCES.forEach(function (p) { PROVINCE_BY_CODE[p.code] = p; });
var KIND_LABEL = { park:'National Park', reserve:'National Park Reserve',
                   urban:'National Urban Park', provincial:'Provincial Park' };

/* MAIN QUEST — list & coordinates name-checked against Parks Canada
   (pc.gc.ca "Find a Parks Canada location") and Wikipedia's "List of
   national parks of Canada" on 2026-11-06: 37 national parks + 11
   national park reserves = 48. Kluane counts as a reserve (it is a
   National Park and Reserve); Akami-Uapishkᵁ-KakKasuak-Mealy
   Mountains NPR (south Labrador, est. 2015) and Torngat Mountains NP
   (north Labrador, est. 2008) are two DIFFERENT parks — both stay.
   Pituamkek NPR (PE, est. Jul 2024) is included at 46.611, -63.785. */
var PARKS_MAIN = [
  { id:'akami-uapishku', name:'Akami-Uapishkᵁ-KakKasuak-Mealy Mountains', kind:'reserve', tier:'main', province:'NL', lat:53.400, lng:-59.367, blurb:'Rounded Mealy Mountains and wild Labrador Sea beaches.' },
  { id:'aulavik', name:'Aulavik', kind:'park', tier:'main', province:'NT', lat:73.700, lng:-119.917, blurb:'Treeless polar desert on Banks Island, home to muskoxen and Peary caribou.' },
  { id:'auyuittuq', name:'Auyuittuq', kind:'park', tier:'main', province:'NU', lat:67.883, lng:-65.017, blurb:'Arctic fjords and towering peaks on Baffin Island.' },
  { id:'banff', name:'Banff', kind:'park', tier:'main', province:'AB', lat:51.500, lng:-116.000, blurb:"Canada's first national park — turquoise lakes and the Valley of the Ten Peaks." },
  { id:'bruce-peninsula', name:'Bruce Peninsula', kind:'park', tier:'main', province:'ON', lat:45.233, lng:-81.617, blurb:'Turquoise Grotto waters and Niagara Escarpment cliffs.' },
  { id:'cape-breton-highlands', name:'Cape Breton Highlands', kind:'park', tier:'main', province:'NS', lat:46.717, lng:-60.667, blurb:'The Cabot Trail winds through Acadian highlands by the sea.' },
  { id:'elk-island', name:'Elk Island', kind:'park', tier:'main', province:'AB', lat:53.617, lng:-112.867, blurb:'Bison herds and dark skies just east of Edmonton.' },
  { id:'forillon', name:'Forillon', kind:'park', tier:'main', province:'QC', lat:48.900, lng:-64.350, blurb:'Sea cliffs at the very tip of the Gaspé Peninsula.' },
  { id:'fundy', name:'Fundy', kind:'park', tier:'main', province:'NB', lat:45.600, lng:-64.950, blurb:"The world's highest tides — walk the ocean floor at low tide." },
  { id:'georgian-bay-islands', name:'Georgian Bay Islands', kind:'park', tier:'main', province:'ON', lat:44.883, lng:-79.867, blurb:'Granite islands and windswept pines on Georgian Bay.' },
  { id:'glacier', name:'Glacier', kind:'park', tier:'main', province:'BC', lat:51.300, lng:-117.517, blurb:'Rogers Pass, steep valleys and big Interior rainforest.' },
  { id:'grasslands', name:'Grasslands', kind:'park', tier:'main', province:'SK', lat:49.200, lng:-107.717, blurb:'Endless mixed-grass prairie, bison and dinosaur country.' },
  { id:'gros-morne', name:'Gros Morne', kind:'park', tier:'main', province:'NL', lat:49.683, lng:-57.733, blurb:"Ancient fjords and Earth's exposed mantle — a UNESCO site." },
  { id:'gulf-islands', name:'Gulf Islands', kind:'reserve', tier:'main', province:'BC', lat:48.850, lng:-123.450, blurb:'Sunny little islets scattered in the Strait of Georgia.' },
  { id:'gwaii-haanas', name:'Gwaii Haanas', kind:'reserve', tier:'main', province:'BC', lat:52.383, lng:-131.467, blurb:"Haida heritage sites and lush islands at Canada's west edge." },
  { id:'ivvavik', name:'Ivvavik', kind:'park', tier:'main', province:'YT', lat:69.517, lng:-139.517, blurb:"Arctic tundra and the Firth River, Canada's oldest river." },
  { id:'jasper', name:'Jasper', kind:'park', tier:'main', province:'AB', lat:52.800, lng:-117.900, blurb:'Dark-sky preserve of icefields, canyons and Maligne Lake.' },
  { id:'kejimkujik', name:'Kejimkujik', kind:'park', tier:'main', province:'NS', lat:44.400, lng:-65.217, blurb:"Mi'kmaw cultural landscape of lakes, rivers and petroglyphs." },
  { id:'kluane', name:'Kluane', kind:'reserve', tier:'main', province:'YT', lat:60.617, lng:-138.333, blurb:"Mount Logan and the world's largest non-polar icefield. (National Park and Reserve.)" },
  { id:'kootenay', name:'Kootenay', kind:'park', tier:'main', province:'BC', lat:50.883, lng:-116.050, blurb:'Radium Hot Springs and the Rockwall trail in the Rockies.' },
  { id:'kouchibouguac', name:'Kouchibouguac', kind:'park', tier:'main', province:'NB', lat:46.850, lng:-64.967, blurb:'Warm lagoons, dunes and salt marshes on the Acadian coast.' },
  { id:'la-mauricie', name:'La Mauricie', kind:'park', tier:'main', province:'QC', lat:46.800, lng:-72.967, blurb:'Canoe-camping country of Laurentian lakes and forest.' },
  { id:'mingan-archipelago', name:'Mingan Archipelago', kind:'reserve', tier:'main', province:'QC', lat:50.217, lng:-63.167, blurb:'Limestone monoliths and puffin colonies in the Gulf of St. Lawrence.' },
  { id:'mount-revelstoke', name:'Mount Revelstoke', kind:'park', tier:'main', province:'BC', lat:51.083, lng:-118.067, blurb:'A summit drive through rainforest to alpine meadows.' },
  { id:'naatsihchoh', name:"Nááts'įhch'oh", kind:'reserve', tier:'main', province:'NT', lat:62.367, lng:-127.967, blurb:'Moose Ponds and the headwaters of the South Nahanni River.' },
  { id:'nahanni', name:'Nahanni', kind:'reserve', tier:'main', province:'NT', lat:61.550, lng:-125.583, blurb:'Virginia Falls and the legendary South Nahanni River.' },
  { id:'pacific-rim', name:'Pacific Rim', kind:'reserve', tier:'main', province:'BC', lat:48.633, lng:-124.767, blurb:'Long Beach surf and the West Coast Trail rainforest.' },
  { id:'pituamkek', name:'Pituamkek', kind:'reserve', tier:'main', province:'PE', lat:46.611, lng:-63.785, blurb:"A 50 km chain of barrier islands off PEI — a Mi'kmaq homeland of dunes and piping plovers." },
  { id:'point-pelee', name:'Point Pelee', kind:'park', tier:'main', province:'ON', lat:41.967, lng:-82.517, blurb:"Canada's southernmost mainland — a spring birding magnet." },
  { id:'prince-albert', name:'Prince Albert', kind:'park', tier:'main', province:'SK', lat:53.967, lng:-106.367, blurb:"Boreal forest, Waskesiu Lake and Grey Owl's cabin." },
  { id:'prince-edward-island', name:'Prince Edward Island', kind:'park', tier:'main', province:'PE', lat:46.417, lng:-63.083, blurb:'Red sandstone cliffs and the Green Gables shore.' },
  { id:'pukaskwa', name:'Pukaskwa', kind:'park', tier:'main', province:'ON', lat:48.250, lng:-85.883, blurb:'The wildest shoreline on the Great Lakes.' },
  { id:'qausuittuq', name:'Qausuittuq', kind:'park', tier:'main', province:'NU', lat:76.000, lng:-100.000, blurb:'High Arctic refuge for Peary caribou on Bathurst Island.' },
  { id:'quttinirpaaq', name:'Quttinirpaaq', kind:'park', tier:'main', province:'NU', lat:82.217, lng:-72.217, blurb:"Canada's northernmost park — Lake Hazen and polar desert." },
  { id:'riding-mountain', name:'Riding Mountain', kind:'park', tier:'main', province:'MB', lat:50.867, lng:-100.033, blurb:'Boreal forest and bison above the Manitoba prairie.' },
  { id:'sable-island', name:'Sable Island', kind:'reserve', tier:'main', province:'NS', lat:43.950, lng:-59.917, blurb:'A crescent of sand famous for its wild horses.' },
  { id:'sirmilik', name:'Sirmilik', kind:'park', tier:'main', province:'NU', lat:72.983, lng:-81.133, blurb:'Glaciers, hoodoos and narwhal waters off Bylot Island.' },
  { id:'terra-nova', name:'Terra Nova', kind:'park', tier:'main', province:'NL', lat:48.533, lng:-53.933, blurb:"Rocky coves and boreal forest on Newfoundland's east coast." },
  { id:'thaidene-nene', name:'Thaidene Nëné', kind:'reserve', tier:'main', province:'NT', lat:62.500, lng:-111.000, blurb:"Land of the Ancestors — Great Slave Lake's East Arm." },
  { id:'thousand-islands', name:'Thousand Islands', kind:'park', tier:'main', province:'ON', lat:44.350, lng:-75.950, blurb:'Granite islands scattered along the St. Lawrence River.' },
  { id:'torngat-mountains', name:'Torngat Mountains', kind:'park', tier:'main', province:'NL', lat:59.433, lng:-63.867, blurb:"Labrador's highest peaks and Inuit ancestral lands." },
  { id:'tuktut-nogait', name:'Tuktut Nogait', kind:'park', tier:'main', province:'NT', lat:68.817, lng:-121.750, blurb:'Tundra canyons protecting the Bluenose caribou herd.' },
  { id:'ukkusiksalik', name:'Ukkusiksalik', kind:'park', tier:'main', province:'NU', lat:65.350, lng:-87.300, blurb:'Wager Bay — polar bear country and Thule relics.' },
  { id:'vuntut', name:'Vuntut', kind:'park', tier:'main', province:'YT', lat:68.367, lng:-139.850, blurb:'Unglaciated Yukon plains travelled by the Porcupine caribou herd.' },
  { id:'wapusk', name:'Wapusk', kind:'park', tier:'main', province:'MB', lat:57.767, lng:-93.367, blurb:'Polar bear maternity dens by Hudson Bay.' },
  { id:'waterton-lakes', name:'Waterton Lakes', kind:'park', tier:'main', province:'AB', lat:49.050, lng:-113.917, blurb:'Where the prairie meets the Rockies — an International Peace Park.' },
  { id:'wood-buffalo', name:'Wood Buffalo', kind:'park', tier:'main', province:'AB', lat:59.383, lng:-112.983, blurb:"Canada's largest park — wood bison and whooping cranes. (Spans AB / NT.)" },
  { id:'yoho', name:'Yoho', kind:'park', tier:'main', province:'BC', lat:51.400, lng:-116.483, blurb:'Takakkaw Falls, Emerald Lake and Burgess Shale fossils.' }
];

/* BONUS QUEST — Rouge National Urban Park: Canada's only National
   Urban Park, so it is NOT one of the official 48. It stays on the
   map and can be cleared like any quest, but it never counts toward
   the 48 counter, EXP, levels or province fills. */
var PARKS_BONUS = [
  { id:'rouge', name:'Rouge', kind:'urban', tier:'bonus', province:'ON', lat:43.933, lng:-79.233, blurb:"North America's largest urban park, inside Toronto." }
];

/* SIDE QUESTS — curated provincial parks, one set per province.
   Add a new set object here and its markers/counters appear for free.
   Ontario coordinates: Ontario Parks gatehouse listings + Wikipedia. */
var SIDE_SETS = [
  { id:'side-on', province:'ON', label:'Ontario', parks:[
    { id:'sp-algonquin', name:'Algonquin', kind:'provincial', tier:'side', province:'ON', lat:45.838, lng:-78.379, blurb:"Ontario's iconic wilderness — moose, lakes and endless canoe routes." },
    { id:'sp-killarney', name:'Killarney', kind:'provincial', tier:'side', province:'ON', lat:46.013, lng:-81.402, blurb:'White quartzite ridges and sapphire lakes on Georgian Bay.' },
    { id:'sp-sandbanks', name:'Sandbanks', kind:'provincial', tier:'side', province:'ON', lat:43.911, lng:-77.242, blurb:'Giant sand dunes and soft beaches on Lake Ontario.' },
    { id:'sp-bon-echo', name:'Bon Echo', kind:'provincial', tier:'side', province:'ON', lat:44.897, lng:-77.210, blurb:"Mazinaw Rock's towering cliff and Indigenous pictographs." },
    { id:'sp-pinery', name:'The Pinery', kind:'provincial', tier:'side', province:'ON', lat:43.260, lng:-81.830, blurb:'Rare oak savanna and sunset beaches on Lake Huron.' },
    { id:'sp-arrowhead', name:'Arrowhead', kind:'provincial', tier:'side', province:'ON', lat:45.392, lng:-79.214, blurb:'Waterfalls and forest trails near Huntsville — stunning in fall.' },
    { id:'sp-killbear', name:'Killbear', kind:'provincial', tier:'side', province:'ON', lat:45.359, lng:-80.213, blurb:'Wind-swept pines and rocky Georgian Bay shoreline.' },
    { id:'sp-grundy-lake', name:'Grundy Lake', kind:'provincial', tier:'side', province:'ON', lat:45.933, lng:-80.550, blurb:'Smooth rock shores and quiet lakes just off Highway 69.' },
    { id:'sp-awenda', name:'Awenda', kind:'provincial', tier:'side', province:'ON', lat:44.844, lng:-80.003, blurb:'Ancient dunes and cool forest on Georgian Bay.' },
    { id:'sp-macgregor-point', name:'MacGregor Point', kind:'provincial', tier:'side', province:'ON', lat:44.409, lng:-81.447, blurb:'Lake Huron sunsets and spring bird migration.' }
  ] }
];

var ALL_PARKS = PARKS_MAIN.concat(PARKS_BONUS);
SIDE_SETS.forEach(function (s) { s.parks.forEach(function (p) { ALL_PARKS.push(p); }); });
var PARK_BY_ID = {};
ALL_PARKS.forEach(function (p) { PARK_BY_ID[p.id] = p; });

/* Level: +1 level per 4 main quests cleared (Lv.1 at 0, Lv.13 at 48). */
function levelFor(mainCleared) { return Math.floor(mainCleared / 4) + 1; }
var RANKS = [
  { min:0,  name:'🌱 New Camper' }, { min:1,  name:'🥾 Trail Starter' },
  { min:6,  name:'⛺ Happy Camper' }, { min:12, name:'🔥 Trail Blazer' },
  { min:20, name:'🧭 Explorer' }, { min:30, name:'🏔️ Park Ranger' },
  { min:40, name:'🦫 Canada Conqueror' }, { min:48, name:'👑 Legend of the North' }
];
function rankFor(n) {
  var r = RANKS[0];
  RANKS.forEach(function (x) { if (n >= x.min) r = x; });
  return r;
}
var SAMPLE_VISITS = {
  'bruce-peninsula':     { date:'2026-07-19', photo:null },
  'point-pelee':         { date:'2026-05-24', photo:null },
  'georgian-bay-islands':{ date:'2026-09-06', photo:null },
  'thousand-islands':    { date:'2026-08-15', photo:null }
};

/* ---------------- State ----------------
   visits: quest stamps, keyed by park id (main + side share this map;
   counters always filter by tier). camps: FREE personal spots, kept
   in a fully separate array — never mixed into quest counts. */
var LS_KEY = 'maplepins_quest_v1';
var state = { visits:{}, camps:[] };
function saveState() {
  try { localStorage.setItem(LS_KEY, JSON.stringify(
    { visits: state.visits, camps: state.camps, seeded: true })); }
  catch (e) { /* storage full/blocked — state stays in memory */ }
}
function loadState() {
  var raw = null;
  try { raw = localStorage.getItem(LS_KEY); } catch (e) { /* ignore */ }
  if (!raw) {
    state.visits = JSON.parse(JSON.stringify(SAMPLE_VISITS));
    state.camps = [];
    saveState();
    return;
  }
  try {
    var d = JSON.parse(raw);
    state.visits = d.visits || {};
    state.camps = Array.isArray(d.camps) ? d.camps : [];
  } catch (e) { state.visits = {}; state.camps = []; }
}
function mainCleared() {
  return PARKS_MAIN.filter(function (p) { return !!state.visits[p.id]; }).length;
}
function bonusCleared() {
  return PARKS_BONUS.filter(function (p) { return !!state.visits[p.id]; }).length;
}
function setCleared(set) {
  return set.parks.filter(function (p) { return !!state.visits[p.id]; }).length;
}

/* ---------------- Tiny helpers ---------------- */
function $(id) { return document.getElementById(id); }
function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function (ch) {
    return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch];
  });
}
function todayStr() {
  var d = new Date(), m = d.getMonth() + 1, day = d.getDate();
  return d.getFullYear() + '-' + (m < 10 ? '0' : '') + m + '-' + (day < 10 ? '0' : '') + day;
}
function fmtDate(iso) {
  if (!iso) return '';
  var p = iso.split('-');
  var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return months[(+p[1]) - 1] + ' ' + (+p[2]) + ', ' + p[0];
}
/* Downscale a picked photo to <=800px wide JPEG data URL.
   (Demo storage: localStorage. Production: upload the blob to
   Supabase Storage and store only the returned URL.) */
function fileToDataURL(file, cb) {
  var rd = new FileReader();
  rd.onload = function () {
    var img = new Image();
    img.onload = function () {
      var scale = Math.min(1, 800 / img.width);
      var w = Math.max(1, Math.round(img.width * scale));
      var h = Math.max(1, Math.round(img.height * scale));
      var c = document.createElement('canvas');
      c.width = w; c.height = h;
      c.getContext('2d').drawImage(img, 0, 0, w, h);
      cb(c.toDataURL('image/jpeg', 0.82));
    };
    img.onerror = function () { cb(null); };
    img.src = rd.result;
  };
  rd.onerror = function () { cb(null); };
  rd.readAsDataURL(file);
}

/* ---------------- Illustrated map (same recipe as app.js) ---------------- */
var SVGNS = 'http://www.w3.org/2000/svg';
var K_LNG = 0.55, PAD = 1.4;
var LABEL_CODE_ONLY = { NL:true, NB:true, NS:true, PE:true };
var GEO = null, GEO_BY_CODE = {}, FULL = null;
var mapSvg = $('mapSvg'), posterSvg = $('posterSvg');
var view = { cx:0, cy:0, w:10 };
var viewAnim = null, focusCode = null;
var mapParts = null, posterParts = null;
var markerEls = [];   /* {g, kind:'park'|'camp', park?, camp?} for rescaling */
var clipSeq = 0;

function svgEl(tag, attrs) {
  var e = document.createElementNS(SVGNS, tag);
  if (attrs) Object.keys(attrs).forEach(function (k) { e.setAttribute(k, attrs[k]); });
  return e;
}
function project(lat, lng) { return [(lng - GEO.minLng) * K_LNG, GEO.maxLat - lat]; }
function unproject(x, y) { return { lat: GEO.maxLat - y, lng: GEO.minLng + x / K_LNG }; }
function geomToPath(geom) {
  var d = '';
  geom.coordinates.forEach(function (poly) {
    poly.forEach(function (ring) {
      ring.forEach(function (pt, i) {
        var xy = project(pt[1], pt[0]);
        d += (i === 0 ? 'M' : 'L') + xy[0].toFixed(2) + ' ' + xy[1].toFixed(2);
      });
      d += 'Z';
    });
  });
  return d;
}
function ringCentroidPts(pts) {
  var a = 0, cx = 0, cy = 0;
  for (var i = 0; i < pts.length - 1; i++) {
    var x1 = pts[i][0], y1 = pts[i][1], x2 = pts[i + 1][0], y2 = pts[i + 1][1];
    var cross = x1 * y2 - x2 * y1;
    a += cross; cx += (x1 + x2) * cross; cy += (y1 + y2) * cross;
  }
  a /= 2;
  if (Math.abs(a) < 1e-9) return null;
  return { area: Math.abs(a), x: cx / (6 * a), y: cy / (6 * a) };
}
async function loadGeo() {
  var res = await fetch('canada-provinces.json');
  if (!res.ok) throw new Error('geojson ' + res.status);
  var fc = await res.json();
  var minLng = Infinity, maxLat = -Infinity, minLat = Infinity, maxLng = -Infinity;
  fc.features.forEach(function (f) {
    f.geometry.coordinates.forEach(function (poly) {
      poly.forEach(function (ring) {
        ring.forEach(function (pt) {
          if (pt[0] < minLng) minLng = pt[0];
          if (pt[0] > maxLng) maxLng = pt[0];
          if (pt[1] > maxLat) maxLat = pt[1];
          if (pt[1] < minLat) minLat = pt[1];
        });
      });
    });
  });
  GEO = { minLng: minLng, maxLat: maxLat, features: [] };
  fc.features.forEach(function (f) {
    var bx0 = Infinity, by0 = Infinity, bx1 = -Infinity, by1 = -Infinity, best = null;
    f.geometry.coordinates.forEach(function (poly) {
      poly.forEach(function (ring) {
        ring.forEach(function (pt) {
          var xy = project(pt[1], pt[0]);
          if (xy[0] < bx0) bx0 = xy[0];
          if (xy[0] > bx1) bx1 = xy[0];
          if (xy[1] < by0) by0 = xy[1];
          if (xy[1] > by1) by1 = xy[1];
        });
      });
      var outer = poly[0].map(function (pt) { return project(pt[1], pt[0]); });
      var c = ringCentroidPts(outer);
      if (c && (!best || c.area > best.area)) best = c;
    });
    var feat = { code: f.properties.code, d: geomToPath(f.geometry),
      bounds: { x0: bx0, y0: by0, x1: bx1, y1: by1 },
      label: best ? { x: best.x, y: best.y } : { x: (bx0 + bx1) / 2, y: (by0 + by1) / 2 } };
    GEO.features.push(feat);
    GEO_BY_CODE[feat.code] = feat;
  });
  var w = (maxLng - minLng) * K_LNG, h = maxLat - minLat;
  FULL = { x: -PAD, y: -PAD, w: w + PAD * 2, h: h + PAD * 2 };
}
/* Province fill warms up as its MAIN quests clear — a living map.
   (Bonus, side quests and camps never recolour a province.) */
var PROV_FILL = ['#f3ede1', '#eef0da', '#e4eece', '#d7e8bd', '#c6e0a6'];
function provinceFill(code) {
  var parks = PARKS_MAIN.filter(function (p) { return p.province === code; });
  if (code === 'NT') parks = parks.concat(PARKS_MAIN.filter(function (p) { return p.id === 'wood-buffalo'; }));
  if (!parks.length) return PROV_FILL[0];
  var done = parks.filter(function (p) { return !!state.visits[p.id]; }).length;
  var idx = Math.min(PROV_FILL.length - 1, Math.floor(done / parks.length * PROV_FILL.length));
  return PROV_FILL[idx];
}
function buildSvgView(svg, isMain) {
  var parts = { paths:{}, labels:null, markers:null, camps:null, temp:null, labelEls:{} };
  var gProv = svgEl('g');
  GEO.features.forEach(function (f) {
    var p = svgEl('path', { d: f.d, fill: provinceFill(f.code), stroke: '#ffffff',
      'stroke-width': 0.13, 'stroke-linejoin': 'round' });
    p.dataset.code = f.code;
    parts.paths[f.code] = p;
    gProv.appendChild(p);
  });
  svg.appendChild(gProv);
  parts.labels = svgEl('g');
  GEO.features.forEach(function (f) {
    var t = svgEl('text', { x: f.label.x, y: f.label.y, 'text-anchor': 'middle',
      fill: '#96754d', 'paint-order': 'stroke', stroke: '#fdf6ec',
      'stroke-linejoin': 'round', 'font-weight': 700, opacity: 0.9 });
    t.style.pointerEvents = 'none';
    t.textContent = LABEL_CODE_ONLY[f.code] ? f.code : PROVINCE_BY_CODE[f.code].name;
    parts.labels.appendChild(t);
    parts.labelEls[f.code] = t;
  });
  svg.appendChild(parts.labels);
  parts.markers = svgEl('g'); svg.appendChild(parts.markers);
  parts.camps = svgEl('g'); svg.appendChild(parts.camps);
  if (isMain) { parts.temp = svgEl('g'); svg.appendChild(parts.temp); }
  svg.setAttribute('viewBox', FULL.x + ' ' + FULL.y + ' ' + FULL.w + ' ' + FULL.h);
  return parts;
}
function refreshProvinceFills() {
  [mapParts, posterParts].forEach(function (parts) {
    if (!parts) return;
    Object.keys(parts.paths).forEach(function (code) {
      parts.paths[code].setAttribute('fill', provinceFill(code));
    });
  });
}

/* ---------------- Markers ---------------- */
function markerSize() { /* half-size of a main marker, in svg units */
  var zoom = FULL.w / view.w;
  var s = 0.62 * Math.pow(zoom, 0.38);
  if (focusCode) s *= 1.25;
  return s;
}
function squareMarker(x, y, s, cls, glyph, glyphScale) {
  var g = svgEl('g', { 'class': 'park-marker' });
  g.appendChild(svgEl('rect', { x: x - s + 0.1, y: y - s + 0.13, width: s * 2, height: s * 2, 'class': 'mk-shadow' }));
  g.appendChild(svgEl('rect', { x: x - s, y: y - s, width: s * 2, height: s * 2, 'class': cls, 'stroke-width': 0.09 }));
  if (glyph) {
    var t = svgEl('text', { x: x, y: y, 'text-anchor': 'middle', 'dominant-baseline': 'central',
      'class': glyph === '?' ? 'mk-q' : 'mk-star', 'font-size': s * (glyphScale || 1.15) });
    t.textContent = glyph;
    g.appendChild(t);
  }
  var hit = svgEl('rect', { x: x - s * 1.9, y: y - s * 1.9, width: s * 3.8, height: s * 3.8, 'class': 'hit' });
  g.appendChild(hit);
  return g;
}
function photoMarker(x, y, s, photo, ringCls, target) {
  var g = svgEl('g', { 'class': 'park-marker' });
  var id = 'qclip' + (++clipSeq);
  var defs = svgEl('defs');
  var cp = svgEl('clipPath', { id: id });
  cp.appendChild(svgEl('rect', { x: x - s, y: y - s, width: s * 2, height: s * 2 }));
  defs.appendChild(cp); g.appendChild(defs);
  g.appendChild(svgEl('rect', { x: x - s + 0.1, y: y - s + 0.13, width: s * 2, height: s * 2, 'class': 'mk-shadow' }));
  var img = svgEl('image', { x: x - s, y: y - s, width: s * 2, height: s * 2,
    preserveAspectRatio: 'xMidYMid slice', 'clip-path': 'url(#' + id + ')' });
  img.setAttribute('href', photo);
  g.appendChild(img);
  g.appendChild(svgEl('rect', { x: x - s, y: y - s, width: s * 2, height: s * 2,
    fill: 'none', 'class': ringCls, 'stroke-width': 0.13 }));
  var hit = svgEl('rect', { x: x - s * 1.9, y: y - s * 1.9, width: s * 3.8, height: s * 3.8, 'class': 'hit' });
  g.appendChild(hit);
  return g;
}
function bindTap(el, fn) {
  el.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
  el.addEventListener('click', function (e) { e.stopPropagation(); fn(); });
}
function renderMarkersInto(parts, interactive, viewW) {
  while (parts.markers.firstChild) parts.markers.removeChild(parts.markers.firstChild);
  while (parts.camps.firstChild) parts.camps.removeChild(parts.camps.firstChild);
  var zoom = FULL.w / (viewW || FULL.w);
  var sMain = 0.62 * Math.pow(zoom, 0.38) * (interactive && focusCode ? 1.25 : 1);
  ALL_PARKS.forEach(function (park) {
    var xy = project(park.lat, park.lng);
    var visit = state.visits[park.id];
    var side = park.tier === 'side';
    var bonus = park.tier === 'bonus';
    var s = sMain * (side ? 0.76 : (bonus ? 0.9 : 1)) * (visit && visit.photo ? 1.3 : 1);
    var g;
    if (visit && visit.photo) {
      g = photoMarker(xy[0], xy[1], s, visit.photo,
        side ? 'mk-photo-side' : (bonus ? 'mk-photo-bonus' : 'mk-photo'));
    } else if (visit) {
      g = squareMarker(xy[0], xy[1], s,
        side ? 'mk-done-side' : (bonus ? 'mk-done-bonus' : 'mk-done'), '★', 1.05);
    } else {
      g = squareMarker(xy[0], xy[1], s,
        side ? 'mk-open-side' : (bonus ? 'mk-open-bonus' : 'mk-open'), '?', 1.15);
    }
    if (interactive) {
      (function (pk) { bindTap(g, function () { openPark(pk); }); })(park);
      markerEls.push({ g: g });
    }
    parts.markers.appendChild(g);
  });
  state.camps.forEach(function (camp) {
    var xy = project(camp.lat, camp.lng);
    var s = sMain * 0.92 * (camp.photo ? 1.25 : 1);
    var g;
    if (camp.photo) {
      g = photoMarker(xy[0], xy[1], s, camp.photo, 'mk-photo');
      g.setAttribute('class', 'camp-marker');
      g.querySelector('.mk-photo').setAttribute('style', 'stroke:#3e7d32');
    } else {
      g = squareMarker(xy[0], xy[1], s, 'mk-camp', '⛺', 0.95);
      g.setAttribute('class', 'camp-marker');
    }
    if (interactive) {
      (function (cp) { bindTap(g, function () { openCampView(cp); }); })(camp);
      markerEls.push({ g: g });
    }
    parts.camps.appendChild(g);
  });
}
function renderMap() {
  if (!mapParts) return;
  markerEls = [];
  lastMarkerW = view.w;
  renderMarkersInto(mapParts, true, view.w);
  refreshProvinceFills();
}

/* ---------------- View: pan / zoom / focus ---------------- */
function stageRect() { return mapSvg.getBoundingClientRect(); }
function fitWidth() {
  var r = stageRect();
  return Math.max(FULL.w, FULL.h * (r.width / Math.max(r.height, 1)));
}
var lastMarkerW = 0;
function applyView() {
  if (!FULL) return;
  var r = stageRect();
  var h = view.w * (r.height / Math.max(r.width, 1));
  mapSvg.setAttribute('viewBox',
    (view.cx - view.w / 2) + ' ' + (view.cy - h / 2) + ' ' + view.w + ' ' + h);
  $('zoomReset').hidden = !(view.w < fitWidth() * 0.985);
  Object.keys(mapParts.labelEls).forEach(function (code) {
    var fs = view.w * (focusCode ? 0.052 : 0.042) * (LABEL_CODE_ONLY[code] ? 0.8 : 1);
    mapParts.labelEls[code].setAttribute('font-size', fs);
    mapParts.labelEls[code].setAttribute('stroke-width', fs * 0.16);
  });
  /* Rebuilding every marker each frame would flicker photo thumbnails;
     only re-render once the zoom has drifted a few percent. */
  if (!lastMarkerW || Math.abs(view.w - lastMarkerW) > lastMarkerW * 0.03) {
    lastMarkerW = view.w;
    renderMap();
  }
}
function clampView() {
  var mx = FULL.w * 0.3, my = FULL.h * 0.3;
  view.cx = Math.min(Math.max(view.cx, FULL.x - mx), FULL.x + FULL.w + mx);
  view.cy = Math.min(Math.max(view.cy, FULL.y - my), FULL.y + FULL.h + my);
}
function fitView() {
  if (!FULL) return;
  view.w = fitWidth();
  view.cx = FULL.x + FULL.w / 2;
  view.cy = FULL.y + FULL.h / 2;
  applyView();
}
function zoomAt(p, factor) {
  var newW = Math.min(Math.max(view.w * factor, FULL.w / 28), fitWidth() * 1.02);
  var k = newW / view.w;
  view.cx = p.x - (p.x - view.cx) * k;
  view.cy = p.y - (p.y - view.cy) * k;
  view.w = newW;
  clampView(); applyView();
}
function clientToSvg(evt) {
  var pt = mapSvg.createSVGPoint();
  pt.x = evt.clientX; pt.y = evt.clientY;
  var m = mapSvg.getScreenCTM();
  if (!m) return null;
  return pt.matrixTransform(m.inverse());
}
function cancelViewAnim() { if (viewAnim) { cancelAnimationFrame(viewAnim); viewAnim = null; } }
function animateViewTo(cx, cy, w, dur) {
  cancelViewAnim();
  var from = { cx: view.cx, cy: view.cy, w: view.w };
  var start = null;
  function step(ts) {
    if (!start) start = ts;
    var t = Math.min(1, (ts - start) / (dur || 600));
    var e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    view.cx = from.cx + (cx - from.cx) * e;
    view.cy = from.cy + (cy - from.cy) * e;
    view.w = from.w + (w - from.w) * e;
    clampView(); applyView();
    viewAnim = t < 1 ? requestAnimationFrame(step) : null;
  }
  viewAnim = requestAnimationFrame(step);
}
function refreshFocusUI() {
  $('backBtn').hidden = !focusCode;
  if (mapParts) {
    Object.keys(mapParts.paths).forEach(function (code) {
      mapParts.paths[code].style.opacity = (!focusCode || focusCode === code) ? '' : '0.45';
    });
  }
  $('tapHint').textContent = focusCode
    ? '📍 ' + PROVINCE_BY_CODE[focusCode].name + ' — tap a marker, or tap the map to pitch your tent ⛺'
    : 'Tap a province to explore its parks 🏕';
}
function focusProvince(code) {
  var f = GEO_BY_CODE[code];
  if (!f) return;
  focusCode = code;
  refreshFocusUI();
  var r = stageRect();
  var bw = f.bounds.x1 - f.bounds.x0, bh = f.bounds.y1 - f.bounds.y0;
  var tw = Math.max(bw * 1.3, bh * 1.3 * (r.width / Math.max(r.height, 1)));
  tw = Math.min(Math.max(tw, FULL.w / 30), fitWidth());
  animateViewTo((f.bounds.x0 + f.bounds.x1) / 2, (f.bounds.y0 + f.bounds.y1) / 2, tw, 650);
}
function exitFocus() {
  if (!GEO || !FULL) return;
  focusCode = null;
  clearTempCamp();
  refreshFocusUI();
  animateViewTo(FULL.x + FULL.w / 2, FULL.y + FULL.h / 2, fitWidth(), 650);
}
function focusLatLng(lat, lng, w) {
  var xy = project(lat, lng);
  animateViewTo(xy[0], xy[1], w || FULL.w / 6, 600);
}

/* ---------------- Pointer: drag to pan, tap to act ---------------- */
var drag = null, pendingCamp = null;
function clearTempCamp() {
  pendingCamp = null;
  if (mapParts && mapParts.temp) {
    while (mapParts.temp.firstChild) mapParts.temp.removeChild(mapParts.temp.firstChild);
  }
}
function showTempCamp(lat, lng) {
  clearTempCamp();
  pendingCamp = { lat: lat, lng: lng };
  var xy = project(lat, lng);
  var s = markerSize();
  var g = squareMarker(xy[0], xy[1], s, 'mk-temp', '⛺', 0.95);
  g.setAttribute('class', 'camp-marker');
  mapParts.temp.appendChild(g);
}
mapSvg.addEventListener('pointerdown', function (e) {
  drag = { x: e.clientX, y: e.clientY, cx: view.cx, cy: view.cy, moved: false };
  cancelViewAnim();
});
mapSvg.addEventListener('pointermove', function (e) {
  if (!drag) return;
  var r = stageRect();
  var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
  if (Math.abs(dx) + Math.abs(dy) > 7) drag.moved = true;
  if (drag.moved) {
    var h = view.w * (r.height / Math.max(r.width, 1));
    view.cx = drag.cx - dx / r.width * view.w;
    view.cy = drag.cy - dy / r.height * h;
    clampView(); applyView();
  }
});
mapSvg.addEventListener('pointerup', function (e) {
  if (!drag) return;
  var wasDrag = drag.moved;
  drag = null;
  if (wasDrag) return;
  var p = clientToSvg(e);
  if (!p) return;
  var t = e.target;
  var code = (t && t.dataset) ? t.dataset.code : null;
  if (!focusCode) {
    if (code) focusProvince(code);
    return;
  }
  if (code && code !== focusCode) { focusProvince(code); return; }
  /* Focused: a tap on open map = pitch a tent here. */
  var ll = unproject(p.x, p.y);
  if (ll.lat < 41 || ll.lat > 84 || ll.lng < -142 || ll.lng > -52) return;
  showTempCamp(ll.lat, ll.lng);
  openCampForm();
});
mapSvg.addEventListener('pointercancel', function () { drag = null; });
mapSvg.addEventListener('wheel', function (e) {
  e.preventDefault();
  var p = clientToSvg(e);
  if (p) zoomAt(p, e.deltaY > 0 ? 1.18 : 0.85);
}, { passive: false });
mapSvg.addEventListener('dblclick', function (e) {
  var p = clientToSvg(e);
  if (p) zoomAt(p, 0.55);
});

/* ---------------- Sheets ---------------- */
var SHEETS = ['parkSheet', 'campSheet', 'journalSheet', 'posterSheet', 'settingsSheet'];
function openSheet(id) {
  SHEETS.forEach(function (s) { $(s).hidden = s !== id; });
  $('backdrop').hidden = false;
}
function closeSheets() {
  SHEETS.forEach(function (s) { $(s).hidden = true; });
  $('backdrop').hidden = true;
  clearTempCamp();
}
$('backdrop').addEventListener('click', closeSheets);
document.querySelectorAll('[data-close]').forEach(function (b) {
  b.addEventListener('click', closeSheets);
});

/* ---------------- HUD ---------------- */
function renderHUD() {
  var n = mainCleared();
  var pct = Math.round(n / PARKS_MAIN.length * 100);
  $('lvlChip').textContent = '🏕 Explorer Lv.' + levelFor(n);
  $('expFill').style.width = pct + '%';
  $('expText').textContent = 'MAIN QUEST ' + n + '/' + PARKS_MAIN.length + ' · ' + pct + '%';
  var chips = '';
  SIDE_SETS.forEach(function (set) {
    chips += '<span class="side-chip">🧭 Side · ' + esc(set.label) + ' ' +
      setCleared(set) + '/' + set.parks.length + '</span>';
  });
  if (PARKS_BONUS.length) {
    chips += '<span class="side-chip bonus">⭐ Bonus ' + bonusCleared() +
      '/' + PARKS_BONUS.length + '</span>';
  }
  chips += '<span class="side-chip camp">⛺ My Spots ' + state.camps.length + '</span>';
  $('hudChips').innerHTML = chips;
}

/* ---------------- Clear FX ---------------- */
function playClearFx(leveledTo, floatText) {
  $('expFloat').textContent = floatText || '+100 EXP';
  var fx = $('stampFx');
  fx.hidden = false;
  setTimeout(function () { fx.hidden = true; }, 1650);
  if (leveledTo) {
    $('lvlBody').textContent = 'Explorer Lv.' + leveledTo;
    setTimeout(function () {
      var lf = $('lvlFx');
      lf.hidden = false;
      setTimeout(function () { lf.hidden = true; }, 2450);
    }, 1000);
  }
}

/* ---------------- Park quest card ---------------- */
var currentPark = null, pendingPhoto = undefined;
function openPark(park) {
  currentPark = park;
  pendingPhoto = undefined;
  var visit = state.visits[park.id];
  $('pkMedal').textContent = visit ? '★' : '?';
  $('pkMedal').className = 'park-medal' + (visit ? ' done' : '') +
    (park.tier === 'side' ? ' side' : '') + (park.tier === 'bonus' ? ' bonus' : '');
  $('pkName').textContent = park.name;
  $('pkProv').textContent = PROVINCE_BY_CODE[park.province].name;
  $('pkKind').textContent = KIND_LABEL[park.kind] +
    (park.tier === 'side' ? ' · Side Quest' : (park.tier === 'bonus' ? ' · Bonus Quest' : ''));
  $('pkBlurb').textContent = park.blurb;
  $('visitForm').hidden = true;
  $('vPreview').hidden = true;
  $('vPhoto').value = '';
  if (visit) {
    $('pkOpen').hidden = true;
    $('pkDone').hidden = false;
    $('pkDate').textContent = '✅ Cleared — visited ' + fmtDate(visit.date);
    var img = $('pkPhoto');
    if (visit.photo) { img.src = visit.photo; img.hidden = false; }
    else img.hidden = true;
    $('pkPhotoBtnText').textContent = visit.photo ? 'Change photo' : 'Add a photo';
  } else {
    $('pkOpen').hidden = false;
    $('pkDone').hidden = true;
  }
  openSheet('parkSheet');
}
$('pkWentBtn').addEventListener('click', function () {
  $('pkOpen').hidden = true;
  $('visitForm').hidden = false;
  $('vDate').value = todayStr();
  pendingPhoto = undefined;
});
$('visitCancelBtn').addEventListener('click', function () {
  $('visitForm').hidden = true;
  $('pkOpen').hidden = false;
  pendingPhoto = undefined;
});
$('vPhoto').addEventListener('change', function () {
  var f = this.files && this.files[0];
  if (!f) { pendingPhoto = undefined; $('vPreview').hidden = true; return; }
  fileToDataURL(f, function (url) {
    pendingPhoto = url;
    if (url) { $('vPreview').src = url; $('vPreview').hidden = false; }
  });
});
$('visitForm').addEventListener('submit', function (e) {
  e.preventDefault();
  if (!currentPark) return;
  var before = levelFor(mainCleared());
  state.visits[currentPark.id] = {
    date: $('vDate').value || todayStr(),
    photo: pendingPhoto || null
  };
  var stored = saveStateChecked();
  var after = levelFor(mainCleared());
  closeSheets();
  renderAll();
  if (stored) {
    /* EXP (and level-ups) belong to the main quest only; side and
       bonus clears get the stamp with their own float label. */
    var floatText = currentPark.tier === 'main' ? '+100 EXP'
      : (currentPark.tier === 'bonus' ? '★ BONUS' : '★ SIDE');
    playClearFx(currentPark.tier === 'main' && after > before ? after : 0, floatText);
  }
});
$('pkPhotoInput').addEventListener('change', function () {
  var f = this.files && this.files[0];
  if (!f || !currentPark) return;
  fileToDataURL(f, function (url) {
    if (!url) { alert('That photo could not be read — try another one.'); return; }
    state.visits[currentPark.id].photo = url;
    if (saveStateChecked()) { openPark(currentPark); renderAll(); }
  });
  this.value = '';
});
$('pkRemoveBtn').addEventListener('click', function () {
  if (!currentPark) return;
  if (!confirm('Remove this visit? The stamp and photo will be deleted.')) return;
  delete state.visits[currentPark.id];
  saveState();
  closeSheets();
  renderAll();
});
/* localStorage can fill up with photos: if a save fails, keep the stamp
   but drop the photo and tell the user why (Supabase Storage fixes this). */
function saveStateChecked() {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(
      { visits: state.visits, camps: state.camps, seeded: true }));
    return true;
  } catch (e) {
    Object.keys(state.visits).forEach(function (k) { state.visits[k].photo = null; });
    state.camps.forEach(function (c) { c.photo = null; });
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(
        { visits: state.visits, camps: state.camps, seeded: true }));
      alert('Storage is full, so visits were saved without photos this time.');
      return true;
    } catch (e2) {
      alert('Storage is full — the visit is kept for this session only.');
      return false;
    }
  }
}

/* ---------------- My campsites (free layer) ---------------- */
var currentCamp = null, campPhotoData = undefined;
function openCampForm() {
  currentCamp = null;
  campPhotoData = undefined;
  $('campForm').hidden = false;
  $('campView').hidden = true;
  $('cName').value = '';
  $('cDate').value = todayStr();
  $('cPhoto').value = '';
  $('cPreview').hidden = true;
  openSheet('campSheet');
}
function openCampView(camp) {
  currentCamp = camp;
  clearTempCamp();
  $('campForm').hidden = true;
  $('campView').hidden = false;
  $('cvName').textContent = '⛺ ' + camp.name;
  $('cvDate').textContent = 'Pitched ' + fmtDate(camp.date);
  var img = $('cvPhoto');
  if (camp.photo) { img.src = camp.photo; img.hidden = false; } else img.hidden = true;
  openSheet('campSheet');
}
$('campCancelBtn').addEventListener('click', function () {
  closeSheets();
});
$('cPhoto').addEventListener('change', function () {
  var f = this.files && this.files[0];
  if (!f) { campPhotoData = undefined; $('cPreview').hidden = true; return; }
  fileToDataURL(f, function (url) {
    campPhotoData = url;
    if (url) { $('cPreview').src = url; $('cPreview').hidden = false; }
  });
});
$('campForm').addEventListener('submit', function (e) {
  e.preventDefault();
  if (!pendingCamp) { closeSheets(); return; }
  state.camps.push({
    id: 'camp-' + Date.now(),
    name: $('cName').value.trim() || 'My campsite',
    lat: pendingCamp.lat, lng: pendingCamp.lng,
    date: $('cDate').value || todayStr(),
    photo: campPhotoData || null
  });
  saveStateChecked();
  clearTempCamp();
  closeSheets();
  renderAll();
});
$('campDeleteBtn').addEventListener('click', function () {
  if (!currentCamp) return;
  if (!confirm('Remove this campsite?')) return;
  state.camps = state.camps.filter(function (c) { return c.id !== currentCamp.id; });
  saveState();
  closeSheets();
  renderAll();
});

/* ---------------- Quest journal ---------------- */
function questRow(park) {
  var visit = state.visits[park.id];
  return '<button type="button" class="quest-row' + (visit ? '' : ' open') +
    '" data-park="' + park.id + '">' +
    '<span class="q-ico">' + (visit ? '🏕' : '❔') + '</span>' +
    '<span class="q-name">' + esc(park.name) +
    '<small>' + esc(KIND_LABEL[park.kind]) + (visit ? ' · ' + fmtDate(visit.date) : '') + '</small></span>' +
    '<span class="q-badge' + (visit ? '' : ' todo') + '">' + (visit ? 'CLEAR' : 'OPEN') + '</span></button>';
}
function renderJournal() {
  var n = mainCleared();
  var rank = rankFor(n);
  $('rankName').textContent = rank.name;
  $('rankCount').textContent = n + ' / ' + PARKS_MAIN.length + ' parks · Lv.' + levelFor(n);
  $('rankFill').style.width = Math.round(n / PARKS_MAIN.length * 100) + '%';
  var next = RANKS.filter(function (r) { return r.min > n; })[0];
  $('rankNext').textContent = next
    ? 'Next rank at ' + next.min + ' parks — ' + (next.min - n) + ' to go.'
    : 'Top rank reached. Canada is yours. 🇨🇦';
  var html = '';
  PROVINCES.forEach(function (prov) {
    var parks = PARKS_MAIN.filter(function (p) { return p.province === prov.code; });
    if (prov.code === 'NT') parks = parks.concat(PARKS_MAIN.filter(function (p) { return p.id === 'wood-buffalo'; }));
    if (!parks.length) return;
    var done = parks.filter(function (p) { return !!state.visits[p.id]; }).length;
    html += '<div class="quest-prov"><h3>' + esc(prov.name) +
      '<span class="count">' + done + ' / ' + parks.length + '</span></h3>' +
      parks.map(questRow).join('') + '</div>';
  });
  $('mainListWrap').innerHTML = html;
  $('bonusListWrap').innerHTML = '<div class="quest-prov"><h3>⭐ BONUS' +
    '<span class="count">' + bonusCleared() + ' / ' + PARKS_BONUS.length + '</span></h3>' +
    '<p class="hint">Rouge is a National Urban Park — not one of the official 48, ' +
    'so it never counts toward your counter or level. Clear it for bragging rights.</p>' +
    PARKS_BONUS.map(questRow).join('') + '</div>';
  var sh = '';
  SIDE_SETS.forEach(function (set) {
    sh += '<div class="quest-prov"><h3>🧭 ' + esc(set.label) + ' side quests' +
      '<span class="count">' + setCleared(set) + ' / ' + set.parks.length + '</span></h3>' +
      set.parks.map(questRow).join('') + '</div>';
  });
  $('sideListWrap').innerHTML = sh;
  if (!state.camps.length) {
    $('campListWrap').innerHTML = '<p class="hint">No spots yet — your first tent is waiting out there. ⛺</p>';
  } else {
    $('campListWrap').innerHTML = state.camps.map(function (c) {
      return '<button type="button" class="quest-row" data-camp="' + c.id + '">' +
        '<span class="q-ico">⛺</span><span class="q-name">' + esc(c.name) +
        '<small>' + fmtDate(c.date) + '</small></span>' +
        '<span class="q-badge">MINE</span></button>';
    }).join('');
  }
  document.querySelectorAll('[data-park]').forEach(function (row) {
    row.addEventListener('click', function () {
      var park = PARK_BY_ID[row.getAttribute('data-park')];
      if (!park) return;
      closeSheets();
      if (park.province !== focusCode) focusProvince(park.province);
      focusLatLng(park.lat, park.lng, Math.min(view.w, FULL.w / 5));
      setTimeout(function () { openPark(park); }, 350);
    });
  });
  document.querySelectorAll('[data-camp]').forEach(function (row) {
    row.addEventListener('click', function () {
      var camp = state.camps.filter(function (c) {
        return c.id === row.getAttribute('data-camp');
      })[0];
      if (!camp) return;
      closeSheets();
      focusLatLng(camp.lat, camp.lng, FULL.w / 6);
      setTimeout(function () { openCampView(camp); }, 350);
    });
  });
}
document.querySelectorAll('.tab').forEach(function (tab) {
  tab.addEventListener('click', function () {
    document.querySelectorAll('.tab').forEach(function (t) {
      t.classList.toggle('active', t === tab);
    });
    var which = tab.getAttribute('data-tab');
    $('tabMain').hidden = which !== 'main';
    $('tabSide').hidden = which !== 'side';
    $('tabSpots').hidden = which !== 'spots';
  });
});

/* ---------------- Poster ---------------- */
function renderPoster() {
  renderPosterSvg();
  var n = mainCleared();
  var provs = {};
  PARKS_MAIN.forEach(function (p) { if (state.visits[p.id]) provs[p.province] = true; });
  $('posterSub').textContent = n
    ? n + ' of 48 national parks & reserves stamped — the map is filling in!'
    : '48 parks & reserves await. Your first stamp is out there.';
  $('posterStats').innerHTML =
    '<div><strong>' + n + ' / 48</strong><span>Main quests</span></div>' +
    '<div><strong>Lv.' + levelFor(n) + '</strong><span>Explorer level</span></div>' +
    '<div><strong>' + Object.keys(provs).length + '</strong><span>Provinces started</span></div>';
  var small = SIDE_SETS.map(function (set) {
    return '🧭 Side · ' + set.label + ' ' + setCleared(set) + '/' + set.parks.length;
  }).join('   ·   ');
  small += (small ? '   ·   ' : '') + '⭐ Bonus ' + bonusCleared() + '/' + PARKS_BONUS.length;
  small += '   ·   ⛺ My Spots ' + state.camps.length;
  $('posterSmall').textContent = small;
  var names = PARKS_MAIN.filter(function (p) { return !!state.visits[p.id]; })
    .map(function (p) { return p.name; });
  $('posterNames').innerHTML = names.length
    ? '<strong>Stamped:</strong> ' + names.map(esc).join(' · ')
    : 'No stamps yet — every quest starts with a single park.';
}
function renderPosterSvg() {
  if (!posterParts) return;
  renderMarkersInto(posterParts, false, FULL.w);
  refreshProvinceFills();
}
function savePosterPng() {
  if (!GEO || !posterSvg) { alert('The map is still loading — try again in a moment.'); return; }
  var n = mainCleared();
  var clone = posterSvg.cloneNode(true);
  clone.setAttribute('xmlns', SVGNS);
  var drawW = 1500;
  var drawH = Math.round(drawW * FULL.h / FULL.w);
  clone.setAttribute('width', drawW);
  clone.setAttribute('height', drawH);
  clone.setAttribute('viewBox', FULL.x + ' ' + FULL.y + ' ' + FULL.w + ' ' + FULL.h);
  var svgStr = new XMLSerializer().serializeToString(clone);
  var url = URL.createObjectURL(new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' }));
  var img = new Image();
  img.onload = function () {
    var names = PARKS_MAIN.filter(function (p) { return !!state.visits[p.id]; })
      .map(function (p) { return p.name; });
    var roundFont = '"Arial Rounded MT Bold","Hiragino Maru Gothic ProN",ui-rounded,system-ui,sans-serif';
    var pxFont = '"Press Start 2P",ui-monospace,monospace';
    var meas = document.createElement('canvas').getContext('2d');
    meas.font = '400 25px ' + roundFont;
    var lines = [], line = '';
    names.forEach(function (nm) {
      var test = line ? line + '  ·  ' + nm : nm;
      if (meas.measureText(test).width > 1560 && line) { lines.push(line); line = nm; }
      else line = test;
    });
    if (line) lines.push(line);
    if (!lines.length) lines = ['No stamps yet — every quest starts with a single park.'];
    var cw = 1760, ch = 1330 + lines.length * 38 + 120;
    var canvas = document.createElement('canvas');
    canvas.width = cw; canvas.height = ch;
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fffaf0';
    ctx.fillRect(0, 0, cw, ch);
    ctx.strokeStyle = '#5b3a1e'; ctx.lineWidth = 12;
    ctx.strokeRect(18, 18, cw - 36, ch - 36);
    ctx.strokeStyle = '#c98d4e'; ctx.lineWidth = 4;
    ctx.strokeRect(42, 42, cw - 84, ch - 84);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#b4552d';
    ctx.font = '28px ' + pxFont;
    ctx.fillText('CANADA PARKS QUEST', cw / 2, 118);
    ctx.fillStyle = '#4a3f35';
    ctx.font = '800 58px ' + roundFont;
    ctx.fillText('Every park, one stamp at a time', cw / 2, 196);
    ctx.fillStyle = '#d94f4f';
    ctx.font = '52px ' + pxFont;
    ctx.fillText(n + ' / 48', cw / 2, 282);
    var boxW = 1620, boxH = 860, boxY = 320;
    var scale = Math.min(boxW / drawW, boxH / drawH);
    var dw = drawW * scale, dh = drawH * scale;
    ctx.drawImage(img, (cw - dw) / 2, boxY + (boxH - dh) / 2, dw, dh);
    URL.revokeObjectURL(url);
    var small = SIDE_SETS.map(function (set) {
      return 'Side · ' + set.label + ' ' + setCleared(set) + '/' + set.parks.length;
    }).join('    ');
    small += '     ⭐ Bonus ' + bonusCleared() + '/' + PARKS_BONUS.length;
    ctx.fillStyle = '#4a3f35';
    ctx.font = '800 34px ' + roundFont;
    ctx.fillText('Explorer Lv.' + levelFor(n) + '     ' + small +
      '     ⛺ My Spots ' + state.camps.length, cw / 2, 1252);
    ctx.fillStyle = '#4a3f35';
    ctx.font = '400 25px ' + roundFont;
    lines.forEach(function (ln, i) { ctx.fillText(ln, cw / 2, 1310 + i * 38); });
    ctx.fillStyle = '#a08b74';
    ctx.font = '400 25px ' + roundFont;
    ctx.fillText('🏕️ Made with our own two feet — from coast to coast to coast.',
      cw / 2, 1310 + lines.length * 38 + 44);
    if (canvas.toBlob) {
      canvas.toBlob(function (blob) {
        var a = document.createElement('a');
        a.download = 'parks-quest-poster.png';
        a.href = URL.createObjectURL(blob);
        a.click();
        setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
      }, 'image/png');
    } else {
      var a2 = document.createElement('a');
      a2.download = 'parks-quest-poster.png';
      a2.href = canvas.toDataURL('image/png');
      a2.click();
    }
  };
  img.onerror = function () {
    URL.revokeObjectURL(url);
    alert('Could not build the poster image — please try again.');
  };
  img.src = url;
}

/* ---------------- Chrome wiring ---------------- */
function renderAll() {
  renderHUD();
  renderJournal();
  renderMap();
  renderPoster();
}
$('mapBtn').addEventListener('click', function () { closeSheets(); exitFocus(); });
$('journalBtn').addEventListener('click', function () { renderJournal(); openSheet('journalSheet'); });
$('posterBtn').addEventListener('click', function () { renderPoster(); openSheet('posterSheet'); });
$('settingsBtn').addEventListener('click', function () { openSheet('settingsSheet'); });
$('posterPngBtn').addEventListener('click', savePosterPng);
$('backBtn').addEventListener('click', exitFocus);
$('zoomIn').addEventListener('click', function () {
  zoomAt({ x: view.cx, y: view.cy }, 0.62);
});
$('zoomOut').addEventListener('click', function () {
  zoomAt({ x: view.cx, y: view.cy }, 1.6);
});
$('zoomReset').addEventListener('click', exitFocus);
$('resetBtn').addEventListener('click', function () {
  if (!confirm('Reset the whole quest? All visits, photos and campsites on this device will be cleared.')) return;
  state.visits = {};
  state.camps = [];
  saveState();
  closeSheets();
  renderAll();
  alert('Fresh start! 48 main quests, side quests and a blank map await. 🏕');
});
window.addEventListener('resize', function () { if (FULL) applyView(); });

/* ---------------- Init ---------------- */
(async function init() {
  loadState();
  try {
    await loadGeo();
  } catch (e) {
    $('tapHint').textContent = 'The map could not load — check your connection and refresh.';
    return;
  }
  mapParts = buildSvgView(mapSvg, true);
  posterParts = buildSvgView(posterSvg, false);
  Object.keys(posterParts.labelEls).forEach(function (code) {
    posterParts.labelEls[code].setAttribute('font-size',
      FULL.w * 0.042 * (LABEL_CODE_ONLY[code] ? 0.8 : 1));
  });
  fitView();
  refreshFocusUI();
  renderAll();
})();

})();
