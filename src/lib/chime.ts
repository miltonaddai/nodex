/**
 * A short two-note chime made with Web Audio, so there is no sound file to ship.
 *
 * Browsers only allow audio after the user has interacted with the page, so the audio context
 * is created (or resumed) on the first click or key press. A chime before that is silently
 * skipped; the toast still shows.
 */
let context: AudioContext | null = null

function unlock() {
  try {
    context ??= new AudioContext()
    if (context.state === 'suspended') void context.resume()
  } catch {
    // Web Audio unavailable. Alerts fall back to toasts only.
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('pointerdown', unlock, { passive: true })
  window.addEventListener('keydown', unlock)
}

export function playChime() {
  unlock()
  if (!context || context.state !== 'running') return
  const start = context.currentTime
  // E6 then A6, each a quick bell-like decay.
  for (const [i, frequency] of [1318.5, 1760].entries()) {
    const at = start + i * 0.14
    const osc = context.createOscillator()
    const gain = context.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(frequency, at)
    gain.gain.setValueAtTime(0.0001, at)
    gain.gain.exponentialRampToValueAtTime(0.25, at + 0.015)
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.6)
    osc.connect(gain).connect(context.destination)
    osc.start(at)
    osc.stop(at + 0.65)
  }
}
