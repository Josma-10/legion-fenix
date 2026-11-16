const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../../config/db');
const authModel = require('./auth.model');
const { JWT_SECRET } = require('../../middlewares/auth');
const { getUploadedFileUrl } = require('../../config/cloudinary');

function computeAgeFromBirthDate(birthDateStr) {
  if (!birthDateStr || typeof birthDateStr !== 'string') return null;
  const parts = birthDateStr.split('T')[0].split('-');
  if (parts.length !== 3) return null;
  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);
  if (!year || !month || !day) return null;
  const today = new Date();
  let age = today.getFullYear() - year;
  const mDiff = today.getMonth() + 1 - month;
  if (mDiff < 0 || (mDiff === 0 && today.getDate() < day)) {
    age--;
  }
  return age;
}

function normalizeModalidad(input) {
  const val = String(input || '').trim().toLowerCase();
  if (val === 'campo' || val.includes('campo')) return 'Campo';
  if (val === 'f7' || val.includes('7')) return 'F7';
  if (val === 'sala' || val.includes('sala') || val.includes('futsal')) return 'Sala';
  return null;
}

function validatePasswordPolicy(password) {
  if (typeof password !== 'string') {
    return { valid: false, error: 'Contraseña requerida.' };
  }
  const hasLength = password.length >= 8 && password.length <= 20;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[^A-Za-z0-9\s]/.test(password);

  if (!hasLength || !hasUpper || !hasLower || !hasNumber || !hasSymbol) {
    return {
      valid: false,
      error:
        'La contraseña debe estar en Semáforo Verde: entre 8 y 20 caracteres, incluyendo al menos una mayúscula, una minúscula, un número y un signo especial.',
    };
  }
  return { valid: true };
}

exports.validatePasswordPolicy = validatePasswordPolicy;

