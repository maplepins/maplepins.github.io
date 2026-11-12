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
   The map's land is divided into one stained-glass cell per
   main/bonus park: the Voronoi piece of its province that is
   closer to that park than to any sibling park, clipped to the
   province outline. Clearing a park fills ONLY its own cell
   with its photo — fill every cell and the whole map becomes
   your photos, in the shape of Canada. Side quests and
   campsites own no cells; they stay markers.
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
var state = { visits:{}, camps:[], samplesActive:false };
function statePayload() {
  return { visits: state.visits, camps: state.camps,
           seeded: true, samples: state.samplesActive };
}
function saveState() {
  try { localStorage.setItem(LS_KEY, JSON.stringify(statePayload())); }
  catch (e) { /* storage full/blocked — state stays in memory */ }
}
function loadState() {
  var raw = null;
  try { raw = localStorage.getItem(LS_KEY); } catch (e) { /* ignore */ }
  if (!raw) {
    state.visits = JSON.parse(JSON.stringify(SAMPLE_VISITS));
    state.camps = [];
    state.samplesActive = true;   /* first run: these stamps are demos */
    saveState();
    return;
  }
  try {
    var d = JSON.parse(raw);
    state.visits = d.visits || {};
    state.camps = Array.isArray(d.camps) ? d.camps : [];
    state.samplesActive = !!d.samples;
  } catch (e) { state.visits = {}; state.camps = []; state.samplesActive = false; }
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
  function finish(img, w0, h0) {
    /* Cap the LONGEST side at 800px (the old width-only cap let
       tall phone screenshots balloon into huge data URLs). */
    var scale = Math.min(1, 800 / Math.max(w0, h0));
    var w = Math.max(1, Math.round(w0 * scale));
    var h = Math.max(1, Math.round(h0 * scale));
    var c = document.createElement('canvas');
    c.width = w; c.height = h;
    c.getContext('2d').drawImage(img, 0, 0, w, h);
    cb(c.toDataURL('image/jpeg', 0.82));
  }
  var rd = new FileReader();
  rd.onload = function () {
    var img = new Image();
    img.onload = function () { finish(img, img.width, img.height); };
    img.onerror = function () {
      /* Some phone photos (HEIC "high efficiency" shots) cannot be
         decoded from a data URL by this browser. createImageBitmap
         goes through the OS decoder instead, which often can —
         give the photo one more chance before giving up. */
      if (!window.createImageBitmap) { cb(null); return; }
      var p;
      try { p = createImageBitmap(file, { imageOrientation: 'from-image' }); }
      catch (e) { p = createImageBitmap(file); }
      p.then(function (bmp) { finish(bmp, bmp.width, bmp.height); },
             function () { cb(null); });
    };
    img.src = rd.result;
  };
  rd.onerror = function () { cb(null); };
  rd.readAsDataURL(file);
}
var PHOTO_READ_FAIL_MSG = 'That photo could not be read. If it is a ' +
  'HEIC (high-efficiency) photo, this browser cannot open it — ' +
  'try a JPEG or PNG instead.';

/* ---------------- Illustrated map (same recipe as app.js) ---------------- */
var SVGNS = 'http://www.w3.org/2000/svg';
var K_LNG = 0.55, PAD = 0.6;
/* Province labels: abbreviations only at country zoom (the full
   names collided with each other and clipped at the frame edge);
   the focused province swaps its label to the full name. Anchors
   are hand-tuned [lat, lng] where the polygon centroid crowds a
   neighbour — elsewhere the centroid is used. */
var LABEL_ANCHOR = {
  YT: [64.3, -134.8], NT: [66.0, -120.5], NU: [67.0, -96.0],
  NB: [46.55, -67.9], PE: [47.95, -63.2], NL: [55.0, -62.5]
};
/* NB/PE separation: at country zoom (label fs = view.w*0.034 ≈
   1.69 units, two bold caps ≈ 2.37 wide + halo → centres need
   ≳2.64) the old anchors sat 2.19 apart and the glyphs touched.
   NB is nudged W/SW inside the province, PE lifted over the Gulf
   above the island's north shore: centres now 2.94 apart, glyph
   boxes clear of PE (x axis) without crowding NS (y axis). */
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
/* Set both href and xlink:href on an SVG <image>: plain href is the
   modern spelling, but older Android WebViews (in-app browsers) and
   SVG-as-image serialization (the poster PNG export) still expect
   the xlink form — belt and braces so photos render everywhere. */
var XLINK_NS = 'http://www.w3.org/1999/xlink';
function setImageHref(img, url) {
  img.setAttribute('href', url);
  try { img.setAttributeNS(XLINK_NS, 'xlink:href', url); } catch (e) { /* ignore */ }
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
  var viewKey = isMain ? 'm' : 'p';
  var parts = { paths:{}, labels:null, markers:null, camps:null, temp:null, badges:null,
    labelEls:{}, fillGroups:{}, outlines:{}, viewKey: viewKey };
  /* Clips: one per province (its outline) and one per park cell.
     Ids are prefixed per view so map and poster never collide. */
  var defs = svgEl('defs');
  GEO.features.forEach(function (f) {
    var cp = svgEl('clipPath', { id: 'provclip-' + viewKey + '-' + f.code });
    cp.appendChild(svgEl('path', { d: f.d }));
    defs.appendChild(cp);
  });
  Object.keys(CELLS).forEach(function (id) {
    var cp = svgEl('clipPath', { id: 'cellclip-' + viewKey + '-' + id });
    cp.appendChild(svgEl('path', { d: cellPathD(CELLS[id]) }));
    defs.appendChild(cp);
  });
  svg.appendChild(defs);
  var gProv = svgEl('g');
  GEO.features.forEach(function (f) {
    var p = svgEl('path', { d: f.d, fill: provinceFill(f.code), stroke: '#ffffff',
      'stroke-width': 0.13, 'stroke-linejoin': 'round' });
    p.dataset.code = f.code;
    parts.paths[f.code] = p;
    gProv.appendChild(p);
  });
  svg.appendChild(gProv);
  /* Photo-cell layer: one province-clipped group per province,
     populated by renderPhotoFills(). Never intercepts taps, so
     province focusing keeps working through it. */
  var gFills = svgEl('g');
  GEO.features.forEach(function (f) {
    var g = svgEl('g', { 'clip-path': 'url(#provclip-' + viewKey + '-' + f.code + ')' });
    g.style.pointerEvents = 'none';
    parts.fillGroups[f.code] = g;
    gFills.appendChild(g);
  });
  svg.appendChild(gFills);
  /* Crisp province outlines above the photo fills, so Canada's
     shape stays readable even when a province is all photos. */
  var gOut = svgEl('g');
  GEO.features.forEach(function (f) {
    var o = svgEl('path', { d: f.d, fill: 'none', stroke: '#ffffff',
      'stroke-width': 0.17, 'stroke-linejoin': 'round' });
    o.style.pointerEvents = 'none';
    parts.outlines[f.code] = o;
    gOut.appendChild(o);
  });
  svg.appendChild(gOut);
  /* Decorative pixel maple trees printed on the map's bottom ocean
     corners, like illustrations on an old game map. Living inside the
     SVG means they can never collide with the HUD or dock chrome. */
  addMapTrees(svg);
  parts.labels = svgEl('g');
  GEO.features.forEach(function (f) {
    var anchor = LABEL_ANCHOR[f.code]
      ? project(LABEL_ANCHOR[f.code][0], LABEL_ANCHOR[f.code][1]) : null;
    var t = svgEl('text', { x: anchor ? anchor[0] : f.label.x,
      y: anchor ? anchor[1] : f.label.y, 'text-anchor': 'middle',
      fill: '#96754d', 'paint-order': 'stroke', stroke: '#fdf6ec',
      'stroke-linejoin': 'round', 'font-weight': 700, opacity: 0.9 });
    t.style.pointerEvents = 'none';
    t.textContent = f.code;
    parts.labels.appendChild(t);
    parts.labelEls[f.code] = t;
  });
  svg.appendChild(parts.labels);
  parts.markers = svgEl('g'); svg.appendChild(parts.markers);
  parts.camps = svgEl('g'); svg.appendChild(parts.camps);
  /* Quest "!" badges float above every marker and label (interactive
     map only — renderMarkersInto leaves this empty for the poster). */
  parts.badges = svgEl('g'); svg.appendChild(parts.badges);
  if (isMain) { parts.temp = svgEl('g'); svg.appendChild(parts.temp); }
  svg.setAttribute('viewBox', FULL.x + ' ' + FULL.y + ' ' + FULL.w + ' ' + FULL.h);
  return parts;
}
/* ---------------- Pixel maple trees (map decoration) ----------------
   One 14×15 pixel grid, two autumn palettes. Drawn with plain rects
   inside the SVG, so the trees pan/zoom with the map like artwork
   printed on it — and show up on the poster too. */
