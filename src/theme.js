// Lifeline design system.
// Direction: "calm under pressure". A deep night palette so outages glow,
// one signal colour per utility, and a single urgent red reserved for action.

export const colors = {
  bg: '#060A13',
  bgRaised: '#0B111D',
  card: '#101828',
  cardAlt: '#162033',
  elevated: '#1B2740',
  border: '#1F2A40',
  borderStrong: '#2C3A57',

  text: '#F2F5FB',
  textSoft: '#C3CCDD',
  muted: '#7F8BA3',
  faint: '#4F5B73',

  accent: '#FF4757', // urgent action only
  accentDeep: '#C9283A',
  ok: '#2BD99F',
  power: '#FFB23F',
  water: '#3FA9FF',
  pressure: '#7EE0FF',
  mesh: '#B18CFF',
  share: '#2BD99F',
};

// Translucent tint of any hex colour, e.g. tint(colors.power, 0.15)
export function tint(hex, alpha) {
  const a = Math.round(Math.max(0, Math.min(1, alpha)) * 255)
    .toString(16)
    .padStart(2, '0');
  return `${hex}${a}`;
}

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
export const radius = 18;
export const radii = { sm: 10, md: 14, lg: 20, xl: 28, pill: 999 };

export const type = {
  display: { fontSize: 32, fontWeight: '900', letterSpacing: -0.8, color: colors.text },
  title: { fontSize: 24, fontWeight: '800', letterSpacing: -0.4, color: colors.text },
  heading: { fontSize: 17, fontWeight: '800', letterSpacing: -0.2, color: colors.text },
  body: { fontSize: 15, fontWeight: '500', color: colors.textSoft, lineHeight: 21 },
  small: { fontSize: 13, fontWeight: '500', color: colors.muted, lineHeight: 18 },
  overline: { fontSize: 11, fontWeight: '800', letterSpacing: 1.4, color: colors.muted, textTransform: 'uppercase' },
  number: { fontSize: 28, fontWeight: '900', letterSpacing: -1, color: colors.text },
};

export const shadow = {
  card: { shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 8 },
  glow: (c) => ({ shadowColor: c, shadowOpacity: 0.55, shadowRadius: 22, shadowOffset: { width: 0, height: 6 }, elevation: 12 }),
};

// Space screens leave at the bottom so content clears the floating tab bar.
export const TAB_SPACE = 104;
