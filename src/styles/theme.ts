import { createTheme, ITheme, IPalette } from '@fluentui/react';

export type AppThemeMode = 'dark' | 'light';

export const darkNavyPalette: Partial<IPalette> = {
  themePrimary: '#0ea5e9',
  themeLighterAlt: '#021018',
  themeLighter: '#072739',
  themeLight: '#0d3f5c',
  themeTertiary: '#197cae',
  themeSecondary: '#0c95d3',
  themeDarkAlt: '#23aee9',
  themeDark: '#44baee',
  themeDarker: '#75cbef',
  neutralLighterAlt: '#070c18',
  neutralLighter: '#0a1120',
  neutralLight: '#0e1628',
  neutralQuaternaryAlt: '#131e34',
  neutralQuaternary: '#18253f',
  neutralTertiaryAlt: '#223456',
  neutralTertiary: '#94a3b8',
  neutralSecondary: '#cbd5e1',
  neutralPrimaryAlt: '#e2e8f0',
  neutralPrimary: '#f8fafc',
  neutralDark: '#ffffff',
  black: '#ffffff',
  white: '#070c18',
};

export const darkNavyTheme: ITheme = createTheme({
  palette: darkNavyPalette,
  defaultFontStyle: {
    fontFamily: '"Plus Jakarta Sans", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  effects: {
    roundedCorner2: '6px',
    roundedCorner4: '10px',
    roundedCorner6: '14px',
    elevation4: '0 4px 20px -2px rgba(0, 0, 0, 0.55)',
    elevation8: '0 8px 32px rgba(0, 0, 0, 0.65)',
    elevation16: '0 16px 48px rgba(0, 0, 0, 0.8)',
  }
});

export const lightSaasPalette: Partial<IPalette> = {
  themePrimary: '#0284c7',
  themeLighterAlt: '#f3f9fd',
  themeLighter: '#d0e9f8',
  themeLight: '#a9d6f2',
  themeTertiary: '#5cb0e6',
  themeSecondary: '#1a90db',
  themeDarkAlt: '#0276b3',
  themeDark: '#026497',
  themeDarker: '#014a70',
  neutralLighterAlt: '#f8fafc',
  neutralLighter: '#f1f5f9',
  neutralLight: '#e2e8f0',
  neutralQuaternaryAlt: '#cbd5e1',
  neutralQuaternary: '#94a3b8',
  neutralTertiaryAlt: '#64748b',
  neutralTertiary: '#475569',
  neutralSecondary: '#334155',
  neutralPrimaryAlt: '#1e293b',
  neutralPrimary: '#0f172a',
  neutralDark: '#020617',
  black: '#000000',
  white: '#ffffff',
};

export const lightSaasTheme: ITheme = createTheme({
  palette: lightSaasPalette,
  defaultFontStyle: {
    fontFamily: '"Plus Jakarta Sans", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  effects: {
    roundedCorner2: '6px',
    roundedCorner4: '10px',
    roundedCorner6: '14px',
    elevation4: '0 4px 16px rgba(15, 23, 42, 0.06)',
    elevation8: '0 8px 24px rgba(15, 23, 42, 0.1)',
    elevation16: '0 16px 36px rgba(15, 23, 42, 0.14)',
  }
});

export const getThemeStyles = (isDark: boolean) => {
  return {
    bgApp: isDark ? '#070c18' : '#f8fafc',
    bgCard: isDark ? '#0c1322' : '#ffffff',
    bgCardHover: isDark ? '#111a30' : '#f1f5f9',
    bgCardElevated: isDark ? '#142038' : '#ffffff',
    bgSidebar: isDark ? '#050811' : '#ffffff',
    bgHeader: isDark ? 'rgba(7, 12, 24, 0.85)' : 'rgba(255, 255, 255, 0.92)',
    bgPill: isDark ? 'rgba(255, 255, 255, 0.05)' : '#f1f5f9',
    bgInput: isDark ? 'rgba(255, 255, 255, 0.04)' : '#ffffff',
    
    // Borders
    border: isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0',
    borderLight: isDark ? 'rgba(255, 255, 255, 0.04)' : '#f1f5f9',
    borderGlow: isDark ? 'rgba(14, 165, 233, 0.35)' : 'rgba(2, 132, 199, 0.25)',
    borderActive: isDark ? '#0ea5e9' : '#0284c7',

    // Typography
    textPrimary: isDark ? '#f8fafc' : '#0f172a',
    textSecondary: isDark ? '#94a3b8' : '#64748b',
    textMuted: isDark ? '#64748b' : '#94a3b8',
    textInvert: isDark ? '#070c18' : '#ffffff',

    // SaaS Accents & Status
    accentBlue: '#0ea5e9',
    accentCyan: '#06b6d4',
    accentIndigo: '#6366f1',
    accentPurple: '#a855f7',
    accentGreen: '#10b981',
    accentAmber: '#f59e0b',
    accentRed: '#f43f5e',

    // Shadows
    cardShadow: isDark 
      ? '0 4px 20px -2px rgba(0, 0, 0, 0.5), 0 2px 6px -1px rgba(0, 0, 0, 0.3)' 
      : '0 4px 20px -2px rgba(15, 23, 42, 0.06), 0 2px 6px -1px rgba(15, 23, 42, 0.04)',
    cardShadowHover: isDark 
      ? '0 12px 32px -4px rgba(0, 0, 0, 0.7), 0 4px 12px -2px rgba(14, 165, 233, 0.25)' 
      : '0 12px 30px -4px rgba(15, 23, 42, 0.12), 0 4px 12px -2px rgba(15, 23, 42, 0.06)',
    glowCyan: '0 0 20px rgba(14, 165, 233, 0.25)',
    glowPurple: '0 0 20px rgba(168, 85, 247, 0.25)',
  };
};

export const getStatusBadgeStyle = (status: string, isDark: boolean): React.CSSProperties => {
  let bg = 'rgba(100, 116, 139, 0.15)';
  let color = '#94a3b8';
  let border = 'rgba(100, 116, 139, 0.3)';

  switch (status) {
    case 'Active':
    case 'Completed':
    case 'Approved':
      bg = isDark ? 'rgba(16, 185, 129, 0.15)' : '#ecfdf5';
      color = '#10b981';
      border = 'rgba(16, 185, 129, 0.3)';
      break;
    case 'In Progress':
      bg = isDark ? 'rgba(14, 165, 233, 0.15)' : '#f0f9ff';
      color = '#0ea5e9';
      border = 'rgba(14, 165, 233, 0.3)';
      break;
    case 'Delayed':
    case 'Critical':
    case 'Rejected':
      bg = isDark ? 'rgba(244, 63, 94, 0.15)' : '#fff1f2';
      color = '#f43f5e';
      border = 'rgba(244, 63, 94, 0.3)';
      break;
    case 'Planning':
    case 'Pending':
    case 'High':
    case 'Under Review':
      bg = isDark ? 'rgba(245, 158, 11, 0.15)' : '#fffbeb';
      color = '#f59e0b';
      border = 'rgba(245, 158, 11, 0.3)';
      break;
    case 'On Hold':
    case 'Medium':
      bg = isDark ? 'rgba(168, 85, 247, 0.15)' : '#faf5ff';
      color = '#a855f7';
      border = 'rgba(168, 85, 247, 0.3)';
      break;
  }

  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '3px 10px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: 600,
    backgroundColor: bg,
    color,
    border: `1px solid ${border}`,
    letterSpacing: '0.2px',
    textTransform: 'uppercase'
  };
};
