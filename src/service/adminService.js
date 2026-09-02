import {
  collection,
  collectionGroup,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  query,
  orderBy,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

// ==========================================
// 1. USERS CRUD
// ==========================================

export const getAllUsers = async () => {
  const usersRef = collection(db, 'users');
  const snapshot = await getDocs(usersRef);
  return snapshot.docs.map((d) => ({
    id: d.id,
    uid: d.id,
    ...d.data(),
  }));
};

export const createAdminUser = async (userData) => {
  const customUid = userData.uid?.trim() || `user_${Date.now()}`;
  const userRef = doc(db, 'users', customUid);

  const payload = {
    uid: customUid,
    name: userData.name?.trim() || 'User Baru',
    email: userData.email?.trim() || '',
    phone: userData.phone?.trim() || null,
    gender: userData.gender || 'MALE',
    dateOfBirth: userData.dateOfBirth || null,
    role: userData.role || 'USER',
    accountStatus: userData.accountStatus || 'ACTIVE',
    subscriptionStatus: userData.subscriptionStatus || 'FREE',
    subscriptionPlan: userData.subscriptionPlan || 'FREE',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastLoginAt: serverTimestamp(),
  };

  await setDoc(userRef, payload);
  return { id: customUid, ...payload };
};

export const updateAdminUser = async (uid, userData) => {
  if (!uid) throw new Error('UID user wajib disertakan.');
  const userRef = doc(db, 'users', uid);

  const payload = {
    ...userData,
    updatedAt: serverTimestamp(),
  };
  delete payload.id;

  await updateDoc(userRef, payload);
  return { id: uid, ...payload };
};

export const deleteAdminUser = async (uid) => {
  if (!uid) throw new Error('UID user wajib disertakan.');
  const userRef = doc(db, 'users', uid);
  await deleteDoc(userRef);
  return uid;
};

// ==========================================
// 2. GROUPS CRUD
// ==========================================

export const getAllGroups = async () => {
  const groupsRef = collection(db, 'groups');
  const snapshot = await getDocs(groupsRef);
  return snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }));
};

