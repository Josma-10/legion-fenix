import React, { useEffect, useState } from 'react';
import { Upload, CheckCircle2, CreditCard } from 'lucide-react';
import PaymentMethodsBox from '../../components/PaymentMethodsBox';
import PasswordStrengthSemaforo, {
  evaluatePasswordSemaforo,
} from '../../components/PasswordStrengthSemaforo';
import api from '../../utils/api';
import { saveSession } from '../../utils/auth';
import {
  DISCIPLINES,
  calculateAgeFromBirthDate,
  recommendCategoryNameForAge,
} from '../../utils/categories';

export default function RegisterAdultoForm({
  onError,
  onSwitchToRepresentante,
  onSuccessRedirect,
}) {
  const [loading, setLoading] = useState(false);
  const [adultForm, setAdultForm] = useState({
    nombre_completo: '',
    dni_cedula: '',
    genero: 'Masculino',
    fecha_nacimiento: '',
    estatura: '',
    peso: '',
    pierna_habil: 'Derecha',
    disciplina: 'Equipo de Fútbol Campo',
    categoria_preferida: 'Sub-20',
    posicion_juego: 'Mediocentro Mixto',
    telefono: '',
    email: '',
    password: '',
    metodo_pago: 'Pago Móvil',
    referencia_bancaria: '',
    telefono_pago: '',
    foto_perfil: null,
    comprobante_pago: null,
  });
  const [fotoPreview, setFotoPreview] = useState(null);

  useEffect(() => {
    return () => {
      if (fotoPreview) URL.revokeObjectURL(fotoPreview);
    };
  }, [fotoPreview]);

  const computedAge = calculateAgeFromBirthDate(adultForm.fecha_nacimiento);
  const recommendedAdultCategory = recommendCategoryNameForAge(computedAge, true);
  const effectiveAdultCategory =
    computedAge !== null && computedAge >= 18 && computedAge <= 20
      ? adultForm.categoria_preferida || 'Sub-20'
      : recommendedAdultCategory;
  const passwordCheck = evaluatePasswordSemaforo(adultForm.password);

  const handleAdultPhotoChange = (e) => {
    const file = e.target.files?.[0] || null;
    setAdultForm((prev) => ({ ...prev, foto_perfil: file }));
    if (fotoPreview) URL.revokeObjectURL(fotoPreview);
    setFotoPreview(file ? URL.createObjectURL(file) : null);
  };

  const handleAdultRegister = async (e) => {
    e.preventDefault();
    if (onError) onError('');

    if (!passwordCheck.isValid) {
      if (onError) {
        onError(
          'La contraseña debe tener entre 8 y 20 caracteres e incluir mayúsculas, minúsculas, números y signos (Semáforo Verde).'
        );
      }
      return;
    }

    if (computedAge === null) {
      if (onError) onError('Selecciona tu fecha de nacimiento para calcular tu edad y categoría.');
      return;
    }
    if (computedAge < 18) {
      if (onError) {
        onError(
          `Tienes ${computedAge} años. Los menores de edad deben ser inscritos por su representante legal desde la opción "Representante (Menores)".`
        );
      }
      return;
    }
    if (!adultForm.foto_perfil) {
      if (onError) onError('Debes cargar tu foto de perfil para completar el registro.');
      return;
    }
    if (!adultForm.comprobante_pago) {
      if (onError) onError('Debes adjuntar el comprobante o capture del pago de inscripción.');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('nombre_completo', adultForm.nombre_completo.trim());
      formData.append('dni_cedula', adultForm.dni_cedula.trim());
      formData.append('genero', adultForm.genero);
      formData.append('fecha_nacimiento', adultForm.fecha_nacimiento);
      formData.append('estatura', adultForm.estatura);
      formData.append('peso', adultForm.peso);
      formData.append('pierna_habil', adultForm.pierna_habil);
      formData.append('disciplina', adultForm.disciplina);
      formData.append('categoria_preferida', effectiveAdultCategory || 'Libre');
      formData.append('posicion_juego', adultForm.posicion_juego);
      formData.append('telefono', adultForm.telefono.trim());
      formData.append('email', adultForm.email.trim());
      formData.append('password', adultForm.password);
      formData.append('metodo_pago', adultForm.metodo_pago);
      formData.append('referencia_bancaria', adultForm.referencia_bancaria.trim());
      formData.append('telefono_pago', adultForm.telefono_pago.trim());
      formData.append('foto_perfil', adultForm.foto_perfil);
      formData.append('comprobante_pago', adultForm.comprobante_pago);

      const res = await api.post('/auth/register-athlete', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      saveSession(res.data.token, res.data.user);
      if (onSuccessRedirect) onSuccessRedirect('/portal-padres');
    } catch (err) {
      if (onError) {
        onError(err.response?.data?.error || 'No se pudo completar el autoregistro del atleta.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleAdultRegister} className="space-y-4">
      <p className="text-xs text-texto-secundario bg-[#151515] border border-vinotinto/60 rounded-lg p-3">
        Autoregistro directo para jugadores <strong className="text-white">mayores de edad (18+)</strong>{' '}
        en categorías <strong className="text-rojo-fuego">Sub-20 o Libre</strong>. El sistema asignará tu categoría según tu edad y fecha de nacimiento.
      </p>

      {/* Foto de perfil */}
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-[#151515] border border-neutral-800 rounded-xl p-4">
        <img
          src={fotoPreview || '/assets/avatar-player.svg'}
          alt="Foto de perfil"
          className="w-20 h-20 rounded-xl object-cover border-2 border-vinotinto bg-[#101010] shrink-0"
        />
        <div className="flex-1 text-center sm:text-left space-y-1.5">
          <p className="text-xs font-bold text-white uppercase tracking-wider">
            Foto de Perfil del Atleta*
          </p>
          <p className="text-[11px] text-texto-secundario">
            Requerida para carnet oficial del club (JPG, PNG o WEBP).
          </p>
          <label className="btn-vinotinto text-xs cursor-pointer inline-flex">
            <Upload className="w-3.5 h-3.5" />
            {adultForm.foto_perfil ? adultForm.foto_perfil.name : 'Subir Foto de Perfil'}
            <input
              type="file"
              accept=".png,.jpg,.jpeg,.webp"
              className="hidden"
              onChange={handleAdultPhotoChange}
            />
          </label>
        </div>
      </div>

      {/* Datos personales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-texto-secundario mb-1">
            Nombre Completo*
          </label>
          <input
            type="text"
            className="input-fenix"
            placeholder="Ej: Gabriel Antonio Rivas"
            value={adultForm.nombre_completo}
            onChange={(e) => setAdultForm({ ...adultForm, nombre_completo: e.target.value })}
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-semibold text-texto-secundario mb-1">
              Cédula / DNI*
            </label>
            <input
              type="text"
              className="input-fenix"
              placeholder="V-26123456"
              value={adultForm.dni_cedula}
              onChange={(e) => setAdultForm({ ...adultForm, dni_cedula: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-texto-secundario mb-1">
              Género*
            </label>
            <select
              className="input-fenix"
              value={adultForm.genero}
              onChange={(e) => setAdultForm({ ...adultForm, genero: e.target.value })}
            >
              <option value="Masculino">Masculino</option>
              <option value="Femenino">Femenino</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-texto-secundario mb-1">
            Fecha de Nacimiento*
          </label>
          <input
            type="date"
            className="input-fenix"
            value={adultForm.fecha_nacimiento}
            onChange={(e) => setAdultForm({ ...adultForm, fecha_nacimiento: e.target.value })}
            required
          />
        </div>

        <div className="bg-[#151515] border border-neutral-800 rounded-lg px-3.5 py-2 flex flex-col justify-center">
          <span className="text-[10px] uppercase text-texto-secundario font-bold">
            Edad y Categoría Asignada
          </span>
          {computedAge === null ? (
            <p className="text-xs text-neutral-400 mt-0.5">Ingresa tu fecha de nacimiento...</p>
          ) : computedAge < 18 ? (
            <div className="text-xs text-rojo-fuego font-bold mt-0.5 flex items-center justify-between gap-2">
              <span>{computedAge} años (Menor de edad)</span>
              <button
                type="button"
                onClick={() => onSwitchToRepresentante && onSwitchToRepresentante()}
                className="underline text-white text-[11px]"
              >
                Ir a Representante
              </button>
            </div>
          ) : (
            <p className="text-xs text-green-400 font-bold mt-0.5">
              {computedAge} años → {effectiveAdultCategory} ({adultForm.disciplina})
            </p>
          )}
        </div>
      </div>

      {computedAge !== null && computedAge >= 18 && computedAge <= 20 && (
        <div className="bg-vinotinto/20 border border-vinotinto rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <span className="text-neutral-200">
            Con <strong className="text-white">{computedAge} años</strong> clasificas en{' '}
            <strong className="text-white">Sub-20</strong> y también puedes optar por{' '}
            <strong className="text-white">Libre</strong>:
          </span>
          <select
            className="input-fenix w-auto text-xs"
            value={adultForm.categoria_preferida}
            onChange={(e) =>
              setAdultForm({ ...adultForm, categoria_preferida: e.target.value })
            }
          >
            <option value="Sub-20">Categoría Sub-20 (Recomendada)</option>
            <option value="Libre">Categoría Libre</option>
          </select>
        </div>
      )}

      {/* Biometría y Perfil Deportivo */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div>
          <label className="block text-xs font-semibold text-texto-secundario mb-1">
            Estatura (m)*
          </label>
          <input
            type="number"
            step="0.01"
            min="1.20"
            max="2.30"
            className="input-fenix"
            placeholder="1.78"
            value={adultForm.estatura}
            onChange={(e) => setAdultForm({ ...adultForm, estatura: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-texto-secundario mb-1">
            Peso (kg)*
          </label>
          <input
            type="number"
            step="0.1"
            min="35"
            max="200"
            className="input-fenix"
            placeholder="74.5"
            value={adultForm.peso}
            onChange={(e) => setAdultForm({ ...adultForm, peso: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-texto-secundario mb-1">
            Pie Hábil*
          </label>
          <select
            className="input-fenix"
            value={adultForm.pierna_habil}
            onChange={(e) => setAdultForm({ ...adultForm, pierna_habil: e.target.value })}
          >
            <option value="Derecha">Derecha</option>
            <option value="Izquierda">Izquierda</option>
            <option value="Ambidiestro">Ambidiestro</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-texto-secundario mb-1">
            Posición de Juego*
          </label>
          <select
            className="input-fenix"
            value={adultForm.posicion_juego}
            onChange={(e) => setAdultForm({ ...adultForm, posicion_juego: e.target.value })}
          >
            <option value="Arquero">Arquero</option>
            <option value="Defensa Central">Defensa Central</option>
            <option value="Lateral">Lateral</option>
            <option value="Mediocentro Mixto">Mediocentro Mixto</option>
            <option value="Volante Creativo">Volante Creativo</option>
            <option value="Extremo">Extremo</option>
            <option value="Delantero / Pívot">Delantero / Pívot</option>
            <option value="Cierre (Sala)">Cierre (Sala)</option>
            <option value="Ala (Sala)">Ala (Sala)</option>
          </select>
        </div>
      </div>

      {/* Disciplina + Contacto */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-texto-secundario mb-1">
            Disciplina / Equipo*
          </label>
          <select
            className="input-fenix"
            value={adultForm.disciplina}
            onChange={(e) => setAdultForm({ ...adultForm, disciplina: e.target.value })}
          >
            {DISCIPLINES.map((disc) => (
              <option key={disc.key} value={disc.label}>
                {disc.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-texto-secundario mb-1">
            Número de Teléfono*
          </label>
          <input
            type="tel"
            className="input-fenix"
            placeholder="04145559876"
            value={adultForm.telefono}
            onChange={(e) => setAdultForm({ ...adultForm, telefono: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-texto-secundario mb-1">
            Correo Electrónico*
          </label>
          <input
            type="email"
            className="input-fenix"
            placeholder="atleta@correo.com"
            value={adultForm.email}
            onChange={(e) => setAdultForm({ ...adultForm, email: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-texto-secundario mb-1">
            Contraseña de Acceso*
          </label>
          <input
            type="password"
            className="input-fenix"
            placeholder="8–20 car. (Mayús, Minús, N°, Signo)"
            maxLength={20}
            value={adultForm.password}
            onChange={(e) => setAdultForm({ ...adultForm, password: e.target.value })}
            required
          />
        </div>
        <div className="sm:col-span-2">
          <PasswordStrengthSemaforo password={adultForm.password} />
        </div>
      </div>

      {/* Pago de Inscripción con QR + Tasa BCV + Comprobante */}
      <div className="border-t border-neutral-800 pt-4 space-y-3">
        <h4 className="font-display text-lg font-extrabold text-white flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-rojo-fuego" />
          PAGO DE INSCRIPCIÓN ($35.00 USD — BCV HOY) Y COMPROBANTE
        </h4>
        <PaymentMethodsBox
          amount={35}
          concept={`Inscripción ${effectiveAdultCategory || 'Adulto'} - ${adultForm.disciplina}`}
          compact
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div>
            <label className="block text-[11px] font-semibold text-texto-secundario mb-1">
              Método de Pago*
            </label>
            <select
              className="input-fenix text-xs"
              value={adultForm.metodo_pago}
              onChange={(e) => setAdultForm({ ...adultForm, metodo_pago: e.target.value })}
            >
              <option value="Pago Móvil">Pago Móvil</option>
              <option value="Transferencia Bancaria">Transferencia Bancaria</option>
              <option value="Zelle">Zelle</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-texto-secundario mb-1">
              Referencia Bancaria*
            </label>
            <input
              type="text"
              className="input-fenix text-xs"
              placeholder="Ej: 77441122"
              value={adultForm.referencia_bancaria}
              onChange={(e) =>
                setAdultForm({ ...adultForm, referencia_bancaria: e.target.value })
              }
              required
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-texto-secundario mb-1">
              Teléfono desde donde pagó*
            </label>
            <input
              type="tel"
              className="input-fenix text-xs"
              placeholder="04145559876"
              value={adultForm.telefono_pago}
              onChange={(e) =>
                setAdultForm({ ...adultForm, telefono_pago: e.target.value })
              }
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-texto-secundario mb-1">
            Comprobante / Capture del Pago de Inscripción (PNG, JPG o PDF)*
          </label>
          <label className="input-fenix text-xs flex items-center justify-between cursor-pointer hover:border-rojo-fuego">
            <span className="truncate text-neutral-300">
              {adultForm.comprobante_pago
                ? adultForm.comprobante_pago.name
                : 'Adjuntar comprobante de pago de inscripción...'}
            </span>
            <Upload className="w-4 h-4 text-rojo-fuego shrink-0 ml-2" />
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.webp"
              className="hidden"
              onChange={(e) =>
                setAdultForm({
                  ...adultForm,
                  comprobante_pago: e.target.files?.[0] || null,
                })
              }
            />
          </label>
        </div>
      </div>

      <button
        type="submit"
        disabled={
          loading || !passwordCheck.isValid || (computedAge !== null && computedAge < 18)
        }
        className="btn-cta w-full py-3 disabled:opacity-50"
      >
        <CheckCircle2 className="w-4 h-4" />
        {loading
          ? 'Procesando Autoregistro y Comprobante...'
          : 'Completar Inscripción Mayor de Edad'}
      </button>
    </form>
  );
}
