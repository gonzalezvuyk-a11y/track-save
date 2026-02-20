import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { useAuth } from '../auth/AuthProvider';
import { isGithubOAuthEnabled, isGoogleOAuthEnabled, supabase } from '../../lib/supabase';
import { loginSchema } from '../../lib/validation/auth';
import { AuthShell } from './AuthShell';

export default function LoginPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });

  const redirectTo = useMemo(() => {
    const state = location.state as { from?: { pathname?: string } };
    return state?.from?.pathname ?? '/dashboard';
  }, [location.state]);

  useEffect(() => {
    const hash = location.hash.startsWith('#') ? location.hash.slice(1) : location.hash;
    if (!hash) {
      return;
    }

    const params = new URLSearchParams(hash);
    const errorCode = params.get('error_code');

    if (!errorCode) {
      return;
    }

    if (errorCode === 'otp_expired') {
      toast.error('El enlace de confirmación expiró. Solicita uno nuevo y vuelve a intentarlo.');
    } else {
      const errorDescription = params.get('error_description');
      const readableMessage = errorDescription
        ? decodeURIComponent(errorDescription.replace(/\+/g, ' '))
        : 'No se pudo completar la confirmación del email.';
      toast.error(readableMessage);
    }

    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
  }, [location.hash, location.pathname, location.search]);

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const parsed = loginSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? 'Formulario inválido');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });
    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success('Sesión iniciada');
    navigate(redirectTo, { replace: true });
  };

  const signInWithProvider = async (provider: 'github' | 'google') => {
    const redirect = `${window.location.origin}/dashboard`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: redirect },
    });

    if (error) {
      toast.error(error.message);
    }
  };

  return (
    <AuthShell
      title="Iniciar sesión"
      description="Accede a tu cuenta para ver tus finanzas"
      footerText="¿No tienes cuenta?"
      footerLinkText="Regístrate"
      footerLinkTo="/register"
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={form.email}
            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
            placeholder="tu@email.com"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Contraseña</Label>
          <Input
            id="password"
            type="password"
            value={form.password}
            onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
            required
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Ingresando...' : 'Ingresar'}
        </Button>
      </form>

      {isGoogleOAuthEnabled ? (
        <Button variant="outline" className="w-full" onClick={() => signInWithProvider('google')}>
          Continuar con Google
        </Button>
      ) : null}

      {isGithubOAuthEnabled ? (
        <Button variant="outline" className="w-full" onClick={() => signInWithProvider('github')}>
          Continuar con GitHub
        </Button>
      ) : null}

      <Link to="/forgot" className="text-sm text-primary hover:underline">
        ¿Olvidaste tu contraseña?
      </Link>
    </AuthShell>
  );
}
