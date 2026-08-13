import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';

import { getPendingTransactions } from '@/service/transactionService';

import {
  LayoutDashboard,
  List,
  UserCircle,
  Search,
  HelpCircle,
  Bell,
  Menu,
  LogOut,
  ChevronDown,
  Sprout,
  Gem,
} from 'lucide-react';

const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { key: 'belangganan', label: 'Berlangganan', icon: Gem, path: '/berlangganan' },
  { key: 'list', label: 'List', icon: List, path: '/list' },
  { key: 'profile', label: 'Profile', icon: UserCircle, path: '/profile' },
];

const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  const userMenuRef = useRef(null);

  const fetchPendingCount = async () => {
    if (!user?.uid) return;

    try {
      const data = await getPendingTransactions(user.uid);
      setPendingCount(data.length);
    } catch (error) {
      console.error('Get pending count error:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  useEffect(() => {
    fetchPendingCount();
  }, [user?.uid]);

  // Tutup dropdown user saat klik di luar
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const initial = (user?.displayName || user?.email || 'U').charAt(0).toUpperCase();

  return (
    <div className="flex h-screen w-full overflow-hidden bg-neutral-100">
      {/* Overlay untuk sidebar mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 shrink-0 transform bg-emerald-950 transition-transform duration-300 lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex items-center gap-2 px-6 py-6">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-400">
              <Sprout className="h-5 w-5 text-emerald-950" />
            </div>
            <span className="text-lg font-bold text-white">
              Tabungan<span className="text-amber-400">Ku</span>
            </span>
          </div>

          {/* Nav */}
          <nav className="flex-1 space-y-1 px-3">
            {NAV_ITEMS.map(({ key, label, icon: Icon, path }) => {
              const isActive = location.pathname.startsWith(path);

              return (
                <button
                  key={key}
                  onClick={() => {
                    navigate(path);
                    setSidebarOpen(false);
                  }}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive ? 'bg-emerald-600 text-white shadow-sm' : 'text-emerald-100/70 hover:bg-emerald-900 hover:text-white'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </button>
              );
            })}
          </nav>

          {/* Logout di bawah sidebar */}
          <div className="border-t border-emerald-900 p-3">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-300 transition-colors hover:bg-red-950/40 hover:text-red-200"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Konten Utama */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="flex items-center justify-between gap-4 border-b border-neutral-200 bg-white px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 lg:hidden">
              <Menu className="h-5 w-5" />
            </button>
            <span className="hidden text-sm font-semibold text-neutral-700 sm:block">
              {NAV_ITEMS.find((item) => location.pathname.startsWith(item.path))?.label || 'Dashboard'}
            </span>
          </div>

          {/* Search */}
          <div className="hidden max-w-md flex-1 items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 sm:flex">
            <Search className="h-4 w-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Cari group tabungan..."
              className="w-full bg-transparent text-sm text-neutral-700 placeholder:text-neutral-400 focus:outline-none"
            />
          </div>

          {/* Kanan: help, notif, user */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            <button className="rounded-full p-2 text-neutral-500 hover:bg-neutral-100 sm:hidden">
              <Search className="h-5 w-5" />
            </button>

            <button className="hidden rounded-full p-2 text-neutral-500 hover:bg-neutral-100 sm:block">
              <HelpCircle className="h-5 w-5" />
            </button>

            <button
              onClick={() => navigate('/notifications')}
              className="relative rounded-full p-2 text-neutral-500 transition-colors hover:bg-neutral-100"
            >
              <Bell className="h-5 w-5" />

              {pendingCount > 0 && (
                <span className="absolute -right-1 -top-1 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[9px] font-bold text-white">
                  {pendingCount > 99 ? '99+' : pendingCount}
                </span>
              )}
            </button>

            {/* User dropdown */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen((v) => !v)}
                className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 hover:bg-neutral-100"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white">
                  {initial}
                </div>
                <span className="hidden max-w-[100px] truncate text-sm font-medium text-neutral-700 md:block">
                  {user?.displayName || user?.email || 'User'}
                </span>
                <ChevronDown className="hidden h-3.5 w-3.5 text-neutral-400 md:block" />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 z-10 mt-2 w-44 overflow-hidden rounded-lg border border-neutral-200 bg-white py-1 shadow-lg">
                  <div className="border-b border-neutral-100 px-3 py-2">
                    <p className="truncate text-xs font-semibold text-neutral-700">{user?.displayName || 'User'}</p>
                    <p className="truncate text-[11px] text-neutral-400">{user?.email}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Konten halaman aktif */}
        <main className="flex-1 overflow-y-auto bg-gradient-to-br from-emerald-50 via-amber-50/30 to-emerald-50 px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;