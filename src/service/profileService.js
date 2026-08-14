import {
  collectionGroup,
  getCountFromServer,
  query,
  where,
} from 'firebase/firestore';

import { db } from '@/lib/firebase';

export const getUserGroupCount = async (uid) => {
  if (!uid) return 0;

  const q = query(
    collectionGroup(db, 'members'),
    where('uid', '==', uid)
  );

  const snapshot = await getCountFromServer(q);

  return snapshot.data().count;
};