import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import {
  subscribeAllTickets,
  updateTicketStatus,
  addReply,
  subscribeTicketReplies,
  markTicketReadByAdmin,
} from '@/service/helpdeskService';
import { ShieldCheck, X, CheckCircle2, ArrowLeft, Loader2 } from 'lucide-react';

// ---------- helpers ----------

const isAdminUser = (user) =>
  user?.role === 'SUPERADMIN' ||
  (Array.isArray(user?.role) ? user.role.includes('ADMIN') : user?.role === 'ADMIN');

const getSenderName = (ticketOrUser) => {
  if (!ticketOrUser) return 'Pengguna';
  if (typeof ticketOrUser === 'object') {
    return (
      ticketOrUser.userName ||
      ticketOrUser.displayName ||
      ticketOrUser.name ||
      (ticketOrUser.userEmail ? ticketOrUser.userEmail.split('@')[0] : null) ||
      (ticketOrUser.userId && ticketOrUser.userId.includes('@') ? ticketOrUser.userId.split('@')[0] : null) ||
      'Pengguna'
    );
  }
  if (typeof ticketOrUser === 'string') {
    return ticketOrUser.includes('@') ? ticketOrUser.split('@')[0] : 'Pengguna';
  }
  return 'Pengguna';
};

const getInitials = (name) =>
  name
    ?.split(/[.\s_-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join('') || '?';

const formatListDate = (createdAt) =>
  createdAt?.toDate?.().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) || '-';

const formatBubbleTime = (createdAt) =>
  createdAt?.toDate?.().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) || '';

const formatDayLabel = (createdAt) => {
  const date = createdAt?.toDate?.();
  if (!date) return '';
  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();
  if (isToday) return 'Hari ini';
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
};

const groupByDay = (messages) => {
  const groups = [];
  let currentLabel = null;
  messages.forEach((m) => {
    const label = formatDayLabel(m.createdAt);
    if (label !== currentLabel) {
      groups.push({ label, items: [m] });
      currentLabel = label;
    } else {
      groups[groups.length - 1].items.push(m);
    }
  });
  return groups;
};

const notifySuccess = (title) =>
  Swal.fire({ icon: 'success', title, timer: 1200, showConfirmButton: false });

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

