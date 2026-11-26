import { ArrowLeft, Gem, Lock, UserCheck } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useApp } from '../../../app/providers/useApp';

/**
 * Partner authentication view supporting Supabase email/password and Local Demo partner login.
 */
export function LoginPage() {
  const location = useLocation();
  const { mode, session, isAuthReady, publicMeta, signInWithPassword, signInLocalPartner } =
    useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const redirectTo =
    typeof (location.state as { from?: unknown } | null)?.from === 'string'
      ? (location.state as { from: string }).from
      : '/admin';

  if (isAuthReady && session) {
    return <Navigate to={redirectTo} replace />;
  }

  async function handleSupabaseSubmit(event: FormEvent) {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      await signInWithPassword(email.trim(), password);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No pudimos iniciar sesión.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleLocalPartnerSignIn(slug: string) {
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      await signInLocalPartner(slug);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No pudimos iniciar sesión.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-dvh flex flex-col justify-center bg-surface px-4 py-8 text-ink">
      <div className="mx-auto w-full max-w-md space-y-5">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-ink"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Volver al catálogo público
        </Link>

        <section className="rounded-2xl border border-line bg-card p-6 space-y-5 shadow-sm">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-brand-ink">
                <Gem className="h-5 w-5" aria-hidden="true" />
              </span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  mode === 'supabase' ? 'bg-ok-soft text-ok' : 'bg-warn-soft text-warn'
                }`}
              >
                {mode === 'supabase' ? 'Supabase conectado' : 'Modo Local de prueba'}
              </span>
            </div>
            <h1 className="text-xl font-bold tracking-tight pt-1">Ingreso al Panel Admin</h1>
            <p className="text-xs text-muted">
              {publicMeta.settings.businessName} · Acceso exclusivo para socios.
            </p>
          </div>

          {errorMessage ? (
            <div
              role="alert"
              className="rounded-xl border border-danger/30 bg-danger-soft px-3.5 py-2.5 text-xs font-medium text-danger"
            >
              {errorMessage}
            </div>
          ) : null}

          {mode === 'supabase' ? (
            <form onSubmit={handleSupabaseSubmit} className="space-y-3.5">
              <div className="space-y-1">
                <label htmlFor="login-email" className="block text-xs font-semibold">
                  Correo electrónico
                </label>
                <input
                  id="login-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="gonzalo@grama.app"
                  className="w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-sm outline-none focus:border-brand"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="login-password" className="block text-xs font-semibold">
                  Contraseña
                </label>
                <input
                  id="login-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-sm outline-none focus:border-brand"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-brand-ink transition hover:opacity-90 disabled:opacity-60 cursor-pointer"
              >
                <Lock className="h-4 w-4" aria-hidden="true" />
                {isSubmitting ? 'Ingresando...' : 'Ingresar al panel'}
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <p className="text-xs leading-relaxed text-muted">
                Todavía no hay variables de Supabase cargadas en <code>.env.local</code>, así que la
                app funciona en <strong>Modo Local</strong> para que puedas probar todo en tu compu
                y celular. Elige con qué socio entrar:
              </p>

              <div className="grid gap-2.5">
                {publicMeta.sellers.map((seller) => (
                  <button
                    key={seller.id}
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => void handleLocalPartnerSignIn(seller.sellerSlug)}
                    className="flex items-center justify-between rounded-xl border border-line bg-surface px-4 py-3 text-left transition hover:border-brand cursor-pointer"
                  >
                    <div>
                      <div className="text-sm font-bold">Entrar como {seller.fullName}</div>
                      <div className="text-xs text-muted">
                        Link asignado: <code>/?v={seller.sellerSlug}</code>
                      </div>
                    </div>
                    <UserCheck className="h-4 w-4 text-ink" aria-hidden="true" />
                  </button>
                ))}
              </div>

              <p className="text-xs text-muted border-t border-line pt-3">
                Cuando quieras activar sincronización real entre dispositivos, sigue los pasos en{' '}
                <code>docs/supabase-setup.md</code>.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
