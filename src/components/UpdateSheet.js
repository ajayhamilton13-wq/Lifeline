import React from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { colors, radii, tint, type } from '../theme';
import { useUpdates } from '../updater';
import { Button, IconBadge } from './ui';

function formatSize(bytes) {
  if (!bytes) return '';
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Shown automatically when a newer Lifeline APK is on GitHub. */
export default function UpdateSheet() {
  const u = useUpdates();
  if (!u || !u.available) return null;
  const downloading = u.progress !== null;
  const pct = Math.round((u.progress || 0) * 100);

  return (
    <Modal visible={u.showPrompt} transparent animationType="fade" onRequestClose={() => !downloading && u.dismiss()} statusBarTranslucent>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', padding: 22 }}>
        <View style={{ backgroundColor: colors.card, borderRadius: radii.xl, padding: 22, borderWidth: 1, borderColor: colors.borderStrong }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <IconBadge icon="rocket" color={colors.ok} size={50} filled />
            <View style={{ marginLeft: 14, flex: 1 }}>
              <Text style={type.overline}>Update available</Text>
              <Text style={[type.title, { fontSize: 22, marginTop: 2 }]}>Lifeline {u.available.version}</Text>
              <Text style={type.small}>
                You have {u.currentVersion}
                {u.available.size ? ` · ${formatSize(u.available.size)}` : ''}
              </Text>
            </View>
          </View>

          {u.available.notes ? (
            <ScrollView style={{ maxHeight: 180, marginTop: 16 }}>
              <Text style={[type.overline, { marginBottom: 6 }]}>What's new</Text>
              <Text style={type.body}>{u.available.notes}</Text>
            </ScrollView>
          ) : null}

          {downloading ? (
            <View style={{ marginTop: 20 }}>
              <View style={{ height: 8, borderRadius: 4, backgroundColor: colors.cardAlt, overflow: 'hidden' }}>
                <View style={{ width: `${pct}%`, height: 8, backgroundColor: colors.ok }} />
              </View>
              <Text style={[type.small, { marginTop: 8, textAlign: 'center' }]}>Downloading… {pct}%</Text>
            </View>
          ) : null}

          {u.error ? (
            <View style={{ marginTop: 14, padding: 10, borderRadius: radii.sm, backgroundColor: tint(colors.accent, 0.12) }}>
              <Text style={{ color: colors.accent, fontWeight: '700', fontSize: 13 }}>{u.error}</Text>
            </View>
          ) : null}

          <Button
            title={downloading ? 'Downloading…' : 'Update now'}
            icon="download-outline"
            color={colors.ok}
            onPress={u.install}
            loading={downloading}
            style={{ marginTop: 20 }}
          />
          {!downloading ? (
            <Pressable onPress={u.dismiss} style={{ alignItems: 'center', paddingTop: 14 }} hitSlop={8}>
              <Text style={{ color: colors.muted, fontWeight: '700' }}>Later</Text>
            </Pressable>
          ) : null}
          <Text style={[type.small, { fontSize: 11, textAlign: 'center', marginTop: 12, color: colors.faint }]}>
            Android may ask you to allow Lifeline to install apps the first time.
          </Text>
        </View>
      </View>
    </Modal>
  );
}
