import { colors } from './theme';

// How close something must be to count as "your area".
export const NEARBY_KM = 5;
// Reports of the same kind within this distance are grouped into one outage area.
export const CLUSTER_KM = 1;
// Chat messages shown from this far away.
export const CHAT_KM = 15;
// Distinct people reporting before an outage counts as confirmed.
export const CONFIRM_COUNT = 3;
// Reports older than this are ignored.
export const REPORT_WINDOW_MS = 24 * 60 * 60 * 1000;

export const TYPES = {
  power: { label: 'Power outage', short: 'Power', icon: 'flash', color: colors.power },
  water: { label: 'No water', short: 'Water', icon: 'water', color: colors.water },
  low_pressure: { label: 'Low water pressure', short: 'Low pressure', icon: 'speedometer', color: colors.pressure },
};

export function distanceKm(a, b) {
  if (!a || !b) return Infinity;
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function formatDistance(km) {
  if (!isFinite(km)) return '';
  if (km < 1) return `${Math.round(km * 1000)} m away`;
  return `${km.toFixed(1)} km away`;
}

export function timeAgo(ms) {
  const s = Math.max(0, Math.floor((Date.now() - ms) / 1000));
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hr ago`;
  return `${Math.floor(h / 24)} d ago`;
}

export function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

/**
 * Groups individual reports into outage areas.
 * Reports are replayed oldest-first; an "It's back" (restored) report clears
 * the matching area, so only outages still active are returned.
 */
export function buildClusters(reports) {
  const cutoff = Date.now() - REPORT_WINDOW_MS;
  const sorted = reports
    .filter((r) => r && TYPES[r.type] && r.createdAt >= cutoff)
    .sort((a, b) => a.createdAt - b.createdAt);

  const clusters = [];
  for (const r of sorted) {
    let c = clusters.find((x) => x.type === r.type && distanceKm(x, r) <= CLUSTER_KM);
    if (r.status === 'restored') {
      if (c) c.reports = [];
      continue;
    }
    if (!c) {
      c = { type: r.type, lat: r.lat, lng: r.lng, reports: [] };
      clusters.push(c);
    }
    c.reports.push(r);
    c.lat = c.reports.reduce((t, x) => t + x.lat, 0) / c.reports.length;
    c.lng = c.reports.reduce((t, x) => t + x.lng, 0) / c.reports.length;
  }

  return clusters
    .filter((c) => c.reports.length > 0)
    .map((c) => {
      const people = new Set(c.reports.map((r) => r.from || r.uid)).size;
      const last = Math.max(...c.reports.map((r) => r.createdAt));
      return {
        key: `${c.type}:${c.reports[0].id}`,
        type: c.type,
        lat: c.lat,
        lng: c.lng,
        count: people,
        confirmed: people >= CONFIRM_COUNT,
        last,
        notes: c.reports.filter((r) => r.note).slice(-3).map((r) => r.note),
        reporters: c.reports.map((r) => r.from || r.uid),
      };
    });
}