var TREE_GRID = [
  '.....YY.......',
  '....YOOY......',
  '...YOOOOY.....',
  '..YOOOOOOY....',
  '..ROOOOOR.....',
  '.ROOOOOOOOR...',
  '.ROoOOOOoOR...',
  '.ROOOOOOOOR...',
  '..ROOOOOOR....',
  '...ROOOOR.....',
  '....ROOR......',
  '.....TT.......',
  '.....TT.......',
  '....TTTT......',
  '..gggggggg....'
];
var TREE_PALETTE_A = { Y:'#f2c230', O:'#e8862e', o:'#f5a83d', R:'#d94f4f', T:'#7a4a21', g:'#3e7d32' };
var TREE_PALETTE_B = { Y:'#f2c230', O:'#d94f4f', o:'#ef6f3c', R:'#e8862e', T:'#7a4a21', g:'#3e7d32' };
function pixelTree(cell, palette) {
  var g = svgEl('g');
  TREE_GRID.forEach(function (row, ry) {
    for (var rx = 0; rx < 14; rx++) {
      var c = palette[row[rx] || '.'];
      if (!c) continue;
      g.appendChild(svgEl('rect', { x: rx * cell, y: ry * cell,
        width: cell * 1.04, height: cell * 1.04, fill: c }));
    }
  });
  return g;
}
function addMapTrees(svg) {
  if (!FULL) return;
  var g = svgEl('g');
  g.style.pointerEvents = 'none';
  var base = FULL.y + FULL.h * 0.995;   /* southern edge of the land bounds */
  function place(palette, heightFrac, cx, mirror) {
    var th = FULL.h * heightFrac, cell = th / TREE_GRID.length;
    var t = pixelTree(cell, palette);
    var w = cell * 14;
    var x = mirror ? cx - w : cx;
    t.setAttribute('transform', 'translate(' + x + ' ' + (base - th) + ')');
    g.appendChild(t);
  }
  /* Bottom-left: a big orange tree with a smaller red one beside it.
     Bottom-right: one red tree. All three sit in open ocean corners. */
  place(TREE_PALETTE_A, 0.088, FULL.x + FULL.w * 0.012, false);
  place(TREE_PALETTE_B, 0.06, FULL.x + FULL.w * 0.012 + FULL.h * 0.088 / TREE_GRID.length * 15.2, false);
  place(TREE_PALETTE_B, 0.074, FULL.x + FULL.w * 0.988, true);
  svg.appendChild(g);
}

function refreshProvinceFills() {
  [mapParts, posterParts].forEach(function (parts) {
    if (!parts) return;
    Object.keys(parts.paths).forEach(function (code) {
      parts.paths[code].setAttribute('fill', provinceFill(code));
    });
  });
}

/* ---------------- Photo cells: one Voronoi piece per park ----------------
   Every main/bonus park owns the piece of its province closer to
   it than to any sibling park (half-plane clipping, no library),
   rendered clipped to the province outline. A cleared park's
   photo fills its cell only; an uncleared (or photo-less) cell
   keeps the province's progress colour with a subtle stained-
   glass shade, so it still reads as an empty slot. */
/*__PURE_START__*/
function clipHalfPlane(poly, mx, my, dx, dy) {
  /* Sutherland–Hodgman against one half-plane: keeps the points p
     with (p - m) · d <= 0. */
  var out = [];
  for (var i = 0; i < poly.length; i++) {
    var a = poly[i], b = poly[(i + 1) % poly.length];
    var da = (a[0] - mx) * dx + (a[1] - my) * dy;
    var db = (b[0] - mx) * dx + (b[1] - my) * dy;
    if (da <= 1e-9) out.push(a);
    if ((da < 0 && db > 0) || (da > 0 && db < 0)) {
      var t = da / (da - db);
      out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
    }
  }
  return out;
}
function voronoiCell(seed, seeds, rect) {
  var poly = rect;
  for (var i = 0; i < seeds.length; i++) {
    var o = seeds[i];
    if (o === seed) continue;
    poly = clipHalfPlane(poly,
      (seed.x + o.x) / 2, (seed.y + o.y) / 2, o.x - seed.x, o.y - seed.y);
    if (!poly.length) break;
  }
  return poly;
}
function computeCells(provinceRects, seeds) {
  var byProv = {};
  seeds.forEach(function (s) {
    (byProv[s.province] = byProv[s.province] || []).push(s);
  });
  var cells = {};
  Object.keys(byProv).forEach(function (code) {
    var r = provinceRects[code];
    if (!r) return;
    var m = 0.5;
    var rect = [[r.x0 - m, r.y0 - m], [r.x1 + m, r.y0 - m],
                [r.x1 + m, r.y1 + m], [r.x0 - m, r.y1 + m]];
    byProv[code].forEach(function (s) {
      var pts = voronoiCell(s, byProv[code], rect);
      if (pts.length < 3) return;
      var x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      pts.forEach(function (p) {
        if (p[0] < x0) x0 = p[0]; if (p[0] > x1) x1 = p[0];
        if (p[1] < y0) y0 = p[1]; if (p[1] > y1) y1 = p[1];
      });
      cells[s.id] = { pts: pts, x0: x0, y0: y0, x1: x1, y1: y1 };
    });
  });
  return cells;
}
/* Which photo (if any) fills a park's cell: the visitor's own
   photo wins; Bruce Peninsula's sample visit borrows an obvious
   illustration placeholder so the fill effect is visible on first
   run — it is never passed off as a real photograph. */
function pickCellPhoto(visit, parkId) {
  if (!visit) return null;
  if (visit.photo) return 'user';
  if (parkId === 'bruce-peninsula') return 'placeholder';
  return null;
}
/*__PURE_END__*/
var CELLS = {};
var PLACEHOLDER_ART = null;
function buildCells() {
  var rects = {}, seeds = [];
  GEO.features.forEach(function (f) { rects[f.code] = f.bounds; });
  ALL_PARKS.forEach(function (park) {
    if (park.tier === 'side') return;
    var xy = project(park.lat, park.lng);
    seeds.push({ id: park.id, province: park.province, x: xy[0], y: xy[1] });
  });
  CELLS = computeCells(rects, seeds);
}
function cellPathD(cell) {
  return cell.pts.map(function (p, i) {
    return (i === 0 ? 'M' : 'L') + p[0].toFixed(2) + ' ' + p[1].toFixed(2);
  }).join('') + 'Z';
}
function cellPhotoURL(park) {
  var kind = pickCellPhoto(state.visits[park.id], park.id);
  if (kind === 'user') return state.visits[park.id].photo;
  if (kind === 'placeholder') return PLACEHOLDER_ART;
  return null;
}
/* The Bruce placeholder: a small flat illustration (escarpment
   cliffs + turquoise Grotto water) drawn on a canvas, so it is a
   raster data URL exactly like a real photo — the poster export
   treats it identically, and nobody mistakes it for a photo. */
