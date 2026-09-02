import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createTransaction } from '@/service/transactionService';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const getToday = () => new Date().toISOString().split('T')[0];

const initialForm = {
  total: '',
  type: '',
  date: getToday(),
  message: '',
};

const AddTransactionDialog = ({ open, onOpenChange, group, onSuccess }) => {
  const { user } = useAuth();

  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTotalChange = (event) => {
    const value = event.target.value.replace(/\D/g, '');

    setForm((prev) => ({
      ...prev,
      total: value ? Number(value) : 0,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!form.total || Number(form.total) <= 0) {
      setError('Total transaksi harus lebih dari 0.');
      return;
    }

    if (!form.type) {
      setError('Tipe transaksi wajib dipilih.');
      return;
    }

    if (!form.date) {
      setError('Tanggal transaksi wajib diisi.');
      return;
    }

    try {
      setLoading(true);

      const result = await createTransaction({
        group,
        user,
        total: Number(form.total),
        type: form.type,
        date: form.date,
        message: form.message.trim(),
      });

      console.log('Transaction created:', result);

      setForm(initialForm);
      onOpenChange(false);

      onSuccess?.(result);
    } catch (error) {
      console.error('Create transaction error:', error);
      setError(error.message || 'Gagal membuat transaksi.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (value) => {
    if (loading) return;

    onOpenChange(value);

    if (!value) {
      setForm(initialForm);
      setError('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="rounded-2xl border-emerald-200/60 bg-white/95 p-6 backdrop-blur-xl shadow-2xl shadow-emerald-950/20 sm:max-w-md transition-all duration-300 animate-in fade-in-0 zoom-in-95">
        <DialogHeader className="space-y-1.5 text-left">
          {/* Icon Badge Top Header */}
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-lg text-emerald-700 shadow-inner">
            💸
          </div>

          <DialogTitle className="text-xl font-extrabold tracking-tight text-stone-800">
            Tambah Transaksi
          </DialogTitle>

          <DialogDescription className="text-xs font-medium text-stone-500">
            Catat pemasukan atau pengeluaran untuk{' '}
            <strong className="text-emerald-800">{group?.name || 'group ini'}</strong>.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-2 space-y-4">
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50/80 px-3.5 py-2.5 text-xs font-semibold text-rose-800 animate-in fade-in-0 slide-in-from-top-1">
              {error}
            </div>
          )}

          {/* Grid untuk Total & Tanggal */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Total (Rp) */}
            <div className="space-y-1.5">
              <Label htmlFor="transaction-total" className="text-xs font-bold text-emerald-900">
                Total Transaksi (Rp)
              </Label>

              <Input
                id="transaction-total"
                name="total"
                type="text"
                inputMode="numeric"
                min="1"
                placeholder="masukkan nominal"
                value={form.total ? Number(form.total).toLocaleString('id-ID') : ''}
                onChange={handleTotalChange}
                disabled={loading}
                className="h-10 border-emerald-200/80 bg-emerald-50/60 text-stone-800 font-bold placeholder:font-normal placeholder:text-stone-400 transition-all duration-200 focus-visible:bg-white focus-visible:border-amber-400 focus-visible:ring-2 focus-visible:ring-amber-400/40 disabled:opacity-50"
                required
              />
            </div>

            {/* Tanggal */}
            <div className="space-y-1.5">
              <Label htmlFor="transaction-date" className="text-xs font-bold text-emerald-900">
                Tanggal
              </Label>

              <Input
                id="transaction-date"
                type="date"
                value={form.date}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    date: event.target.value,
                  }))
                }
                disabled
                className="h-10 border-emerald-200/80 bg-emerald-50/60 text-stone-800 transition-all duration-200 focus-visible:bg-white focus-visible:border-amber-400 focus-visible:ring-2 focus-visible:ring-amber-400/40 disabled:opacity-50"
                required
              />
            </div>
          </div>

          {/* Tipe Transaksi */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-emerald-900">Tipe Transaksi</Label>

            <Select
              value={form.type}
              onValueChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  type: value,
                }))
              }
              disabled={loading}
            >
              <SelectTrigger className="h-10 border-emerald-200/80 bg-emerald-50/60 text-stone-800 transition-all duration-200 focus:bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-400/40">
                <SelectValue placeholder="Pilih tipe transaksi" />
              </SelectTrigger>

              <SelectContent className="border-emerald-100 bg-white">
                <SelectItem value="INCOME">📥 Pemasukan</SelectItem>
                <SelectItem value="EXPENSE">📤 Pengeluaran</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Pesan / Catatan */}
          <div className="space-y-1.5">
            <Label htmlFor="transaction-message" className="text-xs font-bold text-emerald-900">
              Pesan / Catatan <span className="text-[10px] font-normal text-stone-400">(opsional)</span>
            </Label>

            <Input
              id="transaction-message"
              placeholder="Contoh: Beli tiket liburan"
              value={form.message}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  message: event.target.value,
                }))
              }
              disabled={loading}
              className="h-10 border-emerald-200/80 bg-emerald-50/60 text-stone-800 placeholder:text-stone-400 transition-all duration-200 focus-visible:bg-white focus-visible:border-amber-400 focus-visible:ring-2 focus-visible:ring-amber-400/40 disabled:opacity-50"
            />
          </div>

          {/* Dinamis Info Box */}
          {form.type === 'EXPENSE' && (
            <div className="rounded-xl border border-amber-200/80 bg-amber-50/80 p-3.5 text-xs font-medium leading-relaxed text-amber-900 transition-all duration-300 animate-in fade-in-0 slide-in-from-top-1">
              ⏳ <strong>Catatan:</strong> Pengeluaran tidak langsung mengurangi saldo. Pengajuan akan menunggu persetujuan dari seluruh admin group.
            </div>
          )}

          {form.type === 'INCOME' && (
            <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/80 p-3.5 text-xs font-medium leading-relaxed text-emerald-900 transition-all duration-300 animate-in fade-in-0 slide-in-from-top-1">
              ✅ <strong>Catatan:</strong> Pemasukan akan langsung secara otomatis menambah total saldo group.
            </div>
          )}

          {/* Action Buttons */}
          <DialogFooter className="pt-2 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={() => handleOpenChange(false)}
              className="h-10 border-stone-200 font-semibold text-stone-600 hover:bg-stone-100 active:scale-95 disabled:opacity-50"
            >
              Batal
            </Button>

            <Button
              type="submit"
              disabled={loading}
              className="h-10 bg-emerald-600 font-semibold text-white shadow-md shadow-emerald-900/10 transition-all duration-300 hover:bg-emerald-700 hover:shadow-lg active:scale-95 disabled:opacity-60"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" strokeWidth="4" stroke="currentColor" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Menyimpan...
                </span>
              ) : (
                'Tambah Transaksi'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddTransactionDialog;
