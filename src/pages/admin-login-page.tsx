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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--color-shell)] px-4 py-12">
      <div className="absolute left-0 top-0 h-72 w-72 rounded-full bg-[var(--color-accent)]/10 blur-3xl" />
      <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-[var(--color-highlight)]/10 blur-3xl" />

      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-[36px] border border-white/60 bg-white shadow-[0_32px_90px_rgba(18,39,56,0.14)] lg:grid-cols-[1fr_0.9fr]">
        <section className="relative hidden overflow-hidden bg-[linear-gradient(145deg,#0f3453_0%,#1195ad_52%,#ef6554_100%)] p-10 text-white lg:block">
          <div className="absolute -left-8 top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute bottom-0 right-0 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
          <div className="relative">
            <BrandMark compact />
            <p className="mt-12 text-sm font-semibold uppercase tracking-[0.24em] text-white/75">Operacao da loja</p>
            <h1 className="mt-4 max-w-md font-[Fraunces] text-5xl font-bold leading-[1.02] tracking-[-0.05em]">
              Controle pedidos, estoque e caixa em um painel so.
            </h1>
            <p className="mt-5 max-w-md text-base leading-7 text-white/84">
              Acesso restrito para a equipe da Doce Sabor administrar cardapio, pedidos, produtos e configuracoes.
            </p>
            <div className="mt-10 grid gap-4">
              <div className="rounded-[26px] border border-white/14 bg-white/10 p-5 backdrop-blur">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/72">No painel</p>
                <p className="mt-2 text-lg font-semibold">Categorias, produtos, pedidos, caixa e status da loja</p>
              </div>
              <div className="rounded-[26px] border border-white/14 bg-white/10 p-5 backdrop-blur">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/72">Acesso</p>
                <p className="mt-2 text-lg font-semibold">Use o usuario criado em Authentication &gt; Users no Supabase</p>
              </div>
            </div>
          </div>
        </section>

        <section className="p-8 sm:p-10">
          <BrandMark />
          <div className="mt-6">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">Painel admin</p>
            <h2 className="mt-2 font-[Fraunces] text-4xl font-bold tracking-[-0.04em] text-[var(--color-ink)]">Entrar</h2>
            <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">
              Entre para gerenciar pedidos, estoque, precos e abertura da loja.
            </p>
          </div>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <label className="block text-sm font-medium text-[var(--color-ink)]">
              Email
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-[var(--color-line)] bg-[var(--color-shell)] px-4 py-3 outline-none transition focus:border-[var(--color-accent)]"
                placeholder="admin@docesabor.com"
              />
            </label>
            <label className="block text-sm font-medium text-[var(--color-ink)]">
              Senha
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-[var(--color-line)] bg-[var(--color-shell)] px-4 py-3 outline-none transition focus:border-[var(--color-accent)]"
                placeholder="Sua senha de acesso"
              />
            </label>
            {errorMessage ? (
              <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">{errorMessage}</div>
            ) : null}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-full bg-[linear-gradient(135deg,var(--color-ink),var(--color-accent-strong))] px-4 py-4 text-sm font-bold text-white shadow-[0_18px_40px_rgba(15,49,70,0.2)] disabled:bg-slate-400"
            >
              {isSubmitting ? 'Entrando...' : 'Entrar no painel'}
            </button>
          </form>

          <div className="mt-6 rounded-[24px] bg-[var(--color-shell)] p-4 text-sm leading-6 text-[var(--color-muted)]">
            Se o login nao abrir no site publicado, publique uma nova versao com o arquivo vercel.json.
          </div>
        </section>
      </div>
    </div>
  )
}
