import React, { useState } from 'react';
import { Lock, Mail, LogIn, Eye, EyeOff } from 'lucide-react';
import PasswordStrengthSemaforo from '../../components/PasswordStrengthSemaforo';
import api from '../../utils/api';
import { getHomeRouteForRole, saveSession } from '../../utils/auth';

export default function LoginForm({ onError, onSuccessRedirect }) {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });

  const handleLogin = async (e) => {
    e.preventDefault();
    if (onError) onError('');

    const cleanUsername = (loginForm.username || '').replace(/\s+/g, '');
    const cleanPassword = (loginForm.password || '').replace(/\s+/g, '');

    if (/\s/.test(loginForm.username) || /\s/.test(loginForm.password)) {
      if (onError) onError('No se permiten espacios en blanco en el usuario ni en la contraseña.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/login', {
        username: cleanUsername,
        password: cleanPassword,
      });
      saveSession(res.data.token, res.data.user);
      const target = getHomeRouteForRole(res.data.user.rol);
      if (onSuccessRedirect) onSuccessRedirect(target);
    } catch (err) {
      if (onError) {
        onError(err.response?.data?.error || 'Error al iniciar sesión. Verifica tus credenciales.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-texto-secundario mb-1">
          Correo Electrónico o Usuario <span className="text-[10px] text-rojo-fuego">(sin espacios)</span>
        </label>
        <div className="relative">
          <Mail className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
          <input
            type="text"
            className="input-fenix pl-10"
            placeholder="admin o tu@correo.com"
            value={loginForm.username}
            onChange={(e) =>
              setLoginForm({ ...loginForm, username: e.target.value.replace(/\s+/g, '') })
            }
            autoComplete="username"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-texto-secundario mb-1">
          Contraseña <span className="text-[10px] text-rojo-fuego">(sin espacios)</span>
        </label>
        <div className="relative">
          <Lock className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
          <input
            type={showPassword ? 'text' : 'password'}
            className="input-fenix pl-10 pr-10"
            placeholder="••••••••"
            value={loginForm.password}
            onChange={(e) =>
              setLoginForm({ ...loginForm, password: e.target.value.replace(/\s+/g, '') })
            }
            autoComplete="current-password"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-2.5 text-neutral-400 hover:text-white"
            aria-label="Mostrar u ocultar contraseña"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {loginForm.password.length > 0 && (
          <PasswordStrengthSemaforo password={loginForm.password} />
        )}
      </div>

      <button type="submit" disabled={loading} className="btn-cta w-full">
        <LogIn className="w-4 h-4" />
        {loading ? 'Verificando...' : 'Ingresar a la Plataforma'}
      </button>

      <p className="text-[11px] text-center text-texto-secundario pt-2 border-t border-neutral-800">
        Acceso protegido con autenticación RBAC por rol institucional.
      </p>
    </form>
  );
}
