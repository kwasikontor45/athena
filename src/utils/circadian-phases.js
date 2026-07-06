export const PHASES = {
  rose: {
    key:         'rose',
    displayName: 'nyx',
    gold:        '#ea9a97',
    goldRgb:     '234,154,151',
    bgBase:      '#1d1015',
    bgSurface:   '#241419',
    bgPanel:     '#2a1a1e',
    textPrimary:    'rgba(232,213,211,0.85)',
    textSecondary:  'rgba(160,128,128,0.55)',
  },
  ocean: {
    key:         'ocean',
    displayName: 'choice',
    gold:        '#5ec8ed',
    goldRgb:     '94,200,237',
    bgBase:      '#060d1a',
    bgSurface:   '#0c1628',
    bgPanel:     '#0f1d33',
    textPrimary:    'rgba(200,223,240,0.85)',
    textSecondary:  'rgba(94,141,168,0.55)',
  },
  gold: {
    key:         'gold',
    displayName: 'desire',
    gold:        '#f6c177',
    goldRgb:     '246,193,119',
    bgBase:      '#1a1208',
    bgSurface:   '#221810',
    bgPanel:     '#2a1e14',
    textPrimary:    'rgba(240,228,204,0.85)',
    textSecondary:  'rgba(155,128,96,0.55)',
  },
  iris: {
    key:         'iris',
    displayName: 'still-pine',
    gold:        '#c4a7e7',
    goldRgb:     '196,167,231',
    bgBase:      '#14111e',
    bgSurface:   '#1f1d2e',
    bgPanel:     '#241f38',
    textPrimary:    'rgba(224,222,244,0.85)',
    textSecondary:  'rgba(110,106,134,0.55)',
  },
}

export function getPhase(hour) {
  if (hour >= 6  && hour < 11) return 'ocean'
  if (hour >= 11 && hour < 17) return 'gold'
  if (hour >= 17 && hour < 21) return 'iris'
  return 'rose'
}
