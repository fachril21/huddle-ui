import { clamp01, mapLevel, mapRates } from './mapping'
import { NaturalSpeech, seedFromId } from './naturalSpeech'

/** What the engine needs to know about one participant each time inputs change. */
export interface VoiceInput {
  readonly talking: boolean
  readonly level: number
  readonly natural: boolean
  readonly micOn: boolean
}

export interface VoiceSnapshot {
  /** Tiles that currently render aurora / neon (speaking, holding, fading, or briefly evicting) */
  readonly rendered: ReadonlySet<string>
  readonly dominantId: string | null
  /** Tiles whose owner is speaking right now (excludes hold/fade), used for paging hints */
  readonly speaking: ReadonlySet<string>
  /** Self is talking with the mic off (amber neon + banner) */
  readonly mutedSpeaking: boolean
  /** Two or more tiles speaking: ambient warms slightly */
  readonly crosstalk: boolean
}

const GATE_ON = 0.12
const GATE_OFF = 0.08
const ATTACK_MS = 60
const RELEASE_MS = 280
const RISE_MS = 80
const HOLD_MS = 400
const FADE_MS = 600
const EVICT_FADE_MS = 300
const MAX_LIT = 3
const EVICT_MARGIN = 0.15
const DOMINANT_MARGIN = 0.1
const DOMINANT_DWELL_MS = 600
const MUTED_HOLD_MS = 1200
const RING_LEVEL = 0.6
const RING_INTERVAL_MS = 700
const RING_DURATION_MS = 700
const ANIM_SYNC_MS = 100
const MAX_DT_MS = 100
const WRITE_EPSILON = 0.004

type Phase = 'idle' | 'speaking' | 'hold' | 'fading'

interface VoiceState {
  readonly id: string
  readonly natural: NaturalSpeech
  el: HTMLElement | null
  input: VoiceInput
  phase: Phase
  gate: boolean
  slotted: boolean
  /** smoothed level, frozen while holding/fading */
  level: number
  /** visibility multiplier 0..1 (rises on speech, falls on hold-end / eviction) */
  fade: number
  holdUntil: number
  fadeStart: number
  fadeFrom: number
  evictStart: number
  evictFrom: number
  evicting: boolean
  lastRing: number
  written: Record<string, number>
}

const easeOut = (t: number) => 1 - Math.pow(1 - clamp01(t), 2)

/**
 * Simulated voice engine. One rAF loop turns Demo Director inputs into per-tile CSS variables,
 * written straight to the DOM so React never re-renders at frame rate. React only hears about
 * membership changes (who is lit / dominant) through the snapshot.
 */
export class VoiceEngine {
  private readonly selfId: string
  private readonly states = new Map<string, VoiceState>()
  /** Tile elements may register before their first inputs arrive */
  private readonly elements = new Map<string, HTMLElement>()
  private readonly listeners = new Set<() => void>()
  private snapshot: VoiceSnapshot = { rendered: new Set(), dominantId: null, speaking: new Set(), mutedSpeaking: false, crosstalk: false }
  private snapshotKey = ''
  private raf = 0
  private lastTick = 0
  private lastAnimSync = 0
  private dominantId: string | null = null
  private challengerId: string | null = null
  private challengerSince = 0
  private mutedGate = false
  private mutedUntil = 0
  private reducedMotion = false

  constructor(selfId: string) {
    this.selfId = selfId
  }

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  getSnapshot = (): VoiceSnapshot => this.snapshot

  setReducedMotion(reduced: boolean) {
    this.reducedMotion = reduced
  }

  setInputs(inputs: Readonly<Record<string, VoiceInput>>) {
    for (const [id, input] of Object.entries(inputs)) {
      const state = this.states.get(id) ?? this.createState(id, input)
      state.input = input
    }
  }

  /** Attach the tile element that receives CSS variables. Pass null to detach. */
  register(id: string, el: HTMLElement | null) {
    if (el) this.elements.set(id, el)
    else this.elements.delete(id)
    const state = this.states.get(id)
    if (!state) return
    state.el = el
    state.written = {}
  }

  start() {
    if (this.raf) return
    this.lastTick = performance.now()
    const loop = (now: number) => {
      this.tick(now)
      this.raf = requestAnimationFrame(loop)
    }
    this.raf = requestAnimationFrame(loop)
  }

