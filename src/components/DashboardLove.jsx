import React from 'react';
import Chart from 'react-apexcharts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import CreateGroupDialog from './CreateGroupDialog';
import JoinGroupDialog from './JoinGroupDialog';
import { SuccessDialogV2 } from './SuccesDialogV2';

/**
 * DashboardLove
 * Versi penuh tema pink dari dashboard, dipakai khusus untuk satu user tertentu.
 * Semua data & handler dikirim lewat props, tidak ada state/fetch sendiri di sini,
 * supaya logic tetap satu sumber di Dashboard.jsx.
 */
export default function DashboardLove({
  user,
  groups,
  loading,
  error,
  isMobile,
  chartOptions,
  chartSeries,
  donutChartOptions,
  donutChartSeries,
  getProgress,
  formatCurrency,
  navigate,
  createGroupOpen,
  setCreateGroupOpen,
  joinGroupOpen,
  setJoinGroupOpen,
  handleCreateSuccess,
  handleJoinSuccess,
  successDialogOpen,
  setSuccessDialogOpen,
  successGroup,
  setSuccessGroup,
}) {
  return (
    <>
      {/* Welcome */}
      <div className="relative mb-6 flex flex-col gap-4 overflow-hidden rounded-xl border border-pink-200 bg-gradient-to-r from-pink-50 via-rose-50 to-pink-100 p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        {/* Animated moving gradient glow */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-pink-300/20 via-fuchsia-300/20 to-pink-300/20 bg-[length:200%_100%] animate-[gradientMove_4s_ease-in-out_infinite]" />

        {/* Floating hearts */}
        <span className="pointer-events-none absolute left-6 top-2 text-pink-400/70 animate-bounce [animation-duration:2.2s]">💗</span>
        <span className="pointer-events-none absolute right-10 top-4 text-rose-400/70 animate-bounce [animation-duration:1.8s] [animation-delay:0.3s]">
          💕
        </span>
        <span className="pointer-events-none absolute right-24 bottom-2 text-pink-300/70 animate-bounce [animation-duration:2.5s] [animation-delay:0.6s]">
          💞
        </span>

        <div className="relative w-full">
          <div className="inline-flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-pink-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-pink-500" />
            </span>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-pink-500">Dashboard Overview</p>
          </div>

          <h1 className="relative mt-1 text-xl font-bold tracking-tight sm:text-2xl">
            <span className="text-neutral-800">Selamat datang Sayangg</span> <span className="animate-pulse">💞💞</span>,{' '}
            <span className="bg-gradient-to-r from-pink-500 via-fuchsia-500 to-rose-500 bg-[length:200%_auto] bg-clip-text text-transparent animate-[gradientMove_3s_linear_infinite]">
              {user?.displayName || user?.email || 'User'}
            </span>
          </h1>

          <p className="relative mt-1 text-xs text-pink-400">Kelola tabungan bersama kamu di satu tempat 🌸</p>
        </div>

        <div className="relative flex gap-2.5">
          <Button
            variant="outline"
            onClick={() => setJoinGroupOpen(true)}
            className="border-pink-300 text-pink-600 transition-all duration-300 hover:-translate-y-0.5 hover:border-pink-400 hover:bg-pink-50"
          >
            Join Group
          </Button>

          <Button
            size="sm"
            onClick={() => setCreateGroupOpen(true)}
            className="bg-gradient-to-r from-pink-500 to-rose-500 font-semibold text-white transition-colors hover:from-pink-600 hover:to-rose-600"
          >
            + Buat Group
          </Button>
        </div>

        <style jsx>{`
          @keyframes gradientMove {
            0% {
              background-position: 0% 50%;
            }
            50% {
              background-position: 100% 50%;
            }
            100% {
              background-position: 0% 50%;
            }
          }
        `}</style>
      </div>

      {groups?.length > 0 && (
        <div className="w-full overflow-x-auto rounded-xl border border-pink-100 bg-white p-2">
          <Chart
            key={isMobile ? 'mobile' : 'desktop'}
            options={isMobile ? donutChartOptions : chartOptions}
            series={isMobile ? donutChartSeries : chartSeries}
            type={isMobile ? 'donut' : 'bar'}
            height={isMobile ? 320 : 280}
          />
        </div>
      )}

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
            <p className="text-xs text-neutral-500">Daftar group tabungan yang kamu ikuti 💕</p>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[1, 2, 3].map((item) => (
              <Card key={item} className="animate-pulse border-pink-100 bg-white/80 shadow-sm">
                <CardHeader className="pb-2 pt-4">
                  <div className="h-4 w-24 rounded-md bg-pink-50" />
                  <div className="mt-2 h-3 w-36 rounded-md bg-pink-50" />
                </CardHeader>

                <CardContent className="pb-4">
                  <div className="space-y-3">
                    <div className="h-11 w-full rounded-lg bg-pink-50" />
                    <div className="h-2 w-full rounded-full bg-pink-50" />
                    <div className="flex justify-between pt-1">
                      <div className="h-3 w-16 rounded bg-pink-50" />
                      <div className="h-3 w-12 rounded bg-pink-50" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : groups.length === 0 ? (
          <Card className="border border-dashed border-pink-200 bg-white/80 shadow-sm">
            <CardContent className="flex min-h-[200px] flex-col items-center justify-center p-6 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-pink-50 text-xl text-pink-500">💌</div>

              <h3 className="text-base font-bold text-neutral-800">Belum ada group</h3>

              <p className="mt-1 max-w-sm text-xs text-neutral-500">
                Buat group baru atau bergabung dengan group yang sudah ada untuk mulai menabung bersama.
              </p>

              <Button
                size="sm"
                onClick={() => setCreateGroupOpen(true)}
                className="mt-4 bg-gradient-to-r from-pink-500 to-rose-500 font-semibold text-white transition-colors hover:from-pink-600 hover:to-rose-600"
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
                  className="group relative overflow-hidden border-pink-100 bg-white/90 shadow-sm transition-shadow duration-200 hover:border-pink-300 hover:shadow-md"
                >
                  <div className="h-1 w-full bg-gradient-to-r from-pink-400 to-rose-300" />

                  <CardHeader className="pb-2 pt-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <CardTitle className="truncate text-sm font-bold text-neutral-800 transition-colors group-hover:text-pink-600">
                          {group.name}
                        </CardTitle>

                        <CardDescription className="mt-0.5 line-clamp-1 text-[11px] text-neutral-500">
                          {group.description || 'Tidak ada deskripsi'}
                        </CardDescription>
                      </div>

                      <Badge className="shrink-0 border-0 bg-pink-50 text-[10px] font-semibold text-pink-600 hover:bg-pink-50">
                        {group.code}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="pb-3 pt-0">
                    <div className="space-y-3">
                      <div className="rounded-lg border border-pink-50 bg-pink-50/50 px-2.5 py-2">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">Total Tabungan</p>
                        <p className="mt-0.5 text-base font-bold text-neutral-800">{formatCurrency(group.balance)}</p>
                      </div>

                      <div>
                        <div className="mb-1 flex items-center justify-between text-[11px] font-medium">
                          <span className="text-neutral-500">Target Progress</span>
                          <span className="font-semibold text-pink-600">{progress}%</span>
                        </div>

                        <div className="h-1.5 overflow-hidden rounded-full bg-neutral-100">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-pink-400 to-rose-300 transition-all duration-700"
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
                          className="text-pink-600 hover:bg-pink-50 hover:text-pink-700"
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

      <SuccessDialogV2 open={successDialogOpen} onOpenChange={setSuccessDialogOpen} teks="Berhasil Bergabung! 💗" />
      <SuccessDialogV2 open={successGroup} onOpenChange={setSuccessGroup} teks="Berhasil Membuat Group! 💗" />
    </>
  );
}