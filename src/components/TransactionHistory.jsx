import { useEffect, useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Loader2,
  XCircle,
} from 'lucide-react';

import { getTransactionHistory } from '@/service/transactionService';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
} from '@/components/ui/card';

const TransactionHistory = ({ groupId }) => {
  const [transactions, setTransactions] = useState([]);

  const [loading, setLoading] = useState(true);

  const [pageLoading, setPageLoading] =
    useState(false);

  const [error, setError] = useState('');

  const [firstDoc, setFirstDoc] = useState(null);
  const [lastDoc, setLastDoc] = useState(null);

  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);

  const [page, setPage] = useState(1);

  const fetchTransactions = async ({
    cursor = null,
    direction = 'next',
    initial = false,
  } = {}) => {
    if (!groupId) return;

    try {
      if (initial) {
        setLoading(true);
      } else {
        setPageLoading(true);
      }

      setError('');

      const result =
        await getTransactionHistory({
          groupId,
          cursor,
          direction,
        });

      setTransactions(result.data);

      setFirstDoc(result.firstDoc);
      setLastDoc(result.lastDoc);

      setHasNext(result.hasMore);

      if (direction === 'next' && cursor) {
        setHasPrev(true);
      }

      if (direction === 'prev') {
        setHasPrev(page > 2);
      }
    } catch (error) {
      console.error(
        'Transaction history error:',
        error
      );

      setError(
        error.message ||
          'Gagal mengambil riwayat transaksi.'
      );
    } finally {
      setLoading(false);
      setPageLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    setHasPrev(false);

    fetchTransactions({
      initial: true,
    });
  }, [groupId]);

  const handleNext = async () => {
    if (!lastDoc || !hasNext || pageLoading) {
      return;
    }

    await fetchTransactions({
      cursor: lastDoc,
      direction: 'next',
    });

    setPage((prev) => prev + 1);
  };

  const handlePrev = async () => {
    if (!firstDoc || !hasPrev || pageLoading) {
      return;
    }

    await fetchTransactions({
      cursor: firstDoc,
      direction: 'prev',
    });

    setPage((prev) => Math.max(prev - 1, 1));
  };

  const formatCurrency = (value) => {
    return `Rp ${Number(
      value || 0
    ).toLocaleString('id-ID')}`;
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '-';

    const date = timestamp?.toDate
      ? timestamp.toDate()
      : new Date(timestamp);

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
          label: 'Berhasil',
          className:
            'border-emerald-200 bg-emerald-50 text-emerald-600',
          icon: CheckCircle2,
        };

      case 'REJECTED':
        return {
          label: 'Ditolak',
          className:
            'border-red-200 bg-red-50 text-red-600',
          icon: XCircle,
        };

      default:
        return {
          label: 'Proses',
          className:
            'border-amber-200 bg-amber-50 text-amber-600',
          icon: Clock,
        };
    }
  };

  if (loading) {
    return (
      <Card className="border-neutral-200 bg-white shadow-none">
        <CardContent className="flex min-h-[150px] items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-neutral-400" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-neutral-200 bg-white shadow-none">
      <CardHeader className="border-b border-neutral-100 px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold text-neutral-900">
            Riwayat Transaksi
          </h2>

          <p className="mt-0.5 text-xs text-neutral-400">
            Transaksi terbaru group.
          </p>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {error && (
          <div className="p-4">
            <p className="text-xs text-red-500">
              {error}
            </p>
          </div>
        )}

        {transactions.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <p className="text-sm text-neutral-500">
              Belum ada transaksi.
            </p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-neutral-100">
              {transactions.map((transaction) => {
                const isIncome =
                  transaction.type === 'INCOME';

                const status = getStatus(
                  transaction.status
                );

                const StatusIcon = status.icon;

                return (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between gap-4 px-4 py-3"
                  >
                    {/* USER */}
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                          isIncome
                            ? 'bg-emerald-50 text-emerald-600'
                            : 'bg-red-50 text-red-500'
                        }`}
                      >
                        {isIncome ? (
                          <ArrowDownLeft className="h-4 w-4" />
                        ) : (
                          <ArrowUpRight className="h-4 w-4" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-neutral-800">
                          {transaction.userName ||
                            transaction.displayName ||
                            'Anggota'}
                        </p>

                        <p className="mt-0.5 text-[11px] text-neutral-400">
                          {formatDate(
                            transaction.createdAt
                          )}
                        </p>
                      </div>
                    </div>

                    {/* TOTAL */}
                    <div className="shrink-0 text-right">
                      <p
                        className={`text-sm font-semibold ${
                          isIncome
                            ? 'text-emerald-600'
                            : 'text-red-500'
                        }`}
                      >
                        {isIncome ? '+' : '-'}{' '}
                        {formatCurrency(
                          transaction.total
                        )}
                      </p>

                      <Badge
                        variant="outline"
                        className={`mt-1 gap-1 px-1.5 py-0 text-[10px] ${status.className}`}
                      >
                        <StatusIcon className="h-2.5 w-2.5" />

                        {status.label}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* PAGINATION */}
            <div className="flex items-center justify-between border-t border-neutral-100 px-4 py-3">
              <p className="text-[11px] text-neutral-400">
                Halaman {page}
              </p>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={
                    !hasPrev || pageLoading
                  }
                  onClick={handlePrev}
                  className="h-7 text-xs"
                >
                  Sebelumnya
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={
                    !hasNext || pageLoading
                  }
                  onClick={handleNext}
                  className="h-7 text-xs"
                >
                  {pageLoading ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    'Berikutnya'
                  )}
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default TransactionHistory;