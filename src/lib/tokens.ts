/** Design tokens from the handoff. Kept in one place so values are never guessed. */
export const color = {
  teal: '#0c8495',
  green: '#00a97a',
  yellow: '#f7db5d',
  warmGrey: '#605c5c',
  ink: '#16302c',
  body: '#3f4f4b',
  mutedLabel: '#95a5a6',
  surface: '#ffffff',
  offWhite: '#fbfcfb',
  tint: '#eef4f2',
  tintYellow: '#fdf6d9',
  hoverGrey: '#f2f5f4',
  border: 'rgba(22,48,44,0.10)',
  divider: 'rgba(22,48,44,0.09)',
} as const;

export const motion = {
  ease: 'cubic-bezier(.2,.7,.2,1)',
  heroInterval: 7000,
} as const;