function makePlaceholderArt() {
  try {
    var c = document.createElement('canvas');
    c.width = 640; c.height = 480;
    var x = c.getContext('2d');
    var sky = x.createLinearGradient(0, 0, 0, 300);
    sky.addColorStop(0, '#79bfe6'); sky.addColorStop(1, '#e3f4fd');
    x.fillStyle = sky; x.fillRect(0, 0, 640, 310);
    x.fillStyle = '#ffd94d';
    x.beginPath(); x.arc(516, 84, 44, 0, 6.3); x.fill();
    x.fillStyle = '#fffdf4';
    [[120, 70, 46], [168, 70, 34], [430, 132, 30], [472, 132, 22]].forEach(function (cl) {
      x.beginPath(); x.arc(cl[0], cl[1], cl[2], 0, 6.3); x.fill();
    });
    x.fillStyle = '#8aa5b8';
    x.beginPath(); x.moveTo(0, 300); x.lineTo(0, 205); x.lineTo(120, 168);
    x.lineTo(265, 215); x.lineTo(395, 160); x.lineTo(520, 208); x.lineTo(640, 178);
    x.lineTo(640, 300); x.closePath(); x.fill();
    x.fillStyle = '#6d8ea6';
    x.beginPath(); x.moveTo(0, 300); x.lineTo(0, 248); x.lineTo(150, 214);
    x.lineTo(320, 256); x.lineTo(470, 210); x.lineTo(640, 244); x.lineTo(640, 300);
    x.closePath(); x.fill();
    var lake = x.createLinearGradient(0, 300, 0, 480);
    lake.addColorStop(0, '#3ec6b8'); lake.addColorStop(1, '#1d7a78');
    x.fillStyle = lake; x.fillRect(0, 300, 640, 180);
    x.fillStyle = 'rgba(255,255,255,0.5)';
    [318, 356, 402, 442].forEach(function (yy, i) {
      x.fillRect(40 + i * 36, yy, 210 - i * 30, 6);
      x.fillRect(392 - i * 22, yy + 4, 170 - i * 22, 6);
    });
    x.fillStyle = '#2e5d3a';
    function pine(px, py, s) {
      x.fillRect(px - 4 * s, py, 8 * s, 16 * s);
      [0, 1, 2].forEach(function (k) {
        var w = (30 - k * 8) * s, top = py - (14 + k * 15) * s;
        x.beginPath(); x.moveTo(px - w, top + 22 * s); x.lineTo(px, top);
        x.lineTo(px + w, top + 22 * s); x.closePath(); x.fill();
      });
    }
    pine(52, 330, 1.15); pine(112, 344, 0.8); pine(588, 334, 1.05); pine(532, 350, 0.72);
    return c.toDataURL('image/png');
  } catch (e) { return null; }
}
/* Renders the cell layer of one view (map or poster). Everything
   here uses presentation attributes, not CSS classes, so the
   fills survive the poster's SVG serialization byte-for-byte. */
function renderPhotoFills(parts) {
  if (!parts || !parts.fillGroups) return;
  Object.keys(parts.fillGroups).forEach(function (code) {
    var g = parts.fillGroups[code];
    while (g.firstChild) g.removeChild(g.firstChild);
    var parks = ALL_PARKS.filter(function (p) {
      return p.province === code && p.tier !== 'side';
    });
    /* Empty cells: no fill at all, just a whisper-thin puzzle edge
       over the province's progress colour — an empty slot should
       read as a faint outline, never as a card floating on the map. */
    parks.forEach(function (park) {
      var cell = CELLS[park.id];
      if (!cell) return;
      g.appendChild(svgEl('path', { d: cellPathD(cell),
        fill: 'none',
        stroke: 'rgba(91,58,30,0.30)', 'stroke-width': 0.045,
        'stroke-linejoin': 'round' }));
    });
    /* Filled cells: the photo, cover-fit over the cell's bbox and
       clipped to the cell shape, with a bright edge re-stroked on
       top so the piece reads against its neighbours. */
    parks.forEach(function (park) {
      var cell = CELLS[park.id];
      if (!cell) return;
      var url = cellPhotoURL(park);
      if (!url) return;
      var cg = svgEl('g', { 'clip-path': 'url(#cellclip-' + parts.viewKey + '-' + park.id + ')' });
      var img = svgEl('image', { x: cell.x0, y: cell.y0,
        width: cell.x1 - cell.x0, height: cell.y1 - cell.y0,
        preserveAspectRatio: 'xMidYMid slice' });
      setImageHref(img, url);
      cg.appendChild(img);
      g.appendChild(cg);
      g.appendChild(svgEl('path', { d: cellPathD(cell), fill: 'none',
        stroke: 'rgba(255,253,244,0.95)', 'stroke-width': 0.09,
        'stroke-linejoin': 'round' }));
    });
  });
}

/* ---------------- Markers ---------------- */
function countryShrink(zoom) {
  /* One step smaller at the fitted country view (zoom ≈ 1), so
     dense regions (the Maritimes, southern Ontario) don't pile
     their "?" markers on top of each other. Ramps back to full
     size by zoom 1.7, so focused/zoomed markers are unchanged. */
  var t = (zoom - 1) / 0.7;
  t = Math.max(0, Math.min(1, t));
  return 0.74 + 0.26 * t;
}
/* Radius of a main park marker, in svg units. Grows gently with
   zoom, but is capped as a share of the view width: the old formula
   let markers balloon past 40% of the screen at deep zoom, which
   is exactly the giant-card pile the map used to drown in. */
