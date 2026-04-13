import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AmbientPlayer } from './AmbientPlayer'
import type { UseAmbientSoundReturn } from '@/hooks/useAmbientSound'

function makeSoundStub(): UseAmbientSoundReturn {
  return {
    playing: false,
    activeSound: null,
    volume: 0.5,
    autoPlay: false,
    play: vi.fn(),
    stop: vi.fn(),
    setVolume: vi.fn(),
    setAutoPlay: vi.fn(),
    notifyTimerStatus: vi.fn(),
  }
}

describe('AmbientPlayer', () => {
  it('Pro 사운드가 Pro tier에서는 잠금 해제된다', () => {
    render(<AmbientPlayer sound={makeSoundStub()} userTier="pro" />)

    const forest = screen.getByRole('button', { name: /숲속/ })
    expect(forest).not.toBeDisabled()
  })

  it('Pro 사운드가 Team tier에서도 잠금 해제된다', () => {
    render(<AmbientPlayer sound={makeSoundStub()} userTier="team" />)

    expect(screen.getByRole('button', { name: /카페/ })).not.toBeDisabled()
    expect(screen.getByRole('button', { name: /벽난로/ })).not.toBeDisabled()
  })

  it('Free tier에서는 Pro 사운드가 비활성화된다 (회귀 방지)', () => {
    render(<AmbientPlayer sound={makeSoundStub()} userTier="free" />)

    expect(screen.getByRole('button', { name: /숲속/ })).toBeDisabled()
    // Free 사운드는 여전히 활성
    expect(screen.getByRole('button', { name: /화이트 노이즈/ })).not.toBeDisabled()
  })

  it('userTier를 전달하지 않으면 free로 폴백한다 (기본값 검증)', () => {
    render(<AmbientPlayer sound={makeSoundStub()} />)

    expect(screen.getByRole('button', { name: /숲속/ })).toBeDisabled()
  })
})
