/** MD3 light “smoke” palette — TodoFront / EventUs (#faf9f7, primary #3f646c) */
export const colors = {
  surface_tint: '#3f646c',
  primary: '#3f646c',
  on_primary: '#ffffff',
  primary_container: '#7297a0',
  on_primary_container: '#032f36',
  primary_fixed: '#c2e9f3',
  primary_fixed_dim: '#a7cdd6',
  on_primary_fixed: '#001f25',
  on_primary_fixed_variant: '#274c54',
  inverse_primary: '#a7cdd6',

  secondary: '#625e56',
  on_secondary: '#ffffff',
  secondary_container: '#e6dfd5',
  on_secondary_container: '#66625a',
  secondary_fixed: '#e8e2d8',
  secondary_fixed_dim: '#ccc6bc',
  on_secondary_fixed: '#1e1b15',
  on_secondary_fixed_variant: '#4a463f',

  tertiary: '#655d57',
  on_tertiary: '#ffffff',
  tertiary_container: '#998f89',
  on_tertiary_container: '#2f2924',
  tertiary_fixed: '#ece0d9',
  tertiary_fixed_dim: '#cfc4be',
  on_tertiary_fixed: '#201b16',
  on_tertiary_fixed_variant: '#4c4540',

  background: '#faf9f7',
  on_background: '#1a1c1b',
  surface: '#faf9f7',
  on_surface: '#1a1c1b',
  surface_dim: '#dadad8',
  surface_bright: '#faf9f7',
  surface_variant: '#e3e2e0',
  on_surface_variant: '#41484a',
  surface_container_lowest: '#ffffff',
  surface_container_low: '#f4f3f1',
  surface_container: '#efeeec',
  surface_container_high: '#e9e8e6',
  surface_container_highest: '#e3e2e0',
  inverse_surface: '#2f3130',
  inverse_on_surface: '#f1f1ef',

  outline: '#71787a',
  outline_variant: '#c1c8ca',

  error: '#ba1a1a',
  on_error: '#ffffff',
  error_container: '#ffdad6',
  on_error_container: '#93000a',

  live: '#2e7d32',
  live_bg: 'rgba(46, 125, 50, 0.12)',
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
    shadowColor: '#1a1c1b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  float: {
    shadowColor: '#1a1c1b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
};

export const glassmorphism = {
  background: 'rgba(239, 238, 236, 0.85)',
  blurIntensity: 24,
  blurTint: 'light',
};