function mainMarkerRadius(zoom, interactive) {
  var s = 0.40 * Math.pow(zoom, 0.36) * (interactive ? countryShrink(zoom) : 1);
  if (interactive && focusCode) s *= 1.12;
  return Math.min(s, (FULL.w / zoom) * 0.052);
}
function markerSize() { /* radius of a main marker at the live view */
  return mainMarkerRadius(FULL.w / view.w, true);
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
function circleMarker(x, y, r, cls, glyph, glyphScale) {
  var g = svgEl('g', { 'class': 'park-marker' });
  g.appendChild(svgEl('circle', { cx: x + r * 0.14, cy: y + r * 0.18, r: r, 'class': 'mk-shadow' }));
  g.appendChild(svgEl('circle', { cx: x, cy: y, r: r, 'class': cls,
    'stroke-width': Math.max(0.05, r * 0.16) }));
  if (glyph) {
    var t = svgEl('text', { x: x, y: y, 'text-anchor': 'middle', 'dominant-baseline': 'central',
      'class': glyph === '?' ? 'mk-q' : 'mk-star', 'font-size': r * (glyphScale || 1.1) });
    t.textContent = glyph;
    g.appendChild(t);
  }
  var hit = svgEl('circle', { cx: x, cy: y, r: r * 1.8 + 0.15, 'class': 'hit' });
  g.appendChild(hit);
  return g;
}
/* Keeps a cluster of park markers readable: first shrink each
   marker toward the gap to its nearest neighbour, then relax —
   overlapping circles are pushed apart in small steps, capped so
   no marker wanders far from its park's true position. Runs on
   the interactive map only; the poster keeps true positions. */
function declutterMarkers(items) {
  items.forEach(function (a) { a.s0 = a.s; });
  items.forEach(function (a) {
    var dMin = Infinity;
    items.forEach(function (b) {
      if (b === a) return;
      var dx = a.ox - b.ox, dy = a.oy - b.oy, d = Math.sqrt(dx * dx + dy * dy);
      if (d < dMin) dMin = d;
    });
    if (isFinite(dMin)) a.s = Math.max(a.s * 0.5, Math.min(a.s, dMin * 0.46));
  });
  function relax(maxPasses) {
    for (var pass = 0; pass < maxPasses; pass++) {
      var moved = false;
      for (var i = 0; i < items.length; i++) {
        for (var j = i + 1; j < items.length; j++) {
          var a = items[i], b = items[j];
          var dx = b.x - a.x, dy = b.y - a.y;
          var d = Math.sqrt(dx * dx + dy * dy);
          var want = (a.s + b.s) * 1.07;
          if (d >= want) continue;
          if (d < 1e-6) {   /* coincident parks: pick a stable split direction */
            dx = ((i * 37 + j * 17) % 10) - 5; dy = ((i * 53 + j * 29) % 10) - 5;
            d = Math.sqrt(dx * dx + dy * dy) || 1;
          }
          var push = (want - d) / 2, ux = dx / d, uy = dy / d;
          a.x -= ux * push; a.y -= uy * push;
          b.x += ux * push; b.y += uy * push;
          moved = true;
        }
      }
      items.forEach(function (a) {
        var dx = a.x - a.ox, dy = a.y - a.oy, d = Math.sqrt(dx * dx + dy * dy), cap = 0.9;
        if (d > cap) { a.x = a.ox + dx / d * cap; a.y = a.oy + dy / d * cap; }
      });
      if (!moved) break;
    }
  }
  relax(80);
  /* Dense clusters (the Maritimes, southern Ontario) can still end
     up overlapping once every marker sits at its 0.9-unit drift
     cap — pushing harder would lie about park positions. Instead,
     shrink the markers that are still touching, a step at a time,
     and relax again. Floor: half the intended size, so a stamp
     never shrinks into invisibility. */
  for (var round = 0; round < 14; round++) {
    var touching = {};
    var anyTouch = false;
    for (var i2 = 0; i2 < items.length; i2++) {
      for (var j2 = i2 + 1; j2 < items.length; j2++) {
        var p = items[i2], q = items[j2];
        var ddx = q.x - p.x, ddy = q.y - p.y;
        var dd = Math.sqrt(ddx * ddx + ddy * ddy);
        if (dd < (p.s + q.s) * 1.02) {
          touching[i2] = touching[j2] = true;
          anyTouch = true;
        }
      }
    }
    if (!anyTouch) break;
    items.forEach(function (a, idx) {
      if (touching[idx]) a.s = Math.max(a.s * 0.92, a.s0 * 0.5);
    });
    relax(24);
  }
}
function photoMarker(x, y, s, photo, ringCls, target) {
  var g = svgEl('g', { 'class': 'park-marker' });
  var id = 'qclip' + (++clipSeq);
  var defs = svgEl('defs');
  var cp = svgEl('clipPath', { id: id });
  cp.appendChild(svgEl('circle', { cx: x, cy: y, r: s }));
  defs.appendChild(cp); g.appendChild(defs);
  g.appendChild(svgEl('circle', { cx: x + s * 0.14, cy: y + s * 0.18, r: s, 'class': 'mk-shadow' }));
  var img = svgEl('image', { x: x - s, y: y - s, width: s * 2, height: s * 2,
    preserveAspectRatio: 'xMidYMid slice', 'clip-path': 'url(#' + id + ')' });
  setImageHref(img, photo);
  g.appendChild(img);
  g.appendChild(svgEl('circle', { cx: x, cy: y, r: s,
    fill: 'none', 'class': ringCls, 'stroke-width': 0.13 }));
  var hit = svgEl('circle', { cx: x, cy: y, r: s * 1.8 + 0.15, 'class': 'hit' });
  g.appendChild(hit);
  return g;
}
function questBadge(x, y, s, side) {
  /* Round notification-style badge with a "!" riding on the top-
     right rim of an open quest's marker: gold with a dark "!" for
     main/bonus quests, smaller blue with a white "!" for side
     quests. Only built for the focused province (see
     renderMarkersInto), so the country view never fills with
     exclamation marks. The CSS bounce anchors at the badge's
     bottom via transform-box: fill-box. */
  var rb = s * (side ? 0.48 : 0.58);
  var bx = x + s * 0.74, by = y - s * 0.74;
  var g = svgEl('g', { 'class': 'quest-badge' });
  g.appendChild(svgEl('circle', { cx: bx + rb * 0.12, cy: by + rb * 0.16, r: rb, 'class': 'mk-shadow' }));
  g.appendChild(svgEl('circle', { cx: bx, cy: by, r: rb * 1.16, 'class': 'q-badge-halo' }));
  g.appendChild(svgEl('circle', { cx: bx, cy: by, r: rb,
    'class': side ? 'q-badge-c-side' : 'q-badge-c',
    'stroke-width': Math.max(0.04, rb * 0.18) }));
  var t = svgEl('text', { x: bx, y: by, 'text-anchor': 'middle',
    'dominant-baseline': 'central', 'font-size': rb * 1.3,
    'class': side ? 'q-badge-txt q-badge-txt-side' : 'q-badge-txt' });
  t.textContent = '!';
  g.appendChild(t);
  /* Desync the bounce so a province full of quests doesn't pulse as one. */
  g.style.animationDelay =
    (Math.abs(Math.sin(x * 12.9898 + y * 78.233)) * 0.9).toFixed(2) + 's';
  return g;
}
function bindTap(el, fn) {
  el.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
  el.addEventListener('click', function (e) {
    e.stopPropagation();
    if (suppressTap()) return;   /* a pinch just ended — not a tap */
    fn();
  });
}
function renderMarkersInto(parts, interactive, viewW) {
  while (parts.markers.firstChild) parts.markers.removeChild(parts.markers.firstChild);
  while (parts.camps.firstChild) parts.camps.removeChild(parts.camps.firstChild);
  if (parts.badges) while (parts.badges.firstChild) parts.badges.removeChild(parts.badges.firstChild);
  var zoom = FULL.w / (viewW || FULL.w);
  var sMain = mainMarkerRadius(zoom, interactive);
  /* Side-quest markers are the densest cluster on the map (ten in
     southern Ontario alone): on the interactive map they appear
     once a province is focused or the user zooms in. The poster
     always shows every marker. */
  var showSide = !interactive || !!focusCode || zoom >= 1.8;
  /* Parks are round stamps, never photo thumbnails: a cleared
     park's photo fills its own map cell instead (renderPhotoFills).
     On the interactive map the stamps are laid out first and
     decluttered, so parks that sit close together (southern
     Ontario, the Maritimes) shrink and nudge apart instead of
     stacking into an unreadable pile; the poster keeps every
     stamp at its park's true position. */
  var items = [];
  ALL_PARKS.forEach(function (park) {
    var side = park.tier === 'side';
    if (side && !showSide) return;
    var xy = project(park.lat, park.lng);
    items.push({ park: park, side: side, x: xy[0], y: xy[1], ox: xy[0], oy: xy[1],
      s: sMain * (side ? 0.76 : (park.tier === 'bonus' ? 0.9 : 1)) });
  });
  if (interactive && items.length > 1) declutterMarkers(items);
  items.forEach(function (it) {
    var park = it.park;
    var visit = state.visits[park.id];
    var bonus = park.tier === 'bonus';
    var g;
    if (it.side && visit && visit.photo) {
      /* Side quests own no map cell, so a cleared side park shows
         its photo as a round thumbnail marker (same treatment as
         campsites). Without this the photo existed only inside
         the quest card, and stamping a side park looked exactly
         like the photo never uploaded. */
      g = photoMarker(it.x, it.y, it.s * 1.15, visit.photo, 'mk-photo-side');
    } else if (visit) {
      g = circleMarker(it.x, it.y, it.s,
        it.side ? 'mk-done-side' : (bonus ? 'mk-done-bonus' : 'mk-done'), '★', 1.0);
    } else {
      g = circleMarker(it.x, it.y, it.s,
        it.side ? 'mk-open-side' : (bonus ? 'mk-open-bonus' : 'mk-open'), '?', 1.1);
    }
    if (interactive) {
      (function (pk) {
        bindTap(g, function () { openPark(pk); });
        /* Keyboard: a marker is a button — focusable, labelled,
           and Enter/Space opens the same quest card as a tap. */
        g.setAttribute('tabindex', '0');
        g.setAttribute('role', 'button');
        g.setAttribute('aria-label',
          pk.name + (visit ? ' — cleared' : ' — open quest'));
        g.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openPark(pk);
          }
        });
      })(park);
      markerEls.push({ g: g });
    }
    /* Open quests in the focused province wear a round "!" badge:
       gold for main/bonus quests, smaller blue for side quests.
       Badges live in their own top layer and are tappable too. */
    if (interactive && focusCode && park.province === focusCode && !visit && parts.badges) {
      var bg = questBadge(it.x, it.y, it.s, it.side);
      (function (pk) { bindTap(bg, function () { openPark(pk); }); })(park);
      parts.badges.appendChild(bg);
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
      (function (cp) {
        bindTap(g, function () { openCampView(cp); });
        g.setAttribute('tabindex', '0');
        g.setAttribute('role', 'button');
        g.setAttribute('aria-label', cp.name + ' — my campsite');
        g.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openCampView(cp);
          }
        });
      })(camp);
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
  renderPhotoFills(mapParts);
  refreshProvinceFills();
}

