class SoundEngine {
  private ctx: AudioContext | null = null
  private bgAudio: HTMLAudioElement | null = null
  private bgFadeTimer: ReturnType<typeof setTimeout> | null = null

  private get ac(): AudioContext {
    if (!this.ctx) this.ctx = new AudioContext()
    if (this.ctx.state === 'suspended') this.ctx.resume()
    return this.ctx
  }

  // 리버브 생성
  private makeReverb(ac: AudioContext, duration = 1.5): ConvolverNode {
    const rate = ac.sampleRate
    const len = rate * duration
    const buf = ac.createBuffer(2, len, rate)
    for (let ch = 0; ch < 2; ch++) {
      const data = buf.getChannelData(ch)
      for (let i = 0; i < len; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.5)
      }
    }
    const conv = ac.createConvolver()
    conv.buffer = buf
    return conv
  }

  // 트럼펫 느낌 단음 재생 (배음 레이어)
  private playBrass(
    ac: AudioContext,
    dest: AudioNode,
    freq: number,
    start: number,
    dur: number,
    vol = 0.22
  ) {
    // 배음: 1x 2x 3x 4x (진폭 점점 감소)
    const harmonics: [number, number][] = [[1, 1.0], [2, 0.5], [3, 0.25], [4, 0.1]]
    harmonics.forEach(([mult, amp]) => {
      const osc = ac.createOscillator()
      const gain = ac.createGain()
      osc.connect(gain)
      gain.connect(dest)
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq * mult, start)
      // 약간의 비브라토
      if (mult === 1) {
        osc.frequency.setValueAtTime(freq, start + 0.05)
        osc.frequency.linearRampToValueAtTime(freq * 1.008, start + 0.12)
        osc.frequency.linearRampToValueAtTime(freq * 0.995, start + 0.2)
        osc.frequency.linearRampToValueAtTime(freq, start + dur)
      }
      gain.gain.setValueAtTime(0, start)
      gain.gain.linearRampToValueAtTime(vol * amp, start + 0.04)
      gain.gain.setValueAtTime(vol * amp * 0.85, start + dur - 0.05)
      gain.gain.linearRampToValueAtTime(0, start + dur + 0.03)
      osc.start(start)
      osc.stop(start + dur + 0.08)
    })
  }

  // 짧은 클릭 틱 (세그먼트 넘어갈 때)
  tick(speed: number) {
    const ac = this.ac
    const t = ac.currentTime
    const buf = ac.createBuffer(1, ac.sampleRate * 0.04, ac.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ac.sampleRate * 0.008))
    }
    const src = ac.createBufferSource()
    src.buffer = buf
    const gain = ac.createGain()
    gain.gain.setValueAtTime(Math.min(0.15 + speed * 0.25, 0.4), t)
    src.connect(gain)
    gain.connect(ac.destination)
    src.start(t)
  }

  // 회전 시작 휘파람
  spinStart() {
    const ac = this.ac
    const t = ac.currentTime
    const osc = ac.createOscillator()
    const gain = ac.createGain()
    osc.connect(gain)
    gain.connect(ac.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(180, t)
    osc.frequency.exponentialRampToValueAtTime(900, t + 0.45)
    gain.gain.setValueAtTime(0.35, t)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45)
    osc.start(t)
    osc.stop(t + 0.45)
  }

  // 1등 웅장한 팡파레 (MP3)
  winGrand() {
    const audio = new Audio('/sounds/win_grand.mp3')
    audio.volume = 1.0
    audio.play().catch(() => {})
  }

  // 2등
  win2nd() {
    const audio = new Audio('/sounds/win_2nd.mp3')
    audio.volume = 1.0
    audio.play().catch(() => {})
  }

  // 3등 이하
  winNormal() {
    const audio = new Audio('/sounds/win_normal.mp3')
    audio.volume = 1.0
    audio.play().catch(() => {})
  }

  bgStart() {
    if (!this.bgAudio) {
      this.bgAudio = new Audio('/sounds/bg_music.mp3')
      this.bgAudio.loop = true
      this.bgAudio.preload = 'auto'
      this.bgAudio.volume = 0.8
    }
    if (this.bgFadeTimer) clearTimeout(this.bgFadeTimer)
    this.bgAudio.volume = 0.8
    if (this.bgAudio.paused) {
      this.bgAudio.play().catch((e) => console.error('[bgMusic] play failed:', e))
    }
  }

  bgPause() {
    if (!this.bgAudio) return
    if (this.bgFadeTimer) clearTimeout(this.bgFadeTimer)
    this.bgAudio.pause()
  }

  bgDuck(duckDuration = 4000) {
    if (!this.bgAudio) return
    if (this.bgFadeTimer) clearTimeout(this.bgFadeTimer)
    this.bgAudio.volume = 0.08
    this.bgFadeTimer = setTimeout(() => {
      this._bgFadeIn(0.08, 0.8, 1500)
    }, duckDuration)
  }

  private _bgFadeIn(from: number, to: number, duration: number) {
    if (!this.bgAudio) return
    const steps = 30
    const interval = duration / steps
    const step = (to - from) / steps
    let current = from
    const timer = setInterval(() => {
      if (!this.bgAudio) { clearInterval(timer); return }
      current = Math.min(current + step, to)
      this.bgAudio.volume = current
      if (current >= to) clearInterval(timer)
    }, interval)
  }

  bgStop() {
    if (!this.bgAudio) return
    if (this.bgFadeTimer) clearTimeout(this.bgFadeTimer)
    const audio = this.bgAudio
    let vol = audio.volume
    const timer = setInterval(() => {
      vol = Math.max(vol - 0.05, 0)
      audio.volume = vol
      if (vol <= 0) { clearInterval(timer); audio.pause() }
    }, 50)
  }

  // MP3 TTS 재생
  playTTS(path: string, delay = 0) {
    setTimeout(() => {
      const audio = new Audio(path)
      audio.volume = 1.0
      audio.play().catch(() => {})
    }, delay)
  }

  // 꽝
  consolation() {
    const ac = this.ac
    const t = ac.currentTime
    const notes = [350, 280, 220]
    notes.forEach((freq, i) => {
      const osc = ac.createOscillator()
      const gain = ac.createGain()
      osc.connect(gain)
      gain.connect(ac.destination)
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(freq, t + i * 0.18)
      osc.frequency.linearRampToValueAtTime(freq * 0.85, t + i * 0.18 + 0.25)
      gain.gain.setValueAtTime(0, t + i * 0.18)
      gain.gain.linearRampToValueAtTime(0.25, t + i * 0.18 + 0.03)
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.18 + 0.3)
      osc.start(t + i * 0.18)
      osc.stop(t + i * 0.18 + 0.3)
    })
  }
}

export const soundEngine = new SoundEngine()