  stop() {
    cancelAnimationFrame(this.raf)
    this.raf = 0
  }

  private createState(id: string, input: VoiceInput): VoiceState {
    const state: VoiceState = {
      id,
      natural: new NaturalSpeech(seedFromId(id)),
      el: this.elements.get(id) ?? null,
      input,
      phase: 'idle',
      gate: false,
      slotted: false,
      level: 0,
      fade: 0,
      holdUntil: 0,
      fadeStart: 0,
      fadeFrom: 0,
      evictStart: 0,
      evictFrom: 0,
      evicting: false,
      lastRing: 0,
      written: {},
    }
    this.states.set(id, state)
    return state
  }

  private tick(now: number) {
    const dt = Math.min(now - this.lastTick, MAX_DT_MS)
    this.lastTick = now
    const all = [...this.states.values()]

    for (const s of all) this.stepPhysics(s, now, dt)
    this.assignSlots(all, now)
    this.pickDominant(all, now)

    const rendered = all.filter((s) => s.slotted || s.evicting)
    for (const s of rendered) this.writeVars(s, now)
    for (const s of all) if (!s.slotted && !s.evicting && s.el && Object.keys(s.written).length) this.clearVars(s)
    if (now - this.lastAnimSync >= ANIM_SYNC_MS) {
      this.lastAnimSync = now
      for (const s of rendered) this.syncRates(s)
    }
    this.publish(all, rendered)
  }

  private rawLevel(s: VoiceState, now: number): number {
    if (!s.input.talking) return 0
    const base = clamp01(s.input.level)
    return s.input.natural ? base * s.natural.step(now) : base
  }

  private stepPhysics(s: VoiceState, now: number, dt: number) {
    const raw = this.rawLevel(s, now)
    const eligible = s.input.micOn ? raw : 0

    if (s.id === this.selfId) this.trackMutedSelf(s.input.micOn ? 0 : raw, now)

    if (!s.gate && eligible >= GATE_ON) s.gate = true
    else if (s.gate && eligible < GATE_OFF) s.gate = false

    if (s.evicting) {
      const t = (now - s.evictStart) / EVICT_FADE_MS
      s.fade = s.evictFrom * (1 - easeOut(t))
      if (t >= 1) {
        s.evicting = false
        s.fade = 0
        s.level = 0
        s.phase = s.gate ? 'speaking' : 'idle'
      }
      return
    }

    if (s.gate) {
      const tau = eligible > s.level ? ATTACK_MS : RELEASE_MS
      s.level += (eligible - s.level) * (1 - Math.exp(-dt / tau))
      if (s.slotted) s.fade += (1 - s.fade) * (1 - Math.exp(-dt / RISE_MS))
      s.phase = 'speaking'
      return
    }

    // gate closed
    if (!s.slotted) {
      s.phase = 'idle'
      s.level = 0
      s.fade = 0
      return
    }
    if (s.phase === 'speaking') {
      s.phase = 'hold'
      s.holdUntil = now + HOLD_MS
    }
    if (s.phase === 'hold' && now >= s.holdUntil) {
      s.phase = 'fading'
      s.fadeStart = now
      s.fadeFrom = s.fade
    }
    if (s.phase === 'fading') {
      const t = (now - s.fadeStart) / FADE_MS
      s.fade = s.fadeFrom * (1 - easeOut(t))
      if (t >= 1) {
        s.phase = 'idle'
        s.fade = 0
        s.level = 0
        s.slotted = false
      }
    }
  }

  /** At most MAX_LIT tiles render effects; louder newcomers may evict the weakest (with hysteresis). */
  private assignSlots(all: VoiceState[], now: number) {
    const wanting = all.filter((s) => s.gate && !s.slotted && !s.evicting).sort((a, b) => b.level - a.level)
    for (const candidate of wanting) {
      const held = all.filter((s) => s.slotted && !s.evicting)
      if (held.length < MAX_LIT) {
        candidate.slotted = true
        continue
      }
      const victim = this.pickVictim(held, candidate)
      if (!victim) continue
      victim.slotted = false
      victim.evicting = true
      victim.evictStart = now
      victim.evictFrom = victim.fade
      candidate.slotted = true
    }
  }