exports.login = async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Usuario/email y contraseña requeridos.' });
  }

  if (/\s/.test(username) || /\s/.test(password)) {
    return res.status(400).json({ error: 'No se permiten espacios en blanco en el usuario ni en la contraseña.' });
  }

  try {
    const user = await authModel.findByUsernameOrEmail(username.trim());
    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    const token = jwt.sign(
      {
        id: user.id_usuario,
        rol: user.rol,
        nombre: user.nombre,
        email: user.email,
        id_representante: user.id_representante || null,
      },
      JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    return res.json({
      message: 'Autenticación exitosa',
      token,
      user: {
        id: user.id_usuario,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
        telefono: user.telefono,
        id_representante: user.id_representante || null,
        documento_identidad: user.documento_identidad || null,
        parentesco: user.parentesco || null,
        direccion: user.direccion || null,
        telefono_emergencia: user.telefono_emergencia || null,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.register = async (req, res) => {
  const {
    nombre,
    email,
    password,
    telefono,
    documento_identidad,
    parentesco,
    direccion,
    telefono_emergencia,
  } = req.body;

  if (!nombre || !email || !password || !documento_identidad) {
    return res.status(400).json({
      error: 'Nombre, email, contraseña y documento de identidad son obligatorios.',
    });
  }

  const pwdCheck = validatePasswordPolicy(password);
  if (!pwdCheck.valid) {
    return res.status(400).json({ error: pwdCheck.error });
  }

  try {
    const existing = await authModel.findByUsernameOrEmail(email.trim());
    if (existing) {
      return res.status(409).json({ error: 'Ya existe una cuenta registrada con ese correo.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const created = await authModel.createRepresentativeUser({
      nombre: nombre.trim(),
      email: email.trim().toLowerCase(),
      passwordHash,
      telefono,
      documento_identidad: documento_identidad.trim(),
      parentesco,
      direccion,
      telefono_emergencia,
    });

    const token = jwt.sign(
      {
        id: created.id_usuario,
        rol: created.rol,
        nombre: created.nombre,
        email: created.email,
        id_representante: created.id_representante,
      },
      JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    return res.status(201).json({
      message: 'Representante registrado exitosamente.',
      token,
      user: created,
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({
        error: 'El correo electrónico o documento de identidad ya está registrado.',
      });
    }
    return res.status(500).json({ error: error.message });
  }
};

exports.registerAthlete = async (req, res) => {
  const {
    nombre_completo,
    dni_cedula,
    fecha_nacimiento,
    genero,
    estatura,
    peso,
    pierna_habil,
    disciplina,
    modalidad,
    categoria_preferida,
    posicion_juego,
    telefono,
    email,
    password,
    metodo_pago,
    referencia_bancaria,
    telefono_pago,
  } = req.body;

  if (
    !nombre_completo ||
    !fecha_nacimiento ||
    !estatura ||
    !peso ||
    !pierna_habil ||
    !(disciplina || modalidad) ||
    !posicion_juego ||
    !telefono ||
    !email ||
    !password ||
    !referencia_bancaria ||
    !telefono_pago
  ) {
    return res.status(400).json({
      error:
        'Todos los campos personales, deportivos, de contacto y comprobante (referencia y teléfono de pago) son obligatorios.',
    });
  }

  const pwdCheck = validatePasswordPolicy(password);
  if (!pwdCheck.valid) {
    return res.status(400).json({ error: pwdCheck.error });
  }

  const age = computeAgeFromBirthDate(fecha_nacimiento);
  if (age === null || age < 0 || age > 95) {
    return res.status(400).json({ error: 'Fecha de nacimiento inválida.' });
  }
  if (age < 18) {
    return res.status(400).json({
      error: `Edad detectada (${age} años). Los menores de edad deben ser inscritos por su representante legal desde el flujo de Representantes.`,
    });
  }

  const targetModalidad = normalizeModalidad(disciplina || modalidad);
  if (!targetModalidad) {
    return res.status(400).json({
      error: 'Disciplina inválida. Selecciona Fútbol Campo, Fútbol 7 o Fútbol Sala.',
    });
  }

  let targetCategoryName = age >= 21 ? 'Libre' : 'Sub-20';
  if (age >= 18 && age <= 20 && categoria_preferida === 'Libre') {
    targetCategoryName = 'Libre';
  }

  let estaturaNum = Number(estatura);
  if (estaturaNum > 3) estaturaNum = Number((estaturaNum / 100).toFixed(2));
  const pesoNum = Number(peso);
  if (!Number.isFinite(estaturaNum) || estaturaNum < 1.0 || estaturaNum > 2.4) {
    return res.status(400).json({ error: 'Estatura inválida (use metros ej. 1.78).' });
  }
  if (!Number.isFinite(pesoNum) || pesoNum < 30 || pesoNum > 220) {
    return res.status(400).json({ error: 'Peso inválido (entre 30 y 220 kg).' });
  }

  if (String(referencia_bancaria).trim().length < 4) {
    return res.status(400).json({ error: 'La referencia bancaria debe tener al menos 4 caracteres.' });
  }
  if (String(telefono_pago).replace(/\D/g, '').length < 10) {
    return res.status(400).json({ error: 'Ingresa un número de teléfono válido desde donde realizaste el pago.' });
  }

  const fotoFile = req.files?.foto_perfil?.[0];
  const comprobanteFile = req.files?.comprobante_pago?.[0];
  const fotoUrl = fotoFile ? getUploadedFileUrl(req, fotoFile) : req.body.foto_url || null;
  const comprobanteUrl = comprobanteFile ? getUploadedFileUrl(req, comprobanteFile) : req.body.comprobante_url || null;

  if (!fotoUrl) {
    return res.status(400).json({ error: 'Debe adjuntar su fotografía de perfil.' });
  }
  if (!comprobanteUrl) {
    return res.status(400).json({ error: 'Debe adjuntar el capture o comprobante del pago de inscripción.' });
  }

  try {
    const existing = await authModel.findByUsernameOrEmail(email.trim());
    if (existing) {
      return res.status(409).json({ error: 'Ya existe una cuenta registrada con ese correo electrónico.' });
    }

    const catRes = await pool.query(
      `SELECT id_categoria, nombre, disciplina, modalidad
       FROM categorias
       WHERE modalidad = $1 AND nombre = $2
       LIMIT 1`,
      [targetModalidad, targetCategoryName]
    );
    if (catRes.rows.length === 0) {
      return res.status(404).json({ error: 'Categoría de disciplina no encontrada en el sistema.' });
    }
    const category = catRes.rows[0];

    const cleanFullName = nombre_completo.trim().replace(/\s+/g, ' ');
    const nameParts = cleanFullName.split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || cleanFullName;
    const generatedDni = dni_cedula && dni_cedula.trim() ? dni_cedula.trim() : `V-ADU-${Date.now().toString().slice(-8)}`;
    const passwordHash = await bcrypt.hash(password, 10);

    const bcvService = require('../../services/bcvService');
    const bcv = await bcvService.getBcvRate();
    const converted = bcvService.convertUsdToBs(35, bcv);

    const created = await authModel.createAdultAthleteUser({
      nombre: firstName,
      apellido: lastName,
      nombreCompleto: cleanFullName,
      email: email.trim().toLowerCase(),
      passwordHash,
      telefono: telefono.trim(),
      dni_cedula: generatedDni,
      fecha_nacimiento,
      genero: genero === 'Femenino' ? 'Femenino' : 'Masculino',
      estatura_m: estaturaNum,
      peso_kg: pesoNum,
      foto_url: fotoUrl,
      posicion_habitual: posicion_juego,
      pierna_habil,
      id_categoria: category.id_categoria,
      categoriaNombre: category.nombre,
      disciplinaNombre: category.disciplina,
      metodo_pago: metodo_pago || 'Pago Móvil',
      referencia_bancaria: referencia_bancaria.trim(),
      telefono_pago: telefono_pago.trim(),
      comprobante_url: comprobanteUrl,
      tasa_bcv: converted.tasa_bcv,
      monto_bs: converted.monto_bs,
    });

    const token = jwt.sign(
      {
        id: created.user.id_usuario,
        rol: created.user.rol,
        nombre: created.user.nombre,
        email: created.user.email,
        id_representante: created.user.id_representante,
      },
      JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    return res.status(201).json({
      message: `Atleta mayor de edad (${age} años) registrado en ${category.disciplina} - ${category.nombre}. Comprobante enviado a revisión.`,
      token,
      user: created.user,
      player: created.player,
      categoriaAsignada: category,
      edad: age,
      transaction: created.transaction,
      bcv,
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({
        error: 'El correo electrónico o documento de identidad ya se encuentra registrado.',
      });
    }
    return res.status(500).json({ error: error.message });
  }
};

exports.me = async (req, res) => {
  try {
    const user = await authModel.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }
    return res.json({
      user: {
        id: user.id_usuario,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
        telefono: user.telefono,
        id_representante: user.id_representante || null,
        documento_identidad: user.documento_identidad || null,
        parentesco: user.parentesco || null,
        direccion: user.direccion || null,
        telefono_emergencia: user.telefono_emergencia || null,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.registerMinorAthlete = async (req, res) => {
  const {
    rep_nombre,
    rep_dni,
    rep_parentesco,
    rep_telefono,
    rep_direccion,
    email,
    password,
    atleta_nombre_completo,
    atleta_dni,
    atleta_fecha_nacimiento,
    atleta_genero,
    estatura,
    peso,
    pierna_habil,
    posicion_juego,
    disciplina,
    modalidad,
    talla_camiseta,
    talla_short,
    metodo_pago,
    referencia_bancaria,
    telefono_pago,
  } = req.body;

  if (
    !rep_nombre ||
    !rep_dni ||
    !rep_telefono ||
    !email ||
    !password ||
    !atleta_nombre_completo ||
    !atleta_fecha_nacimiento ||
    !(disciplina || modalidad) ||
    !referencia_bancaria ||
    !telefono_pago
  ) {
    return res.status(400).json({
      error:
        'Todos los campos del representante, del atleta menor (nombre, fecha de nacimiento, disciplina) y datos del pago son obligatorios.',
    });
  }

  const pwdCheck = validatePasswordPolicy(password);
  if (!pwdCheck.valid) {
    return res.status(400).json({ error: pwdCheck.error });
  }

  const age = computeAgeFromBirthDate(atleta_fecha_nacimiento);
  if (age === null || age < 0 || age >= 18) {
    return res.status(400).json({
      error:
        age !== null && age >= 18
          ? `El atleta tiene ${age} años (mayor de edad). Debe registrarse directamente en la pestaña "Mayor de Edad".`
          : 'Fecha de nacimiento inválida para menor de edad.',
    });
  }

  const targetModalidad = normalizeModalidad(disciplina || modalidad);
  if (!targetModalidad) {
    return res.status(400).json({
      error: 'Disciplina inválida. Selecciona Fútbol Campo, Fútbol 7 o Fútbol Sala.',
    });
  }

  let targetCategoryName = 'Bebés (Sub-6)';
  if (age <= 6) targetCategoryName = 'Bebés (Sub-6)';
  else if (age <= 8) targetCategoryName = 'Sub-8';
  else if (age <= 10) targetCategoryName = 'Sub-10';
  else if (age <= 12) targetCategoryName = 'Sub-12';
  else if (age <= 14) targetCategoryName = 'Sub-14';
  else if (age <= 16) targetCategoryName = 'Sub-16';
  else targetCategoryName = 'Sub-18';

  let estaturaNum = Number(estatura);
  if (estaturaNum > 3) estaturaNum = Number((estaturaNum / 100).toFixed(2));
  const pesoNum = Number(peso);

  const fotoFile = req.files?.foto_perfil?.[0];
  const comprobanteFile = req.files?.comprobante_pago?.[0];
  const fotoUrl = fotoFile ? getUploadedFileUrl(req, fotoFile) : req.body.foto_url || null;
  const comprobanteUrl = comprobanteFile ? getUploadedFileUrl(req, comprobanteFile) : req.body.comprobante_url || null;

  if (!fotoUrl) {
    return res.status(400).json({ error: 'Debe adjuntar la fotografía de perfil del atleta menor.' });
  }
  if (!comprobanteUrl) {
    return res.status(400).json({ error: 'Debe adjuntar el capture o comprobante del pago de inscripción.' });
  }

  try {
    const existing = await authModel.findByUsernameOrEmail(email.trim());
    if (existing) {
      return res.status(409).json({ error: 'Ya existe una cuenta registrada con ese correo electrónico.' });
    }

    const catRes = await pool.query(
      `SELECT id_categoria, nombre, disciplina, modalidad
       FROM categorias
       WHERE modalidad = $1 AND nombre = $2
       LIMIT 1`,
      [targetModalidad, targetCategoryName]
    );
    if (catRes.rows.length === 0) {
      return res.status(404).json({ error: `Categoría ${targetCategoryName} no encontrada para ${targetModalidad}.` });
    }
    const category = catRes.rows[0];

    const cleanFullName = atleta_nombre_completo.trim().replace(/\s+/g, ' ');
    const nameParts = cleanFullName.split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || cleanFullName;
    const generatedDni = atleta_dni && atleta_dni.trim() ? atleta_dni.trim() : `MEN-${Date.now().toString().slice(-8)}`;
    const passwordHash = await bcrypt.hash(password, 10);

    const bcvService = require('../../services/bcvService');
    const bcv = await bcvService.getBcvRate();
    const converted = bcvService.convertEurToBs(15, bcv);

    const created = await authModel.createMinorWithRepresentativeUser({
      repNombre: rep_nombre.trim(),
      repEmail: email.trim().toLowerCase(),
      passwordHash,
      repTelefono: rep_telefono.trim(),
      repDni: rep_dni.trim(),
      repParentesco: rep_parentesco || 'Padre',
      repDireccion: rep_direccion || '',
      atletaNombre: firstName,
      atletaApellido: lastName,
      atletaDni: generatedDni,
      atletaFechaNacimiento,
      atletaGenero: atleta_genero || 'Masculino',
      estatura_m: Number.isFinite(estaturaNum) && estaturaNum > 0 ? estaturaNum : 1.40,
      peso_kg: Number.isFinite(pesoNum) && pesoNum > 0 ? pesoNum : 38,
      talla_camiseta: talla_camiseta || '10',
      talla_short: talla_short || '10',
      foto_url: fotoUrl,
      posicion_habitual: posicion_juego || 'Delantero Centro',
      pierna_habil: pierna_habil || 'Derecho',
      id_categoria: category.id_categoria,
      categoriaNombre: category.nombre,
      disciplinaNombre: category.disciplina,
      metodo_pago: metodo_pago || 'Pago Móvil',
      referencia_bancaria: String(referencia_bancaria).trim(),
      telefono_pago: String(telefono_pago).trim(),
      comprobante_url: comprobanteUrl,
      tasa_bcv: bcv.tasa_bcv,
      monto_bs: converted.monto_bs,
    });

    const token = jwt.sign(
      {
        id: created.user.id_usuario,
        rol: created.user.rol,
        nombre: created.user.nombre,
        email: created.user.email,
        id_representante: created.user.id_representante,
      },
      JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    return res.status(201).json({
      message: `Registro completado exitosamente. Atleta ${created.player.nombre} asignado a ${category.nombre} (${category.disciplina}).`,
      token,
      user: created.user,
      player: created.player,
      transaction: created.transaction,
      tasa_bcv: bcv.tasa_bcv,
      monto_bs: converted.monto_bs,
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'El correo electrónico o la cédula ya se encuentran registrados.' });
    }
    return res.status(500).json({ error: error.message });
  }
};

