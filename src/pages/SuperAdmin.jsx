import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

import {
  getAllUsers,
  createAdminUser,
  updateAdminUser,
  deleteAdminUser,
  getAllGroups,
  createAdminGroup,
  updateAdminGroup,
  deleteAdminGroup,
  getAllTransactions,
  createAdminTransaction,
  updateAdminTransaction,
  deleteAdminTransaction,
} from '@/service/adminService';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import {
  Users,
  Layers,
  ArrowUpDown,
  ShieldCheck,
  Search,
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  TrendingUp,
  Wallet,
  CheckCircle2,
  Clock,
  XCircle,
  Lock,
} from 'lucide-react';

const SuperAdmin = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Validate super admin access (user id: sExbRFMPzIgQPhDAmhIT3eFSEkl1 or role: SUPERADMIN)
  const isSuperAdmin = Boolean(
    user?.uid === 'sExbRFMPzIgQPhDAmhIT3eFSEkl1' ||
    user?.id === 'sExbRFMPzIgQPhDAmhIT3eFSEkl1' ||
    user?.role === 'SUPERADMIN' ||
    user?.userCode === 'sExbRFMPzIgQPhDAmhIT3eFSEkl1' ||
    user?.email?.startsWith('sExbRFMPzIgQPhDAmhIT3eFSEkl1')
  );

  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'groups' | 'transactions'
  const [loading, setLoading] = useState(true);

  // Data states
  const [usersList, setUsersList] = useState([]);
  const [groupsList, setGroupsList] = useState([]);
  const [transactionsList, setTransactionsList] = useState([]);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterType, setFilterType] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Modals state
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [userForm, setUserForm] = useState({
    uid: '',
    name: '',
    email: '',
    phone: '',
    gender: 'MALE',
    role: 'USER',
    accountStatus: 'ACTIVE',
    subscriptionPlan: 'FREE',
  });
  const [editingUserId, setEditingUserId] = useState(null);

  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [groupForm, setGroupForm] = useState({
    name: '',
    description: '',
    type: 'COUPLE',
    code: '',
    password: '',
    target: '',
    balance: '',
    maxMembers: 10,
    status: 'ACTIVE',
    paymentMethod: 'MANUAL',
    paymentName: '',
    paymentPhone: '',
  });
  const [editingGroupId, setEditingGroupId] = useState(null);

  const [transactionModalOpen, setTransactionModalOpen] = useState(false);
  const [transactionForm, setTransactionForm] = useState({
    groupId: '',
    total: '',
    type: 'INCOME',
    date: new Date().toISOString().split('T')[0],
    status: 'APPROVED',
    message: '',
    userName: '',
  });
  const [editingTransactionId, setEditingTransactionId] = useState(null);
  const [editingTransGroupId, setEditingTransGroupId] = useState(null);

  // Load All Admin Data
  const loadAllData = async () => {
    try {
      setLoading(true);
      const [users, groups, transactions] = await Promise.all([
        getAllUsers(),
        getAllGroups(),
        getAllTransactions(),
      ]);
      setUsersList(users);
      setGroupsList(groups);
      setTransactionsList(transactions);
    } catch (err) {
      console.error('Error loading admin data:', err);
      Swal.fire({
        icon: 'error',
        title: 'Gagal Memuat Data',
        text: err.message || 'Terjadi kesalahan saat mengambil data Firestore.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSuperAdmin) {
      loadAllData();
    }
  }, [isSuperAdmin]);

  const formatCurrency = (val) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(Number(val) || 0);

  // ==========================================
  // USER CRUD HANDLERS
  // ==========================================
  const handleOpenCreateUser = () => {
    setEditingUserId(null);
    setUserForm({
      uid: '',
      name: '',
      email: '',
      phone: '',
      gender: 'MALE',
      role: 'USER',
      accountStatus: 'ACTIVE',
      subscriptionPlan: 'FREE',
    });
    setUserModalOpen(true);
  };

  const handleOpenEditUser = (item) => {
    setEditingUserId(item.uid || item.id);
    setUserForm({
      uid: item.uid || item.id,
      name: item.name || '',
      email: item.email || '',
      phone: item.phone || '',
      gender: item.gender || 'MALE',
      role: item.role || 'USER',
      accountStatus: item.accountStatus || 'ACTIVE',
      subscriptionPlan: item.subscriptionPlan || 'FREE',
    });
    setUserModalOpen(true);
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    try {
      if (editingUserId) {
        await updateAdminUser(editingUserId, userForm);
        Swal.fire({ icon: 'success', title: 'User Diperbarui!', timer: 1500, showConfirmButton: false });
      } else {
        await createAdminUser(userForm);
        Swal.fire({ icon: 'success', title: 'User Dibuat!', timer: 1500, showConfirmButton: false });
      }
      setUserModalOpen(false);
      loadAllData();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Gagal Menyimpan User', text: err.message });
    }
  };

  const handleDeleteUser = async (uid, name) => {
    const confirm = await Swal.fire({
      title: 'Hapus User?',
      text: `Apakah Anda yakin ingin menghapus user "${name || uid}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal',
    });

    if (confirm.isConfirmed) {
      try {
        await deleteAdminUser(uid);
        Swal.fire({ icon: 'success', title: 'User Dihapus!', timer: 1500, showConfirmButton: false });
        loadAllData();
      } catch (err) {
        Swal.fire({ icon: 'error', title: 'Gagal Menghapus', text: err.message });
      }
    }
  };

  // ==========================================
  // GROUP CRUD HANDLERS
  // ==========================================
  const handleOpenCreateGroup = () => {
    setEditingGroupId(null);
    setGroupForm({
      name: '',
      description: '',
      type: 'COUPLE',
      code: '',
      password: '',
      target: '',
      balance: '',
      maxMembers: 10,
      status: 'ACTIVE',
      paymentMethod: 'MANUAL',
      paymentName: '',
      paymentPhone: '',
    });
    setGroupModalOpen(true);
  };

  const handleOpenEditGroup = (item) => {
    setEditingGroupId(item.id);
    setGroupForm({
      name: item.name || '',
      description: item.description || '',
      type: item.type || 'COUPLE',
      code: item.code || '',
      password: item.password || '',
      target: item.target || 0,
      balance: item.balance || 0,
      maxMembers: item.maxMembers || 10,
      status: item.status || 'ACTIVE',
      paymentMethod: item.payment?.method || 'MANUAL',
      paymentName: item.payment?.name || '',
      paymentPhone: item.payment?.phone || '',
    });
    setGroupModalOpen(true);
  };

  const handleSaveGroup = async (e) => {
    e.preventDefault();
    try {
      if (editingGroupId) {
        await updateAdminGroup(editingGroupId, groupForm);
        Swal.fire({ icon: 'success', title: 'Group Diperbarui!', timer: 1500, showConfirmButton: false });
      } else {
        await createAdminGroup(groupForm, user?.uid || 'sExbRFMPzIgQPhDAmhIT3eFSEkl1');
        Swal.fire({ icon: 'success', title: 'Group Dibuat!', timer: 1500, showConfirmButton: false });
      }
      setGroupModalOpen(false);
      loadAllData();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Gagal Menyimpan Group', text: err.message });
    }
  };

  const handleDeleteGroup = async (groupId, name) => {
    const confirm = await Swal.fire({
      title: 'Hapus Group?',
      text: `Apakah Anda yakin ingin menghapus group "${name || groupId}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal',
    });

    if (confirm.isConfirmed) {
      try {
        await deleteAdminGroup(groupId);
        Swal.fire({ icon: 'success', title: 'Group Dihapus!', timer: 1500, showConfirmButton: false });
        loadAllData();
      } catch (err) {
        Swal.fire({ icon: 'error', title: 'Gagal Menghapus Group', text: err.message });
      }
    }
  };

  // ==========================================
  // TRANSACTION CRUD HANDLERS
  // ==========================================
  const handleOpenCreateTransaction = () => {
    setEditingTransactionId(null);
    setEditingTransGroupId(null);
    setTransactionForm({
      groupId: groupsList[0]?.id || '',
      total: '',
      type: 'INCOME',
      date: new Date().toISOString().split('T')[0],
      status: 'APPROVED',
      message: '',
      userName: user?.displayName || 'Super Admin',
    });
    setTransactionModalOpen(true);
  };

  const handleOpenEditTransaction = (item) => {
    setEditingTransactionId(item.id);
    setEditingTransGroupId(item.groupId);
    setTransactionForm({
      groupId: item.groupId || '',
      total: item.total || 0,
      type: item.type || 'INCOME',
      date: item.date || new Date().toISOString().split('T')[0],
      status: item.status || 'APPROVED',
      message: item.message || '',
      userName: item.userName || '',
    });
    setTransactionModalOpen(true);
  };

  const handleSaveTransaction = async (e) => {
    e.preventDefault();
    try {
      const selectedGroup = groupsList.find((g) => g.id === transactionForm.groupId);
      const payload = {
        ...transactionForm,
        groupName: selectedGroup?.name || '',
        groupCode: selectedGroup?.code || '',
      };

      if (editingTransactionId && editingTransGroupId) {
        await updateAdminTransaction(editingTransGroupId, editingTransactionId, payload);
        Swal.fire({ icon: 'success', title: 'Transaksi Diperbarui!', timer: 1500, showConfirmButton: false });
      } else {
        await createAdminTransaction(transactionForm.groupId, payload, user?.uid || 'sExbRFMPzIgQPhDAmhIT3eFSEkl1');
        Swal.fire({ icon: 'success', title: 'Transaksi Dibuat!', timer: 1500, showConfirmButton: false });
      }
      setTransactionModalOpen(false);
      loadAllData();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Gagal Menyimpan Transaksi', text: err.message });
    }
  };

  const handleDeleteTransaction = async (groupId, transId) => {
    const confirm = await Swal.fire({
      title: 'Hapus Transaksi?',
      text: 'Apakah Anda yakin ingin menghapus data transaksi ini?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal',
    });

    if (confirm.isConfirmed) {
      try {
        await deleteAdminTransaction(groupId, transId);
        Swal.fire({ icon: 'success', title: 'Transaksi Dihapus!', timer: 1500, showConfirmButton: false });
        loadAllData();
      } catch (err) {
        Swal.fire({ icon: 'error', title: 'Gagal Menghapus Transaksi', text: err.message });
      }
    }
  };

  // ==========================================
  // FILTERED DATA CALCULATIONS
  // ==========================================
  const filteredUsers = useMemo(() => {
    return usersList.filter((u) => {
      const matchQuery =
        !searchQuery ||
        (u.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.uid || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchRole = filterRole === 'ALL' || u.role === filterRole;
      const matchStatus = filterStatus === 'ALL' || u.accountStatus === filterStatus;
      // Period filter based on createdAt timestamp (assume ISO string)
      const matchPeriod =
        (!startDate && !endDate) ||
        (u.createdAt && (
          (!startDate || new Date(u.createdAt.seconds * 1000) >= new Date(startDate)) &&
          (!endDate || new Date(u.createdAt.seconds * 1000) <= new Date(endDate))
        ));
      return matchQuery && matchRole && matchStatus && matchPeriod;
    });
  }, [usersList, searchQuery, filterRole, filterStatus, startDate, endDate]);

  const filteredGroups = useMemo(() => {
    return groupsList.filter((g) => {
      const matchQuery =
        !searchQuery ||
        (g.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (g.code || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (g.id || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchType = filterType === 'ALL' || g.type === filterType;
      const matchStatus = filterStatus === 'ALL' || g.status === filterStatus;
      return matchQuery && matchType && matchStatus;
    });
  }, [groupsList, searchQuery, filterType, filterStatus]);

  const filteredTransactions = useMemo(() => {
    return transactionsList.filter((t) => {
      const matchQuery =
        !searchQuery ||
        (t.groupName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.userName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.message || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.id || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchType = filterType === 'ALL' || t.type === filterType;
      const matchStatus = filterStatus === 'ALL' || t.status === filterStatus;
      return matchQuery && matchType && matchStatus;
    });
  }, [transactionsList, searchQuery, filterType, filterStatus]);

  // Overall Statistics
  const totalBalance = useMemo(() => {
    return groupsList.reduce((acc, g) => acc + (Number(g.balance) || 0), 0);
  }, [groupsList]);

  const totalVolume = useMemo(() => {
    return transactionsList.reduce((acc, t) => acc + (Number(t.total) || 0), 0);
  }, [transactionsList]);

  // Unauthorized screen for non-sExbRFMPzIgQPhDAmhIT3eFSEkl1
  if (!isSuperAdmin) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center text-center p-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-red-100 text-red-600 mb-4 shadow-xl">
          <Lock className="h-10 w-10" />
        </div>
        <h2 className="text-2xl font-extrabold text-stone-800">Akses Ditolak</h2>
        <p className="mt-2 max-w-md text-sm text-stone-500">
          Halaman Super Admin ini dibatasi dan hanya dapat diakses oleh akun Super Administrator (User ID: sExbRFMPzIgQPhDAmhIT3eFSEkl1).
        </p>
        <Button onClick={() => navigate('/')} className="mt-6 bg-emerald-600 hover:bg-emerald-700">
          Kembali ke Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-3xl bg-gradient-to-r from-stone-900 via-neutral-900 to-stone-800 p-6 text-white shadow-2xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/20 px-3 py-1 text-xs font-bold text-amber-400 border border-amber-500/30">
            <ShieldCheck className="h-4 w-4" />
            SUPER ADMIN PORTAL (ID: sExbRFMPzIgQPhDAmhIT3eFSEkl1)
          </div>
          <h1 className="text-2xl font-black tracking-tight sm:text-3xl">Pusat Kendali Data Frintab</h1>
          <p className="text-xs text-stone-400">
            Kelola data Master User, Group Tabungan, dan Transaksi dengan fitur CRUD lengkap.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            onClick={loadAllData}
            disabled={loading}
            variant="outline"
            className="border-stone-700 bg-stone-800/80 text-white hover:bg-stone-700"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Users */}
        <Card className="rounded-2xl border-stone-200/80 bg-white/90 shadow-sm backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-stone-500">Total User</CardTitle>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
              <Users className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-stone-800">{usersList.length}</div>
            <p className="mt-1 text-xs text-stone-400">
              {usersList.filter((u) => u.role === 'ADMIN').length} Admin, {usersList.filter((u) => u.role === 'USER').length} Member
            </p>
          </CardContent>
        </Card>

        {/* Total Groups */}
        <Card className="rounded-2xl border-stone-200/80 bg-white/90 shadow-sm backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-stone-500">Total Group</CardTitle>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
              <Layers className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-stone-800">{groupsList.length}</div>
            <p className="mt-1 text-xs text-stone-400">
              {groupsList.filter((g) => g.status === 'ACTIVE').length} Group Aktif
            </p>
          </CardContent>
        </Card>

        {/* Total Saldo Terkumpul */}
        <Card className="rounded-2xl border-stone-200/80 bg-white/90 shadow-sm backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-stone-500">Total Saldo Group</CardTitle>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
              <Wallet className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-emerald-600">{formatCurrency(totalBalance)}</div>
            <p className="mt-1 text-xs text-stone-400">Akumulasi seluruh tabungan</p>
          </CardContent>
        </Card>

        {/* Total Transaksi */}
        <Card className="rounded-2xl border-stone-200/80 bg-white/90 shadow-sm backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-stone-500">Volume Transaksi</CardTitle>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
              <TrendingUp className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-stone-800">{transactionsList.length} Trx</div>
            <p className="mt-1 text-xs text-stone-400">Total: {formatCurrency(totalVolume)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs Container */}
      <Card className="rounded-3xl border-stone-200 bg-white shadow-md overflow-hidden">
        {/* Navigation Tabs Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-200 bg-stone-50/70 px-6 py-4">
          <div className="flex items-center gap-2">
            <Button
              onClick={() => {
                setActiveTab('users');
                setSearchQuery('');
              }}
              variant={activeTab === 'users' ? 'default' : 'outline'}
              className={`rounded-xl font-bold ${activeTab === 'users' ? 'bg-stone-900 text-white' : 'border-stone-200 text-stone-600'
                }`}
            >
              <Users className="h-4 w-4 mr-2" />
              Users ({usersList.length})
            </Button>

            <Button
              onClick={() => {
                setActiveTab('groups');
                setSearchQuery('');
              }}
              variant={activeTab === 'groups' ? 'default' : 'outline'}
              className={`rounded-xl font-bold ${activeTab === 'groups' ? 'bg-stone-900 text-white' : 'border-stone-200 text-stone-600'
                }`}
            >
              <Layers className="h-4 w-4 mr-2" />
              Groups ({groupsList.length})
            </Button>

            <Button
              onClick={() => {
                setActiveTab('transactions');
                setSearchQuery('');
              }}
              variant={activeTab === 'transactions' ? 'default' : 'outline'}
              className={`rounded-xl font-bold ${activeTab === 'transactions' ? 'bg-stone-900 text-white' : 'border-stone-200 text-stone-600'
                }`}
            >
              <ArrowUpDown className="h-4 w-4 mr-2" />
              Transactions ({transactionsList.length})
            </Button>
          </div>

          {/* Action Button for Current Tab */}
          <div>
            {activeTab === 'users' && (
              <Button onClick={handleOpenCreateUser} className="bg-emerald-600 font-bold text-white hover:bg-emerald-700">
                <Plus className="h-4 w-4 mr-1.5" /> Tambah User
              </Button>
            )}
            {activeTab === 'groups' && (
              <Button onClick={handleOpenCreateGroup} className="bg-emerald-600 font-bold text-white hover:bg-emerald-700">
                <Plus className="h-4 w-4 mr-1.5" /> Tambah Group
              </Button>
            )}
            {activeTab === 'transactions' && (
              <Button onClick={handleOpenCreateTransaction} className="bg-emerald-600 font-bold text-white hover:bg-emerald-700">
                <Plus className="h-4 w-4 mr-1.5" /> Tambah Transaksi
              </Button>
            )}
          </div>
        </div>

          {/* Filter Bar */}
        <div className="flex flex-col gap-3 p-6 sm:flex-row sm:items-center sm:justify-between border-b border-stone-100 bg-white">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <Input
              type="text"
              placeholder={`Cari di data ${activeTab}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-stone-50/60 border-stone-200"
            />
          </div>

          {/* Period Filter for Users */}
          {activeTab === 'users' && (
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-9 w-32"
                placeholder="Start"
              />
              <span className="text-stone-500">-</span>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-9 w-32"
                placeholder="End"
              />
              <Button onClick={() => setCurrentPage(0)} className="h-9 px-3">Filter</Button>
            </div>
          )}

          {/* Filter Dropdowns based on active tab */}
          <div className="flex items-center gap-2">
            {activeTab === 'users' && (
              <>
                <Select value={filterRole} onValueChange={setFilterRole}>
                  <SelectTrigger className="w-36 h-9 text-xs">
                    <SelectValue placeholder="Semua Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Semua Role</SelectItem>
                    <SelectItem value="USER">USER</SelectItem>
                    <SelectItem value="ADMIN">ADMIN</SelectItem>
                    <SelectItem value="SUPERADMIN">SUPERADMIN</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-36 h-9 text-xs">
                    <SelectValue placeholder="Semua Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Semua Status</SelectItem>
                    <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                    <SelectItem value="SUSPENDED">SUSPENDED</SelectItem>
                  </SelectContent>
                </Select>
              </>
            )}

            {activeTab === 'groups' && (
              <>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-36 h-9 text-xs">
                    <SelectValue placeholder="Semua Tipe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Semua Tipe</SelectItem>
                    <SelectItem value="COUPLE">COUPLE</SelectItem>
                    <SelectItem value="ARISAN">ARISAN</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-36 h-9 text-xs">
                    <SelectValue placeholder="Semua Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Semua Status</SelectItem>
                    <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                    <SelectItem value="INACTIVE">INACTIVE</SelectItem>
                  </SelectContent>
                </Select>
              </>
            )}

            {activeTab === 'transactions' && (
              <>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-36 h-9 text-xs">
                    <SelectValue placeholder="Semua Tipe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Semua Tipe</SelectItem>
                    <SelectItem value="INCOME">INCOME (Pemasukan)</SelectItem>
                    <SelectItem value="EXPENSE">EXPENSE (Pengeluaran)</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-36 h-9 text-xs">
                    <SelectValue placeholder="Semua Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Semua Status</SelectItem>
                    <SelectItem value="APPROVED">APPROVED</SelectItem>
                    <SelectItem value="PENDING">PENDING</SelectItem>
                    <SelectItem value="REJECTED">REJECTED</SelectItem>
                  </SelectContent>
                </Select>
              </>
            )}
          </div>
        </div>

        {/* Tab 1: USERS TABLE */}
        {activeTab === 'users' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-700">
              <thead className="border-b border-stone-200 bg-stone-50/80 font-bold uppercase tracking-wider text-stone-500">
                <tr>
                  <th className="py-3.5 px-4">UID / ID</th>
                  <th className="py-3.5 px-4">Nama Lengkap</th>
                  <th className="py-3.5 px-4">Email / No HP</th>
                  <th className="py-3.5 px-4">Gender</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Paket</th>
                  <th className="py-3.5 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-stone-400">
                      Tidak ada data user ditemukan.
                    </td>
                  </tr>
                ) : (
                  // Pagination slice
                  filteredUsers
                    .slice(currentPage * rowsPerPage, (currentPage + 1) * rowsPerPage)
                    .map((u) => (
                      <tr key={u.id} className="hover:bg-stone-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-stone-500">{u.uid || u.id}</td>
                        <td className="py-3 px-4 font-semibold text-stone-900">{u.name || '-'}</td>
                        <td className="py-3 px-4">
                          <div className="font-medium text-stone-800">{u.email || '-'}</div>
                          <div className="text-[10px] text-stone-400">{u.phone || '-'}</div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="outline" className="text-[10px]">
                            {u.gender || 'MALE'}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <Badge
                            className={`text-[10px] font-bold ${
                              u.role === 'SUPERADMIN'
                                ? 'bg-amber-500 text-white'
                                : u.role === 'ADMIN'
                                ? 'bg-purple-600 text-white'
                                : 'bg-stone-100 text-stone-700'
                            }`}
                          >
                            {u.role || 'USER'}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <Badge
                            className={`text-[10px] ${
                              u.accountStatus === 'ACTIVE'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-rose-100 text-rose-700'
                            }`}
                          >
                            {u.accountStatus || 'ACTIVE'}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="secondary" className="text-[10px]">
                            {u.subscriptionPlan || 'FREE'}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleOpenEditUser(u)}
                              className="h-8 w-8 p-0 text-stone-600 hover:text-blue-600"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteUser(u.uid || u.id, u.name)}
                              className="h-8 w-8 p-0 text-stone-600 hover:text-red-600"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
            {/* Pagination Controls */}
            <div className="flex items-center justify-between p-4 border-t border-stone-100">
              <div className="text-sm text-stone-600">
                Halaman {currentPage + 1} dari {Math.max(1, Math.ceil(filteredUsers.length / rowsPerPage))}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={currentPage === 0}
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 0))}
                >
                  Sebelumnya
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={(currentPage + 1) * rowsPerPage >= filteredUsers.length}
                  onClick={() => setCurrentPage((p) => p + 1)}
                >
                  Selanjutnya
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: GROUPS TABLE */}
        {activeTab === 'groups' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-700">
              <thead className="border-b border-stone-200 bg-stone-50/80 font-bold uppercase tracking-wider text-stone-500">
                <tr>
                  <th className="py-3.5 px-4">ID / Kode</th>
                  <th className="py-3.5 px-4">Nama Group</th>
                  <th className="py-3.5 px-4">Tipe</th>
                  <th className="py-3.5 px-4">Saldo Saat Ini</th>
                  <th className="py-3.5 px-4">Target Tabungan</th>
                  <th className="py-3.5 px-4">Maks Member</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredGroups.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-stone-400">
                      Tidak ada data group ditemukan.
                    </td>
                  </tr>
                ) : (
                  filteredGroups.map((g) => (
                    <tr key={g.id} className="hover:bg-stone-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-stone-800">{g.code || '-'}</div>
                        <div className="font-mono text-[10px] text-stone-400">{g.id}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-stone-900">{g.name}</div>
                        <div className="text-[10px] text-stone-400 line-clamp-1">{g.description || '-'}</div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className="text-[10px] font-bold">
                          {g.type}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 font-bold text-emerald-600">{formatCurrency(g.balance)}</td>
                      <td className="py-3 px-4 font-semibold text-stone-700">{formatCurrency(g.target)}</td>
                      <td className="py-3 px-4">{g.maxMembers || 10} orang</td>
                      <td className="py-3 px-4">
                        <Badge
                          className={`text-[10px] ${g.status === 'ACTIVE'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-stone-100 text-stone-600'
                            }`}
                        >
                          {g.status || 'ACTIVE'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleOpenEditGroup(g)}
                            className="h-8 w-8 p-0 text-stone-600 hover:text-blue-600"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteGroup(g.id, g.name)}
                            className="h-8 w-8 p-0 text-stone-600 hover:text-red-600"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 3: TRANSACTIONS TABLE */}
        {activeTab === 'transactions' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-700">
              <thead className="border-b border-stone-200 bg-stone-50/80 font-bold uppercase tracking-wider text-stone-500">
                <tr>
                  <th className="py-3.5 px-4">ID Transaksi</th>
                  <th className="py-3.5 px-4">Group</th>
                  <th className="py-3.5 px-4">User</th>
                  <th className="py-3.5 px-4">Tipe</th>
                  <th className="py-3.5 px-4">Nominal</th>
                  <th className="py-3.5 px-4">Tanggal</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Catatan</th>
                  <th className="py-3.5 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-stone-400">
                      Tidak ada data transaksi ditemukan.
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((t) => (
                    <tr key={t.id} className="hover:bg-stone-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono text-[10px] text-stone-500">{t.id}</td>
                      <td className="py-3 px-4 font-semibold text-stone-900">{t.groupName || t.groupId}</td>
                      <td className="py-3 px-4 font-medium text-stone-800">{t.userName || t.userId || '-'}</td>
                      <td className="py-3 px-4">
                        <Badge
                          className={`text-[10px] font-bold ${t.type === 'INCOME'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                            }`}
                        >
                          {t.type === 'INCOME' ? '📥 INCOME' : '📤 EXPENSE'}
                        </Badge>
                      </td>
                      <td
                        className={`py-3 px-4 font-bold ${t.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                      >
                        {t.type === 'INCOME' ? '+' : '-'}
                        {formatCurrency(t.total)}
                      </td>
                      <td className="py-3 px-4 text-stone-600">{t.date || '-'}</td>
                      <td className="py-3 px-4">
                        <Badge
                          className={`text-[10px] font-bold ${t.status === 'APPROVED'
                              ? 'bg-emerald-100 text-emerald-700'
                              : t.status === 'PENDING'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-rose-100 text-rose-700'
                            }`}
                        >
                          {t.status === 'APPROVED' ? (
                            <CheckCircle2 className="h-3 w-3 mr-1 inline" />
                          ) : t.status === 'PENDING' ? (
                            <Clock className="h-3 w-3 mr-1 inline" />
                          ) : (
                            <XCircle className="h-3 w-3 mr-1 inline" />
                          )}
                          {t.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-stone-500 max-w-[150px] truncate">{t.message || '-'}</td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleOpenEditTransaction(t)}
                            className="h-8 w-8 p-0 text-stone-600 hover:text-blue-600"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteTransaction(t.groupId, t.id)}
                            className="h-8 w-8 p-0 text-stone-600 hover:text-red-600"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ==================================================== */}
      {/* 1. MODAL USER (CREATE / EDIT)                        */}
      {/* ==================================================== */}
      <Dialog open={userModalOpen} onOpenChange={setUserModalOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle>{editingUserId ? 'Edit Data User' : 'Tambah User Baru'}</DialogTitle>
            <DialogDescription className="text-xs">
              {editingUserId ? `Perbarui data untuk UID: ${editingUserId}` : 'Buat akun user baru di database.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveUser} className="space-y-3.5 mt-2">
            {!editingUserId && (
              <div className="space-y-1">
                <Label className="text-xs font-bold">Custom UID (Opsional)</Label>
                <Input
                  placeholder="misal: sExbRFMPzIgQPhDAmhIT3eFSEkl1"
                  value={userForm.uid}
                  onChange={(e) => setUserForm({ ...userForm, uid: e.target.value })}
                />
              </div>
            )}

            <div className="space-y-1">
              <Label className="text-xs font-bold">Nama Lengkap</Label>
              <Input
                required
                value={userForm.name}
                onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs font-bold">Email</Label>
                <Input
                  type="email"
                  required
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold">No Telepon</Label>
                <Input
                  value={userForm.phone}
                  onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs font-bold">Role</Label>
                <Select
                  value={userForm.role}
                  onValueChange={(val) => setUserForm({ ...userForm, role: val })}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USER">USER</SelectItem>
                    <SelectItem value="ADMIN">ADMIN</SelectItem>
                    <SelectItem value="SUPERADMIN">SUPERADMIN</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold">Status Akun</Label>
                <Select
                  value={userForm.accountStatus}
                  onValueChange={(val) => setUserForm({ ...userForm, accountStatus: val })}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                    <SelectItem value="SUSPENDED">SUSPENDED</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs font-bold">Gender</Label>
                <Select
                  value={userForm.gender}
                  onValueChange={(val) => setUserForm({ ...userForm, gender: val })}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MALE">MALE (Laki-laki)</SelectItem>
                    <SelectItem value="FEMALE">FEMALE (Perempuan)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold">Paket Berlangganan</Label>
                <Select
                  value={userForm.subscriptionPlan}
                  onValueChange={(val) => setUserForm({ ...userForm, subscriptionPlan: val })}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FREE">FREE</SelectItem>
                    <SelectItem value="PREMIUM">PREMIUM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="pt-3">
              <Button type="button" variant="outline" onClick={() => setUserModalOpen(false)}>
                Batal
              </Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                Simpan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ==================================================== */}
      {/* 2. MODAL GROUP (CREATE / EDIT)                       */}
      {/* ==================================================== */}
      <Dialog open={groupModalOpen} onOpenChange={setGroupModalOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle>{editingGroupId ? 'Edit Data Group' : 'Buat Group Baru'}</DialogTitle>
            <DialogDescription className="text-xs">
              {editingGroupId ? `Perbarui data untuk ID: ${editingGroupId}` : 'Tambahkan group tabungan baru.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveGroup} className="space-y-3.5 mt-2">
            <div className="space-y-1">
              <Label className="text-xs font-bold">Nama Group</Label>
              <Input
                required
                value={groupForm.name}
                onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold">Deskripsi</Label>
              <Input
                value={groupForm.description}
                onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs font-bold">Tipe Group</Label>
                <Select
                  value={groupForm.type}
                  onValueChange={(val) => setGroupForm({ ...groupForm, type: val })}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="COUPLE">COUPLE</SelectItem>
                    <SelectItem value="ARISAN">ARISAN</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold">Status Group</Label>
                <Select
                  value={groupForm.status}
                  onValueChange={(val) => setGroupForm({ ...groupForm, status: val })}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                    <SelectItem value="INACTIVE">INACTIVE</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs font-bold">Target Saldo (Rp)</Label>
                <Input
                  type="number"
                  value={groupForm.target}
                  onChange={(e) => setGroupForm({ ...groupForm, target: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold">Saldo Saat Ini (Rp)</Label>
                <Input
                  type="number"
                  value={groupForm.balance}
                  onChange={(e) => setGroupForm({ ...groupForm, balance: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs font-bold">Password Group</Label>
                <Input
                  type="text"
                  placeholder="1234"
                  value={groupForm.password}
                  onChange={(e) => setGroupForm({ ...groupForm, password: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold">Maksimal Anggota</Label>
                <Input
                  type="number"
                  value={groupForm.maxMembers}
                  onChange={(e) => setGroupForm({ ...groupForm, maxMembers: e.target.value })}
                />
              </div>
            </div>

            <DialogFooter className="pt-3">
              <Button type="button" variant="outline" onClick={() => setGroupModalOpen(false)}>
                Batal
              </Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                Simpan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ==================================================== */}
      {/* 3. MODAL TRANSACTION (CREATE / EDIT)                 */}
      {/* ==================================================== */}
      <Dialog open={transactionModalOpen} onOpenChange={setTransactionModalOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle>{editingTransactionId ? 'Edit Transaksi' : 'Tambah Transaksi Admin'}</DialogTitle>
            <DialogDescription className="text-xs">
              {editingTransactionId ? `Perbarui transaksi ID: ${editingTransactionId}` : 'Input transaksi langsung sebagai Super Admin.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveTransaction} className="space-y-3.5 mt-2">
            <div className="space-y-1">
              <Label className="text-xs font-bold">Pilih Group Tabungan</Label>
              <Select
                disabled={Boolean(editingTransactionId)}
                value={transactionForm.groupId}
                onValueChange={(val) => setTransactionForm({ ...transactionForm, groupId: val })}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Pilih Group..." />
                </SelectTrigger>
                <SelectContent>
                  {groupsList.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.name} ({g.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs font-bold">Tipe Transaksi</Label>
                <Select
                  value={transactionForm.type}
                  onValueChange={(val) => setTransactionForm({ ...transactionForm, type: val })}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INCOME">📥 INCOME (Pemasukan)</SelectItem>
                    <SelectItem value="EXPENSE">📤 EXPENSE (Pengeluaran)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold">Status</Label>
                <Select
                  value={transactionForm.status}
                  onValueChange={(val) => setTransactionForm({ ...transactionForm, status: val })}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="APPROVED">APPROVED (Disetujui)</SelectItem>
                    <SelectItem value="PENDING">PENDING (Menunggu)</SelectItem>
                    <SelectItem value="REJECTED">REJECTED (Ditolak)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs font-bold">Total Transaksi (Rp)</Label>
                <Input
                  type="number"
                  required
                  value={transactionForm.total}
                  onChange={(e) => setTransactionForm({ ...transactionForm, total: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold">Tanggal</Label>
                <Input
                  type="date"
                  required
                  value={transactionForm.date}
                  onChange={(e) => setTransactionForm({ ...transactionForm, date: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold">Nama User / Penyetor</Label>
              <Input
                value={transactionForm.userName}
                onChange={(e) => setTransactionForm({ ...transactionForm, userName: e.target.value })}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold">Catatan / Pesan</Label>
              <Input
                placeholder="Contoh: Setoran manual admin"
                value={transactionForm.message}
                onChange={(e) => setTransactionForm({ ...transactionForm, message: e.target.value })}
              />
            </div>

            <DialogFooter className="pt-3">
              <Button type="button" variant="outline" onClick={() => setTransactionModalOpen(false)}>
                Batal
              </Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                Simpan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SuperAdmin;
