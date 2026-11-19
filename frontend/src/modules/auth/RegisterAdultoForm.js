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
    doc_tipo: 'V', // 'V' | 'E' | 'PN'
    doc_num: '',
    dni_cedula: '',
    genero: 'Masculino',
    fecha_nacimiento: '',
    estatura: '1.75',
    peso: '70',
    talla_camiseta: 'M',
    talla_short: 'M',
    talla_zapatos: '41',
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

    // QA 1: Nombre (solo letras y espacios, sin comas, asteriscos, números)
    const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/;
    if (!adultForm.nombre_completo.trim() || !nameRegex.test(adultForm.nombre_completo.trim())) {
      if (onError) onError('Tu nombre completo solo debe contener letras y espacios (sin números ni caracteres especiales).');
      return;
    }

    // QA 2: Cédula / DNI del Atleta Mayor (máx. 20 números)
    const docTipo = adultForm.doc_tipo || 'V';
    const docNum = (adultForm.doc_num || '').trim().replace(/\D/g, '').slice(0, 20);
    const docFinal = docNum ? (docTipo === 'PN' ? `PN:${docNum}` : `${docTipo}-${docNum}`) : adultForm.dni_cedula.trim();
    if (!docFinal) {
      if (onError) onError('Debes ingresar tu Cédula / DNI (solo números, máx. 20 dígitos).');
      return;
    }

    // QA 3: Teléfono (máximo 11 dígitos numéricos)
    const cleanPhone = adultForm.telefono.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length > 11) {
      if (onError) onError('El teléfono de contacto debe ser numérico con un máximo de 11 dígitos (Ej: 04121234567).');
      return;
    }

    // QA 4: Correo (máximo 50 caracteres)
    if (adultForm.email.length > 50) {
      if (onError) onError('El correo electrónico no puede exceder 50 caracteres.');
      return;
    }
    if (/\s/.test(adultForm.email) || /\s/.test(adultForm.password)) {
      if (onError) onError('No se permiten espacios en blanco en el correo ni en la contraseña.');
      return;
    }

    // QA 5: Contraseña (máximo 20 caracteres)
    if (adultForm.password.length > 20) {
      if (onError) onError('La contraseña no puede exceder 20 caracteres.');
      return;
    }
    if (!passwordCheck.isValid) {
      if (onError) {
        onError(
          'La contraseña debe tener entre 8 y 20 caracteres e incluir mayúsculas, minúsculas, números y signos (Semáforo Verde).'
        );
      }
      return;
    }

    // QA 6: Fecha de nacimiento y edad
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

    // QA 7: Talla de zapatos (solo 2 caracteres numéricos)
    const cleanZapatos = adultForm.talla_zapatos.replace(/\D/g, '');
    if (!cleanZapatos || cleanZapatos.length > 2) {
      if (onError) onError('La talla de zapatos debe contener únicamente hasta 2 dígitos numéricos (Ej: 41).');
      return;
    }

    // QA 8: Referencia bancaria (máximo 8 dígitos numéricos)
    const cleanRef = adultForm.referencia_bancaria.replace(/\D/g, '');
    if (!cleanRef || cleanRef.length > 8) {
      if (onError) onError('La referencia bancaria debe contener solo los últimos dígitos numéricos (máximo 8 dígitos).');
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
      formData.append('dni_cedula', docFinal);
      formData.append('genero', adultForm.genero);
      formData.append('fecha_nacimiento', adultForm.fecha_nacimiento);
      formData.append('estatura', adultForm.estatura);
      formData.append('peso', adultForm.peso);
      formData.append('talla_camiseta', adultForm.talla_camiseta);
      formData.append('talla_short', adultForm.talla_short);
      formData.append('talla_zapatos', cleanZapatos);
      formData.append('pierna_habil', adultForm.pierna_habil);
      formData.append('disciplina', adultForm.disciplina);
      formData.append('categoria_preferida', effectiveAdultCategory || 'Libre');
      formData.append('posicion_juego', adultForm.posicion_juego);
      formData.append('telefono', cleanPhone);
      formData.append('email', adultForm.email.trim().toLowerCase());
      formData.append('password', adultForm.password);
      formData.append('metodo_pago', adultForm.metodo_pago);
      formData.append('referencia_bancaria', cleanRef);
      formData.append('telefono_pago', (adultForm.telefono_pago || '').replace(/\D/g, '').slice(0, 11));
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-semibold text-texto-secundario mb-1">
            Nombre Completo*
          </label>
          <input
            type="text"
            className="input-fenix"
            placeholder="Ej: Gabriel Antonio Rivas"
            maxLength={60}
            value={adultForm.nombre_completo}
            onChange={(e) =>
              setAdultForm({
                ...adultForm,
                nombre_completo: e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, ''),
              })
            }
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-texto-secundario mb-1">
            Cédula / DNI*
          </label>
          <div className="flex w-full bg-[#151515] border border-neutral-700 focus-within:border-rojo-fuego focus-within:ring-1 focus-within:ring-rojo-fuego rounded-lg overflow-hidden transition">
            <select
              className="bg-neutral-800 text-white font-bold text-sm px-3 py-2.5 outline-none border-r border-neutral-700 cursor-pointer shrink-0"
              value={adultForm.doc_tipo || 'V'}
              onChange={(e) => {
                const tipo = e.target.value;
                const num = adultForm.doc_num || '';
                setAdultForm({
                  ...adultForm,
                  doc_tipo: tipo,
                  dni_cedula: num ? (tipo === 'PN' ? `PN:${num}` : `${tipo}-${num}`) : '',
                });
              }}
            >
              <option value="V">V</option>
              <option value="E">E</option>
              <option value="PN">PN</option>
            </select>
            <input
              type="text"
              className="w-full bg-transparent px-3 py-2 text-sm text-white font-mono font-bold outline-none placeholder-neutral-500 min-w-0"
              placeholder={adultForm.doc_tipo === 'E' ? '84123456' : adultForm.doc_tipo === 'PN' ? '12345678' : '26123456'}
              maxLength={20}
              value={adultForm.doc_num || ''}
              onChange={(e) => {
                const num = e.target.value.replace(/\D/g, '').slice(0, 20);
                const tipo = adultForm.doc_tipo || 'V';
                setAdultForm({
                  ...adultForm,
                  doc_num: num,
                  dni_cedula: num ? (tipo === 'PN' ? `PN:${num}` : `${tipo}-${num}`) : '',
                });
              }}
              required
            />
          </div>
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

      {/* Fecha de Nacimiento y Categoría Asignada */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-texto-secundario mb-1">
            Fecha de Nacimiento*
          </label>
          <input
            type="date"
            className="input-fenix"
            min="1940-01-01"
            max={new Date().toISOString().slice(0, 10)}
            value={adultForm.fecha_nacimiento}
            onChange={(e) => {
              let val = e.target.value;
              const parts = val.split('-');
              if (parts[0] && parts[0].length > 4) {
                parts[0] = parts[0].slice(0, 4);
                val = parts.join('-');
              }
              setAdultForm({ ...adultForm, fecha_nacimiento: val });
            }}
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
              {computedAge} años → {effectiveAdultCategory} ({adultForm.disciplina}) • Matrícula: 15€
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

      {/* Disciplina, Posición y Pie Hábil */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
      </div>

      {/* Tallas y Biometría Simétricas en 5 Columnas */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        <div>
          <label className="block text-xs font-semibold text-texto-secundario mb-1">
            Estatura (m)*
          </label>
          <input
            type="text"
            className="input-fenix"
            placeholder="1.78"
            maxLength={5}
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
            type="text"
            className="input-fenix"
            placeholder="74.5"
            maxLength={5}
            value={adultForm.peso}
            onChange={(e) => setAdultForm({ ...adultForm, peso: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-texto-secundario mb-1">
            Talla Camisa*
          </label>
          <select
            className="input-fenix text-xs"
            value={adultForm.talla_camiseta}
            onChange={(e) => setAdultForm({ ...adultForm, talla_camiseta: e.target.value })}
          >
            {['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'].map((t) => (
              <option key={t} value={t}>Talla {t}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-texto-secundario mb-1">
            Talla Shorts*
          </label>
          <select
            className="input-fenix text-xs"
            value={adultForm.talla_short}
            onChange={(e) => setAdultForm({ ...adultForm, talla_short: e.target.value })}
          >
            {['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'].map((t) => (
              <option key={t} value={t}>Talla {t}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-texto-secundario mb-1">
            Talla Zapatos*
          </label>
          <input
            type="text"
            className="input-fenix font-mono font-bold"
            placeholder="Ej: 41"
            maxLength={2}
            value={adultForm.talla_zapatos}
            onChange={(e) =>
              setAdultForm({
                ...adultForm,
                talla_zapatos: e.target.value.replace(/\D/g, '').slice(0, 2),
              })
            }
            required
          />
        </div>
      </div>

      {/* Contacto y Credenciales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-neutral-800">
        <div>
          <label className="block text-xs font-semibold text-texto-secundario mb-1">
            Número de Teléfono*
          </label>
          <input
            type="tel"
            className="input-fenix font-mono font-bold"
            placeholder="04145559876"
            maxLength={11}
            value={adultForm.telefono}
            onChange={(e) =>
              setAdultForm({
                ...adultForm,
                telefono: e.target.value.replace(/\D/g, '').slice(0, 11),
              })
            }
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-texto-secundario mb-1">
            Correo Electrónico (Usuario)*
          </label>
          <input
            type="email"
            className="input-fenix"
            placeholder="atleta@correo.com"
            maxLength={50}
            value={adultForm.email}
            onChange={(e) =>
              setAdultForm({
                ...adultForm,
                email: e.target.value.replace(/\s+/g, '').slice(0, 50),
              })
            }
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-texto-secundario mb-1">
          Contraseña de Acceso*
        </label>
        <input
          type="password"
          className="input-fenix"
          placeholder="••••••••••••"
          maxLength={20}
          value={adultForm.password}
          onChange={(e) =>
            setAdultForm({
              ...adultForm,
              password: e.target.value.replace(/\s+/g, '').slice(0, 20),
            })
          }
          required
        />
        <div className="mt-2">
          <PasswordStrengthSemaforo password={adultForm.password} />
        </div>
      </div>

      {/* Pago de Inscripción con QR + Tasa BCV + Comprobante */}
      <div className="border-t border-neutral-800 pt-4 space-y-3">
        <h4 className="font-display text-lg font-extrabold text-white flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-rojo-fuego" />
          PAGO DE MATRÍCULA DE INSCRIPCIÓN Y COMPROBANTE
        </h4>
        <PaymentMethodsBox
          amount={15}
          concept={`Inscripción ${effectiveAdultCategory || 'Adulto'} - ${adultForm.disciplina}`}
        />

        {/* Fila de Pagos Perfectamente Ordenada y Alineada */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          <div>
            <label className="block text-xs font-semibold text-texto-secundario mb-1">
              Método de Pago*
            </label>
            <select
              className="input-fenix"
              value={adultForm.metodo_pago}
              onChange={(e) => setAdultForm({ ...adultForm, metodo_pago: e.target.value })}
            >
              <option value="Pago Móvil">Pago Móvil</option>
              <option value="Transferencia Bancaria">Transferencia Bancaria</option>
              <option value="Zelle">Zelle</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-texto-secundario mb-1">
              Referencia Bancaria*
            </label>
            <input
              type="text"
              className="input-fenix font-mono font-bold"
              placeholder="Ej: 77441122"
              maxLength={8}
              value={adultForm.referencia_bancaria}
              onChange={(e) =>
                setAdultForm({
                  ...adultForm,
                  referencia_bancaria: e.target.value.replace(/\D/g, '').slice(0, 8),
                })
              }
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-texto-secundario mb-1">
              Teléfono desde donde pagó*
            </label>
            <input
              type="tel"
              className="input-fenix font-mono font-bold"
              placeholder="04145559876"
              maxLength={11}
              value={adultForm.telefono_pago}
              onChange={(e) =>
                setAdultForm({
                  ...adultForm,
                  telefono_pago: e.target.value.replace(/\D/g, '').slice(0, 11),
                })
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
