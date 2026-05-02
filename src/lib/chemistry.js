export const CHEMISTRY_PRESETS = [
  {
    id: 'hc110-b',
    name: 'HC-110 Dil. B',
    devTime: 6 * 60,
    temperature: '68°F / 20°C',
    agitationInterval: 30,
    notes: 'Agitate first 30s, then 5s every 30s',
  },
  {
    id: 'd76',
    name: 'D-76',
    devTime: 7 * 60,
    temperature: '68°F / 20°C',
    agitationInterval: 30,
    notes: 'Agitate first 30s, then 5s every 30s',
  },
  {
    id: 'rodinal',
    name: 'Rodinal 1+50',
    devTime: 11 * 60,
    temperature: '68°F / 20°C',
    agitationInterval: 60,
    notes: 'Stand or minimal agitation',
  },
  {
    id: 'ilfosol3',
    name: 'Ilfosol 3',
    devTime: 7 * 60 + 30,
    temperature: '68°F / 20°C',
    agitationInterval: 30,
    notes: 'Agitate first 30s, then 5s every 30s',
  },
  {
    id: 'id11',
    name: 'ID-11',
    devTime: 7 * 60,
    temperature: '68°F / 20°C',
    agitationInterval: 30,
    notes: 'Agitate first 30s, then 5s every 30s',
  },
  {
    id: 'xtol',
    name: 'XTOL',
    devTime: 7 * 60,
    temperature: '68°F / 20°C',
    agitationInterval: 30,
    notes: 'Agitate first 30s, then 5s every 30s',
  },
]

export const DEV_STEPS = [
  { id: 'presoak', name: 'Pre-soak', duration: 2 * 60 },
  { id: 'developer', name: 'Developer', duration: null },
  { id: 'stop', name: 'Stop Bath', duration: 60 },
  { id: 'fixer', name: 'Fixer', duration: 5 * 60 },
]
