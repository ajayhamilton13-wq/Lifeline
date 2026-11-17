import React, { useMemo, useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../AppContext';
import { colors } from '../theme';
import { TYPES, distanceKm, formatDistance, timeAgo, NEARBY_KM } from '../geo';
import { Button, Card, ConnectionPill, Header, s } from '../components/ui';
import ReportSheet from '../components/ReportSheet';

export default function AlertsScreen() {
  const { clusters, location, user } = useApp();
  const [sheet, setSheet] = useState(null);

  const list = useMemo(() => {
    const withDist = clusters.map((c) => ({ ...c, dist: distanceKm(location, c) }));
    return withDist.filter((c) => !location || c.dist <= NEARBY_KM * 3).sort((a, b) => a.dist - b.dist);
  }, [clusters, location]);

  const summary = (type) => list.some((c) => c.type === type && c.dist <= 1);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Header title="Alerts" subtitle="Outages near you, updated live" right={<ConnectionPill />} />

      <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 16 }}>
        {Object.entries(TYPES).map(([key, t]) => {
          const out = summary(key);
          return (
            <Card key={key} style={{ flex: 1, alignItems: 'center', padding: 10, borderColor: out ? t.color : colors.border }}>
              <Ionicons name={t.icon} size={22} color={out ? t.color : colors.muted} />
              <Text style={{ color: colors.text, fontWeight: '700', fontSize: 12, marginTop: 4 }}>{t.short}</Text>
              <Text style={{ color: out ? t.color : colors.ok, fontSize: 12, fontWeight: '700' }}>{out ? 'Out nearby' : 'OK'}</Text>
            </Card>
          );
        })}
      </View>

      <FlatList
        data={list}
        keyExtractor={(c) => c.key}
        contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 100 }}
        ListEmptyComponent={
          <Text style={s.empty}>No outages reported near you. If your power or water goes, tap Report so neighbours know.</Text>
        }
        renderItem={({ item: c }) => {
          const t = TYPES[c.type];
          const mine = c.reporters.includes(user.uid);
          return (
            <Card style={{ borderLeftWidth: 4, borderLeftColor: t.color }}>
              <View style={s.row}>
                <Ionicons name={t.icon} size={22} color={t.color} />
                <Text style={[s.text, { fontWeight: '800', marginLeft: 8, flex: 1 }]}>{t.label}</Text>
                {c.confirmed ? (
                  <Text style={{ color: t.color, fontWeight: '800', fontSize: 12 }}>CONFIRMED</Text>
                ) : null}
              </View>
              <Text style={[s.muted, { marginTop: 6 }]}>
                {c.count} {c.count === 1 ? 'person' : 'people'} reported · {formatDistance(c.dist)} · {timeAgo(c.last)}
              </Text>
              {c.notes.map((n, i) => (
                <Text key={i} style={[s.text, { marginTop: 6, fontStyle: 'italic', fontSize: 14 }]}>"{n}"</Text>
              ))}
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                {!mine ? (
                  <Button
                    title="Me too"
                    icon="add-circle"
                    outline
                    color={t.color}
                    style={{ flex: 1, paddingVertical: 9 }}
                    onPress={() => setSheet({ type: c.type, status: 'out' })}
                  />
                ) : null}
                <Button
                  title="It's back"
                  icon="checkmark-circle"
                  outline
                  color={colors.ok}
                  style={{ flex: 1, paddingVertical: 9 }}
                  onPress={() => setSheet({ type: c.type, status: 'restored' })}
                />
              </View>
            </Card>
          );
        }}
      />

      <View style={{ position: 'absolute', left: 16, right: 16, bottom: 16 }}>
        <Button title="Report outage" icon="megaphone" onPress={() => setSheet({ type: 'power', status: 'out' })} />
      </View>
      <ReportSheet
        visible={!!sheet}
        presetType={sheet?.type}
        presetStatus={sheet?.status}
        onClose={() => setSheet(null)}
      />
    </View>
  );
}
