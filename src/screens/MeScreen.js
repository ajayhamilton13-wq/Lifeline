import React, { useState } from 'react';
import { Alert, ScrollView, Text, TextInput, View } from 'react-native';
import { updateProfile } from 'firebase/auth';
import { useApp, signOutUser } from '../AppContext';
import { auth } from '../firebase';
import { saveUser } from '../data';
import { colors } from '../theme';
import { Button, Card, Header, s } from '../components/ui';

export default function MeScreen() {
  const { user, name, setName, smsContacts, setSmsContacts, meshAvailable, meshOn, peers } = useApp();
  const [draftName, setDraftName] = useState(name);
  const [contacts, setContacts] = useState(smsContacts.join(', '));

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

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16, paddingTop: 0, gap: 14, paddingBottom: 40 }}>
      <Header title="Me" subtitle={user.email} />

      <Card>
        <Text style={[s.text, { fontWeight: '800' }]}>Your name</Text>
        <Text style={s.muted}>Shown on your reports, messages and shared resources.</Text>
        <TextInput value={draftName} onChangeText={setDraftName} style={[s.input, { marginTop: 10 }]} maxLength={40} />
        <Button title="Save name" onPress={saveName} style={{ marginTop: 10 }} />
      </Card>

      <Card>
        <Text style={[s.text, { fontWeight: '800' }]}>SMS contacts</Text>
        <Text style={s.muted}>
          When there's no internet, the SMS button in Chat texts these numbers with your message and location. It uses normal phone credit.
        </Text>
        <TextInput
          value={contacts}
          onChangeText={setContacts}
          placeholder="876-555-0123, 876-555-0456"
          placeholderTextColor={colors.muted}
          keyboardType="phone-pad"
          style={[s.input, { marginTop: 10 }]}
        />
        <Button title="Save contacts" onPress={saveContacts} style={{ marginTop: 10 }} />
      </Card>

      <Card>
        <Text style={[s.text, { fontWeight: '800' }]}>Offline messaging</Text>
        <Text style={[s.muted, { marginTop: 4 }]}>
          {!meshAvailable
            ? 'Not available in this build. Install the Lifeline APK to use it.'
            : meshOn
            ? `On. Linked to ${peers} phone${peers === 1 ? '' : 's'} nearby. Keep Bluetooth and location on so neighbours can reach you without Wi-Fi.`
            : 'Off. Allow the Nearby devices permission and turn on Bluetooth, then reopen the app.'}
        </Text>
      </Card>

      <Button title="Sign out" outline color={colors.accent} onPress={signOutUser} />
    </ScrollView>
  );
}
