import { useEffect, useState } from 'react';
import { ArrowDownLeft, Clock, CheckCircle2, XCircle, Loader2 , ArrowLeft} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import  {Button} from '@/components/ui/button';

import { useAuth } from '@/contexts/AuthContext';
import { getMyTransactionRequests } from '@/service/transactionService';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

const PengajuanMe = () => {
  const { user } = useAuth();
const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchRequests = async () => {
    if (!user?.uid) return;

    try {
      setLoading(true);
      setError('');

      const data = await getMyTransactionRequests(user.uid);

      setRequests(data);
    } catch (error) {
      console.error('Get my requests error:', error);

      setError(error.message || 'Gagal mengambil daftar pengajuan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [user?.uid]);

  const formatCurrency = (value) => {
    return `Rp ${Number(value || 0).toLocaleString('id-ID')}`;
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '-';

    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);

    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getStatus = (status) => {
    switch (status) {
      case 'APPROVED':
        return {
          label: 'Disetujui',
          className: 'border-emerald-200 bg-emerald-50 text-emerald-600',
          icon: CheckCircle2,
        };

      case 'REJECTED':
        return {
          label: 'Ditolak',
          className: 'border-red-200 bg-red-50 text-red-600',
          icon: XCircle,
        };

      default:
        return {
          label: 'Menunggu',
          className: 'border-amber-200 bg-amber-50 text-amber-600',
          icon: Clock,
        };
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-neutral-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Memuat pengajuan...
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/')}
        className="mb-3 -ml-2 text-neutral-500 hover:bg-emerald-50 hover:text-emerald-700"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Kembali
      </Button>
      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-neutral-900">Pengajuan Saya</h1>

        <p className="mt-1 text-sm text-neutral-500">Riwayat pengajuan transaksi yang kamu buat.</p>
      </div>

      {/* ERROR */}
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* EMPTY */}
      {requests.length === 0 ? (
        <Card className="border-neutral-200 bg-white shadow-none">
          <CardContent className="flex flex-col items-center justify-center py-14 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100">
              <ArrowDownLeft className="h-5 w-5 text-neutral-400" />
            </div>

            <p className="text-sm font-medium text-neutral-700">Belum ada pengajuan</p>

            <p className="mt-1 text-xs text-neutral-400">Pengajuan transaksi yang kamu buat akan muncul di sini.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {requests.map((item) => {
            const status = getStatus(item.status);

            const StatusIcon = status.icon;

            return (
              <Card key={`${item.groupId}-${item.id}`} className="border-neutral-200 bg-white shadow-none">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    {/* LEFT */}
                    <div className="min-w-0">
                      <p className="text-xs text-neutral-400">{item.groupName || 'Group'}</p>

                      <p className="mt-1 text-sm font-semibold text-neutral-800">Pengajuan Pengeluaran</p>

                      <p className="mt-1 text-xs text-neutral-400">{formatDate(item.createdAt)}</p>
                    </div>

                    {/* RIGHT */}
                    <div className="shrink-0 text-right">
                      <p className="text-base font-bold text-red-500">- {formatCurrency(item.total)}</p>

                      <Badge variant="outline" className={`mt-1 gap-1 text-[10px] ${status.className}`}>
                        <StatusIcon className="h-3 w-3" />

                        {status.label}
                      </Badge>
                    </div>
                  </div>

                  {/* MESSAGE */}
                  {item.message && (
                    <div className="mt-4 rounded-lg bg-neutral-50 p-3">
                      <p className="text-[11px] text-neutral-400">Pesan</p>

                      <p className="mt-1 text-xs text-neutral-600">{item.message}</p>
                    </div>
                  )}

                  {/* APPROVAL */}
                  {item.status === 'PENDING' && (
                    <div className="mt-3 text-xs text-amber-600">
                      {Array.isArray(item.approvals) ? item.approvals.length : 0} / {item.requiredApprovals || 1} admin telah menyetujui
                    </div>
                  )}

                  {/* REJECTION */}
                  {item.status === 'REJECTED' && item.rejectionReason && (
                    <div className="mt-3 rounded-lg border border-red-100 bg-red-50 p-3">
                      <p className="text-[11px] font-medium text-red-500">Alasan penolakan</p>

                      <p className="mt-1 text-xs text-red-600">{item.rejectionReason}</p>

                      {item.rejectedByName && <p className="mt-1 text-[11px] text-red-400">Ditolak oleh {item.rejectedByName}</p>}
                    </div>
                  )}

                  {/* APPROVED */}
                  {item.status === 'APPROVED' && Array.isArray(item.approvals) && item.approvals.length > 0 && (
                    <div className="mt-3 text-xs text-emerald-600">
                      Disetujui oleh {item.approvals.map((approval) => approval.adminName || approval.displayName || 'Admin').join(', ')}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PengajuanMe;
