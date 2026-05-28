let _enabled = localStorage.getItem('athena_sound') === 'on'
let _ctx = null

function ctx() {
  if (!_ctx) _ctx = new (window.AudioContext || window.webkitAudioContext)()
  return _ctx
}

function tone(freq, type, volume, duration, delay = 0) {
  const c = ctx()
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.type = type
  osc.frequency.value = freq
  osc.connect(gain)
  gain.connect(c.destination)
  const t = c.currentTime + delay
  gain.gain.setValueAtTime(0, t)
  gain.gain.linearRampToValueAtTime(volume, t + 0.006)
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration)
  osc.start(t)
  osc.stop(t + duration + 0.01)
}

export function isSoundEnabled() { return _enabled }

export function setSoundEnabled(val) {
  _enabled = val
  localStorage.setItem('athena_sound', val ? 'on' : 'off')
}

export function playClick() {
  if (!_enabled) return
  try { tone(1100, 'square', 0.035, 0.018) } catch {}
}

export function playChime() {
  if (!_enabled) return
  try {
    tone(523, 'sine', 0.10, 0.3, 0)
    tone(659, 'sine', 0.10, 0.3, 0.1)
    tone(784, 'sine', 0.09, 0.35, 0.2)
  } catch {}
}

export function playFanfare() {
  if (!_enabled) return
  try {
    tone(523,  'sine', 0.13, 0.45, 0)
    tone(659,  'sine', 0.13, 0.45, 0.1)
    tone(784,  'sine', 0.13, 0.45, 0.2)
    tone(1047, 'sine', 0.16, 0.75, 0.3)
  } catch {}
}
