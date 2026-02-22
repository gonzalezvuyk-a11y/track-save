import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { useAuth } from '../auth/AuthProvider';

export function ProtectedLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Sesión cerrada');
      navigate('/login', { replace: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo cerrar sesión';
      toast.error(message);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-4 py-3 md:px-8">
          <Link to="/dashboard" className="inline-flex items-center">
            <img src="/track-save-logo.svg" alt="Track Save" className="h-7 w-auto dark:hidden" />
            <img src="/track-save-logo-negative.svg" alt="Track Save" className="hidden h-7 w-auto dark:block" />
            <span className="sr-only">Track Save</span>
          </Link>
          <nav className="flex items-center gap-2">
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `text-sm px-3 py-1 rounded-md ${isActive ? 'bg-accent' : 'text-muted-foreground'}`
              }
            >
              Dashboard
            </NavLink>
            <NavLink
              to="/profile"
              className={({ isActive }) =>
                `text-sm px-3 py-1 rounded-md ${isActive ? 'bg-accent' : 'text-muted-foreground'}`
              }
            >
              Perfil
            </NavLink>
            <span className="hidden md:inline text-xs text-muted-foreground">{user?.email}</span>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              Cerrar sesión
            </Button>
          </nav>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
