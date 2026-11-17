import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, Animated, Easing, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, shadow, space, tint, type } from '../theme';
import { useApp } from '../AppContext';

// ---------- Layout ----------

export function TopBar({ overline, title, right, style }) {
  return (
    <View style={[st.topBar, style]}>
      <View style={{ flex: 1 }}>
        {overline ? <Text style={type.overline}>{overline}</Text> : null}
        <Text style={[type.title, { marginTop: overline ? 2 : 0 }]}>{title}</Text>
      </View>
      {right}
    </View>
  );
}

export function SectionHeader({ label, action, onAction }) {
  return (
    <View style={st.sectionHeader}>
      <Text style={type.overline}>{label}</Text>
      {action ? (
        <Pressable onPress={onAction} hitSlop={10}>
          <Text style={{ color: colors.accent, fontWeight: '700', fontSize: 13 }}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function Card({ children, style, accent, onPress }) {
  const body = (
    <View style={[st.card, accent && { borderColor: tint(accent, 0.45), backgroundColor: tint(accent, 0.07) }, style]}>
      {children}
    </View>
  );
  if (!onPress) return body;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && { opacity: 0.85, transform: [{ scale: 0.99 }] }}>
      {body}
    </Pressable>
  );
}

// ---------- Small pieces ----------

export function IconBadge({ icon, color = colors.text, size = 40, filled }) {
  return (
    <View
      style={{
        width: size, height: size, borderRadius: size * 0.32, alignItems: 'center', justifyContent: 'center',
        backgroundColor: filled ? color : tint(color, 0.16),
      }}
    >
      <Ionicons name={icon} size={size * 0.52} color={filled ? '#0A0F1A' : color} />
    </View>
  );
}

export function Chip({ label, icon, color = colors.textSoft, active, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        st.chip,
        active ? { backgroundColor: tint(color, 0.18), borderColor: color } : null,
        pressed && { opacity: 0.8 },
      ]}
    >
      {icon ? <Ionicons name={active ? icon : `${icon}-outline`} size={15} color={active ? color : colors.muted} /> : null}
      <Text style={{ color: active ? colors.text : colors.textSoft, fontSize: 13, fontWeight: '700', marginLeft: icon ? 6 : 0 }}>{label}</Text>
    </Pressable>
  );
}

export function Avatar({ name = '?', size = 38 }) {
  const palette = [colors.power, colors.water, colors.ok, colors.mesh, colors.pressure, colors.accent];
  const hash = [...name].reduce((h, c) => h + c.charCodeAt(0), 0);
  const c = palette[hash % palette.length];
  const initials = name.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase() || '?';
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: tint(c, 0.2), alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: c, fontWeight: '900', fontSize: size * 0.38 }}>{initials}</Text>
    </View>
  );
}

/** A dot with an expanding ring, for anything live. */
export function PulseDot({ color = colors.ok, size = 8 }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.timing(v, { toValue: 1, duration: 1600, easing: Easing.out(Easing.ease), useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [v]);
  return (
    <View style={{ width: size * 2.6, height: size * 2.6, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View
        style={{
          position: 'absolute', width: size * 2.6, height: size * 2.6, borderRadius: size * 1.3, backgroundColor: color,
          opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0] }),
          transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) }],
        }}
      />
      <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color }} />
    </View>
  );
}

export function EmptyState({ icon, title, body, color = colors.muted }) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: 44, paddingHorizontal: 28 }}>
      <IconBadge icon={icon} color={color} size={64} />
      <Text style={[type.heading, { marginTop: 16, textAlign: 'center' }]}>{title}</Text>
      <Text style={[type.small, { marginTop: 6, textAlign: 'center', fontSize: 14, lineHeight: 20 }]}>{body}</Text>
    </View>
  );
}

// ---------- Buttons & inputs ----------

export function Button({ title, onPress, icon, variant = 'primary', color = colors.accent, disabled, loading, style, size = 'lg' }) {
  const isPrimary = variant === 'primary';
  const isGhost = variant === 'ghost';
  const fg = isPrimary ? '#fff' : color;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        st.btn,
        size === 'sm' && { paddingVertical: 10, paddingHorizontal: 14, borderRadius: radii.md },
        isPrimary && { backgroundColor: color, ...shadow.glow(color) },
        variant === 'secondary' && { backgroundColor: tint(color, 0.14), borderWidth: 1, borderColor: tint(color, 0.4) },
        isGhost && { backgroundColor: 'transparent' },
        (pressed || disabled) && { opacity: 0.6 },
        pressed && { transform: [{ scale: 0.98 }] },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {icon ? <Ionicons name={icon} size={size === 'sm' ? 16 : 19} color={fg} style={{ marginRight: 8 }} /> : null}
          <Text style={{ color: fg, fontWeight: '800', fontSize: size === 'sm' ? 14 : 16, letterSpacing: 0.1 }}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
}

export function Field({ label, icon, style, ...props }) {
  return (
    <View style={style}>
      {label ? <Text style={[type.overline, { marginBottom: 8 }]}>{label}</Text> : null}
      <View style={st.field}>
        {icon ? <Ionicons name={icon} size={18} color={colors.muted} style={{ marginRight: 10 }} /> : null}
        <TextInput placeholderTextColor={colors.faint} selectionColor={colors.accent} style={st.fieldInput} {...props} />
      </View>
    </View>
  );
}

// ---------- Connection status ----------

/** Compact live status: internet + phones linked offline. */
export function ConnectionPill() {
  const { online, peers, meshOn } = useApp();
  const netColor = online ? colors.ok : colors.accent;
  return (
    <View style={st.statusPill}>
      <PulseDot color={netColor} size={6} />
      <Text style={[st.statusText, { color: netColor }]}>{online ? 'Online' : 'Offline'}</Text>
      <View style={st.statusDivider} />
      <Ionicons name="git-network" size={13} color={meshOn ? colors.mesh : colors.faint} />
      <Text style={[st.statusText, { color: meshOn ? colors.mesh : colors.faint, marginLeft: 4 }]}>{meshOn ? peers : '–'}</Text>
    </View>
  );
}

const st = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: space.xl - 4, paddingTop: space.lg, paddingBottom: space.md },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: space.xl, marginBottom: space.md },
  card: { backgroundColor: colors.card, borderRadius: radii.lg, padding: space.lg, borderWidth: 1, borderColor: colors.border },
  chip: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 9, borderRadius: radii.pill,
    backgroundColor: colors.cardAlt, borderWidth: 1, borderColor: 'transparent',
  },
  btn: { borderRadius: radii.lg, paddingVertical: 16, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center' },
  field: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgRaised, borderRadius: radii.md,
    borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14,
  },
  fieldInput: { flex: 1, color: colors.text, fontSize: 15, fontWeight: '600', paddingVertical: 14 },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: tint(colors.bg, 0.85), borderRadius: radii.pill,
    paddingLeft: 4, paddingRight: 12, paddingVertical: 2, borderWidth: 1, borderColor: colors.border,
  },
  statusText: { fontSize: 12, fontWeight: '800' },
  statusDivider: { width: 1, height: 14, backgroundColor: colors.border, marginHorizontal: 9 },
});
