'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2, UserPlus, CheckCircle } from 'lucide-react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/authStore';
import type { ApiResponse, AuthResponse } from '@/types';

const schema = z.object({
  firstName: z.string().min(2, 'At least 2 characters'),
  lastName: z.string().min(2, 'At least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'At least 8 characters')
    .regex(/[A-Z]/, 'Must contain uppercase letter')
    .regex(/[a-z]/, 'Must contain lowercase letter')
    .regex(/[0-9]/, 'Must contain a number')
    .regex(/[@$!%*?&]/, 'Must contain special character'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});
type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
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
      const { confirmPassword, ...payload } = data;
      const res = await api.post<ApiResponse<AuthResponse>>('/v1/auth/register', payload);
      const { accessToken, refreshToken, user } = res.data.data;
      login(accessToken, refreshToken, user);
      router.push('/dashboard');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setServerError(msg || 'Registration failed. Please try again.');
    }
  };

  const perks = ['No credit card required', 'Full API access', 'Real-time analytics', 'Fraud detection included'];

  return (
    <div className="min-h-screen bg-dark-950 flex">
      <div className="hidden lg:flex lg:w-1/2 bg-dark-900 border-r border-dark-800 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-radial from-brand-red/8 via-transparent to-transparent" />
        <Link href="/" className="flex items-center gap-2 relative z-10">
          <div className="w-9 h-9 rounded-xl bg-brand-red flex items-center justify-center font-black text-base">P</div>
          <span className="font-black text-xl tracking-tight">PayFlow</span>
        </Link>
        <div className="relative z-10 space-y-6">
          <h2 className="text-3xl font-black text-gradient">Start processing payments in minutes.</h2>
          <ul className="space-y-4">
            {perks.map((perk) => (
              <li key={perk} className="flex items-center gap-3 text-dark-300">
                <CheckCircle className="w-5 h-5 text-brand-red-light flex-shrink-0" />
                <span>{perk}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="text-dark-600 text-xs relative z-10">© 2024 PayFlow. All rights reserved.</div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md animate-fade-in">
          <div className="lg:hidden flex items-center gap-2 mb-10">
            <div className="w-8 h-8 rounded-lg bg-brand-red flex items-center justify-center font-black text-sm">P</div>
            <span className="font-black text-lg">PayFlow</span>
          </div>

          <h1 className="text-3xl font-black tracking-tight mb-2">Create your account</h1>
          <p className="text-dark-400 mb-8">Get started for free — no credit card needed</p>

          {serverError && (
            <div className="mb-6 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-200 mb-1.5">First Name</label>
                <input {...register('firstName')} placeholder="John" className="input-dark" />
                {errors.firstName && <p className="mt-1 text-xs text-red-400">{errors.firstName.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-200 mb-1.5">Last Name</label>
                <input {...register('lastName')} placeholder="Doe" className="input-dark" />
                {errors.lastName && <p className="mt-1 text-xs text-red-400">{errors.lastName.message}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-200 mb-1.5">Email address</label>
              <input {...register('email')} type="email" placeholder="you@example.com" className="input-dark" />
              {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-200 mb-1.5">Password</label>
              <div className="relative">
                <input {...register('password')} type={showPassword ? 'text' : 'password'}
                  placeholder="Min. 8 chars with uppercase, number & symbol" className="input-dark pr-11" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-white">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-200 mb-1.5">Confirm Password</label>
              <input {...register('confirmPassword')} type="password" placeholder="Repeat password" className="input-dark" />
              {errors.confirmPassword && <p className="mt-1 text-xs text-red-400">{errors.confirmPassword.message}</p>}
            </div>

            <button type="submit" disabled={isSubmitting}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3 mt-2">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              {isSubmitting ? 'Creating account…' : 'Create Account'}
            </button>

            <p className="text-center text-xs text-dark-500 pt-1">
              By creating an account you agree to our{' '}
              <a href="#" className="text-dark-400 hover:text-white transition-colors">Terms</a> and{' '}
              <a href="#" className="text-dark-400 hover:text-white transition-colors">Privacy Policy</a>.
            </p>
          </form>

          <p className="mt-6 text-center text-sm text-dark-400">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-brand-red-light hover:text-brand-red font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
