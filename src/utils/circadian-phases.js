export const PHASES = {
  dawn: {
    key: 'dawn',
    displayName: 'morning',
    gold:      '#d4a062',
    goldRgb:   '212,160,98',
    bgBase:    '#0e0c0a',
    bgSurface: '#121009',
    bgPanel:   '#13110c',
  },
  day: {
    key: 'day',
    displayName: 'afternoon',
    gold:      '#d4b84a',
    goldRgb:   '212,184,74',
    bgBase:    '#090e18',
    bgSurface: '#0d1221',
    bgPanel:   '#0c1322',
  },
  goldenHour: {
    key: 'goldenHour',
    displayName: 'evening',
    gold:      '#c9a84c',
    goldRgb:   '201,168,76',
    bgBase:    '#0a0e1a',
    bgSurface: '#0d1221',
    bgPanel:   '#0d1525',
  },
  night: {
    key: 'night',
    displayName: 'night',
    gold:      '#9898b8',
    goldRgb:   '152,152,184',
    bgBase:    '#080810',
    bgSurface: '#0c0c1e',
    bgPanel:   '#0b0b18',
  },
}

export function getPhase(hour) {
  if (hour >= 5 && hour < 11)  return 'dawn'
  if (hour >= 11 && hour < 17) return 'day'
  if (hour >= 17 && hour < 20) return 'goldenHour'
  return 'night'
}
