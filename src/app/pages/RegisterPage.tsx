import { FormEvent, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { useAuth } from '../auth/AuthProvider';
import { isGithubOAuthEnabled, isGoogleOAuthEnabled, supabase } from '../../lib/supabase';
import { registerSchema } from '../../lib/validation/auth';
import { AuthShell } from './AuthShell';

export default function RegisterPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    currency: 'PYG',
    monthlyIncome: '',
  });

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const parsed = registerSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? 'Formulario inválido');
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/login`,
        data: {
          full_name: parsed.data.fullName,
        },
      },
    });

    if (error) {
      setLoading(false);
      const isEmailRateLimit =
        error.code === 'over_email_send_rate_limit' ||
        error.message.toLowerCase().includes('rate limit') ||
        error.message.toLowerCase().includes('email rate');

      if (isEmailRateLimit) {
        toast.error('Límite de correos alcanzado. Espera unos minutos y vuelve a intentar.');
        return;
      }

      toast.error(error.message);
      return;
    }

    if (data.user) {
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: data.user.id,
        full_name: parsed.data.fullName,
        currency: parsed.data.currency,
        monthly_income: parsed.data.monthlyIncome,
        role: 'user',
      });

      if (profileError) {
        const missingProfilesTable =
          profileError.code === '42P01' || profileError.message.toLowerCase().includes('profiles');

        if (!missingProfilesTable) {
          setLoading(false);
          toast.error(profileError.message);
          return;
        }

        toast.warning('Cuenta creada, pero falta crear la tabla public.profiles en Supabase.');
      }
    }

    setLoading(false);

    if (data.session) {
      toast.success('Cuenta creada e inicio de sesión exitoso');
      navigate('/dashboard', { replace: true });
      return;
    }

    toast.success('Cuenta creada. Revisa tu email para confirmar tu cuenta.');
    navigate('/login', { replace: true });
  };

  const signUpWithProvider = async (provider: 'github' | 'google') => {
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
      title="Crear cuenta"
      description="Regístrate para guardar y proteger tu información"
      footerText="¿Ya tienes cuenta?"
      footerLinkText="Inicia sesión"
      footerLinkTo="/login"
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="fullName">Nombre completo</Label>
          <Input
            id="fullName"
            value={form.fullName}
            onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={form.email}
            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
            required
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="currency">Moneda</Label>
            <select
              id="currency"
              className="flex h-9 w-full rounded-md border border-input bg-input-background px-3 text-sm"
              value={form.currency}
              onChange={(event) => setForm((prev) => ({ ...prev, currency: event.target.value }))}
            >
              <option value="PYG">PYG</option>
              <option value="USD">USD</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="monthlyIncome">Ingreso mensual (opcional)</Label>
            <Input
              id="monthlyIncome"
              type="number"
              min="0"
              value={form.monthlyIncome}
              onChange={(event) => setForm((prev) => ({ ...prev, monthlyIncome: event.target.value }))}
            />
          </div>
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

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
          <Input
            id="confirmPassword"
            type="password"
            value={form.confirmPassword}
            onChange={(event) => setForm((prev) => ({ ...prev, confirmPassword: event.target.value }))}
            required
          />
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Creando cuenta...' : 'Crear cuenta'}
        </Button>
      </form>

      {isGoogleOAuthEnabled ? (
        <Button variant="outline" className="w-full" onClick={() => signUpWithProvider('google')}>
          Registrarme con Google
        </Button>
      ) : null}

      {isGithubOAuthEnabled ? (
        <Button variant="outline" className="w-full" onClick={() => signUpWithProvider('github')}>
          Registrarme con GitHub
        </Button>
      ) : null}

      <Link to="/forgot" className="text-sm text-primary hover:underline">
        ¿Olvidaste tu contraseña?
      </Link>
    </AuthShell>
  );
}
