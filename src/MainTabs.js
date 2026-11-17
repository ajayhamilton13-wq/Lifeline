import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from './theme';
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

export default function MainTabs() {
  const [tab, setTab] = useState('map');
  const { clusters, location } = useApp();
  const alertCount = location ? clusters.filter((c) => distanceKm(location, c) <= NEARBY_KM).length : 0;
  const Active = TABS.find((t) => t.key === tab).Screen;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ flex: 1 }}>
        <Active />
      </View>
      <View style={{ flexDirection: 'row', backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.border, paddingBottom: 6 }}>
        {TABS.map((t) => {
          const on = t.key === tab;
          return (
            <Pressable key={t.key} onPress={() => setTab(t.key)} style={{ flex: 1, alignItems: 'center', paddingVertical: 8 }}>
              <View>
                <Ionicons name={on ? t.icon : `${t.icon}-outline`} size={24} color={on ? colors.accent : colors.muted} />
                {t.key === 'alerts' && alertCount > 0 ? (
                  <View style={{ position: 'absolute', top: -4, right: -10, backgroundColor: colors.accent, borderRadius: 9, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 }}>
                    <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800' }}>{alertCount}</Text>
                  </View>
                ) : null}
              </View>
              <Text style={{ color: on ? colors.accent : colors.muted, fontSize: 11, marginTop: 2, fontWeight: on ? '700' : '500' }}>{t.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
