import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { supabase } from '../../lib/supabase';
import { forgotSchema } from '../../lib/validation/auth';
import { AuthShell } from './AuthShell';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const parsed = forgotSchema.safeParse({ email });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? 'Email inválido');
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: `${window.location.origin}/reset`,
    });

    setLoading(false);

    if (error) {
      const isEmailRateLimit =
        error.code === 'over_email_send_rate_limit' ||
        error.message.toLowerCase().includes('rate limit') ||
        error.message.toLowerCase().includes('email rate');

      if (isEmailRateLimit) {
        toast.error('Límite de correos alcanzado. Espera unos minutos antes de reenviar.');
        return;
      }

      toast.error(error.message);
      return;
    }

    toast.success('Si el email existe, enviamos un enlace de recuperación.');
    console.info('[Auth] Password reset requested for:', parsed.data.email);
  };

  return (
    <AuthShell title="Recuperar contraseña" description="Te enviaremos un enlace para restablecer tu contraseña">
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="tu@email.com"
            required
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Enviando...' : 'Enviar enlace'}
        </Button>
      </form>

      <p className="text-sm text-muted-foreground">
        Volver a <Link to="/login" className="text-primary hover:underline">iniciar sesión</Link>
      </p>
    </AuthShell>
  );
}
