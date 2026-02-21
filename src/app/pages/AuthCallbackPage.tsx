import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';

export default function AuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;

    const waitForSession = async () => {
      for (let attempt = 0; attempt < 8; attempt += 1) {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session) {
          return true;
        }

        await new Promise((resolve) => {
          window.setTimeout(resolve, 250);
        });
      }

      return false;
    };

    const clearAuthParamsFromUrl = () => {
      window.history.replaceState(null, '', window.location.pathname);
    };

    const finishOAuth = async () => {
      const query = new URLSearchParams(window.location.search);
      const hash = window.location.hash.startsWith('#')
        ? window.location.hash.slice(1)
        : window.location.hash;
      const hashParams = new URLSearchParams(hash);
      const authCode = query.get('code');
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      const authError = query.get('error') ?? hashParams.get('error');
      const authErrorDescription =
        query.get('error_description') ?? hashParams.get('error_description');

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

        clearAuthParamsFromUrl();
        const hasSession = await waitForSession();

        if (!active) {
          return;
        }

        if (!hasSession) {
          toast.error('Google autenticó, pero no se pudo crear sesión local. Intenta nuevamente.');
          navigate('/login', { replace: true });
          return;
        }

        navigate('/dashboard', { replace: true });
        return;
      }

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (!active) {
          return;
        }

        if (error) {
          toast.error(error.message);
          navigate('/login', { replace: true });
          return;
        }

        clearAuthParamsFromUrl();
        const hasSession = await waitForSession();

        if (!active) {
          return;
        }

        if (!hasSession) {
          toast.error('Google autenticó, pero no se pudo crear sesión local. Intenta nuevamente.');
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