/* ---------------- View: pan / zoom / focus ---------------- */
function stageRect() { return mapSvg.getBoundingClientRect(); }
function fitWidth() {
  var r = stageRect();
  return Math.max(FULL.w, FULL.h * (r.width / Math.max(r.height, 1)));
}
var lastMarkerW = 0;
/* Marker re-renders are coalesced into one per animation frame,
   and — crucially — a zoom-driven re-render rebuilds ONLY the
   markers. The photo-cell layer doesn't depend on the view at
   all, so the old code tore down and rebuilt every photo fill
   (plus an 80-pass declutter) on every pinch frame for nothing. */
var markerRenderQueued = false;
function queueMarkerRender() {
  if (markerRenderQueued) return;
  markerRenderQueued = true;
  requestAnimationFrame(function () {
    markerRenderQueued = false;
    renderMarkersOnly();
  });
}
function renderMarkersOnly() {
  if (!mapParts) return;
  markerEls = [];
  lastMarkerW = view.w;
  renderMarkersInto(mapParts, true, view.w);
}
function applyView() {
  if (!FULL) return;
  var r = stageRect();
  var h = view.w * (r.height / Math.max(r.width, 1));
  mapSvg.setAttribute('viewBox',
    (view.cx - view.w / 2) + ' ' + (view.cy - h / 2) + ' ' + view.w + ' ' + h);
  $('zoomReset').hidden = !(view.w < fitWidth() * 0.985);
  Object.keys(mapParts.labelEls).forEach(function (code) {
    var el = mapParts.labelEls[code];
    var focused = focusCode === code;
    el.textContent = focused ? PROVINCE_BY_CODE[code].name : code;
    var fs = view.w * (focused ? 0.05 : 0.034);
    el.setAttribute('font-size', fs);
    el.setAttribute('stroke-width', fs * 0.16);
  });
  /* Rebuilding every marker each frame would flicker photo thumbnails;
     only re-render once the zoom has drifted a few percent — and even
     then, at most once per frame and markers only (see above). */
  if (!lastMarkerW || Math.abs(view.w - lastMarkerW) > lastMarkerW * 0.03) {
    queueMarkerRender();
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
    Object.keys(mapParts.fillGroups).forEach(function (code) {
      mapParts.fillGroups[code].style.opacity = (!focusCode || focusCode === code) ? '' : '0.45';
    });
    Object.keys(mapParts.outlines).forEach(function (code) {
      mapParts.outlines[code].style.opacity = (!focusCode || focusCode === code) ? '' : '0.45';
    });
  }
  $('tapHint').textContent = focusCode
    ? '📍 ' + PROVINCE_BY_CODE[focusCode].name + ' — tap a marker, or tap the map to pitch your tent ⛺'
    : 'Tap a province to explore its parks 🏕';
}
function focusProvince(code) {
  var f = GEO_BY_CODE[code];
  if (!f) return;
  var hadFocus = !!focusCode;
  focusCode = code;
  if (!hadFocus) layerPush('focus');   /* back button un-focuses first */
  refreshFocusUI();
  renderMap();   /* quest "!" badges appear for this province right away */
  var r = stageRect();
  var bw = f.bounds.x1 - f.bounds.x0, bh = f.bounds.y1 - f.bounds.y0;
  var tw = Math.max(bw * 1.3, bh * 1.3 * (r.width / Math.max(r.height, 1)));
  tw = Math.min(Math.max(tw, FULL.w / 30), fitWidth());
  animateViewTo((f.bounds.x0 + f.bounds.x1) / 2, (f.bounds.y0 + f.bounds.y1) / 2, tw, 650);
}
function exitFocus(fromPop) {
  if (!GEO || !FULL) return;
  focusCode = null;
  if (!fromPop) layerPopUI('focus');
  clearTempCamp();
  refreshFocusUI();
  renderMap();   /* and the "!" badges go away with the focus */
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
  if (pinching) return;
  drag = { x: e.clientX, y: e.clientY, cx: view.cx, cy: view.cy, moved: false };
  cancelViewAnim();
});
mapSvg.addEventListener('pointermove', function (e) {
  if (!drag || pinching) return;
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
  if (!drag || pinching) { drag = null; return; }
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

/* ---------------- Pinch zoom (two fingers) ----------------
   Pointer tracking runs in the capture phase on window, so a
   second finger is registered even when it lands on a marker
   (markers stop propagation of their own pointerdown). Zooming
   reuses zoomAt() around the fingers' midpoint, so the map grows
   from the pinch centre. While a pinch is active the single-
   finger handlers above stand down, and taps stay suppressed
   briefly after it ends — lifting a finger must never open a
   quest card or pitch a tent by accident. The zoom buttons stay
   as the one-handed alternative. */
var activePtrs = {}, pinch = null, pinching = false, lastPinchEnd = 0;
function suppressTap() { return pinching || (Date.now() - lastPinchEnd < 400); }
function ptrList() { return Object.keys(activePtrs).map(function (k) { return activePtrs[k]; }); }
window.addEventListener('pointerdown', function (e) {
  if (!mapSvg.contains(e.target)) return;
  activePtrs[e.pointerId] = { x: e.clientX, y: e.clientY };
  var pts = ptrList();
  if (pts.length === 2) {
    pinch = { lastD: Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) };
    pinching = true;
    drag = null;
    cancelViewAnim();
  }
}, true);
window.addEventListener('pointermove', function (e) {
  var rec = activePtrs[e.pointerId];
  if (!rec) return;
  rec.x = e.clientX; rec.y = e.clientY;
  if (!pinching || !pinch) return;
  var pts = ptrList();
  if (pts.length !== 2) return;
  var d = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
  if (d > 0 && pinch.lastD > 0) {
    var mid = clientToSvg({ clientX: (pts[0].x + pts[1].x) / 2,
                            clientY: (pts[0].y + pts[1].y) / 2 });
    if (mid) zoomAt(mid, pinch.lastD / d);
    pinch.lastD = d;
  }
}, true);
function endPointer(e) {
  if (!activePtrs[e.pointerId]) return;
  delete activePtrs[e.pointerId];
  if (pinching && ptrList().length < 2) {
    lastPinchEnd = Date.now();
    pinch = null;
    if (ptrList().length === 0) pinching = false;
  }
}
window.addEventListener('pointerup', endPointer, true);
window.addEventListener('pointercancel', endPointer, true);
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
function anySheetOpen() {
  return SHEETS.some(function (s) { return !$(s).hidden; });
}

/* ---------------- Back-button layers (Android / browser) --------
   Sheets and province focus are pushed as history layers, so the
   device back button closes the topmost layer instead of leaving
   the app mid-task. UI-initiated closes consume their own layer
   (and swallow the popstate they cause); a hardware/browser back
   arrives as a bare popstate and closes whatever is on top. */
var uiStack = [], ignorePops = 0;
function layerPush(kind) {
  uiStack.push(kind);
  try { history.pushState({ mq: uiStack.length }, ''); } catch (e) { /* ignore */ }
}
function layerPopUI(kind) {
  var i = uiStack.lastIndexOf(kind);
  if (i < 0) return;
  uiStack.splice(i, 1);
  ignorePops++;
  try { history.back(); } catch (e) { /* ignore */ }
}
window.addEventListener('popstate', function () {
  if (ignorePops > 0) { ignorePops--; return; }
  var kind = uiStack.pop();
  if (kind === 'sheet') closeSheets(true);
  else if (kind === 'focus') exitFocus(true);
});

function openSheet(id) {
  var wasOpen = anySheetOpen();
  SHEETS.forEach(function (s) { $(s).hidden = s !== id; });
  $('backdrop').hidden = false;
  if (!wasOpen) layerPush('sheet');
  /* Keyboard: land focus on the window's close button so Esc and
     Tab start from inside the sheet, not behind it. */
  var x = $(id).querySelector('.win-x');
  if (x) setTimeout(function () { x.focus(); }, 40);
}
function closeSheets(fromPop) {
  SHEETS.forEach(function (s) { $(s).hidden = true; });
  $('backdrop').hidden = true;
  clearTempCamp();
  if (!fromPop) layerPopUI('sheet');
}
$('backdrop').addEventListener('click', function () { closeSheets(); });
document.querySelectorAll('[data-close]').forEach(function (b) {
  b.addEventListener('click', function () { closeSheets(); });
});
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape' && anySheetOpen()) closeSheets();
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
  /* While the seeded demo stamps are still in place, say so right
     on the HUD — a first-time player must never mistake the four
     sample visits for their own record. */
  if (state.samplesActive) {
    chips += '<span class="side-chip sample">📝 Sample stamps — demo data, ' +
      'reset in Setup to start yours</span>';
  }
  chips += '<span class="side-chip camp">⛺ My Spots ' + state.camps.length + '</span>';
  $('hudChips').innerHTML = chips;
}

