import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { registerUser } from '../service/userService';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const initialForm = {
  name: '',
  email: '',
  phone: '',
  gender: '',
  dateOfBirth: '',
  password: '',
  confirmPassword: '',
};

const Register = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = ({ target: { name, value } }) => {
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleGenderChange = (gender) => {
    setForm((prev) => ({
      ...prev,
      gender,
    }));
  };

  const validateForm = () => {
    if (form.password !== form.confirmPassword) {
      return 'Password dan konfirmasi password tidak sama.';
    }

    if (form.password.length < 6) {
      return 'Password minimal 6 karakter.';
    }

    return '';
  };

  const getAuthErrorMessage = (code) => {
    const errors = {
      'auth/email-already-in-use': 'Email sudah terdaftar.',
      'auth/invalid-email': 'Format email tidak valid.',
      'auth/weak-password': 'Password terlalu lemah.',
      'auth/network-request-failed': 'Terjadi masalah jaringan. Silakan coba lagi.',
    };

    return errors[code] || 'Terjadi kesalahan. Silakan coba lagi.';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError('');

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);

      await registerUser({
        name: form.name,
        email: form.email,
        phone: form.phone,
        gender: form.gender,
        dateOfBirth: form.dateOfBirth,
        password: form.password,
      });

      setSuccess('Registrasi berhasil! Mengalihkan ke halaman login...');

      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (error) {
      console.error('Register error:', error);
      setError(getAuthErrorMessage(error.code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {success && (
        <Alert className="mb-5 border-emerald-300 bg-emerald-50 text-emerald-900 animate-in fade-in-0 slide-in-from-top-1">
          <AlertDescription className="text-sm font-semibold">{success}</AlertDescription>
        </Alert>
      )}
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
              <CardTitle className="text-xl font-bold text-stone-800 sm:text-2xl">Buat Akun</CardTitle>
              <CardDescription className="text-sm font-medium text-stone-500">Menabung bersama, tumbuh bersama.</CardDescription>
            </div>
          </CardHeader>

          <CardContent className="pt-4">
            {error && (
              <Alert variant="destructive" className="mb-5 border-rose-200 bg-rose-50/90 text-rose-900 animate-in fade-in-0 slide-in-from-top-1">
                <AlertDescription className="text-sm font-semibold">{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* Nama Lengkap */}
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs font-bold text-emerald-900">
                  Nama Lengkap
                </Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="John Doe"
                  value={form.name}
                  onChange={handleChange}
                  autoComplete="name"
                  className="h-10 border-emerald-200/80 bg-emerald-50/70 text-stone-800 placeholder:text-stone-400 transition-all duration-200 focus-visible:bg-white focus-visible:border-amber-400 focus-visible:ring-2 focus-visible:ring-amber-400/40"
                  required
                />
              </div>

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

              {/* Responsive Grid: No. WhatsApp & Gender */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-xs font-bold text-emerald-900">
                    No. WhatsApp
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="08xxxxxxxxxx"
                    value={form.phone}
                    onChange={handleChange}
                    autoComplete="tel"
                    className="h-10 border-emerald-200/80 bg-emerald-50/70 text-stone-800 placeholder:text-stone-400 transition-all duration-200 focus-visible:bg-white focus-visible:border-amber-400 focus-visible:ring-2 focus-visible:ring-amber-400/40"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-emerald-900">Gender</Label>
                  <Select value={form.gender} onValueChange={handleGenderChange}>
                    <SelectTrigger className="h-10 w-full border-emerald-200/80 bg-emerald-50/70 text-stone-800 transition-all duration-200 focus:bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-400/40">
                      <SelectValue placeholder="Pilih gender" />
                    </SelectTrigger>
                    <SelectContent className="border-emerald-100 bg-white">
                      <SelectItem value="MALE">Laki-laki</SelectItem>
                      <SelectItem value="FEMALE">Perempuan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Tanggal Lahir */}
              <div className="space-y-1.5">
                <Label htmlFor="dateOfBirth" className="text-xs font-bold text-emerald-900">
                  Tanggal Lahir
                </Label>
                <Input
                  id="dateOfBirth"
                  name="dateOfBirth"
                  type="date"
                  value={form.dateOfBirth}
                  onChange={handleChange}
                  className="h-10 border-emerald-200/80 bg-emerald-50/70 text-stone-800 transition-all duration-200 focus-visible:bg-white focus-visible:border-amber-400 focus-visible:ring-2 focus-visible:ring-amber-400/40"
                />
              </div>

              {/* Responsive Grid: Passwords */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-xs font-bold text-emerald-900">
                    Password
                  </Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Min. 6 karakter"
                    value={form.password}
                    onChange={handleChange}
                    autoComplete="new-password"
                    className="h-10 border-emerald-200/80 bg-emerald-50/70 text-stone-800 placeholder:text-stone-400 transition-all duration-200 focus-visible:bg-white focus-visible:border-amber-400 focus-visible:ring-2 focus-visible:ring-amber-400/40"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword" className="text-xs font-bold text-emerald-900">
                    Konfirmasi
                  </Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="Ulangi password"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    autoComplete="new-password"
                    className="h-10 border-emerald-200/80 bg-emerald-50/70 text-stone-800 placeholder:text-stone-400 transition-all duration-200 focus-visible:bg-white focus-visible:border-amber-400 focus-visible:ring-2 focus-visible:ring-amber-400/40"
                    required
                  />
                </div>
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
                    Membuat akun...
                  </span>
                ) : (
                  'Daftar Sekarang'
                )}
              </Button>
            </form>

            {/* Login Link */}
            <div className="mt-5 text-center text-xs text-stone-500">
              Sudah punya akun?{' '}
              <Button variant="link" className="h-auto p-0 text-xs font-bold text-emerald-700 hover:text-amber-600 hover:underline" asChild>
                <Link to="/login">Login</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </>
  );
};

export default Register;
