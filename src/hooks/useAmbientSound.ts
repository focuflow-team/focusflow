'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

export type SoundId = 'white' | 'pink' | 'rain' | 'forest' | 'cafe' | 'lofi'

export interface SoundProfile {
  id: SoundId
  label: string
  emoji: string
  tier: 'free' | 'pro'
  description: string
}

export const SOUND_PROFILES: SoundProfile[] = [
  { id: 'white',  label: '화이트 노이즈', emoji: '〰️', tier: 'free', description: '집중에 최적화된 균일한 노이즈' },
  { id: 'pink',   label: '핑크 노이즈',   emoji: '🌸', tier: 'free', description: '자연스럽고 부드러운 노이즈' },
  { id: 'rain',   label: '빗소리',         emoji: '🌧️', tier: 'free', description: '차분한 빗소리 분위기' },
  { id: 'forest', label: '숲속',            emoji: '🌿', tier: 'pro',  description: '새소리와 바람이 섞인 숲 분위기' },
  { id: 'cafe',   label: '카페',            emoji: '☕', tier: 'pro',  description: '카페에서 집중하는 느낌' },
  { id: 'lofi',   label: 'Lo-Fi',           emoji: '🎵', tier: 'pro',  description: '빈티지 감성의 로우파이 분위기' },
]

// ---------------------------------------------------------------------------
// Noise buffer generators
// ---------------------------------------------------------------------------

function buildWhiteNoiseBuffer(ctx: AudioContext): AudioBuffer {
  const n = ctx.sampleRate * 3
  const buf = ctx.createBuffer(1, n, ctx.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < n; i++) data[i] = Math.random() * 2 - 1
  return buf
}

function buildPinkNoiseBuffer(ctx: AudioContext): AudioBuffer {
  const n = ctx.sampleRate * 3
  const buf = ctx.createBuffer(1, n, ctx.sampleRate)
  const data = buf.getChannelData(0)
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0
  for (let i = 0; i < n; i++) {
    const w = Math.random() * 2 - 1
    b0 = 0.99886 * b0 + w * 0.0555179
    b1 = 0.99332 * b1 + w * 0.0750759
    b2 = 0.96900 * b2 + w * 0.1538520
    b3 = 0.86650 * b3 + w * 0.3104856
    b4 = 0.55000 * b4 + w * 0.5329522
    b5 = -0.7616 * b5 - w * 0.0168980
    data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11
    b6 = w * 0.115926
  }
  return buf
}

function buildBrownNoiseBuffer(ctx: AudioContext): AudioBuffer {
  const n = ctx.sampleRate * 3
  const buf = ctx.createBuffer(1, n, ctx.sampleRate)
  const data = buf.getChannelData(0)
  let last = 0
  for (let i = 0; i < n; i++) {
    const w = Math.random() * 2 - 1
    data[i] = (last + 0.02 * w) / 1.02
    last = data[i]
    data[i] *= 3.5
  }
  return buf
}

// ---------------------------------------------------------------------------
// Sound graph builders per profile
// ---------------------------------------------------------------------------

interface SoundNodes {
  source: AudioBufferSourceNode
  gain: GainNode
  extras: AudioNode[]
}

