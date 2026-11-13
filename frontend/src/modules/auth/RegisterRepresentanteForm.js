import React, { useState } from 'react';
import { UserPlus } from 'lucide-react';
import PasswordStrengthSemaforo, {
  evaluatePasswordSemaforo,
} from '../../components/PasswordStrengthSemaforo';
import api from '../../utils/api';
import { saveSession } from '../../utils/auth';

export default function RegisterRepresentanteForm({ onError, onSuccessRedirect }) {
  const [loading, setLoading] = useState(false);
  const [registerForm, setRegisterForm] = useState({
    nombre: '',
    email: '',
    password: '',
    documento_identidad: '',
    parentesco: 'Padre',
    telefono: '',
    telefono_emergencia: '',
    direccion: '',
  });

  const passwordCheck = evaluatePasswordSemaforo(registerForm.password);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (onError) onError('');
    if (!passwordCheck.isValid) {
      if (onError) {
        onError(
          'La contraseña debe tener entre 8 y 20 caracteres, incluir mayúsculas, minúsculas, números y signos (Semáforo Verde).'
        );
      }
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/register', registerForm);
      saveSession(res.data.token, res.data.user);
      if (onSuccessRedirect) onSuccessRedirect('/portal-padres');
    } catch (err) {
      if (onError) onError(err.response?.data?.error || 'No se pudo completar el registro.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleRegister} className="space-y-3">
      <p className="text-xs text-texto-secundario bg-[#151515] border border-neutral-800 rounded-lg p-3">
        Registro obligatorio para padres o tutores que inscribirán a jugadores{' '}
        <strong className="text-white">menores de 18 años</strong> desde el asistente de 5 etapas.
      </p>
      <div>
        <label className="block text-xs font-semibold text-texto-secundario mb-1">Nombre Completo*</label>
        <input
          type="text"
          className="input-fenix"
          placeholder="Nombre y Apellido"
          value={registerForm.nombre}
          onChange={(e) => setRegisterForm({ ...registerForm, nombre: e.target.value })}
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-texto-secundario mb-1">Cédula / DNI*</label>
          <input
            type="text"
            className="input-fenix"
            placeholder="V-12345678"
            value={registerForm.documento_identidad}
            onChange={(e) =>
              setRegisterForm({ ...registerForm, documento_identidad: e.target.value })
            }
            required
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-texto-secundario mb-1">Parentesco</label>
          <select
            className="input-fenix"
            value={registerForm.parentesco}
            onChange={(e) => setRegisterForm({ ...registerForm, parentesco: e.target.value })}
          >
            <option value="Padre">Padre</option>
            <option value="Madre">Madre</option>
            <option value="Tutor">Tutor</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-texto-secundario mb-1">Correo Electrónico*</label>
          <input
            type="email"
            className="input-fenix"
            placeholder="correo@ejemplo.com"
            value={registerForm.email}
            onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-texto-secundario mb-1">Teléfono</label>
          <input
            type="text"
            className="input-fenix"
            placeholder="+58 412..."
            value={registerForm.telefono}
            onChange={(e) => setRegisterForm({ ...registerForm, telefono: e.target.value })}
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-texto-secundario mb-1">Contraseña*</label>
        <input
          type="password"
          className="input-fenix"
          placeholder="8–20 car. (Mayús, Minús, N°, Signo)"
          maxLength={20}
          value={registerForm.password}
          onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
          required
        />
        <PasswordStrengthSemaforo password={registerForm.password} />
      </div>

      <button
        type="submit"
        disabled={loading || !passwordCheck.isValid}
        className="btn-cta w-full mt-2 disabled:opacity-50"
      >
        <UserPlus className="w-4 h-4" />
        {loading ? 'Creando cuenta...' : 'Crear Cuenta de Representante'}
      </button>
    </form>
  );
}
