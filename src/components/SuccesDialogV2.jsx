import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PartyPopper } from 'lucide-react';

export function SuccessDialogV2({ open, onOpenChange, teks = "Berhasil!" }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="success-dialog-content rounded-2xl border border-stone-100 bg-white p-6 text-center shadow-xl sm:max-w-xs">
        <style>{`
          @keyframes popBounce {
            0%   { transform: scale(0) rotate(-15deg); opacity: 0; }
            50%  { transform: scale(1.15) rotate(8deg); opacity: 1; }
            70%  { transform: scale(0.95) rotate(-4deg); }
            100% { transform: scale(1) rotate(0deg); }
          }
          @keyframes confettiPop {
            0%   { transform: translate(0, 0) scale(0); opacity: 1; }
            70%  { opacity: 1; }
            100% { transform: translate(var(--tx), var(--ty)) scale(1); opacity: 0; }
          }
          @keyframes dialogZoomIn {
            0%   { transform: scale(0.85); opacity: 0; }
            100% { transform: scale(1); opacity: 1; }
          }
          .success-dialog-content {
            animation: dialogZoomIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
          }
          .success-icon-wrap {
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .success-icon-circle {
            animation: popBounce 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s both;
          }
          .confetti-dot {
            position: absolute;
            top: 50%;
            left: 50%;
            width: 6px;
            height: 6px;
            border-radius: 9999px;
            animation: confettiPop 0.7s ease-out 0.25s both;
          }
        `}</style>

        <DialogHeader className="items-center space-y-3">
          <div className="success-icon-wrap h-16 w-16">
            {/* confetti particles */}
            <span className="confetti-dot bg-emerald-400" style={{ '--tx': '-28px', '--ty': '-24px' }} />
            <span className="confetti-dot bg-amber-400" style={{ '--tx': '26px', '--ty': '-20px' }} />
            <span className="confetti-dot bg-rose-400" style={{ '--tx': '-22px', '--ty': '22px' }} />
            <span className="confetti-dot bg-sky-400" style={{ '--tx': '24px', '--ty': '26px' }} />
            <span className="confetti-dot bg-violet-400" style={{ '--tx': '0px', '--ty': '-32px' }} />
            <span className="confetti-dot bg-emerald-300" style={{ '--tx': '0px', '--ty': '32px' }} />

            {/* icon utama */}
            <div className="success-icon-circle flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <PartyPopper className="h-7 w-7" strokeWidth={2.5} />
            </div>
          </div>

          <DialogTitle className="text-lg font-bold text-stone-800">{teks}</DialogTitle>
        </DialogHeader>

        <DialogFooter className="mt-4 sm:justify-center">
          <Button
            onClick={() => onOpenChange(false)}
            className="w-full bg-emerald-600 font-semibold text-white hover:bg-emerald-700 active:scale-95"
          >
            Oke
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}