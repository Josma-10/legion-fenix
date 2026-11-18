import React, { useCallback, useEffect, useState } from 'react';
import { Shield, UserPlus, CheckCircle2, AlertCircle, Shirt, Save, X } from 'lucide-react';
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

const CLOTH_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];

export default function AdminUsuariosPermisosModule({ currentUserId }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [editingSizesUser, setEditingSizesUser] = useState(null);
  const [sizesDraft, setSizesDraft] = useState({
    talla_camiseta: 'M',
    talla_short: 'M',
    talla_zapatos: '',
  });
  const [savingSizes, setSavingSizes] = useState(false);

  const [form, setForm] = useState({
    nombre: '',
    email: '',
    password: '',
    telefono: '',
    documento_identidad: '',
    rol: 'ENTRENADOR',
    talla_camiseta: 'M',
    talla_short: 'M',
    talla_zapatos: '41',
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
        rol: 'ENTRENADOR',
        talla_camiseta: 'M',
        talla_short: 'M',
        talla_zapatos: '41',
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

  const openSizesModal = (u) => {
    setEditingSizesUser(u);
    setSizesDraft({
      talla_camiseta: u.talla_camiseta || 'M',
      talla_short: u.talla_short || 'M',
      talla_zapatos: u.talla_zapatos || '',
    });
  };

  const handleSaveUserSizes = async (e) => {
    e.preventDefault();
    if (!editingSizesUser) return;
    setSavingSizes(true);
    setErrorMsg('');
    setFeedback('');
    try {
      const res = await api.patch(`/admin/users/${editingSizesUser.id_usuario}/sizes`, sizesDraft);
      setFeedback(res.data.message);
      setEditingSizesUser(null);
      await loadUsers();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'No se pudieron actualizar las tallas.');
    } finally {
      setSavingSizes(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="card-fenix p-5 border-l-4 border-l-rojo-fuego">
        <span className="text-xs font-extrabold uppercase tracking-widest text-rojo-fuego flex items-center gap-1.5">
          <Shield className="w-4 h-4" /> Exclusivo Administrador General
        </span>
        <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-white mt-1">
          GESTIÓN DE USUARIOS, ENTRENADORES, TALLAS Y PERMISOS RBAC
        </h2>
        <p className="text-xs text-texto-secundario mt-1">
          Crea cuentas para Entrenadores, Analistas Administrativos, Fisioterapeutas o Representantes con registro de tallas de camisa, shorts y zapatos.
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
            <UserPlus className="w-4 h-4 text-rojo-fuego" /> Crear Usuario / Entrenador
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
            onChange={(e) => setForm({ ...form, email: e.target.value.replace(/\s+/g, '') })}
            required
          />
          <div className="grid grid-cols-2 gap-2">
            <select
              className="input-fenix text-xs"
              value={form.rol}
              onChange={(e) => setForm({ ...form, rol: e.target.value })}
            >
              <option value="ENTRENADOR">Entrenador</option>
              <option value="ANALISTA_ADMIN">Analista Admin</option>
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

          {/* Tallas de Indumentaria y Calzado (Especialmente Entrenadores / Staff) */}
          <div className="bg-[#141418] border border-neutral-800 rounded-lg p-3 space-y-2">
            <p className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5">
              <Shirt className="w-3.5 h-3.5" /> Tallas de Uniforme y Calzado ({form.rol})
            </p>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] text-texto-secundario mb-1">Camisa</label>
                <select
                  className="input-fenix text-xs py-1.5"
                  value={form.talla_camiseta}
                  onChange={(e) => setForm({ ...form, talla_camiseta: e.target.value })}
                >
                  {CLOTH_SIZES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-texto-secundario mb-1">Shorts</label>
                <select
                  className="input-fenix text-xs py-1.5"
                  value={form.talla_short}
                  onChange={(e) => setForm({ ...form, talla_short: e.target.value })}
                >
                  {CLOTH_SIZES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-texto-secundario mb-1">Zapatos</label>
                <input
                  type="text"
                  className="input-fenix text-xs py-1.5"
                  placeholder="Ej: 42"
                  value={form.talla_zapatos}
                  onChange={(e) => setForm({ ...form, talla_zapatos: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div>
            <input
              type="password"
              className="input-fenix text-xs"
              placeholder="Contraseña segura (8–20 car.)*"
              maxLength={20}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value.replace(/\s+/g, '') })}
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
            CUENTAS ACTIVAS, TALLAS Y ROLES ({users.length})
          </h3>
          {loading ? (
            <p className="text-xs text-texto-secundario py-6 text-center">Cargando usuarios...</p>
          ) : (
            <div className="overflow-x-auto max-h-[520px]">
              <table className="w-full text-left text-xs border-collapse min-w-[600px]">
                <thead>
                  <tr className="border-b border-neutral-700 text-texto-secundario uppercase">
                    <th className="py-2">Nombre / Correo</th>
                    <th className="py-2">Indumentaria (C / S / Zap)</th>
                    <th className="py-2 text-right">Rol Asignado</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id_usuario} className="border-b border-neutral-800">
                      <td className="py-2.5">
                        <p className="font-bold text-white">{u.nombre}</p>
                        <p className="text-[11px] text-neutral-400">{u.email}</p>
                      </td>
                      <td className="py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-neutral-200 font-mono bg-[#151515] border border-neutral-800 px-2 py-0.5 rounded">
                            {u.talla_camiseta || '-'} / {u.talla_short || '-'} /{' '}
                            <strong className="text-amber-300">{u.talla_zapatos || '-'}</strong>
                          </span>
                          <button
                            type="button"
                            onClick={() => openSizesModal(u)}
                            className="text-[11px] text-rojo-fuego hover:text-white font-bold underline"
                          >
                            Tallas
                          </button>
                        </div>
                      </td>
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

      {/* Modal de Edición de Tallas para Entrenadores / Staff */}
      {editingSizesUser && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setEditingSizesUser(null)}
        >
          <form
            onSubmit={handleSaveUserSizes}
            onClick={(e) => e.stopPropagation()}
            className="card-fenix max-w-md w-full p-5 border-vinotinto space-y-4"
          >
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div>
                <p className="text-[10px] uppercase font-bold text-rojo-fuego">
                  Indumentaria y Calzado ({editingSizesUser.rol})
                </p>
                <h4 className="font-display text-xl font-bold text-white">
                  {editingSizesUser.nombre}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setEditingSizesUser(null)}
                className="p-1.5 rounded bg-neutral-800 text-white hover:bg-rojo-fuego"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-texto-secundario mb-1">
                  Talla Camisa
                </label>
                <select
                  className="input-fenix text-xs"
                  value={sizesDraft.talla_camiseta}
                  onChange={(e) => setSizesDraft({ ...sizesDraft, talla_camiseta: e.target.value })}
                >
                  {CLOTH_SIZES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-texto-secundario mb-1">
                  Talla Shorts
                </label>
                <select
                  className="input-fenix text-xs"
                  value={sizesDraft.talla_short}
                  onChange={(e) => setSizesDraft({ ...sizesDraft, talla_short: e.target.value })}
                >
                  {CLOTH_SIZES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-texto-secundario mb-1">
                  Talla Zapatos
                </label>
                <input
                  type="text"
                  className="input-fenix text-xs"
                  placeholder="Ej: 42"
                  value={sizesDraft.talla_zapatos}
                  onChange={(e) => setSizesDraft({ ...sizesDraft, talla_zapatos: e.target.value })}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={savingSizes}
              className="btn-cta w-full text-xs py-2.5"
            >
              <Save className="w-4 h-4" />
              {savingSizes ? 'Guardando...' : 'Guardar Tallas'}
            </button>
          </form>
        </div>
      )}
    </section>
  );
}
