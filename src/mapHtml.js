// Leaflet + OpenStreetMap, shown inside a WebView. No API key or billing needed.
export const mapHtml = `<!DOCTYPE html>
<html><head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
  html,body,#map{margin:0;height:100%;background:#0B1220}
  .leaflet-tile-pane{filter:brightness(.72) contrast(1.1) saturate(.85)}
  .glow{animation:glow 1.6s ease-in-out infinite}
  @keyframes glow{0%,100%{fill-opacity:.55;stroke-opacity:1}50%{fill-opacity:.2;stroke-opacity:.4}}
  .me{width:14px;height:14px;border-radius:50%;background:#3B82F6;border:3px solid #fff;box-shadow:0 0 0 7px rgba(59,130,246,.3)}
  .leaflet-popup-content{font:14px/1.4 sans-serif}
  .leaflet-popup-content b{font-size:15px}
</style>
</head><body><div id="map"></div>
<script>
  var map = L.map('map', { zoomControl: false, attributionControl: true }).setView([18.11, -77.3], 9);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19, attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);
  var layer = L.layerGroup().addTo(map);
  var meMarker = null, centered = false;

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function post(m) { if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify(m)); }

  window.lifelineUpdate = function (d) {
    layer.clearLayers();
    (d.clusters || []).forEach(function (c) {
      var circle = L.circle([c.lat, c.lng], {
        radius: c.radius, color: c.color, weight: 2, fillColor: c.color,
        fillOpacity: c.confirmed ? 0.45 : 0.22, className: c.confirmed ? 'glow' : ''
      }).addTo(layer);
      circle.bindPopup('<b>' + esc(c.label) + '</b><br>' + esc(c.count) + (c.count == 1 ? ' report' : ' people reported') +
        (c.confirmed ? ' &middot; <b>confirmed</b>' : '') + '<br>Last report ' + esc(c.ago) +
        (c.notes && c.notes.length ? '<br><i>' + c.notes.map(esc).join('<br>') + '</i>' : ''));
    });
    (d.resources || []).forEach(function (r) {
      L.circleMarker([r.lat, r.lng], { radius: 7, color: '#fff', weight: 2, fillColor: '#22C55E', fillOpacity: 1 })
        .addTo(layer).bindPopup('<b>' + esc(r.name) + ' can share</b><br>' + esc(r.items));
    });
    if (d.me) {
      var ll = [d.me.lat, d.me.lng];
      if (!meMarker) {
        meMarker = L.marker(ll, { icon: L.divIcon({ className: '', html: '<div class="me"></div>', iconSize: [20, 20] }), zIndexOffset: 1000 }).addTo(map);
      } else meMarker.setLatLng(ll);
      if (!centered) { map.setView(ll, 14); centered = true; }
    }
  };
  window.lifelineCenter = function () { if (meMarker) map.setView(meMarker.getLatLng(), 15); };
  map.on('click', function (e) { post({ type: 'tap', lat: e.latlng.lat, lng: e.latlng.lng }); });
  post({ type: 'ready' });
</script>
</body></html>`;
