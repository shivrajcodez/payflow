'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { isAuthenticated as checkAuth, isAdmin } from '@/lib/auth';

export const useAuth = (requireAuth = true, requireAdmin = false) => {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();

  useEffect(() => {
    if (requireAuth && !checkAuth()) {
      router.push('/auth/login');
      return;
    }
    if (requireAdmin && !isAdmin()) {
      router.push('/dashboard');
    }
  }, [requireAuth, requireAdmin, router]);

  return { user, isAuthenticated, logout, isAdmin: isAdmin() };
};

export default useAuth;
