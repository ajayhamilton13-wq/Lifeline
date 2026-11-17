import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../AppContext';
import { colors } from '../theme';
import { TYPES, distanceKm, timeAgo, NEARBY_KM } from '../geo';
import { mapHtml } from '../mapHtml';
import { ConnectionPill, s } from '../components/ui';
import ReportSheet from '../components/ReportSheet';

export default function MapScreen() {
  const { clusters, resources, location, locationDenied } = useApp();
  const web = useRef(null);
  const [ready, setReady] = useState(false);
  const [sheet, setSheet] = useState(false);

  const payload = useMemo(
    () => ({
      me: location,
      clusters: clusters.map((c) => ({
        lat: c.lat, lng: c.lng, color: TYPES[c.type].color, label: TYPES[c.type].label,
        count: c.count, confirmed: c.confirmed, ago: timeAgo(c.last), notes: c.notes,
        radius: Math.min(350 + c.count * 120, 1200),
      })),
      resources: resources
        .filter((r) => typeof r.lat === 'number')
        .map((r) => ({ lat: r.lat, lng: r.lng, name: r.name, items: (r.items || []).join(', ') })),
    }),
    [clusters, resources, location],
  );

  useEffect(() => {
    if (ready && web.current) {
      web.current.injectJavaScript(`window.lifelineUpdate(${JSON.stringify(payload)}); true;`);
    }
  }, [payload, ready]);

  const nearCount = location ? clusters.filter((c) => distanceKm(location, c) <= NEARBY_KM).length : 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <WebView
        ref={web}
        source={{ html: mapHtml, baseUrl: 'https://lifeline.local/' }}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
        style={{ flex: 1, backgroundColor: colors.bg }}
        onMessage={(e) => {
          try {
            const m = JSON.parse(e.nativeEvent.data);
            if (m.type === 'ready') setReady(true);
          } catch {}
        }}
      />

      {/* Top overlay */}
      <View style={{ position: 'absolute', top: 10, left: 12, right: 12 }}>
        <View style={{ backgroundColor: colors.card + 'EE', borderRadius: 16, padding: 12, borderWidth: 1, borderColor: colors.border }}>
          <View style={[s.row, { justifyContent: 'space-between' }]}>
            <Text style={{ color: colors.text, fontSize: 20, fontWeight: '800' }}>Lifeline</Text>
            <ConnectionPill />
          </View>
          <Text style={[s.muted, { marginTop: 4 }]}>
            {locationDenied
              ? 'Turn on location so Lifeline can show outages near you.'
              : !location
              ? 'Finding your location…'
              : nearCount === 0
              ? 'No outages reported within 5 km.'
              : `${nearCount} active outage${nearCount > 1 ? 's' : ''} within 5 km.`}
          </Text>
          <View style={[s.row, { marginTop: 8, gap: 12, flexWrap: 'wrap' }]}>
            {Object.values(TYPES).map((t) => (
              <View key={t.label} style={s.row}>
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: t.color, marginRight: 5 }} />
                <Text style={{ color: colors.muted, fontSize: 12 }}>{t.short}</Text>
              </View>
            ))}
            <View style={s.row}>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.ok, marginRight: 5 }} />
              <Text style={{ color: colors.muted, fontSize: 12 }}>Sharing</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Buttons */}
      <Pressable
        onPress={() => web.current && web.current.injectJavaScript('window.lifelineCenter(); true;')}
        style={{
          position: 'absolute', right: 16, bottom: 96, width: 52, height: 52, borderRadius: 26,
          backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border,
        }}
      >
        <Ionicons name="locate" size={24} color={colors.text} />
      </Pressable>
      <Pressable
        onPress={() => setSheet(true)}
        style={{
          position: 'absolute', left: 16, right: 16, bottom: 20, height: 60, borderRadius: 18,
          backgroundColor: colors.accent, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
          elevation: 6,
        }}
      >
        <Ionicons name="megaphone" size={22} color="#fff" />
        <Text style={{ color: '#fff', fontSize: 17, fontWeight: '800', marginLeft: 10 }}>Report outage</Text>
      </Pressable>

      <ReportSheet visible={sheet} onClose={() => setSheet(false)} />
    </View>
  );
}
