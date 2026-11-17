import React, { useEffect, useRef, useState } from 'react';
import { Animated, Keyboard, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, shadow, tint } from './theme';
import { useApp } from './AppContext';
import { distanceKm, NEARBY_KM } from './geo';
import MapScreen from './screens/MapScreen';
import AlertsScreen from './screens/AlertsScreen';
import ChatScreen from './screens/ChatScreen';
import ShareScreen from './screens/ShareScreen';
import MeScreen from './screens/MeScreen';

const TABS = [
  { key: 'map', label: 'Map', icon: 'map', Screen: MapScreen },
  { key: 'alerts', label: 'Alerts', icon: 'notifications', Screen: AlertsScreen },
  { key: 'chat', label: 'Chat', icon: 'chatbubbles', Screen: ChatScreen },
  { key: 'share', label: 'Share', icon: 'hand-left', Screen: ShareScreen },
  { key: 'me', label: 'Me', icon: 'person', Screen: MeScreen },
];

function TabButton({ tab, active, badge, onPress }) {
  const anim = useRef(new Animated.Value(active ? 1 : 0)).current;
  useEffect(() => {
    Animated.spring(anim, { toValue: active ? 1 : 0, useNativeDriver: false, friction: 8, tension: 90 }).start();
  }, [active, anim]);
  const bg = anim.interpolate({ inputRange: [0, 1], outputRange: ['rgba(255,71,87,0)', tint(colors.accent, 0.16)] });
  return (
    <Pressable onPress={onPress} style={{ flex: 1, alignItems: 'center' }} hitSlop={6}>
      <Animated.View style={{ alignItems: 'center', paddingVertical: 8, paddingHorizontal: 14, borderRadius: radii.lg, backgroundColor: bg }}>
        <View>
          <Ionicons name={active ? tab.icon : `${tab.icon}-outline`} size={22} color={active ? colors.accent : colors.muted} />
          {badge > 0 ? (
            <View
              style={{
                position: 'absolute', top: -5, right: -11, minWidth: 18, height: 18, borderRadius: 9, paddingHorizontal: 4,
                backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.card,
              }}
            >
              <Text style={{ color: '#fff', fontSize: 10, fontWeight: '900' }}>{badge}</Text>
            </View>
          ) : null}
        </View>
        <Text style={{ color: active ? colors.text : colors.muted, fontSize: 10.5, marginTop: 3, fontWeight: active ? '800' : '600' }}>
          {tab.label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

export default function MainTabs() {
  const [tab, setTab] = useState('map');
  const [keyboard, setKeyboard] = useState(false);

  // Hide the floating tab bar while typing so it never sits on top of the keyboard.
  useEffect(() => {
    const a = Keyboard.addListener('keyboardDidShow', () => setKeyboard(true));
    const b = Keyboard.addListener('keyboardDidHide', () => setKeyboard(false));
    return () => {
      a.remove();
      b.remove();
    };
  }, []);
  const { clusters, location } = useApp();
  const alertCount = location ? clusters.filter((c) => distanceKm(location, c) <= NEARBY_KM).length : 0;
  const Active = TABS.find((t) => t.key === tab).Screen;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Active goTo={setTab} keyboard={keyboard} />
      {keyboard ? null : <View
        style={{
          position: 'absolute', left: 14, right: 14, bottom: 14, flexDirection: 'row', paddingVertical: 8, paddingHorizontal: 4,
          backgroundColor: tint(colors.card, 0.97), borderRadius: radii.xl, borderWidth: 1, borderColor: colors.borderStrong,
          ...shadow.card,
        }}
      >
        {TABS.map((t) => (
          <TabButton key={t.key} tab={t} active={t.key === tab} badge={t.key === 'alerts' ? alertCount : 0} onPress={() => setTab(t.key)} />
        ))}
      </View>}
    </View>
  );
}
