import { useState } from 'react';

import { useAuth } from '@/contexts/AuthContext';
import { joinGroup } from '@/service/groupService';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const initialForm = {
  code: '',
  password: '',
};

const JoinGroupDialog = ({ open, onOpenChange, onSuccess }) => {
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

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError('');

    if (!form.code.trim()) {
      setError('Kode group wajib diisi.');
      return;
    }

    if (!form.password) {
      setError('Password group wajib diisi.');
      return;
    }

    try {
      setLoading(true);

      const result = await joinGroup({
        code: form.code.trim().toUpperCase(),
        password: form.password,
        user,
      });

      setForm(initialForm);
      onOpenChange(false);

      onSuccess?.(result);
    } catch (error) {
      console.error('Join group error:', error);

      setError(error.message || 'Gagal bergabung ke group.');
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
          {/* Header Icon */}
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400/20 text-lg text-amber-600 shadow-inner">🔑</div>

          <DialogTitle className="text-xl font-extrabold tracking-tight text-stone-800">Join Group</DialogTitle>

          <DialogDescription className="text-xs font-medium text-stone-500">
            Masukkan kode dan password group untuk bergabung ke tabungan bersama.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-2 space-y-4">
          {error && (
            <Alert variant="destructive" className="border-rose-200 bg-rose-50/80 text-rose-800">
              <AlertDescription className="text-xs font-semibold">{error}</AlertDescription>
            </Alert>
          )}

          {/* Group Code Input */}
          <div className="space-y-1.5">
            <Label htmlFor="group-code" className="text-xs font-bold text-emerald-900">
              Kode Group
            </Label>

            <Input
              id="group-code"
              name="code"
              placeholder="Contoh: K7F2P9XA"
              value={form.code}
              onChange={handleChange}
              disabled={loading}
              maxLength={8}
              className="h-10 border-emerald-200/80 bg-emerald-50/60 text-stone-800 font-mono font-bold tracking-widest uppercase placeholder:text-stone-400 placeholder:font-sans placeholder:tracking-normal transition-all duration-200 focus-visible:bg-white focus-visible:border-amber-400 focus-visible:ring-2 focus-visible:ring-amber-400/40 disabled:opacity-50"
              required
            />

            <p className="text-[11px] font-medium text-stone-400">*Masukkan 8 karakter kode yang diberikan oleh admin/pemilik group.</p>
          </div>

          {/* Group Password Input */}
          <div className="space-y-1.5">
            <Label htmlFor="join-password" className="text-xs font-bold text-emerald-900">
              Password Group
            </Label>

            <Input
              id="join-password"
              name="password"
              type="password"
              placeholder="Masukkan password group"
              value={form.password}
              onChange={handleChange}
              disabled={loading}
              className="h-10 border-emerald-200/80 bg-emerald-50/60 text-stone-800 placeholder:text-stone-400 transition-all duration-200 focus-visible:bg-white focus-visible:border-amber-400 focus-visible:ring-2 focus-visible:ring-amber-400/40 disabled:opacity-50"
              required
            />
          </div>

          {/* Footer Actions */}
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
                  Bergabung...
                </span>
              ) : (
                'Join Group'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default JoinGroupDialog;