export const createAdminGroup = async (groupData, creatorUid = 'sExbRFMPzIgQPhDAmhIT3eFSEkl1') => {
  const groupRef = doc(collection(db, 'groups'));
  const code = (
    groupData.code?.trim() || Math.random().toString(36).substring(2, 10).toUpperCase()
  );

  const payload = {
    name: groupData.name?.trim() || 'Group Baru',
    description: groupData.description?.trim() || '',
    type: groupData.type || 'COUPLE',
    code,
    password: groupData.password || '1234',
    ownerId: groupData.ownerId || creatorUid,
    admin: [groupData.ownerId || creatorUid],
    adminIds: [groupData.ownerId || creatorUid],
    maxMembers: Number(groupData.maxMembers) || 10,
    target: Number(groupData.target) || 0,
    balance: Number(groupData.balance) || 0,
    status: groupData.status || 'ACTIVE',
    subscriptionPlan: groupData.subscriptionPlan || 'FREE',
    payment: {
      method: groupData.paymentMethod || 'MANUAL',
      name: groupData.paymentName || 'Admin',
      phone: groupData.paymentPhone || '-',
    },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const batch = writeBatch(db);
  batch.set(groupRef, payload);

  // Add initial member
  const memberRef = doc(db, 'groups', groupRef.id, 'members', creatorUid);
  batch.set(memberRef, {
    uid: creatorUid,
    name: 'Admin',
    role: 'ADMIN',
    joinedAt: serverTimestamp(),
  });

  await batch.commit();
  return { id: groupRef.id, ...payload };
};

export const updateAdminGroup = async (groupId, groupData) => {
  if (!groupId) throw new Error('Group ID wajib disertakan.');
  const groupRef = doc(db, 'groups', groupId);

  const payload = {
    ...groupData,
    target: Number(groupData.target) || 0,
    balance: Number(groupData.balance) || 0,
    maxMembers: Number(groupData.maxMembers) || 10,
    updatedAt: serverTimestamp(),
  };
  delete payload.id;

  await updateDoc(groupRef, payload);
  return { id: groupId, ...payload };
};

export const deleteAdminGroup = async (groupId) => {
  if (!groupId) throw new Error('Group ID wajib disertakan.');
  const groupRef = doc(db, 'groups', groupId);
  await deleteDoc(groupRef);
  return groupId;
};

// ==========================================
// 3. TRANSACTIONS CRUD
// ==========================================

export const getAllTransactions = async () => {
  const transactionsQuery = query(
    collectionGroup(db, 'transactions'),
    orderBy('createdAt', 'desc')
  );

  try {
    const snapshot = await getDocs(transactionsQuery);
    return snapshot.docs.map((d) => {
      // Find parent groupId from path: groups/{groupId}/transactions/{transId}
      const parentGroupRef = d.ref.parent.parent;
      const resolvedGroupId = parentGroupRef ? parentGroupRef.id : d.data().groupId;

      return {
        id: d.id,
        groupId: resolvedGroupId,
        ...d.data(),
      };
    });
  } catch (err) {
    console.warn('Fallback transaction query without order:', err);
    const fallbackSnapshot = await getDocs(collectionGroup(db, 'transactions'));
    return fallbackSnapshot.docs.map((d) => {
      const parentGroupRef = d.ref.parent.parent;
      const resolvedGroupId = parentGroupRef ? parentGroupRef.id : d.data().groupId;
      return {
        id: d.id,
        groupId: resolvedGroupId,
        ...d.data(),
      };
    });
  }
};

export const createAdminTransaction = async (groupId, transactionData, adminUid = 'sExbRFMPzIgQPhDAmhIT3eFSEkl1') => {
  if (!groupId) throw new Error('Group ID wajib dipilih.');
  const transRef = doc(collection(db, 'groups', groupId, 'transactions'));

  const total = Number(transactionData.total) || 0;
  const isExpense = transactionData.type === 'EXPENSE';

  const payload = {
    groupId,
    groupCode: transactionData.groupCode || '',
    groupName: transactionData.groupName || '',
    total,
    type: transactionData.type || 'INCOME',
    date: transactionData.date || new Date().toISOString().split('T')[0],
    message: transactionData.message || '',
    userId: transactionData.userId || adminUid,
    userName: transactionData.userName || 'Super Admin',
    status: transactionData.status || (isExpense ? 'PENDING' : 'APPROVED'),
    approvals: [],
    rejections: [],
    rejectionReason: '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(transRef, payload);

  // If approved income or approved expense, update group balance
  if (payload.status === 'APPROVED') {
    const groupRef = doc(db, 'groups', groupId);
    const groupSnap = await getDoc(groupRef);
    if (groupSnap.exists()) {
      const currentBal = Number(groupSnap.data().balance || 0);
      const newBal = isExpense ? Math.max(0, currentBal - total) : currentBal + total;
      await updateDoc(groupRef, { balance: newBal, updatedAt: serverTimestamp() });
    }
  }

  return { id: transRef.id, ...payload };
};

export const updateAdminTransaction = async (groupId, transactionId, transactionData) => {
  if (!groupId || !transactionId) throw new Error('Group ID dan Transaction ID wajib disertakan.');
  const transRef = doc(db, 'groups', groupId, 'transactions', transactionId);

  const payload = {
    ...transactionData,
    total: Number(transactionData.total) || 0,
    updatedAt: serverTimestamp(),
  };
  delete payload.id;

  await updateDoc(transRef, payload);
  return { id: transactionId, ...payload };
};

export const deleteAdminTransaction = async (groupId, transactionId) => {
  if (!groupId || !transactionId) throw new Error('Group ID dan Transaction ID wajib disertakan.');
  const transRef = doc(db, 'groups', groupId, 'transactions', transactionId);
  await deleteDoc(transRef);
  return transactionId;
};
