import { useEffect, useState } from 'react';
import { ArrowLeft, Check, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '@/contexts/AuthContext';

import {
  approveTransaction,
  getPendingTransactions,
} from '@/service/transactionService';

import TransactionApprovalDialog from '@/components/TransactionApprovalDialog';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const Notifications = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [transactions, setTransactions] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [processingId, setProcessingId] =
    useState(null);

  const [
    rejectTransactionData,
    setRejectTransactionData,
  ] = useState(null);

  const [
    rejectDialogOpen,
    setRejectDialogOpen,
  ] = useState(false);

  const fetchRequests = async () => {
    if (!user?.uid) return;

    try {
      setLoading(true);

      const data =
        await getPendingTransactions(
          user.uid
        );

      setTransactions(data);
    } catch (error) {
      console.error(
        'Get notifications error:',
        error
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [user?.uid]);

  const formatCurrency = (value) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(Number(value) || 0);

  const getLastApproval = (
    transaction
  ) => {
    const approvals =
      transaction.approvals || [];

    if (!approvals.length) {
      return null;
    }

    return approvals[
      approvals.length - 1
    ];
  };

  const handleApprove = async (
    transaction
  ) => {
    try {
      setProcessingId(transaction.id);

      await approveTransaction({
        groupId:
          transaction.groupId,

        transactionId:
          transaction.id,

        admin: user,
      });

      await fetchRequests();
    } catch (error) {
      console.error(
        'Approve error:',
        error
      );

      alert(
        error.message ||
          'Gagal menyetujui pengajuan.'
      );
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectSuccess = async () => {
    setRejectTransactionData(null);

    await fetchRequests();
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-emerald-50/50 via-background to-yellow-50/40">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">

        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-5 -ml-2"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali
        </Button>

        <div className="mb-6">
          <h1 className="text-2xl font-bold">
            Pengajuan Transaksi
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Pengajuan pengeluaran yang membutuhkan
            persetujuanmu.
          </p>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((item) => (
              <div
                key={item}
                className="h-48 animate-pulse rounded-xl bg-muted"
              />
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 text-4xl">
                🎉
              </div>

              <p className="font-semibold">
                Tidak ada pengajuan
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                Semua pengajuan sudah diproses.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {transactions.map(
              (transaction) => {
                const lastApproval =
                  getLastApproval(
                    transaction
                  );

                return (
                  <Card
                    key={transaction.id}
                    className="overflow-hidden border-neutral-100"
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <CardTitle className="text-base">
                            {transaction.groupName}
                          </CardTitle>

                          <CardDescription className="mt-1">
                            Kode:{' '}
                            {transaction.groupCode}
                          </CardDescription>
                        </div>

                        <Badge className="border-0 bg-amber-100 text-amber-700 hover:bg-amber-100">
                          Menunggu
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent>
                      <div className="rounded-lg bg-neutral-50 p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-xs text-neutral-400">
                              Pengajuan oleh
                            </p>

                            <p className="font-semibold">
                              {transaction.userName ||
                                'User'}
                            </p>
                          </div>

                          <p className="text-lg font-bold text-red-600">
                            {formatCurrency(
                              transaction.total
                            )}
                          </p>
                        </div>

                        <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                          <div>
                            <p className="text-xs text-neutral-400">
                              Tanggal
                            </p>

                            <p className="font-medium">
                              {
                                transaction.date
                              }
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-neutral-400">
                              Pesan
                            </p>

                            <p className="font-medium">
                              {transaction.message ||
                                '-'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {lastApproval ? (
                        <div className="mt-4 rounded-lg border border-emerald-100 bg-emerald-50 p-3">
                          <p className="text-xs text-emerald-600">
                            Terakhir disetujui oleh
                          </p>

                          <p className="text-sm font-semibold text-emerald-700">
                            {
                              lastApproval.adminName
                            }
                          </p>
                        </div>
                      ) : (
                        <div className="mt-4 rounded-lg border border-amber-100 bg-amber-50 p-3 text-xs text-amber-700">
                          Belum ada admin yang
                          menyetujui pengajuan ini.
                        </div>
                      )}

                      <div className="mt-5 flex justify-end gap-2">
                        <Button
                          variant="outline"
                          disabled={
                            processingId ===
                            transaction.id
                          }
                          onClick={() => {
                            setRejectTransactionData(
                              transaction
                            );

                            setRejectDialogOpen(
                              true
                            );
                          }}
                        >
                          <X className="mr-2 h-4 w-4" />
                          Tolak
                        </Button>

                        <Button
                          disabled={
                            processingId ===
                            transaction.id
                          }
                          onClick={() =>
                            handleApprove(
                              transaction
                            )
                          }
                          className="bg-emerald-600 hover:bg-emerald-700"
                        >
                          <Check className="mr-2 h-4 w-4" />

                          {processingId ===
                          transaction.id
                            ? 'Memproses...'
                            : 'Setujui'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              }
            )}
          </div>
        )}
      </div>

      <TransactionApprovalDialog
        open={rejectDialogOpen}
        onOpenChange={
          setRejectDialogOpen
        }
        transaction={
          rejectTransactionData
        }
        admin={user}
        onSuccess={
          handleRejectSuccess
        }
      />
    </main>
  );
};

export default Notifications;