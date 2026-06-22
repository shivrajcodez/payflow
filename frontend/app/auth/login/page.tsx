'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2, LogIn } from 'lucide-react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/authStore';
import type { ApiResponse, AuthResponse } from '@/types';

const schema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setServerError('');
    try {
      const res = await api.post<ApiResponse<AuthResponse>>('/v1/auth/login', data);
      const { accessToken, refreshToken, user } = res.data.data;
      login(accessToken, refreshToken, user);
      router.push(user.role === 'ADMIN' ? '/dashboard' : '/dashboard');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setServerError(msg || 'Login failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-dark-950 flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-dark-900 border-r border-dark-800 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-radial from-brand-red/8 via-transparent to-transparent" />
        <Link href="/" className="flex items-center gap-2 relative z-10">
          <div className="w-9 h-9 rounded-xl bg-brand-red flex items-center justify-center font-black text-base">P</div>
          <span className="font-black text-xl tracking-tight">PayFlow</span>
        </Link>
        <div className="relative z-10">
          <blockquote className="text-2xl font-semibold text-white leading-snug mb-6">
            "The payment infrastructure every startup wishes they had from day one."
          </blockquote>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-red/20 border border-brand-red/30 flex items-center justify-center text-sm font-bold text-brand-red-light">D</div>
            <div>
              <div className="font-semibold text-sm">Dev Team</div>
              <div className="text-dark-400 text-xs">PayFlow Engineering</div>
            </div>
          </div>
        </div>
        <div className="text-dark-600 text-xs relative z-10">© 2024 PayFlow. All rights reserved.</div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md animate-fade-in">
          <div className="lg:hidden flex items-center gap-2 mb-10">
            <div className="w-8 h-8 rounded-lg bg-brand-red flex items-center justify-center font-black text-sm">P</div>
            <span className="font-black text-lg">PayFlow</span>
          </div>

          <h1 className="text-3xl font-black tracking-tight mb-2">Welcome back</h1>
          <p className="text-dark-400 mb-8">Sign in to your account to continue</p>

          {serverError && (
            <div className="mb-6 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-2">Email address</label>
              <input {...register('email')} type="email" placeholder="you@example.com"
                className="input-dark" autoComplete="email" />
              {errors.email && <p className="mt-1.5 text-xs text-red-400">{errors.email.message}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-dark-200">Password</label>
                <a href="#" className="text-xs text-brand-red-light hover:text-brand-red transition-colors">Forgot password?</a>
              </div>
              <div className="relative">
                <input {...register('password')} type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••" className="input-dark pr-11" autoComplete="current-password" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-white transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="mt-1.5 text-xs text-red-400">{errors.password.message}</p>}
            </div>

            <button type="submit" disabled={isSubmitting}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3 mt-2">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
              {isSubmitting ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-dark-400">
            Don't have an account?{' '}
            <Link href="/auth/register" className="text-brand-red-light hover:text-brand-red font-medium transition-colors">
              Create one free
            </Link>
          </p>

          {/* Demo credentials */}
          <div className="mt-8 p-4 rounded-lg bg-dark-900 border border-dark-700">
            <p className="text-xs text-dark-500 font-medium mb-2">Demo credentials</p>
            <div className="space-y-1 text-xs font-mono">
              <div className="flex justify-between text-dark-400"><span>Admin:</span><span className="text-dark-300">admin@payflow.dev / Admin@123</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