/* ---------------- Clear FX ---------------- */
function playClearFx(leveledTo, floatText) {
  $('expFloat').textContent = floatText || '+100 EXP';
  var fx = $('stampFx');
  fx.hidden = false;
  spawnLeafBurst();
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

/* ---------------- Maple ambience: settings, falling leaves, bursts --------
   Kept in its own localStorage key so the quest save shape never
   changes. Leaves are pure decoration: pointer-events none, clipped
   to the map frame, and skipped entirely for reduced motion. */
var SETTINGS_KEY = 'maplepins_quest_settings_v1';
var settings = { leaves: true };
var REDUCED_MOTION = !!(window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches);
function loadSettings() {
  try {
    var d = JSON.parse(localStorage.getItem(SETTINGS_KEY) || 'null');
    if (d && typeof d.leaves === 'boolean') settings.leaves = d.leaves;
  } catch (e) { /* default: on */ }
}
function saveSettings() {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); }
  catch (e) { /* ignore */ }
}
var LEAF_COLORS = ['#d94f4f', '#e2543e', '#e8862e', '#f09a3e', '#f2c230', '#c93b3b'];
var LEAF_PATH = 'M49.4 1 L40.5 16.6 L34 15.3 L33.9 35.6 L21 25.6 L3.5 24.1 ' +
  'L8.5 42.8 L2.8 46.8 L16.7 59.8 L2.2 69.9 L17.4 77.6 L29.3 77.1 L29.7 86.2 ' +
  'L48.4 71.6 L48.4 98 L52 98 L52 71.4 L70.5 85.4 L70 76.8 L82.6 76.7 ' +
  'L97.8 67.4 L82.2 59.1 L96.3 46.4 L90.8 42.3 L96.2 23.6 L79 25.6 L66 35 ' +
  'L65.6 14.7 L59.1 15.3 Z';
function leafSvg(color, size) {
  return '<svg viewBox="0 0 100 100" width="' + size + '" height="' + size +
    '" aria-hidden="true"><path d="' + LEAF_PATH + '" fill="' + color + '"/></svg>';
}
function leavesActive() { return settings.leaves && !REDUCED_MOTION; }
function buildLeaves() {
  var layer = $('leafLayer');
  if (!layer || layer.childNodes.length) return;
  for (var i = 0; i < 12; i++) {
    var leaf = document.createElement('span');
    leaf.className = 'leaf';
    leaf.style.left = (Math.random() * 96) + '%';
    leaf.style.opacity = (0.45 + Math.random() * 0.35).toFixed(2);
    leaf.style.animationDuration = (9 + Math.random() * 9).toFixed(1) + 's';
    leaf.style.animationDelay = (-Math.random() * 18).toFixed(1) + 's';
    var inner = document.createElement('span');
    inner.className = 'leaf-in';
    inner.style.animationDuration = (1.6 + Math.random() * 1.8).toFixed(1) + 's';
    inner.style.animationDelay = (-Math.random() * 3).toFixed(1) + 's';
    inner.innerHTML = leafSvg(LEAF_COLORS[i % LEAF_COLORS.length],
      Math.round(13 + Math.random() * 17));
    leaf.appendChild(inner);
    layer.appendChild(leaf);
  }
}
function applyLeaves() {
  var layer = $('leafLayer');
  if (!layer) return;
  if (leavesActive()) { buildLeaves(); layer.hidden = false; }
  else layer.hidden = true;
}
function spawnLeafBurst() {
  var layer = $('burstLayer');
  if (!layer || !leavesActive()) return;
  for (var i = 0; i < 10; i++) {
    var el = document.createElement('span');
    el.className = 'burst-leaf';
    el.innerHTML = leafSvg(
      LEAF_COLORS[Math.floor(Math.random() * LEAF_COLORS.length)],
      Math.round(11 + Math.random() * 10));
    layer.appendChild(el);
    if (typeof el.animate !== 'function') { el.remove(); continue; }
    var ang = Math.random() * Math.PI * 2;
    var dist = 60 + Math.random() * 130;
    var dx = Math.cos(ang) * dist;
    var dy = Math.sin(ang) * dist * 0.8 + 40;   /* slight downward drift */
    var rot = Math.round(Math.random() * 260 - 130);
    var anim = el.animate([
      { transform: 'translate(-50%,-50%) rotate(0deg)', opacity: 1 },
      { transform: 'translate(calc(-50% + ' + Math.round(dx) + 'px), calc(-50% + ' +
          Math.round(dy) + 'px)) rotate(' + rot + 'deg)', opacity: 0 }
    ], { duration: 950 + Math.random() * 550, easing: 'cubic-bezier(.17,.67,.35,1)' });
    (function (node, a) { a.onfinish = function () { node.remove(); }; })(el, anim);
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
    $('pkDate').textContent = '✅ Cleared — visited ' + fmtDate(visit.date) +
      ((state.samplesActive && SAMPLE_VISITS[park.id])
        ? ' · 📝 sample stamp (demo)' : '');
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
  $('vDate').max = todayStr();   /* a visit can't be dated in the future */
  pendingPhoto = undefined;
});
$('visitCancelBtn').addEventListener('click', function () {
  $('visitForm').hidden = true;
  $('pkOpen').hidden = false;
  pendingPhoto = undefined;
});
$('vPhoto').addEventListener('change', function () {
  var input = this;
  var f = input.files && input.files[0];
  if (!f) { pendingPhoto = undefined; $('vPreview').hidden = true; return; }
  fileToDataURL(f, function (url) {
    pendingPhoto = url;
    if (url) { $('vPreview').src = url; $('vPreview').hidden = false; }
    else {
      /* Never fail silently: the stamp would save without a photo
         and the user wouldn't know why. */
      $('vPreview').hidden = true;
      input.value = '';
      alert(PHOTO_READ_FAIL_MSG);
    }
  });
});
$('visitForm').addEventListener('submit', function (e) {
  e.preventDefault();
  if (!currentPark) return;
  if ($('vDate').value && $('vDate').value > todayStr()) {
    alert('That date is in the future — pick the day you actually went.');
    return;
  }
  var before = levelFor(mainCleared());
  var pid = currentPark.id;
  state.visits[pid] = {
    date: $('vDate').value || todayStr(),
    photo: pendingPhoto || null
  };
  state.samplesActive = false;
  /* If storage is full, drop ONLY this visit's new photo. */
  var stored = saveStateChecked(function () {
    if (state.visits[pid]) state.visits[pid].photo = null;
  });
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
    if (!url) { alert(PHOTO_READ_FAIL_MSG); return; }
    var visit = state.visits[currentPark.id];
    if (!visit) return;
    var oldPhoto = visit.photo;
    visit.photo = url;
    state.samplesActive = false;
    /* If the new photo doesn't fit, the OLD photo is restored —
       a failed swap must never cost the photo that was there. */
    saveStateChecked(function () { visit.photo = oldPhoto; });
    openPark(currentPark);
    renderAll();
  });
  this.value = '';
});
$('pkRemoveBtn').addEventListener('click', function () {
  if (!currentPark) return;
  if (!confirm('Remove this visit? The stamp and photo will be deleted.')) return;
  delete state.visits[currentPark.id];
  state.samplesActive = false;
  saveState();
  closeSheets();
  renderAll();
});
/* localStorage can fill up with photos. If a save fails, ONLY the
   photo that was just added is dropped — the caller passes a
   rollback that removes (or restores) exactly that one photo.
   Earlier visits and photos are NEVER touched: losing a whole
   album because one new photo didn't fit would be unforgivable.
   (Moving photos to Supabase Storage removes the limit for good.) */
