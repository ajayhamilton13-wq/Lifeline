import React, { useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';
import * as SMS from 'expo-sms';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../AppContext';
import { colors, radii, tint, type, TAB_SPACE } from '../theme';
import { timeAgo } from '../geo';
import { Avatar, ConnectionPill, EmptyState, TopBar } from '../components/ui';

function Bubble({ m, mine, showName }) {
  const viaMesh = m.via === 'mesh';
  return (
    <View style={{ flexDirection: 'row', justifyContent: mine ? 'flex-end' : 'flex-start', alignItems: 'flex-end', marginTop: showName ? 12 : 4 }}>
      {!mine ? <View style={{ width: 34, marginRight: 8 }}>{showName ? <Avatar name={m.name} size={32} /> : null}</View> : null}
      <View style={{ maxWidth: '78%' }}>
        {!mine && showName ? <Text style={{ color: colors.muted, fontSize: 12, fontWeight: '700', marginBottom: 4, marginLeft: 4 }}>{m.name}</Text> : null}
        <View
          style={{
            backgroundColor: mine ? colors.accent : colors.card,
            borderRadius: 20, borderBottomRightRadius: mine ? 6 : 20, borderBottomLeftRadius: mine ? 20 : 6,
            paddingHorizontal: 14, paddingVertical: 10, borderWidth: mine ? 0 : 1, borderColor: colors.border,
          }}
        >
          <Text style={{ color: '#fff', fontSize: 15, lineHeight: 21 }}>{m.text}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', alignSelf: mine ? 'flex-end' : 'flex-start', marginTop: 3, marginHorizontal: 6 }}>
          {viaMesh ? <Ionicons name="git-network" size={11} color={colors.mesh} style={{ marginRight: 4 }} /> : null}
          <Text style={{ color: viaMesh ? colors.mesh : colors.faint, fontSize: 11, fontWeight: '600' }}>
            {viaMesh ? 'via nearby phones · ' : ''}{timeAgo(m.createdAt)}
          </Text>
        </View>
      </View>
    </View>
  );
}

export default function ChatScreen({ keyboard }) {
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

  let mode;
  if (online) mode = { color: colors.ok, icon: 'globe-outline', title: 'Online', body: 'Reaching everyone within 15 km' };
  else if (meshOn && peers > 0) mode = { color: colors.mesh, icon: 'git-network', title: 'Offline mesh', body: `Hopping through ${peers} nearby phone${peers > 1 ? 's' : ''}` };
  else if (meshOn) mode = { color: colors.power, icon: 'radio-outline', title: 'Searching', body: 'No internet. Looking for nearby Lifeline phones' };
  else mode = { color: colors.accent, icon: 'cloud-offline-outline', title: 'Offline', body: 'Use the SMS button to reach your contacts' };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <TopBar overline="Within 15 km" title="Area chat" right={<ConnectionPill />} />

      <View
        style={{
          marginHorizontal: 20, flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: radii.md,
          backgroundColor: tint(mode.color, 0.09), borderWidth: 1, borderColor: tint(mode.color, 0.3),
        }}
      >
        <Ionicons name={mode.icon} size={18} color={mode.color} />
        <Text style={{ color: mode.color, fontWeight: '900', marginLeft: 8, fontSize: 13 }}>{mode.title}</Text>
        <Text style={[type.small, { marginLeft: 8, flex: 1 }]} numberOfLines={1}>{mode.body}</Text>
      </View>

      <FlatList
        inverted
        data={messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12, flexGrow: 1 }}
        ListEmptyComponent={
          <View style={{ transform: [{ scaleY: -1 }], flex: 1, justifyContent: 'center' }}>
            <EmptyState icon="chatbubbles" color={colors.water} title="Quiet around here" body="Say hello to your neighbours. Messages still get through phone to phone when the internet is down." />
          </View>
        }
        renderItem={({ item: m, index }) => {
          const mine = (m.from || m.uid) === user.uid;
          const older = messages[index + 1];
          const showName = !older || (older.from || older.uid) !== (m.from || m.uid);
          return <Bubble m={m} mine={mine} showName={showName} />;
        }}
      />

      <View style={{ flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 14, paddingTop: 8, paddingBottom: keyboard ? 10 : TAB_SPACE, gap: 8 }}>
        <Pressable
          onPress={sendSms}
          style={{
            width: 46, height: 46, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
            backgroundColor: online ? colors.card : tint(colors.power, 0.16), borderWidth: 1, borderColor: online ? colors.border : colors.power,
          }}
        >
          <Ionicons name="chatbox-ellipses-outline" size={21} color={online ? colors.muted : colors.power} />
        </Pressable>
        <View style={{ flex: 1, backgroundColor: colors.card, borderRadius: 22, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 16 }}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Message your area…"
            placeholderTextColor={colors.faint}
            selectionColor={colors.accent}
            style={{ color: colors.text, fontSize: 15, paddingVertical: 12, maxHeight: 110 }}
            multiline
            maxLength={1000}
          />
        </View>
        <Pressable
          onPress={send}
          disabled={busy || !text.trim()}
          style={{
            width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center',
            backgroundColor: text.trim() ? colors.accent : colors.cardAlt,
          }}
        >
          <Ionicons name="arrow-up" size={22} color={text.trim() ? '#fff' : colors.faint} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
