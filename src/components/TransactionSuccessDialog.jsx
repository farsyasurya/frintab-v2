import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
      <DialogContent className="cat-dialog-content max-w-sm rounded-3xl border border-stone-100 bg-white/95 p-6 text-center backdrop-blur-xl shadow-2xl transition-all duration-300">
        <style>{`
          @keyframes catEntrance {
            0% { transform: scale(0.6) translateY(20px) rotate(-6deg); opacity: 0; }
            60% { transform: scale(1.08) translateY(-4px) rotate(3deg); opacity: 1; }
            100% { transform: scale(1) translateY(0) rotate(0deg); }
          }
          @keyframes catFloat {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-6px) rotate(2deg); }
          }
          @keyframes confettiPop {
            0% { transform: translate(0, 0) scale(0); opacity: 1; }
            70% { opacity: 1; }
            100% { transform: translate(var(--tx), var(--ty)) scale(1.2); opacity: 0; }
          }
          @keyframes glowPulse {
            0%, 100% { opacity: 0.4; transform: scale(0.95); }
            50% { opacity: 0.8; transform: scale(1.05); }
          }
          .cat-dialog-content {
            animation: dialogPop 0.28s cubic-bezier(0.34, 1.56, 0.64, 1);
          }
          .cat-badge-container {
            animation: catEntrance 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.05s both;
          }
          .cat-image-anim {
            animation: catFloat 3s ease-in-out infinite 0.65s;
          }
          .confetti-burst {
            position: absolute;
            top: 50%;
            left: 50%;
            width: 8px;
            height: 8px;
            border-radius: 9999px;
            animation: confettiPop 0.75s ease-out 0.2s both;
          }
        `}</style>

        <DialogHeader className="items-center space-y-3">
          {/* Mascot Wrap with floating elements and confetti */}
          <div className="relative flex items-center justify-center pt-2">
            {/* Ambient Background Glow */}
            <div
              className={`absolute h-44 w-44 rounded-full blur-2xl animate-pulse ${isIncome ? 'bg-emerald-400/30' : 'bg-amber-400/30'
                }`}
            />

            {/* Confetti particles */}
            <span className="confetti-burst bg-emerald-400" style={{ '--tx': '-55px', '--ty': '-40px' }} />
            <span className="confetti-burst bg-amber-400" style={{ '--tx': '55px', '--ty': '-35px' }} />
            <span className="confetti-burst bg-rose-400" style={{ '--tx': '-48px', '--ty': '42px' }} />
            <span className="confetti-burst bg-sky-400" style={{ '--tx': '50px', '--ty': '45px' }} />
            <span className="confetti-burst bg-yellow-300" style={{ '--tx': '0px', '--ty': '-55px' }} />
            <span className="confetti-burst bg-indigo-400" style={{ '--tx': '-55px', '--ty': '8px' }} />
            <span className="confetti-burst bg-teal-400" style={{ '--tx': '55px', '--ty': '8px' }} />

            {/* Cat Mascot Frame (Enlarged & Zoomed In) */}
            <div className="cat-badge-container relative flex h-40 w-40 items-center justify-center">
              <div
                className={`relative flex h-40 w-40 items-center justify-center overflow-hidden rounded-full border-4 ${isIncome
                  ? 'border-emerald-300 bg-gradient-to-b from-emerald-50 to-emerald-100/70 shadow-xl shadow-emerald-500/25'
                  : 'border-amber-300 bg-gradient-to-b from-amber-50 to-amber-100/70 shadow-xl shadow-amber-500/25'
                  }`}
              >
                <img
                  src="/kuc.jpeg"
                  alt="Kucing Sukses"
                  className="cat-image-anim h-full w-full object-cover scale-140 translate-x-2 -translate-y-1 transition-transform duration-300 select-none"
                />
              </div>

              {/* Status Badge Icon */}
              <div
                className={`absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full border-2 border-white shadow-md ${isIncome ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'
                  }`}
              >
                {isIncome ? <CheckCircle2 className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
              </div>
            </div>
          </div>

          {/* Amount Chip */}
          {data.total ? (
            <div
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-bold tracking-wide shadow-sm ${isIncome
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                : 'bg-amber-100 text-amber-800 border border-amber-200'
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
          <DialogTitle className="text-xl font-extrabold text-stone-800">
            {isIncome ? 'Berhasil Menabung! 🎉' : 'Pengajuan Berhasil! ⏳'}
          </DialogTitle>

          {/* Custom Message according to type */}
          <DialogDescription className="text-xs font-medium leading-relaxed text-stone-600 px-2">
            {isIncome
              ? 'Berhasil! Terima kasih sudah menabung hari ini. Tetap konsisten dan semangat mencapai target impianmu!'
              : 'Berhasil! Pengeluaran telah diajukan dan sedang menunggu persetujuan dari admin grup.'}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="mt-5 sm:justify-center">
          <Button
            type="button"
            onClick={() => onOpenChange(false)}
            className={`w-full h-11 rounded-xl font-bold text-white shadow-md transition-all duration-200 hover:shadow-lg active:scale-95 ${isIncome
              ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25'
              : 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/25'
              }`}
          >
            Oke, Mengerti
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
