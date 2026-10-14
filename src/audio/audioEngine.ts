/**
 * One AudioContext for every synthesized sound (Design.md 17). Three volume groups:
 * notify (ding, poll), effects (high-five clap), soundboard. Created lazily on the first user gesture.
 */
export type SoundGroup = 'notify' | 'effects' | 'soundboard'

interface AudioGraph {
  readonly ctx: AudioContext
  readonly groups: Record<SoundGroup, GainNode>
}

let graph: AudioGraph | null = null
const readyListeners: Array<(audio: AudioGraph) => void> = []

/** Run once the AudioContext exists (immediately if it already does). Used to preload sound files. */
export function onAudioReady(listener: (audio: AudioGraph) => void) {
  if (graph) listener(graph)
  else readyListeners.push(listener)
}
const volumes: Record<SoundGroup, number> = { notify: 0.8, effects: 0.9, soundboard: 0.6 }
const muted: Record<SoundGroup, boolean> = { notify: false, effects: false, soundboard: false }

function build(): AudioGraph | null {
  const Ctor = window.AudioContext
  if (!Ctor) return null
  const ctx = new Ctor()
  const master = ctx.createGain()
  master.gain.value = 0.9
  master.connect(ctx.destination)
  const make = (g: SoundGroup) => {
    const node = ctx.createGain()
    node.gain.value = muted[g] ? 0 : volumes[g]
    node.connect(master)
    return node
  }
  return { ctx, groups: { notify: make('notify'), effects: make('effects'), soundboard: make('soundboard') } }
}

/** Call from a user gesture. Safe to call repeatedly. */
export function unlockAudio() {
  if (!graph) {
    graph = build()
    if (graph) for (const listener of readyListeners.splice(0)) listener(graph)
  }
  if (graph && graph.ctx.state === 'suspended') void graph.ctx.resume()
}

export function installAudioUnlock() {
  const handler = () => unlockAudio()
  window.addEventListener('pointerdown', handler, { capture: true })
  window.addEventListener('keydown', handler, { capture: true })
}

export function getAudio(): AudioGraph | null {
  return graph && graph.ctx.state === 'running' ? graph : null
}

export function setGroupVolume(group: SoundGroup, value: number) {
  volumes[group] = value
  if (graph && !muted[group]) graph.groups[group].gain.value = value
}

export function setGroupMuted(group: SoundGroup, isMuted: boolean) {
  muted[group] = isMuted
  if (graph) graph.groups[group].gain.value = isMuted ? 0 : volumes[group]
}

export function getGroupVolume(group: SoundGroup): number {
  return volumes[group]
}

export function isGroupMuted(group: SoundGroup): boolean {
  return muted[group]
}
