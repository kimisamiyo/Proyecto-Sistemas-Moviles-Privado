export const colors = {
  surface: '#0e0e0e',
  surface_container_low: '#131313',
  surface_container_high: '#1f2020',
  surface_container_highest: '#252626',
  surface_bright: '#2b2c2c',

  primary: '#c1c7cf',
  primary_container: '#41474e',
  on_primary: '#3a4147',

  secondary: '#909fb4',
  on_surface: '#e7e5e5',

  outline: '#767575',
  outline_variant: '#484848',

  error: '#ee7d77',
  error_container: '#7f2927',

  live: '#4ade80',
  live_bg: 'rgba(74, 222, 128, 0.15)',
};

export const typography = {
  fontFamily: 'Manrope',

  display_lg: {
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -0.72,
    lineHeight: 44,
  },
  display_md: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.56,
    lineHeight: 36,
  },
  display_sm: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.48,
    lineHeight: 32,
  },
  headline_lg: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.22,
    lineHeight: 28,
  },
  headline_md: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: -0.18,
    lineHeight: 24,
  },
  title_lg: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0,
    lineHeight: 22,
  },
  title_md: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.1,
    lineHeight: 20,
  },
  body_lg: {
    fontSize: 16,
    fontWeight: '400',
    letterSpacing: 0.15,
    lineHeight: 24,
  },
  body_md: {
    fontSize: 14,
    fontWeight: '400',
    letterSpacing: 0.25,
    lineHeight: 20,
  },
  body_sm: {
    fontSize: 12,
    fontWeight: '400',
    letterSpacing: 0.4,
    lineHeight: 16,
  },
  label_lg: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.1,
    lineHeight: 20,
  },
  label_md: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.5,
    lineHeight: 16,
  },
  label_sm: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.8,
    lineHeight: 14,
    textTransform: 'uppercase',
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const radius = {
  sm: 4,
  md: 6,
  lg: 12,
  xl: 16,
  xxl: 24,
  full: 999,
};

export const shadows = {
  ambient: {
    shadowColor: '#e7e5e5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 48,
    elevation: 2,
  },
  float: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 8,
  },
};

export const glassmorphism = {
  background: 'rgba(37, 38, 38, 0.4)',
  blurIntensity: 20,
  blurTint: 'dark',
};
