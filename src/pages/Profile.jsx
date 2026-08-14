import { useEffect, useState } from 'react';
import {
  UserCircle,
  Mail,
  Phone,
  CalendarDays,
  Users,
  ShieldCheck,
  Crown,
  Loader2,
  Pencil,
} from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { getUserGroupCount } from '@/service/profileService';

const Profile = () => {
  const { user } = useAuth();

  const [groupCount, setGroupCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const profile = user?.profile || user;

  console.log(profile);
  

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user?.uid) return;

      try {
        setLoading(true);

        const count = await getUserGroupCount(user.uid);

        setGroupCount(count);
      } catch (error) {
        console.error('Get profile data error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [user?.uid]);

  const formatDate = (value) => {
    if (!value) return '-';

    try {
      const date = value?.toDate
        ? value.toDate()
        : new Date(value);

      return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      }).format(date);
    } catch {
      return '-';
    }
  };

  const getGender = (gender) => {
    if (gender === 'MALE') return 'Laki-laki';
    if (gender === 'FEMALE') return 'Perempuan';

    return '-';
  };

  const initial = (
    profile?.name ||
    profile?.email ||
    'U'
  )
    .charAt(0)
    .toUpperCase();

  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">
            Profile
          </h1>

          <p className="mt-1 text-sm text-neutral-500">
            Informasi akun dan aktivitas kamu.
          </p>
        </div>

        <button
          className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
        >
          <Pencil className="h-4 w-4" />
          Edit
        </button>
      </div>

      {/* Profile Card */}
      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        {/* Profile Header */}
        <div className="border-b border-neutral-100 p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-emerald-100 text-xl font-bold text-emerald-700">
              {profile?.photoURL ? (
                <img
                  src={profile.photoURL}
                  alt={profile?.displayName || 'Profile'}
                  className="h-full w-full object-cover"
                />
              ) : (
                initial
              )}
            </div>

            <div>
              <h2 className="text-lg font-bold text-neutral-900">
                {profile?.displayName || 'User'}
              </h2>

              <p className="text-sm text-neutral-500">
                {profile?.email || '-'}
              </p>

              <div className="mt-2 flex items-center gap-2">
                <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                  {profile?.accountStatus || 'ACTIVE'}
                </span>

                <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                  {profile?.subscriptionPlan || 'FREE'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 border-b border-neutral-100 sm:grid-cols-3">
          <div className="p-5 text-center">
            <Users className="mx-auto mb-2 h-5 w-5 text-emerald-600" />

            <p className="text-2xl font-bold text-neutral-900">
              {loading ? (
                <Loader2 className="mx-auto h-5 w-5 animate-spin" />
              ) : (
                groupCount
              )}
            </p>

            <p className="mt-1 text-xs text-neutral-500">
              Group Diikuti
            </p>
          </div>

          <div className="border-l border-neutral-100 p-5 text-center">
            <Crown className="mx-auto mb-2 h-5 w-5 text-amber-500" />

            <p className="text-2xl font-bold text-neutral-900">
              {profile?.subscriptionPlan || 'FREE'}
            </p>

            <p className="mt-1 text-xs text-neutral-500">
              Paket
            </p>
          </div>

          <div className="col-span-2 border-t border-neutral-100 p-5 text-center sm:col-span-1 sm:border-l sm:border-t-0">
            <ShieldCheck className="mx-auto mb-2 h-5 w-5 text-blue-500" />

            <p className="text-2xl font-bold text-neutral-900">
              {profile?.role || 'USER'}
            </p>

            <p className="mt-1 text-xs text-neutral-500">
              Role
            </p>
          </div>
        </div>

        {/* Informasi */}
        <div className="p-6">
          <h3 className="mb-4 text-sm font-semibold text-neutral-900">
            Informasi Pribadi
          </h3>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg bg-neutral-50 p-4">
              <div className="flex items-center gap-2 text-neutral-400">
                <UserCircle className="h-4 w-4" />

                <span className="text-xs">
                  Nama Lengkap
                </span>
              </div>

              <p className="mt-2 text-sm font-medium text-neutral-800">
                {profile?.displayName || '-'}
              </p>
            </div>

            <div className="rounded-lg bg-neutral-50 p-4">
              <div className="flex items-center gap-2 text-neutral-400">
                <Mail className="h-4 w-4" />

                <span className="text-xs">
                  Email
                </span>
              </div>

              <p className="mt-2 text-sm font-medium text-neutral-800">
                {profile?.email || '-'}
              </p>
            </div>

            <div className="rounded-lg bg-neutral-50 p-4">
              <div className="flex items-center gap-2 text-neutral-400">
                <Phone className="h-4 w-4" />

                <span className="text-xs">
                  Nomor Telepon
                </span>
              </div>

              <p className="mt-2 text-sm font-medium text-neutral-800">
                {profile?.phone || '-'}
              </p>
            </div>

            <div className="rounded-lg bg-neutral-50 p-4">
              <div className="flex items-center gap-2 text-neutral-400">
                <CalendarDays className="h-4 w-4" />

                <span className="text-xs">
                  Tanggal Lahir
                </span>
              </div>

              <p className="mt-2 text-sm font-medium text-neutral-800">
                {formatDate(profile?.dateOfBirth)}
              </p>
            </div>

            <div className="rounded-lg bg-neutral-50 p-4">
              <div className="flex items-center gap-2 text-neutral-400">
                <UserCircle className="h-4 w-4" />

                <span className="text-xs">
                  Gender
                </span>
              </div>

              <p className="mt-2 text-sm font-medium text-neutral-800">
                {getGender(profile?.gender)}
              </p>
            </div>

            <div className="rounded-lg bg-neutral-50 p-4">
              <div className="flex items-center gap-2 text-neutral-400">
                <ShieldCheck className="h-4 w-4" />

                <span className="text-xs">
                  Status Akun
                </span>
              </div>

              <p className="mt-2 text-sm font-medium text-neutral-800">
                {profile?.accountStatus || '-'}
              </p>
            </div>
          </div>
        </div>

        {/* Account Info */}
        <div className="border-t border-neutral-100 p-6">
          <h3 className="mb-4 text-sm font-semibold text-neutral-900">
            Informasi Akun
          </h3>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs text-neutral-400">
                Bergabung sejak
              </p>

              <p className="mt-1 text-sm font-medium text-neutral-700">
                {formatDate(profile?.createdAt)}
              </p>
            </div>

            <div>
              <p className="text-xs text-neutral-400">
                Login terakhir
              </p>

              <p className="mt-1 text-sm font-medium text-neutral-700">
                {formatDate(profile?.lastLoginAt)}
              </p>
            </div>

            <div>
              <p className="text-xs text-neutral-400">
                Status Langganan
              </p>

              <p className="mt-1 text-sm font-medium text-neutral-700">
                {profile?.subscriptionStatus || '-'}
              </p>
            </div>

            <div>
              <p className="text-xs text-neutral-400">
                User ID
              </p>

              <p className="mt-1 truncate text-sm font-medium text-neutral-700">
                {profile?.uid || user?.uid || '-'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;