import { useState } from 'react';

import { useAuth } from '@/contexts/AuthContext';
import { createGroup } from '@/service/groupService';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const initialForm = {
  name: '',
  description: '',
  type: '',
  paymentMethod: '',
  paymentName: '',
  paymentPhone: '',
  target: '',
  password: '',
};

const CreateGroupDialog = ({ open, onOpenChange, onSuccess }) => {
  const { user } = useAuth();

  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = ({ target: { name, value } }) => {
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleTypeChange = (value) => {
    setForm((prev) => ({
      ...prev,
      type: value,
    }));
  };

  const handlePaymentMethodChange = (value) => {
    setForm((prev) => ({
      ...prev,
      paymentMethod: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError('');

    if (!form.name.trim()) {
      setError('Nama group wajib diisi.');
      return;
    }

    if (!form.type) {
      setError('Pilih tipe group.');
      return;
    }

    if (!form.paymentMethod) {
      setError('Pilih tempat penyimpanan dana.');
      return;
    }

    if (!form.paymentName.trim()) {
      setError('Nama admin penyimpanan dana wajib diisi.');
      return;
    }

    if (!form.paymentPhone.trim()) {
      setError('Nomor admin wajib diisi.');
      return;
    }

    if (!form.target || Number(form.target) <= 0) {
      setError('Target tabungan harus lebih dari 0.');
      return;
    }

    if (!form.password || form.password.length < 4) {
      setError('Password group minimal 4 karakter.');
      return;
    }

    try {
      setLoading(true);

      const result = await createGroup({
        ...form,
        target: Number(form.target),
        user,
      });

      setForm(initialForm);
      onOpenChange(false);

      onSuccess?.(result);
    } catch (error) {
      console.error('Create group error:', error);

      setError(error.message || 'Gagal membuat group. Silakan coba lagi.');
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
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl border-emerald-200/60 bg-white/95 p-6 backdrop-blur-xl shadow-2xl shadow-emerald-950/20 sm:max-w-lg transition-all duration-300 animate-in fade-in-0 zoom-in-95">
        <DialogHeader className="space-y-1.5 text-left">
          {/* Header Icon */}
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-lg text-emerald-700 shadow-inner">✨</div>

          <DialogTitle className="text-xl font-extrabold tracking-tight text-stone-800">Buat Group Tabungan</DialogTitle>

          <DialogDescription className="text-xs font-medium text-stone-500">Buat tempat menabung bersama teman atau pasanganmu.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-2 space-y-4">
          {error && (
            <Alert variant="destructive" className="border-rose-200 bg-rose-50/80 text-rose-800">
              <AlertDescription className="text-xs font-semibold">{error}</AlertDescription>
            </Alert>
          )}

          {/* Nama Group */}
          <div className="space-y-1.5">
            <Label htmlFor="group-name" className="text-xs font-bold text-emerald-900">
              Nama Group
            </Label>

            <Input
              id="group-name"
              name="name"
              placeholder="Contoh: Tabungan Liburan"
              value={form.name}
              onChange={handleChange}
              disabled={loading}
              className="h-10 border-emerald-200/80 bg-emerald-50/60 text-stone-800 placeholder:text-stone-400 transition-all duration-200 focus-visible:bg-white focus-visible:border-amber-400 focus-visible:ring-2 focus-visible:ring-amber-400/40 disabled:opacity-50"
              required
            />
          </div>

          {/* Tipe Group */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-emerald-900">Tipe Group</Label>

            <Select value={form.type} onValueChange={handleTypeChange} disabled={loading}>
              <SelectTrigger className="h-10 border-emerald-200/80 bg-emerald-50/60 text-stone-800 transition-all duration-200 focus:bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-400/40">
                <SelectValue placeholder="Pilih tipe group" />
              </SelectTrigger>

              <SelectContent className="border-emerald-100 bg-white">
                <SelectItem value="COUPLE">💚 Pasangan</SelectItem>
                <SelectItem value="ARISAN">🎉 Arisan</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Couple Info Alert */}
          {form.type === 'COUPLE' && (
            <Card className="border-emerald-200/80 bg-emerald-50/80 shadow-none transition-all duration-300 animate-in fade-in-0 slide-in-from-top-1">
              <CardContent className="p-3.5">
                <p className="text-xs font-bold text-emerald-800">💚 Group Pasangan</p>

                <p className="mt-1 text-[11px] leading-relaxed font-medium text-emerald-700">
                  Group pasangan hanya dapat memiliki maksimal <strong>2 orang</strong> (Kamu dan pasanganmu). Orang ketiga tidak diperbolehkan! 😭
                </p>
              </CardContent>
            </Card>
          )}

          {/* Arisan Info Alert */}
          {form.type === 'ARISAN' && (
            <Card className="border-amber-200/80 bg-amber-50/80 shadow-none transition-all duration-300 animate-in fade-in-0 slide-in-from-top-1">
              <CardContent className="p-3.5">
                <p className="text-xs font-bold text-amber-900">🎉 Group Arisan</p>

                <p className="mt-1 text-[11px] leading-relaxed font-medium text-amber-800">
                  Akun Free dapat membuat arisan dengan maksimal <strong>10 orang</strong>. Untuk akun berlangganan, maksimal{' '}
                  <strong>50 orang</strong>.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Section Penyimpanan Dana */}
          <div className="space-y-3.5 rounded-xl border border-emerald-200/70 bg-stone-50/50 p-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-900">Penyimpanan Dana</p>

              <p className="text-[11px] font-medium text-stone-500">Tentukan tempat dana group disimpan.</p>
            </div>

            {/* Tempat Penyimpanan */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-emerald-900">Tempat Penyimpanan</Label>

              <Select value={form.paymentMethod} onValueChange={handlePaymentMethodChange} disabled={loading}>
                <SelectTrigger className="h-10 border-emerald-200/80 bg-white text-stone-800 transition-all duration-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/40">
                  <SelectValue placeholder="Pilih tempat penyimpanan" />
                </SelectTrigger>

                <SelectContent className="border-emerald-100 bg-white">
                  <SelectItem value="DANA">DANA</SelectItem>
                  <SelectItem value="GOPAY">GoPay</SelectItem>
                  <SelectItem value="OVO">OVO</SelectItem>
                  <SelectItem value="SHOPEEPAY">ShopeePay</SelectItem>
                  <SelectItem value="BANK">Rekening Bank</SelectItem>
                  <SelectItem value="OTHER">Lainnya</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Nama Pemilik & Nomor Admin (Grid Responsive) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="payment-name" className="text-xs font-bold text-emerald-900">
                  Nama Pemilik
                </Label>

                <Input
                  id="payment-name"
                  name="paymentName"
                  placeholder="Pemilik e-wallet/bank"
                  value={form.paymentName}
                  onChange={handleChange}
                  disabled={loading}
                  className="h-10 border-emerald-200/80 bg-white text-stone-800 placeholder:text-stone-400 transition-all duration-200 focus-visible:border-amber-400 focus-visible:ring-2 focus-visible:ring-amber-400/40"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="payment-phone" className="text-xs font-bold text-emerald-900">
                  Nomor Admin
                </Label>

                <Input
                  id="payment-phone"
                  name="paymentPhone"
                  type="tel"
                  placeholder="08xxxxxxxxxx"
                  value={form.paymentPhone}
                  onChange={handleChange}
                  disabled={loading}
                  className="h-10 border-emerald-200/80 bg-white text-stone-800 placeholder:text-stone-400 transition-all duration-200 focus-visible:border-amber-400 focus-visible:ring-2 focus-visible:ring-amber-400/40"
                  required
                />
              </div>
            </div>
          </div>

          {/* Target Tabungan & Password Group (Grid Responsive) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="group-target" className="text-xs font-bold text-emerald-900">
                Target Tabungan (Rp)
              </Label>

              <Input
                id="group-target"
                name="target"
                type="number"
                min="1"
                placeholder="5000000"
                value={form.target}
                onChange={handleChange}
                disabled={loading}
                className="h-10 border-emerald-200/80 bg-emerald-50/60 text-stone-800 placeholder:text-stone-400 transition-all duration-200 focus-visible:bg-white focus-visible:border-amber-400 focus-visible:ring-2 focus-visible:ring-amber-400/40"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="group-password" className="text-xs font-bold text-emerald-900">
                Password Group
              </Label>

              <Input
                id="group-password"
                name="password"
                type="password"
                placeholder="Min. 4 karakter"
                value={form.password}
                onChange={handleChange}
                disabled={loading}
                minLength={4}
                className="h-10 border-emerald-200/80 bg-emerald-50/60 text-stone-800 placeholder:text-stone-400 transition-all duration-200 focus-visible:bg-white focus-visible:border-amber-400 focus-visible:ring-2 focus-visible:ring-amber-400/40"
                required
              />
            </div>
          </div>

          <p className="text-[11px] font-medium text-stone-400 -mt-2">*Password digunakan anggota lain saat hendak bergabung.</p>

          {/* Deskripsi */}
          <div className="space-y-1.5">
            <Label htmlFor="group-description" className="text-xs font-bold text-emerald-900">
              Pesan / Deskripsi
            </Label>

            <Textarea
              id="group-description"
              name="description"
              placeholder="Tulis pesan untuk anggota group..."
              value={form.description}
              onChange={handleChange}
              disabled={loading}
              rows={3}
              className="resize-none border-emerald-200/80 bg-emerald-50/60 text-stone-800 placeholder:text-stone-400 transition-all duration-200 focus-visible:bg-white focus-visible:border-amber-400 focus-visible:ring-2 focus-visible:ring-amber-400/40"
            />
          </div>

          {/* Action Buttons */}
          <DialogFooter className="pt-2 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={loading}
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
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Membuat...
                </span>
              ) : (
                'Buat Group'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateGroupDialog;
