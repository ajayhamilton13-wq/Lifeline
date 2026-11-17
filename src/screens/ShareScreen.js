import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../AppContext';
import { colors, radii, tint, type, TAB_SPACE } from '../theme';
import { distanceKm, formatDistance, NEARBY_KM } from '../geo';
import { saveResource, removeResource } from '../data';
import { Avatar, Button, Card, Chip, EmptyState, Field, IconBadge, SectionHeader, TopBar } from '../components/ui';

const ITEMS = [
  { key: 'Drinking water', icon: 'water' },
  { key: 'Food', icon: 'fast-food' },
  { key: 'Generator power', icon: 'flash' },
  { key: 'Phone charging', icon: 'battery-charging' },
  { key: 'First aid', icon: 'medkit' },
  { key: 'Shelter / space', icon: 'home' },
  { key: 'Transport', icon: 'car' },
  { key: 'Cooking gas', icon: 'flame' },
  { key: 'Tools', icon: 'construct' },
  { key: 'Water storage', icon: 'beaker' },
];
const iconFor = (k) => (ITEMS.find((i) => i.key === k) || { icon: 'cube' }).icon;

export default function ShareScreen() {
  const { resources, user, name, location, online } = useApp();
  const mine = resources.find((r) => r.id === user.uid);
  const [editing, setEditing] = useState(false);
  const [items, setItems] = useState([]);
  const [note, setNote] = useState('');
  const [contact, setContact] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (mine) {
      setItems(mine.items || []);
      setNote(mine.note || '');
      setContact(mine.contact || '');
    }
  }, [mine?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const nearby = useMemo(
    () =>
      resources
        .filter((r) => r.id !== user.uid)
        .map((r) => ({ ...r, dist: distanceKm(location, r) }))
        .filter((r) => !location || r.dist <= NEARBY_KM * 4)
        .sort((a, b) => a.dist - b.dist),
    [resources, location, user.uid],
  );

  const toggle = (k) => setItems((l) => (l.includes(k) ? l.filter((x) => x !== k) : [...l, k]));

  async function save() {
    if (!items.length) return Alert.alert('Pick something', 'Choose at least one thing you can share.');
    if (!location) return Alert.alert('Location needed', 'Waiting for your location.');
    if (!online) return Alert.alert('No internet', 'Publishing a listing needs internet. Try again when you are back online.');
    setBusy(true);
    try {
      await saveResource(user.uid, {
        name, items, note: note.trim().slice(0, 280), contact: contact.trim().slice(0, 40), lat: location.lat, lng: location.lng,
      });
      setEditing(false);
    } catch (e) {
      Alert.alert('Could not save', e.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    try {
      await removeResource(user.uid);
      setItems([]);
      setNote('');
      setContact('');
    } catch (e) {
      Alert.alert('Could not remove', e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ paddingBottom: TAB_SPACE + 20 }} keyboardShouldPersistTaps="handled">
      <TopBar overline="Community" title="Share" />
      <View style={{ paddingHorizontal: 20 }}>
        {editing ? (
          <Card>
            <Text style={type.heading}>What can you offer?</Text>
            <Text style={[type.small, { marginTop: 4 }]}>Pick everything you could share if things go down.</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
              {ITEMS.map((it) => (
                <Chip key={it.key} label={it.key} icon={it.icon} color={colors.share} active={items.includes(it.key)} onPress={() => toggle(it.key)} />
              ))}
            </View>
            <Field label="Details" icon="information-circle-outline" value={note} onChangeText={setNote} placeholder="e.g. 2 tanks of water, come by the gate" maxLength={280} style={{ marginTop: 18 }} />
            <Field label="Contact number (shown to others)" icon="call-outline" value={contact} onChangeText={setContact} placeholder="876-555-0123" keyboardType="phone-pad" maxLength={40} style={{ marginTop: 14 }} />
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12 }}>
              <Ionicons name="location-outline" size={14} color={colors.faint} />
              <Text style={[type.small, { fontSize: 12, marginLeft: 6, flex: 1 }]}>Your approximate location shows on the map so neighbours can find you.</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
              <Button title="Cancel" variant="secondary" color={colors.muted} style={{ flex: 1 }} onPress={() => setEditing(false)} />
              <Button title="Publish" icon="checkmark" color={colors.share} style={{ flex: 1.4 }} onPress={save} loading={busy} />
            </View>
          </Card>
        ) : mine ? (
          <Card accent={colors.share}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <IconBadge icon="hand-left" color={colors.share} size={44} filled />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={type.heading}>You're sharing</Text>
                <Text style={type.small}>Visible to neighbours on the map</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 14 }}>
              {(mine.items || []).map((k) => (
                <View key={k} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: radii.pill, backgroundColor: tint(colors.share, 0.14) }}>
                  <Ionicons name={iconFor(k)} size={13} color={colors.share} />
                  <Text style={{ color: colors.text, fontSize: 12, fontWeight: '700', marginLeft: 5 }}>{k}</Text>
                </View>
              ))}
            </View>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
              <Button title="Edit" icon="create-outline" variant="secondary" color={colors.share} size="sm" style={{ flex: 1 }} onPress={() => setEditing(true)} />
              <Button title="Stop sharing" variant="secondary" color={colors.accent} size="sm" style={{ flex: 1 }} onPress={remove} loading={busy} />
            </View>
          </Card>
        ) : (
          <Card accent={colors.share}>
            <IconBadge icon="people" color={colors.share} size={48} />
            <Text style={[type.heading, { marginTop: 14, fontSize: 19 }]}>Be someone's lifeline</Text>
            <Text style={[type.body, { marginTop: 6 }]}>
              Have a generator, a full water tank or a car? Let people near you know what you could share in an emergency.
            </Text>
            <Button title="Offer resources" icon="hand-left" color={colors.share} style={{ marginTop: 16 }} onPress={() => setEditing(true)} />
          </Card>
        )}

        <SectionHeader label={`Offered near you${nearby.length ? ` · ${nearby.length}` : ''}`} />
        {nearby.length === 0 ? (
          <Card>
            <EmptyState icon="hand-left" title="No offers nearby yet" body="When neighbours list what they can share, it shows up here and on the map." />
          </Card>
        ) : (
          nearby.map((r) => (
            <Card key={r.id} style={{ marginBottom: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Avatar name={r.name} size={42} />
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text style={type.heading}>{r.name}</Text>
                  <Text style={type.small}>{formatDistance(r.dist)}</Text>
                </View>
                {r.contact ? (
                  <Pressable
                    onPress={() => Linking.openURL(`tel:${r.contact.replace(/[^0-9+]/g, '')}`)}
                    style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: tint(colors.share, 0.16), alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Ionicons name="call" size={19} color={colors.share} />
                  </Pressable>
                ) : null}
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
                {(r.items || []).map((k) => (
                  <View key={k} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: radii.pill, backgroundColor: colors.cardAlt }}>
                    <Ionicons name={iconFor(k)} size={13} color={colors.share} />
                    <Text style={{ color: colors.textSoft, fontSize: 12, fontWeight: '700', marginLeft: 5 }}>{k}</Text>
                  </View>
                ))}
              </View>
              {r.note ? <Text style={[type.body, { marginTop: 10, fontSize: 14 }]}>{r.note}</Text> : null}
            </Card>
          ))
        )}
      </View>
    </ScrollView>
  );
}
