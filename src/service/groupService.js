import { collection, collectionGroup, doc, getDoc, getDocs, setDoc, query, serverTimestamp, where, writeBatch } from 'firebase/firestore';

import { db } from '@/lib/firebase';

const generateGroupCode = () => {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

  let code = '';

  for (let i = 0; i < 8; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }

  return code;
};

const getMaxMembers = (type, subscriptionPlan) => {
  if (type === 'COUPLE') {
    return 2;
  }

  if (type === 'ARISAN') {
    return subscriptionPlan === 'PREMIUM' ? 50 : 10;
  }

  return 0;
};

export const createGroup = async ({
  name,
  description,
  type,
  paymentMethod,
  paymentName,
  paymentPhone,
  target,
  password,
  user,
}) => {
  // =========================
  // VALIDASI USER
  // =========================
  if (!user?.uid) {
    throw new Error('User belum login.');
  }

  // =========================
  // VALIDASI FORM
  // =========================
  const validations = [
    [!name?.trim(), 'Nama group wajib diisi.'],
    [!type, 'Tipe group wajib dipilih.'],
    [
      !paymentMethod,
      'Tempat penyimpanan dana wajib dipilih.',
    ],
    [
      !paymentName?.trim(),
      'Nama pemilik dana wajib diisi.',
    ],
    [
      !paymentPhone?.trim(),
      'Nomor admin wajib diisi.',
    ],
    [
      !target || Number(target) <= 0,
      'Target tabungan harus lebih dari 0.',
    ],
    [
      !password || password.length < 4,
      'Password group minimal 4 karakter.',
    ],
  ];

  const invalid = validations.find(
    ([condition]) => condition
  );

  if (invalid) {
    throw new Error(invalid[1]);
  }

  // =========================
  // SUBSCRIPTION
  // =========================
  const subscriptionPlan =
    user.subscriptionPlan || 'FREE';

  const maxMembers = getMaxMembers(
    type,
    subscriptionPlan
  );

  if (!maxMembers) {
    throw new Error('Tipe group tidak valid.');
  }

  // =========================
  // GROUP REFERENCE
  // =========================
  const groupRef = doc(
    collection(db, 'groups')
  );

  const memberRef = doc(
    db,
    'groups',
    groupRef.id,
    'members',
    user.uid
  );

  const groupCode = generateGroupCode();

  const batch = writeBatch(db);

  // =========================
  // ADMIN DATA
  // =========================
  const adminName =
    user.displayName ||
    user.name ||
    '';

  // =========================
  // GROUP
  // =========================
  batch.set(groupRef, {
    name: name.trim(),

    description:
      description?.trim() || '',

    type,

    payment: {
      method: paymentMethod,
      name: paymentName.trim(),
      phone: paymentPhone.trim(),
    },

    code: groupCode,

    // Password group
    password,

    // Owner
    ownerId: user.uid,

    // Admin
    admin: [user.uid],

    // KHUSUS QUERY FIRESTORE
    adminIds: [user.uid],

    maxMembers,

    target: Number(target),

    balance: 0,

    subscriptionPlan,

    status: 'ACTIVE',

    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // =========================
  // MEMBER PERTAMA
  // =========================
  batch.set(memberRef, {
    uid: user.uid,

    name: adminName,

    role: 'ADMIN',

    joinedAt: serverTimestamp(),
  });

  // =========================
  // COMMIT
  // =========================
  await batch.commit();

  return {
    id: groupRef.id,
    code: groupCode,
  };
};

export const getUserGroups = async (uid) => {
  if (!uid) {
    return [];
  }

  const membersQuery = query(collectionGroup(db, 'members'), where('uid', '==', uid));

  const memberSnapshot = await getDocs(membersQuery);

  const groups = await Promise.all(
    memberSnapshot.docs.map(async (memberDoc) => {
      // groups/{groupId}/members/{uid}
      const groupRef = memberDoc.ref.parent.parent;

      if (!groupRef) {
        return null;
      }

      // Karena groupRef adalah DocumentReference,
      // gunakan getDoc(), BUKAN getDocs()
      const groupSnapshot = await getDoc(groupRef);

      if (!groupSnapshot.exists()) {
        return null;
      }

      return {
        id: groupSnapshot.id,
        ...groupSnapshot.data(),
      };
    }),
  );

  return groups.filter(Boolean);
};

export const joinGroup = async ({ code, password, user }) => {
  if (!user?.uid) {
    throw new Error('User belum login.');
  }

  if (!code) {
    throw new Error('Kode group wajib diisi.');
  }

  if (!password) {
    throw new Error('Password group wajib diisi.');
  }

  // Cari group berdasarkan kode
  const groupQuery = query(collection(db, 'groups'), where('code', '==', code));

  const groupSnapshot = await getDocs(groupQuery);

  console.log('GROUP SNAPSHOT:', groupSnapshot);
  console.log('JUMLAH GROUP:', groupSnapshot.size);

  // STOP kalau tidak ditemukan
  if (groupSnapshot.empty) {
    throw new Error('Group tidak ditemukan. Periksa kembali kode group.');
  }

  // Baru ambil document pertama
  const groupDoc = groupSnapshot.docs[0];

  console.log('GROUP ID:', groupDoc.id);
  console.log('GROUP DATA:', groupDoc.data());

  const group = {
    id: groupDoc.id,
    ...groupDoc.data(),
  };

  // Cek password
  if (group.password !== password) {
    throw new Error('Password group salah.');
  }

  // Cek status
  if (group.status !== 'ACTIVE') {
    throw new Error('Group sudah tidak aktif.');
  }

  // Cek apakah sudah menjadi member
  const memberRef = doc(db, 'groups', group.id, 'members', user.uid);

  const memberSnapshot = await getDoc(memberRef);

  if (memberSnapshot.exists()) {
    throw new Error('Kamu sudah menjadi anggota group ini.');
  }

  // Ambil semua member
  const membersSnapshot = await getDocs(collection(db, 'groups', group.id, 'members'));

  const currentMembers = membersSnapshot.size;
  const maxMembers = Number(group.maxMembers) || 0;

  console.log('CURRENT MEMBERS:', currentMembers);
  console.log('MAX MEMBERS:', maxMembers);

  if (maxMembers > 0 && currentMembers >= maxMembers) {
    throw new Error(`Group sudah penuh. Maksimal ${maxMembers} anggota.`);
  }

  // Join
  await setDoc(memberRef, {
    uid: user.uid,
    role: 'MEMBER',
    name: user.displayName || '',
    joinedAt: serverTimestamp(),
  });

  return {
    groupId: group.id,
    groupName: group.name,
  };
};
