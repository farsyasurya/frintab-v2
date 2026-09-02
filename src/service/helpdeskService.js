import { collection, addDoc, query, where, orderBy, doc, getDoc, updateDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Create a new ticket
export const createTicket = async (uid, { title, description, userName = null, userEmail = null }) => {
  const ticketRef = await addDoc(collection(db, 'helpdeskTickets'), {
    userId: uid,
    userName: userName || null,
    userEmail: userEmail || null,
    title,
    description,
    status: 'OPEN',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastMessage: description,
    lastSenderRole: 'user',
    lastSenderName: userName || null,
    lastMessageAt: serverTimestamp(),
    userUnread: false,
    adminUnread: true,
  });
  return ticketRef.id;
};

// Subscribe to tickets for a specific user (real‑time)
export const subscribeUserTickets = (uid, callback) => {
  const q = query(
    collection(db, 'helpdeskTickets'),
    where('userId', '==', uid),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(
    q,
    (snap) => {
      const tickets = [];
      snap.forEach((doc) => tickets.push({ id: doc.id, ...doc.data() }));
      callback(tickets);
    },
    (err) => {
      console.warn('subscribeUserTickets index fallback triggered:', err);
      // Fallback query tanpa orderBy jika composite index belum dibuat di Firebase
      const fallbackQ = query(
        collection(db, 'helpdeskTickets'),
        where('userId', '==', uid)
      );
      return onSnapshot(fallbackQ, (fallbackSnap) => {
        const tickets = [];
        fallbackSnap.forEach((doc) => tickets.push({ id: doc.id, ...doc.data() }));
        tickets.sort((a, b) => {
          const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0);
          const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0);
          return timeB - timeA;
        });
        callback(tickets);
      });
    }
  );
};

// Subscribe to all tickets (admin view) – real‑time
export const subscribeAllTickets = (callback) => {
  const q = query(collection(db, 'helpdeskTickets'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    const tickets = [];
    snap.forEach((doc) => tickets.push({ id: doc.id, ...doc.data() }));
    callback(tickets);
  });
};

// Get a reference to a ticket document
export const getTicketDoc = (ticketId) => doc(db, 'helpdeskTickets', ticketId);

// Get a ticket by ID (single fetch)
export const getTicketById = async (ticketId) => {
  const ticketRef = getTicketDoc(ticketId);
  const snap = await getDoc(ticketRef);
  if (snap.exists()) {
    return { id: snap.id, ...snap.data() };
  }
  return null;
};

// Add a reply (user or admin)
export const addReply = async (ticketId, { message, adminId = null, adminName = null, userId = null, userName = null }) => {
  const isFromAdmin = Boolean(adminId);
  const senderName = isFromAdmin ? (adminName || 'Admin') : (userName || 'Pengguna');
  const repliesCol = collection(db, 'helpdeskTickets', ticketId, 'replies');
  await addDoc(repliesCol, {
    message,
    adminId: adminId || null,
    adminName: adminName || null,
    userId: userId || null,
    userName: userName || null,
    createdAt: serverTimestamp(),
    read: false,
  });
  // Update ticket's updatedAt timestamp, last message, last sender name and unread flags
  await updateDoc(doc(db, 'helpdeskTickets', ticketId), {
    updatedAt: serverTimestamp(),
    lastMessage: message,
    lastSenderRole: isFromAdmin ? 'admin' : 'user',
    lastSenderName: senderName,
    lastMessageAt: serverTimestamp(),
    userUnread: isFromAdmin ? true : false,
    adminUnread: isFromAdmin ? false : true,
  });
};

// Mark ticket read by User
export const markTicketReadByUser = async (ticketId) => {
  try {
    await updateDoc(doc(db, 'helpdeskTickets', ticketId), {
      userUnread: false,
    });
  } catch (err) {
    console.error('Error marking ticket read by user:', err);
  }
};

// Mark ticket read by Admin
export const markTicketReadByAdmin = async (ticketId) => {
  try {
    await updateDoc(doc(db, 'helpdeskTickets', ticketId), {
      adminUnread: false,
    });
  } catch (err) {
    console.error('Error marking ticket read by admin:', err);
  }
};

// Subscribe to unread tickets for a user (real‑time)
export const subscribeUserUnreadTickets = (uid, callback) => {
  if (!uid) return () => {};
  const q = query(
    collection(db, 'helpdeskTickets'),
    where('userId', '==', uid)
  );
  return onSnapshot(q, (snap) => {
    const unread = [];
    snap.forEach((doc) => {
      const data = doc.data();
      if (data.userUnread === true) {
        unread.push({ id: doc.id, ...data });
      }
    });
    callback(unread);
  }, (err) => {
    console.error('subscribeUserUnreadTickets error:', err);
  });
};

// Subscribe to unread tickets for admin (real‑time)
export const subscribeAdminUnreadTickets = (callback) => {
  const q = query(collection(db, 'helpdeskTickets'));
  return onSnapshot(q, (snap) => {
    const unread = [];
    snap.forEach((doc) => {
      const data = doc.data();
      if (data.adminUnread === true && data.status !== 'CLOSED') {
        unread.push({ id: doc.id, ...data });
      }
    });
    callback(unread);
  }, (err) => {
    console.error('subscribeAdminUnreadTickets error:', err);
  });
};

// Update ticket status (admin only)
export const updateTicketStatus = async (ticketId, status) => {
  await updateDoc(doc(db, 'helpdeskTickets', ticketId), { status, updatedAt: serverTimestamp() });
};

// Subscribe to replies of a ticket (real‑time)
export const subscribeTicketReplies = (ticketId, callback) => {
  const q = collection(db, 'helpdeskTickets', ticketId, 'replies');
  return onSnapshot(q, (snap) => {
    const replies = [];
    snap.forEach((doc) => {
      replies.push({ id: doc.id, ...doc.data() });
    });
    // sort by createdAt ascending
    replies.sort((a, b) => {
      const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0);
      const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0);
      return timeA - timeB;
    });
    callback(replies);
  });
};
