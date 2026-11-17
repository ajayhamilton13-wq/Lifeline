import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Pressable, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../AppContext';
import { colors, radii, shadow, tint, type, TAB_SPACE } from '../theme';
import { TYPES, distanceKm, timeAgo, NEARBY_KM } from '../geo';
import { mapHtml } from '../mapHtml';
import { ConnectionPill } from '../components/ui';
import ReportSheet from '../components/ReportSheet';

function StatusTile({ typeKey, out, confirmed }) {
  const t = TYPES[typeKey];
  const c = out ? t.color : colors.ok;
  return (
    <View
      style={{
        flex: 1, padding: 12, borderRadius: radii.md, backgroundColor: out ? tint(t.color, 0.12) : colors.bgRaised,
        borderWidth: 1, borderColor: out ? tint(t.color, 0.5) : colors.border,
      }}
    >
      <Ionicons name={t.icon} size={18} color={out ? t.color : colors.muted} />
      <Text style={{ color: colors.text, fontWeight: '800', fontSize: 13, marginTop: 8 }} numberOfLines={1}>{t.short}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3 }}>
        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: c, marginRight: 5 }} />
        <Text style={{ color: c, fontWeight: '800', fontSize: 11, letterSpacing: 0.4 }}>
          {out ? (confirmed ? 'CONFIRMED' : 'REPORTED') : 'NORMAL'}
        </Text>
      </View>
    </View>
  );
}

function ReportButton({ onPress }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.timing(v, { toValue: 1, duration: 2000, easing: Easing.out(Easing.quad), useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [v]);
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [{ marginTop: 14 }, pressed && { transform: [{ scale: 0.98 }] }]}>
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, borderRadius: radii.lg, borderWidth: 2, borderColor: colors.accent,
          opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] }),
          transform: [{ scaleX: v.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] }) }, { scaleY: v.interpolate({ inputRange: [0, 1], outputRange: [1, 1.35] }) }],
        }}
      />
      <View
        style={{
          height: 58, borderRadius: radii.lg, backgroundColor: colors.accent, flexDirection: 'row', alignItems: 'center',
          justifyContent: 'center', ...shadow.glow(colors.accent),
        }}
      >
        <Ionicons name="megaphone" size={21} color="#fff" />
        <Text style={{ color: '#fff', fontSize: 17, fontWeight: '900', marginLeft: 10, letterSpacing: 0.2 }}>Report an outage</Text>
      </View>
    </Pressable>
  );
}

export default function MapScreen({ goTo }) {
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
        radius: Math.min(300 + c.count * 120, 1200),
      })),
      resources: resources
        .filter((r) => typeof r.lat === 'number')
        .map((r) => ({ lat: r.lat, lng: r.lng, name: r.name, items: (r.items || []).join(', ') })),
    }),
    [clusters, resources, location],
  );

  useEffect(() => {
    if (ready && web.current) web.current.injectJavaScript(`window.lifelineUpdate(${JSON.stringify(payload)}); true;`);
  }, [payload, ready]);

  const near = location ? clusters.filter((c) => distanceKm(location, c) <= NEARBY_KM) : [];
  const stateOf = (k) => {
    const list = near.filter((c) => c.type === k);
    return { out: list.length > 0, confirmed: list.some((c) => c.confirmed) };
  };

  let headline = 'All clear around you';
  let sub = 'No outages reported within 5 km';
  if (locationDenied) {
    headline = 'Location is off';
    sub = 'Turn it on so Lifeline can watch your area';
  } else if (!location) {
    headline = 'Finding you…';
    sub = 'Getting your location';
  } else if (near.length) {
    headline = `${near.length} active outage${near.length > 1 ? 's' : ''} nearby`;
    sub = 'Tap a glowing area on the map for details';
  }

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
            if (JSON.parse(e.nativeEvent.data).type === 'ready') setReady(true);
          } catch {}
        }}
      />

      {/* Brand bar */}
      <View style={{ position: 'absolute', top: 12, left: 14, right: 14, flexDirection: 'row', alignItems: 'center' }}>
        <View
          style={{
            flexDirection: 'row', alignItems: 'center', backgroundColor: tint(colors.bg, 0.88), paddingVertical: 7, paddingLeft: 7,
            paddingRight: 14, borderRadius: radii.pill, borderWidth: 1, borderColor: colors.border,
          }}
        >
          <View style={{ width: 28, height: 28, borderRadius: 9, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="pulse" size={17} color="#fff" />
          </View>
          <Text style={{ color: colors.text, fontWeight: '900', fontSize: 16, marginLeft: 9, letterSpacing: -0.3 }}>Lifeline</Text>
        </View>
        <View style={{ flex: 1 }} />
        <ConnectionPill />
      </View>

      {/* Locate */}
      <Pressable
        onPress={() => web.current && web.current.injectJavaScript('window.lifelineCenter(); true;')}
        style={{
          position: 'absolute', right: 14, top: 64, width: 46, height: 46, borderRadius: 16, backgroundColor: tint(colors.card, 0.95),
          alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border, ...shadow.card,
        }}
      >
        <Ionicons name="locate" size={21} color={colors.text} />
      </Pressable>

      {/* Area panel */}
      <View
        style={{
          position: 'absolute', left: 14, right: 14, bottom: TAB_SPACE - 4, backgroundColor: tint(colors.card, 0.97),
          borderRadius: radii.xl, padding: 16, borderWidth: 1, borderColor: colors.borderStrong, ...shadow.card,
        }}
      >
        <Pressable onPress={() => goTo && goTo('alerts')} style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <Text style={type.overline}>Your area</Text>
            <Text style={[type.heading, { fontSize: 19, marginTop: 3 }]}>{headline}</Text>
            <Text style={[type.small, { marginTop: 2 }]}>{sub}</Text>
          </View>
          {near.length ? <Ionicons name="chevron-forward" size={20} color={colors.muted} /> : null}
        </Pressable>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
          {Object.keys(TYPES).map((k) => (
            <StatusTile key={k} typeKey={k} {...stateOf(k)} />
          ))}
        </View>
        <ReportButton onPress={() => setSheet(true)} />
      </View>

      <ReportSheet visible={sheet} onClose={() => setSheet(false)} />
    </View>
  );
}
