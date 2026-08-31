import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background gap-4">
        {/* Outer Glow Wrapper */}
        <div className="relative flex items-center justify-center h-24 w-24">
          {/* Animated Glow Effect */}
          <div className="absolute h-20 w-20 rounded-full bg-yellow-400/40 blur-2xl animate-pulse" />

          {/* Outer Rotating Ring */}
          <div className="absolute h-20 w-20 rounded-full border-4 border-yellow-300/30 border-t-yellow-400 animate-spin" />

          {/* Orbiting sparkle dots */}
          <div className="absolute h-20 w-20 animate-spin [animation-duration:3s]">
            <span className="absolute -top-1 left-1/2 -translate-x-1/2 h-2 w-2 rounded-full bg-yellow-300 shadow-[0_0_8px_2px_rgba(250,204,21,0.8)]" />
          </div>
          <div className="absolute h-20 w-20 animate-spin [animation-duration:3s] [animation-direction:reverse]">
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-2 w-2 rounded-full bg-amber-300 shadow-[0_0_8px_2px_rgba(252,211,77,0.8)]" />
          </div>

          {/* Bouncing / rotating banana */}
          <span
            className="relative text-4xl animate-bounce drop-shadow-[0_0_10px_rgba(250,204,21,0.7)]"
            style={{ animation: "wiggle 1.4s ease-in-out infinite, bounce 1s infinite" }}
          >
            🍌
          </span>
        </div>

        {/* Animated Typography */}
        <p className="text-sm font-medium text-yellow-500 tracking-widest uppercase animate-pulse">
          Menyiapkan Sesi...
        </p>

        {/* Custom keyframes for the banana wiggle */}
        <style jsx>{`
          @keyframes wiggle {
            0%, 100% { transform: rotate(-15deg); }
            50% { transform: rotate(15deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;