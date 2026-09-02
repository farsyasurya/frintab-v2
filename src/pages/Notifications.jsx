import { useEffect, useState } from 'react';
import { Bell, Check, Loader2, X, ArrowLeft, LifeBuoy, MessageSquare, ChevronRight, Clock, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '@/contexts/AuthContext';
import { getPendingTransactions, approveTransaction, rejectTransaction } from '@/service/transactionService';
import {
  subscribeUserUnreadTickets,
  subscribeAdminUnreadTickets,
  markTicketReadByUser,
  markTicketReadByAdmin,
} from '@/service/helpdeskService';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

const isAdminUser = (user) =>
  user?.role === 'SUPERADMIN' ||
  (Array.isArray(user?.role) ? user.role.includes('ADMIN') : user?.role === 'ADMIN');

const formatTimeAgo = (createdAt) => {
  const date = createdAt?.toDate?.() || (createdAt?.seconds ? new Date(createdAt.seconds * 1000) : null);
  if (!date) return 'Baru saja';
  const diffMs = new Date() - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffDay > 0) return `${diffDay} hari lalu`;
  if (diffHour > 0) return `${diffHour} jam lalu`;
  if (diffMin > 0) return `${diffMin} mnt lalu`;
  return 'Baru saja';
};

const Notifications = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'helpdesk' | 'transactions'
  const [transactionNotifs, setTransactionNotifs] = useState([]);
  const [helpdeskNotifs, setHelpdeskNotifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [error, setError] = useState('');

  const isAdmin = isAdminUser(user);

  // Fetch transactions
  const fetchTransactionNotifs = async () => {
    if (!user?.uid) return;
    try {
      const data = await getPendingTransactions(user.uid);
      setTransactionNotifs(data || []);
    } catch (err) {
      console.error('Get transaction notifications error:', err);
    }
  };

  useEffect(() => {
    fetchTransactionNotifs().finally(() => setLoading(false));
  }, [user?.uid]);

  // Subscribe to unread helpdesk tickets
  useEffect(() => {
    if (!user?.uid) return;
    let unsub;
    if (isAdmin) {
      unsub = subscribeAdminUnreadTickets((unreadList) => {
        setHelpdeskNotifs(unreadList);
      });
    } else {
      unsub = subscribeUserUnreadTickets(user.uid, (unreadList) => {
        setHelpdeskNotifs(unreadList);
      });
    }
    return () => unsub?.();
  }, [user?.uid, isAdmin]);

  const handleApprove = async (transaction) => {
    if (!user?.uid) return;
    try {
      setProcessingId(transaction.id);
      setError('');
      await approveTransaction({
        groupId: transaction.groupId,
        transactionId: transaction.id,
        user,
      });
      await fetchTransactionNotifs();
    } catch (err) {
      console.error('Approve transaction error:', err);
      setError(err.message || 'Gagal menyetujui transaksi.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (transaction) => {
    if (!user?.uid) return;
    const reason = window.prompt('Masukkan alasan penolakan:');
    if (!reason?.trim()) return;

    try {
      setProcessingId(transaction.id);
      setError('');
      await rejectTransaction({
        groupId: transaction.groupId,
        transactionId: transaction.id,
        user,
        reason: reason.trim(),
      });
      await fetchTransactionNotifs();
    } catch (err) {
      console.error('Reject transaction error:', err);
      setError(err.message || 'Gagal menolak transaksi.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleOpenHelpdeskTicket = async (ticket) => {
    if (isAdmin) {
      await markTicketReadByAdmin(ticket.id);
      navigate(`/admin/helpdesk/${ticket.id}`);
    } else {
      await markTicketReadByUser(ticket.id);
      navigate(`/helpdesk/${ticket.id}`);
    }
  };

  const totalHelpdeskCount = helpdeskNotifs.length;
  const totalTransactionCount = transactionNotifs.length;
  const totalAllCount = totalHelpdeskCount + totalTransactionCount;

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center bg-white">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-4 md:p-6">
      <div className="mx-auto max-w-3xl">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/')}
          className="mb-3 -ml-2 text-neutral-500 hover:bg-emerald-50 hover:text-emerald-700"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke Dashboard
        </Button>

        {/* HEADER */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-neutral-900">Notifikasi</h1>
              <p className="text-xs text-neutral-500">
                Pesan helpdesk terbaru dan pengajuan transaksi yang membutuhkan tindakan.
              </p>
            </div>
          </div>
          {totalAllCount > 0 && (
            <Badge className="bg-amber-500 hover:bg-amber-600 text-white font-semibold">
              {totalAllCount} Baru
            </Badge>
          )}
        </div>

        {/* TABS */}
        <div className="mb-6 flex gap-2 border-b border-neutral-100 pb-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all ${
              activeTab === 'all'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            Semua
            {totalAllCount > 0 && (
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  activeTab === 'all' ? 'bg-white/20 text-white' : 'bg-amber-500 text-white'
                }`}
              >
                {totalAllCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('helpdesk')}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all ${
              activeTab === 'helpdesk'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            <LifeBuoy className="h-3.5 w-3.5" />
            Pesan Helpdesk
            {totalHelpdeskCount > 0 && (
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  activeTab === 'helpdesk' ? 'bg-white/20 text-white' : 'bg-emerald-700 text-white'
                }`}
              >
                {totalHelpdeskCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('transactions')}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all ${
              activeTab === 'transactions'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            Pengajuan Transaksi
            {totalTransactionCount > 0 && (
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  activeTab === 'transactions' ? 'bg-white/20 text-white' : 'bg-amber-500 text-white'
                }`}
              >
                {totalTransactionCount}
              </span>
            )}
          </button>
        </div>

        {/* ERROR */}
        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2">
            <p className="text-xs text-red-600">{error}</p>
          </div>
        )}

        {/* CONTENT */}
        {activeTab === 'all' && totalAllCount === 0 && (
          <div className="rounded-xl border border-dashed border-neutral-200 bg-white px-6 py-14 text-center">
            <Bell className="mx-auto mb-3 h-8 w-8 text-neutral-300" />
            <p className="text-sm font-semibold text-neutral-700">Tidak ada notifikasi baru</p>
            <p className="mt-1 text-xs text-neutral-400">Semua pesan dan pengajuan sudah Anda tangani.</p>
          </div>
        )}

        {/* HELPDESK NOTIFICATIONS SECTION */}
        {(activeTab === 'all' || activeTab === 'helpdesk') && (
          <div className="space-y-3 mb-6">
            {activeTab === 'all' && totalHelpdeskCount > 0 && (
              <div className="flex items-center gap-2 mb-2">
                <LifeBuoy className="h-4 w-4 text-emerald-600" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                  Pesan & Balasan Helpdesk ({totalHelpdeskCount})
                </h2>
              </div>
            )}

            {activeTab === 'helpdesk' && totalHelpdeskCount === 0 && (
              <div className="rounded-xl border border-dashed border-neutral-200 bg-white px-6 py-12 text-center">
                <LifeBuoy className="mx-auto mb-3 h-8 w-8 text-neutral-300" />
                <p className="text-sm font-semibold text-neutral-700">Tidak ada pesan helpdesk baru</p>
                <p className="mt-1 text-xs text-neutral-400">Belum ada balasan atau tiket baru yang belum dibaca.</p>
              </div>
            )}

            {helpdeskNotifs.map((ticket) => {
              const sender = isAdmin
                ? ticket.userName || ticket.userEmail?.split('@')[0] || (ticket.userId?.includes('@') ? ticket.userId.split('@')[0] : 'Pengguna')
                : ticket.lastSenderName || 'Tim Support Frintab';

              const lastText = ticket.lastMessage || ticket.description || 'Ada pesan baru untuk Anda';
              const timeAgo = formatTimeAgo(ticket.lastMessageAt || ticket.updatedAt || ticket.createdAt);

              return (
                <div
                  key={`helpdesk-${ticket.id}`}
                  onClick={() => handleOpenHelpdeskTicket(ticket)}
                  className="group relative flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-emerald-100 bg-emerald-50/40 p-4 transition-all hover:bg-emerald-50 hover:shadow-sm"
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white shadow-sm">
                      <MessageSquare className="h-4.5 w-4.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-semibold text-emerald-700 truncate">{sender}</p>
                        <Badge variant="outline" className="border-emerald-300 bg-emerald-100 text-[10px] text-emerald-800 font-medium">
                          {isAdmin ? 'Pesan Masuk' : 'Balasan Baru'}
                        </Badge>
                      </div>
                      <h3 className="mt-0.5 text-sm font-bold text-neutral-900 truncate">{ticket.title}</h3>
                      <p className="mt-0.5 text-xs text-neutral-600 line-clamp-1">{lastText}</p>
                      <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-neutral-400">
                        <Clock className="h-3 w-3" />
                        <span>{timeAgo}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs rounded-lg px-3 py-1.5 h-8 flex items-center gap-1"
                    >
                      Buka Chat
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TRANSACTIONS SECTION */}
        {(activeTab === 'all' || activeTab === 'transactions') && (
          <div className="space-y-3">
            {activeTab === 'all' && totalTransactionCount > 0 && (
              <div className="flex items-center gap-2 mb-2">
                <Bell className="h-4 w-4 text-amber-600" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                  Persetujuan Transaksi ({totalTransactionCount})
                </h2>
              </div>
            )}

            {activeTab === 'transactions' && totalTransactionCount === 0 && (
              <div className="rounded-xl border border-dashed border-neutral-200 bg-white px-6 py-12 text-center">
                <Bell className="mx-auto mb-3 h-8 w-8 text-neutral-300" />
                <p className="text-sm font-semibold text-neutral-700">Tidak ada pengajuan transaksi</p>
                <p className="mt-1 text-xs text-neutral-400">Semua transaksi grup sudah disetujui atau ditolak.</p>
              </div>
            )}

            {transactionNotifs.map((item) => {
              const rawApprovals = item.approvals || [];
              const approvals = Array.isArray(rawApprovals) ? rawApprovals : rawApprovals.admin ? [rawApprovals.admin] : [];
              const requiredApprovals = Number(item.requiredApprovals || item.requiredAdmins || 1);
              const isProcessing = processingId === item.id;
              const lastApproval = approvals.length > 0 ? approvals[approvals.length - 1] : null;
              const lastApprovalName =
                typeof lastApproval === 'string' ? lastApproval : lastApproval?.adminName || lastApproval?.admin?.adminName || 'Admin';

              return (
                <Card key={`${item.groupId}-${item.id}`} className="border-neutral-200 bg-white shadow-none">
                  <CardHeader className="border-b border-neutral-100 px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h2 className="text-sm font-semibold text-neutral-900">{item.groupName}</h2>
                        <p className="mt-0.5 text-[11px] text-neutral-400">{item.groupCode}</p>
                      </div>
                      <Badge variant="outline" className="border-amber-200 bg-amber-50 text-[10px] text-amber-600">
                        Menunggu Persetujuan
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="px-4 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[11px] text-neutral-400">Pengajuan pengeluaran</p>
                        <p className="mt-1 text-sm font-medium text-neutral-800">{item.userName || item.displayName || 'Anggota'}</p>
                        {item.message && <p className="mt-1 text-xs text-neutral-500">{item.message}</p>}
                      </div>

                      <div className="text-right">
                        <p className="text-[11px] text-neutral-400">Total</p>
                        <p className="mt-1 text-sm font-semibold text-neutral-900">Rp {Number(item.total || 0).toLocaleString('id-ID')}</p>
                      </div>
                    </div>

                    <div className="mt-4 border-t border-neutral-100 pt-3">
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] text-neutral-400">Persetujuan admin</p>
                        <p className="text-xs font-medium text-neutral-600">
                          {approvals.length}/{requiredApprovals}
                        </p>
                      </div>

                      {lastApproval && (
                        <p className="mt-1 text-[11px] text-neutral-500">
                          Terakhir disetujui oleh <span className="font-medium text-neutral-700">{lastApprovalName}</span>
                        </p>
                      )}
                    </div>

                    <div className="mt-4 flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        disabled={isProcessing}
                        onClick={() => handleApprove(item)}
                        className="h-8 flex-1 bg-emerald-600 text-xs hover:bg-emerald-700"
                      >
                        {isProcessing ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Check className="mr-1.5 h-3.5 w-3.5" />}
                        Setujui
                      </Button>

                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={isProcessing}
                        onClick={() => handleReject(item)}
                        className="h-8 flex-1 border-neutral-200 text-xs text-neutral-600 hover:bg-neutral-50"
                      >
                        <X className="mr-1.5 h-3.5 w-3.5" />
                        Tolak
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;

