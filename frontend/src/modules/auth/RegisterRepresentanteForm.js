import React, { useEffect, useState } from 'react';
import {
  Upload,
  CheckCircle2,
  CreditCard,
  User,
  Users,
  ShieldAlert,
  Sparkles,
  Calendar,
} from 'lucide-react';
import PaymentMethodsBox from '../../components/PaymentMethodsBox';
import PasswordStrengthSemaforo, {
  evaluatePasswordSemaforo,
} from '../../components/PasswordStrengthSemaforo';
import api from '../../utils/api';
import { saveSession } from '../../utils/auth';
import { useBcvRate, formatBs, calcPriceBs } from '../../utils/bcv';
import {
  DISCIPLINES,
  calculateAgeFromBirthDate,
  recommendCategoryNameForAge,
} from '../../utils/categories';

export default function RegisterRepresentanteForm({
  onError,
  onSwitchToAdulto,
  onSuccessRedirect,
}) {
  const [loading, setLoading] = useState(false);
  const { bcv } = useBcvRate();
  const tasa = Number(bcv?.tasa_bcv || 0);

  const [form, setForm] = useState({
    // Representante
    rep_nombre: '',
    rep_doc_tipo: 'V', // 'V' | 'E' | 'PN'
    rep_doc_num: '',
    rep_dni: '',
    rep_parentesco: 'Padre',
    rep_telefono: '',
    rep_direccion: '',
    email: '',
    password: '',

    // Atleta Menor
    atleta_nombre_completo: '',
    atleta_doc_tipo: 'V', // 'V' | 'E' | 'PN'
    atleta_doc_num: '',
    atleta_dni: '',
    atleta_genero: 'Masculino',
    atleta_fecha_nacimiento: '',
    estatura: '1.40',
    peso: '38',
    pierna_habil: 'Derecha',
    disciplina: 'Equipo de Fútbol Campo',
    posicion_juego: 'Mediocampista Central',
    talla_camiseta: '10',
    talla_short: '10',
    talla_zapatos: '34',

    // Archivos
    foto_perfil: null,
    comprobante_pago: null,

    // Pago
    metodo_pago: 'Pago Móvil',
    referencia_bancaria: '',
    telefono_pago: '',
  });

  const [fotoPreview, setFotoPreview] = useState(null);
  const [comprobantePreview, setComprobantePreview] = useState(null);

  useEffect(() => {
    return () => {
      if (fotoPreview) URL.revokeObjectURL(fotoPreview);
      if (comprobantePreview) URL.revokeObjectURL(comprobantePreview);
    };
  }, [fotoPreview, comprobantePreview]);

  const computedAge = calculateAgeFromBirthDate(form.atleta_fecha_nacimiento);
  const recommendedCategory = recommendCategoryNameForAge(computedAge, false);
  const passwordCheck = evaluatePasswordSemaforo(form.password);

  // Tarifa oficial según categoría y edad asignada:
  // Menor (0 - 17 años): 10€
  // Mayor (>= 18 años): 15€
  const tarifaMatricula = computedAge !== null && computedAge >= 18 ? 15 : 10;
  const montoBsInscripcion = calcPriceBs(tarifaMatricula, tasa);

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0] || null;
    setForm((prev) => ({ ...prev, foto_perfil: file }));
    if (fotoPreview) URL.revokeObjectURL(fotoPreview);
    setFotoPreview(file ? URL.createObjectURL(file) : null);
  };

  const handleComprobanteChange = (e) => {
    const file = e.target.files?.[0] || null;
    setForm((prev) => ({ ...prev, comprobante_pago: file }));
    if (comprobantePreview) URL.revokeObjectURL(comprobantePreview);
    setComprobantePreview(file ? URL.createObjectURL(file) : null);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (onError) onError('');

    // QA 1: Validar nombres (solo letras y espacios, sin comas, asteriscos, números)
    const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/;
    if (!form.rep_nombre.trim() || !nameRegex.test(form.rep_nombre.trim())) {
      if (onError) onError('El nombre del representante solo debe contener letras y espacios (sin números ni caracteres especiales).');
      return;
    }
    if (!form.atleta_nombre_completo.trim() || !nameRegex.test(form.atleta_nombre_completo.trim())) {
      if (onError) onError('El nombre del atleta solo debe contener letras y espacios (sin números ni caracteres especiales).');
      return;
    }

    // QA 2: Cédula / DNI del Representante
    const repDocTipo = form.rep_doc_tipo || 'V';
    const repDocNum = (form.rep_doc_num || '').trim().replace(/\D/g, '').slice(0, 20);
    const repDocFinal = repDocNum ? `${repDocTipo}-${repDocNum}` : form.rep_dni.trim();
    if (!repDocFinal) {
      if (onError) onError('Debes ingresar la Cédula / DNI del representante (solo números, máx. 20 dígitos).');
      return;
    }

    // QA 3: Cédula o Partida del Atleta
    const docTipo = form.atleta_doc_tipo || 'V';
    const docNum = (form.atleta_doc_num || '').trim().replace(/\D/g, '').slice(0, 20);
    const docFinal = docNum
      ? (docTipo === 'PN' ? `PN:${docNum}` : `${docTipo}-${docNum}`)
      : form.atleta_dni.trim();
    if (!docFinal) {
      if (onError) onError('Debes ingresar la Cédula o Código de Partida de Nacimiento del atleta (solo números, máx. 20 dígitos).');
      return;
    }

    // QA 4: Teléfono (máximo 11 dígitos numéricos)
    const cleanPhone = form.rep_telefono.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length > 11) {
      if (onError) onError('El teléfono de contacto debe ser numérico con un máximo de 11 dígitos (Ej: 04121234567).');
      return;
    }

    // QA 5: Correo (máximo 50 caracteres)
    if (form.email.length > 50) {
      if (onError) onError('El correo electrónico no puede exceder 50 caracteres.');
      return;
    }
    if (/\s/.test(form.email) || /\s/.test(form.password)) {
      if (onError) onError('No se permiten espacios en blanco en el correo ni en la contraseña.');
      return;
    }

    // QA 6: Dirección (máximo 100 caracteres)
    if (form.rep_direccion && form.rep_direccion.length > 100) {
      if (onError) onError('La dirección de residencia no puede exceder 100 caracteres.');
      return;
    }

    // QA 7: Contraseña (máximo 20 caracteres)
    if (form.password.length > 20) {
      if (onError) onError('La contraseña no puede tener más de 20 caracteres.');
      return;
    }
    if (!passwordCheck.isValid) {
      if (onError) {
        onError(
          'La contraseña debe tener entre 8 y 20 caracteres, incluir mayúsculas, minúsculas, números y signos (Semáforo Verde).'
        );
      }
      return;
    }

    // QA 8: Fecha de nacimiento y 4 dígitos de año
    if (computedAge === null) {
      if (onError) onError('Selecciona la fecha de nacimiento del atleta para validar su edad y categoría.');
      return;
    }
    if (computedAge >= 18) {
      if (onError) {
        onError(
          `El atleta tiene ${computedAge} años. Los atletas mayores de edad deben registrarse directamente en la pestaña "Mayor de Edad".`
        );
      }
      if (onSwitchToAdulto) onSwitchToAdulto();
      return;
    }

    // QA 9: Talla de zapatos (solo 2 caracteres numéricos)
    const cleanZapatos = form.talla_zapatos.replace(/\D/g, '');
    if (!cleanZapatos || cleanZapatos.length > 2) {
      if (onError) onError('La talla de zapatos debe contener únicamente hasta 2 dígitos numéricos (Ej: 34).');
      return;
    }

    // QA 10: Referencia bancaria (máximo 8 dígitos numéricos)
    const cleanRef = form.referencia_bancaria.replace(/\D/g, '');
    if (!cleanRef || cleanRef.length > 8) {
      if (onError) onError('La referencia bancaria debe contener solo los últimos dígitos numéricos (máximo 8 dígitos).');
      return;
    }

    if (!form.foto_perfil) {
      if (onError) onError('Debes adjuntar la fotografía de perfil del atleta menor.');
      return;
    }

    if (!form.comprobante_pago) {
      if (onError) onError('Debes adjuntar el comprobante o capture del pago de inscripción.');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('rep_nombre', form.rep_nombre.trim());
      formData.append('rep_dni', repDocFinal);
      formData.append('rep_parentesco', form.rep_parentesco);
      formData.append('rep_telefono', cleanPhone);
      formData.append('rep_direccion', form.rep_direccion.trim());
      formData.append('email', form.email.trim().toLowerCase());
      formData.append('password', form.password);

      formData.append('atleta_nombre_completo', form.atleta_nombre_completo.trim());
      formData.append('atleta_dni', docFinal);
      formData.append('atleta_genero', form.atleta_genero);
      formData.append('atleta_fecha_nacimiento', form.atleta_fecha_nacimiento);
      formData.append('estatura', form.estatura);
      formData.append('peso', form.peso);
      formData.append('pierna_habil', form.pierna_habil);
      formData.append('disciplina', form.disciplina);
      formData.append('posicion_juego', form.posicion_juego);
      formData.append('talla_camiseta', form.talla_camiseta);
      formData.append('talla_short', form.talla_short);
      formData.append('talla_zapatos', cleanZapatos);

      formData.append('metodo_pago', form.metodo_pago);
      formData.append('referencia_bancaria', cleanRef);
      formData.append('telefono_pago', (form.telefono_pago || '').replace(/\D/g, '').slice(0, 11));

      formData.append('foto_perfil', form.foto_perfil);
      formData.append('comprobante_pago', form.comprobante_pago);

      const res = await api.post('/auth/register-minor', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      saveSession(res.data.token, res.data.user);
      if (onSuccessRedirect) onSuccessRedirect('/portal-padres');
    } catch (err) {
      if (onError) onError(err.response?.data?.error || 'No se pudo completar el registro del menor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleRegister} className="space-y-5 animate-fadeIn">
      {/* 1. SECCIÓN: DATOS DEL REPRESENTANTE LEGAL */}
      <div className="card-fenix p-4 sm:p-5 border-l-4 border-l-rojo-fuego space-y-3">
        <div className="flex items-center gap-2 border-b border-neutral-800 pb-2">
          <User className="w-4 h-4 text-rojo-fuego" />
          <h3 className="font-display text-base font-bold text-white uppercase tracking-wider">
            1. Datos del Representante Legal (Padre, Madre o Tutor)
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-texto-secundario mb-1">
              Nombre Completo del Representante*
            </label>
            <input
              type="text"
              className="input-fenix"
              placeholder="Ej: Carlos Eduardo Mendoza"
              maxLength={60}
              value={form.rep_nombre}
              onChange={(e) =>
                setForm({
                  ...form,
                  rep_nombre: e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, ''),
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
                value={form.rep_doc_tipo || 'V'}
                onChange={(e) => {
                  const tipo = e.target.value;
                  const num = form.rep_doc_num || '';
                  setForm({
                    ...form,
                    rep_doc_tipo: tipo,
                    rep_dni: num ? (tipo === 'PN' ? `PN:${num}` : `${tipo}-${num}`) : '',
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
                placeholder={form.rep_doc_tipo === 'E' ? '84123456' : form.rep_doc_tipo === 'PN' ? '12345678' : '18234567'}
                maxLength={20}
                value={form.rep_doc_num || ''}
                onChange={(e) => {
                  const num = e.target.value.replace(/\D/g, '').slice(0, 20);
                  const tipo = form.rep_doc_tipo || 'V';
                  setForm({
                    ...form,
                    rep_doc_num: num,
                    rep_dni: num ? (tipo === 'PN' ? `PN:${num}` : `${tipo}-${num}`) : '',
                  });
                }}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-texto-secundario mb-1">
              Parentesco*
            </label>
            <select
              className="input-fenix"
              value={form.rep_parentesco}
              onChange={(e) => setForm({ ...form, rep_parentesco: e.target.value })}
            >
              <option value="Padre">Padre</option>
              <option value="Madre">Madre</option>
              <option value="Tutor">Tutor Legal</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-texto-secundario mb-1">
              Teléfono de Contacto WhatsApp*
            </label>
            <input
              type="tel"
              className="input-fenix font-mono"
              placeholder="04121234567"
              maxLength={11}
              value={form.rep_telefono}
              onChange={(e) =>
                setForm({
                  ...form,
                  rep_telefono: e.target.value.replace(/\D/g, '').slice(0, 11),
                })
              }
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-texto-secundario mb-1">
              Dirección de Residencia
            </label>
            <input
              type="text"
              className="input-fenix"
              placeholder="Sector, Urb., Ciudad"
              maxLength={100}
              value={form.rep_direccion}
              onChange={(e) =>
                setForm({ ...form, rep_direccion: e.target.value.slice(0, 100) })
              }
            />
          </div>
        </div>

        {/* Credenciales de Acceso */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-neutral-800/80">
          <div>
            <label className="block text-xs font-semibold text-texto-secundario mb-1">
              Correo Electrónico (Usuario)*
            </label>
            <input
              type="email"
              className="input-fenix"
              placeholder="correo@ejemplo.com"
              maxLength={50}
              value={form.email}
              onChange={(e) =>
                setForm({ ...form, email: e.target.value.replace(/\s+/g, '').slice(0, 50) })
              }
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
              placeholder="••••••••••••"
              maxLength={20}
              value={form.password}
              onChange={(e) =>
                setForm({ ...form, password: e.target.value.replace(/\s+/g, '').slice(0, 20) })
              }
              required
            />
          </div>
        </div>

        {form.password && (
          <PasswordStrengthSemaforo
            analysis={passwordCheck}
            helperText="Requerido Semáforo Verde: mayúscula, minúscula, número y símbolo especial."
          />
        )}
      </div>

      {/* 2. SECCIÓN: DATOS DEPORTIVOS Y PERSONALES DEL ATLETA MENOR */}
      <div className="card-fenix p-4 sm:p-5 border-l-4 border-l-vinotinto space-y-4">
        <div className="flex items-center gap-2 border-b border-neutral-800 pb-2">
          <Users className="w-4 h-4 text-rojo-fuego" />
          <h3 className="font-display text-base font-bold text-white uppercase tracking-wider">
            2. Ficha y Datos del Atleta Menor
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-texto-secundario mb-1">
              Nombre Completo del Atleta*
            </label>
            <input
              type="text"
              className="input-fenix"
              placeholder="Ej: Daniel Alejandro Mendoza"
              maxLength={60}
              value={form.atleta_nombre_completo}
              onChange={(e) =>
                setForm({
                  ...form,
                  atleta_nombre_completo: e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, ''),
                })
              }
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-texto-secundario mb-1">
              Cédula / Partida de Nacimiento*
            </label>
            <div className="flex w-full bg-[#151515] border border-neutral-700 focus-within:border-rojo-fuego focus-within:ring-1 focus-within:ring-rojo-fuego rounded-lg overflow-hidden transition">
              <select
                className="bg-neutral-800 text-white font-bold text-sm px-3 py-2.5 outline-none border-r border-neutral-700 cursor-pointer shrink-0"
                value={form.atleta_doc_tipo || 'V'}
                onChange={(e) => {
                  const tipo = e.target.value;
                  const num = form.atleta_doc_num || '';
                  setForm({
                    ...form,
                    atleta_doc_tipo: tipo,
                    atleta_dni: num ? (tipo === 'PN' ? `PN:${num}` : `${tipo}-${num}`) : '',
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
                placeholder={
                  form.atleta_doc_tipo === 'PN'
                    ? 'Nº Acta Partida'
                    : form.atleta_doc_tipo === 'E'
                    ? '84123456'
                    : '32123456'
                }
                maxLength={20}
                value={form.atleta_doc_num || ''}
                onChange={(e) => {
                  const num = e.target.value.replace(/\D/g, '').slice(0, 20);
                  const tipo = form.atleta_doc_tipo || 'V';
                  setForm({
                    ...form,
                    atleta_doc_num: num,
                    atleta_dni: num ? (tipo === 'PN' ? `PN:${num}` : `${tipo}-${num}`) : '',
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
              value={form.atleta_genero}
              onChange={(e) => setForm({ ...form, atleta_genero: e.target.value })}
            >
              <option value="Masculino">Masculino</option>
              <option value="Femenino">Femenino</option>
            </select>
          </div>
        </div>

        {/* Fecha de Nacimiento y Categoría Automática */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-texto-secundario mb-1">
              Fecha de Nacimiento del Menor*
            </label>
            <input
              type="date"
              className="input-fenix"
              min="1940-01-01"
              max={new Date().toISOString().slice(0, 10)}
              value={form.atleta_fecha_nacimiento}
              onChange={(e) => {
                let val = e.target.value;
                const parts = val.split('-');
                if (parts[0] && parts[0].length > 4) {
                  parts[0] = parts[0].slice(0, 4);
                  val = parts.join('-');
                }
                setForm({ ...form, atleta_fecha_nacimiento: val });
              }}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-texto-secundario mb-1">
              Categoría Oficial Asignada Automáticamente
            </label>
            <div className="input-fenix bg-neutral-900/80 border-dashed text-xs flex items-center justify-between">
              <span className="font-bold text-amber-300">
                {recommendedCategory
                  ? `${recommendedCategory} (${computedAge} años) • Matrícula: ${tarifaMatricula}€`
                  : 'Ingresa la fecha de nacimiento'}
              </span>
              <span className="text-[10px] text-verde-neon font-semibold">
                {computedAge !== null ? `${tarifaMatricula}€` : 'Regla Fénix'}
              </span>
            </div>
          </div>
        </div>

        {/* Disciplina y Posición */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-texto-secundario mb-1">
              Disciplina / Modalidad*
            </label>
            <select
              className="input-fenix"
              value={form.disciplina}
              onChange={(e) => setForm({ ...form, disciplina: e.target.value })}
            >
              <option value="Equipo de Fútbol Campo">⚽ Equipo de Fútbol Campo (11v11)</option>
              <option value="Equipo de Fútbol 7">🥅 Equipo de Fútbol 7</option>
              <option value="Equipo de Sala">⚡ Equipo de Fútbol Sala (5v5)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-texto-secundario mb-1">
              Posición Habitual de Juego*
            </label>
            <select
              className="input-fenix"
              value={form.posicion_juego}
              onChange={(e) => setForm({ ...form, posicion_juego: e.target.value })}
            >
              <option value="Portero">Portero</option>
              <option value="Defensa Central">Defensa Central</option>
              <option value="Lateral Derecho">Lateral Derecho</option>
              <option value="Lateral Izquierdo">Lateral Izquierdo</option>
              <option value="Mediocampista Defensivo">Mediocampista Defensivo</option>
              <option value="Mediocampista Central">Mediocampista Central</option>
              <option value="Extremo Derecho">Extremo Derecho</option>
              <option value="Extremo Izquierdo">Extremo Izquierdo</option>
              <option value="Delantero Centro">Delantero Centro</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-texto-secundario mb-1">
              Pierna Hábil*
            </label>
            <select
              className="input-fenix"
              value={form.pierna_habil}
              onChange={(e) => setForm({ ...form, pierna_habil: e.target.value })}
            >
              <option value="Derecha">Derecha</option>
              <option value="Izquierda">Izquierda</option>
              <option value="Ambidiestro">Ambidiestro</option>
            </select>
          </div>
        </div>

        {/* Tallas de Uniforme, Zapatos, Estatura y Peso: Totalmente Alineadas y Simétricas */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          <div>
            <label className="block text-xs font-semibold text-texto-secundario mb-1">
              Estatura (m)
            </label>
            <input
              type="text"
              className="input-fenix"
              placeholder="1.42"
              maxLength={5}
              value={form.estatura}
              onChange={(e) => setForm({ ...form, estatura: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-texto-secundario mb-1">
              Peso (kg)
            </label>
            <input
              type="text"
              className="input-fenix"
              placeholder="38"
              maxLength={5}
              value={form.peso}
              onChange={(e) => setForm({ ...form, peso: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-texto-secundario mb-1">
              Talla Camisa*
            </label>
            <select
              className="input-fenix text-xs"
              value={form.talla_camiseta}
              onChange={(e) => setForm({ ...form, talla_camiseta: e.target.value })}
            >
              <option value="4">4 (Bebés)</option>
              <option value="6">6</option>
              <option value="8">8</option>
              <option value="10">10</option>
              <option value="12">12</option>
              <option value="14">14</option>
              <option value="16">16</option>
              <option value="S">S</option>
              <option value="M">M</option>
              <option value="L">L</option>
              <option value="XL">XL</option>
              <option value="XXL">XXL</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-texto-secundario mb-1">
              Talla Shorts*
            </label>
            <select
              className="input-fenix text-xs"
              value={form.talla_short}
              onChange={(e) => setForm({ ...form, talla_short: e.target.value })}
            >
              <option value="4">4</option>
              <option value="6">6</option>
              <option value="8">8</option>
              <option value="10">10</option>
              <option value="12">12</option>
              <option value="14">14</option>
              <option value="16">16</option>
              <option value="S">S</option>
              <option value="M">M</option>
              <option value="L">L</option>
              <option value="XL">XL</option>
              <option value="XXL">XXL</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-texto-secundario mb-1">
              Talla Zapatos*
            </label>
            <input
              type="text"
              className="input-fenix font-mono font-bold"
              placeholder="Ej: 34"
              maxLength={2}
              value={form.talla_zapatos}
              onChange={(e) =>
                setForm({ ...form, talla_zapatos: e.target.value.replace(/\D/g, '').slice(0, 2) })
              }
              required
            />
          </div>
        </div>

        {/* FOTO DE PERFIL DEL ATLETA ESTILIZADA */}
        <div className="pt-2 border-t border-neutral-800">
          <label className="block text-xs font-semibold text-texto-secundario mb-1">
            Fotografía de Perfil del Atleta* (Formato Carnet / Rostro)
          </label>
          <div className="flex flex-col sm:flex-row items-center gap-4 bg-[#101014] p-3.5 rounded-xl border border-neutral-800">
            {fotoPreview ? (
              <img
                src={fotoPreview}
                alt="Vista previa atleta"
                className="w-20 h-24 object-cover rounded-lg border border-rojo-fuego shrink-0"
              />
            ) : (
              <div className="w-20 h-24 rounded-lg bg-neutral-800/80 border border-dashed border-neutral-700 flex flex-col items-center justify-center text-neutral-500 text-[10px] shrink-0">
                <Upload className="w-5 h-5 mb-1 text-neutral-400" />
                Sin foto
              </div>
            )}
            <div className="space-y-1.5 text-xs">
              <label className="btn-vinotinto text-xs cursor-pointer inline-flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5" />
                {form.foto_perfil ? form.foto_perfil.name : 'Subir Foto de Perfil'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </label>
              <p className="text-[11px] text-texto-secundario">
                Foto nítida del rostro del atleta, con fondo claro preferiblemente para su carnet oficial.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. SECCIÓN: MATRÍCULA DE INSCRIPCIÓN Y COMPROBANTE (EXCLUSIVAMENTE EN BOLÍVARES) */}
      <div className="card-fenix p-4 sm:p-5 border-l-4 border-l-dorado-fenix space-y-4">
        <div className="flex items-center gap-2 border-b border-neutral-800 pb-2">
          <CreditCard className="w-4 h-4 text-dorado-fenix" />
          <h3 className="font-display text-base font-bold text-white uppercase tracking-wider">
            3. Matrícula de Inscripción Oficial
          </h3>
        </div>

        <PaymentMethodsBox
          amount={tarifaMatricula}
          concept={`Inscripción ${recommendedCategory ? `${recommendedCategory} (${computedAge || 0} años)` : 'Atleta'} - ${form.disciplina}`}
        />

        {/* Fila de Pagos Perfectamente Ordenada y Alineada */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-texto-secundario mb-1">
              Método de Pago*
            </label>
            <select
              className="input-fenix"
              value={form.metodo_pago}
              onChange={(e) => setForm({ ...form, metodo_pago: e.target.value })}
            >
              <option value="Pago Móvil">Pago Móvil (Bs.)</option>
              <option value="Transferencia Bancaria">Transferencia Bancaria (Bs.)</option>
              <option value="Efectivo en Sede">Efectivo / Divisas en Sede</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-texto-secundario mb-1">
              Referencia Bancaria*
            </label>
            <input
              type="text"
              className="input-fenix font-mono font-bold"
              placeholder="Ej: 12345678"
              maxLength={8}
              value={form.referencia_bancaria}
              onChange={(e) =>
                setForm({
                  ...form,
                  referencia_bancaria: e.target.value.replace(/\D/g, '').slice(0, 8),
                })
              }
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-texto-secundario mb-1">
              Teléfono del Pago Móvil*
            </label>
            <input
              type="tel"
              className="input-fenix font-mono font-bold"
              placeholder="04121234567"
              maxLength={11}
              value={form.telefono_pago}
              onChange={(e) =>
                setForm({
                  ...form,
                  telefono_pago: e.target.value.replace(/\D/g, '').slice(0, 11),
                })
              }
              required
            />
          </div>
        </div>

        {/* COMPROBANTE O CAPTURE ESTILIZADO */}
        <div>
          <label className="block text-xs font-semibold text-texto-secundario mb-1">
            Capture o Comprobante del Pago de Inscripción*
          </label>
          <div className="flex flex-col sm:flex-row items-center gap-4 bg-[#101014] p-3.5 rounded-xl border border-neutral-800">
            {comprobantePreview ? (
              <img
                src={comprobantePreview}
                alt="Capture de pago"
                className="w-24 h-24 object-cover rounded-lg border border-dorado-fenix shrink-0"
              />
            ) : (
              <div className="w-24 h-24 rounded-lg bg-neutral-800/80 border border-dashed border-neutral-700 flex flex-col items-center justify-center text-neutral-500 text-[10px] shrink-0">
                <CreditCard className="w-6 h-6 mb-1 text-neutral-400" />
                Capture
              </div>
            )}
            <div className="space-y-1.5 text-xs">
              <label className="btn-vinotinto text-xs cursor-pointer inline-flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5" />
                {form.comprobante_pago ? form.comprobante_pago.name : 'Subir Capture de Pago'}
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleComprobanteChange}
                  className="hidden"
                />
              </label>
              <p className="text-[11px] text-texto-secundario">
                Adjunta la captura legible del comprobante bancario para la verificación de administración.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* BOTÓN FINAL DE REGISTRO */}
      <button
        type="submit"
        disabled={loading}
        className="w-full btn-cta py-3 text-sm font-extrabold shadow-fuego flex items-center justify-center gap-2"
      >
        <Sparkles className="w-4 h-4" />
        {loading ? 'Procesando Inscripción...' : `Completar Registro e Inscripción (${formatBs(montoBsInscripcion)})`}
      </button>
    </form>
  );
}
