import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { BrandMark } from '../components/brand-mark'
import { useAuth } from '../context/auth-context'
import { isSupabaseConfigured, requireSupabase } from '../lib/supabase'

export function AdminLoginPage() {
  const { session, isLoading } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isLoading && session) {
    return <Navigate to="/admin" replace />
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage('')

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Informe email e senha.')
      return
    }

    if (!isSupabaseConfigured) {
      setErrorMessage('Configure o Supabase antes de usar o painel administrativo.')
      return
    }

    setIsSubmitting(true)

    try {
      const supabase = requireSupabase()
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      navigate('/admin', { replace: true })
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Falha ao fazer login.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-shell)] px-4 py-12">
      <div className="w-full max-w-md rounded-[32px] bg-white p-8 shadow-[0_24px_80px_rgba(18,39,56,0.12)]">
        <BrandMark />
        <div className="mt-6">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">Painel admin</p>
          <h1 className="mt-2 font-[Fraunces] text-4xl font-bold text-[var(--color-ink)]">Entrar</h1>
          <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">
            Acesso restrito para operação da loja, estoque, pedidos e caixa.
          </p>
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-[var(--color-ink)]">
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-[var(--color-line)] px-4 py-3 outline-none"
            />
          </label>
          <label className="block text-sm font-medium text-[var(--color-ink)]">
            Senha
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-[var(--color-line)] px-4 py-3 outline-none"
            />
          </label>
          {errorMessage ? (
            <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{errorMessage}</div>
          ) : null}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-full bg-[var(--color-ink)] px-4 py-4 text-sm font-bold text-white disabled:bg-slate-400"
          >
            {isSubmitting ? 'Entrando...' : 'Entrar no painel'}
          </button>
        </form>
      </div>
    </div>
  )
}
