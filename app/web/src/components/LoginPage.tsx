import { useState } from 'react'
import { Mail, KeyRound, Loader2, CheckCircle, CircleDot } from 'lucide-react'
import { requestCode, loginWithCode } from '@/lib/api'
import { useI18n } from '@/lib/i18n'

type Step = 'initial' | 'code_sent' | 'logging_in' | 'success'

export function LoginPage({ onLogin }: { onLogin: () => void }) {
  const { t } = useI18n()
  const [step, setStep] = useState<Step>('initial')
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleRequestCode = async () => {
    setLoading(true)
    setError(null)
    try {
      await requestCode()
      setStep('code_sent')
    } catch (err) {
      setError(err instanceof Error ? err.message : t('login.sendFailed'))
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async () => {
    if (!code.trim()) return
    setLoading(true)
    setError(null)
    setStep('logging_in')
    try {
      await loginWithCode(code.trim())
      setStep('success')
      setTimeout(onLogin, 1000)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('login.failed'))
      setStep('code_sent')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-safe py-8">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="ico mb-3">
            <CircleDot />
          </span>
          <h1 className="text-2xl font-semibold tracking-tight">Roborock</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--ink-3)' }}>
            {t('login.sub')}
          </p>
        </div>

        <div className="card p-5">
          {step === 'success' ? (
            <div className="py-4 text-center">
              <CheckCircle className="mx-auto mb-3 size-10" style={{ color: 'var(--ok)' }} />
              <p className="font-medium">{t('login.done')}</p>
              <p className="mt-1 text-sm" style={{ color: 'var(--ink-3)' }}>
                {t('login.starting')}
              </p>
            </div>
          ) : step === 'initial' ? (
            <>
              <p className="mb-4 text-sm" style={{ color: 'var(--ink-3)' }}>
                {t('login.intro')}
              </p>
              <button className="btn primary w-full" onClick={handleRequestCode} disabled={loading}>
                {loading ? <Loader2 className="size-5 animate-spin" /> : <Mail className="size-5" />}
                {loading ? t('login.sending') : t('login.send')}
              </button>
            </>
          ) : (
            <>
              <p className="mb-4 text-sm" style={{ color: 'var(--ink-3)' }}>
                {t('login.enter')}
              </p>
              <label className="field mb-3">
                <KeyRound className="size-4" style={{ color: 'var(--ink-3)' }} />
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  placeholder={t('login.code')}
                  autoFocus
                />
              </label>
              <button className="btn primary w-full" onClick={handleLogin} disabled={loading || !code.trim()}>
                {loading ? <Loader2 className="size-5 animate-spin" /> : t('login.signin')}
              </button>
              <button className="btn mt-2 w-full" onClick={handleRequestCode} disabled={loading}>
                {t('login.resend')}
              </button>
            </>
          )}

          {error && (
            <div className="alert-banner mt-4 text-sm">
              <span>{error}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
