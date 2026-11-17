import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';
import { TYPES } from '../geo';
import { useApp } from '../AppContext';
import { Button, s } from './ui';

/** Bottom sheet for reporting an outage (or that service is back). */
export default function ReportSheet({ visible, onClose, presetType, presetStatus = 'out' }) {
  const { submitReport, location } = useApp();
  const [type, setType] = useState(presetType || 'power');
  const [status, setStatus] = useState(presetStatus);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  React.useEffect(() => {
    if (visible) {
      setType(presetType || 'power');
      setStatus(presetStatus);
      setNote('');
    }
  }, [visible, presetType, presetStatus]);

  async function send() {
    setBusy(true);
    try {
      const res = await submitReport({ type, status, note });
      onClose();
      if (!res.cloud) {
        Alert.alert(
          'Saved offline',
          res.direct > 0
            ? `Sent to ${res.direct} nearby phone${res.direct > 1 ? 's' : ''}. It will upload when you're back online.`
            : "No internet and no phones nearby right now. It will send automatically when you're back online.",
        );
      }
    } catch (e) {
      Alert.alert('Could not send', e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        <View style={{ backgroundColor: colors.card, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 18, paddingBottom: 30 }}>
          <Text style={[s.title, { fontSize: 20 }]}>What's happening?</Text>
          {!location ? <Text style={[s.muted, { color: colors.power, marginTop: 6 }]}>Finding your location…</Text> : null}

          <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
            {['out', 'restored'].map((st) => (
              <Pressable
                key={st}
                onPress={() => setStatus(st)}
                style={{
                  flex: 1, padding: 10, borderRadius: 12, alignItems: 'center',
                  backgroundColor: status === st ? (st === 'out' ? colors.accent : colors.ok) : colors.cardAlt,
                }}
              >
                <Text style={{ color: '#fff', fontWeight: '700' }}>{st === 'out' ? 'Problem now' : "It's back"}</Text>
              </Pressable>
            ))}
          </View>

          <View style={{ marginTop: 12, gap: 8 }}>
            {Object.entries(TYPES).map(([key, t]) => (
              <Pressable
                key={key}
                onPress={() => setType(key)}
                style={{
                  flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14,
                  backgroundColor: type === key ? t.color + '33' : colors.cardAlt,
                  borderWidth: 1.5, borderColor: type === key ? t.color : 'transparent',
                }}
              >
                <Ionicons name={t.icon} size={22} color={t.color} />
                <Text style={[s.text, { marginLeft: 12, fontWeight: '700' }]}>
                  {status === 'restored' ? `${t.short} is back` : t.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={s.label}>Details (optional)</Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="e.g. Whole street out since 6pm"
            placeholderTextColor={colors.muted}
            style={s.input}
            maxLength={280}
          />
          <Button
            title={status === 'out' ? 'Send report' : 'Mark as back'}
            color={status === 'out' ? colors.accent : colors.ok}
            icon="send"
            onPress={send}
            loading={busy}
            disabled={!location}
            style={{ marginTop: 16 }}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
