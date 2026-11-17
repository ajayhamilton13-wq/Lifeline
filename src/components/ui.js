import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../theme';
import { useApp } from '../AppContext';

export function Button({ title, onPress, color = colors.accent, icon, outline, disabled, loading, style }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        s.btn,
        outline ? { borderColor: color, borderWidth: 1.5, backgroundColor: 'transparent' } : { backgroundColor: color },
        (pressed || disabled) && { opacity: 0.6 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={outline ? color : '#fff'} />
      ) : (
        <View style={s.row}>
          {icon ? <Ionicons name={icon} size={18} color={outline ? color : '#fff'} style={{ marginRight: 8 }} /> : null}
          <Text style={[s.btnText, outline && { color }]}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
}

export function Card({ children, style }) {
  return <View style={[s.card, style]}>{children}</View>;
}

export function Header({ title, subtitle, right }) {
  return (
    <View style={s.header}>
      <View style={{ flex: 1 }}>
        <Text style={s.title}>{title}</Text>
        {subtitle ? <Text style={s.subtitle}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}

/** Shows whether the phone has internet and how many phones are linked offline. */
export function ConnectionPill() {
  const { online, peers, meshOn } = useApp();
  return (
    <View style={s.pills}>
      <View style={[s.pill, { borderColor: online ? colors.ok : colors.accent }]}>
        <Ionicons name={online ? 'wifi' : 'cloud-offline'} size={13} color={online ? colors.ok : colors.accent} />
        <Text style={[s.pillText, { color: online ? colors.ok : colors.accent }]}>{online ? 'Online' : 'Offline'}</Text>
      </View>
      <View style={[s.pill, { borderColor: meshOn ? colors.mesh : colors.border }]}>
        <Ionicons name="git-network" size={13} color={meshOn ? colors.mesh : colors.muted} />
        <Text style={[s.pillText, { color: meshOn ? colors.mesh : colors.muted }]}>
          {meshOn ? `${peers} nearby` : 'Mesh off'}
        </Text>
      </View>
    </View>
  );
}

export const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  btn: { borderRadius: radius, paddingVertical: 13, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  card: { backgroundColor: colors.card, borderRadius: radius, padding: 14, borderWidth: 1, borderColor: colors.border },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 10 },
  title: { color: colors.text, fontSize: 24, fontWeight: '800' },
  subtitle: { color: colors.muted, fontSize: 13, marginTop: 2 },
  pills: { flexDirection: 'row', gap: 6 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 4, backgroundColor: colors.bg },
  pillText: { fontSize: 12, fontWeight: '700' },
  input: {
    backgroundColor: colors.cardAlt, color: colors.text, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, borderWidth: 1, borderColor: colors.border,
  },
  label: { color: colors.muted, fontSize: 13, fontWeight: '600', marginBottom: 6, marginTop: 12 },
  text: { color: colors.text, fontSize: 15 },
  muted: { color: colors.muted, fontSize: 13 },
  empty: { color: colors.muted, textAlign: 'center', marginTop: 40, fontSize: 15, paddingHorizontal: 30, lineHeight: 22 },
});
