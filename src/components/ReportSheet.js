import React, { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, tint, type } from '../theme';
import { TYPES } from '../geo';
import { useApp } from '../AppContext';
import { Button, Field } from './ui';

/** Bottom sheet for reporting an outage, or that service is back. */
export default function ReportSheet({ visible, onClose, presetType, presetStatus = 'out' }) {
  const { submitReport, location } = useApp();
  const [kind, setKind] = useState(presetType || 'power');
  const [status, setStatus] = useState(presetStatus);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (visible) {
      setKind(presetType || 'power');
      setStatus(presetStatus);
      setNote('');
    }
  }, [visible, presetType, presetStatus]);

  const isOut = status === 'out';
  const actionColor = isOut ? colors.accent : colors.ok;

  async function send() {
    setBusy(true);
    try {
      const res = await submitReport({ type: kind, status, note });
      onClose();
      if (!res.cloud) {
        Alert.alert(
          'Saved offline',
          res.direct > 0
            ? `Passed to ${res.direct} nearby phone${res.direct > 1 ? 's' : ''}. It uploads automatically when you're back online.`
            : "No internet or nearby phones right now. It will send automatically when you're back online.",
        );
      }
    } catch (e) {
      Alert.alert('Could not send', e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' }} onPress={onClose} />
        <View
          style={{
            backgroundColor: colors.card, borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingHorizontal: 20,
            paddingTop: 10, paddingBottom: 30, borderWidth: 1, borderColor: colors.borderStrong,
          }}
        >
          <View style={{ alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: colors.borderStrong, marginBottom: 18 }} />

          <Text style={type.overline}>{location ? 'At your current location' : 'Finding your location…'}</Text>
          <Text style={[type.title, { marginTop: 4 }]}>{isOut ? 'What went out?' : 'What came back?'}</Text>

          {/* Segmented control */}
          <View style={{ flexDirection: 'row', backgroundColor: colors.bgRaised, borderRadius: radii.md, padding: 4, marginTop: 18, borderWidth: 1, borderColor: colors.border }}>
            {[
              { key: 'out', label: 'Outage now', icon: 'alert-circle' },
              { key: 'restored', label: "It's back", icon: 'checkmark-circle' },
            ].map((o) => {
              const on = status === o.key;
              const c = o.key === 'out' ? colors.accent : colors.ok;
              return (
                <Pressable
                  key={o.key}
                  onPress={() => setStatus(o.key)}
                  style={{
                    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 11,
                    borderRadius: radii.sm + 2, backgroundColor: on ? tint(c, 0.18) : 'transparent',
                  }}
                >
                  <Ionicons name={on ? o.icon : `${o.icon}-outline`} size={17} color={on ? c : colors.muted} />
                  <Text style={{ color: on ? colors.text : colors.muted, fontWeight: '800', marginLeft: 6 }}>{o.label}</Text>
                </Pressable>
              );
            })}
          </View>

          {/* Utility picker */}
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
            {Object.entries(TYPES).map(([key, t]) => {
              const on = kind === key;
              return (
                <Pressable
                  key={key}
                  onPress={() => setKind(key)}
                  style={({ pressed }) => [
                    {
                      flex: 1, alignItems: 'center', paddingVertical: 16, paddingHorizontal: 6, borderRadius: radii.lg,
                      backgroundColor: on ? tint(t.color, 0.14) : colors.bgRaised, borderWidth: 1.5,
                      borderColor: on ? t.color : colors.border,
                    },
                    pressed && { transform: [{ scale: 0.97 }] },
                  ]}
                >
                  <View
                    style={{
                      width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
                      backgroundColor: on ? t.color : tint(t.color, 0.14),
                    }}
                  >
                    <Ionicons name={t.icon} size={24} color={on ? colors.bg : t.color} />
                  </View>
                  <Text style={{ color: on ? colors.text : colors.textSoft, fontWeight: '800', fontSize: 13, marginTop: 10, textAlign: 'center' }}>
                    {t.short}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Field
            label="Details (optional)"
            icon="create-outline"
            value={note}
            onChangeText={setNote}
            placeholder={isOut ? 'e.g. Whole street out since 6pm' : 'e.g. Back on at 9pm'}
            maxLength={280}
            style={{ marginTop: 18 }}
          />

          <Button
            title={isOut ? `Report ${TYPES[kind].short.toLowerCase()} outage` : `${TYPES[kind].short} is back`}
            icon={isOut ? 'megaphone' : 'checkmark-done'}
            color={actionColor}
            onPress={send}
            loading={busy}
            disabled={!location}
            style={{ marginTop: 20 }}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
