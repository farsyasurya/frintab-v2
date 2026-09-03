import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Swal from 'sweetalert2';
import {
  getTicketById,
  subscribeTicketReplies,
  addReply,
  updateTicketStatus,
  markTicketReadByUser,
} from '@/service/helpdeskService';
import { ArrowLeft, LifeBuoy } from 'lucide-react';

// ---------- helpers ----------

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

// Group messages by calendar day so we can show WA-style date dividers
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

// ---------- subcomponents ----------

const DateDivider = ({ label }) =>
  label ? (
    <div className="flex justify-center my-3">
      <span className="text-xs text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
        {label}
      </span>
    </div>
  ) : null;

// From the user's point of view, their own messages sit on the right (teal),
// admin replies sit on the left (white) — mirror of the admin-side view.
const ChatBubble = ({ message, time, fromMe, senderLabel }) => (
  <div className={`flex ${fromMe ? 'justify-end' : 'justify-start'} px-3`}>
    <div
      className={`relative max-w-[75%] sm:max-w-[60%] px-3 py-2 text-sm leading-relaxed shadow-sm break-words
        ${fromMe
          ? 'bg-teal-100 text-slate-800 rounded-2xl rounded-tr-sm'
          : 'bg-white text-slate-800 rounded-2xl rounded-tl-sm border border-slate-200'
        }`}
    >
      {!fromMe && senderLabel && (
        <p className="text-[11px] font-medium text-emerald-600 mb-0.5">{senderLabel}</p>
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

// ---------- main component ----------

const HelpdeskDetail = () => {
  const { ticketId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [ticket, setTicket] = useState(null);
  const [replies, setReplies] = useState([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    const fetchTicket = async () => {
      const data = await getTicketById(ticketId);
      setTicket(data);
      if (data) {
        markTicketReadByUser(ticketId);
      }
    };
    fetchTicket();
    const unsub = subscribeTicketReplies(ticketId, (reps) => {
      setReplies(reps);
      markTicketReadByUser(ticketId);
    });
    return () => unsub();
  }, [ticketId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [replies, ticket]);

  const handleSend = async () => {
    const message = draft.trim();
    if (!message || sending) return;
    setSending(true);
    setDraft('');
    try {
      const userName = user?.displayName || user?.name || user?.email?.split('@')[0] || 'Pengguna';
      await addReply(ticketId, { message, userId: user?.uid, userName });
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

  if (!ticket) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-slate-400 text-sm">Memuat tiket…</p>
      </div>
    );
  }

  const isClosed = ticket.status === 'CLOSED';

  // Original ticket description is the first message in the thread, sent by the user
  const thread = [
    {
      id: 'origin',
      message: ticket.description,
      createdAt: ticket.createdAt,
      adminId: null,
      userId: ticket.userId,
      userName: ticket.userName || null,
    },
    ...replies,
  ];
  const dayGroups = groupByDay(thread);

  return (
    <div className="min-h-[85vh] bg-white flex justify-center">
      <div className="w-full max-w-2xl flex flex-col h-[85vh] border-x border-slate-200">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 bg-emerald-700 text-white shadow-sm">
          <button
            onClick={() => navigate(-1)}
            className="p-1 -ml-1 rounded-full hover:bg-white/10 transition-colors"
            aria-label="Kembali"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <div className="h-9 w-9 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
            <LifeBuoy className="h-4.5 w-4.5" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-medium truncate leading-tight">{ticket.title}</p>
            <p className="text-xs text-emerald-100 truncate">
              {isClosed ? 'Tiket ditutup' : 'Tim support akan segera membalas'}
            </p>
          </div>
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
                    fromMe={!m.adminId}
                    senderLabel={m.adminId ? (m.adminName || 'Admin Helpdesk') : null}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Composer */}
        <div className="border-t border-slate-200 bg-white px-3 py-3">
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
                className="flex-1 resize-none max-h-32 rounded-full bg-slate-100 text-sm text-slate-800 placeholder-slate-400 px-4 py-2.5 outline-none focus:ring-2 focus:ring-teal-500"
              />
              <button
                onClick={handleSend}
                disabled={!draft.trim() || sending}
                className="shrink-0 h-10 w-10 rounded-full bg-teal-600 hover:bg-teal-500 disabled:bg-teal-300 text-white flex items-center justify-center transition-colors"
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

export default HelpdeskDetail;