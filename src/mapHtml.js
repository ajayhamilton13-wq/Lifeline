// Leaflet map in a WebView. Dark CARTO basemap (OpenStreetMap data), no API key needed.
export const mapHtml = `<!DOCTYPE html>
<html><head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
  html,body,#map{margin:0;height:100%;background:#060A13}
  .leaflet-control-attribution{background:rgba(6,10,19,.7)!important;color:#7F8BA3!important;font-size:9px}
  .leaflet-control-attribution a{color:#7F8BA3!important}
  /* outage zones */
  .zone{animation:breathe 2.4s ease-in-out infinite}
  .zone.confirmed{animation-duration:1.3s}
  @keyframes breathe{0%,100%{fill-opacity:.38}50%{fill-opacity:.14}}
  /* centre marker of a zone */
  .pin{position:relative;width:34px;height:34px}
  .pin .core{position:absolute;inset:7px;border-radius:50%;border:2px solid #060A13;display:flex;align-items:center;justify-content:center;font:900 11px/1 -apple-system,Roboto,sans-serif;color:#060A13}
  .pin .ring{position:absolute;inset:0;border-radius:50%;animation:ring 1.8s ease-out infinite}
  @keyframes ring{0%{transform:scale(.5);opacity:.8}100%{transform:scale(1.5);opacity:0}}
  /* you */
  .me{position:relative;width:26px;height:26px}
  .me .dot{position:absolute;inset:6px;border-radius:50%;background:#3FA9FF;border:3px solid #fff;box-shadow:0 0 12px #3FA9FF}
  .me .halo{position:absolute;inset:-14px;border-radius:50%;background:rgba(63,169,255,.25);animation:ring 2.2s ease-out infinite}
  /* sharers */
  .share{width:14px;height:14px;border-radius:5px;background:#2BD99F;border:2px solid #060A13;box-shadow:0 0 10px rgba(43,217,159,.8);transform:rotate(45deg)}
  /* popups */
  .leaflet-popup-content-wrapper{background:#101828;color:#F2F5FB;border-radius:16px;border:1px solid #2C3A57;box-shadow:0 12px 30px rgba(0,0,0,.5)}
  .leaflet-popup-tip{background:#101828}
  .leaflet-popup-content{margin:14px 16px;font:500 13px/1.45 -apple-system,Roboto,sans-serif}
  .leaflet-popup-close-button{color:#7F8BA3!important}
  .pt{font-weight:800;font-size:15px;margin-bottom:2px}
  .pm{color:#7F8BA3}
  .badge{display:inline-block;padding:2px 8px;border-radius:99px;font-weight:800;font-size:10px;letter-spacing:.8px;margin-top:6px}
  .note{margin-top:8px;padding-left:8px;border-left:2px solid #2C3A57;color:#C3CCDD;font-style:italic}
</style>
</head><body><div id="map"></div>
<script>
  var map = L.map('map', { zoomControl: false, attributionControl: true }).setView([18.11, -77.3], 9);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 19, subdomains: 'abcd',
    attribution: '&copy; OpenStreetMap &copy; CARTO'
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
      L.circle([c.lat, c.lng], {
        radius: c.radius, color: c.color, weight: 1.5, opacity: .9, fillColor: c.color, fillOpacity: .3,
        className: 'zone' + (c.confirmed ? ' confirmed' : '')
      }).addTo(layer);
      var html = '<div class="pin"><div class="ring" style="background:' + c.color + '55"></div>' +
        '<div class="core" style="background:' + c.color + '">' + esc(c.count) + '</div></div>';
      var badge = c.confirmed
        ? '<span class="badge" style="background:' + c.color + ';color:#060A13">CONFIRMED</span>'
        : '<span class="badge" style="border:1px solid ' + c.color + ';color:' + c.color + '">REPORTED</span>';
      L.marker([c.lat, c.lng], { icon: L.divIcon({ className: '', html: html, iconSize: [34, 34], iconAnchor: [17, 17] }) })
        .addTo(layer)
        .bindPopup('<div class="pt">' + esc(c.label) + '</div><div class="pm">' + esc(c.count) +
          (c.count == 1 ? ' person' : ' people') + ' &middot; ' + esc(c.ago) + '</div>' + badge +
          (c.notes && c.notes.length ? c.notes.map(function (n) { return '<div class="note">' + esc(n) + '</div>'; }).join('') : ''));
    });
    (d.resources || []).forEach(function (r) {
      L.marker([r.lat, r.lng], { icon: L.divIcon({ className: '', html: '<div class="share"></div>', iconSize: [14, 14] }) })
        .addTo(layer)
        .bindPopup('<div class="pt">' + esc(r.name) + '</div><div class="pm">Can share</div><div class="note">' + esc(r.items) + '</div>');
    });
    if (d.me) {
      var ll = [d.me.lat, d.me.lng];
      if (!meMarker) {
        meMarker = L.marker(ll, { icon: L.divIcon({ className: '', html: '<div class="me"><div class="halo"></div><div class="dot"></div></div>', iconSize: [26, 26] }), zIndexOffset: 1000 }).addTo(map);
      } else meMarker.setLatLng(ll);
      if (!centered) { map.setView(ll, 14); centered = true; }
    }
  };
  window.lifelineCenter = function () { if (meMarker) map.flyTo(meMarker.getLatLng(), 15, { duration: .8 }); };
  post({ type: 'ready' });
</script>
</body></html>`;
