import React, { useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';
import * as SMS from 'expo-sms';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../AppContext';
import { colors } from '../theme';
import { timeAgo } from '../geo';
import { ConnectionPill, Header, s } from '../components/ui';

export default function ChatScreen() {
  const { messages, sendMessage, user, online, peers, meshOn, smsContacts, location } = useApp();
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);

  async function send() {
    if (!text.trim()) return;
    setBusy(true);
    try {
      await sendMessage(text);
      setText('');
    } catch (e) {
      Alert.alert('Could not send', e.message);
    } finally {
      setBusy(false);
    }
  }

  async function sendSms() {
    if (!smsContacts.length) {
      Alert.alert('No SMS contacts yet', 'Add phone numbers in the Me tab so you can text them when there is no internet.');
      return;
    }
    if (!(await SMS.isAvailableAsync())) {
      Alert.alert('SMS not available', 'This phone cannot send text messages.');
      return;
    }
    const where = location ? `\nMy location: https://maps.google.com/?q=${location.lat.toFixed(5)},${location.lng.toFixed(5)}` : '';
    await SMS.sendSMSAsync(smsContacts, `${text.trim() || 'Lifeline check-in: I am OK.'}${where}`);
  }

  let banner;
  if (online) banner = { color: colors.ok, icon: 'wifi', text: 'Online. Messages reach everyone within 15 km and phones linked nearby.' };
  else if (meshOn && peers > 0) banner = { color: colors.mesh, icon: 'git-network', text: `No internet. Sending phone-to-phone through ${peers} nearby phone${peers > 1 ? 's' : ''}.` };
  else if (meshOn) banner = { color: colors.power, icon: 'search', text: 'No internet. Looking for nearby Lifeline phones… Messages will send when one is found or internet returns.' };
  else banner = { color: colors.accent, icon: 'cloud-offline', text: 'No internet. Use SMS to reach your contacts.' };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <Header title="Area chat" subtitle="Talk to people near you" right={<ConnectionPill />} />
      <View style={{ marginHorizontal: 16, padding: 10, borderRadius: 12, backgroundColor: banner.color + '22', flexDirection: 'row', alignItems: 'center' }}>
        <Ionicons name={banner.icon} size={18} color={banner.color} />
        <Text style={{ color: colors.text, marginLeft: 8, flex: 1, fontSize: 13 }}>{banner.text}</Text>
      </View>

      <FlatList
        inverted
        data={messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={{ padding: 16, gap: 8 }}
        ListEmptyComponent={<Text style={[s.empty, { transform: [{ scaleY: -1 }] }]}>No messages in your area yet. Say hello to your neighbours.</Text>}
        renderItem={({ item: m }) => {
          const mine = (m.from || m.uid) === user.uid;
          return (
            <View style={{ alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: '82%' }}>
              {!mine ? <Text style={{ color: colors.muted, fontSize: 12, marginBottom: 2, marginLeft: 4 }}>{m.name}</Text> : null}
              <View style={{ backgroundColor: mine ? colors.accent : colors.card, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 9 }}>
                <Text style={{ color: '#fff', fontSize: 15 }}>{m.text}</Text>
              </View>
              <Text style={{ color: colors.muted, fontSize: 11, marginTop: 2, alignSelf: mine ? 'flex-end' : 'flex-start', marginHorizontal: 4 }}>
                {timeAgo(m.createdAt)}{m.via === 'mesh' || m.hops ? ' · via nearby phones' : ''}
              </Text>
            </View>
          );
        }}
      />

      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 10, gap: 8, borderTopWidth: 1, borderTopColor: colors.border }}>
        <Pressable onPress={sendSms} style={{ padding: 10 }}>
          <Ionicons name="chatbox-ellipses" size={24} color={online ? colors.muted : colors.power} />
        </Pressable>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Message your area…"
          placeholderTextColor={colors.muted}
          style={[s.input, { flex: 1, paddingVertical: 10 }]}
          multiline
          maxLength={1000}
        />
        <Pressable
          onPress={send}
          disabled={busy || !text.trim()}
          style={{ backgroundColor: colors.accent, width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', opacity: busy || !text.trim() ? 0.5 : 1 }}
        >
          <Ionicons name="send" size={20} color="#fff" />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