const TicketRow = ({ ticket, onOpenDetail }) => {
  const isUnread = ticket.adminUnread && ticket.status !== 'CLOSED';
  const senderName = getSenderName(ticket);
  return (
    <button
      onClick={() => onOpenDetail(ticket)}
      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-b border-slate-100 last:border-b-0 ${
        isUnread ? 'bg-emerald-50/50 hover:bg-emerald-50' : 'hover:bg-slate-50'
      }`}
    >
      <div className="relative">
        <div className="h-10 w-10 rounded-full bg-emerald-600 text-white flex items-center justify-center text-sm font-semibold shrink-0">
          {getInitials(senderName)}
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
          <p className="text-sm text-slate-500 truncate">{senderName}</p>
          <div className="flex items-center gap-1.5">
            {isUnread && (
              <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 text-amber-800">
                Pesan Baru
              </span>
            )}
            <StatusBadge status={ticket.status} />
          </div>
        </div>
      </div>
    </button>
  );
};

const ChatBubble = ({ message, time, fromAdmin, senderLabel }) => (
  <div className={`flex ${fromAdmin ? 'justify-end' : 'justify-start'} px-3`}>
    <div
      className={`relative max-w-[75%] sm:max-w-[60%] px-3 py-2 text-sm leading-relaxed shadow-sm break-words
        ${fromAdmin
          ? 'bg-emerald-100 text-slate-800 rounded-2xl rounded-tr-sm'
          : 'bg-white text-slate-800 rounded-2xl rounded-tl-sm border border-slate-200'
        }`}
    >
      {!fromAdmin && senderLabel && (
        <p className="text-[11px] font-medium text-emerald-700 mb-0.5">{senderLabel}</p>
      )}
      <p className="whitespace-pre-wrap">{message}</p>
      {time && (
        <span className="block text-[10px] text-slate-400 text-right mt-1 select-none">
          {time}
        </span>
      )}
    </div>
  </div>
);

const DateDivider = ({ label }) =>
  label ? (
    <div className="flex justify-center my-3">
      <span className="text-xs text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
        {label}
      </span>
    </div>
  ) : null;

const TicketDetailPanel = ({ ticket, replies, onClose, onReply, onCloseTicket }) => {
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [replies, ticket]);

  if (!ticket) return null;

  const isClosed = ticket.status === 'CLOSED';
  const senderName = getSenderName(ticket);

  const handleSend = async () => {
    const message = draft.trim();
    if (!message || sending) return;
    setSending(true);
    setDraft('');
    try {
      await onReply(ticket.id, message);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const thread = [
    {
      id: 'origin',
      message: ticket.description,
      createdAt: ticket.createdAt,
      adminId: null,
      userName: ticket.userName || senderName,
    },
    ...replies,
  ];
  const dayGroups = groupByDay(thread);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white w-full max-w-2xl h-[85vh] rounded-xl shadow-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 bg-emerald-700 text-white shrink-0">
          <button
            onClick={onClose}
            className="p-1 -ml-1 rounded-full hover:bg-white/10 transition-colors md:hidden"
            aria-label="Kembali"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <div className="h-9 w-9 rounded-full bg-emerald-500 flex items-center justify-center text-sm font-semibold shrink-0">
            {getInitials(senderName)}
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-medium truncate leading-tight">{ticket.title}</p>
            <p className="text-xs text-emerald-100 truncate">
              {senderName} · {isClosed ? 'Tiket ditutup' : 'Tiket terbuka'}
            </p>
          </div>

          {!isClosed && (
            <button
              onClick={() => onCloseTicket(ticket.id)}
              className="flex items-center gap-1 text-xs bg-white/10 hover:bg-white/20 transition-colors px-2.5 py-1.5 rounded-full"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Tutup
            </button>
          )}

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 transition-colors hidden md:inline-flex"
            aria-label="Tutup panel"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Chat body */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto py-4 space-y-1 bg-slate-50">
          {dayGroups.map((group, gi) => (
            <div key={gi}>
              <DateDivider label={group.label} />
              <div className="space-y-2">
                {group.items.map((m) => (
                  <ChatBubble
                    key={m.id}
                    message={m.message}
                    time={formatBubbleTime(m.createdAt)}
                    fromAdmin={!!m.adminId}
                    senderLabel={!m.adminId ? (m.userName || senderName || 'Pengguna') : null}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Composer */}
        <div className="border-t border-slate-200 bg-white px-3 py-3 shrink-0">
          {isClosed ? (
            <p className="text-center text-xs text-slate-400 py-2">
              Tiket ini sudah ditutup dan tidak dapat dibalas.
            </p>
          ) : (
            <div className="flex items-end gap-2">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Tulis balasan…"
                rows={1}
                className="flex-1 resize-none max-h-32 rounded-full bg-slate-100 text-sm text-slate-800 placeholder-slate-400 px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                onClick={handleSend}
                disabled={!draft.trim() || sending}
                className="shrink-0 h-10 w-10 rounded-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-300 text-white flex items-center justify-center transition-colors"
                aria-label="Kirim balasan"
              >
                <svg viewBox="0 0 24 24" fill="none" className="h-4.5 w-4.5" stroke="currentColor" strokeWidth="2">
                  <path d="M4 12L20 4L13 20L11 13L4 12Z" strokeLinejoin="round" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ---------- main component ----------

const AdminHelpdesk = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [tickets, setTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [detailTicket, setDetailTicket] = useState(null);
  const [detailReplies, setDetailReplies] = useState([]);

  // Access guard + ticket subscription
  useEffect(() => {
    // Tunggu proses autentikasi selesai dulu sebelum memvalidasi role
    if (authLoading) return;

    if (!isAdminUser(user)) {
      Swal.fire({
        icon: 'error',
        title: 'Akses Ditolak',
        text: 'Anda tidak memiliki hak akses ke halaman Admin Helpdesk.',
        confirmButtonText: 'Kembali',
      }).then(() => navigate('/'));
      return;
    }

    setLoadingTickets(true);
    const unsubscribe = subscribeAllTickets((data) => {
      setTickets(data);
      setLoadingTickets(false);
    });
    return () => unsubscribe();
  }, [user, authLoading, navigate]);

  // Detail replies subscription — cleaned up whenever the open ticket changes
  useEffect(() => {
    if (!detailTicket) {
      setDetailReplies([]);
      return;
    }
    const unsubscribe = subscribeTicketReplies(detailTicket.id, setDetailReplies);
    return () => unsubscribe();
  }, [detailTicket]);

  const handleCloseTicket = async (ticketId) => {
    const confirm = await Swal.fire({
      icon: 'question',
      title: 'Tutup tiket ini?',
      text: 'Pengguna tidak akan bisa membalas setelah tiket ditutup.',
      showCancelButton: true,
      confirmButtonText: 'Ya, tutup',
      cancelButtonText: 'Batal',
    });
    if (!confirm.isConfirmed) return;
    await updateTicketStatus(ticketId, 'CLOSED');
    notifySuccess('Ticket Ditutup');
  };

  const handleReply = async (ticketId, message) => {
    const adminName = user?.displayName || user?.name || 'Admin';
    await addReply(ticketId, { message, adminId: user?.uid, adminName });
  };

  const openDetail = (ticket) => {
    setDetailTicket(ticket);
    if (ticket?.id) {
      markTicketReadByAdmin(ticket.id);
    }
  };
  const closeDetail = () => setDetailTicket(null);

  const openCount = tickets.filter((t) => t.status !== 'CLOSED').length;

  return (
    <>
      <div className="min-h-screen bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="h-6 w-6 text-emerald-600" />
            <h1 className="text-2xl font-semibold text-slate-800">Admin Helpdesk</h1>
          </div>
          <p className="text-sm text-slate-500 mb-6">
            {authLoading || loadingTickets
              ? 'Memuat data tiket...'
              : tickets.length === 0
              ? 'Belum ada tiket masuk.'
              : `${openCount} tiket terbuka dari ${tickets.length} total tiket.`}
          </p>

          {authLoading || loadingTickets ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 border border-slate-100 rounded-xl bg-slate-50/50">
              <Loader2 className="h-7 w-7 text-emerald-600 animate-spin" />
              <p className="text-sm text-slate-400">Memuat data tiket...</p>
            </div>
          ) : tickets.length === 0 ? (
            <div className="border border-dashed border-slate-200 rounded-xl py-16 text-center">
              <p className="text-slate-400 text-sm">Tidak ada tiket yang terbuka.</p>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              {tickets.map((t) => (
                <TicketRow key={t.id} ticket={t} onOpenDetail={openDetail} />
              ))}
            </div>
          )}
        </div>
      </div>

      <TicketDetailPanel
        ticket={detailTicket}
        replies={detailReplies}
        onClose={closeDetail}
        onReply={handleReply}
        onCloseTicket={handleCloseTicket}
      />
    </>
  );
};

export default AdminHelpdesk;