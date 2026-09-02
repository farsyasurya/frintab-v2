import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background gap-3">
        <div className="relative flex items-center justify-center h-16 w-16">
          {/* Subtle glow */}
          <div className="absolute inset-0 rounded-full bg-yellow-400/15 blur-md" />

          {/* Simple spinner ring */}
          <div className="absolute inset-0 rounded-full border-2 border-yellow-400/20 border-t-yellow-500 animate-spin" />

          {/* Banana emoji */}
          <span className="text-2xl animate-bounce select-none">
            🍌
          </span>
        </div>

        {/* Loading text */}
        <p className="text-xs font-medium text-muted-foreground tracking-widest uppercase animate-pulse">
          Menyiapkan Sesi...
        </p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;