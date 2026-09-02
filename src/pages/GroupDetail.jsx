import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Copy, CreditCard, Users, Wallet, Plus } from 'lucide-react';

import { doc, getDoc, getDocs, collection } from 'firebase/firestore';

import { db } from '@/lib/firebase';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

import AddTransactionDialog from '@/components/AddTransactionDialog';
import { TransactionSuccessDialog } from '@/components/TransactionSuccessDialog';
import TransactionHistory from '@/components/TransactionHistory';

const GroupDetail = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();

  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [transactionOpen, setTransactionOpen] = useState(false);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [successTransactionData, setSuccessTransactionData] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(Number(value) || 0);
  };

  const getProgress = (balance, target) => {
    if (!target) return 0;

    return Math.min(Math.round((Number(balance || 0) / Number(target)) * 100), 100);
  };

  const [historyKey, setHistoryKey] = useState(0);

  const fetchGroup = async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      }
      setError('');

      // ================================
      // GET GROUP
      // ================================

      const groupRef = doc(db, 'groups', groupId);

      const groupSnapshot = await getDoc(groupRef);

      if (!groupSnapshot.exists()) {
        throw new Error('Group tidak ditemukan.');
      }

      const groupData = {
        id: groupSnapshot.id,
        ...groupSnapshot.data(),
      };

      setGroup(groupData);

      // ================================
      // GET MEMBERS
      // ================================

      const membersSnapshot = await getDocs(collection(db, 'groups', groupId, 'members'));

      const membersData = membersSnapshot.docs.map((memberDoc) => ({
        id: memberDoc.id,
        ...memberDoc.data(),
      }));

      setMembers(membersData);
    } catch (error) {
      console.error('Get group detail error:', error);

      setError(error.message || 'Gagal mengambil data group.');
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (groupId) {
      fetchGroup();
    }
  }, [groupId]);

  const copyGroupCode = async () => {
    if (!group?.code) return;

    await navigator.clipboard.writeText(group.code);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-emerald-50/60 via-background to-yellow-50/60">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-32 rounded bg-muted" />

            <div className="h-40 rounded-xl bg-muted" />

            <div className="grid gap-4 md:grid-cols-3">
              <div className="h-32 rounded-xl bg-muted" />
              <div className="h-32 rounded-xl bg-muted" />
              <div className="h-32 rounded-xl bg-muted" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error || !group) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center p-8 text-center">
            <div className="mb-4 text-4xl">😕</div>

            <h2 className="text-lg font-semibold">Group tidak ditemukan</h2>

            <p className="mt-2 text-sm text-muted-foreground">{error || 'Data group tidak tersedia.'}</p>

            <Button onClick={() => navigate('/')} className="mt-5 bg-emerald-600 hover:bg-emerald-700">
              Kembali ke Dashboard
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  const progress = getProgress(group.balance, group.target);

  const payment = group.payment || {};

  return (
    <>
      <main className="min-h-screen w-full bg-gradient-to-br from-emerald-100 via-white to-amber-100">
        <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 lg:px-8">
          {/* Back Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="mb-3 -ml-2 text-neutral-500 hover:bg-emerald-50 hover:text-emerald-700"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Button>

          {/* Header Card */}
          <Card className="overflow-hidden border-emerald-200 shadow-sm">
            {/* Top Header Banner */}
            <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 px-5 py-5 text-white">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                {/* Left: badges, title, desc */}
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge className="border border-amber-300/60 bg-white/15 text-[10px] font-semibold text-white hover:bg-white/15">
                      {group.type === 'COUPLE' ? '💚 Pasangan' : '🎉 Arisan'}
                    </Badge>

                    <Badge className="border border-amber-300 bg-amber-400 text-[10px] font-semibold text-emerald-950 hover:bg-amber-400">
                      {group.status === 'ACTIVE' ? 'Aktif' : group.status}
                    </Badge>
                  </div>

                  <CardTitle className="truncate text-lg font-bold text-white sm:text-xl">{group.name}</CardTitle>

                  <CardDescription className="text-xs text-emerald-50/80">{group.description || 'Tidak ada deskripsi group.'}</CardDescription>
                </div>

                {/* Right: member count + action, stacked on mobile */}
                <div className="flex w-full flex-col gap-2 sm:w-auto sm:items-end">
                  <div className="inline-flex items-center gap-2 rounded-lg border border-amber-300/40 bg-white/10 px-3 py-2">
                    <span className="text-sm">👥</span>
                    <div>
                      <p className="text-[10px] font-medium text-emerald-100">Anggota</p>
                      <p className="text-sm font-bold text-white">
                        {members.length} <span className="text-[11px] font-normal text-emerald-100">/ {group.maxMembers}</span>
                      </p>
                    </div>
                  </div>

                  <Button
                    onClick={() => setTransactionOpen(true)}
                    className="w-full border border-amber-300 bg-amber-400 text-emerald-950 transition-all hover:-translate-y-0.5 hover:bg-amber-300 sm:w-auto"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Tambah Transaksi
                  </Button>
                </div>
              </div>
            </div>

            {/* Main Stats Bar */}
            <CardContent className="p-4">
              <div className="grid gap-3 sm:grid-cols-3">
                {/* Balance */}
                <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 px-3 py-2.5">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-neutral-500">Total Tabungan</p>
                  <p className="mt-0.5 text-lg font-bold text-emerald-700">{formatCurrency(group.balance)}</p>
                </div>

                {/* Target */}
                <div className="rounded-lg border border-amber-200 bg-amber-50/50 px-3 py-2.5">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-neutral-500">Target Tabungan</p>
                  <p className="mt-0.5 text-lg font-bold text-neutral-800">{formatCurrency(group.target)}</p>
                </div>

                {/* Progress */}
                <div className="rounded-lg border border-emerald-200 bg-emerald-50/30 px-3 py-2.5">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-medium uppercase tracking-wide text-neutral-500">Progress</p>
                    <p className="text-xs font-semibold text-emerald-600">{progress}%</p>
                  </div>

                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-neutral-200">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-amber-400 transition-all duration-700"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Content Grid */}
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            {/* Payment Card */}
            <Card className="border-emerald-200 shadow-sm lg:col-span-2">
              <CardHeader className="pb-2 pt-4">
                <CardTitle className="flex items-center gap-2 text-sm font-bold text-neutral-800">
                  <Wallet className="h-3.5 w-3.5 text-emerald-600" />
                  Penyimpanan Dana
                </CardTitle>

                <CardDescription className="text-[11px] text-neutral-500">
                  Informasi rekening atau e-wallet yang digunakan untuk menyimpan dana bersama.
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-0 pb-4">
                <div className="grid gap-2.5 sm:grid-cols-3">
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50/40 p-2.5">
                    <p className="text-[10px] font-medium uppercase tracking-wide text-neutral-500">Platform</p>
                    <p className="mt-0.5 text-xs font-semibold text-neutral-800">{payment.method || '-'}</p>
                  </div>

                  <div className="rounded-lg border border-emerald-200 bg-emerald-50/40 p-2.5">
                    <p className="text-[10px] font-medium uppercase tracking-wide text-neutral-500">Nama Pemilik</p>
                    <p className="mt-0.5 truncate text-xs font-semibold text-neutral-800">{payment.name || '-'}</p>
                  </div>

                  <div className="rounded-lg border border-emerald-200 bg-emerald-50/40 p-2.5">
                    <p className="text-[10px] font-medium uppercase tracking-wide text-neutral-500">Nomor Admin</p>
                    <p className="mt-0.5 text-xs font-semibold text-neutral-800">{payment.phone || '-'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Group Code Card */}
            <Card className="border-amber-200 shadow-sm">
              <CardHeader className="pb-2 pt-4">
                <CardTitle className="flex items-center gap-2 text-sm font-bold text-neutral-800">
                  <CreditCard className="h-3.5 w-3.5 text-amber-600" />
                  Kode Group
                </CardTitle>

                <CardDescription className="text-[11px] text-neutral-500">Bagikan kode ini untuk mengundang anggota.</CardDescription>
              </CardHeader>

              <CardContent className="pt-0 pb-4">
                <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50/50 p-2">
                  <code className="flex-1 text-center text-sm font-bold tracking-[0.2em] text-emerald-800">{group.code}</code>

                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 border border-amber-200 text-emerald-700 hover:bg-amber-100"
                    onClick={copyGroupCode}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Members Section */}
          <Card className="mt-4 border-emerald-200 shadow-sm">
            <CardHeader className="pb-2 pt-4">
              <CardTitle className="flex items-center gap-2 text-sm font-bold text-neutral-800">
                <Users className="h-3.5 w-3.5 text-emerald-600" />
                Anggota Group
              </CardTitle>

              <CardDescription className="text-[11px] text-neutral-500">
                {members.length} dari {group.maxMembers} anggota
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-0 pb-4">
              {members.length === 0 ? (
                <div className="rounded-lg border border-dashed border-emerald-200 py-6 text-center text-xs text-neutral-400">
                  Belum ada anggota yang bergabung.
                </div>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between rounded-lg border border-emerald-100 p-2.5 transition-colors hover:border-emerald-200 hover:bg-emerald-50/40"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-emerald-200 bg-emerald-100 text-[11px] font-bold text-emerald-700">
                          {member.name?.slice(0, 2).toUpperCase()}
                        </div>

                        <div>
                          <p className="text-xs font-semibold text-neutral-800">{member.name || member.uid}</p>
                          <p className="text-[10px] text-neutral-400">{member.role === 'ADMIN' ? 'Group Admin' : 'Anggota'}</p>
                        </div>
                      </div>

                      {member.role === 'ADMIN' && (
                        <Badge className="border border-amber-200 bg-amber-100 text-[10px] font-semibold text-amber-700 hover:bg-amber-100">
                          Admin
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          <div className="mt-4">
            <TransactionHistory key={historyKey} groupId={groupId} />
          </div>
        </div>
      </main>
      <AddTransactionDialog
        open={transactionOpen}
        onOpenChange={setTransactionOpen}
        group={group}
        onSuccess={(result) => {
          fetchGroup(true);
          setHistoryKey((prev) => prev + 1);
          setSuccessTransactionData(result);
          setSuccessDialogOpen(true);
        }}
      />

      <TransactionSuccessDialog
        open={successDialogOpen}
        onOpenChange={setSuccessDialogOpen}
        data={successTransactionData}
      />
    </>
  );
};

export default GroupDetail;