function buildSoundGraph(ctx: AudioContext, id: SoundId, masterGain: GainNode): SoundNodes {
  let buffer: AudioBuffer
  const extras: AudioNode[] = []
  let chainEnd: AudioNode = masterGain

  switch (id) {
    case 'white': {
      buffer = buildWhiteNoiseBuffer(ctx)
      const src = ctx.createBufferSource()
      src.buffer = buffer
      src.loop = true
      const gain = ctx.createGain()
      gain.gain.value = 0.15
      src.connect(gain)
      gain.connect(masterGain)
      extras.push(gain)
      return { source: src, gain, extras }
    }

    case 'pink': {
      buffer = buildPinkNoiseBuffer(ctx)
      const src = ctx.createBufferSource()
      src.buffer = buffer
      src.loop = true
      const gain = ctx.createGain()
      gain.gain.value = 0.3
      src.connect(gain)
      gain.connect(masterGain)
      extras.push(gain)
      return { source: src, gain, extras }
    }

    case 'rain': {
      buffer = buildBrownNoiseBuffer(ctx)
      const src = ctx.createBufferSource()
      src.buffer = buffer
      src.loop = true
      // Low-pass filter to make it sound like rain
      const lpf = ctx.createBiquadFilter()
      lpf.type = 'lowpass'
      lpf.frequency.value = 600
      lpf.Q.value = 0.5
      const gain = ctx.createGain()
      gain.gain.value = 0.8
      src.connect(lpf)
      lpf.connect(gain)
      gain.connect(masterGain)
      extras.push(lpf, gain)
      return { source: src, gain, extras }
    }

    case 'forest': {
      buffer = buildPinkNoiseBuffer(ctx)
      const src = ctx.createBufferSource()
      src.buffer = buffer
      src.loop = true
      // Bandpass to emphasize mid frequencies (birds, leaves)
      const bpf = ctx.createBiquadFilter()
      bpf.type = 'bandpass'
      bpf.frequency.value = 1200
      bpf.Q.value = 0.3
      // LFO for wind sway effect
      const lfo = ctx.createOscillator()
      lfo.type = 'sine'
      lfo.frequency.value = 0.15
      const lfoGain = ctx.createGain()
      lfoGain.gain.value = 0.05
      lfo.connect(lfoGain)
      lfoGain.connect(bpf.frequency)
      lfo.start()
      const gain = ctx.createGain()
      gain.gain.value = 0.5
      src.connect(bpf)
      bpf.connect(gain)
      gain.connect(masterGain)
      extras.push(bpf, lfo, lfoGain, gain)
      return { source: src, gain, extras }
    }

    case 'cafe': {
      buffer = buildPinkNoiseBuffer(ctx)
      const src = ctx.createBufferSource()
      src.buffer = buffer
      src.loop = true
      // Multiple bandpass filters for cafe chatter texture
      const bpf1 = ctx.createBiquadFilter()
      bpf1.type = 'bandpass'
      bpf1.frequency.value = 800
      bpf1.Q.value = 0.5
      const bpf2 = ctx.createBiquadFilter()
      bpf2.type = 'bandpass'
      bpf2.frequency.value = 2500
      bpf2.Q.value = 0.8
      const merge = ctx.createGain()
      merge.gain.value = 0.5
      src.connect(bpf1)
      src.connect(bpf2)
      bpf1.connect(merge)
      bpf2.connect(merge)
      const gain = ctx.createGain()
      gain.gain.value = 0.4
      merge.connect(gain)
      gain.connect(masterGain)
      extras.push(bpf1, bpf2, merge, gain)
      return { source: src, gain, extras }
    }

    case 'lofi': {
      buffer = buildBrownNoiseBuffer(ctx)
      const src = ctx.createBufferSource()
      src.buffer = buffer
      src.loop = true
      // Very low-pass for that muffled vinyl feel
      const lpf = ctx.createBiquadFilter()
      lpf.type = 'lowpass'
      lpf.frequency.value = 250
      // High-shelf cut for warmth
      const shelf = ctx.createBiquadFilter()
      shelf.type = 'highshelf'
      shelf.frequency.value = 3000
      shelf.gain.value = -12
      const gain = ctx.createGain()
      gain.gain.value = 0.6
      src.connect(lpf)
      lpf.connect(shelf)
      shelf.connect(gain)
      gain.connect(masterGain)
      extras.push(lpf, shelf, gain)
      return { source: src, gain, extras }
    }

    default:
      throw new Error(`Unknown sound id: ${id}`)
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export interface UseAmbientSoundReturn {
  playing: boolean
  activeSound: SoundId | null
  volume: number
  autoPlay: boolean
  play: (id: SoundId) => void
  stop: () => void
  setVolume: (v: number) => void
  setAutoPlay: (v: boolean) => void
  notifyTimerStatus: (status: 'running' | 'paused' | 'stopped') => void
}

export function useAmbientSound(): UseAmbientSoundReturn {
  const [playing, setPlaying] = useState(false)
  const [activeSound, setActiveSound] = useState<SoundId | null>(null)
  const [volume, setVolumeState] = useState(0.5)
  const [autoPlay, setAutoPlayState] = useState(false)

  const ctxRef = useRef<AudioContext | null>(null)
  const masterRef = useRef<GainNode | null>(null)
  const nodesRef = useRef<SoundNodes | null>(null)
  const volumeRef = useRef(volume)
  volumeRef.current = volume

  function getCtx(): AudioContext {
    if (!ctxRef.current) {
      ctxRef.current = new AudioContext()
      const master = ctxRef.current.createGain()
      master.gain.value = volumeRef.current
      master.connect(ctxRef.current.destination)
      masterRef.current = master
    }
    return ctxRef.current
  }

  const stopCurrent = useCallback(() => {
    if (nodesRef.current) {
      try {
        nodesRef.current.source.stop()
        nodesRef.current.source.disconnect()
        for (const node of nodesRef.current.extras) {
          if (node instanceof OscillatorNode) {
            try { node.stop() } catch { /* already stopped */ }
          }
          node.disconnect()
        }
      } catch { /* ignore */ }
      nodesRef.current = null
    }
  }, [])

  const play = useCallback((id: SoundId) => {
    stopCurrent()
    const ctx = getCtx()
    if (ctx.state === 'suspended') ctx.resume()
    const nodes = buildSoundGraph(ctx, id, masterRef.current!)
    nodes.source.start()
    nodesRef.current = nodes
    setActiveSound(id)
    setPlaying(true)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stopCurrent])

  const stop = useCallback(() => {
    stopCurrent()
    setPlaying(false)
    setActiveSound(null)
  }, [stopCurrent])

  const setVolume = useCallback((v: number) => {
    setVolumeState(v)
    if (masterRef.current) {
      masterRef.current.gain.setTargetAtTime(v, masterRef.current.context.currentTime, 0.05)
    }
  }, [])

  const setAutoPlay = useCallback((v: boolean) => {
    setAutoPlayState(v)
  }, [])

  const notifyTimerStatus = useCallback((status: 'running' | 'paused' | 'stopped') => {
    if (!autoPlay) return
    if (status === 'running' && !playing) {
      // Auto-start with first free sound
      play('pink')
    } else if ((status === 'paused' || status === 'stopped') && playing) {
      stop()
    }
  }, [autoPlay, playing, play, stop])

  useEffect(() => {
    return () => {
      stopCurrent()
      ctxRef.current?.close()
    }
  }, [stopCurrent])

  return { playing, activeSound, volume, autoPlay, play, stop, setVolume, setAutoPlay, notifyTimerStatus }
}
