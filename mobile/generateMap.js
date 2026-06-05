const fs = require('fs');
const path = require('path');

const js = fs.readFileSync(path.join(__dirname, 'node_modules/leaflet/dist/leaflet.js'), 'utf8');
const css = fs.readFileSync(path.join(__dirname, 'node_modules/leaflet/dist/leaflet.css'), 'utf8');

// Escape for use inside a JS template literal string value
// We'll use JSON.stringify to safely encode the strings
const jsEncoded = JSON.stringify(js);
const cssEncoded = JSON.stringify(css);

const mapLogic = `
  var map = L.map('map', { zoomControl: true }).setView([LAT, LNG], 14);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

  var pinIcon = L.divIcon({
    className: '',
    html: '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="44" viewBox="0 0 28 44"><path fill="#2563eb" stroke="#ffffff" stroke-width="2" d="M14 0C6.27 0 0 6.27 0 14c0 10.5 14 30 14 30S28 24.5 28 14C28 6.27 21.73 0 14 0z"/><circle cx="14" cy="14" r="6" fill="white"/></svg>',
    iconSize: [28, 44],
    iconAnchor: [14, 44],
    popupAnchor: [0, -44],
  });
  var marker = L.marker([LAT, LNG], { icon: pinIcon, draggable: true }).addTo(map);

  marker.on('dragend', function(e) {
    var p = e.target.getLatLng();
    send({ type: 'move', lat: p.lat, lng: p.lng });
  });

  map.on('click', function(e) {
    marker.setLatLng(e.latlng);
    send({ type: 'move', lat: e.latlng.lat, lng: e.latlng.lng });
  });

  function send(data) {
    window.ReactNativeWebView.postMessage(JSON.stringify(data));
  }

  function handleMsg(e) {
    try {
      var d = JSON.parse(e.data);
      if (d.type === 'goto') {
        marker.setLatLng([d.lat, d.lng]);
        map.setView([d.lat, d.lng], 15);
      }
    } catch(err) {}
  }
  document.addEventListener('message', handleMsg);
  window.addEventListener('message', handleMsg);
`;

const output = `// Auto-generated — do not edit manually. Run generateMap.js to regenerate.
const LEAFLET_JS = ${jsEncoded};
const LEAFLET_CSS = ${cssEncoded};
const MAP_LOGIC = ${JSON.stringify(mapLogic)};

export function buildMapHTML(lat, lng, isDark) {
  const bg = isDark ? '#1e293b' : '#f1f5f9';
  const logic = MAP_LOGIC.replace(/LAT/g, lat).replace(/LNG/g, lng);
  return [
    '<!DOCTYPE html><html><head>',
    '<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">',
    '<style>', LEAFLET_CSS, '</style>',
    '<style>* { margin:0; padding:0; box-sizing:border-box; } body { background:', bg, '; } #map { width:100vw; height:100vh; } .leaflet-control-attribution { display:none; }</style>',
    '</head><body>',
    '<div id="map"></div>',
    '<script>', LEAFLET_JS, '<\\/script>',
    '<script>', logic, '<\\/script>',
    '</body></html>',
  ].join('');
}
`;

const outPath = path.join(__dirname, 'src/utils/mapHTML.js');
fs.writeFileSync(outPath, output, 'utf8');
console.log('OK — generado en', outPath);
console.log('Tamaño:', Math.round(output.length / 1024), 'KB');
