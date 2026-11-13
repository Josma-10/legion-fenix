import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import api from './api';

export const saveSession = (token, user) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('fenix_token', token);
  localStorage.setItem('fenix_user', JSON.stringify(user));
};

export const clearSession = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('fenix_token');
  localStorage.removeItem('fenix_user');
};

export const getStoredUser = () => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('fenix_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const getHomeRouteForRole = (rol) => {
  switch (rol) {
    case 'ADMINISTRADOR':
    case 'ANALISTA_ADMIN':
      return '/admin';
    case 'ENTRENADOR':
      return '/portal-coach';
    case 'FISIO':
      return '/portal-fisio';
    case 'REPRESENTANTE':
    case 'ATLETA':
      return '/portal-padres';
    default:
      return '/';
  }
};

export function useAuthGuard(allowedRoles = []) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const allowedRolesKey = allowedRoles.join(',');

  useEffect(() => {
    let active = true;
    const rolesList = allowedRolesKey ? allowedRolesKey.split(',') : [];

    async function verify() {
      const token = typeof window !== 'undefined' ? localStorage.getItem('fenix_token') : null;
      if (!token) {
        router.replace('/login');
        return;
      }

      try {
        const res = await api.get('/auth/me');
        const verifiedUser = res.data.user;
        localStorage.setItem('fenix_user', JSON.stringify(verifiedUser));

        if (
          rolesList.length > 0 &&
          verifiedUser.rol !== 'ADMINISTRADOR' &&
          !rolesList.includes(verifiedUser.rol)
        ) {
          router.replace(getHomeRouteForRole(verifiedUser.rol));
          return;
        }

        if (active) {
          setUser(verifiedUser);
          setChecking(false);
        }
      } catch {
        clearSession();
        router.replace('/login');
      }
    }

    verify();
    return () => {
      active = false;
    };
  }, [router, allowedRolesKey]);

  return { user, checking };
}
