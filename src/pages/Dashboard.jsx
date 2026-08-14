import { useAuth } from '@/contexts/AuthContext';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SuccessDialogV2 } from '@/components/SuccesDialogV2';

import { getUserGroups } from '@/service/groupService';
import Swal from 'sweetalert2'
import CreateGroupDialog from '@/components/CreateGroupDialog';
import JoinGroupDialog from '@/components/JoinGroupDialog';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [joinGroupOpen, setJoinGroupOpen] = useState(false);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [successGroup, setSuccessGroup] = useState(false);

  const fetchGroups = async () => {
    if (!user?.uid) return;

    try {
      setLoading(true);
      setError('');

      const data = await getUserGroups(user.uid);
      setGroups(data);
    } catch (error) {
      console.error('Get groups error:', error);
      setError('Gagal mengambil data group.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, [user?.uid]);

  const formatCurrency = (value) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(Number(value) || 0);

  const getProgress = (balance, target) => {
    if (!target) return 0;
    return Math.min(Math.round((Number(balance || 0) / Number(target)) * 100), 100);
  };

  const handleCreateSuccess = async (result) => {
    setSuccessGroup(true);
    await fetchGroups();
  };

  const handleJoinSuccess = async () => {
    setSuccessDialogOpen(true);
    await fetchGroups();
  };

  return (
    <>
      {/* Welcome */}
      <div className="mb-6 flex flex-col gap-4 rounded-xl border border-emerald-100 bg-white/80 p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600">Dashboard Overview</p>
          </div>

          <h1 className="mt-1 text-xl font-bold tracking-tight text-neutral-800 sm:text-2xl">
            Selamat datang, <span className="text-emerald-600">{user?.displayName || user?.email || 'User'}</span> 👋
          </h1>

          <p className="mt-1 text-xs text-neutral-500">Kelola tabungan bersama kamu di satu tempat.</p>
        </div>

        <div className="flex gap-2.5">
          <Button
            variant="outline"
            onClick={() => setJoinGroupOpen(true)}
            className="border-emerald-200 transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-400 hover:bg-emerald-50"
          >
            Join Group
          </Button>

          <Button
            size="sm"
            onClick={() => setCreateGroupOpen(true)}
            className="bg-emerald-600 font-semibold text-white transition-colors hover:bg-emerald-700"
          >
            + Buat Group
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Card className="mb-5 border-red-200 bg-red-50 shadow-sm">
          <CardContent className="p-3 text-xs font-medium text-red-600">⚠️ {error}</CardContent>
        </Card>
      )}

      {/* Section Tabungan */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-neutral-800">Tabungan Saya</h2>
            <p className="text-xs text-neutral-500">Daftar group tabungan yang kamu ikuti.</p>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[1, 2, 3].map((item) => (
              <Card key={item} className="animate-pulse border-emerald-100 bg-white/80 shadow-sm">
                <CardHeader className="pb-2 pt-4">
                  <div className="h-4 w-24 rounded-md bg-neutral-100" />
                  <div className="mt-2 h-3 w-36 rounded-md bg-neutral-100" />
                </CardHeader>

                <CardContent className="pb-4">
                  <div className="space-y-3">
                    <div className="h-11 w-full rounded-lg bg-neutral-100" />
                    <div className="h-2 w-full rounded-full bg-neutral-100" />
                    <div className="flex justify-between pt-1">
                      <div className="h-3 w-16 rounded bg-neutral-100" />
                      <div className="h-3 w-12 rounded bg-neutral-100" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : groups.length === 0 ? (
          <Card className="border border-dashed border-emerald-200 bg-white/80 shadow-sm">
            <CardContent className="flex min-h-[200px] flex-col items-center justify-center p-6 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-xl text-emerald-600">💰</div>

              <h3 className="text-base font-bold text-neutral-800">Belum ada group</h3>

              <p className="mt-1 max-w-sm text-xs text-neutral-500">
                Buat group baru atau bergabung dengan group yang sudah ada untuk mulai menabung bersama.
              </p>

              <Button
                size="sm"
                onClick={() => setCreateGroupOpen(true)}
                className="mt-4 bg-emerald-600 font-semibold text-white transition-colors hover:bg-emerald-700"
              >
                + Buat Group Sekarang
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {groups.map((group) => {
              const progress = getProgress(group.balance, group.target);

              return (
                <Card
                  key={group.id}
                  className="group relative overflow-hidden border-emerald-100 bg-white/90 shadow-sm transition-shadow duration-200 hover:border-emerald-300 hover:shadow-md"
                >
                  <div className="h-1 w-full bg-gradient-to-r from-emerald-400 to-amber-300" />

                  <CardHeader className="pb-2 pt-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <CardTitle className="truncate text-sm font-bold text-neutral-800 transition-colors group-hover:text-emerald-700">
                          {group.name}
                        </CardTitle>

                        <CardDescription className="mt-0.5 line-clamp-1 text-[11px] text-neutral-500">
                          {group.description || 'Tidak ada deskripsi'}
                        </CardDescription>
                      </div>

                      <Badge className="shrink-0 border-0 bg-emerald-50 text-[10px] font-semibold text-emerald-700 hover:bg-emerald-50">
                        {group.code}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="pb-3 pt-0">
                    <div className="space-y-3">
                      <div className="rounded-lg border border-emerald-50 bg-emerald-50/50 px-2.5 py-2">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">Total Tabungan</p>
                        <p className="mt-0.5 text-base font-bold text-neutral-800">{formatCurrency(group.balance)}</p>
                      </div>

                      <div>
                        <div className="mb-1 flex items-center justify-between text-[11px] font-medium">
                          <span className="text-neutral-500">Target Progress</span>
                          <span className="font-semibold text-emerald-600">{progress}%</span>
                        </div>

                        <div className="h-1.5 overflow-hidden rounded-full bg-neutral-100">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-amber-300 transition-all duration-700"
                            style={{ width: `${progress}%` }}
                          />
                        </div>

                        <div className="mt-1 flex justify-between text-[10px] font-medium text-neutral-400">
                          <span>{formatCurrency(group.balance)}</span>
                          <span>{formatCurrency(group.target)}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t border-neutral-100 pt-2">
                        <span className="text-[11px] font-medium text-neutral-500">👥 {group.maxMembers || '-'}</span>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/groups/${group.id}`)}
                          className="text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                        >
                          Lihat detail
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <CreateGroupDialog open={createGroupOpen} onOpenChange={setCreateGroupOpen} onSuccess={handleCreateSuccess} />
      <JoinGroupDialog open={joinGroupOpen} onOpenChange={setJoinGroupOpen} onSuccess={handleJoinSuccess} />

      <SuccessDialogV2 open={successDialogOpen} onOpenChange={setSuccessDialogOpen} teks="Berhasil Bergabung!" />
      <SuccessDialogV2 open={successGroup} onOpenChange={setSuccessGroup} teks="Berhasil Membuat Group!" />
    </>
  );
};

export default Dashboard;
