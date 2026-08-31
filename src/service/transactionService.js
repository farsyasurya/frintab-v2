import {
  collection,
  doc,
  getDocs,
  query,
  runTransaction,
  serverTimestamp,
  where,
  orderBy,
  limit,
  startAfter,
  endBefore,
  Timestamp,
  limitToLast,
  collectionGroup,
} from 'firebase/firestore';
const PAGE_SIZE = 5;

import { db } from '@/lib/firebase';

/**
 * Membuat transaksi
 *
 * INCOME
 *  -> langsung menambah saldo
 *
 * EXPENSE
 *  -> masuk pending
 *  -> tidak mengurangi saldo
 */
export const createTransaction = async ({ group, user, total, type, date, message }) => {
  if (!user?.uid) {
    throw new Error('User belum login.');
  }

  if (!group?.id) {
    throw new Error('Group tidak ditemukan.');
  }

  if (!total || Number(total) <= 0) {
    throw new Error('Total transaksi harus lebih dari 0.');
  }

  if (!['INCOME', 'EXPENSE'].includes(type)) {
    throw new Error('Tipe transaksi tidak valid.');
  }

  if (!date) {
    throw new Error('Tanggal transaksi wajib diisi.');
  }

  const admins = Array.isArray(group.admin) ? group.admin : [];

  if (admins.length === 0) {
    throw new Error('Group belum memiliki admin.');
  }

  const transactionRef = doc(collection(db, 'groups', group.id, 'transactions'));

  /*
   * Admin yang wajib approve.
   *
   * Admin bisa berupa:
   *
   * ["uid1", "uid2"]
   *
   * atau:
   *
   * [
   *   {
   *     uid: "uid1",
   *     displayName: "Farsya"
   *   }
   * ]
   */
  const requiredAdmins = admins.map((admin) => {
    if (typeof admin === 'string') {
      return {
        adminId: admin,
        adminName: '',
      };
    }

    return {
      adminId: admin.uid || admin.adminId || '',
      adminName: admin.displayName || admin.name || admin.adminName || '',
    };
  });

  const isExpense = type === 'EXPENSE';

  const transactionData = {
    groupId: group.id,
    groupCode: group.code || '',
    groupName: group.name || '',

    total: Number(total),

    type,

    date,

    message: message || '',

    userId: user.uid,
    userName: user.displayName || user.name || '',

    status: isExpense ? 'PENDING' : 'APPROVED',

    requiredAdmins,

    approvals: [],
    rejections: [],

    rejectionReason: '',

    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await runTransaction(db, async (transaction) => {
    const groupRef = doc(db, 'groups', group.id);

    const groupSnapshot = await transaction.get(groupRef);

    if (!groupSnapshot.exists()) {
      throw new Error('Group tidak ditemukan.');
    }

    const groupData = groupSnapshot.data();

    const currentBalance = Number(groupData.balance || 0);

    /*
     * EXPENSE
     *
     * Belum mengubah saldo.
     */
    if (isExpense) {
      transaction.set(transactionRef, transactionData);

      return;
    }

    /*
     * INCOME
     *
     * Langsung tambah saldo.
     */
    const newBalance = currentBalance + Number(total);

    transaction.update(groupRef, {
      balance: newBalance,
      updatedAt: serverTimestamp(),
    });

    transaction.set(transactionRef, transactionData);
  });

  return {
    id: transactionRef.id,
    ...transactionData,
  };
};

/**
 * APPROVE TRANSACTION
 *
 * Kalau admin hanya 1:
 *  -> langsung APPROVED
 *
 * Kalau admin 2:
 *  -> admin pertama approve
 *  -> masih PENDING
 *  -> admin kedua approve
 *  -> APPROVED
 *
 * Saldo hanya berkurang ketika
 * seluruh admin sudah approve.
 */
export const approveTransaction = async ({ groupId, transactionId, user }) => {
  if (!user?.uid) {
    throw new Error('User belum login.');
  }

  if (!groupId || !transactionId) {
    throw new Error('Data transaksi tidak lengkap.');
  }

  const groupRef = doc(db, 'groups', groupId);

  const transactionRef = doc(db, 'groups', groupId, 'transactions', transactionId);

  await runTransaction(db, async (transaction) => {
    const groupSnapshot = await transaction.get(groupRef);

    const transactionSnapshot = await transaction.get(transactionRef);

    if (!groupSnapshot.exists()) {
      throw new Error('Group tidak ditemukan.');
    }

    if (!transactionSnapshot.exists()) {
      throw new Error('Transaksi tidak ditemukan.');
    }

    const group = groupSnapshot.data();
    const transactionData = transactionSnapshot.data();

    // =========================
    // CEK ADMIN
    // =========================

    const adminIds = Array.isArray(group.adminIds) ? group.adminIds : Array.isArray(group.admin) ? group.admin : [];

    if (!adminIds.includes(user.uid)) {
      throw new Error('Kamu bukan admin group ini.');
    }

    // =========================
    // CEK STATUS
    // =========================

    if (transactionData.status !== 'PENDING') {
      throw new Error('Pengajuan ini sudah diproses.');
    }

    // =========================
    // CEK APPROVAL SEBELUMNYA
    // =========================

    const approvals = Array.isArray(transactionData.approvals) ? transactionData.approvals : [];

    const alreadyApproved = approvals.some((approval) => approval.adminId === user.uid);

    if (alreadyApproved) {
      throw new Error('Kamu sudah menyetujui pengajuan ini.');
    }

    // =========================
    // DATA ADMIN
    // =========================

    const adminName = user.displayName || user.name || user.email || 'Admin';

    const newApproval = {
      adminId: user.uid,
      adminName,
      approvedAt: new Date(),
    };

    const updatedApprovals = [...approvals, newApproval];

    // =========================
    // CEK APAKAH SEMUA ADMIN
    // SUDAH APPROVE
    // =========================

    const requiredApprovals = adminIds.length;

    const isFullyApproved = updatedApprovals.length >= requiredApprovals;

    if (isFullyApproved) {
      const total = Number(transactionData.total || 0);

      if (total <= 0) {
        throw new Error('Total transaksi tidak valid.');
      }

      const currentBalance = Number(group.balance || 0);

      if (transactionData.type === 'EXPENSE' && currentBalance < total) {
        throw new Error('Saldo group tidak mencukupi.');
      }

      let newBalance = currentBalance;

      // =========================
      // UBAH SALDO
      // =========================

      if (transactionData.type === 'EXPENSE') {
        newBalance = currentBalance - total;
      }

      if (transactionData.type === 'INCOME') {
        newBalance = currentBalance + total;
      }

      // =========================
      // TRANSAKSI APPROVED
      // =========================

      transaction.update(transactionRef, {
        approvals: updatedApprovals,

        status: 'APPROVED',

        approvedAt: serverTimestamp(),

        approvedBy: updatedApprovals,

        updatedAt: serverTimestamp(),
      });

      // =========================
      // UPDATE SALDO GROUP
      // =========================

      transaction.update(groupRef, {
        balance: newBalance,
        updatedAt: serverTimestamp(),
      });
    } else {
      // =========================
      // BARU SEBAGIAN APPROVE
      // =========================

      transaction.update(transactionRef, {
        approvals: updatedApprovals,

        status: 'PENDING',

        approvalStatus: `${updatedApprovals.length}/${requiredApprovals}`,

        lastApprovedBy: {
          adminId: user.uid,
          adminName,
          approvedAt: serverTimestamp(),
        },

        updatedAt: serverTimestamp(),
      });
    }
  });

  return {
    success: true,
  };
};

/**
 * REJECT TRANSACTION
 */
export const rejectTransaction = async ({ groupId, transactionId, user, reason }) => {
  if (!user?.uid) {
    throw new Error('User belum login.');
  }

  if (!groupId || !transactionId) {
    throw new Error('Data transaksi tidak lengkap.');
  }

  if (!reason?.trim()) {
    throw new Error('Alasan penolakan wajib diisi.');
  }

  const groupRef = doc(db, 'groups', groupId);

  const transactionRef = doc(db, 'groups', groupId, 'transactions', transactionId);

  await runTransaction(db, async (transaction) => {
    const groupSnapshot = await transaction.get(groupRef);

    const transactionSnapshot = await transaction.get(transactionRef);

    if (!groupSnapshot.exists()) {
      throw new Error('Group tidak ditemukan.');
    }

    if (!transactionSnapshot.exists()) {
      throw new Error('Transaksi tidak ditemukan.');
    }

    const group = groupSnapshot.data();
    const transactionData = transactionSnapshot.data();

    // =========================
    // CEK ADMIN
    // =========================

    const adminIds = Array.isArray(group.adminIds) ? group.adminIds : Array.isArray(group.admin) ? group.admin : [];

    if (!adminIds.includes(user.uid)) {
      throw new Error('Kamu bukan admin group ini.');
    }

    // =========================
    // CEK STATUS
    // =========================

    if (transactionData.status !== 'PENDING') {
      throw new Error('Pengajuan ini sudah diproses.');
    }

    const adminName = user.displayName || user.name || user.email || 'Admin';

    // =========================
    // REJECT
    // =========================

    transaction.update(transactionRef, {
      status: 'REJECTED',

      rejectedBy: {
        adminId: user.uid,
        adminName,
        rejectedAt: serverTimestamp(),
      },

      rejectionReason: reason.trim(),

      rejectedAt: serverTimestamp(),

      updatedAt: serverTimestamp(),
    });
  });

  return {
    success: true,
  };
};

/**
 * Ambil transaksi pending yang
 * membutuhkan approval admin.
 */
export const getPendingTransactions = async (userUid) => {
  if (!userUid) return [];

  try {
    // Ambil group dimana user adalah admin
    const groupQuery = query(collection(db, 'groups'), where('adminIds', 'array-contains', userUid));

    const groupSnapshot = await getDocs(groupQuery);

    if (groupSnapshot.empty) {
      return [];
    }

    const pendingTransactions = [];
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
    const now = Date.now();

    for (const groupDoc of groupSnapshot.docs) {
      const groupData = groupDoc.data();

      const transactionQuery = query(collection(db, 'groups', groupDoc.id, 'transactions'), where('status', '==', 'PENDING'));

      const transactionSnapshot = await getDocs(transactionQuery);

      for (const transactionDoc of transactionSnapshot.docs) {
        const transaction = transactionDoc.data();

        // Ambil timestamp pembuat transaksi
        const createdAtDate = transaction.createdAt?.toDate ? transaction.createdAt.toDate() : new Date(transaction.createdAt || now);

        // Cek apakah transaksi sudah melebih 7 hari
        const isExpired = now - createdAtDate.getTime() > SEVEN_DAYS_MS;

        if (isExpired) {
          // AUTO-REJECT ke Firestore jika sudah kadaluwarsa > 7 hari
          const transactionRef = doc(db, 'groups', groupDoc.id, 'transactions', transactionDoc.id);

          await runTransaction(db, async (t) => {
            const snap = await t.get(transactionRef);
            if (snap.exists() && snap.data().status === 'PENDING') {
              t.update(transactionRef, {
                status: 'REJECTED',
                rejectionReason: 'Melewati batas tanggal',
                rejectedBy: {
                  adminId: 'SYSTEM',
                  adminName: 'Sistem (Auto Expired)',
                  rejectedAt: serverTimestamp(),
                },
                rejectedAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              });
            }
          });

          // Lewati transaksi ini agar tidak muncul di daftar pending admin
          continue;
        }

        const approvals = transaction.approvals || [];
        const alreadyApproved = approvals.some((approval) => approval.adminId === userUid);

        if (alreadyApproved) continue;

        pendingTransactions.push({
          id: transactionDoc.id,
          ...transaction,
          groupId: groupDoc.id,
          groupName: groupData.name,
          groupCode: groupData.code,
        });
      }
    }

    return pendingTransactions;
  } catch (error) {
    console.error('Get pending transactions error:', error);
    throw error;
  }
};

export const getTransactionHistory = async ({ groupId, cursor = null, direction = 'next' }) => {
  if (!groupId) {
    throw new Error('Group ID tidak ditemukan.');
  }

  const transactionRef = collection(db, 'groups', groupId, 'transactions');

  const constraints = [orderBy('createdAt', 'desc')];

  if (cursor && direction === 'next') {
    constraints.push(startAfter(cursor));
    constraints.push(limit(PAGE_SIZE));
  } else if (cursor && direction === 'prev') {
    constraints.push(endBefore(cursor));
    constraints.push(limitToLast(PAGE_SIZE));
  } else {
    constraints.push(limit(PAGE_SIZE));
  }

  const transactionQuery = query(transactionRef, ...constraints);

  const snapshot = await getDocs(transactionQuery);

  const transactions = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  return {
    data: transactions,
    firstDoc: snapshot.docs.length > 0 ? snapshot.docs[0] : null,
    lastDoc: snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null,
    hasMore: snapshot.docs.length === PAGE_SIZE,
  };
};

export const getMyTransactionRequests = async (uid, since = null, until = null) => {
  if (!uid) {
    throw new Error('User belum login.');
  }

  // Set default 7 hari terakhir jika since/until tidak diisi
  let startDate = since ? new Date(since) : new Date();
  if (!since) {
    startDate.setDate(startDate.getDate() - 7);
  }
  startDate.setHours(0, 0, 0, 0); // Mulai dari awal hari 00:00:00

  let endDate = until ? new Date(until) : new Date();
  endDate.setHours(23, 59, 59, 999); // Sampai akhir hari 23:59:59

  const startTimestamp = Timestamp.fromDate(startDate);
  const endTimestamp = Timestamp.fromDate(endDate);

  const transactionQuery = query(
    collectionGroup(db, 'transactions'),
    where('userId', '==', uid),
    where('createdAt', '>=', startTimestamp),
    where('createdAt', '<=', endTimestamp),
    orderBy('createdAt', 'desc'),
    limit(50),
  );

  const snapshot = await getDocs(transactionQuery);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};
