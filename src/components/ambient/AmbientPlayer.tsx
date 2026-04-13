'use client'

import { useCallback } from 'react'
import { Volume2, VolumeX, Play, Square, Lock } from 'lucide-react'
import { SOUND_PROFILES, SoundId, UseAmbientSoundReturn } from '@/hooks/useAmbientSound'

interface AmbientPlayerProps {
  sound: UseAmbientSoundReturn
  userTier?: 'free' | 'pro' | 'team'
}

export function AmbientPlayer({ sound, userTier = 'free' }: AmbientPlayerProps) {
  const { playing, activeSound, volume, autoPlay, play, stop, setVolume, setAutoPlay } = sound

  const handleSoundClick = useCallback(
    (id: SoundId) => {
      if (activeSound === id && playing) {
        stop()
      } else {
        play(id)
      }
    },
    [activeSound, playing, play, stop],
  )

  const canPlay = (tier: 'free' | 'pro') =>
    tier === 'free' || userTier === 'pro' || userTier === 'team'

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-4 w-full max-w-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">앰비언트 사운드</h2>
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none">
          <input
            type="checkbox"
            checked={autoPlay}
            onChange={(e) => setAutoPlay(e.target.checked)}
            className="rounded"
          />
          타이머 연동
        </label>
      </div>

      {/* Sound grid */}
      <div className="grid grid-cols-3 gap-2">
        {SOUND_PROFILES.map((profile) => {
          const unlocked = canPlay(profile.tier)
          const isActive = activeSound === profile.id && playing
          return (
            <button
              key={profile.id}
              onClick={() => unlocked && handleSoundClick(profile.id)}
              title={profile.description}
              disabled={!unlocked}
              className={`relative flex flex-col items-center gap-1 rounded-lg border px-2 py-3 text-center transition-all
                ${
                  isActive
                    ? 'border-primary bg-primary/10 text-primary'
                    : unlocked
                      ? 'border-border hover:border-primary/50 hover:bg-muted'
                      : 'border-border bg-muted/30 cursor-not-allowed opacity-60'
                }`}
            >
              <span className="text-xl leading-none">{profile.emoji}</span>
              <span className="text-[10px] font-medium leading-tight">{profile.label}</span>
              {!unlocked && (
                <Lock className="absolute top-1.5 right-1.5 h-2.5 w-2.5 text-muted-foreground" />
              )}
              {isActive && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="block h-2 w-0.5 rounded-full bg-primary animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Volume control */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setVolume(volume === 0 ? 0.5 : 0)}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          {volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </button>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
          className="flex-1 h-1.5 accent-primary cursor-pointer"
        />
        <span className="text-xs text-muted-foreground w-8 text-right">
          {Math.round(volume * 100)}%
        </span>
      </div>

      {/* Status */}
      {playing && activeSound && (
        <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border pt-3">
          <span>재생 중: {SOUND_PROFILES.find((p) => p.id === activeSound)?.label}</span>
          <button
            onClick={stop}
            className="flex items-center gap-1 rounded px-2 py-0.5 hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <Square className="h-3 w-3" />
            중지
          </button>
        </div>
      )}

      {userTier === 'free' && (
        <p className="text-[10px] text-muted-foreground">🔒 Pro 플랜에서 모든 사운드 이용 가능</p>
      )}
    </div>
  )
}
