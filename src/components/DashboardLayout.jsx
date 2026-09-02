import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import packageJson from '../../package.json';

import { getPendingTransactions } from '@/service/transactionService';
import {
  subscribeUserUnreadTickets,
  subscribeAdminUnreadTickets,
} from '@/service/helpdeskService';
import { THEME } from '@/components/CholorPerGender';

import { LayoutDashboard, List, UserCircle, Search, HelpCircle, Bell, Menu, LogOut, ChevronDown, Sprout, Gem, ShieldCheck, LifeBuoy } from 'lucide-react';

const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/' },
  // { key: 'belangganan', label: 'Berlangganan', icon: Gem, path: '/berlangganan' },
  { key: 'pengajuan-me', label: 'Pengajuan Saya', icon: List, path: '/pengajuan-me' },
  { key: 'notifications', label: 'Notifikasi', icon: Bell, path: '/notifications' },
  { key: 'profile', label: 'Profile', icon: UserCircle, path: '/profile' },
  { key: 'helpdesk', label: 'Helpdesk', icon: LifeBuoy, path: '/helpdesk' },
];

const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isSuperAdmin = Boolean(
    user?.uid === 'sExbRFMPzIgQPhDAmhIT3eFSEkl1' ||
    user?.id === 'sExbRFMPzIgQPhDAmhIT3eFSEkl1' ||
    user?.role === 'SUPERADMIN' ||
    user?.userCode === 'sExbRFMPzIgQPhDAmhIT3eFSEkl1' ||
    user?.email?.startsWith('sExbRFMPzIgQPhDAmhIT3eFSEkl1')
  );

  const isAdmin = Boolean(
    user?.role?.includes('ADMIN') || user?.role === 'ADMIN' || isSuperAdmin
  );

  const navItems = [
    ...NAV_ITEMS,
    // Admin Helpdesk menu – visible for users with ADMIN or SUPERADMIN role
    ...(isAdmin
      ? [{
        key: 'admin-helpdesk',
        label: 'Admin Helpdesk',
        icon: LifeBuoy,
        path: '/admin/helpdesk',
        isSpecial: true,
      }]
      : []),
    // Super Admin extra menu
    ...(isSuperAdmin
      ? [{
        key: 'superadmin',
        label: 'Super Admin',
        icon: ShieldCheck,
        path: '/superadmin',
        isSpecial: true,
      }]
      : []),
  ];

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [helpdeskUnreadCount, setHelpdeskUnreadCount] = useState(0);

  const userMenuRef = useRef(null);

  const fetchPendingCount = async () => {
    if (!user?.uid) return;

    try {
      const data = await getPendingTransactions(user.uid);
      setPendingCount(data?.length || 0);
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
  }, [user?.uid, location.pathname]);

  // Real-time subscription to helpdesk unread messages
  useEffect(() => {
    if (!user?.uid) return;
    let unsub;
    if (isAdmin) {
      unsub = subscribeAdminUnreadTickets((unread) => {
        setHelpdeskUnreadCount(unread.length);
      });
    } else {
      unsub = subscribeUserUnreadTickets(user.uid, (unread) => {
        setHelpdeskUnreadCount(unread.length);
      });
    }
    return () => unsub?.();
  }, [user?.uid, isAdmin]);

  const totalNotificationCount = pendingCount + helpdeskUnreadCount;

  // Helper to determine badge count per nav item
  const getBadgeCount = (itemKey) => {
    if (itemKey === 'notifications') return totalNotificationCount;
    if (itemKey === 'helpdesk' && !isAdmin) return helpdeskUnreadCount;
    if (itemKey === 'admin-helpdesk' && isAdmin) return helpdeskUnreadCount;
    return 0;
  };

  // Pilih tema berdasarkan gender
  const themeKey = user?.gender === 'FEMALE' ? 'pink' : 'emerald';
  const theme = THEME[themeKey];

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
      {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/30 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 shrink-0 transform ${theme.sidebarBg} transition-transform duration-300 lg:static lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex items-center gap-2 px-6 py-6">
            <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${theme.logoBadge}`}>
              <img src="/frintab.png" alt="Logo" className="h-12 w-12" />
            </div>

            <div className="flex flex-col">
              <span className="text-lg font-bold leading-tight text-white">
                FRIN<span className="text-amber-400">TAB</span>
              </span>

              <span className={`mt-1 text-[10px] ${theme.versionText}`}>v{packageJson.version}</span>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 space-y-1 px-3">
            {navItems.map(({ key, label, icon: Icon, path, isSpecial }) => {
              const isActive = path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);
              const badgeCount = getBadgeCount(key);

              return (
                <button
                  key={key}
                  onClick={() => {
                    navigate(path);
                    setSidebarOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${isActive
                    ? isSpecial
                      ? 'bg-amber-500/30 text-amber-300 font-bold'
                      : theme.navActive
                    : isSpecial
                      ? 'text-amber-400 hover:bg-amber-500/10'
                      : theme.navInactive
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{label}</span>
                  </div>

                  {badgeCount > 0 && (
                    <span
                      className={`inline-flex items-center justify-center px-2 py-0.5 text-[11px] font-bold rounded-full min-w-[20px] shadow-sm ${
                        isSpecial
                          ? 'bg-amber-400 text-neutral-900'
                          : 'bg-amber-500 text-white'
                      }`}
                    >
                      {badgeCount > 99 ? '99+' : badgeCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Logout di bawah sidebar */}
          <div className={`border-t ${theme.sidebarBorder} p-3`}>
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
              title="Notifikasi"
            >
              <Bell className="h-5 w-5" />

              {totalNotificationCount > 0 && (
                <span className="absolute -right-1 -top-1 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[9px] font-bold text-white shadow-sm animate-pulse">
                  {totalNotificationCount > 99 ? '99+' : totalNotificationCount}
                </span>
              )}
            </button>

            {/* User dropdown */}
            <div className="relative" ref={userMenuRef}>
              <button onClick={() => setUserMenuOpen((v) => !v)} className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 hover:bg-neutral-100">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full ${theme.avatarBg} text-sm font-bold text-white`}>
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
        <main className={`flex-1 overflow-y-auto bg-gradient-to-br ${theme.mainGradient} px-4 py-6 sm:px-6 lg:px-8`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;

