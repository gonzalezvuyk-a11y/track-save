import { FormEvent, useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { useAuth } from '../auth/AuthProvider';
import { supabase } from '../../lib/supabase';
import { resetSchema } from '../../lib/validation/auth';
import { AuthShell } from './AuthShell';

export default function ResetPasswordPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ password: '', confirmPassword: '' });

  const canReset = useMemo(() => !!user, [user]);

  if (!authLoading && !canReset) {
    return <Navigate to="/login" replace />;
  }

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const parsed = resetSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? 'Formulario inválido');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({
      password: parsed.data.password,
    });
    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success('Contraseña actualizada');
    navigate('/dashboard', { replace: true });
  };

  return (
    <AuthShell title="Restablecer contraseña" description="Define una nueva contraseña para tu cuenta">
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">Nueva contraseña</Label>
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
          {loading ? 'Actualizando...' : 'Actualizar contraseña'}
        </Button>
      </form>
    </AuthShell>
  );
}
