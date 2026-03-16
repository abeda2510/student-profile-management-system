// Global design tokens
export const T = {
  primary:   '#1a56db',
  primaryDk: '#1e40af',
  success:   '#057a55',
  warning:   '#c27803',
  danger:    '#e02424',
  bg:        '#f1f5f9',
  surface:   '#ffffff',
  border:    '#e2e8f0',
  text:      '#1e293b',
  muted:     '#64748b',
  subtle:    '#94a3b8',
};

export const card = {
  background: '#fff',
  borderRadius: 10,
  padding: 24,
  boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
  marginBottom: 20,
};

export const input = {
  width: '100%',
  padding: '10px 12px',
  border: '1.5px solid #e2e8f0',
  borderRadius: 8,
  fontSize: 14,
  outline: 'none',
  background: '#f8fafc',
  color: '#1e293b',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s',
};

export const btn = (color = '#1a56db', disabled = false) => ({
  background: disabled ? '#cbd5e1' : color,
  color: '#fff',
  border: 'none',
  padding: '10px 22px',
  borderRadius: 8,
  cursor: disabled ? 'not-allowed' : 'pointer',
  fontWeight: 600,
  fontSize: 14,
  letterSpacing: 0.2,
  transition: 'opacity 0.15s',
});

export const badge = (bg, color) => ({
  display: 'inline-block',
  background: bg,
  color,
  borderRadius: 20,
  padding: '2px 10px',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: 0.2,
});

export const sectionTitle = {
  fontWeight: 700,
  fontSize: 13,
  color: '#1a56db',
  margin: '20px 0 10px',
  paddingBottom: 6,
  borderBottom: '2px solid #e0eaff',
  textTransform: 'uppercase',
  letterSpacing: 0.5,
};

export const pageTitle = {
  fontSize: 22,
  fontWeight: 800,
  color: '#1e293b',
  marginBottom: 4,
  letterSpacing: -0.3,
};

export const pageSubtitle = {
  fontSize: 14,
  color: '#64748b',
  marginBottom: 24,
};
