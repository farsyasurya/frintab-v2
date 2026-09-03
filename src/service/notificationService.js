import { getToken, onMessage } from 'firebase/messaging';
import { messaging } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// ============================================================
// MINTA IZIN NOTIFIKASI + AMBIL FCM TOKEN
// ============================================================

export const requestNotificationPermission = async (uid) => {
    try {
        if (!uid) {
            console.warn('UID user tidak tersedia');
            return null;
        }

        if (!('Notification' in window)) {
            console.warn('Browser tidak mendukung notifikasi');
            return null;
        }

        const permission = await Notification.requestPermission();

        if (permission !== 'granted') {
            console.warn('Izin notifikasi ditolak');
            return null;
        }

        const registration =
            await navigator.serviceWorker.ready;

        const token = await getToken(messaging, {
            vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
            serviceWorkerRegistration: registration,
        });

        if (!token) {
            console.warn('FCM Token tidak ditemukan');
            return null;
        }

        console.log('FCM Token:', token);

        // Simpan token ke Firestore
        await setDoc(
            doc(db, 'users', uid),
            {
                fcmToken: token,
                notificationPermission: true,
                notificationUpdatedAt: new Date(),
            },
            {
                merge: true,
            }
        );

        console.log('✅ FCM Token berhasil disimpan');

        return token;

    } catch (error) {
        console.error(
            '❌ Gagal mengaktifkan notifikasi:',
            error
        );

        return null;
    }
};

// ============================================================
// FOREGROUND MESSAGE
// Notifikasi ketika PWA sedang terbuka
// ============================================================

export const listenForForegroundMessages = (callback) => {
    return onMessage(messaging, (payload) => {
        console.log(
            'Foreground notification:',
            payload
        );

        callback?.(payload);
    });
};