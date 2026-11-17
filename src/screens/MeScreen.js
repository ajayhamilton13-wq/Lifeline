import React, { useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { updateProfile } from 'firebase/auth';
import { useApp, signOutUser } from '../AppContext';
import { auth } from '../firebase';
import { saveUser } from '../data';
import { useUpdates } from '../updater';
import { colors, tint, type, TAB_SPACE } from '../theme';
import { Avatar, Button, Card, Field, IconBadge, PulseDot, SectionHeader } from '../components/ui';

function Row({ icon, color, title, value, live }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10 }}>
      <IconBadge icon={icon} color={color} size={36} />
      <Text style={[type.body, { flex: 1, marginLeft: 12, color: colors.text, fontWeight: '700' }]}>{title}</Text>
      {live ? <PulseDot color={color} size={6} /> : null}
      <Text style={{ color, fontWeight: '800', fontSize: 13, marginLeft: 4 }}>{value}</Text>
    </View>
  );
}

export default function MeScreen() {
  const { user, name, setName, smsContacts, setSmsContacts, meshAvailable, meshOn, peers, online, location } = useApp();
  const [draftName, setDraftName] = useState(name);
  const [contacts, setContacts] = useState(smsContacts.join(', '));
  const updates = useUpdates();
  const [updateMsg, setUpdateMsg] = useState('');

  async function checkUpdates() {
    if (!updates) return;
    if (updates.available) return updates.reopen();
    const r = await updates.check({ manual: true });
    if (!r) setUpdateMsg("You're on the latest version");
    else if (r.error) setUpdateMsg(r.error);
    else setUpdateMsg('');
  }

  async function saveName() {
    const n = draftName.trim().slice(0, 40);
    if (!n) return;
    try {
      await updateProfile(auth.currentUser, { displayName: n });
      await saveUser(user.uid, n);
      setName(n);
      Alert.alert('Saved', 'Your name is updated.');
    } catch (e) {
      Alert.alert('Could not save', e.message);
    }
  }

  async function saveContacts() {
    const list = contacts.split(/[,\n]/).map((x) => x.trim()).filter(Boolean).slice(0, 10);
    await setSmsContacts(list);
    Alert.alert('Saved', `${list.length} SMS contact${list.length === 1 ? '' : 's'} saved on this phone.`);
  }

  const meshValue = !meshAvailable ? 'Unavailable' : meshOn ? `${peers} linked` : 'Off';

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 20, paddingBottom: TAB_SPACE + 20 }} keyboardShouldPersistTaps="handled">
      {/* Profile header */}
      <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 8 }}>
        <View style={{ padding: 4, borderRadius: 50, borderWidth: 2, borderColor: tint(colors.accent, 0.5) }}>
          <Avatar name={name} size={80} />
        </View>
        <Text style={[type.title, { marginTop: 12 }]}>{name}</Text>
        <Text style={type.small}>{user.email}</Text>
      </View>

      <SectionHeader label="Status" />
      <Card style={{ paddingVertical: 6 }}>
        <Row icon={online ? 'globe' : 'cloud-offline'} color={online ? colors.ok : colors.accent} title="Internet" value={online ? 'Connected' : 'Offline'} live />
        <View style={{ height: 1, backgroundColor: colors.border }} />
        <Row icon="git-network" color={meshOn ? colors.mesh : colors.muted} title="Offline mesh" value={meshValue} live={meshOn} />
        <View style={{ height: 1, backgroundColor: colors.border }} />
        <Row icon="location" color={location ? colors.water : colors.muted} title="Location" value={location ? 'Found' : 'Searching'} />
      </Card>
      {meshAvailable && !meshOn ? (
        <Text style={[type.small, { marginTop: 8, marginHorizontal: 4 }]}>
          To message without internet, allow "Nearby devices", turn on Bluetooth, then reopen Lifeline.
        </Text>
      ) : null}

      <SectionHeader label="Profile" />
      <Card>
        <Field label="Display name" icon="person-outline" value={draftName} onChangeText={setDraftName} maxLength={40} />
        <Text style={[type.small, { marginTop: 8 }]}>Shown on your reports, messages and offers.</Text>
        <Button title="Save name" size="sm" variant="secondary" color={colors.text} onPress={saveName} style={{ marginTop: 12 }} />
      </Card>

      <SectionHeader label="Emergency SMS" />
      <Card accent={colors.power}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="chatbox-ellipses" size={18} color={colors.power} />
          <Text style={[type.heading, { marginLeft: 8, fontSize: 15 }]}>When there's no internet</Text>
        </View>
        <Text style={[type.small, { marginTop: 6 }]}>
          The SMS button in Chat texts these people your message and location, using normal phone credit.
        </Text>
        <Field
          icon="call-outline"
          value={contacts}
          onChangeText={setContacts}
          placeholder="876-555-0123, 876-555-0456"
          keyboardType="phone-pad"
          style={{ marginTop: 14 }}
        />
        <Button title="Save contacts" size="sm" variant="secondary" color={colors.power} onPress={saveContacts} style={{ marginTop: 12 }} />
      </Card>

      <SectionHeader label="App" />
      <Card accent={updates?.available ? colors.ok : undefined}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <IconBadge icon={updates?.available ? 'rocket' : 'checkmark-done'} color={updates?.available ? colors.ok : colors.muted} size={40} filled={!!updates?.available} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={type.heading}>Lifeline {updates?.currentVersion}</Text>
            <Text style={type.small}>
              {updates?.available
                ? `Version ${updates.available.version} is ready to install`
                : updateMsg || 'Updates download straight from GitHub'}
            </Text>
          </View>
        </View>
        <Button
          title={updates?.available ? 'Install update' : 'Check for updates'}
          icon={updates?.available ? 'download-outline' : 'refresh'}
          size="sm"
          variant={updates?.available ? 'primary' : 'secondary'}
          color={updates?.available ? colors.ok : colors.text}
          loading={updates?.checking}
          onPress={checkUpdates}
          style={{ marginTop: 14 }}
        />
      </Card>

      <Button title="Sign out" icon="log-out-outline" variant="ghost" color={colors.accent} onPress={signOutUser} style={{ marginTop: 24 }} />
    </ScrollView>
  );
}
