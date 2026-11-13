import React, { useCallback, useEffect, useState } from 'react';
import { Shield, UserPlus, CheckCircle2, AlertCircle } from 'lucide-react';
import PasswordStrengthSemaforo, {
  evaluatePasswordSemaforo,
} from '../../components/PasswordStrengthSemaforo';
import api from '../../utils/api';

const ROLE_OPTIONS = [
  'ADMINISTRADOR',
  'ANALISTA_ADMIN',
  'ENTRENADOR',
  'FISIO',
  'REPRESENTANTE',
  'ATLETA',
];

export default function AdminUsuariosPermisosModule({ currentUserId }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [form, setForm] = useState({
    nombre: '',
    email: '',
    password: '',
    telefono: '',
    documento_identidad: '',
    rol: 'ANALISTA_ADMIN',
  });

  const passwordCheck = evaluatePasswordSemaforo(form.password);

  const loadUsers = useCallback(async () => {
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data.users || []);
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Error cargando usuarios del sistema.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setFeedback('');
    if (!passwordCheck.isValid) {
      setErrorMsg('La contraseña debe cumplir el Semáforo Verde (8–20 car., mayús, minús, número, signo).');
      return;
    }

    setSaving(true);
    try {
      const res = await api.post('/admin/users', form);
      setFeedback(res.data.message);
      setForm({
        nombre: '',
        email: '',
        password: '',
        telefono: '',
        documento_identidad: '',
        rol: 'ANALISTA_ADMIN',
      });
      await loadUsers();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'No se pudo crear el usuario.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangeRole = async (idUsuario, rol) => {
    setErrorMsg('');
    setFeedback('');
    try {
      const res = await api.patch(`/admin/users/${idUsuario}/role`, { rol });
      setFeedback(res.data.message);
      await loadUsers();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'No se pudo actualizar el rol.');
    }
  };

  return (
    <section className="space-y-6">
      <div className="card-fenix p-5 border-l-4 border-l-rojo-fuego">
        <span className="text-xs font-extrabold uppercase tracking-widest text-rojo-fuego flex items-center gap-1.5">
          <Shield className="w-4 h-4" /> Exclusivo Administrador General
        </span>
        <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-white mt-1">
          GESTIÓN DE USUARIOS, ROLES Y PERMISOS RBAC
        </h2>
        <p className="text-xs text-texto-secundario mt-1">
          Crea cuentas para Analista Administrativo, Entrenadores, Fisioterapeutas o Representantes con política de clave segura (Semáforo Verde).
        </p>
      </div>

      {feedback && (
        <div className="bg-green-950/60 border border-green-600 text-green-200 px-4 py-3 rounded-lg text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-rojo-fuego/15 border border-rojo-fuego text-red-200 px-4 py-3 rounded-lg text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rojo-fuego shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <form onSubmit={handleCreateUser} className="lg:col-span-5 card-fenix p-5 space-y-3">
          <h3 className="font-display text-xl font-bold text-white flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-rojo-fuego" /> Crear Usuario Institucional
          </h3>
          <input
            type="text"
            className="input-fenix text-xs"
            placeholder="Nombre y Apellido*"
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            required
          />
          <input
            type="email"
            className="input-fenix text-xs"
            placeholder="Correo electrónico institucional*"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <div className="grid grid-cols-2 gap-2">
            <select
              className="input-fenix text-xs"
              value={form.rol}
              onChange={(e) => setForm({ ...form, rol: e.target.value })}
            >
              <option value="ANALISTA_ADMIN">Analista Admin</option>
              <option value="ENTRENADOR">Entrenador</option>
              <option value="FISIO">Fisioterapeuta</option>
              <option value="ADMINISTRADOR">Administrador</option>
              <option value="REPRESENTANTE">Representante</option>
            </select>
            <input
              type="text"
              className="input-fenix text-xs"
              placeholder="Teléfono"
              value={form.telefono}
              onChange={(e) => setForm({ ...form, telefono: e.target.value })}
            />
          </div>
          {form.rol === 'REPRESENTANTE' && (
            <input
              type="text"
              className="input-fenix text-xs"
              placeholder="Cédula / DNI del representante"
              value={form.documento_identidad}
              onChange={(e) => setForm({ ...form, documento_identidad: e.target.value })}
            />
          )}
          <div>
            <input
              type="password"
              className="input-fenix text-xs"
              placeholder="Contraseña segura (8–20 car.)*"
              maxLength={20}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
            <PasswordStrengthSemaforo password={form.password} />
          </div>
          <button
            type="submit"
            disabled={saving || !passwordCheck.isValid}
            className="btn-cta w-full text-xs disabled:opacity-50"
          >
            {saving ? 'Creando...' : 'Crear Cuenta Institucional'}
          </button>
        </form>

        <div className="lg:col-span-7 card-fenix p-5">
          <h3 className="font-display text-xl font-bold text-white mb-4">
            CUENTAS ACTIVAS Y ASIGNACIÓN DE ROLES ({users.length})
          </h3>
          {loading ? (
            <p className="text-xs text-texto-secundario py-6 text-center">Cargando usuarios...</p>
          ) : (
            <div className="overflow-x-auto max-h-[460px]">
              <table className="w-full text-left text-xs border-collapse min-w-[520px]">
                <thead>
                  <tr className="border-b border-neutral-700 text-texto-secundario uppercase">
                    <th className="py-2">Nombre</th>
                    <th className="py-2">Correo / Usuario</th>
                    <th className="py-2 text-right">Rol Asignado</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id_usuario} className="border-b border-neutral-800">
                      <td className="py-2.5 font-bold text-white">{u.nombre}</td>
                      <td className="py-2.5 text-neutral-300">{u.email}</td>
                      <td className="py-2.5 text-right">
                        <select
                          disabled={u.id_usuario === currentUserId}
                          value={u.rol}
                          onChange={(e) => handleChangeRole(u.id_usuario, e.target.value)}
                          className="bg-[#141414] border border-neutral-700 rounded-md px-2 py-1 text-xs font-bold text-white disabled:opacity-60"
                        >
                          {ROLE_OPTIONS.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
