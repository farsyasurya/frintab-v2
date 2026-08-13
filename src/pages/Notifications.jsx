import { useEffect, useState } from 'react';
import { Bell, Check, Loader2, X } from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { getPendingTransactions, approveTransaction, rejectTransaction } from '@/service/transactionService';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

const Notifications = () => {
  const { user } = useAuth();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [error, setError] = useState('');

  const fetchNotifications = async () => {
    if (!user?.uid) return;

    try {
      setLoading(true);
      setError('');

      const data = await getPendingTransactions(user.uid);

      setNotifications(data);
    } catch (error) {
      console.error('Get notifications error:', error);

      setError(error.message || 'Gagal mengambil notifikasi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [user?.uid]);

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

      await fetchNotifications();
    } catch (error) {
      console.error('Approve transaction error:', error);

      setError(error.message || 'Gagal menyetujui transaksi.');
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

      await fetchNotifications();
    } catch (error) {
      console.error('Reject transaction error:', error);

      setError(error.message || 'Gagal menolak transaksi.');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center bg-white">
        <Loader2 className="h-5 w-5 animate-spin text-neutral-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-4 md:p-6">
      <div className="mx-auto max-w-3xl">
        {/* HEADER */}
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100">
            <Bell className="h-4 w-4 text-neutral-600" />
          </div>

          <div>
            <h1 className="text-lg font-semibold text-neutral-900">Notifikasi</h1>

            <p className="text-xs text-neutral-500">Pengajuan transaksi yang membutuhkan persetujuan.</p>
          </div>
        </div>

        {/* ERROR */}
        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2">
            <p className="text-xs text-red-600">{error}</p>
          </div>
        )}

        {/* EMPTY */}
        {notifications.length === 0 ? (
          <div className="rounded-lg border border-neutral-200 bg-white px-6 py-12 text-center">
            <Bell className="mx-auto mb-3 h-7 w-7 text-neutral-300" />

            <p className="text-sm font-medium text-neutral-700">Tidak ada pengajuan</p>

            <p className="mt-1 text-xs text-neutral-400">Belum ada transaksi yang membutuhkan persetujuan.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((item) => {
              const rawApprovals = item.approvals || [];

              // Normalisasi approvals supaya selalu array
              const approvals = Array.isArray(rawApprovals) ? rawApprovals : rawApprovals.admin ? [rawApprovals.admin] : [];

              const requiredApprovals = Number(item.requiredApprovals || item.requiredAdmins || 1);

              const isProcessing = processingId === item.id;

              const lastApproval = approvals.length > 0 ? approvals[approvals.length - 1] : null;

              // Ambil nama admin dengan aman
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
                        Menunggu
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="px-4 py-4">
                    {/* TRANSACTION */}
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

                    {/* APPROVAL */}
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

                    {/* ACTION */}
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
