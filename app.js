/* ============================================================
   MaplePins — couple date map (v1)
   - No build step. Plain script.
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
// Bounding boxes are a deliberately simple v1 approximation:
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
var TIER_COLORS = ['#cfc9c0', '#c97b3f', '#8d99ae', '#e0a100', '#d90429'];
var TIER_ALPHA  = [0.15, 0.5, 0.68, 0.88, 1]; // poster fill intensity per tier

function tierFor(pinCount, cityCount) {
  if (pinCount >= 10 && cityCount >= 5) return 4;
  if (pinCount >= 6 && cityCount >= 3) return 3;
  if (pinCount >= 3 || cityCount >= 2) return 2;
  if (pinCount >= 1) return 1;
  return 0;
}
function hexToRgba(hex, alpha) {
  var n = parseInt(hex.slice(1), 16);
  return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + alpha + ')';
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

/* ---------------- State + storage ----------------
   Pin shape: { id, name, lat, lng, province, city, category, visited_on, note, photo_url }
   Storage interface is the seam where Supabase plugs in.        */
var state = {
  couple: null,      // { id, invite_code }
  pins: [],
  pending: null,     // { lat, lng } chosen on the map, waiting for the form
  seeded: false
};
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
      state.seeded = true;
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

/* ---------------- Map ---------------- */
var map = null, markersLayer = null, pendingMarker = null;
function initMap() {
  map = L.map('map', { scrollWheelZoom: true }).setView([57.5, -96.5], 4);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);
  markersLayer = L.layerGroup().addTo(map);
  map.on('click', function (e) {
    state.pending = { lat: e.latlng.lat, lng: e.latlng.lng };
    if (pendingMarker) pendingMarker.remove();
    pendingMarker = L.marker(e.latlng, { opacity: 0.65 }).addTo(map);
    var prov = detectProvince(e.latlng.lat, e.latlng.lng);
    var city = detectCity(e.latlng.lat, e.latlng.lng);
    document.getElementById('fCoords').textContent =
      'Picked: ' + e.latlng.lat.toFixed(4) + ', ' + e.latlng.lng.toFixed(4) +
      (city ? ' — looks like ' + city : '') +
      (prov ? ' (' + PROVINCE_BY_CODE[prov].name + ')' : ' (outside Canada?)');
    document.getElementById('addPinBtn').disabled = false;
    if (window.innerWidth < 860) {
      document.getElementById('pinForm').scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });
}
function categoryEmoji(cat) {
  return { cafe: '☕', food: '🍽️', view: '🌅', activity: '🎡', stay: '🏨', other: '📍' }[cat] || '📍';
}
function renderMarkers(stats) {
  if (!markersLayer) return;
  markersLayer.clearLayers();
  state.pins.forEach(function (pin) {
    var tier = pin.province ? stats[pin.province].tier : 0;
    var color = TIER_COLORS[Math.max(tier, 1)];
    var m = L.circleMarker([pin.lat, pin.lng], {
      radius: 9, color: '#ffffff', weight: 2, fillColor: color, fillOpacity: 0.95
    });
    m.bindPopup(
      '<div class="pin-popup"><div class="pp-name">' + categoryEmoji(pin.category) + ' ' + esc(pin.name) + '</div>' +
      '<div class="pp-sub">' + esc(pin.city || '') + (pin.province ? ' · ' + esc(PROVINCE_BY_CODE[pin.province].name) : '') +
      (pin.visited_on ? ' · ' + esc(pin.visited_on) : '') + '</div>' +
      (pin.note ? '<div class="pp-note">' + esc(pin.note) + '</div>' : '') + '</div>'
    );
    m.addTo(markersLayer);
  });
}

