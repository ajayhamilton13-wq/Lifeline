import React, { useMemo, useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../AppContext';
import { colors, radii, tint, type, TAB_SPACE } from '../theme';
import { TYPES, distanceKm, formatDistance, timeAgo, NEARBY_KM, CONFIRM_COUNT } from '../geo';
import { Button, Card, ConnectionPill, EmptyState, IconBadge, SectionHeader, TopBar } from '../components/ui';
import ReportSheet from '../components/ReportSheet';

function Meter({ count, color }) {
  // Progress toward "confirmed" (CONFIRM_COUNT people).
  return (
    <View style={{ flexDirection: 'row', gap: 4, marginTop: 12 }}>
      {Array.from({ length: CONFIRM_COUNT }).map((_, i) => (
        <View key={i} style={{ flex: 1, height: 5, borderRadius: 3, backgroundColor: i < count ? color : colors.cardAlt }} />
      ))}
    </View>
  );
}

function OutageCard({ c, mine, onSame, onBack }) {
  const t = TYPES[c.type];
  return (
    <Card style={{ padding: 0, overflow: 'hidden' }}>
      <View style={{ height: 3, backgroundColor: t.color, opacity: c.confirmed ? 1 : 0.5 }} />
      <View style={{ padding: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <IconBadge icon={t.icon} color={t.color} size={44} filled={c.confirmed} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={type.heading}>{t.label}</Text>
            <Text style={[type.small, { marginTop: 2 }]}>
              {formatDistance(c.dist)} · {timeAgo(c.last)}
            </Text>
          </View>
          <View
            style={{
              paddingHorizontal: 9, paddingVertical: 4, borderRadius: radii.pill,
              backgroundColor: c.confirmed ? t.color : 'transparent', borderWidth: 1, borderColor: t.color,
            }}
          >
            <Text style={{ color: c.confirmed ? colors.bg : t.color, fontSize: 10, fontWeight: '900', letterSpacing: 0.8 }}>
              {c.confirmed ? 'CONFIRMED' : 'REPORTED'}
            </Text>
          </View>
        </View>

        <Meter count={Math.min(c.count, CONFIRM_COUNT)} color={t.color} />
        <Text style={[type.small, { marginTop: 6, fontSize: 12 }]}>
          {c.count} {c.count === 1 ? 'person has' : 'people have'} reported this
          {c.confirmed ? '' : ` · ${CONFIRM_COUNT - c.count} more to confirm`}
        </Text>

        {c.notes.map((n, i) => (
          <View key={i} style={{ flexDirection: 'row', marginTop: 10 }}>
            <View style={{ width: 2, borderRadius: 1, backgroundColor: colors.borderStrong, marginRight: 10 }} />
            <Text style={[type.body, { flex: 1, fontStyle: 'italic', fontSize: 14 }]}>{n}</Text>
          </View>
        ))}

        <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
          {!mine ? (
            <Button title="Me too" icon="add" variant="secondary" color={t.color} size="sm" style={{ flex: 1 }} onPress={onSame} />
          ) : null}
          <Button title="It's back" icon="checkmark" variant="secondary" color={colors.ok} size="sm" style={{ flex: 1 }} onPress={onBack} />
        </View>
      </View>
    </Card>
  );
}

export default function AlertsScreen() {
  const { clusters, location, user } = useApp();
  const [sheet, setSheet] = useState(null);

  const list = useMemo(() => {
    const withDist = clusters.map((c) => ({ ...c, dist: distanceKm(location, c) }));
    return withDist.filter((c) => !location || c.dist <= NEARBY_KM * 3).sort((a, b) => a.dist - b.dist);
  }, [clusters, location]);

  const nearCount = list.filter((c) => c.dist <= NEARBY_KM).length;
  const confirmedCount = list.filter((c) => c.confirmed).length;

  const header = (
    <View>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Card style={{ flex: 1 }}>
          <Text style={type.overline}>Within 5 km</Text>
          <Text style={[type.number, { marginTop: 6, color: nearCount ? colors.accent : colors.ok }]}>{nearCount}</Text>
          <Text style={type.small}>active {nearCount === 1 ? 'outage' : 'outages'}</Text>
        </Card>
        <Card style={{ flex: 1 }}>
          <Text style={type.overline}>Confirmed</Text>
          <Text style={[type.number, { marginTop: 6 }]}>{confirmedCount}</Text>
          <Text style={type.small}>by 3+ people</Text>
        </Card>
      </View>
      {list.length ? <SectionHeader label="Nearest first" /> : null}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <TopBar overline="Live" title="Alerts" right={<ConnectionPill />} />
      <FlatList
        data={list}
        keyExtractor={(c) => c.key}
        ListHeaderComponent={header}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: TAB_SPACE + 84, gap: 12 }}
        ListEmptyComponent={
          <EmptyState
            icon="shield-checkmark"
            color={colors.ok}
            title="Nothing reported near you"
            body="If your power or water goes out, report it so your neighbours know right away."
          />
        }
        renderItem={({ item: c }) => (
          <OutageCard
            c={c}
            mine={c.reporters.includes(user.uid)}
            onSame={() => setSheet({ type: c.type, status: 'out' })}
            onBack={() => setSheet({ type: c.type, status: 'restored' })}
          />
        )}
      />
      <View style={{ position: 'absolute', left: 20, right: 20, bottom: TAB_SPACE + 4 }}>
        <Button title="Report an outage" icon="megaphone" onPress={() => setSheet({ type: 'power', status: 'out' })} />
      </View>
      <ReportSheet visible={!!sheet} presetType={sheet?.type} presetStatus={sheet?.status} onClose={() => setSheet(null)} />
    </View>
  );
}
