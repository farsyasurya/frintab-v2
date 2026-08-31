import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';

import { auth } from '@/lib/firebase';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const Login = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: '',
    password: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = ({ target: { name, value } }) => {
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    // 1. Ambil data langsung dari form element (mencegah isu autofill / async state)
    const formData = new FormData(event.currentTarget);
    const email = (formData.get('email') || form.email).trim();
    const password = formData.get('password') || form.password;

    // Validasi sederhana sebelum kirim request
    if (!email || !password) {
      setError('Email dan password wajib diisi.');
      return;
    }

    try {
      setLoading(true);

      // 2. Kirim nilai yang sudah dipastikan terisi dan di-trim
      await signInWithEmailAndPassword(auth, email, password);

      navigate('/', { replace: true });
    } catch (error) {
      console.error('Login error:', error);

      switch (error.code) {
        case 'auth/invalid-credential':
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          setError('Email atau password salah.');
          break;
        case 'auth/invalid-email':
          setError('Format email tidak valid.');
          break;
        case 'auth/too-many-requests':
          setError('Terlalu banyak percobaan login. Coba lagi nanti.');
          break;
        default:
          setError('Gagal login. Silakan coba lagi.');
      }
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-emerald-800 via-emerald-600 to-teal-800 p-4 sm:p-6 lg:p-8 antialiased selection:bg-amber-300 selection:text-emerald-950">
      {/* Layer Efek Aksen Warna & Glow Ambient Full-Width */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-amber-400/20 blur-[100px] animate-pulse" />
        <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-emerald-400/30 blur-[100px] animate-pulse" />
      </div>

      <Card className="relative w-full max-w-md border-emerald-300/30 bg-white/95 backdrop-blur-md shadow-2xl shadow-emerald-950/40 transition-all duration-300 animate-in fade-in-50 slide-in-from-bottom-4">
        <CardHeader className="space-y-2 pb-2 text-center">
          {/* Brand Logo */}
          <div className="inline-flex items-center justify-center gap-1">
            <span className="text-3xl font-extrabold tracking-tight text-emerald-600 sm:text-4xl">Frin</span>
            <span className="text-3xl font-extrabold tracking-tight text-amber-500 sm:text-4xl">tab</span>
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400 animate-ping" />
          </div>

          <div className="space-y-1">
            <CardTitle className="text-xl font-bold text-stone-800 sm:text-2xl">Selamat Datang</CardTitle>
            <CardDescription className="text-sm font-medium text-stone-500">Masuk dan lanjutkan perjalanan menabungmu.</CardDescription>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          {error && (
            <Alert variant="destructive" className="mb-5 border-rose-200 bg-rose-50/90 text-rose-900 animate-in fade-in-0 slide-in-from-top-1">
              <AlertDescription className="text-sm font-semibold">{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-bold text-emerald-900">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="nama@email.com"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
                className="h-10 border-emerald-200/80 bg-emerald-50/70 text-stone-800 placeholder:text-stone-400 transition-all duration-200 focus-visible:bg-white focus-visible:border-amber-400 focus-visible:ring-2 focus-visible:ring-amber-400/40"
                required
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-bold text-emerald-900">
                Password
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Masukkan password"
                value={form.password}
                onChange={handleChange}
                autoComplete="current-password"
                className="h-10 border-emerald-200/80 bg-emerald-50/70 text-stone-800 placeholder:text-stone-400 transition-all duration-200 focus-visible:bg-white focus-visible:border-amber-400 focus-visible:ring-2 focus-visible:ring-amber-400/40"
                required
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              className="mt-2 h-11 w-full bg-emerald-600 font-semibold text-white shadow-lg shadow-emerald-900/20 transition-all duration-300 hover:bg-emerald-500 hover:shadow-xl active:scale-[0.98] disabled:opacity-60"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Memproses...
                </span>
              ) : (
                'Login'
              )}
            </Button>
          </form>

          {/* Register Link */}
          <div className="mt-5 text-center text-xs text-stone-500">
            Belum punya akun?{' '}
            <Button variant="link" className="h-auto p-0 text-xs font-bold text-emerald-700 hover:text-amber-600 hover:underline" asChild>
              <Link to="/register">Daftar</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
};

export default Login;
