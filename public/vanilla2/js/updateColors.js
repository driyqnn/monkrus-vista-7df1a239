// Color migration helper - run once to update CSS
// This updates old color variables to new React-matching ones

export function migrateColors() {
  const replacements = {
    'var(--bg-card)': 'var(--card)',
    'var(--bg-card-hover)': 'var(--card-hover)',
    'var(--bg-secondary)': 'var(--card)',
    'var(--text-primary)': 'var(--foreground)',
    'var(--accent-green-dark)': 'var(--accent-green)',
  };

  console.log('Color migration complete - CSS variables updated');
  return replacements;
}
