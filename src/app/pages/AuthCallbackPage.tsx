import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';

export default function AuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;

    const finishOAuth = async () => {
      const query = new URLSearchParams(window.location.search);
      const authCode = query.get('code');
      const authError = query.get('error');
      const authErrorDescription = query.get('error_description');

      if (authError) {
        const message = authErrorDescription
          ? decodeURIComponent(authErrorDescription.replace(/\+/g, ' '))
          : 'No se pudo completar el inicio de sesión con Google.';
        toast.error(message);
        navigate('/login', { replace: true });
        return;
      }

      if (authCode) {
        const { error } = await supabase.auth.exchangeCodeForSession(authCode);

        if (!active) {
          return;
        }

        if (error) {
          toast.error(error.message);
          navigate('/login', { replace: true });
          return;
        }

        navigate('/dashboard', { replace: true });
        return;
      }

      const { data, error } = await supabase.auth.getSession();

      if (!active) {
        return;
      }

      if (error) {
        toast.error(error.message);
        navigate('/login', { replace: true });
        return;
      }

      if (data.session) {
        navigate('/dashboard', { replace: true });
        return;
      }

      navigate('/login', { replace: true });
    };

    finishOAuth();

    return () => {
      active = false;
    };
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
      Completando inicio de sesión...
    </div>
  );
}
