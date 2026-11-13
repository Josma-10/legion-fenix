import React, { useEffect, useState } from 'react';
import {
  User,
  UserPlus,
  HeartPulse,
  Shirt,
  FileCheck2,
  Upload,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
} from 'lucide-react';
import api from '../../utils/api';
import {
  DISCIPLINES,
  calculateAgeFromBirthDate,
  recommendCategoryNameForAge,
} from '../../utils/categories';

const STEPS = [
  { id: 1, title: 'Representante', icon: User },
  { id: 2, title: 'Atleta', icon: UserPlus },
  { id: 3, title: 'Ficha Médica', icon: HeartPulse },
  { id: 4, title: 'Kit y Dorsal', icon: Shirt },
  { id: 5, title: 'Legal', icon: FileCheck2 },
];

export default function StepperRegistroAtleta({ user, categories = [], onRegistered }) {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [error, setError] = useState('');
  const [dorsalStatus, setDorsalStatus] = useState(null);
  const [selectedModalidad, setSelectedModalidad] = useState('Campo');

  const [representanteData, setRepresentanteData] = useState({
    nombre: user?.nombre || '',
    documento_identidad: user?.documento_identidad || '',
    parentesco: user?.parentesco || 'Padre',
    telefono: user?.telefono || '',
    telefono_emergencia: user?.telefono_emergencia || user?.telefono || '',
    direccion: user?.direccion || '',
  });

  const [jugadorData, setJugadorData] = useState({
    nombre: '',
    apellido: '',
    fecha_nacimiento: '',
    dni_cedula: '',
    genero: 'Masculino',
    id_categoria: categories[0]?.id_categoria || '',
    posicion_habitual: 'Mediocentro Mixto',
    pierna_habil: 'Derecha',
    dorsal: '',
    foto_url: '/assets/avatar-player.svg',
  });

  const disciplineCategories = categories.filter((c) => c.modalidad === selectedModalidad);
  const computedAge = calculateAgeFromBirthDate(jugadorData.fecha_nacimiento);
  const recommendedCategoryName = recommendCategoryNameForAge(computedAge, false);

  useEffect(() => {
    if (categories.length === 0) return;
    const poolCats = categories.filter((c) => c.modalidad === selectedModalidad);
    if (poolCats.length === 0) return;

    if (recommendedCategoryName) {
      const matched = poolCats.find((c) => c.nombre === recommendedCategoryName);
      if (matched) {
        setJugadorData((prev) => ({
          ...prev,
          id_categoria: String(matched.id_categoria),
        }));
        return;
      }
    }

    setJugadorData((prev) => {
      const stillValid = poolCats.some((c) => String(c.id_categoria) === String(prev.id_categoria));
      return stillValid ? prev : { ...prev, id_categoria: String(poolCats[0].id_categoria) };
    });
  }, [categories, selectedModalidad, recommendedCategoryName]);

  const [fichaMedicaData, setFichaMedicaData] = useState({
    grupo_sanguineo: 'O+',
    alergias: 'Ninguna',
    condiciones_cardiacas: 'Sin alteraciones',
    evaluacion_podologica: 'Pisada Neutra',
    peso_kg: '',
    altura_m: '',
    contacto_emergencia_nombre: user?.nombre || '',
    contacto_emergencia_telefono: user?.telefono_emergencia || user?.telefono || '',
    seguro_medico_poliza: '',
    fecha_ultima_revision: new Date().toISOString().slice(0, 10),
  });

  const [uniformeData, setUniformeData] = useState({
    temporada: '2026-2027',
    talla_camiseta: '12',
    talla_short: '12',
  });

  const [consentimientoData, setConsentimientoData] = useState({
    uso_imagen: false,
    exoneracion_medica: false,
    firma_representante: user?.nombre || '',
  });

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('foto', file);
      const res = await api.post('/players/upload-photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setJugadorData((prev) => ({ ...prev, foto_url: res.data.url }));
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo cargar la fotografía.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleCheckDorsal = async (dorsalValue) => {
    setJugadorData((prev) => ({ ...prev, dorsal: dorsalValue }));
    if (!dorsalValue || !jugadorData.id_categoria) {
      setDorsalStatus(null);
      return;
    }
    try {
      const res = await api.get('/players/check-dorsal', {
        params: { id_categoria: jugadorData.id_categoria, dorsal: dorsalValue },
      });
      setDorsalStatus(res.data);
    } catch {
      setDorsalStatus(null);
    }
  };

  const validateCurrentStep = () => {
    setError('');
    if (step === 1) {
      if (!representanteData.documento_identidad || !representanteData.telefono_emergencia) {
        setError('Complete documento de identidad y teléfono de emergencia del representante.');
        return false;
      }
    }
    if (step === 2) {
      if (!jugadorData.nombre || !jugadorData.apellido || !jugadorData.fecha_nacimiento || !jugadorData.dni_cedula || !jugadorData.id_categoria) {
        setError('Complete nombre, apellido, DNI/Cédula, fecha de nacimiento y categoría del atleta.');
        return false;
      }
    }
    if (step === 3) {
      if (!fichaMedicaData.grupo_sanguineo || !fichaMedicaData.contacto_emergencia_nombre || !fichaMedicaData.contacto_emergencia_telefono) {
        setError('Grupo sanguíneo y contacto médico de emergencia son obligatorios.');
        return false;
      }
    }
    if (step === 4) {
      if (!uniformeData.talla_camiseta || !uniformeData.talla_short) {
        setError('Seleccione las tallas de camiseta y short.');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      setStep((s) => Math.min(s + 1, 5));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!consentimientoData.uso_imagen || !consentimientoData.exoneracion_medica || !consentimientoData.firma_representante) {
      setError('Debe aceptar ambas cláusulas legales y escribir su firma digital completa.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/players/register-complete', {
        representanteData,
        jugadorData,
        fichaMedicaData,
        uniformeData,
        consentimientoData,
      });
      if (onRegistered) onRegistered(res.data.player);
    } catch (err) {
      setError(err.response?.data?.error || 'Ocurrió un error al registrar al atleta.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card-fenix p-5 sm:p-7">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 border-b border-neutral-800 pb-4">
        <div>
          <h3 className="font-display text-2xl font-bold text-white uppercase tracking-wide">
            Inscripción Integral de Atleta (5 Etapas)
          </h3>
          <p className="text-xs text-texto-secundario">
            Registro oficial conectado con expediente médico, kit institucional y estado de cuenta.
          </p>
        </div>
        <span className="text-xs font-bold px-3 py-1 rounded-full bg-vinotinto/40 border border-vinotinto text-white">
          Etapa {step} de 5
        </span>
      </div>

      {/* Indicador de pasos */}
      <div className="grid grid-cols-5 gap-2 mb-8">
        {STEPS.map((item) => {
          const Icon = item.icon;
          const isActive = step === item.id;
          const isCompleted = step > item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => item.id < step && setStep(item.id)}
              className={`flex flex-col items-center gap-1.5 p-2 rounded-lg border transition text-center ${
                isActive
                  ? 'bg-vinotinto/30 border-rojo-fuego text-white'
                  : isCompleted
                  ? 'bg-green-950/30 border-green-700/60 text-green-300 cursor-pointer'
                  : 'bg-[#161616] border-neutral-800 text-neutral-500 cursor-default'
              }`}
            >
              <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-[10px] sm:text-xs font-semibold hidden sm:block">{item.title}</span>
              <span className="text-[10px] font-bold sm:hidden">{item.id}</span>
            </button>
          );
        })}
      </div>

      {error && (
        <div className="mb-5 bg-rojo-fuego/15 border border-rojo-fuego text-red-200 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rojo-fuego" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {step === 1 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-texto-secundario mb-1">Nombre del Representante</label>
              <input
                type="text"
                className="input-fenix"
                value={representanteData.nombre}
                onChange={(e) => setRepresentanteData({ ...representanteData, nombre: e.target.value })}
                placeholder="Nombre y Apellido"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-texto-secundario mb-1">Documento de Identidad (DNI/Cédula)*</label>
              <input
                type="text"
                className="input-fenix"
                value={representanteData.documento_identidad}
                onChange={(e) => setRepresentanteData({ ...representanteData, documento_identidad: e.target.value })}
                placeholder="Ej: V-18450921"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-texto-secundario mb-1">Parentesco</label>
              <select
                className="input-fenix"
                value={representanteData.parentesco}
                onChange={(e) => setRepresentanteData({ ...representanteData, parentesco: e.target.value })}
              >
                <option value="Padre">Padre</option>
                <option value="Madre">Madre</option>
                <option value="Tutor Legal">Tutor Legal</option>
                <option value="Abuelo/a">Abuelo/a</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-texto-secundario mb-1">Teléfono Principal</label>
              <input
                type="text"
                className="input-fenix"
                value={representanteData.telefono}
                onChange={(e) => setRepresentanteData({ ...representanteData, telefono: e.target.value })}
                placeholder="+58 412..."
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-texto-secundario mb-1">Teléfono de Emergencia*</label>
              <input
                type="text"
                className="input-fenix"
                value={representanteData.telefono_emergencia}
                onChange={(e) => setRepresentanteData({ ...representanteData, telefono_emergencia: e.target.value })}
                placeholder="+58 414..."
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-texto-secundario mb-1">Dirección de Habitación</label>
              <input
                type="text"
                className="input-fenix"
                value={representanteData.direccion}
                onChange={(e) => setRepresentanteData({ ...representanteData, direccion: e.target.value })}
                placeholder="Urbanización / Calle / Residencia"
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row items-center gap-4 bg-[#161616] p-4 rounded-lg border border-neutral-800">
              <img
                src={jugadorData.foto_url}
                alt="Foto carnet"
                className="w-20 h-20 rounded-xl object-cover border-2 border-vinotinto"
              />
              <div className="flex-1 text-center sm:text-left">
                <p className="text-sm font-bold text-white">Fotografía Tipo Carnet</p>
                <p className="text-xs text-texto-secundario mb-2">Formato JPG/PNG para acreditación oficial en liga.</p>
                <label className="btn-vinotinto text-xs cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  {uploadingPhoto ? 'Subiendo...' : 'Cargar Fotografía'}
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-texto-secundario mb-1">Nombres del Alumno*</label>
                <input
                  type="text"
                  className="input-fenix"
                  value={jugadorData.nombre}
                  onChange={(e) => setJugadorData({ ...jugadorData, nombre: e.target.value })}
                  placeholder="Ej: Mateo Alejandro"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-texto-secundario mb-1">Apellidos del Alumno*</label>
                <input
                  type="text"
                  className="input-fenix"
                  value={jugadorData.apellido}
                  onChange={(e) => setJugadorData({ ...jugadorData, apellido: e.target.value })}
                  placeholder="Ej: Mendoza Ruiz"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-texto-secundario mb-1">DNI / Cédula / Partida*</label>
                <input
                  type="text"
                  className="input-fenix"
                  value={jugadorData.dni_cedula}
                  onChange={(e) => setJugadorData({ ...jugadorData, dni_cedula: e.target.value })}
                  placeholder="Ej: V-34900112"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-texto-secundario mb-1">Fecha de Nacimiento*</label>
                <input
                  type="date"
                  className="input-fenix"
                  value={jugadorData.fecha_nacimiento}
                  onChange={(e) => setJugadorData({ ...jugadorData, fecha_nacimiento: e.target.value })}
                />
                {computedAge !== null && (
                  <p className="text-[11px] text-green-400 font-semibold mt-1">
                    Edad calculada: {computedAge} años • Sugerida: {recommendedCategoryName}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-texto-secundario mb-1">Disciplina / Equipo*</label>
                <select
                  className="input-fenix"
                  value={selectedModalidad}
                  onChange={(e) => {
                    setSelectedModalidad(e.target.value);
                    setDorsalStatus(null);
                  }}
                >
                  {DISCIPLINES.map((disc) => (
                    <option key={disc.key} value={disc.key}>
                      {disc.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-texto-secundario mb-1">
                  Categoría ({DISCIPLINES.find((d) => d.key === selectedModalidad)?.short})*
                </label>
                <select
                  className="input-fenix"
                  value={jugadorData.id_categoria}
                  onChange={(e) => {
                    setJugadorData({ ...jugadorData, id_categoria: e.target.value });
                    setDorsalStatus(null);
                  }}
                >
                  <option value="">Seleccione categoría</option>
                  {disciplineCategories.map((cat) => (
                    <option key={cat.id_categoria} value={cat.id_categoria}>
                      {cat.nombre} ({cat.edad_min}–{cat.edad_max >= 90 ? '21+' : cat.edad_max} años)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-texto-secundario mb-1">Género</label>
                <select
                  className="input-fenix"
                  value={jugadorData.genero}
                  onChange={(e) => setJugadorData({ ...jugadorData, genero: e.target.value })}
                >
                  <option value="Masculino">Masculino</option>
                  <option value="Femenino">Femenino</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-texto-secundario mb-1">Posición Habitual</label>
                <select
                  className="input-fenix"
                  value={jugadorData.posicion_habitual}
                  onChange={(e) => setJugadorData({ ...jugadorData, posicion_habitual: e.target.value })}
                >
                  <option value="Arquero">Arquero</option>
                  <option value="Defensa Central">Defensa Central</option>
                  <option value="Lateral">Lateral</option>
                  <option value="Mediocentro Mixto">Mediocentro Mixto</option>
                  <option value="Extremo">Extremo</option>
                  <option value="Delantero / Pívot">Delantero / Pívot</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-texto-secundario mb-1">Pierna Hábil</label>
                <select
                  className="input-fenix"
                  value={jugadorData.pierna_habil}
                  onChange={(e) => setJugadorData({ ...jugadorData, pierna_habil: e.target.value })}
                >
                  <option value="Derecha">Derecha</option>
                  <option value="Izquierda">Izquierda</option>
                  <option value="Ambidiestro">Ambidiestro</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-texto-secundario mb-1">Grupo Sanguíneo*</label>
              <select
                className="input-fenix"
                value={fichaMedicaData.grupo_sanguineo}
                onChange={(e) => setFichaMedicaData({ ...fichaMedicaData, grupo_sanguineo: e.target.value })}
              >
                {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-texto-secundario mb-1">Evaluación Podológica (Pisada)</label>
              <select
                className="input-fenix"
                value={fichaMedicaData.evaluacion_podologica}
                onChange={(e) => setFichaMedicaData({ ...fichaMedicaData, evaluacion_podologica: e.target.value })}
              >
                <option value="Pisada Neutra">Pisada Neutra - Arco Normal</option>
                <option value="Pronador Leve">Pronador Leve</option>
                <option value="Supinador">Supinador</option>
                <option value="Pie Plano - Requiere Plantilla">Pie Plano - Requiere Plantilla</option>
                <option value="Pie Cavo">Pie Cavo</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-texto-secundario mb-1">Peso (kg)</label>
              <input
                type="number"
                step="0.1"
                className="input-fenix"
                value={fichaMedicaData.peso_kg}
                onChange={(e) => setFichaMedicaData({ ...fichaMedicaData, peso_kg: e.target.value })}
                placeholder="Ej: 45.5"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-texto-secundario mb-1">Estatura (m)</label>
              <input
                type="number"
                step="0.01"
                className="input-fenix"
                value={fichaMedicaData.altura_m}
                onChange={(e) => setFichaMedicaData({ ...fichaMedicaData, altura_m: e.target.value })}
                placeholder="Ej: 1.54"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-texto-secundario mb-1">Alergias Conocidas</label>
              <input
                type="text"
                className="input-fenix"
                value={fichaMedicaData.alergias}
                onChange={(e) => setFichaMedicaData({ ...fichaMedicaData, alergias: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-texto-secundario mb-1">Condiciones Cardíacas / Respiratorias</label>
              <input
                type="text"
                className="input-fenix"
                value={fichaMedicaData.condiciones_cardiacas}
                onChange={(e) => setFichaMedicaData({ ...fichaMedicaData, condiciones_cardiacas: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-texto-secundario mb-1">Contacto Médico de Emergencia*</label>
              <input
                type="text"
                className="input-fenix"
                value={fichaMedicaData.contacto_emergencia_nombre}
                onChange={(e) => setFichaMedicaData({ ...fichaMedicaData, contacto_emergencia_nombre: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-texto-secundario mb-1">Teléfono Contacto Emergencia*</label>
              <input
                type="text"
                className="input-fenix"
                value={fichaMedicaData.contacto_emergencia_telefono}
                onChange={(e) => setFichaMedicaData({ ...fichaMedicaData, contacto_emergencia_telefono: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-texto-secundario mb-1">Póliza Seguro Médico</label>
              <input
                type="text"
                className="input-fenix"
                value={fichaMedicaData.seguro_medico_poliza}
                onChange={(e) => setFichaMedicaData({ ...fichaMedicaData, seguro_medico_poliza: e.target.value })}
                placeholder="Número de póliza o aseguradora"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-texto-secundario mb-1">Fecha Última Revisión Médica</label>
              <input
                type="date"
                className="input-fenix"
                value={fichaMedicaData.fecha_ultima_revision}
                onChange={(e) => setFichaMedicaData({ ...fichaMedicaData, fecha_ultima_revision: e.target.value })}
              />
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-texto-secundario mb-1">Temporada</label>
                <input
                  type="text"
                  className="input-fenix"
                  value={uniformeData.temporada}
                  onChange={(e) => setUniformeData({ ...uniformeData, temporada: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-texto-secundario mb-1">Talla de Camiseta*</label>
                <select
                  className="input-fenix"
                  value={uniformeData.talla_camiseta}
                  onChange={(e) => setUniformeData({ ...uniformeData, talla_camiseta: e.target.value })}
                >
                  {['6', '8', '10', '12', '14', '16', 'S', 'M', 'L', 'XL'].map((t) => (
                    <option key={t} value={t}>Talla {t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-texto-secundario mb-1">Talla de Short*</label>
                <select
                  className="input-fenix"
                  value={uniformeData.talla_short}
                  onChange={(e) => setUniformeData({ ...uniformeData, talla_short: e.target.value })}
                >
                  {['6', '8', '10', '12', '14', '16', 'S', 'M', 'L', 'XL'].map((t) => (
                    <option key={t} value={t}>Talla {t}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="bg-[#161616] border border-neutral-800 rounded-lg p-4">
              <label className="block text-xs font-semibold text-texto-secundario mb-2">
                Dorsal Deseado (Verificación en Categoría)
              </label>
              <div className="flex flex-wrap items-center gap-3">
                <input
                  type="number"
                  min="1"
                  max="99"
                  className="input-fenix w-32"
                  value={jugadorData.dorsal}
                  onChange={(e) => handleCheckDorsal(e.target.value)}
                  placeholder="Ej: 10"
                />
                {dorsalStatus && (
                  <span
                    className={`text-xs font-bold px-3 py-1.5 rounded-lg ${
                      dorsalStatus.available
                        ? 'bg-green-950/70 text-green-300 border border-green-700/60'
                        : 'bg-rojo-fuego/20 text-red-300 border border-rojo-fuego'
                    }`}
                  >
                    {dorsalStatus.available
                      ? `✅ Dorsal #${jugadorData.dorsal} disponible`
                      : `⚠️ Dorsal ocupado por ${dorsalStatus.takenBy?.nombre} ${dorsalStatus.takenBy?.apellido}`}
                  </span>
                )}
              </div>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-vinotinto/20 border border-vinotinto">
                  <p className="font-bold text-white">Kit Titular Oficial</p>
                  <p className="text-texto-secundario">Camiseta Vinotinto, Shorts Negros, Medias Vinotinto</p>
                </div>
                <div className="p-3 rounded-lg bg-neutral-900 border border-neutral-700">
                  <p className="font-bold text-white">Kit Alternativo</p>
                  <p className="text-texto-secundario">Camiseta Rojo y Blanco</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4">
            <div className="bg-[#161616] border border-neutral-800 rounded-lg p-4 space-y-3 text-sm">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-1 accent-rojo-fuego w-4 h-4"
                  checked={consentimientoData.uso_imagen}
                  onChange={(e) =>
                    setConsentimientoData({ ...consentimientoData, uso_imagen: e.target.checked })
                  }
                />
                <span className="text-neutral-200">
                  <strong className="text-white">Autorización de Uso de Imagen Institucional:</strong> Autorizo al Club y Academia Legión Fénix a capturar y difundir fotografías y material audiovisual deportivo del atleta en canales oficiales y análisis técnico interno.
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer pt-2 border-t border-neutral-800">
                <input
                  type="checkbox"
                  className="mt-1 accent-rojo-fuego w-4 h-4"
                  checked={consentimientoData.exoneracion_medica}
                  onChange={(e) =>
                    setConsentimientoData({ ...consentimientoData, exoneracion_medica: e.target.checked })
                  }
                />
                <span className="text-neutral-200">
                  <strong className="text-white">Declaración Jurada y Exoneración Médica:</strong> Declaro bajo fe de juramento que la información médica y podológica suministrada es verídica, que el menor se encuentra apto para la práctica deportiva competitiva y autorizo atención de primeros auxilios en caso de emergencia.
                </span>
              </label>
            </div>

            <div>
              <label className="block text-xs font-semibold text-texto-secundario mb-1">
                Firma Digital del Representante (Escriba Nombre y Apellido completo)*
              </label>
              <input
                type="text"
                className="input-fenix"
                value={consentimientoData.firma_representante}
                onChange={(e) =>
                  setConsentimientoData({ ...consentimientoData, firma_representante: e.target.value })
                }
                placeholder="Nombre completo como firma electrónica"
              />
            </div>

            <div className="bg-vinotinto/20 border border-vinotinto/60 rounded-lg p-3 text-xs text-neutral-200">
              Al finalizar se creará el expediente completo del atleta <strong className="text-white">{jugadorData.nombre} {jugadorData.apellido}</strong> y se habilitará su estado de cuenta e indumentaria.
            </div>
          </div>
        )}

        <div className="mt-8 pt-4 border-t border-neutral-800 flex items-center justify-between gap-3">
          <button
            type="button"
            disabled={step === 1}
            onClick={() => setStep((s) => Math.max(s - 1, 1))}
            className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white text-sm font-semibold inline-flex items-center gap-1 disabled:opacity-40"
          >
            <ChevronLeft className="w-4 h-4" /> Anterior
          </button>

          {step < 5 ? (
            <button type="button" onClick={handleNext} className="btn-cta text-sm">
              Siguiente Etapa <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button type="submit" disabled={submitting} className="btn-cta text-sm">
              <CheckCircle2 className="w-4 h-4" />
              {submitting ? 'Registrando...' : 'Finalizar Inscripción Oficial'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
