import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../AppContext';
import { colors } from '../theme';
import { distanceKm, formatDistance, NEARBY_KM } from '../geo';
import { saveResource, removeResource } from '../data';
import { Button, Card, Header, s } from '../components/ui';

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
    if (!online) return Alert.alert('No internet', 'Sharing a listing needs internet. Try again when you are back online.');
    setBusy(true);
    try {
      await saveResource(user.uid, {
        name, items, note: note.trim().slice(0, 280), contact: contact.trim().slice(0, 40),
        lat: location.lat, lng: location.lng,
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
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ paddingBottom: 40 }}>
      <Header title="Share" subtitle="What neighbours can offer in an emergency" />

      <View style={{ paddingHorizontal: 16 }}>
        {!editing ? (
          <Card>
            <Text style={[s.text, { fontWeight: '800' }]}>{mine ? 'You are sharing' : 'Can you help others?'}</Text>
            {mine ? (
              <Text style={[s.muted, { marginTop: 6 }]}>{(mine.items || []).join(' · ')}</Text>
            ) : (
              <Text style={[s.muted, { marginTop: 6 }]}>
                Let people near you know what you could share if things go down: water, charging, a generator, transport.
              </Text>
            )}
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
              <Button title={mine ? 'Edit' : 'Offer resources'} icon="hand-left" color={colors.ok} style={{ flex: 1 }} onPress={() => setEditing(true)} />
              {mine ? <Button title="Stop" outline color={colors.accent} style={{ flex: 1 }} onPress={remove} loading={busy} /> : null}
            </View>
          </Card>
        ) : (
          <Card>
            <Text style={[s.text, { fontWeight: '800' }]}>I can share…</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
              {ITEMS.map((it) => {
                const on = items.includes(it.key);
                return (
                  <Pressable
                    key={it.key}
                    onPress={() => toggle(it.key)}
                    style={{
                      flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
                      backgroundColor: on ? colors.ok + '33' : colors.cardAlt, borderWidth: 1.5, borderColor: on ? colors.ok : 'transparent',
                    }}
                  >
                    <Ionicons name={it.icon} size={15} color={on ? colors.ok : colors.muted} />
                    <Text style={{ color: colors.text, marginLeft: 6, fontSize: 13 }}>{it.key}</Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={s.label}>Details (optional)</Text>
            <TextInput value={note} onChangeText={setNote} placeholder="e.g. 2 tanks of water, come by the gate" placeholderTextColor={colors.muted} style={s.input} maxLength={280} />
            <Text style={s.label}>Contact number (optional, shown to others)</Text>
            <TextInput value={contact} onChangeText={setContact} placeholder="876-555-0123" placeholderTextColor={colors.muted} keyboardType="phone-pad" style={s.input} maxLength={40} />
            <Text style={[s.muted, { marginTop: 8, fontSize: 12 }]}>Your approximate location is shown on the map so people nearby can find you.</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
              <Button title="Cancel" outline color={colors.muted} style={{ flex: 1 }} onPress={() => setEditing(false)} />
              <Button title="Save" color={colors.ok} style={{ flex: 1 }} onPress={save} loading={busy} />
            </View>
          </Card>
        )}

        <Text style={[s.label, { fontSize: 15, color: colors.text, marginTop: 22 }]}>Offered near you</Text>
        {nearby.length === 0 ? (
          <Text style={[s.muted, { marginTop: 6 }]}>Nobody nearby has listed anything yet.</Text>
        ) : (
          nearby.map((r) => (
            <Card key={r.id} style={{ marginTop: 10 }}>
              <View style={s.row}>
                <Ionicons name="person-circle" size={26} color={colors.ok} />
                <View style={{ marginLeft: 8, flex: 1 }}>
                  <Text style={[s.text, { fontWeight: '800' }]}>{r.name}</Text>
                  <Text style={s.muted}>{formatDistance(r.dist)}</Text>
                </View>
                {r.contact ? (
                  <Pressable onPress={() => Linking.openURL(`tel:${r.contact.replace(/[^0-9+]/g, '')}`)} style={{ padding: 8 }}>
                    <Ionicons name="call" size={22} color={colors.ok} />
                  </Pressable>
                ) : null}
              </View>
              <Text style={[s.text, { marginTop: 8 }]}>{(r.items || []).join(' · ')}</Text>
              {r.note ? <Text style={[s.muted, { marginTop: 4 }]}>{r.note}</Text> : null}
            </Card>
          ))
        )}
      </View>
    </ScrollView>
  );
}
