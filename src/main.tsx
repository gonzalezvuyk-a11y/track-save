
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from './app/auth/AuthProvider';
import AppRouter from './app/router/AppRouter';
import { isSupabaseConfigured } from './lib/supabase';
import './styles/index.css';

createRoot(document.getElementById('root')!).render(
  isSupabaseConfigured ? (
    <BrowserRouter>
      <AuthProvider>
        <AppRouter />
        <Toaster richColors position="top-right" />
      </AuthProvider>
    </BrowserRouter>
  ) : (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
      <div className="max-w-xl rounded-xl border bg-card p-6 space-y-3">
        <h1 className="text-lg font-semibold">Falta configuración de autenticación</h1>
        <p className="text-sm text-muted-foreground">
          Debes definir <strong>VITE_SUPABASE_URL</strong> y <strong>VITE_SUPABASE_ANON_KEY</strong> en tu archivo
          .env (o en variables de entorno de Vercel) y reiniciar el servidor.
        </p>
        <p className="text-sm text-muted-foreground">Referencia: revisa .env.example y README.md</p>
      </div>
    </div>
  ),
);
  