/* ---------------- Rendering ---------------- */
function renderStats(stats) {
  var provincesStarted = PROVINCES.filter(function (p) { return stats[p.code].pins > 0; }).length;
  var cities = {};
  state.pins.forEach(function (p) { if (p.city) cities[p.city] = true; });
  var spots = checklistProgress();
  document.getElementById('statPins').textContent = state.pins.length;
  document.getElementById('statProvinces').textContent = provincesStarted + '/13';
  document.getElementById('statCities').textContent = Object.keys(cities).length;
  document.getElementById('statSpots').textContent = spots.done + '/' + spots.total;
}
function renderProvinces(stats) {
  var wrap = document.getElementById('provinceList');
  wrap.innerHTML = PROVINCES.map(function (p) {
    var s = stats[p.code];
    var pct = Math.min(100, s.tier * 25);
    return '<div class="province-row">' +
      '<span class="province-name">' + esc(p.name) + '</span>' +
      '<span class="tier-chip" style="background:' + TIER_COLORS[s.tier] + '">' + TIER_NAMES[s.tier] + '</span>' +
      '<span class="province-bar"><span class="province-fill" style="display:block;width:' + pct + '%;background:' + TIER_COLORS[s.tier] + '"></span></span>' +
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
    list.innerHTML = '<li class="pin-empty">No pins yet. Tap the map where you had a date!</li>';
    return;
  }
  var sorted = state.pins.slice().sort(function (a, b) {
    return String(a.visited_on || '9999') < String(b.visited_on || '9999') ? -1 : 1;
  });
  list.innerHTML = sorted.map(function (pin) {
    var tier = pin.province ? stats[pin.province].tier : 0;
    return '<li class="pin-item" data-id="' + esc(pin.id) + '">' +
      '<span class="pin-dot" style="background:' + TIER_COLORS[Math.max(tier, 1)] + '"></span>' +
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
      if (pin && map) map.setView([pin.lat, pin.lng], Math.max(map.getZoom(), 9));
    });
  });
}
function renderPoster(stats) {
  var grid = document.getElementById('posterGrid');
  grid.innerHTML = PROVINCES.map(function (p) {
    var s = stats[p.code];
    return '<div class="poster-tile" style="background:' + hexToRgba(TIER_COLORS[s.tier], Math.max(TIER_ALPHA[s.tier], 0.15)) + ';' +
      (s.tier === 0 ? 'color:#8a7f72;text-shadow:none;' : '') + '">' +
      '<span class="t-code">' + p.code + '</span>' +
      '<span class="t-name">' + esc(p.name) + '</span>' +
      '<span class="t-meta">' + (s.pins ? s.pins + ' pins · ' + TIER_NAMES[s.tier] : 'someday') + '</span>' +
      '</div>';
  }).join('');
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
  renderStats(stats);
  renderProvinces(stats);
  renderChecklists();
  renderPinList(stats);
  renderMarkers(stats);
  renderPoster(stats);
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
  if (DEMO) { badge.textContent = 'Demo mode — this browser only'; badge.classList.remove('live'); }
  else { badge.textContent = 'Connected — shared via Supabase'; badge.classList.add('live'); }
}

/* ---------------- Wiring ---------------- */
function wire() {
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
    if (pendingMarker) { pendingMarker.remove(); pendingMarker = null; }
    e.target.reset();
    document.getElementById('fCoords').textContent = 'Pinned! Tap the map for the next one.';
    document.getElementById('addPinBtn').disabled = true;
    render();
  });

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
      renderCouple();
      render();
      setMsg('Joined! You are now sharing the map for code ' + code + '.', true);
    } catch (err) {
      setMsg('Could not join: ' + (err.message || err), false);
    }
  });

  document.getElementById('clearSeedsBtn').addEventListener('click', async function () {
    var seeds = state.pins.filter(function (p) { return String(p.id).indexOf('seed-') === 0; });
    if (!seeds.length) { setMsg('No example pins left to clear.', true); return; }
    for (var i = 0; i < seeds.length; i++) await deletePin(seeds[i].id);
    render();
  });

  document.getElementById('posterToggle').addEventListener('click', function () {
    var wrap = document.getElementById('posterWrap');
    var show = wrap.hidden;
    wrap.hidden = !show;
    this.textContent = show ? 'Hide poster' : 'Show poster';
    if (show) wrap.scrollIntoView({ behavior: 'smooth' });
  });

  document.getElementById('posterPngBtn').addEventListener('click', function () {
    var wrap = document.getElementById('posterWrap');
    if (wrap.hidden) document.getElementById('posterToggle').click();
    var card = document.getElementById('posterCard');
    if (!window.html2canvas) { alert('PNG export library did not load — check your connection and try again.'); return; }
    window.html2canvas(card, { scale: 2, backgroundColor: '#fdfaf3' }).then(function (canvas) {
      var a = document.createElement('a');
      a.download = 'our-canada-story.png';
      a.href = canvas.toDataURL('image/png');
      a.click();
    });
  });
}

/* ---------------- Init ---------------- */
(async function init() {
  initMap();
  wire();
  try {
    await loadAll();
  } catch (err) {
    setMsg('Could not load data: ' + (err.message || err) + ' — check config.js / schema (see README).', false);
  }
  renderCouple();
  render();
})();

})();
