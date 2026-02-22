import { FormEvent, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { useAuth } from '../auth/AuthProvider';
import { supabase } from '../../lib/supabase';
import { profileSchema } from '../../lib/validation/auth';

type ProfileRecord = {
  id: string;
  full_name: string;
  currency: 'PYG' | 'USD';
  monthly_income: number | null;
  income_type: 'fixed' | 'freelance';
  role: 'user' | 'admin';
};

const isMissingIncomeTypeColumnError = (error: { code?: string; message?: string } | null | undefined) =>
  Boolean(
    error &&
      (error.code === '42703' ||
        error.message?.toLowerCase().includes('income_type') ||
        error.message?.toLowerCase().includes('column profiles.income_type does not exist')),
  );

export default function ProfilePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    full_name: '',
    currency: 'PYG',
    income_type: 'fixed',
    monthly_income: '',
  });
  const [role, setRole] = useState<'user' | 'admin'>('user');

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, currency, monthly_income, income_type, role')
        .eq('id', user.id)
        .single();

      let resolvedData = data;
      let resolvedError = error;

      if (isMissingIncomeTypeColumnError(error)) {
        const legacyResult = await supabase
          .from('profiles')
          .select('id, full_name, currency, monthly_income, role')
          .eq('id', user.id)
          .single();

        resolvedData = legacyResult.data
          ? {
              ...legacyResult.data,
              income_type: 'fixed',
            }
          : null;
        resolvedError = legacyResult.error;
      }

      if (resolvedError && resolvedError.code !== 'PGRST116') {
        toast.error(resolvedError.message);
        setLoading(false);
        return;
      }

      const profile = resolvedData as ProfileRecord | null;

      if (!profile) {
        const { error: insertError } = await supabase.from('profiles').insert({
          id: user.id,
          full_name: user.user_metadata?.full_name ?? '',
          currency: 'PYG',
          income_type: 'fixed',
          monthly_income: null,
          role: 'user',
        });

        let resolvedInsertError = insertError;
        if (isMissingIncomeTypeColumnError(insertError)) {
          const legacyInsert = await supabase.from('profiles').insert({
            id: user.id,
            full_name: user.user_metadata?.full_name ?? '',
            currency: 'PYG',
            monthly_income: null,
            role: 'user',
          });
          resolvedInsertError = legacyInsert.error;
        }

        if (resolvedInsertError) {
          toast.error(resolvedInsertError.message);
          setLoading(false);
          return;
        }

        setForm({
          full_name: user.user_metadata?.full_name ?? '',
          currency: 'PYG',
          income_type: 'fixed',
          monthly_income: '',
        });
        setRole('user');
        setLoading(false);
        return;
      }

      setForm({
        full_name: profile.full_name ?? '',
        currency: profile.currency ?? 'PYG',
        income_type: profile.income_type ?? 'fixed',
        monthly_income: profile.monthly_income === null ? '' : String(profile.monthly_income),
      });
      setRole(profile.role ?? 'user');
      setLoading(false);
    };

    loadProfile();
  }, [user]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;

    const parsed = profileSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? 'Formulario inválido');
      return;
    }

    setSaving(true);

    const payload = {
      id: user.id,
      full_name: parsed.data.full_name,
      currency: parsed.data.currency,
      income_type: parsed.data.income_type,
      monthly_income: parsed.data.monthly_income,
    };

    const { error } = await supabase.from('profiles').upsert(payload);

    let resolvedError = error;
    if (isMissingIncomeTypeColumnError(error)) {
      const legacyResult = await supabase.from('profiles').upsert({
        id: user.id,
        full_name: parsed.data.full_name,
        currency: parsed.data.currency,
        monthly_income: parsed.data.monthly_income,
      });
      resolvedError = legacyResult.error;
    }

    setSaving(false);

    if (resolvedError) {
      toast.error(resolvedError.message);
      return;
    }

    toast.success('Perfil actualizado');
  };

  return (
    <div className="mx-auto max-w-3xl p-4 md:p-6">
      <Card>
        <CardHeader>
          <CardTitle>Perfil</CardTitle>
          <CardDescription>Administra tus datos de cuenta y preferencias</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Cargando perfil...</p>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={user?.email ?? ''} disabled />
              </div>

              <div className="space-y-2">
                <Label htmlFor="full_name">Nombre completo</Label>
                <Input
                  id="full_name"
                  value={form.full_name}
                  onChange={(event) => setForm((prev) => ({ ...prev, full_name: event.target.value }))}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="currency">Moneda</Label>
                  <select
                    id="currency"
                    className="flex h-9 w-full rounded-md border border-input bg-input-background px-3 text-sm"
                    value={form.currency}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, currency: event.target.value as 'PYG' | 'USD' }))
                    }
                  >
                    <option value="PYG">PYG</option>
                    <option value="USD">USD</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="income_type">Tipo de ingreso</Label>
                  <select
                    id="income_type"
                    className="flex h-9 w-full rounded-md border border-input bg-input-background px-3 text-sm"
                    value={form.income_type}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        income_type: event.target.value as 'fixed' | 'freelance',
                      }))
                    }
                  >
                    <option value="fixed">Fijo</option>
                    <option value="freelance">Freelance</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="monthly_income">Ingreso mensual</Label>
                  <Input
                    id="monthly_income"
                    type="number"
                    min="0"
                    value={form.monthly_income}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, monthly_income: event.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Rol</Label>
                <Input id="role" value={role} disabled />
              </div>

              <Button type="submit" disabled={saving}>
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
