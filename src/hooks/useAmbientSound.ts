'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

export type SoundId = 'white' | 'pink' | 'rain' | 'forest' | 'cafe' | 'fireplace'

export interface SoundProfile {
  id: SoundId
  label: string
  emoji: string
  tier: 'free' | 'pro'
  description: string
  /** URL or /public path to an audio file. If omitted, falls back to Web Audio synthesis. */
  src?: string
  /** Volume multiplier to normalize loudness across files (default: 1.0). */
  gainMultiplier?: number
}

export const SOUND_PROFILES: SoundProfile[] = [
  {
    id: 'white',
    label: '화이트 노이즈',
    emoji: '〰️',
    tier: 'free',
    description: '집중에 최적화된 균일한 노이즈',
    // Synthesized — no file needed
  },
  {
    id: 'pink',
    label: '핑크 노이즈',
    emoji: '🌸',
    tier: 'free',
    description: '자연스럽고 부드러운 노이즈',
    // Synthesized — no file needed
  },
  {
    id: 'rain',
    label: '빗소리',
    emoji: '🌧️',
    tier: 'free',
    description: '차분한 빗소리 분위기',
    src: '/sounds/rain.mp3',
    gainMultiplier: 2.0,
  },
  {
    id: 'forest',
    label: '숲속',
    emoji: '🌿',
    tier: 'pro',
    description: '새소리와 바람이 섞인 숲 분위기',
    src: '/sounds/forest.mp3',
    gainMultiplier: 2.0,
  },
  {
    id: 'cafe',
    label: '카페',
    emoji: '☕',
    tier: 'pro',
    description: '카페에서 집중하는 느낌',
    src: '/sounds/cafe.mp3',
  },
  {
    id: 'fireplace',
    label: '벽난로',
    emoji: '🔥',
    tier: 'pro',
    description: '아늑한 장작 타는 소리',
    src: '/sounds/fireplace.mp3',
    gainMultiplier: 2.0,
  },
]

// ---------------------------------------------------------------------------
// Noise buffer generators (used as fallback when no src is provided)
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
  let b0 = 0,
    b1 = 0,
    b2 = 0,
    b3 = 0,
    b4 = 0,
    b5 = 0,
    b6 = 0
  for (let i = 0; i < n; i++) {
    const w = Math.random() * 2 - 1
    b0 = 0.99886 * b0 + w * 0.0555179
    b1 = 0.99332 * b1 + w * 0.0750759
    b2 = 0.969 * b2 + w * 0.153852
    b3 = 0.8665 * b3 + w * 0.3104856
    b4 = 0.55 * b4 + w * 0.5329522
    b5 = -0.7616 * b5 - w * 0.016898
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
// Sound node types
// ---------------------------------------------------------------------------

interface SoundNodes {
  /** Non-null when using Web Audio synthesis */
  source: AudioBufferSourceNode | null
  /** Non-null when using an HTML audio element (file/URL playback) */
  audioEl: HTMLAudioElement | null
  gain: GainNode
  extras: AudioNode[]
}

// ---------------------------------------------------------------------------
// Graph builders
// ---------------------------------------------------------------------------

function buildSynthGraph(ctx: AudioContext, id: SoundId, masterGain: GainNode): SoundNodes {
  const extras: AudioNode[] = []

  switch (id) {
    case 'white': {
      const buf = buildWhiteNoiseBuffer(ctx)
      const src = ctx.createBufferSource()
      src.buffer = buf
      src.loop = true
      const gain = ctx.createGain()
      gain.gain.value = 0.15
      src.connect(gain)
      gain.connect(masterGain)
      extras.push(gain)
      return { source: src, audioEl: null, gain, extras }
    }

    case 'pink': {
      const buf = buildPinkNoiseBuffer(ctx)
      const src = ctx.createBufferSource()
      src.buffer = buf
      src.loop = true
      const gain = ctx.createGain()
      gain.gain.value = 0.3
      src.connect(gain)
      gain.connect(masterGain)
      extras.push(gain)
      return { source: src, audioEl: null, gain, extras }
    }

    case 'rain': {
      const buf = buildBrownNoiseBuffer(ctx)
      const src = ctx.createBufferSource()
      src.buffer = buf
      src.loop = true
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
      return { source: src, audioEl: null, gain, extras }
    }

    default:
      throw new Error(`No synth fallback for sound: ${id}`)
  }
}

function buildUrlSoundNodes(
  ctx: AudioContext,
  src: string,
  masterGain: GainNode,
  gainMultiplier = 1.0,
): SoundNodes {
  const audioEl = new Audio()
  audioEl.src = src
  audioEl.loop = true
  audioEl.crossOrigin = 'anonymous'
  const mediaSource = ctx.createMediaElementSource(audioEl)
  const gain = ctx.createGain()
  gain.gain.value = gainMultiplier
  mediaSource.connect(gain)
  gain.connect(masterGain)
  return { source: null, audioEl, gain, extras: [mediaSource] }
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
  useEffect(() => {
    volumeRef.current = volume
  })

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
        const { source, audioEl, extras } = nodesRef.current
        if (audioEl) {
          audioEl.pause()
          audioEl.src = ''
        }
        if (source) {
          source.stop()
          source.disconnect()
        }
        for (const node of extras) {
          if (node instanceof OscillatorNode) {
            try {
              node.stop()
            } catch {
              /* already stopped */
            }
          }
          node.disconnect()
        }
      } catch {
        /* ignore */
      }
      nodesRef.current = null
    }
  }, [])

  const play = useCallback(
    (id: SoundId) => {
      stopCurrent()
      const ctx = getCtx()
      if (ctx.state === 'suspended') ctx.resume()

      const profile = SOUND_PROFILES.find((p) => p.id === id)!

      if (profile.src) {
        const nodes = buildUrlSoundNodes(
          ctx,
          profile.src,
          masterRef.current!,
          profile.gainMultiplier,
        )
        nodesRef.current = nodes
        setActiveSound(id)
        setPlaying(true)
        nodes.audioEl!.play().catch(() => {
          // File not found — fall back to synthesis if possible
          stopCurrent()
          try {
            const fallback = buildSynthGraph(ctx, id, masterRef.current!)
            fallback.source!.start()
            nodesRef.current = fallback
          } catch {
            setPlaying(false)
            setActiveSound(null)
          }
        })
      } else {
        const nodes = buildSynthGraph(ctx, id, masterRef.current!)
        nodes.source!.start()
        nodesRef.current = nodes
        setActiveSound(id)
        setPlaying(true)
      }
    },
    [stopCurrent],
  )

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

  const notifyTimerStatus = useCallback(
    (status: 'running' | 'paused' | 'stopped') => {
      if (!autoPlay) return
      if (status === 'running' && !playing) {
        play('pink')
      } else if ((status === 'paused' || status === 'stopped') && playing) {
        stop()
      }
    },
    [autoPlay, playing, play, stop],
  )

  useEffect(() => {
    return () => {
      stopCurrent()
      ctxRef.current?.close()
    }
  }, [stopCurrent])

  return {
    playing,
    activeSound,
    volume,
    autoPlay,
    play,
    stop,
    setVolume,
    setAutoPlay,
    notifyTimerStatus,
  }
}
