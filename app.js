/* ============================================================
   MaplePins — couple date map (v2, illustrated)
   - No build step. Plain script.
   - The map is a hand-drawn-style SVG built from
     canada-provinces.json (simplified Natural Earth outlines).
     No map tiles, no Leaflet.
   - Demo mode: no valid config.js -> pins live in localStorage.
   - Supabase mode: config.js with SUPABASE_URL / SUPABASE_ANON_KEY
     -> couples + pins tables (see supabase/schema.sql).
   ============================================================ */
(function () {
'use strict';

/* ---------------- Config / mode ---------------- */
var cfg = window.APP_CONFIG || {};
var cfgLooksReal = cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY &&
  !/YOUR-/.test(String(cfg.SUPABASE_URL) + String(cfg.SUPABASE_ANON_KEY));
var sb = null;
if (cfgLooksReal && window.supabase) {
  sb = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
}
var DEMO = !sb;

/* ---------------- Reference data ---------------- */
// Bounding boxes are a deliberately simple v1 approximation used ONLY
// for "which province is this pin in?" detection (drawing uses the
// real outlines from canada-provinces.json).
// [minLat, maxLat, minLng, maxLng]. Order matters where boxes overlap.
var PROVINCES = [
  { code:'YT', name:'Yukon',               boxes:[[59.9, 69.7, -141.0, -123.7]] },
  { code:'NT', name:'Northwest Territories', boxes:[[60.0, 73.0, -136.5, -110.0]] },
  { code:'NU', name:'Nunavut',             boxes:[[59.5, 83.2, -110.0, -61.9]] },
  { code:'BC', name:'British Columbia',    boxes:[[48.3, 60.0, -139.1, -114.0]] },
  { code:'AB', name:'Alberta',             boxes:[[49.0, 60.0, -120.0, -110.0]] },
  { code:'SK', name:'Saskatchewan',        boxes:[[49.0, 60.0, -110.0, -101.4]] },
  { code:'MB', name:'Manitoba',            boxes:[[49.0, 60.0, -102.0, -95.2]] },
  { code:'ON', name:'Ontario',             boxes:[[41.7, 56.9, -95.15, -74.34]] },
  { code:'QC', name:'Quebec',              boxes:[[45.0, 62.6, -79.1, -57.1]] },
  { code:'PE', name:'Prince Edward Island', boxes:[[45.95, 47.1, -64.45, -61.95]] },
  { code:'NB', name:'New Brunswick',       boxes:[[45.0, 48.1, -69.1, -64.0]] },
  { code:'NS', name:'Nova Scotia',         boxes:[[43.4, 47.1, -66.3, -59.7]] },
  { code:'NL', name:'Newfoundland & Labrador',
    boxes:[[46.6, 51.7, -59.3, -52.6], [51.3, 60.4, -67.8, -55.4]] }
];
var PROVINCE_BY_CODE = {};
PROVINCES.forEach(function (p) { PROVINCE_BY_CODE[p.code] = p; });

// Cities used for "which city is this pin in?" (nearest within radius).
var CITIES = [
  { name:'Toronto',       province:'ON', lat:43.6532, lng:-79.3832 },
  { name:'Ottawa',        province:'ON', lat:45.4215, lng:-75.6972 },
  { name:'London',        province:'ON', lat:42.9849, lng:-81.2453 },
  { name:'Mississauga',   province:'ON', lat:43.5890, lng:-79.6441 },
  { name:'Hamilton',      province:'ON', lat:43.2557, lng:-79.8711 },
  { name:'Kitchener',     province:'ON', lat:43.4516, lng:-80.4925 },
  { name:'Kingston',      province:'ON', lat:44.2312, lng:-76.4860 },
  { name:'Niagara Falls', province:'ON', lat:43.0962, lng:-79.0377 },
  { name:'Vancouver',     province:'BC', lat:49.2827, lng:-123.1207 },
  { name:'Victoria',      province:'BC', lat:48.4284, lng:-123.3656 },
  { name:'Whistler',      province:'BC', lat:50.1163, lng:-122.9574 },
  { name:'Kelowna',       province:'BC', lat:49.8880, lng:-119.4960 },
  { name:'Calgary',       province:'AB', lat:51.0447, lng:-114.0719 },
  { name:'Edmonton',      province:'AB', lat:53.5461, lng:-113.4938 },
  { name:'Banff',         province:'AB', lat:51.1784, lng:-115.5708 },
  { name:'Montreal',      province:'QC', lat:45.5019, lng:-73.5674 },
  { name:'Quebec City',   province:'QC', lat:46.8139, lng:-71.2080 },
  { name:'Gatineau',      province:'QC', lat:45.4765, lng:-75.7013 },
  { name:'Winnipeg',      province:'MB', lat:49.8951, lng:-97.1384 },
  { name:'Regina',        province:'SK', lat:50.4452, lng:-104.6189 },
  { name:'Saskatoon',     province:'SK', lat:52.1332, lng:-106.6700 },
  { name:'Halifax',       province:'NS', lat:44.6488, lng:-63.5752 },
  { name:'Charlottetown', province:'PE', lat:46.2382, lng:-63.1311 },
  { name:'Fredericton',   province:'NB', lat:45.9636, lng:-66.6431 },
  { name:"St. John's",    province:'NL', lat:47.5615, lng:-52.7126 },
  { name:'Whitehorse',    province:'YT', lat:60.7212, lng:-135.0568 },
  { name:'Yellowknife',   province:'NT', lat:62.4540, lng:-114.3718 }
];

// Famous date spots per checklist city: a pin within SPOT_RADIUS_KM checks it off.
var SPOT_RADIUS_KM = 0.5;
var CITY_RADIUS_KM = 75;
var SPOTS = {
  'Toronto': [
    { name:'CN Tower', lat:43.6426, lng:-79.3871 },
    { name:"Ripley's Aquarium", lat:43.6424, lng:-79.3860 },
    { name:'Distillery District', lat:43.6503, lng:-79.3596 },
    { name:'Kensington Market', lat:43.6547, lng:-79.4006 },
    { name:'Toronto Islands (Centre Island)', lat:43.6205, lng:-79.3783 },
    { name:'High Park', lat:43.6465, lng:-79.4637 },
    { name:'St. Lawrence Market', lat:43.6487, lng:-79.3716 },
    { name:'Casa Loma', lat:43.6777, lng:-79.4094 },
    { name:'Art Gallery of Ontario', lat:43.6536, lng:-79.3925 },
    { name:'Scarborough Bluffs', lat:43.7080, lng:-79.2380 }
  ],
  'Vancouver': [
    { name:'Stanley Park', lat:49.3017, lng:-123.1417 },
    { name:'Granville Island', lat:49.2712, lng:-123.1342 },
    { name:'Capilano Suspension Bridge', lat:49.3429, lng:-123.1148 },
    { name:'English Bay', lat:49.2868, lng:-123.1430 },
    { name:'Gastown Steam Clock', lat:49.2844, lng:-123.1088 },
    { name:'Queen Elizabeth Park', lat:49.2417, lng:-123.1126 },
    { name:'Grouse Mountain', lat:49.3794, lng:-123.0817 },
    { name:'Kitsilano Beach', lat:49.2744, lng:-123.1530 },
    { name:'VanDusen Botanical Garden', lat:49.2384, lng:-123.1281 },
    { name:'Science World', lat:49.2734, lng:-123.1038 }
  ],
  'Montreal': [
    { name:'Old Port & Grande Roue', lat:45.5122, lng:-73.5465 },
    { name:'Mount Royal Belvedere', lat:45.5048, lng:-73.5878 },
    { name:'Notre-Dame Basilica', lat:45.5046, lng:-73.5561 },
    { name:'Jean-Talon Market', lat:45.5361, lng:-73.6150 },
    { name:'Biodome', lat:45.5598, lng:-73.5498 },
    { name:'Parc Jean-Drapeau', lat:45.5188, lng:-73.5344 },
    { name:'Atwater Market', lat:45.4797, lng:-73.5767 },
    { name:'Saint Joseph\u2019s Oratory', lat:45.4923, lng:-73.6180 },
    { name:'Montreal Botanical Garden', lat:45.5600, lng:-73.5628 }
  ],
  'Calgary': [
    { name:'Calgary Tower', lat:51.0443, lng:-114.0631 },
    { name:"Prince's Island Park", lat:51.0556, lng:-114.0694 },
    { name:'Peace Bridge', lat:51.0538, lng:-114.0789 },
    { name:'Stephen Avenue Walk', lat:51.0455, lng:-114.0640 },
    { name:'Heritage Park', lat:50.9825, lng:-114.1064 },
    { name:'Calgary Zoo', lat:51.0456, lng:-114.0303 },
    { name:'Fish Creek Provincial Park', lat:50.9545, lng:-114.0663 },
    { name:'TELUS Spark', lat:51.0539, lng:-114.0239 }
  ],
  'Ottawa': [
    { name:'Parliament Hill', lat:45.4215, lng:-75.6972 },
    { name:'Rideau Canal Locks', lat:45.4222, lng:-75.6899 },
    { name:'ByWard Market', lat:45.4273, lng:-75.6922 },
    { name:'National Gallery of Canada', lat:45.4295, lng:-75.6986 },
    { name:"Major's Hill Park", lat:45.4276, lng:-75.6973 },
    { name:'Canadian Museum of History', lat:45.4297, lng:-75.7089 },
    { name:"Dow's Lake", lat:45.3933, lng:-75.7042 },
    { name:'Lansdowne Park', lat:45.3985, lng:-75.6833 },
    { name:'Rideau Falls', lat:45.4423, lng:-75.6958 }
  ],
  'London': [
    { name:'Victoria Park', lat:42.9890, lng:-81.2477 },
    { name:'Covent Garden Market', lat:42.9824, lng:-81.2501 },
    { name:'Springbank Park', lat:42.9556, lng:-81.3053 },
    { name:'Eldon House', lat:42.9815, lng:-81.2459 },
    { name:'Museum London', lat:42.9826, lng:-81.2554 },
    { name:'Fanshawe Pioneer Village', lat:43.0597, lng:-81.1770 },
    { name:'Boler Mountain', lat:42.9444, lng:-81.3389 },
    { name:'Wortley Village', lat:42.9703, lng:-81.2588 },
    { name:'Budweiser Gardens', lat:42.9822, lng:-81.2524 }
  ]
};

/* ---------------- Tiers ---------------- */
var TIER_NAMES  = ['Not started', 'Bronze', 'Silver', 'Gold', 'Maple Master'];
// Accent colours (pin hearts, chips, bars) — soft but readable.
var TIER_COLORS = ['#cfc9c0', '#d98a4b', '#7d94b5', '#d9a514', '#e0483e'];
// Map fills: a pastel family that deepens as the tier rises.
var TIER_FILL   = ['#f3ede1', '#f6cf9f', '#bccddd', '#f2cd6b', '#e85d4a'];

function tierFor(pinCount, cityCount) {
  if (pinCount >= 10 && cityCount >= 5) return 4;
  if (pinCount >= 6 && cityCount >= 3) return 3;
  if (pinCount >= 3 || cityCount >= 2) return 2;
  if (pinCount >= 1) return 1;
  return 0;
}

/* ---------------- Geo helpers ---------------- */
function haversineKm(aLat, aLng, bLat, bLng) {
  var R = 6371, dLat = (bLat - aLat) * Math.PI / 180, dLng = (bLng - aLng) * Math.PI / 180;
  var s = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(aLat * Math.PI / 180) * Math.cos(bLat * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return 2 * R * Math.asin(Math.sqrt(s));
}
function detectProvince(lat, lng) {
  for (var i = 0; i < PROVINCES.length; i++) {
    var boxes = PROVINCES[i].boxes;
    for (var j = 0; j < boxes.length; j++) {
      var b = boxes[j];
      if (lat >= b[0] && lat <= b[1] && lng >= b[2] && lng <= b[3]) return PROVINCES[i].code;
    }
  }
  return null;
}
function detectCity(lat, lng) {
  var best = null, bestD = Infinity;
  CITIES.forEach(function (c) {
    var d = haversineKm(lat, lng, c.lat, c.lng);
    if (d < bestD) { bestD = d; best = c; }
  });
  return bestD <= CITY_RADIUS_KM ? best.name : '';
}
function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function (ch) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
  });
}
function genCode() {
  var chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  var out = '';
  for (var i = 0; i < 6; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}
function categoryEmoji(cat) {
  return { cafe: '☕', food: '🍽️', view: '🌅', activity: '🎡', stay: '🏨', other: '📍' }[cat] || '📍';
}

/* ---------------- State + storage ----------------
   Pin shape: { id, name, lat, lng, province, city, category, visited_on, note, photo_url }
   Storage interface is the seam where Supabase plugs in.        */
var state = {
  couple: null,      // { id, invite_code }
  pins: [],
  pending: null,     // { lat, lng } chosen on the map, waiting for the form
  bubbleId: null,    // pin shown in the info bubble
  journey: true      // journey thread on/off
};
try { state.journey = localStorage.getItem('cdm_journey') !== '0'; } catch (e) {}
var LS_COUPLE = 'cdm_couple', LS_PINS = 'cdm_pins', LS_SEED = 'cdm_seeded_v1';

var SEED_PINS = [
  { name:'CN Tower at sunset', lat:43.6426, lng:-79.3871, category:'view', visited_on:'', note:'First trip to Toronto together' },
  { name:'Covent Garden Market', lat:42.9824, lng:-81.2501, category:'food', visited_on:'', note:'Saturday morning date, London' },
  { name:'Niagara Falls', lat:43.0962, lng:-79.0377, category:'view', visited_on:'', note:'So loud, so worth it' },
  { name:'Banff Avenue stroll', lat:51.1784, lng:-115.5708, category:'activity', visited_on:'', note:'' },
  { name:'Stanley Park seawall', lat:49.3017, lng:-123.1417, category:'activity', visited_on:'', note:'Biked the whole loop' },
  { name:'Old Port evening', lat:45.5122, lng:-73.5465, category:'view', visited_on:'', note:'Grande Roue at night' }
];

function enrich(pin) {
  pin.province = detectProvince(pin.lat, pin.lng);
  pin.city = detectCity(pin.lat, pin.lng);
  return pin;
}

var store = {
  /* --- demo (localStorage) --- */
  demoLoadCouple: function () {
    try {
      var raw = localStorage.getItem(LS_COUPLE);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    var c = { id: 'demo-' + genCode(), invite_code: genCode() };
    localStorage.setItem(LS_COUPLE, JSON.stringify(c));
    return c;
  },
  demoLoadPins: function () {
    try {
      var raw = localStorage.getItem(LS_PINS);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    if (!localStorage.getItem(LS_SEED)) {
      var seeds = SEED_PINS.map(function (p, i) {
        return enrich(Object.assign({ id: 'seed-' + i, photo_url: null }, p));
      });
      localStorage.setItem(LS_PINS, JSON.stringify(seeds));
      localStorage.setItem(LS_SEED, '1');
      return seeds;
    }
    return [];
  },
  demoSavePins: function () {
    localStorage.setItem(LS_PINS, JSON.stringify(state.pins));
  },

  /* --- supabase --- */
  sbLoadCouple: async function () {
    var savedId = null;
    try { savedId = localStorage.getItem('cdm_couple_id'); } catch (e) {}
    if (savedId) {
      var found = await sb.from('couples').select('*').eq('id', savedId).maybeSingle();
      if (found.data) return found.data;
    }
    var created = await sb.from('couples').insert({ invite_code: genCode() }).select().single();
    if (created.error) throw created.error;
    try { localStorage.setItem('cdm_couple_id', created.data.id); } catch (e) {}
    return created.data;
  },
  sbJoinCouple: async function (code) {
    var res = await sb.from('couples').select('*').eq('invite_code', code).maybeSingle();
    if (res.error) throw res.error;
    if (!res.data) return null;
    try { localStorage.setItem('cdm_couple_id', res.data.id); } catch (e) {}
    return res.data;
  },
  sbLoadPins: async function () {
    var res = await sb.from('pins').select('*').eq('couple_id', state.couple.id)
      .order('visited_on', { ascending: true, nullsFirst: false });
    if (res.error) throw res.error;
    return res.data;
  },
  sbAddPin: async function (pin) {
    var row = Object.assign({}, pin); delete row.id;
    row.couple_id = state.couple.id;
    var res = await sb.from('pins').insert(row).select().single();
    if (res.error) throw res.error;
    return res.data;
  },
  sbDeletePin: async function (id) {
    var res = await sb.from('pins').delete().eq('id', id);
    if (res.error) throw res.error;
  }
};

async function loadAll() {
  if (DEMO) {
    state.couple = store.demoLoadCouple();
    state.pins = store.demoLoadPins();
  } else {
    state.couple = await store.sbLoadCouple();
    state.pins = await store.sbLoadPins();
  }
}
async function addPin(pin) {
  enrich(pin);
  if (DEMO) {
    pin.id = 'pin-' + Date.now();
    state.pins.push(pin);
    store.demoSavePins();
  } else {
    var saved = await store.sbAddPin(pin);
    state.pins.push(saved);
  }
}
async function deletePin(id) {
  if (DEMO) {
    state.pins = state.pins.filter(function (p) { return p.id !== id; });
    store.demoSavePins();
  } else {
    await store.sbDeletePin(id);
    state.pins = state.pins.filter(function (p) { return p.id !== id; });
  }
}

/* ---------------- Derived data ---------------- */
function provinceStats() {
  var out = {};
  PROVINCES.forEach(function (p) { out[p.code] = { pins: 0, cities: {} }; });
  state.pins.forEach(function (pin) {
    if (pin.province && out[pin.province]) {
      out[pin.province].pins++;
      if (pin.city) out[pin.province].cities[pin.city] = true;
    }
  });
  Object.keys(out).forEach(function (code) {
    var s = out[code];
    s.cityCount = Object.keys(s.cities).length;
    s.tier = tierFor(s.pins, s.cityCount);
  });
  return out;
}
function spotDone(spot) {
  return state.pins.some(function (p) {
    return haversineKm(p.lat, p.lng, spot.lat, spot.lng) <= SPOT_RADIUS_KM;
  });
}
function checklistProgress() {
  var done = 0, total = 0;
  Object.keys(SPOTS).forEach(function (city) {
    SPOTS[city].forEach(function (s) { total++; if (spotDone(s)) done++; });
  });
  return { done: done, total: total };
}
// Pins in story order: by visit date; undated pins keep their place at the end.
function pinsInStoryOrder() {
  return state.pins.map(function (p, i) { return { pin: p, i: i }; })
    .sort(function (a, b) {
      var da = a.pin.visited_on || '9999', db = b.pin.visited_on || '9999';
      if (da < db) return -1;
      if (da > db) return 1;
      return a.i - b.i;
    })
    .map(function (w) { return w.pin; });
}

/* ============================================================
   Illustrated SVG map
   Projection: simple equirectangular approximation.
   x = (lng - minLng) * K_LNG,  y = maxLat - lat.
   ============================================================ */
var SVGNS = 'http://www.w3.org/2000/svg';
var K_LNG = 0.55;              // longitude squeeze so Canada keeps its shape
var PAD = 1.4;                 // padding (svg units) around the country
var GEO = null;                // { minLng, maxLat, features:[{code, d}] }
var FULL = null;               // { x, y, w, h } full padded extent
var mapSvg = null, posterSvg = null;
var mapParts = null, posterParts = null;   // { paths:{code:path}, journey, pins, temp }

var HEART_D = 'M0 0.62 C-0.10 0.36 -0.64 0.08 -0.64 -0.22 ' +
              'C-0.64 -0.52 -0.40 -0.68 -0.19 -0.68 ' +
              'C-0.07 -0.68 0 -0.60 0 -0.50 ' +
              'C0 -0.60 0.07 -0.68 0.19 -0.68 ' +
              'C0.40 -0.68 0.64 -0.52 0.64 -0.22 ' +
              'C0.64 0.08 0.10 0.36 0 0.62 Z';

function svgEl(tag, attrs) {
  var e = document.createElementNS(SVGNS, tag);
  if (attrs) Object.keys(attrs).forEach(function (k) { e.setAttribute(k, attrs[k]); });
  return e;
}
function project(lat, lng) {
  return [(lng - GEO.minLng) * K_LNG, GEO.maxLat - lat];
}
function unproject(x, y) {
  return { lat: GEO.maxLat - y, lng: GEO.minLng + x / K_LNG };
}
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
async function loadGeo() {
  var res = await fetch('canada-provinces.json');
  if (!res.ok) throw new Error('geojson ' + res.status);
  var fc = await res.json();
  var minLng = Infinity, maxLat = -Infinity;
  fc.features.forEach(function (f) {
    f.geometry.coordinates.forEach(function (poly) {
      poly.forEach(function (ring) {
        ring.forEach(function (pt) {
          if (pt[0] < minLng) minLng = pt[0];
          if (pt[1] > maxLat) maxLat = pt[1];
        });
      });
    });
  });
  GEO = { minLng: minLng, maxLat: maxLat, features: [] };
  fc.features.forEach(function (f) {
    GEO.features.push({ code: f.properties.code, d: geomToPath(f.geometry) });
  });
  // Full extent: also need projected width/height — recompute from lng/lat spans.
  var minLat = Infinity, maxLng = -Infinity;
  fc.features.forEach(function (f) {
    f.geometry.coordinates.forEach(function (poly) {
      poly.forEach(function (ring) {
        ring.forEach(function (pt) {
          if (pt[0] > maxLng) maxLng = pt[0];
          if (pt[1] < minLat) minLat = pt[1];
        });
      });
    });
  });
  var w = (maxLng - minLng) * K_LNG, h = maxLat - minLat;
  FULL = { x: -PAD, y: -PAD, w: w + PAD * 2, h: h + PAD * 2 };
}
function buildSvgView(svg, withTemp) {
  var parts = { paths: {}, journey: null, pins: null, temp: null };
  var gProv = svgEl('g');
  GEO.features.forEach(function (f) {
    var p = svgEl('path', {
      d: f.d, fill: TIER_FILL[0], stroke: '#ffffff',
      'stroke-width': 0.13, 'stroke-linejoin': 'round'
    });
    parts.paths[f.code] = p;
    gProv.appendChild(p);
  });
  svg.appendChild(gProv);
  parts.journey = svgEl('path', {
    d: '', fill: 'none', stroke: '#eda08c', 'stroke-width': 0.15,
    'stroke-opacity': 0.55, 'stroke-linecap': 'round'
  });
  svg.appendChild(parts.journey);
  parts.pins = svgEl('g');
  svg.appendChild(parts.pins);
  if (withTemp) {
    parts.temp = svgEl('g');
    svg.appendChild(parts.temp);
  }
  svg.setAttribute('viewBox', FULL.x + ' ' + FULL.y + ' ' + FULL.w + ' ' + FULL.h);
  return parts;
}
// Soft thread arcs between consecutive pins (quadratic beziers that sag
// a little, like string loosely strung between the hearts).
function journeyPathD() {
  if (!state.journey) return '';
  var ordered = pinsInStoryOrder();
  if (ordered.length < 2) return '';
  var pts = ordered.map(function (p) { return project(p.lat, p.lng); });
  var d = 'M' + pts[0][0].toFixed(2) + ' ' + pts[0][1].toFixed(2);
  for (var i = 1; i < pts.length; i++) {
    var a = pts[i - 1], b = pts[i];
    var mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
    var dx = b[0] - a[0], dy = b[1] - a[1];
    var dist = Math.hypot(dx, dy) || 1;
    var px = dy / dist, py = -dx / dist;      // perpendicular
    if (py < 0) { px = -px; py = -py; }        // sag downward on screen
    var sag = Math.min(dist * 0.16, 3.2);
    var cx = mx + px * sag, cy = my + py * sag;
    d += 'Q' + cx.toFixed(2) + ' ' + cy.toFixed(2) + ' ' + b[0].toFixed(2) + ' ' + b[1].toFixed(2);
  }
  return d;
}
function makeHeart(x, y, scale, fill, extra) {
  var g = svgEl('g', { transform: 'translate(' + x + ' ' + y + ') scale(' + scale + ')' });
  var p = svgEl('path', {
    d: HEART_D, fill: fill, stroke: '#ffffff', 'stroke-width': 0.10,
    'stroke-linejoin': 'round'
  });
  if (extra && extra.cls) p.setAttribute('class', extra.cls);
  g.appendChild(p);
  return g;
}
function renderPinsInto(parts, stats, interactive) {
  while (parts.pins.firstChild) parts.pins.removeChild(parts.pins.firstChild);
  pinsInStoryOrder().forEach(function (pin) {
    var xy = project(pin.lat, pin.lng);
    var tier = pin.province ? stats[pin.province].tier : 0;
    var g = makeHeart(xy[0], xy[1], 1.5, TIER_COLORS[Math.max(tier, 1)], null);
    if (interactive) {
      var hit = svgEl('circle', { r: 1.9, fill: 'rgba(0,0,0,0)' });
      g.appendChild(hit);
      g.style.cursor = 'pointer';
      g.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
      g.addEventListener('click', function (e) {
        e.stopPropagation();
        showBubble(pin);
      });
    }
    parts.pins.appendChild(g);
  });
}
function renderTempPin() {
  if (!mapParts || !mapParts.temp) return;
  var t = mapParts.temp;
  while (t.firstChild) t.removeChild(t.firstChild);
  if (!state.pending) return;
  var xy = project(state.pending.lat, state.pending.lng);
  var halo = svgEl('circle', { cx: xy[0], cy: xy[1], r: 1.35, fill: '#ffffff', 'fill-opacity': 0.85 });
  t.appendChild(halo);
  t.appendChild(makeHeart(xy[0], xy[1], 1.8, '#ef6f6c', { cls: 'temp-heart' }));
}
function renderMapParts(stats) {
  if (!GEO || !mapParts) return;
  [mapParts, posterParts].forEach(function (parts) {
    if (!parts) return;
    Object.keys(parts.paths).forEach(function (code) {
      var tier = stats[code] ? stats[code].tier : 0;
      parts.paths[code].setAttribute('fill', TIER_FILL[tier]);
    });
    parts.journey.setAttribute('d', journeyPathD());
  });
  renderPinsInto(mapParts, stats, true);
  if (posterParts) renderPinsInto(posterParts, stats, false);
  renderTempPin();
}

/* ---------------- Map view (zoom / pan / tap) ---------------- */
var view = { cx: 0, cy: 0, w: 10 };
function stageRect() { return mapSvg.getBoundingClientRect(); }
function fitWidth() {
  var r = stageRect();
  return Math.max(FULL.w, FULL.h * (r.width / Math.max(r.height, 1)));
}
function applyView() {
  if (!FULL) return;
  var r = stageRect();
  var h = view.w * (r.height / Math.max(r.width, 1));
  mapSvg.setAttribute('viewBox',
    (view.cx - view.w / 2) + ' ' + (view.cy - h / 2) + ' ' + view.w + ' ' + h);
  document.getElementById('zoomReset').hidden = !(view.w < fitWidth() * 0.985);
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
  var newW = Math.min(Math.max(view.w * factor, FULL.w / 16), fitWidth() * 1.02);
  var k = newW / view.w;
  view.cx = p.x - (p.x - view.cx) * k;
  view.cy = p.y - (p.y - view.cy) * k;
  view.w = newW;
  clampView();
  applyView();
}
function clientToSvg(evt) {
  var pt = mapSvg.createSVGPoint();
  pt.x = evt.clientX; pt.y = evt.clientY;
  var m = mapSvg.getScreenCTM();
  if (!m) return null;
  return pt.matrixTransform(m.inverse());
}
function focusPin(pin) {
  var xy = project(pin.lat, pin.lng);
  view.w = Math.min(Math.max(FULL.w / 3.4, FULL.w / 16), FULL.w);
  view.cx = xy[0]; view.cy = xy[1];
  clampView();
  applyView();
  showBubble(pin);
}

/* ---------------- Pin bubble ---------------- */
function showBubble(pin) {
  state.bubbleId = pin.id;
  document.getElementById('pbName').textContent = categoryEmoji(pin.category) + ' ' + pin.name;
  document.getElementById('pbSub').textContent =
    (pin.city || '') + (pin.province ? ' · ' + PROVINCE_BY_CODE[pin.province].name : '') +
    (pin.visited_on ? ' · ' + pin.visited_on : '');
  var note = document.getElementById('pbNote');
  note.textContent = pin.note || '';
  note.style.display = pin.note ? '' : 'none';
  document.getElementById('pinBubble').hidden = false;
}
function hideBubble() {
  state.bubbleId = null;
  document.getElementById('pinBubble').hidden = true;
}

/* ---------------- Pending pin (map tap -> form) ---------------- */
function setPending(lat, lng) {
  state.pending = { lat: lat, lng: lng };
  renderTempPin();
  var prov = detectProvince(lat, lng);
  var city = detectCity(lat, lng);
  document.getElementById('fCoords').textContent =
    'Picked: ' + lat.toFixed(4) + ', ' + lng.toFixed(4) +
    (city ? ' — looks like ' + city : '') +
    (prov ? ' (' + PROVINCE_BY_CODE[prov].name + ')' : ' (outside Canada?)');
  document.getElementById('addPinBtn').disabled = false;
  openSheet('addSheet');
  setTimeout(function () {
    var f = document.getElementById('fName');
    if (f) f.focus({ preventScroll: true });
  }, 380);
}
function clearPending() {
  state.pending = null;
  renderTempPin();
  var b = document.getElementById('addPinBtn');
  if (b) b.disabled = true;
}

/* ---------------- Sheets ---------------- */
function hideAllSheets() {
  document.querySelectorAll('.sheet').forEach(function (s) { s.hidden = true; });
  document.getElementById('backdrop').hidden = true;
}
function openSheet(id) {
  hideAllSheets();
  document.getElementById(id).hidden = false;
  document.getElementById('backdrop').hidden = false;
}
function dismissSheets() {
  // Closing the add-pin sheet without saving drops the temp pin.
  if (!document.getElementById('addSheet').hidden) clearPending();
  hideAllSheets();
}

/* ---------------- Rendering (lists & poster) ---------------- */
function renderSummary(stats) {
  var started = PROVINCES.filter(function (p) { return stats[p.code].pins > 0; }).length;
  document.getElementById('summaryLine').textContent =
    state.pins.length + (state.pins.length === 1 ? ' pin' : ' pins') + ' · ' + started + '/13 provinces';
}
function renderProvinces(stats) {
  var wrap = document.getElementById('provinceList');
  wrap.innerHTML = PROVINCES.map(function (p) {
    var s = stats[p.code];
    var pct = Math.min(100, s.tier * 25);
    return '<div class="province-row">' +
      '<span class="province-name">' + esc(p.name) + '</span>' +
      '<span class="tier-chip" style="background:' + TIER_COLORS[Math.max(s.tier, 1)] + '">' + TIER_NAMES[s.tier] + '</span>' +
      '<span class="province-bar"><span class="province-fill" style="display:block;width:' + pct + '%;background:' + TIER_FILL[s.tier] + ';border-right:2px solid ' + TIER_COLORS[Math.max(s.tier, 1)] + '"></span></span>' +
      '<span class="province-meta">' + s.pins + ' pins · ' + s.cityCount + ' cities</span>' +
      '</div>';
  }).join('');
}
function renderChecklists() {
  var wrap = document.getElementById('checklistWrap');
  wrap.innerHTML = Object.keys(SPOTS).map(function (city) {
    var spots = SPOTS[city];
    var doneCount = spots.filter(spotDone).length;
    var chips = spots.map(function (s) {
      var d = spotDone(s);
      return '<span class="spot-chip' + (d ? ' done' : '') + '">' + (d ? '✓ ' : '') + esc(s.name) + '</span>';
    }).join('');
    return '<div class="checklist-city"><h3>' + esc(city) +
      ' <span class="count">' + doneCount + '/' + spots.length + '</span></h3>' +
      '<div class="spot-chips">' + chips + '</div></div>';
  }).join('');
}
function renderPinList(stats) {
  var list = document.getElementById('pinList');
  if (!state.pins.length) {
    list.innerHTML = '<li class="pin-empty">No pins yet. Close this and tap the map where you had a date!</li>';
    return;
  }
  list.innerHTML = pinsInStoryOrder().map(function (pin) {
    var tier = pin.province ? stats[pin.province].tier : 0;
    return '<li class="pin-item" data-id="' + esc(pin.id) + '">' +
      '<span class="pin-heart" style="color:' + TIER_COLORS[Math.max(tier, 1)] + '">♥</span>' +
      '<span class="pin-main"><span class="pin-name">' + categoryEmoji(pin.category) + ' ' + esc(pin.name) + '</span>' +
      '<span class="pin-sub" style="display:block">' + esc(pin.city || '') +
      (pin.province ? ' · ' + esc(PROVINCE_BY_CODE[pin.province].code) : '') +
      (pin.visited_on ? ' · ' + esc(pin.visited_on) : '') + '</span>' +
      (pin.note ? '<span class="pin-note" style="display:block">' + esc(pin.note) + '</span>' : '') +
      '</span>' +
      '<button class="pin-del" type="button" data-del="' + esc(pin.id) + '" title="Delete pin" aria-label="Delete pin">✕</button>' +
      '</li>';
  }).join('');
  list.querySelectorAll('[data-del]').forEach(function (btn) {
    btn.addEventListener('click', async function (ev) {
      ev.stopPropagation();
      await deletePin(btn.getAttribute('data-del'));
      render();
    });
  });
  list.querySelectorAll('.pin-item').forEach(function (item) {
    item.addEventListener('click', function () {
      var pin = state.pins.find(function (p) { return String(p.id) === item.getAttribute('data-id'); });
      if (pin && GEO) { hideAllSheets(); focusPin(pin); }
    });
  });
}
function renderPoster(stats) {
  var provincesStarted = PROVINCES.filter(function (p) { return stats[p.code].pins > 0; }).length;
  var cities = {};
  state.pins.forEach(function (p) { if (p.city) cities[p.city] = true; });
  var spots = checklistProgress();
  document.getElementById('posterStats').innerHTML =
    '<div><strong>' + state.pins.length + '</strong><span>dates pinned</span></div>' +
    '<div><strong>' + provincesStarted + ' / 13</strong><span>provinces</span></div>' +
    '<div><strong>' + Object.keys(cities).length + '</strong><span>cities</span></div>' +
    '<div><strong>' + spots.done + '</strong><span>famous spots</span></div>';
  var dates = state.pins.map(function (p) { return p.visited_on; }).filter(Boolean).sort();
  document.getElementById('posterSub').textContent = dates.length
    ? 'From ' + dates[0] + ' to ' + dates[dates.length - 1] + ' — and counting.'
    : 'Every pin a date, every province a chapter.';
}
function render() {
  var stats = provinceStats();
  renderSummary(stats);
  renderProvinces(stats);
  renderChecklists();
  renderPinList(stats);
  renderMapParts(stats);
  renderPoster(stats);
  if (state.bubbleId) {
    var pin = state.pins.find(function (p) { return String(p.id) === String(state.bubbleId); });
    if (!pin) hideBubble();
  }
}

/* ---------------- Poster PNG (SVG -> canvas, no html2canvas) ---------------- */
function savePosterPng() {
  if (!GEO || !posterSvg) { alert('The map is still loading — try again in a moment.'); return; }
  var stats = provinceStats();
  var provincesStarted = PROVINCES.filter(function (p) { return stats[p.code].pins > 0; }).length;
  var cities = {};
  state.pins.forEach(function (p) { if (p.city) cities[p.city] = true; });
  var spots = checklistProgress();
  var subText = document.getElementById('posterSub').textContent;

  var clone = posterSvg.cloneNode(true);
  clone.setAttribute('xmlns', SVGNS);
  var drawW = 1500;
  var drawH = Math.round(drawW * FULL.h / FULL.w);
  clone.setAttribute('width', drawW);
  clone.setAttribute('height', drawH);
  var svgStr = new XMLSerializer().serializeToString(clone);
  var url = URL.createObjectURL(new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' }));
  var img = new Image();
  img.onload = function () {
    var cw = 1760, ch = 1520;
    var canvas = document.createElement('canvas');
    canvas.width = cw; canvas.height = ch;
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fffaf0';
    ctx.fillRect(0, 0, cw, ch);
    ctx.strokeStyle = '#e7cf9e'; ctx.lineWidth = 4;
    ctx.strokeRect(34, 34, cw - 68, ch - 68);
    ctx.textAlign = 'center';
    var roundFont = '"Arial Rounded MT Bold","Hiragino Maru Gothic ProN",ui-rounded,system-ui,sans-serif';
    ctx.fillStyle = '#d94f4f';
    ctx.font = '800 30px ' + roundFont;
    ctx.fillText('O U R   C A N A D A   S T O R Y', cw / 2, 118);
    ctx.fillStyle = '#4a3f35';
    ctx.font = '800 68px ' + roundFont;
    ctx.fillText('Two people, one big map', cw / 2, 198);
    ctx.fillStyle = '#a08b74';
    ctx.font = '400 31px ' + roundFont;
    ctx.fillText(subText, cw / 2, 248);
    // Illustrated map, fitted into the middle box.
    var boxW = 1620, boxH = 880, boxY = 285;
    var scale = Math.min(boxW / drawW, boxH / drawH);
    var dw = drawW * scale, dh = drawH * scale;
    ctx.drawImage(img, (cw - dw) / 2, boxY + (boxH - dh) / 2, dw, dh);
    URL.revokeObjectURL(url);
    // Stats row.
    ctx.fillStyle = '#4a3f35';
    ctx.font = '800 40px ' + roundFont;
    ctx.fillText(
      state.pins.length + ' dates pinned   ·   ' + provincesStarted + ' / 13 provinces   ·   ' +
      Object.keys(cities).length + ' cities   ·   ' + spots.done + ' famous spots',
      cw / 2, 1275);
    ctx.fillStyle = '#a08b74';
    ctx.font = '400 27px ' + roundFont;
    ctx.fillText('🍁 Made with our own two feet — and a lot of coffee.', cw / 2, 1405);
    if (canvas.toBlob) {
      canvas.toBlob(function (blob) {
        var a = document.createElement('a');
        a.download = 'maplepins-poster.png';
        a.href = URL.createObjectURL(blob);
        a.click();
        setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
      }, 'image/png');
    } else {
      var a2 = document.createElement('a');
      a2.download = 'maplepins-poster.png';
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

/* ---------------- Couple code UI ---------------- */
function setMsg(text, ok) {
  var el = document.getElementById('coupleMsg');
  el.textContent = text || '';
  el.className = 'msg' + (text ? (ok ? ' ok' : ' err') : '');
}
function renderCouple() {
  document.getElementById('myCode').textContent = state.couple ? state.couple.invite_code : '······';
  var badge = document.getElementById('modeBadge');
  var line = document.getElementById('modeLine');
  if (DEMO) {
    badge.textContent = 'Demo'; badge.classList.remove('live');
    line.textContent = 'Demo mode — pins stay in this browser only. Connect Supabase (see README) to share one map.';
  } else {
    badge.textContent = 'Live'; badge.classList.add('live');
    line.textContent = 'Connected — this map is shared via Supabase.';
  }
}

/* ---------------- Wiring ---------------- */
function wire() {
  /* Map pan / tap */
  var drag = null;
  mapSvg.addEventListener('pointerdown', function (e) {
    drag = { id: e.pointerId, x: e.clientX, y: e.clientY, cx: view.cx, cy: view.cy, moved: false };
    try { mapSvg.setPointerCapture(e.pointerId); } catch (err) {}
  });
  mapSvg.addEventListener('pointermove', function (e) {
    if (!drag || e.pointerId !== drag.id || !FULL) return;
    var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!drag.moved && Math.hypot(dx, dy) > 7) drag.moved = true;
    if (drag.moved) {
      var r = stageRect();
      var h = view.w * (r.height / Math.max(r.width, 1));
      view.cx = drag.cx - dx * (view.w / Math.max(r.width, 1));
      view.cy = drag.cy - dy * (h / Math.max(r.height, 1));
      clampView();
      applyView();
    }
  });
  function endPointer(e, isTap) {
    if (!drag || e.pointerId !== drag.id) return;
    var wasDrag = drag.moved;
    drag = null;
    if (isTap && !wasDrag && GEO) {
      var p = clientToSvg(e);
      if (!p) return;
      var ll = unproject(p.x, p.y);
      hideBubble();
      setPending(ll.lat, ll.lng);
    }
  }
  mapSvg.addEventListener('pointerup', function (e) { endPointer(e, true); });
  mapSvg.addEventListener('pointercancel', function (e) { endPointer(e, false); });
  mapSvg.addEventListener('dblclick', function (e) {
    if (!GEO) return;
    e.preventDefault();
    var p = clientToSvg(e);
    if (p) zoomAt(p, 0.55);
  });

  document.getElementById('zoomIn').addEventListener('click', function () {
    if (GEO) zoomAt({ x: view.cx, y: view.cy }, 0.62);
  });
  document.getElementById('zoomOut').addEventListener('click', function () {
    if (GEO) zoomAt({ x: view.cx, y: view.cy }, 1.6);
  });
  document.getElementById('zoomReset').addEventListener('click', fitView);
  window.addEventListener('resize', function () {
    if (!FULL) return;
    if (view.w >= fitWidth() * 0.985) fitView(); else applyView();
  });

  /* Bubble */
  document.getElementById('pbClose').addEventListener('click', hideBubble);
  document.getElementById('pbDelete').addEventListener('click', async function () {
    if (state.bubbleId == null) return;
    var id = state.bubbleId;
    hideBubble();
    await deletePin(id);
    render();
  });

  /* Dock + sheets */
  document.getElementById('recordsBtn').addEventListener('click', function () { openSheet('recordsSheet'); });
  document.getElementById('posterBtn').addEventListener('click', function () { openSheet('posterSheet'); });
  document.getElementById('coupleBtn').addEventListener('click', function () { openSheet('coupleSheet'); });
  document.getElementById('backdrop').addEventListener('click', dismissSheets);
  document.querySelectorAll('[data-close]').forEach(function (btn) {
    btn.addEventListener('click', dismissSheets);
  });
  document.getElementById('addCancelBtn').addEventListener('click', dismissSheets);

  /* Journey toggle */
  var jt = document.getElementById('journeyToggle');
  jt.checked = state.journey;
  jt.addEventListener('change', function () {
    state.journey = jt.checked;
    try { localStorage.setItem('cdm_journey', jt.checked ? '1' : '0'); } catch (e) {}
    render();
  });

  /* Add pin form */
  document.getElementById('pinForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    if (!state.pending) return;
    var pin = {
      name: document.getElementById('fName').value.trim(),
      visited_on: document.getElementById('fDate').value || null,
      category: document.getElementById('fCategory').value,
      note: document.getElementById('fNote').value.trim(),
      lat: state.pending.lat, lng: state.pending.lng,
      photo_url: null
    };
    if (!pin.name) return;
    await addPin(pin);
    state.pending = null;
    renderTempPin();
    e.target.reset();
    document.getElementById('addPinBtn').disabled = true;
    document.getElementById('fCoords').textContent = 'Pinned! 💕 Tap the map for the next one.';
    document.getElementById('tapHint').textContent = 'Pinned! 💕 Tap the map for the next one.';
    hideAllSheets();
    render();
    showBubble(state.pins[state.pins.length - 1]);
  });

  /* Couple code */
  document.getElementById('copyCodeBtn').addEventListener('click', function () {
    if (!state.couple) return;
    var code = state.couple.invite_code;
    if (navigator.clipboard) navigator.clipboard.writeText(code);
    setMsg('Code ' + code + ' copied. Send it to your partner!', true);
  });
  document.getElementById('newCodeBtn').addEventListener('click', async function () {
    if (!window.confirm('Start a brand-new map? This device will switch to a new empty couple map.')) return;
    if (DEMO) {
      localStorage.removeItem(LS_COUPLE);
      localStorage.removeItem(LS_PINS);
      localStorage.removeItem(LS_SEED);
      state.couple = store.demoLoadCouple();
      state.pins = [];
      setMsg('New map started. Share the new code with your partner.', true);
    } else {
      try { localStorage.removeItem('cdm_couple_id'); } catch (e) {}
      state.couple = await store.sbLoadCouple();
      state.pins = await store.sbLoadPins();
      setMsg('New map started.', true);
    }
    hideBubble();
    renderCouple();
    render();
  });
  document.getElementById('joinForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    var code = document.getElementById('joinInput').value.trim().toUpperCase();
    if (!code) return;
    if (DEMO) {
      setMsg('Demo mode keeps one map per browser. Connect Supabase (see README) to join a partner\u2019s map.', false);
      return;
    }
    try {
      var couple = await store.sbJoinCouple(code);
      if (!couple) { setMsg('No map found for code ' + code + '.', false); return; }
      state.couple = couple;
      state.pins = await store.sbLoadPins();
      hideBubble();
      renderCouple();
      render();
      setMsg('Joined! You are now sharing the map for code ' + code + '.', true);
    } catch (err) {
      setMsg('Could not join: ' + (err.message || err), false);
    }
  });

  document.getElementById('clearSeedsBtn').addEventListener('click', async function () {
    var seeds = state.pins.filter(function (p) { return String(p.id).indexOf('seed-') === 0; });
    if (!seeds.length) return;
    for (var i = 0; i < seeds.length; i++) await deletePin(seeds[i].id);
    render();
  });

  document.getElementById('posterPngBtn').addEventListener('click', savePosterPng);
}

/* ---------------- Init ---------------- */
(async function init() {
  mapSvg = document.getElementById('mapSvg');
  posterSvg = document.getElementById('posterSvg');
  wire();
  try {
    await loadGeo();
    mapParts = buildSvgView(mapSvg, true);
    posterParts = buildSvgView(posterSvg, false);
    posterSvg.style.aspectRatio = FULL.w + ' / ' + FULL.h;
    fitView();
  } catch (err) {
    document.getElementById('summaryLine').textContent =
      'Map outline could not load — please open this page via a web server (see README).';
  }
  try {
    await loadAll();
  } catch (err) {
    setMsg('Could not load data: ' + (err.message || err) + ' — check config.js / schema (see README).', false);
  }
  renderCouple();
  render();
})();

})();
