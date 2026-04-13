'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, X, Share } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function PWAInstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [showIOSGuide, setShowIOSGuide] = useState(false)

  useEffect(() => {
    const alreadyDismissed = sessionStorage.getItem('pwa-prompt-dismissed')
    if (alreadyDismissed) {
      setDismissed(true)
      return
    }

    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true
    setIsStandalone(standalone)
    if (standalone) return

    const ios =
      /iPad|iPhone|iPod/.test(navigator.userAgent) &&
      !(window as Window & { MSStream?: unknown }).MSStream
    setIsIOS(ios)

    const handler = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  function dismiss() {
    sessionStorage.setItem('pwa-prompt-dismissed', '1')
    setDismissed(true)
    setShowIOSGuide(false)
  }

  async function handleInstall() {
    if (!installPrompt) return
    await installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice
    if (outcome === 'accepted') {
      setInstallPrompt(null)
      setDismissed(true)
    }
  }

  const visible = !isStandalone && !dismissed && (!!installPrompt || isIOS)

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-sm"
        >
          <div className="rounded-2xl border border-border bg-card shadow-lg p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary">
                <Download className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">앱으로 설치하기</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  홈 화면에 추가하면 오프라인에서도 타이머를 사용할 수 있어요
                </p>
              </div>
              <button
                onClick={dismiss}
                className="shrink-0 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {isIOS ? (
              <div className="mt-3 space-y-2">
                {!showIOSGuide ? (
                  <button
                    onClick={() => setShowIOSGuide(true)}
                    className="w-full rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
                  >
                    설치 방법 보기
                  </button>
                ) : (
                  <div className="rounded-xl bg-muted p-3 text-xs text-muted-foreground space-y-1">
                    <p className="flex items-center gap-1.5">
                      <Share className="h-3.5 w-3.5 shrink-0" />
                      Safari 하단의 <strong>공유</strong> 버튼을 탭하세요
                    </p>
                    <p className="pl-5">"홈 화면에 추가"를 선택하세요</p>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={handleInstall}
                className="mt-3 w-full rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
              >
                홈 화면에 추가
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