function saveStateChecked(dropNewPhoto) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(statePayload()));
    return true;
  } catch (e) {
    if (dropNewPhoto) dropNewPhoto();
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(statePayload()));
      alert('⚠️ Storage is full — your stamp was saved, but that photo ' +
        'could not fit. All your earlier photos are safe. ' +
        'Tip: export a backup in Setup (💾 Your data).');
      return true;
    } catch (e2) {
      alert('⚠️ Storage is full — this is kept for this session only ' +
        'and will be lost when you close the tab. Please export a ' +
        'backup from Setup (💾 Your data) as soon as you can.');
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
  $('cDate').max = todayStr();   /* a camp night can't be in the future */
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
  var input = this;
  var f = input.files && input.files[0];
  if (!f) { campPhotoData = undefined; $('cPreview').hidden = true; return; }
  fileToDataURL(f, function (url) {
    campPhotoData = url;
    if (url) { $('cPreview').src = url; $('cPreview').hidden = false; }
    else {
      $('cPreview').hidden = true;
      input.value = '';
      alert(PHOTO_READ_FAIL_MSG);
    }
  });
});
$('campForm').addEventListener('submit', function (e) {
  e.preventDefault();
  if (!pendingCamp) { closeSheets(); return; }
  if ($('cDate').value && $('cDate').value > todayStr()) {
    alert('That date is in the future — pick the day you actually camped.');
    return;
  }
  var camp = {
    id: 'camp-' + Date.now(),
    name: $('cName').value.trim() || 'My campsite',
    lat: pendingCamp.lat, lng: pendingCamp.lng,
    date: $('cDate').value || todayStr(),
    photo: campPhotoData || null
  };
  state.camps.push(camp);
  /* If storage is full, drop ONLY this new campsite's photo. */
  saveStateChecked(function () { camp.photo = null; });
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
  var sample = !!(visit && state.samplesActive && SAMPLE_VISITS[park.id]);
  return '<button type="button" class="quest-row' + (visit ? '' : ' open') +
    '" data-park="' + park.id + '">' +
    '<span class="q-ico">' + (visit ? '🏕' : '❔') + '</span>' +
    '<span class="q-name">' + esc(park.name) +
    '<small>' + esc(KIND_LABEL[park.kind]) + (visit ? ' · ' + fmtDate(visit.date) : '') + '</small></span>' +
    '<span class="q-badge' + (visit ? '' : ' todo') + '">' +
    (visit ? (sample ? '📝 SAMPLE' : 'CLEAR') : 'OPEN') + '</span></button>';
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
      /* Wait for the 600ms camera flight to land before opening
         the card — at 350ms the sheet used to cover a still-moving
         map and the marker wasn't centred yet. */
      setTimeout(function () { openPark(park); }, 680);
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
      setTimeout(function () { openCampView(camp); }, 680);
    });
  });
}
document.querySelectorAll('.tab').forEach(function (tab) {
  tab.addEventListener('click', function () {
    document.querySelectorAll('.tab').forEach(function (t) {
      t.classList.toggle('active', t === tab);
      t.setAttribute('aria-selected', t === tab ? 'true' : 'false');
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
  renderPhotoFills(posterParts);
  refreshProvinceFills();
}
function savePosterPng() {
  if (!GEO || !posterSvg) { alert('The map is still loading — try again in a moment.'); return; }
  /* Print scale: the whole poster is laid out at 2x the original
     CSS-size geometry, so the PNG comes out at 3520px wide —
     ~300dpi across an A4/Letter print — instead of the old
     1760px, which pixelated the moment anyone actually printed
     their map. Every constant below is multiplied by PS. */
  var PS = 2;
  var n = mainCleared();
  var clone = posterSvg.cloneNode(true);
  clone.setAttribute('xmlns', SVGNS);
  clone.setAttribute('xmlns:xlink', XLINK_NS);
  var drawW = 1500 * PS;
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
    meas.font = '400 ' + (25 * PS) + 'px ' + roundFont;
    var lines = [], line = '';
    names.forEach(function (nm) {
      var test = line ? line + '  ·  ' + nm : nm;
      if (meas.measureText(test).width > 1560 * PS && line) { lines.push(line); line = nm; }
      else line = test;
    });
    if (line) lines.push(line);
    if (!lines.length) lines = ['No stamps yet — every quest starts with a single park.'];
    var cw = 1760 * PS, ch = (1330 + lines.length * 38 + 120) * PS;
    var canvas = document.createElement('canvas');
    canvas.width = cw; canvas.height = ch;
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fffaf0';
    ctx.fillRect(0, 0, cw, ch);
    ctx.strokeStyle = '#5b3a1e'; ctx.lineWidth = 12 * PS;
    ctx.strokeRect(18 * PS, 18 * PS, cw - 36 * PS, ch - 36 * PS);
    ctx.strokeStyle = '#c98d4e'; ctx.lineWidth = 4 * PS;
    ctx.strokeRect(42 * PS, 42 * PS, cw - 84 * PS, ch - 84 * PS);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#b4552d';
    ctx.font = (28 * PS) + 'px ' + pxFont;
    ctx.fillText('CANADA PARKS QUEST', cw / 2, 118 * PS);
    ctx.fillStyle = '#4a3f35';
    ctx.font = '800 ' + (58 * PS) + 'px ' + roundFont;
    ctx.fillText('Every park, one stamp at a time', cw / 2, 196 * PS);
    ctx.fillStyle = '#d94f4f';
    ctx.font = (52 * PS) + 'px ' + pxFont;
    ctx.fillText(n + ' / 48', cw / 2, 282 * PS);
    var boxW = 1620 * PS, boxH = 860 * PS, boxY = 320 * PS;
    var scale = Math.min(boxW / drawW, boxH / drawH);
    var dw = drawW * scale, dh = drawH * scale;
    ctx.drawImage(img, (cw - dw) / 2, boxY + (boxH - dh) / 2, dw, dh);
    URL.revokeObjectURL(url);
    var small = SIDE_SETS.map(function (set) {
      return 'Side · ' + set.label + ' ' + setCleared(set) + '/' + set.parks.length;
    }).join('    ');
    small += '     ⭐ Bonus ' + bonusCleared() + '/' + PARKS_BONUS.length;
    ctx.fillStyle = '#4a3f35';
    ctx.font = '800 ' + (34 * PS) + 'px ' + roundFont;
    ctx.fillText('Explorer Lv.' + levelFor(n) + '     ' + small +
      '     ⛺ My Spots ' + state.camps.length, cw / 2, 1252 * PS);
    ctx.fillStyle = '#4a3f35';
    ctx.font = '400 ' + (25 * PS) + 'px ' + roundFont;
    lines.forEach(function (ln, i) { ctx.fillText(ln, cw / 2, (1310 + i * 38) * PS); });
    ctx.fillStyle = '#a08b74';
    ctx.font = '400 ' + (25 * PS) + 'px ' + roundFont;
    ctx.fillText('🏕️ Made with our own two feet — from coast to coast to coast.',
      cw / 2, (1310 + lines.length * 38 + 44) * PS);
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
  /* The poster is NOT re-rendered here: it used to rebuild its
     whole SVG (markers + every photo fill) on every stamp, photo
     swap and reset, even though the poster sheet was closed.
     posterBtn renders it fresh right before the sheet opens. */
}
$('mapBtn').addEventListener('click', function () { closeSheets(); exitFocus(); });
$('journalBtn').addEventListener('click', function () { renderJournal(); openSheet('journalSheet'); });
$('posterBtn').addEventListener('click', function () { renderPoster(); openSheet('posterSheet'); });
$('settingsBtn').addEventListener('click', function () { openSheet('settingsSheet'); });
$('posterPngBtn').addEventListener('click', savePosterPng);
$('backBtn').addEventListener('click', function () { exitFocus(); });
$('zoomIn').addEventListener('click', function () {
  zoomAt({ x: view.cx, y: view.cy }, 0.62);
});
$('zoomOut').addEventListener('click', function () {
  zoomAt({ x: view.cx, y: view.cy }, 1.6);
});
$('zoomReset').addEventListener('click', function () { exitFocus(); });
$('leafToggle').addEventListener('change', function () {
  settings.leaves = $('leafToggle').checked;
  saveSettings();
  applyLeaves();
});
/* ---------------- Backup: export / import ----------------
   The whole quest lives in one localStorage key; this pair of
   buttons is the only way it survives a cleared browser or a
   new phone. The file is plain JSON: visits + camps, verbatim. */
$('exportBtn').addEventListener('click', function () {
  var payload = {
    app: 'maplepins-quest', version: 1,
    exportedAt: new Date().toISOString(),
    visits: state.visits, camps: state.camps
  };
  var blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
  var a = document.createElement('a');
  a.download = 'maplepins-backup-' + todayStr() + '.json';
  a.href = URL.createObjectURL(blob);
  a.click();
  setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
});
$('importBtn').addEventListener('click', function () { $('importFile').click(); });
$('importFile').addEventListener('change', function () {
  var f = this.files && this.files[0];
  this.value = '';
  if (!f) return;
  var rd = new FileReader();
  rd.onload = function () {
    var d = null;
    try { d = JSON.parse(rd.result); } catch (e) { /* handled below */ }
    if (!d || typeof d.visits !== 'object' || d.visits === null ||
        Array.isArray(d.visits) || !Array.isArray(d.camps)) {
      alert('That file is not a MaplePins backup.');
      return;
    }
    /* Light shape check: drop any entry that isn't a record. */
    Object.keys(d.visits).forEach(function (k) {
      if (!d.visits[k] || typeof d.visits[k] !== 'object') delete d.visits[k];
    });
    if (!confirm('Replace ALL your current visits and campsites with this backup?')) return;
    state.visits = d.visits;
    state.camps = d.camps;
    state.samplesActive = false;
    saveState();
    closeSheets();
    renderAll();
    alert('Backup restored — welcome back, explorer! 🏕');
  };
  rd.onerror = function () { alert('That file could not be read.'); };
  rd.readAsText(f);
});
$('resetBtn').addEventListener('click', function () {
  if (!confirm('Reset the whole quest? All visits, photos and campsites on this device will be cleared.')) return;
  state.visits = {};
  state.camps = [];
  state.samplesActive = false;
  saveState();
  closeSheets();
  renderAll();
  alert('Fresh start! 48 main quests, side quests and a blank map await. 🏕');
});
window.addEventListener('resize', function () { if (FULL) applyView(); });

/* ---------------- First-run welcome ----------------
   One card that teaches the whole game in three steps. A tester
   who had never seen the app opened it cold and could not tell
   what to do — the map alone doesn't explain itself. Shown once
   per device (flag below); Setup ▸ How to play reopens it. */
var WELCOME_KEY = 'maplepins_quest_welcomed_v1';
function showWelcome() { $('welcomeFx').hidden = false; }
function hideWelcome() {
  $('welcomeFx').hidden = true;
  try { localStorage.setItem(WELCOME_KEY, '1'); } catch (e) { /* ignore */ }
}
$('welcomeStartBtn').addEventListener('click', hideWelcome);
$('howToBtn').addEventListener('click', function () {
  closeSheets();
  showWelcome();
});
function maybeShowWelcome() {
  var seen = false;
  try { seen = !!localStorage.getItem(WELCOME_KEY); } catch (e) { /* ignore */ }
  if (!seen) showWelcome();
}

/* ---------------- Init ---------------- */
var geoFailed = false;
$('tapHint').addEventListener('click', function () {
  if (geoFailed) location.reload();   /* the hint pill becomes the retry */
});
(async function init() {
  /* Offline shell: after the first visit, the app (and the map
     data) opens with no signal — trailhead-proof. */
  if ('serviceWorker' in navigator) {
    try {
      var swp = navigator.serviceWorker.register('sw.js');
      if (swp && swp.catch) swp.catch(function () { /* not critical */ });
    } catch (e) { /* ignore */ }
  }
  loadState();
  loadSettings();
  $('leafToggle').checked = settings.leaves;
  applyLeaves();
  try {
    await loadGeo();
  } catch (e) {
    geoFailed = true;
    $('tapHint').textContent = '⚠️ The map could not load — tap here to retry.';
    $('tapHint').style.cursor = 'pointer';
    return;
  }
  buildCells();
  PLACEHOLDER_ART = makePlaceholderArt();
  mapParts = buildSvgView(mapSvg, true);
  posterParts = buildSvgView(posterSvg, false);
  Object.keys(posterParts.labelEls).forEach(function (code) {
    var fs = FULL.w * 0.034;
    posterParts.labelEls[code].setAttribute('font-size', fs);
    posterParts.labelEls[code].setAttribute('stroke-width', fs * 0.16);
  });
  fitView();
  refreshFocusUI();
  renderAll();
  maybeShowWelcome();
})();

})();
