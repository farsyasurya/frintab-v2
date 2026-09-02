import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Sparkles, CheckCircle2, Clock } from 'lucide-react';

export function TransactionSuccessDialog({ open, onOpenChange, data }) {
  if (!data) return null;

  const isIncome = data.type === 'INCOME';

  const formatCurrency = (val) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(Number(val) || 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-2xl border border-stone-100 bg-white p-6 text-center shadow-xl sm:max-w-xs transition-all duration-300">
        <DialogHeader className="items-center space-y-3">
          {/* Main Icon */}
          <div
            className={`flex h-16 w-16 items-center justify-center rounded-2xl transition-transform duration-300 animate-in zoom-in-75 ${isIncome
                ? 'bg-emerald-100 text-emerald-600 shadow-inner'
                : 'bg-amber-100 text-amber-600 shadow-inner'
              }`}
          >
            {isIncome ? (
              <CheckCircle2 className="h-8 w-8" strokeWidth={2.5} />
            ) : (
              <Clock className="h-8 w-8" strokeWidth={2.5} />
            )}
          </div>

          {/* Amount Chip */}
          {data.total ? (
            <div
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-bold tracking-wide shadow-sm ${isIncome
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/80'
                  : 'bg-amber-50 text-amber-800 border border-amber-200/80'
                }`}
            >
              <Sparkles className="h-3 w-3" />
              <span>
                {isIncome ? '+' : '-'}
                {formatCurrency(data.total)}
              </span>
            </div>
          ) : null}

          {/* Title */}
          <DialogTitle className="text-lg font-bold text-stone-800">
            {isIncome ? 'Berhasil Menabung! 🎉' : 'Pengajuan Berhasil! ⏳'}
          </DialogTitle>

          {/* Message */}
          <DialogDescription className="text-xs font-medium leading-relaxed text-stone-600">
            {isIncome
              ? 'Berhasil! Terima kasih sudah menabung hari ini. Tetap konsisten dan semangat mencapai target impianmu!'
              : 'Berhasil! Pengeluaran telah diajukan dan sedang menunggu persetujuan dari admin grup.'}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="mt-4 sm:justify-center">
          <Button
            type="button"
            onClick={() => onOpenChange(false)}
            className={`w-full font-semibold text-white transition-all active:scale-95 ${isIncome
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : 'bg-amber-500 hover:bg-amber-600'
              }`}
          >
            Oke, Mengerti
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