  private pickVictim(held: VoiceState[], candidate: VoiceState): VoiceState | null {
    const quiet = held.filter((s) => s.phase !== 'speaking').sort((a, b) => a.fade - b.fade)
    if (quiet.length) return quiet[0]
    const weakest = [...held].sort((a, b) => a.level - b.level)[0]
    return candidate.level > weakest.level + EVICT_MARGIN ? weakest : null
  }

  private pickDominant(all: VoiceState[], now: number) {
    const speaking = all.filter((s) => s.slotted && s.phase === 'speaking').sort((a, b) => b.level - a.level)
    const current = speaking.find((s) => s.id === this.dominantId)
    if (!current) {
      this.dominantId = speaking[0]?.id ?? null
      this.challengerId = null
      return
    }
    const best = speaking[0]
    if (best.id !== current.id && best.level > current.level + DOMINANT_MARGIN) {
      if (this.challengerId !== best.id) {
        this.challengerId = best.id
        this.challengerSince = now
      } else if (now - this.challengerSince >= DOMINANT_DWELL_MS) {
        this.dominantId = best.id
        this.challengerId = null
      }
    } else {
      this.challengerId = null
    }
  }

  private trackMutedSelf(raw: number, now: number) {
    if (!this.mutedGate && raw >= GATE_ON) this.mutedGate = true
    else if (this.mutedGate && raw < GATE_OFF) this.mutedGate = false
    if (this.mutedGate) this.mutedUntil = now + MUTED_HOLD_MS
  }

  private writeVars(s: VoiceState, now: number) {
    const el = s.el
    if (!el) return
    const v = mapLevel(s.level, s.fade)
    this.setVar(s, '--lvl', v.lvl)
    this.setVar(s, '--aurora-o', v.auroraOpacity)
    this.setVar(s, '--ring-o', v.auroraOpacity)
    this.setVar(s, '--blob-s', v.blobScale)
    this.setVar(s, '--sat', v.saturate)
    this.setVar(s, '--neon-o', v.neonOpacity)
    this.setVar(s, '--glow-in-o', v.glowInOpacity)
    this.setVar(s, '--glow-out-o', v.glowOutOpacity)

    if (!this.reducedMotion && s.phase === 'speaking' && s.level > RING_LEVEL && now - s.lastRing >= RING_INTERVAL_MS) {
      s.lastRing = now
      const ring = el.querySelector<HTMLElement>('[data-ring]')
      ring?.animate(
        [
          { transform: 'scale(1)', opacity: 0.7 },
          { transform: 'scale(1.9)', opacity: 0 },
        ],
        { duration: RING_DURATION_MS, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' },
      )
    }
  }

  private setVar(s: VoiceState, name: string, value: number) {
    const prev = s.written[name]
    if (prev !== undefined && Math.abs(prev - value) < WRITE_EPSILON) return
    s.written[name] = value
    s.el?.style.setProperty(name, value.toFixed(3))
  }

  private clearVars(s: VoiceState) {
    for (const name of Object.keys(s.written)) s.el?.style.removeProperty(name)
    s.written = {}
  }

  /** Comet and blob speed follow level through playbackRate, which changes speed without a visible jump. */
  private syncRates(s: VoiceState) {
    if (!s.el) return
    const rates = mapRates(s.level)
    for (const anim of s.el.getAnimations({ subtree: true })) {
      const name = (anim as CSSAnimation).animationName
      if (!name) continue
      if (name.includes('cometSpin')) anim.playbackRate = rates.comet
      else if (name.includes('blobOrbit') || name.includes('curtainSway')) anim.playbackRate = rates.blob
    }
  }

  private publish(all: VoiceState[], rendered: VoiceState[]) {
    const now = this.lastTick
    const ids = rendered.map((s) => s.id).sort()
    const speakingIds = all.filter((s) => s.slotted && s.phase === 'speaking').map((s) => s.id).sort()
    const speakingCount = speakingIds.length
    const mutedSpeaking = this.mutedGate || now < this.mutedUntil
    const crosstalk = speakingCount >= 2
    const key = `${ids.join(',')}|${speakingIds.join(',')}|${this.dominantId ?? ''}|${mutedSpeaking}|${crosstalk}`
    if (key === this.snapshotKey) return
    this.snapshotKey = key
    this.snapshot = { rendered: new Set(ids), dominantId: this.dominantId, speaking: new Set(speakingIds), mutedSpeaking, crosstalk }
    for (const l of this.listeners) l()
  }
}
