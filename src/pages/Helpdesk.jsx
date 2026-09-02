import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { subscribeUserTickets, createTicket } from '@/service/helpdeskService';
import { LifeBuoy, Plus, ChevronRight, Loader2 } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

// ---------- helpers ----------

const formatListDate = (createdAt) =>
  createdAt?.toDate?.().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) || '-';

const StatusBadge = ({ status }) => {
  const isClosed = status === 'CLOSED';
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium
        ${isClosed ? 'bg-slate-100 text-slate-500' : 'bg-emerald-100 text-emerald-700'}`}
    >
      {isClosed ? 'Ditutup' : 'Terbuka'}
    </span>
  );
};

// ---------- subcomponents ----------

const TicketRow = ({ ticket, onOpen }) => {
  const isUnread = ticket.userUnread === true;
  return (
    <button
      onClick={() => onOpen(ticket)}
      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-b border-slate-100 last:border-b-0 ${isUnread ? 'bg-teal-50/50 hover:bg-teal-50' : 'hover:bg-slate-50'
        }`}
    >
      <div className="relative">
        <div className="h-10 w-10 rounded-full bg-teal-600 text-white flex items-center justify-center shrink-0">
          <LifeBuoy className="h-5 w-5" />
        </div>
        {isUnread && (
          <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-amber-500 border-2 border-white" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className={`text-sm truncate ${isUnread ? 'font-bold text-slate-900' : 'font-medium text-slate-800'}`}>
            {ticket.title}
          </p>
          <span className="text-xs text-slate-400 shrink-0">{formatListDate(ticket.createdAt)}</span>
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <p className="text-sm text-slate-500 truncate">{ticket.description}</p>
          <div className="flex items-center gap-1.5">
            {isUnread && (
              <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 text-amber-800">
                Balasan Baru
              </span>
            )}
            <StatusBadge status={ticket.status} />
          </div>
        </div>
      </div>
      <ChevronRight className="h-4 w-4 text-slate-300 shrink-0" />
    </button>
  );
};

// Dialog buat tiket baru — form dengan label & placeholder yang jelas
const CreateTicketDialog = ({ open, onOpenChange, onSubmit }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form setiap kali dialog dibuka/ditutup
  useEffect(() => {
    if (!open) {
      setTitle('');
      setDescription('');
      setError('');
      setIsSubmitting(false);
    }
  }, [open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();

    if (!trimmedTitle || !trimmedDescription) {
      setError('Judul dan penjelasan masalah wajib diisi.');
      return;
    }

    setError('');
    setIsSubmitting(true);
    try {
      await onSubmit({ title: trimmedTitle, description: trimmedDescription });
      onOpenChange(false);
    } catch (err) {
      setError('Gagal membuat tiket. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Buat Tiket Baru</DialogTitle>
          <DialogDescription>
            Ceritakan kendala yang Anda alami, tim kami akan segera membantu.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ticket-title">Judul Masalah</Label>
            <Input
              id="ticket-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Tidak bisa login ke akun"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ticket-description">Penjelasan</Label>
            <Textarea
              id="ticket-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Jelaskan masalah Anda secara singkat: apa yang terjadi, sejak kapan, dan langkah apa yang sudah dicoba."
              rows={4}
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button type="submit" className="bg-teal-600 hover:bg-teal-500" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Mengirim...
                </>
              ) : (
                'Kirim'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// ---------- main component ----------

const Helpdesk = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;
    setLoading(true);
    const unsubscribe = subscribeUserTickets(user.uid, (data) => {
      setTickets(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user?.uid]);

  const handleCreateTicket = async ({ title, description }) => {
    const userName = user?.displayName || user?.name || user?.email?.split('@')[0] || 'Pengguna';
    await createTicket(user.uid, {
      title,
      description,
      userName,
      userEmail: user?.email || null,
    });
  };

  const openCount = tickets.filter((t) => t.status !== 'CLOSED').length;

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 pb-24">
        <div className="flex items-center gap-2 mb-1">
          <LifeBuoy className="h-6 w-6 text-teal-600" />
          <h1 className="text-2xl font-semibold text-slate-800">Helpdesk</h1>
        </div>
        <p className="text-sm text-slate-500 mb-6">
          {loading
            ? 'Memuat tiket Anda...'
            : tickets.length === 0
            ? 'Belum ada tiket yang Anda buat.'
            : `${openCount} tiket terbuka dari ${tickets.length} total tiket.`}
        </p>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 border border-slate-100 rounded-xl bg-slate-50/50">
            <Loader2 className="h-7 w-7 text-teal-600 animate-spin" />
            <p className="text-sm text-slate-400">Memuat data tiket...</p>
          </div>
        ) : tickets.length === 0 ? (
          <div className="border border-dashed border-slate-200 rounded-xl py-16 text-center">
            <p className="text-slate-400 text-sm mb-4">Anda belum memiliki tiket.</p>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-sm rounded-full transition-colors"
            >
              <Plus className="h-4 w-4" />
              Buat Ticket Baru
            </button>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            {tickets.map((t) => (
              <TicketRow key={t.id} ticket={t} onOpen={(ticket) => navigate(`/helpdesk/${ticket.id}`)} />
            ))}
          </div>
        )}
      </div>

      {/* Floating action button — only when there's already a list to avoid duplicate CTA */}
      {!loading && tickets.length > 0 && (
        <button
          onClick={() => setIsCreateOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-teal-600 hover:bg-teal-500 text-white shadow-lg flex items-center justify-center transition-transform hover:scale-105"
          aria-label="Buat ticket baru"
        >
          <Plus className="h-6 w-6" />
        </button>
      )}

      <CreateTicketDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSubmit={handleCreateTicket}
      />
    </div>
  );
};

export default Helpdesk;