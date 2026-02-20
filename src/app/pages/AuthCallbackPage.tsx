import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';

export default function AuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;

    const finishOAuth = async () => {
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

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, nextSession) => {
        if (!active) {
          return;
        }

        if (nextSession) {
          navigate('/dashboard', { replace: true });
        } else {
          navigate('/login', { replace: true });
        }
      });

      setTimeout(() => {
        subscription.unsubscribe();
        if (active) {
          navigate('/login', { replace: true });
        }
      }, 3000);
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
