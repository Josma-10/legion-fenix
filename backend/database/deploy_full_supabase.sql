-- ==========================================================
-- LEGIÓN FÉNIX FC - DESPLIEGUE COMPLETO (SCHEMA + SEED)
-- ==========================================================

-- ==============================================================================
-- ESQUEMA RELACIONAL POSTGRESQL - PLATAFORMA LEGIÓN FÉNIX
-- ==============================================================================

-- 1. TABLA DE ROLES Y USUARIOS
CREATE TABLE IF NOT EXISTS roles (
    id_rol SERIAL PRIMARY KEY,
    nombre VARCHAR(30) UNIQUE NOT NULL
);

INSERT INTO roles (nombre)
VALUES ('ADMINISTRADOR'), ('ENTRENADOR'), ('REPRESENTANTE'), ('ATLETA'), ('FISIO'), ('ANALISTA_ADMIN')
ON CONFLICT (nombre) DO NOTHING;

CREATE TABLE IF NOT EXISTS usuarios (
    id_usuario SERIAL PRIMARY KEY,
    id_rol INT NOT NULL REFERENCES roles(id_rol),
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    telefono VARCHAR(30),
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. TABLA DE REPRESENTANTES / TITULARES
CREATE TABLE IF NOT EXISTS representantes (
    id_representante SERIAL PRIMARY KEY,
    id_usuario INT UNIQUE NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    documento_identidad VARCHAR(30) UNIQUE NOT NULL,
    parentesco VARCHAR(40),
    direccion TEXT,
    telefono_emergencia VARCHAR(30)
);

-- 3. CATEGORÍAS (EQUIPO DE CAMPO, EQUIPO DE FÚTBOL 7 Y EQUIPO DE SALA)
CREATE TABLE IF NOT EXISTS categorias (
    id_categoria SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL, -- Bebés (Sub-6), Sub-8 ... Libre
    disciplina VARCHAR(50) NOT NULL DEFAULT 'Equipo de Fútbol Campo',
    modalidad VARCHAR(20) CHECK (modalidad IN ('Campo', 'F7', 'Sala')),
    edad_min INT NOT NULL DEFAULT 4,
    edad_max INT NOT NULL DEFAULT 99,
    cuadrante_asignado VARCHAR(80) DEFAULT 'Cuadrante Norte - Campo'
);

-- 4. JUGADORES
CREATE TABLE IF NOT EXISTS jugadores (
    id_jugador SERIAL PRIMARY KEY,
    id_representante INT NOT NULL REFERENCES representantes(id_representante) ON DELETE CASCADE,
    id_categoria INT REFERENCES categorias(id_categoria),
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    fecha_nacimiento DATE NOT NULL,
    dni_cedula VARCHAR(30) UNIQUE NOT NULL,
    genero VARCHAR(10) CHECK (genero IN ('Masculino', 'Femenino')),
    foto_url TEXT,
    posicion_habitual VARCHAR(50),
    pierna_habil VARCHAR(15) CHECK (pierna_habil IN ('Derecha', 'Izquierda', 'Ambidiestro')),
    dorsal INT,
    estado_cuenta VARCHAR(15) DEFAULT 'Solvente' CHECK (estado_cuenta IN ('Solvente', 'Pendiente', 'Moroso')),
    activo BOOLEAN DEFAULT TRUE,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. FICHAS MÉDICAS Y DE SALUD
CREATE TABLE IF NOT EXISTS fichas_medicas (
    id_ficha SERIAL PRIMARY KEY,
    id_jugador INT UNIQUE REFERENCES jugadores(id_jugador) ON DELETE CASCADE,
    grupo_sanguineo VARCHAR(5) NOT NULL,
    alergias TEXT,
    condiciones_cardiacas TEXT,
    evaluacion_podologica VARCHAR(100),
    observaciones_fisio TEXT,
    peso_kg DECIMAL(5,2),
    altura_m DECIMAL(4,2),
    contacto_emergencia_nombre VARCHAR(100) NOT NULL,
    contacto_emergencia_telefono VARCHAR(30) NOT NULL,
    seguro_medico_poliza VARCHAR(100),
    fecha_ultima_revision DATE
);

-- 6. CONSENTIMIENTOS LEGALES (ETAPA 5 REGISTRO)
CREATE TABLE IF NOT EXISTS consentimientos_legales (
    id_consentimiento SERIAL PRIMARY KEY,
    id_jugador INT UNIQUE NOT NULL REFERENCES jugadores(id_jugador) ON DELETE CASCADE,
    id_representante INT NOT NULL REFERENCES representantes(id_representante) ON DELETE CASCADE,
    uso_imagen BOOLEAN NOT NULL DEFAULT FALSE,
    exoneracion_medica BOOLEAN NOT NULL DEFAULT FALSE,
    firma_representante VARCHAR(120) NOT NULL,
    fecha_firma TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. TRANSACCIONES Y COBRANZAS
CREATE TABLE IF NOT EXISTS transacciones_jugador (
    id_transaccion SERIAL PRIMARY KEY,
    id_jugador INT REFERENCES jugadores(id_jugador) ON DELETE CASCADE,
    id_representante INT NOT NULL REFERENCES representantes(id_representante),
    concepto VARCHAR(50) CHECK (concepto IN ('Mensualidad', 'Inscripcion', 'Arbitraje', 'Torneo', 'Multa_Amarilla', 'Multa_Roja')),
    descripcion_detalle VARCHAR(150),
    monto NUMERIC(10,2) NOT NULL,
    fecha_emision DATE NOT NULL,
    fecha_vencimiento DATE NOT NULL,
    estado_pago VARCHAR(20) DEFAULT 'Pendiente' CHECK (estado_pago IN ('Pagado', 'Pendiente', 'Vencido')),
    metodo_pago VARCHAR(30),
    referencia_pago VARCHAR(80),
    telefono_pago VARCHAR(30),
    comprobante_url TEXT,
    comprobante_estado VARCHAR(20) DEFAULT 'Sin_Comprobante' CHECK (comprobante_estado IN ('Sin_Comprobante', 'En_Revision', 'Aprobado', 'Rechazado')),
    tasa_bcv NUMERIC(12,4),
    monto_bs NUMERIC(14,2),
    fecha_pago TIMESTAMP
);

-- 8. UNIFORMES Y LOGÍSTICA
CREATE TABLE IF NOT EXISTS uniformes_asignados (
    id_asignacion SERIAL PRIMARY KEY,
    id_jugador INT REFERENCES jugadores(id_jugador) ON DELETE CASCADE,
    temporada VARCHAR(20) NOT NULL,
    talla_camiseta VARCHAR(10),
    talla_short VARCHAR(10),
    kit_titular_color VARCHAR(80) DEFAULT 'Camiseta Vinotinto, Shorts Negros, Medias Vinotinto',
    kit_alternativo_color VARCHAR(80) DEFAULT 'Rojo y Blanco',
    entregado BOOLEAN DEFAULT FALSE
);

-- 9. FIXTURE DE PARTIDOS Y GPS
CREATE TABLE IF NOT EXISTS partidos_fixture (
    id_partido SERIAL PRIMARY KEY,
    id_categoria INT REFERENCES categorias(id_categoria),
    rival VARCHAR(100) NOT NULL,
    torneo VARCHAR(100) NOT NULL,
    modalidad VARCHAR(20) CHECK (modalidad IN ('Campo', 'F7', 'Sala')),
    fecha_hora TIMESTAMP NOT NULL,
    sede VARCHAR(150) NOT NULL,
    direccion_sede TEXT,
    latitud DECIMAL(9,6),
    longitud DECIMAL(9,6),
    gps_url TEXT,
    kit_designado VARCHAR(100) DEFAULT 'Titular (Vinotinto / Shorts Negros / Medias Vinotinto)',
    es_local BOOLEAN DEFAULT TRUE,
    goles_fenix INT,
    goles_rival INT,
    estado VARCHAR(20) DEFAULT 'Programado' CHECK (estado IN ('Programado', 'En Juego', 'Finalizado')),
    destacado BOOLEAN DEFAULT FALSE
);

-- 10. CONVOCATORIAS (CONTROL DE BLOQUEO POR MOROSIDAD)
CREATE TABLE IF NOT EXISTS convocatorias (
    id_convocatoria SERIAL PRIMARY KEY,
    id_partido INT NOT NULL REFERENCES partidos_fixture(id_partido) ON DELETE CASCADE,
    id_jugador INT NOT NULL REFERENCES jugadores(id_jugador) ON DELETE CASCADE,
    estado_convocatoria VARCHAR(30) DEFAULT 'Convocado' CHECK (estado_convocatoria IN ('Convocado', 'Bloqueado_Morosidad', 'Confirmado', 'Descartado')),
    observacion TEXT,
    UNIQUE (id_partido, id_jugador)
);

-- 11. RENDIMIENTO DEPORTIVO EN PARTIDOS
CREATE TABLE IF NOT EXISTS estadisticas_partidos (
    id_registro SERIAL PRIMARY KEY,
    id_jugador INT REFERENCES jugadores(id_jugador) ON DELETE CASCADE,
    id_partido INT NOT NULL,
    modalidad VARCHAR(20) CHECK (modalidad IN ('Campo', 'F7', 'Sala')),
    torneo VARCHAR(100) NOT NULL,
    titular BOOLEAN DEFAULT FALSE,
    minutos_jugados INT DEFAULT 0,
    goles INT DEFAULT 0,
    asistencias INT DEFAULT 0,
    tarjetas_amarillas INT DEFAULT 0,
    tarjetas_rojas INT DEFAULT 0,
    fecha_partido DATE NOT NULL
);

-- 12. PLANIFICACIÓN, TABLA DE JUEGO 2D, TRABAJOS 3D Y EVALUACIONES
CREATE TABLE IF NOT EXISTS trabajos_campo (
    id_trabajo SERIAL PRIMARY KEY,
    id_autor INT REFERENCES usuarios(id_usuario) ON DELETE SET NULL,
    rol_autor VARCHAR(30) NOT NULL CHECK (rol_autor IN ('ADMINISTRADOR', 'ENTRENADOR', 'FISIO')),
    id_categoria INT REFERENCES categorias(id_categoria) ON DELETE SET NULL,
    id_jugador INT REFERENCES jugadores(id_jugador) ON DELETE SET NULL,
    titulo VARCHAR(140) NOT NULL,
    bloque VARCHAR(60) DEFAULT 'Táctico / Técnico',
    descripcion_escrita TEXT NOT NULL,
    duracion_minutos INT NOT NULL DEFAULT 25,
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    cuadrante VARCHAR(80) NOT NULL,
    espacio_cancha VARCHAR(60) NOT NULL CHECK (
        espacio_cancha IN ('Cancha Completa', 'Media Cancha Norte', 'Media Cancha Sur', 'Tercio Central', 'Zona Readaptación')
    ),
    animacion_3d_json JSONB,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tacticas_simulador (
    id_tactica SERIAL PRIMARY KEY,
    id_categoria INT REFERENCES categorias(id_categoria) ON DELETE SET NULL,
    id_trabajo INT REFERENCES trabajos_campo(id_trabajo) ON DELETE SET NULL,
    nombre_sistema VARCHAR(60) NOT NULL, -- '1-4-3-3', '1-4-4-2', '3-1 con Pívot'
    modalidad VARCHAR(20) NOT NULL CHECK (modalidad IN ('Campo', 'F7', 'Sala')),
    pros TEXT NOT NULL,
    contras TEXT NOT NULL,
    descripcion TEXT,
    formacion_json JSONB,
    movimientos_json JSONB,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS microciclos_entrenamiento (
    id_microciclo SERIAL PRIMARY KEY,
    id_entrenador INT REFERENCES usuarios(id_usuario),
    id_categoria INT REFERENCES categorias(id_categoria),
    titulo VARCHAR(120) NOT NULL,
    semana_inicio DATE NOT NULL,
    semana_fin DATE NOT NULL,
    objetivo_principal TEXT NOT NULL,
    bloque_arqueros TEXT NOT NULL,
    bloque_defensivo TEXT NOT NULL,
    bloque_ofensivo TEXT NOT NULL,
    carga_estimada VARCHAR(30) DEFAULT 'Media-Alta',
    estado VARCHAR(20) DEFAULT 'Planificado' CHECK (estado IN ('Planificado', 'En Curso', 'Completado')),
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS evaluaciones_jugador (
    id_evaluacion SERIAL PRIMARY KEY,
    id_jugador INT NOT NULL REFERENCES jugadores(id_jugador) ON DELETE CASCADE,
    id_evaluador INT REFERENCES usuarios(id_usuario) ON DELETE SET NULL,
    fecha_evaluacion DATE NOT NULL DEFAULT CURRENT_DATE,
    fisica_velocidad NUMERIC(4,2) NOT NULL DEFAULT 5.0,
    fisica_resistencia NUMERIC(4,2) NOT NULL DEFAULT 5.0,
    fisica_fuerza NUMERIC(4,2) NOT NULL DEFAULT 5.0,
    tecnica_control NUMERIC(4,2) NOT NULL DEFAULT 5.0,
    tecnica_pase NUMERIC(4,2) NOT NULL DEFAULT 5.0,
    tecnica_definicion NUMERIC(4,2) NOT NULL DEFAULT 5.0,
    coordinativa_agilidad NUMERIC(4,2) NOT NULL DEFAULT 5.0,
    coordinativa_equilibrio NUMERIC(4,2) NOT NULL DEFAULT 5.0,
    coordinativa_ritmo NUMERIC(4,2) NOT NULL DEFAULT 5.0,
    score_fisica NUMERIC(4,2) NOT NULL,
    score_tecnica NUMERIC(4,2) NOT NULL,
    score_coordinativa NUMERIC(4,2) NOT NULL,
    ejercicio_video VARCHAR(120),
    video_url TEXT,
    nota_video NUMERIC(4,2),
    analisis_video_json JSONB,
    puntaje_global NUMERIC(4,2) NOT NULL,
    porcentaje_global INT NOT NULL,
    fortalezas TEXT,
    debilidades TEXT,
    observaciones TEXT,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS videos_analisis (
    id_video SERIAL PRIMARY KEY,
    id_entrenador INT REFERENCES usuarios(id_usuario),
    id_categoria INT REFERENCES categorias(id_categoria),
    titulo VARCHAR(140) NOT NULL,
    descripcion TEXT,
    tipo_fuente VARCHAR(20) CHECK (tipo_fuente IN ('YouTube', 'Archivo')),
    video_url TEXT NOT NULL,
    etiqueta_tactica VARCHAR(40),
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 13. MÓDULO PÚBLICO (NOTICIAS, TIENDA, PATROCINADORES)
CREATE TABLE IF NOT EXISTS noticias_club (
    id_noticia SERIAL PRIMARY KEY,
    titulo VARCHAR(160) NOT NULL,
    resumen TEXT NOT NULL,
    contenido TEXT NOT NULL,
    categoria_noticia VARCHAR(50),
    imagen_url TEXT,
    destacada BOOLEAN DEFAULT TRUE,
    publicado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS productos_tienda (
    id_producto SERIAL PRIMARY KEY,
    nombre VARCHAR(120) NOT NULL,
    descripcion TEXT,
    categoria_producto VARCHAR(50),
    precio NUMERIC(10,2) NOT NULL,
    tallas_disponibles VARCHAR(100),
    stock INT DEFAULT 0,
    imagen_url TEXT,
    activo BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS pedidos_tienda (
    id_pedido SERIAL PRIMARY KEY,
    comprador_nombre VARCHAR(120) NOT NULL,
    telefono_pago VARCHAR(30) NOT NULL,
    metodo_pago VARCHAR(30) NOT NULL DEFAULT 'Pago Móvil',
    referencia_bancaria VARCHAR(80) UNIQUE NOT NULL,
    comprobante_url TEXT NOT NULL,
    items_json JSONB NOT NULL,
    monto_total NUMERIC(10,2) NOT NULL,
    tasa_bcv NUMERIC(12,4),
    monto_bs NUMERIC(14,2),
    estado_pago VARCHAR(20) DEFAULT 'Verificado' CHECK (estado_pago IN ('Verificado', 'En_Revision', 'Rechazado')),
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS patrocinadores (
    id_patrocinador SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    rubro VARCHAR(80),
    nivel VARCHAR(20) CHECK (nivel IN ('Oro', 'Plata', 'Aliado')),
    logo_url TEXT,
    sitio_web TEXT,
    activo BOOLEAN DEFAULT TRUE
);

-- 14. MÓDULO ADMINISTRATIVO (ASISTENCIAS, CLÍNICA, FINANZAS Y PUNTO DE EQUILIBRIO)
CREATE TABLE IF NOT EXISTS asistencias (
    id_asistencia SERIAL PRIMARY KEY,
    id_jugador INT NOT NULL REFERENCES jugadores(id_jugador) ON DELETE CASCADE,
    id_categoria INT REFERENCES categorias(id_categoria),
    fecha DATE NOT NULL,
    tipo_sesion VARCHAR(25) NOT NULL DEFAULT 'Entrenamiento' CHECK (tipo_sesion IN ('Entrenamiento', 'Juego')),
    cuadrante VARCHAR(80) NOT NULL,
    hora_checkin TIMESTAMP,
    hora_checkout TIMESTAMP,
    estado VARCHAR(20) NOT NULL CHECK (estado IN ('Presente', 'Ausente', 'Justificado', 'Retardo')),
    observaciones TEXT,
    registrado_por INT REFERENCES usuarios(id_usuario),
    UNIQUE (id_jugador, fecha, tipo_sesion)
);

CREATE TABLE IF NOT EXISTS lesiones_clinicas (
    id_lesion SERIAL PRIMARY KEY,
    id_jugador INT NOT NULL REFERENCES jugadores(id_jugador) ON DELETE CASCADE,
    zona_anatomica VARCHAR(80) NOT NULL,
    coord_x NUMERIC(5,2) NOT NULL,
    coord_y NUMERIC(5,2) NOT NULL,
    tipo_lesion VARCHAR(100) NOT NULL,
    gravedad VARCHAR(20) CHECK (gravedad IN ('Leve', 'Moderada', 'Severa')),
    fecha_lesion DATE NOT NULL,
    fecha_retorno_estimada DATE,
    estado_recuperacion VARCHAR(30) DEFAULT 'En Tratamiento' CHECK (estado_recuperacion IN ('En Tratamiento', 'Readaptación', 'Alta Médica')),
    diagnostico TEXT,
    tratamiento TEXT,
    profesional_cargo VARCHAR(100),
    origen_reporte VARCHAR(30) DEFAULT 'Clínica' CHECK (origen_reporte IN ('Partido', 'Entrenamiento', 'Clínica')),
    reportado_por_id INT REFERENCES usuarios(id_usuario) ON DELETE SET NULL,
    reportado_por_rol VARCHAR(30) DEFAULT 'FISIO'
);

CREATE TABLE IF NOT EXISTS configuracion_cuadrantes (
    id_cuadrante SERIAL PRIMARY KEY,
    nombre_cuadrante VARCHAR(80) UNIQUE NOT NULL,
    modalidad VARCHAR(20) CHECK (modalidad IN ('Campo', 'F7', 'Sala')),
    costo_fijo_mensual NUMERIC(10,2) NOT NULL,
    costo_variable_atleta NUMERIC(10,2) NOT NULL,
    cuota_mensual_promedio NUMERIC(10,2) NOT NULL,
    capacidad_atletas INT NOT NULL
);

CREATE TABLE IF NOT EXISTS movimientos_contables (
    id_movimiento SERIAL PRIMARY KEY,
    tipo VARCHAR(15) CHECK (tipo IN ('Ingreso', 'Egreso')),
    categoria_contable VARCHAR(60) NOT NULL,
    concepto VARCHAR(150) NOT NULL,
    monto NUMERIC(10,2) NOT NULL,
    cuadrante VARCHAR(80) DEFAULT 'Administración General',
    fecha_movimiento DATE NOT NULL,
    referencia VARCHAR(80),
    registrado_por INT REFERENCES usuarios(id_usuario),
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS configuracion_tasas (
    id_tasa SERIAL PRIMARY KEY,
    moneda VARCHAR(10) UNIQUE NOT NULL,
    tasa_bcv NUMERIC(12,4) NOT NULL,
    fuente VARCHAR(100),
    fecha_tasa DATE NOT NULL DEFAULT CURRENT_DATE,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 15. BANDEJA DE ENTRADA / NOTIFICACIONES AUTOMÁTICAS (EMAIL, WHATSAPP, INBOX)
CREATE TABLE IF NOT EXISTS notificaciones (
    id_notificacion SERIAL PRIMARY KEY,
    id_usuario INT REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    id_representante INT REFERENCES representantes(id_representante) ON DELETE CASCADE,
    id_jugador INT REFERENCES jugadores(id_jugador) ON DELETE CASCADE,
    tipo VARCHAR(30) NOT NULL CHECK (tipo IN ('PAGO_PROXIMO', 'CONVOCATORIA', 'SISTEMA')),
    titulo VARCHAR(160) NOT NULL,
    mensaje TEXT NOT NULL,
    referencia_tipo VARCHAR(30),
    referencia_id INT,
    fecha_limite DATE,
    canal_email_estado VARCHAR(40) DEFAULT 'En_Bandeja',
    canal_whatsapp_estado VARCHAR(40) DEFAULT 'En_Bandeja',
    metadata_json JSONB DEFAULT '{}'::jsonb,
    leida BOOLEAN DEFAULT FALSE,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 16. GALERÍA DE LA HINCHADA (FOTOS Y VIDEOS DE JUEGOS Y ENTRENAMIENTOS)
CREATE TABLE IF NOT EXISTS hinchada_galeria (
    id_media SERIAL PRIMARY KEY,
    titulo VARCHAR(140) NOT NULL,
    descripcion TEXT,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('Foto', 'Video')),
    categoria_evento VARCHAR(30) NOT NULL DEFAULT 'Juego' CHECK (categoria_evento IN ('Juego', 'Entrenamiento')),
    media_url TEXT NOT NULL,
    thumbnail_url TEXT,
    fecha_evento DATE DEFAULT CURRENT_DATE,
    destacado BOOLEAN DEFAULT TRUE,
    publicado_por INT REFERENCES usuarios(id_usuario) ON DELETE SET NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ÍNDICES PARA CONSULTAS FRECUENTES
CREATE INDEX IF NOT EXISTS idx_jugadores_representante ON jugadores(id_representante);
CREATE INDEX IF NOT EXISTS idx_jugadores_categoria ON jugadores(id_categoria);
CREATE INDEX IF NOT EXISTS idx_transacciones_jugador ON transacciones_jugador(id_jugador);
CREATE INDEX IF NOT EXISTS idx_asistencias_fecha ON asistencias(fecha);
CREATE INDEX IF NOT EXISTS idx_partidos_fecha ON partidos_fixture(fecha_hora);
CREATE INDEX IF NOT EXISTS idx_trabajos_fecha_cuadrante ON trabajos_campo(fecha, cuadrante);
CREATE INDEX IF NOT EXISTS idx_evaluaciones_jugador ON evaluaciones_jugador(id_jugador);
CREATE INDEX IF NOT EXISTS idx_notificaciones_rep ON notificaciones(id_representante, leida);


-- ==========================================================
-- DATOS INICIALES Y SEED
-- ==========================================================

-- ==============================================================================
-- POBLADO INICIAL DE DATOS - PLATAFORMA LEGIÓN FÉNIX
-- ==============================================================================

-- 1. USUARIOS POR DEFECTO
-- Admin: admin / admin@legionfenix.com | Pass: 123456789 (Bcrypt 10 rondas verificado)
-- Coach: coach / coach@legionfenix.com | Pass: coach123
-- Padre: Carlos Mendoza / representante@legionfenix.com | Pass: padre123
-- Fisio: Lic. Ricardo Vásquez / fisio@legionfenix.com | Pass: fisio123
-- Analista Admin: Lic. Sofía Paredes / analista@legionfenix.com | Pass: Analista@2026
-- Prueba2: prueba2 / Joxma.francisco@gmail.com | Pass: Prueba2@2026 | WhatsApp: 04121985211
INSERT INTO usuarios (id_rol, nombre, email, password_hash, telefono)
VALUES
    ((SELECT id_rol FROM roles WHERE nombre = 'ADMINISTRADOR'), 'admin', 'admin@legionfenix.com', '$2a$10$9pveIOpQvnpoJiBWcSoZhOccvQO5sZu//dnL9YUt7sQ5blCegVNBu', '+584120000000'),
    ((SELECT id_rol FROM roles WHERE nombre = 'ENTRENADOR'), 'Prof. Mateo Rojas', 'coach@legionfenix.com', '$2a$10$gRdn2EnGkd6KS1RauorEl.mnVzq7utj.H.0FVq2ykslWS9herG89C', '+584145550101'),
    ((SELECT id_rol FROM roles WHERE nombre = 'REPRESENTANTE'), 'Carlos Mendoza', 'representante@legionfenix.com', '$2a$10$jtiCh7/Ob7uTtl4fINzGNOD4jvMpjnoGM7X.sIiFgwI5kvEWwvXgO', '+584125550202'),
    ((SELECT id_rol FROM roles WHERE nombre = 'REPRESENTANTE'), 'Elena Navarro', 'elena.navarro@legionfenix.com', '$2a$10$jtiCh7/Ob7uTtl4fINzGNOD4jvMpjnoGM7X.sIiFgwI5kvEWwvXgO', '+584245550303'),
    ((SELECT id_rol FROM roles WHERE nombre = 'FISIO'), 'Lic. Ricardo Vásquez', 'fisio@legionfenix.com', '$2a$10$UFasYZ8L9OrCaw/e1PsJbeMbCGkkvhaWNhaljVzX973u/PT/gMnlW', '+584145550404'),
    ((SELECT id_rol FROM roles WHERE nombre = 'ANALISTA_ADMIN'), 'Lic. Sofía Paredes', 'analista@legionfenix.com', '$2a$10$iXRc5g/KFdkgk1dtzypwCeW8Iczf5qiVr88MCzAJGvkH4A4nYVJK6', '+584145550606'),
    ((SELECT id_rol FROM roles WHERE nombre = 'REPRESENTANTE'), 'prueba2', 'joxma.francisco@gmail.com', '$2a$10$zMjGikpcruDcGVnL709e8e20qOIZGPn0eUzdKVWQpbs33L8ESF/De', '04121985211');

-- 2. REPRESENTANTES
INSERT INTO representantes (id_usuario, documento_identidad, parentesco, direccion, telefono_emergencia)
VALUES
    (3, 'V-18450921', 'Padre', 'Av. Principal Las Mercedes, Edif. Fénix, Piso 3', '+584149998877'),
    (4, 'V-20112344', 'Madre', 'Urb. El Rosal, Calle Los Pinos, Qta. 14', '+584128887766'),
    (7, 'V-22762599', 'Representante', 'Sede Principal Legión Fénix FC', '04121985211');

-- 3. CATEGORÍAS Y CUADRANTES (EQUIPO DE CAMPO, FÚTBOL 7 Y SALA — BEBÉS A LIBRE)
INSERT INTO categorias (nombre, disciplina, modalidad, edad_min, edad_max, cuadrante_asignado)
VALUES
    -- Equipo de Fútbol Campo (IDs 1..9)
    ('Bebés (Sub-6)', 'Equipo de Fútbol Campo', 'Campo', 4, 6, 'Cuadrante Norte - Campo'),
    ('Sub-8', 'Equipo de Fútbol Campo', 'Campo', 7, 8, 'Cuadrante Norte - Campo'),
    ('Sub-10', 'Equipo de Fútbol Campo', 'Campo', 9, 10, 'Cuadrante Norte - Campo'),
    ('Sub-12', 'Equipo de Fútbol Campo', 'Campo', 11, 12, 'Cuadrante Norte - Campo'),
    ('Sub-14', 'Equipo de Fútbol Campo', 'Campo', 13, 14, 'Cuadrante Norte - Campo'),
    ('Sub-16', 'Equipo de Fútbol Campo', 'Campo', 15, 16, 'Cuadrante Norte - Campo'),
    ('Sub-18', 'Equipo de Fútbol Campo', 'Campo', 17, 18, 'Cuadrante Norte - Campo'),
    ('Sub-20', 'Equipo de Fútbol Campo', 'Campo', 18, 20, 'Cuadrante Norte - Campo'),
    ('Libre', 'Equipo de Fútbol Campo', 'Campo', 21, 99, 'Cuadrante Norte - Campo'),
    -- Equipo de Fútbol 7 (IDs 10..18)
    ('Bebés (Sub-6)', 'Equipo de Fútbol 7', 'F7', 4, 6, 'Cuadrante Sur - F7'),
    ('Sub-8', 'Equipo de Fútbol 7', 'F7', 7, 8, 'Cuadrante Sur - F7'),
    ('Sub-10', 'Equipo de Fútbol 7', 'F7', 9, 10, 'Cuadrante Sur - F7'),
    ('Sub-12', 'Equipo de Fútbol 7', 'F7', 11, 12, 'Cuadrante Sur - F7'),
    ('Sub-14', 'Equipo de Fútbol 7', 'F7', 13, 14, 'Cuadrante Sur - F7'),
    ('Sub-16', 'Equipo de Fútbol 7', 'F7', 15, 16, 'Cuadrante Sur - F7'),
    ('Sub-18', 'Equipo de Fútbol 7', 'F7', 17, 18, 'Cuadrante Sur - F7'),
    ('Sub-20', 'Equipo de Fútbol 7', 'F7', 18, 20, 'Cuadrante Sur - F7'),
    ('Libre', 'Equipo de Fútbol 7', 'F7', 21, 99, 'Cuadrante Sur - F7'),
    -- Equipo de Sala (IDs 19..27)
    ('Bebés (Sub-6)', 'Equipo de Sala', 'Sala', 4, 6, 'Cancha Techada - Sala'),
    ('Sub-8', 'Equipo de Sala', 'Sala', 7, 8, 'Cancha Techada - Sala'),
    ('Sub-10', 'Equipo de Sala', 'Sala', 9, 10, 'Cancha Techada - Sala'),
    ('Sub-12', 'Equipo de Sala', 'Sala', 11, 12, 'Cancha Techada - Sala'),
    ('Sub-14', 'Equipo de Sala', 'Sala', 13, 14, 'Cancha Techada - Sala'),
    ('Sub-16', 'Equipo de Sala', 'Sala', 15, 16, 'Cancha Techada - Sala'),
    ('Sub-18', 'Equipo de Sala', 'Sala', 17, 18, 'Cancha Techada - Sala'),
    ('Sub-20', 'Equipo de Sala', 'Sala', 18, 20, 'Cancha Techada - Sala'),
    ('Libre', 'Equipo de Sala', 'Sala', 21, 99, 'Cancha Techada - Sala');

-- 4. JUGADORES
INSERT INTO jugadores (
    id_representante, id_categoria, nombre, apellido, fecha_nacimiento,
    dni_cedula, genero, foto_url, posicion_habitual, pierna_habil, dorsal, estado_cuenta
)
VALUES
    (1, 5, 'Sebastián', 'Mendoza', '2013-04-18', 'V-32100451', 'Masculino', '/assets/avatar-player.svg', 'Mediocentro Mixto', 'Derecha', 8, 'Moroso'),
    (1, 12, 'Luciano', 'Mendoza', '2017-08-09', 'V-35100992', 'Masculino', '/assets/avatar-player.svg', 'Extremo Derecho', 'Ambidiestro', 11, 'Solvente'),
    (2, 13, 'Valeria', 'Navarro', '2015-01-25', 'V-33881203', 'Femenino', '/assets/avatar-player.svg', 'Defensa Central', 'Izquierda', 4, 'Pendiente'),
    (2, 27, 'Diego', 'Navarro', '2005-11-12', 'V-29440119', 'Masculino', '/assets/avatar-player.svg', 'Pívot', 'Derecha', 9, 'Solvente'),
    (1, 6, 'Andrés', 'Salazar', '2010-06-30', 'V-31556789', 'Masculino', '/assets/avatar-player.svg', 'Arquero', 'Derecha', 1, 'Solvente'),
    (3, 5, 'Francisco', 'Prueba', '2013-05-10', 'V-32998877', 'Masculino', '/assets/avatar-player.svg', 'Delantero Centro', 'Derecha', 10, 'Pendiente');

-- 5. FICHAS MÉDICAS
INSERT INTO fichas_medicas (
    id_jugador, grupo_sanguineo, alergias, condiciones_cardiacas,
    evaluacion_podologica, peso_kg, altura_m,
    contacto_emergencia_nombre, contacto_emergencia_telefono, seguro_medico_poliza, fecha_ultima_revision
)
VALUES
    (1, 'O+', 'Ninguna conocida', 'Sin alteraciones (ECG Normal)', 'Pisada Neutra - Arco Normal', 46.50, 1.56, 'Carlos Mendoza', '+584149998877', 'POL-FENIX-2026-001', CURRENT_DATE - INTERVAL '30 days'),
    (2, 'A+', 'Penicilina (leve)', 'Sin alteraciones', 'Pronador Leve - Plantilla Deportiva', 31.20, 1.34, 'Carlos Mendoza', '+584149998877', 'POL-FENIX-2026-002', CURRENT_DATE - INTERVAL '15 days'),
    (3, 'O-', 'Ninguna', 'Soplo inocente descartado por cardiólogo', 'Pisada Neutra', 39.00, 1.48, 'Elena Navarro', '+584128887766', 'POL-FENIX-2026-003', CURRENT_DATE - INTERVAL '45 days'),
    (4, 'B+', 'Ninguna', 'Apto alta competencia', 'Cavo Leve', 68.40, 1.77, 'Elena Navarro', '+584128887766', 'POL-FENIX-2026-004', CURRENT_DATE - INTERVAL '20 days'),
    (5, 'O+', 'Polvo y ácaros', 'Sin alteraciones', 'Pisada Neutra', 61.00, 1.73, 'Carlos Mendoza', '+584149998877', 'POL-FENIX-2026-005', CURRENT_DATE - INTERVAL '10 days'),
    (6, 'O+', 'Ninguna', 'Apto competencia juvenil', 'Pisada Neutra', 48.00, 1.59, 'prueba2', '04121985211', 'POL-FENIX-2026-006', CURRENT_DATE - INTERVAL '5 days');

-- 6. CONSENTIMIENTOS LEGALES
INSERT INTO consentimientos_legales (id_jugador, id_representante, uso_imagen, exoneracion_medica, firma_representante)
VALUES
    (1, 1, TRUE, TRUE, 'Carlos Mendoza'),
    (2, 1, TRUE, TRUE, 'Carlos Mendoza'),
    (3, 2, TRUE, TRUE, 'Elena Navarro'),
    (4, 2, TRUE, TRUE, 'Elena Navarro'),
    (5, 1, TRUE, TRUE, 'Carlos Mendoza'),
    (6, 3, TRUE, TRUE, 'prueba2');

-- 7. TRANSACCIONES Y COBRANZAS (SEMÁFORO)
INSERT INTO transacciones_jugador (
    id_jugador, id_representante, concepto, descripcion_detalle, monto,
    fecha_emision, fecha_vencimiento, estado_pago, metodo_pago, comprobante_estado, fecha_pago
)
VALUES
    (1, 1, 'Mensualidad', 'Mensualidad Noviembre', 45.00, CURRENT_DATE - INTERVAL '20 days', CURRENT_DATE - INTERVAL '5 days', 'Pagado', 'Zelle', 'Aprobado', CURRENT_TIMESTAMP - INTERVAL '18 days'),
    (1, 1, 'Arbitraje', 'Arbitraje Fecha 6', 5.00, CURRENT_DATE - INTERVAL '3 days', CURRENT_DATE + INTERVAL '4 days', 'Pendiente', NULL, 'Sin_Comprobante', NULL),
    (1, 1, 'Multa_Amarilla', 'Multa Tarjeta Amarilla Jornada 5', 2.00, CURRENT_DATE - INTERVAL '15 days', CURRENT_DATE - INTERVAL '2 days', 'Vencido', NULL, 'Sin_Comprobante', NULL),
    (2, 1, 'Mensualidad', 'Mensualidad Noviembre Sub-10', 40.00, CURRENT_DATE - INTERVAL '15 days', CURRENT_DATE - INTERVAL '1 day', 'Pagado', 'Pago Móvil', 'Aprobado', CURRENT_TIMESTAMP - INTERVAL '12 days'),
    (3, 2, 'Mensualidad', 'Mensualidad Noviembre Sub-12', 40.00, CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE + INTERVAL '5 days', 'Pendiente', NULL, 'Sin_Comprobante', NULL),
    (4, 2, 'Torneo', 'Copa Invitacional Futsal', 25.00, CURRENT_DATE - INTERVAL '12 days', CURRENT_DATE - INTERVAL '2 days', 'Pagado', 'Transferencia', 'Aprobado', CURRENT_TIMESTAMP - INTERVAL '10 days'),
    (5, 1, 'Mensualidad', 'Mensualidad Noviembre Sub-16', 45.00, CURRENT_DATE - INTERVAL '14 days', CURRENT_DATE - INTERVAL '3 days', 'Pagado', 'Zelle', 'Aprobado', CURRENT_TIMESTAMP - INTERVAL '11 days'),
    (6, 3, 'Mensualidad', 'Mensualidad del equipo Legión Fénix FC (Noviembre 2026)', 45.00, CURRENT_DATE, DATE '2026-11-17', 'Pendiente', NULL, 'Sin_Comprobante', NULL);

-- 8. UNIFORMES ASIGNADOS
INSERT INTO uniformes_asignados (id_jugador, temporada, talla_camiseta, talla_short, entregado)
VALUES
    (1, '2026-2027', '14', '14', TRUE),
    (2, '2026-2027', '10', '10', TRUE),
    (3, '2026-2027', '12', '12', FALSE),
    (4, '2026-2027', 'M', 'M', TRUE),
    (5, '2026-2027', 'L', 'L', TRUE),
    (6, '2026-2027', '14', '14', TRUE);

-- 9. FIXTURE DE PARTIDOS Y GPS
INSERT INTO partidos_fixture (
    id_categoria, rival, torneo, modalidad, fecha_hora, sede, direccion_sede,
    latitud, longitud, gps_url, kit_designado, es_local, goles_fenix, goles_rival, estado, destacado
)
VALUES
    (5, 'Atlético Metropolitano Sub-14', 'Liga Juvenil Estadal - Jornada 7', 'Campo',
     CURRENT_TIMESTAMP + INTERVAL '3 days 5 hours',
     'Complejo Deportivo Fénix Arena (Campo Norte)',
     'Av. Los Próceres Km 4, Sector Deportivo Norte',
     10.480594, -66.903606,
     'https://maps.google.com/?q=10.480594,-66.903606',
     'Kit Titular (Local): Camiseta Rojo Fuego & Negro, Shorts Negros',
     TRUE, NULL, NULL, 'Programado', TRUE),
    (12, 'Academia Real Del Sur', 'Copa Relámpago F7', 'F7',
     CURRENT_TIMESTAMP + INTERVAL '4 days 2 hours',
     'Cancha F7 El Bosque',
     'Calle Principal El Bosque, Parcela 12',
     10.491200, -66.854100,
     'https://maps.google.com/?q=10.491200,-66.854100',
     'Kit Visitante (Alternativo): Camiseta Negra & Oro Metálico, Shorts Negros',
     FALSE, NULL, NULL, 'Programado', FALSE),
    (27, 'Titanes Futsal Club', 'Torneo Clausura Sala', 'Sala',
     CURRENT_TIMESTAMP + INTERVAL '6 days',
     'Domo Techado Legión Fénix',
     'Av. Principal Las Mercedes, Complejo Fénix',
     10.485100, -66.861900,
     'https://maps.google.com/?q=10.485100,-66.861900',
     'Kit Titular (Local): Camiseta Rojo Fuego & Negro, Shorts Negros',
     TRUE, NULL, NULL, 'Programado', FALSE),
    (6, 'Deportivo Halcones', 'Liga Estadal Sub-16 - Jornada 6', 'Campo',
     CURRENT_TIMESTAMP - INTERVAL '5 days',
     'Estadio Olímpico Municipal',
     'Zona Deportiva Central',
     10.496000, -66.890000,
     'https://maps.google.com/?q=10.496000,-66.890000',
     'Kit Titular (Local): Camiseta Rojo Fuego & Negro, Shorts Negros',
     TRUE, 3, 1, 'Finalizado', FALSE),
    (5, 'Estrella Roja FC', 'Liga Juvenil Estadal - Jornada 6', 'Campo',
     CURRENT_TIMESTAMP - INTERVAL '7 days',
     'Complejo Deportivo Fénix Arena (Campo Norte)',
     'Av. Los Próceres Km 4, Sector Deportivo Norte',
     10.480594, -66.903606,
     'https://maps.google.com/?q=10.480594,-66.903606',
     'Kit Titular (Local): Camiseta Rojo Fuego & Negro, Shorts Negros',
     TRUE, 2, 0, 'Finalizado', FALSE);

-- 10. CONVOCATORIAS
INSERT INTO convocatorias (id_partido, id_jugador, estado_convocatoria, observacion)
VALUES
    (1, 1, 'Bloqueado_Morosidad', 'Bloqueado automáticamente por factura vencida (Multa Tarjeta Amarilla)'),
    (2, 2, 'Convocado', 'Citado 45 min antes con hidratación y uniforme Visitante'),
    (3, 4, 'Confirmado', 'Titular confirmado por el cuerpo técnico'),
    (1, 6, 'Convocado', 'Convocado Jornada 7 Liga Juvenil Estadal (Confirmar asistencia)');

-- 11. ESTADÍSTICAS DE PARTIDOS
INSERT INTO estadisticas_partidos (id_jugador, id_partido, modalidad, torneo, titular, minutos_jugados, goles, asistencias, tarjetas_amarillas, tarjetas_rojas, fecha_partido)
VALUES
    (1, 5, 'Campo', 'Liga Juvenil Estadal', TRUE, 70, 1, 2, 1, 0, CURRENT_DATE - INTERVAL '7 days'),
    (4, 3, 'Sala', 'Torneo Clausura Sala', TRUE, 38, 3, 1, 0, 0, CURRENT_DATE - INTERVAL '10 days'),
    (5, 4, 'Campo', 'Liga Estadal Sub-16', TRUE, 90, 0, 0, 0, 0, CURRENT_DATE - INTERVAL '5 days');

-- 12. TÁCTICAS DEL SIMULADOR PRIVADO (CAMPO, F7 Y SALA CON ANIMACIÓN 2D)
INSERT INTO tacticas_simulador (id_categoria, nombre_sistema, modalidad, pros, contras, descripcion, formacion_json, movimientos_json)
VALUES
    (
        5,
        '1-4-3-3 Salida y Ruptura',
        'Campo',
        'Máxima amplitud con extremos abiertos. Superioridad numérica en mediocampo (triángulo interior). Presión tras pérdida sofocante en campo rival.',
        'Espacios vulnerables a la espalda de los laterales cuando se proyectan simultáneamente. Alto desgaste físico en los extremos y pivote único.',
        'Ataque de Posición y Ruptura por Pasillos Exteriores',
        '{"jugadores":[{"dorsal":1,"rol":"POR","x":50,"y":90},{"dorsal":2,"rol":"LD","x":84,"y":70},{"dorsal":4,"rol":"DFC","x":63,"y":75},{"dorsal":5,"rol":"DFC","x":37,"y":75},{"dorsal":3,"rol":"LI","x":16,"y":70},{"dorsal":6,"rol":"MCD","x":50,"y":56},{"dorsal":8,"rol":"MC","x":68,"y":43},{"dorsal":10,"rol":"MC","x":32,"y":43},{"dorsal":7,"rol":"ED","x":83,"y":24},{"dorsal":9,"rol":"DC","x":50,"y":17},{"dorsal":11,"rol":"EI","x":17,"y":24}]}'::jsonb,
        '{"ejercicio":"Salida limpia 1-4-3-3 y centro raso","duracionSeg":8,"pasos":[{"label":"Inicio bloque bajo","balon":{"x":50,"y":84},"jugadores":[{"dorsal":1,"rol":"POR","x":50,"y":90},{"dorsal":2,"rol":"LD","x":84,"y":70},{"dorsal":4,"rol":"DFC","x":63,"y":75},{"dorsal":5,"rol":"DFC","x":37,"y":75},{"dorsal":3,"rol":"LI","x":16,"y":70},{"dorsal":6,"rol":"MCD","x":50,"y":56},{"dorsal":8,"rol":"MC","x":68,"y":43},{"dorsal":10,"rol":"MC","x":32,"y":43},{"dorsal":7,"rol":"ED","x":83,"y":24},{"dorsal":9,"rol":"DC","x":50,"y":17},{"dorsal":11,"rol":"EI","x":17,"y":24}]},{"label":"Progresión por interior y ruptura lateral","balon":{"x":68,"y":40},"jugadores":[{"dorsal":1,"rol":"POR","x":50,"y":86},{"dorsal":2,"rol":"LD","x":88,"y":48},{"dorsal":4,"rol":"DFC","x":65,"y":68},{"dorsal":5,"rol":"DFC","x":39,"y":68},{"dorsal":3,"rol":"LI","x":22,"y":60},{"dorsal":6,"rol":"MCD","x":50,"y":49},{"dorsal":8,"rol":"MC","x":68,"y":41},{"dorsal":10,"rol":"MC","x":41,"y":33},{"dorsal":7,"rol":"ED","x":84,"y":19},{"dorsal":9,"rol":"DC","x":54,"y":15},{"dorsal":11,"rol":"EI","x":25,"y":20}]},{"label":"Desdoblamiento y definición en área","balon":{"x":53,"y":13},"jugadores":[{"dorsal":1,"rol":"POR","x":50,"y":82},{"dorsal":2,"rol":"LD","x":89,"y":24},{"dorsal":4,"rol":"DFC","x":64,"y":60},{"dorsal":5,"rol":"DFC","x":38,"y":60},{"dorsal":3,"rol":"LI","x":24,"y":52},{"dorsal":6,"rol":"MCD","x":50,"y":42},{"dorsal":8,"rol":"MC","x":64,"y":28},{"dorsal":10,"rol":"MC","x":45,"y":24},{"dorsal":7,"rol":"ED","x":73,"y":14},{"dorsal":9,"rol":"DC","x":52,"y":11},{"dorsal":11,"rol":"EI","x":36,"y":16}]}]}'::jsonb
    ),
    (
        5,
        '1-4-4-2 Bloque Medio',
        'Campo',
        'Excelente ocupación racional del ancho del campo en dos líneas de cuatro. Gran solidez defensiva en bloque medio/bajo y doble referencia ofensiva para transiciones directas.',
        'Riesgo de inferioridad en pasillo central si el rival acumula tres mediocentros. Menor amplitud natural si los volantes cierran hacia adentro.',
        'Bloque Compacto y Contraataque Directo',
        '{"jugadores":[{"dorsal":1,"rol":"POR","x":50,"y":90},{"dorsal":2,"rol":"LD","x":84,"y":72},{"dorsal":4,"rol":"DFC","x":62,"y":76},{"dorsal":5,"rol":"DFC","x":38,"y":76},{"dorsal":3,"rol":"LI","x":16,"y":72},{"dorsal":7,"rol":"MD","x":83,"y":48},{"dorsal":6,"rol":"MC","x":60,"y":52},{"dorsal":8,"rol":"MC","x":40,"y":52},{"dorsal":11,"rol":"MI","x":17,"y":48},{"dorsal":9,"rol":"DC","x":61,"y":21},{"dorsal":10,"rol":"DC","x":39,"y":21}]}'::jsonb,
        '{"ejercicio":"Basculación defensiva y contraataque 2 puntas","duracionSeg":6,"pasos":[{"label":"Repliegue ordenado","balon":{"x":78,"y":58},"jugadores":[{"dorsal":1,"rol":"POR","x":50,"y":90},{"dorsal":2,"rol":"LD","x":84,"y":72},{"dorsal":4,"rol":"DFC","x":62,"y":76},{"dorsal":5,"rol":"DFC","x":38,"y":76},{"dorsal":3,"rol":"LI","x":16,"y":72},{"dorsal":7,"rol":"MD","x":83,"y":48},{"dorsal":6,"rol":"MC","x":60,"y":52},{"dorsal":8,"rol":"MC","x":40,"y":52},{"dorsal":11,"rol":"MI","x":17,"y":48},{"dorsal":9,"rol":"DC","x":61,"y":21},{"dorsal":10,"rol":"DC","x":39,"y":21}]},{"label":"Robo y pase vertical","balon":{"x":43,"y":31},"jugadores":[{"dorsal":1,"rol":"POR","x":50,"y":88},{"dorsal":2,"rol":"LD","x":76,"y":64},{"dorsal":4,"rol":"DFC","x":59,"y":68},{"dorsal":5,"rol":"DFC","x":37,"y":68},{"dorsal":3,"rol":"LI","x":19,"y":63},{"dorsal":7,"rol":"MD","x":79,"y":36},{"dorsal":6,"rol":"MC","x":56,"y":44},{"dorsal":8,"rol":"MC","x":42,"y":37},{"dorsal":11,"rol":"MI","x":22,"y":34},{"dorsal":9,"rol":"DC","x":60,"y":14},{"dorsal":10,"rol":"DC","x":41,"y":16}]}]}'::jsonb
    ),
    (
        12,
        '1-2-3-1 Fútbol 7 Dinámico',
        'F7',
        'Equilibrio ideal en fútbol 7 con laterales profundos y media punta libre entre líneas para asociar rápido hacia bandas o delantero.',
        'Si los laterales suben a la vez sin relevo del medio centro, el central queda expuesto al contraataque.',
        'Salida Triangular F7 y Amplitud por Bandas',
        '{"jugadores":[{"dorsal":1,"rol":"POR","x":50,"y":89},{"dorsal":4,"rol":"DFC","x":50,"y":72},{"dorsal":2,"rol":"LD","x":80,"y":58},{"dorsal":3,"rol":"LI","x":20,"y":58},{"dorsal":8,"rol":"MC","x":50,"y":46},{"dorsal":7,"rol":"ED","x":77,"y":30},{"dorsal":9,"rol":"DC","x":50,"y":18}]}'::jsonb,
        '{"ejercicio":"Triangulación lateral y remate en área F7","duracionSeg":6,"pasos":[{"label":"Inicio desde cierre F7","balon":{"x":50,"y":70},"jugadores":[{"dorsal":1,"rol":"POR","x":50,"y":89},{"dorsal":4,"rol":"DFC","x":50,"y":72},{"dorsal":2,"rol":"LD","x":80,"y":58},{"dorsal":3,"rol":"LI","x":20,"y":58},{"dorsal":8,"rol":"MC","x":50,"y":46},{"dorsal":7,"rol":"ED","x":77,"y":30},{"dorsal":9,"rol":"DC","x":50,"y":18}]},{"label":"Pared en banda derecha","balon":{"x":78,"y":28},"jugadores":[{"dorsal":1,"rol":"POR","x":50,"y":86},{"dorsal":4,"rol":"DFC","x":54,"y":62},{"dorsal":2,"rol":"LD","x":83,"y":39},{"dorsal":3,"rol":"LI","x":26,"y":50},{"dorsal":8,"rol":"MC","x":55,"y":36},{"dorsal":7,"rol":"ED","x":76,"y":22},{"dorsal":9,"rol":"DC","x":47,"y":15}]}]}'::jsonb
    ),
    (
        27,
        '3-1 con Pívot Futsal',
        'Sala',
        'Fija a los cierres contrarios y genera líneas claras de pase interior y juego de cara. Ideal para rotaciones en 40x20 y descargas rápidas al segundo palo.',
        'Las pérdidas en primera línea (cierre) dejan situaciones inmediatas de 1v1 o 2v1 frente al arquero por la corta dimensión de la cancha.',
        'Sistema Clásico de Futsal con Referencia Ofensiva',
        '{"jugadores":[{"dorsal":1,"rol":"POR","x":50,"y":88},{"dorsal":4,"rol":"CIERRE","x":50,"y":67},{"dorsal":7,"rol":"ALA D","x":82,"y":45},{"dorsal":10,"rol":"ALA I","x":18,"y":45},{"dorsal":9,"rol":"PÍVOT","x":50,"y":20}]}'::jsonb,
        '{"ejercicio":"Paralela y descarga al segundo palo","duracionSeg":6,"pasos":[{"label":"Fijación al pívot","balon":{"x":50,"y":64},"jugadores":[{"dorsal":1,"rol":"POR","x":50,"y":88},{"dorsal":4,"rol":"CIERRE","x":50,"y":67},{"dorsal":7,"rol":"ALA D","x":82,"y":45},{"dorsal":10,"rol":"ALA I","x":18,"y":45},{"dorsal":9,"rol":"PÍVOT","x":50,"y":20}]},{"label":"Descarga y diagonal al segundo palo","balon":{"x":31,"y":21},"jugadores":[{"dorsal":1,"rol":"POR","x":50,"y":86},{"dorsal":4,"rol":"CIERRE","x":46,"y":56},{"dorsal":7,"rol":"ALA D","x":63,"y":26},{"dorsal":10,"rol":"ALA I","x":26,"y":20},{"dorsal":9,"rol":"PÍVOT","x":58,"y":17}]}]}'::jsonb
    );

-- 13. MICROCICLOS DE ENTRENAMIENTO (3 BLOQUES)
INSERT INTO microciclos_entrenamiento (
    id_entrenador, id_categoria, titulo, semana_inicio, semana_fin,
    objetivo_principal, bloque_arqueros, bloque_defensivo, bloque_ofensivo, carga_estimada, estado
)
VALUES
    (
        2, 5, 'Microciclo #14 - Transición Defensa-Ataque y Amplitud',
        CURRENT_DATE - INTERVAL '1 day', CURRENT_DATE + INTERVAL '5 days',
        'Consolidar la salida limpia desde línea de 4 y activar ruptura por bandas en último tercio.',
        'Bloqueo bajo y lateral, juego con los pies bajo presión (triangulación con centrales) y achique 1v1 en área chica. (45 min / 3 series reactivas)',
        'Basculación en bloque medio 1-4-4-2, coberturas de laterales proyectados y defensa de centros laterales en zona mixta. (50 min / Espacio reducido 8v8)',
        'Ataque posicional 1-4-3-3: fijación por pasillo interior, desdoblamiento de extremos y definición al primer toque tras centro raso. (55 min / Oleadas 6v4)',
        'Alta (Pre-Competitiva)',
        'En Curso'
    ),
    (
        2, 27, 'Microciclo #15 - Rotación 3-1 y Balón Parado Futsal',
        CURRENT_DATE + INTERVAL '6 days', CURRENT_DATE + INTERVAL '12 days',
        'Automatizar paralelas, diagonales al pívot y estrategia en córner ofensivo.',
        'Velocidad de reacción a quemarropa, salidas rápidas con la mano al pívot y posicionamiento en superioridad 5v4. (40 min)',
        'Defensa zonal con cambios de marca en bloqueos indirectos y cierre de línea de pase interior al pívot rival. (45 min)',
        'Juego de cara con pívot dominante, segunda jugada en banda y finalización de pisada al segundo palo. (50 min)',
        'Media-Alta',
        'Planificado'
    );

-- 14. VIDEOS DE ANÁLISIS TÁCTICO
INSERT INTO videos_analisis (id_entrenador, id_categoria, titulo, descripcion, tipo_fuente, video_url, etiqueta_tactica)
VALUES
    (2, 5, 'Análisis Presión Alta 1-4-3-3 vs Bloque Bajo', 'Secuencia táctica de recuperación en campo rival y ocupación de intervalos.', 'YouTube', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'Ofensivo'),
    (2, 27, 'Fundamentos de Cobertura y Rotación 3-1 Futsal', 'Movimientos sin balón en cancha 40x20 para romper marcas individuales.', 'YouTube', 'https://www.youtube.com/watch?v=M7lc1UVf-VE', 'Transiciones'),
    (2, 6, 'Entrenamiento Específico de Arqueros - Juego Aéreo', 'Mecánica de salto, blocaje seguro y reinicio rápido de contraataque.', 'YouTube', 'https://www.youtube.com/watch?v=aqz-KE-bpKQ', 'Arqueros');

-- 15. NOTICIAS DEL CLUB (MÓDULO PÚBLICO)
INSERT INTO noticias_club (titulo, resumen, contenido, categoria_noticia, imagen_url, destacada)
VALUES
    (
        'Legión Fénix Sub-14 lidera invicta la Liga Estadal tras victoria 2-0',
        'Con goles de Sebastián Mendoza y un sólido bloque defensivo, nuestra categoría Sub-14 sumó tres puntos vitales en el Fénix Arena.',
        'En una tarde vibrante bajo los colores vinotinto y rojo fuego, el conjunto Sub-14 de Legión Fénix impuso condiciones desde el minuto uno con una presión alta asfixiante. El mediocampista Sebastián Mendoza abrió el marcador al minuto 24 tras una triangulación por banda izquierda y cerró la jornada con dos asistencias clave para sellar el liderato.',
        'Resultados', '/assets/news-match.svg', TRUE
    ),
    (
        'Abiertas las inscripciones Temporada 2026-2027: Campo, F7 y Futsal',
        'Ya se encuentra habilitado el registro digital desde Bebés hasta categoría Libre con evaluación médica y autoregistro adulto.',
        'La Academia Legión Fénix abre sus puertas para talentos en todas las categorías desde Bebés (Sub-6) hasta Libre en Equipo de Fútbol Campo, Equipo de Fútbol 7 y Equipo de Sala. Los representantes pueden inscribir a menores de edad y los adultos (Sub-20 / Libre) cuentan con autoregistro directo.',
        'Institucional', '/assets/news-academy.svg', TRUE
    ),
    (
        'Alianza de Rendimiento Médico y Podológico para nuestros atletas',
        'Incorporamos mapeo anatómico de lesiones y seguimiento podológico preventivo en cada categoría formativa.',
        'Como parte de nuestra visión de alto rendimiento integral, Legión Fénix refuerza su departamento médico con evaluaciones trimestrales de pisada, control de carga por microciclos y monitoreo preventivo de lesiones musculares y articulares.',
        'Salud Deportiva', '/assets/news-medical.svg', TRUE
    );

-- 16. TIENDA OFICIAL (UNIFORMES LOCAL, VISITANTE Y ACCESORIOS LEGIÓN FÉNIX FC)
INSERT INTO productos_tienda (nombre, descripcion, categoria_producto, precio, tallas_disponibles, stock, imagen_url)
VALUES
    ('Uniforme Completo Jugador — Local', 'Kit oficial de casa Legión Fénix FC (Camiseta Rojo Fuego & Negro #10 con Fénix dorsal + Short oficial con escudo).', 'Uniforme Local', 58.00, '8, 10, 12, 14, S, M, L, XL', 45, '/assets/uniforme-local-jugador-kit.png'),
    ('Camisa Oficial Jugador — Local', 'Camiseta titular Rojo Fuego y Negro con patrón chevron sublimado, escudo bordado Legión Fénix FC y Fénix en espalda.', 'Uniforme Local', 38.00, '8, 10, 12, 14, S, M, L, XL', 50, '/assets/uniforme-local-jugador-camisa.png'),
    ('Uniforme Completo Portero — Local', 'Equipación oficial de arquero Local #1 (Camiseta Blanca & Rojo Fuego con Fénix llameante + Short Rojo Fuego).', 'Uniforme Local', 58.00, '10, 12, 14, S, M, L, XL', 25, '/assets/uniforme-local-portero-kit.png'),
    ('Camisa Oficial Portero — Local', 'Camiseta de portero Local #1 en Blanco y Rojo Fuego con tejido Dry-Fit de secado rápido y escudo oficial.', 'Uniforme Local', 38.00, '10, 12, 14, S, M, L, XL', 30, '/assets/uniforme-local-portero-camisa.png'),
    ('Uniforme Completo Jugador — Visitante', 'Kit oficial Visitante Negro & Dorado Élite (Camiseta negra con franjas doradas y escudo dorado + Short negro/oro).', 'Uniforme Visitante', 60.00, '8, 10, 12, 14, S, M, L, XL', 40, '/assets/uniforme-visitante-jugador-kit.png'),
    ('Camisa Oficial Jugador — Visitante', 'Camiseta de visitante Negro y Oro Metálico con cuello en V, chevron dorado y escudo edición dorada Legión Fénix FC.', 'Uniforme Visitante', 40.00, '8, 10, 12, 14, S, M, L, XL', 45, '/assets/uniforme-visitante-jugador-camisa.png'),
    ('Uniforme Completo Portero — Visitante', 'Kit oficial de arquero Visitante (Camiseta Blanca con mangas negras y vivos dorados + Short negro/blanco/oro).', 'Uniforme Visitante', 60.00, '10, 12, 14, S, M, L, XL', 22, '/assets/uniforme-visitante-portero-kit.png'),
    ('Camisa Oficial Portero — Visitante', 'Camiseta de portero Visitante Blanco, Negro y Dorado con escudo metálico edición dorada y costura reforzada.', 'Uniforme Visitante', 40.00, '10, 12, 14, S, M, L, XL', 28, '/assets/uniforme-visitante-portero-camisa.png'),
    ('Medias Técnicas Compresión Legión Fénix', 'Medias antideslizantes de alto rendimiento con refuerzo en talón y empeine en Rojo Fuego y Negro.', 'Accesorios', 12.00, 'Infantil, Juvenil, Adulto', 80, '/assets/socks-fenix.svg'),
    ('Morral Táctico Legión Fénix FC', 'Compartimiento inferior ventilado para botines y bolsillo térmico para hidratación con emblema del club.', 'Accesorios', 34.00, 'Única', 30, '/assets/bag-fenix.svg');

-- 17. PATROCINADORES
INSERT INTO patrocinadores (nombre, rubro, nivel, logo_url, sitio_web)
VALUES
    ('Grupo Energía Vital', 'Hidratación y Nutrición Deportiva', 'Oro', '/assets/sponsor-gold.svg', 'https://legionfenix.example.com'),
    ('Clínica OrtoSport', 'Medicina Deportiva y Podología', 'Oro', '/assets/sponsor-clinic.svg', 'https://legionfenix.example.com'),
    ('Banco Metropolitano', 'Servicios Financieros y Pagos', 'Plata', '/assets/sponsor-bank.svg', 'https://legionfenix.example.com'),
    ('Textiles Apex Pro', 'Indumentaria Técnica de Alto Rendimiento', 'Plata', '/assets/sponsor-apex.svg', 'https://legionfenix.example.com'),
    ('Transporte Ruta Segura', 'Movilidad de Delegaciones', 'Aliado', '/assets/sponsor-route.svg', 'https://legionfenix.example.com');

-- 18. ASISTENCIAS (CON ALERTAS DE INASISTENCIA)
INSERT INTO asistencias (id_jugador, id_categoria, fecha, cuadrante, hora_checkin, hora_checkout, estado, observaciones, registrado_por)
VALUES
    (1, 5, CURRENT_DATE - INTERVAL '6 days', 'Cuadrante Norte - Campo', NULL, NULL, 'Ausente', 'Sin aviso previo', 1),
    (1, 5, CURRENT_DATE - INTERVAL '4 days', 'Cuadrante Norte - Campo', NULL, NULL, 'Ausente', 'Segunda inasistencia consecutiva', 1),
    (1, 5, CURRENT_DATE - INTERVAL '2 days', 'Cuadrante Norte - Campo', CURRENT_TIMESTAMP - INTERVAL '2 days', CURRENT_TIMESTAMP - INTERVAL '2 days' + INTERVAL '2 hours', 'Presente', 'Reincorporado a sesión táctica', 1),
    (2, 12, CURRENT_DATE - INTERVAL '2 days', 'Cuadrante Sur - F7', CURRENT_TIMESTAMP - INTERVAL '2 days', CURRENT_TIMESTAMP - INTERVAL '2 days' + INTERVAL '90 minutes', 'Presente', 'Excelente intensidad', 1),
    (3, 13, CURRENT_DATE - INTERVAL '4 days', 'Cuadrante Sur - F7', NULL, NULL, 'Ausente', 'Inasistencia sin reporte', 1),
    (3, 13, CURRENT_DATE - INTERVAL '2 days', 'Cuadrante Sur - F7', NULL, NULL, 'Ausente', 'Pendiente contactar representante', 1),
    (4, 27, CURRENT_DATE - INTERVAL '2 days', 'Cancha Techada - Sala', CURRENT_TIMESTAMP - INTERVAL '2 days', CURRENT_TIMESTAMP - INTERVAL '2 days' + INTERVAL '90 minutes', 'Presente', 'Sesión de pívots', 1),
    (5, 6, CURRENT_DATE - INTERVAL '2 days', 'Cuadrante Norte - Campo', CURRENT_TIMESTAMP - INTERVAL '2 days', CURRENT_TIMESTAMP - INTERVAL '2 days' + INTERVAL '2 hours', 'Presente', 'Trabajo específico de arqueros', 1);

-- 19. SEGUIMIENTO CLÍNICO Y MAPEO DE LESIONES
INSERT INTO lesiones_clinicas (
    id_jugador, zona_anatomica, coord_x, coord_y, tipo_lesion, gravedad,
    fecha_lesion, fecha_retorno_estimada, estado_recuperacion, diagnostico, tratamiento, profesional_cargo,
    origen_reporte, reportado_por_id, reportado_por_rol
)
VALUES
    (1, 'Tobillo Derecho', 43.00, 86.00, 'Esguince Grado I', 'Leve',
     CURRENT_DATE - INTERVAL '9 days', CURRENT_DATE + INTERVAL '3 days', 'Readaptación',
     'Distensión leve del ligamento peroneoastragalino anterior tras giro en césped.',
     'Crioterapia, vendaje funcional y propiocepción en carga progresiva.', 'Lic. Ricardo Vásquez',
     'Entrenamiento', 2, 'ENTRENADOR'),
    (3, 'Isquiotibial Izquierdo', 57.00, 58.00, 'Sobrecarga Muscular', 'Moderada',
     CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE + INTERVAL '10 days', 'En Tratamiento',
     'Contractura en bíceps femoral por fatiga acumulada de torneo.',
     'Fisioterapia descontracturante, electroestimulación y reposo de impacto.', 'Lic. Ricardo Vásquez',
     'Partido', 2, 'ENTRENADOR');

-- 20. CONFIGURACIÓN DE CUADRANTES Y MOVIMIENTOS CONTABLES (PUNTO DE EQUILIBRIO)
INSERT INTO configuracion_cuadrantes (nombre_cuadrante, modalidad, costo_fijo_mensual, costo_variable_atleta, cuota_mensual_promedio, capacidad_atletas)
VALUES
    ('Cuadrante Norte - Campo', 'Campo', 1250.00, 10.00, 45.00, 60),
    ('Cuadrante Sur - F7', 'F7', 850.00, 8.00, 40.00, 45),
    ('Cancha Techada - Sala', 'Sala', 680.00, 7.00, 38.00, 32);

INSERT INTO movimientos_contables (tipo, categoria_contable, concepto, monto, cuadrante, fecha_movimiento, referencia, registrado_por)
VALUES
    ('Ingreso', 'Mensualidades', 'Recaudación Mensualidades Campo Norte (Lote Noviembre)', 1620.00, 'Cuadrante Norte - Campo', CURRENT_DATE - INTERVAL '10 days', 'LOTE-ING-001', 1),
    ('Ingreso', 'Mensualidades', 'Recaudación Mensualidades Cuadrante Sur F7', 1040.00, 'Cuadrante Sur - F7', CURRENT_DATE - INTERVAL '8 days', 'LOTE-ING-002', 1),
    ('Ingreso', 'Torneos', 'Inscripciones Torneo Clausura Futsal Sala', 760.00, 'Cancha Techada - Sala', CURRENT_DATE - INTERVAL '6 days', 'LOTE-ING-003', 1),
    ('Ingreso', 'Patrocinios', 'Aporte Trimestral Grupo Energía Vital', 900.00, 'Administración General', CURRENT_DATE - INTERVAL '5 days', 'PAT-ORO-01', 1),
    ('Egreso', 'Nómina Técnica', 'Honorarios Cuerpo Técnico Campo Norte', 850.00, 'Cuadrante Norte - Campo', CURRENT_DATE - INTERVAL '7 days', 'NOM-CN-11', 1),
    ('Egreso', 'Alquiler / Mantenimiento', 'Mantenimiento Césped e Iluminación Cuadrante Norte', 420.00, 'Cuadrante Norte - Campo', CURRENT_DATE - INTERVAL '4 days', 'MNT-CN-09', 1),
    ('Egreso', 'Nómina Técnica', 'Honorarios Entrenadores F7 Sur', 540.00, 'Cuadrante Sur - F7', CURRENT_DATE - INTERVAL '5 days', 'NOM-CS-11', 1),
    ('Egreso', 'Alquiler / Mantenimiento', 'Alquiler Cancha Techada Sala', 680.00, 'Cancha Techada - Sala', CURRENT_DATE - INTERVAL '3 days', 'ALQ-SL-11', 1),
    ('Egreso', 'Equipamiento', 'Compra de Balones FIFA Quality y Conos Tácticos', 310.00, 'Administración General', CURRENT_DATE - INTERVAL '2 days', 'EQP-044', 1);

-- 21. AGENDA DE TRABAJOS 2D EN CANCHA (ENTRENADOR + FISIO POR HORA Y ESPACIO)
INSERT INTO trabajos_campo (
    id_autor, rol_autor, id_categoria, id_jugador, titulo, bloque, descripcion_escrita,
    duracion_minutos, fecha, hora_inicio, hora_fin, cuadrante, espacio_cancha, animacion_3d_json
)
VALUES
    (
        2, 'ENTRENADOR', 5, NULL,
        'Rondo Progresivo y Salida Limpia 4v2 + Comodines',
        'Ofensivo',
        'Trabajo por bloques en Media Cancha Norte: 3 series de 8 minutos con 2 minutos de pausa activa. El pivote recibe perfilado para descargar hacia extremos que atacan espacio libre.',
        35, CURRENT_DATE, '16:00', '17:00', 'Cuadrante Norte - Campo', 'Media Cancha Norte',
        '{"pasos":[{"descripcion":"Paso 1: Posición base 4v2 y salida desde pivote","balon":{"x":28,"y":44},"actores":[{"id":"J1","label":"6","rol":"MCD","team":"A","color":"vinotinto","x":28,"y":46},{"id":"J2","label":"8","rol":"MC","team":"A","color":"vinotinto","x":50,"y":36},{"id":"J3","label":"7","rol":"ED","team":"A","color":"rojo","x":74,"y":38},{"id":"J4","label":"10","rol":"MP","team":"A","color":"vinotinto","x":48,"y":22},{"id":"R1","label":"4","rol":"PRES","team":"B","color":"azul","x":42,"y":34},{"id":"R2","label":"5","rol":"COBERT","team":"B","color":"azul","x":61,"y":28}]},{"descripcion":"Paso 2: Pase filtrado interior y desmarque de extremo","balon":{"x":50,"y":36},"actores":[{"id":"J1","label":"6","rol":"MCD","team":"A","color":"vinotinto","x":38,"y":40},{"id":"J2","label":"8","rol":"MC","team":"A","color":"vinotinto","x":54,"y":32},{"id":"J3","label":"7","rol":"ED","team":"A","color":"rojo","x":76,"y":24},{"id":"J4","label":"10","rol":"MP","team":"A","color":"vinotinto","x":56,"y":18},{"id":"R1","label":"4","rol":"PRES","team":"B","color":"azul","x":49,"y":35},{"id":"R2","label":"5","rol":"COBERT","team":"B","color":"azul","x":63,"y":23}]},{"descripcion":"Paso 3: Descarga al espacio y definición","balon":{"x":76,"y":19},"actores":[{"id":"J1","label":"6","rol":"MCD","team":"A","color":"vinotinto","x":45,"y":37},{"id":"J2","label":"8","rol":"MC","team":"A","color":"vinotinto","x":60,"y":26},{"id":"J3","label":"7","rol":"ED","team":"A","color":"rojo","x":76,"y":16},{"id":"J4","label":"10","rol":"MP","team":"A","color":"vinotinto","x":52,"y":12},{"id":"R1","label":"4","rol":"PRES","team":"B","color":"azul","x":56,"y":30},{"id":"R2","label":"5","rol":"COBERT","team":"B","color":"azul","x":67,"y":18}]}]}'::jsonb
    ),
    (
        5, 'FISIO', 5, 1,
        'Readaptación Propioceptiva Tobillo Derecho + Cambios de Dirección',
        'Fisioterapia / Readaptación',
        'Sesión individual de 25 min en la mitad sur libre (mientras Sub-14 trabaja al norte). Estabilidad monopodal sobre bosu, slalom suave en conos y frenado excéntrico controlado.',
        25, CURRENT_DATE, '16:00', '17:00', 'Cuadrante Norte - Campo', 'Media Cancha Sur',
        '{"pasos":[{"descripcion":"Paso 1: Apoyo monopodal y activación en Media Cancha Sur","balon":{"x":42,"y":78},"actores":[{"id":"F1","label":"8","rol":"ATLETA","team":"A","color":"oro","x":42,"y":78},{"id":"F2","label":"FS","rol":"FISIO","team":"B","color":"verde","x":32,"y":74},{"id":"C1","label":"C1","rol":"CONO","team":"CONO","color":"cono","x":48,"y":72},{"id":"C2","label":"C2","rol":"CONO","team":"CONO","color":"cono","x":56,"y":66}]},{"descripcion":"Paso 2: Slalom suave entre conos con control","balon":{"x":52,"y":69},"actores":[{"id":"F1","label":"8","rol":"ATLETA","team":"A","color":"oro","x":52,"y":69},{"id":"F2","label":"FS","rol":"FISIO","team":"B","color":"verde","x":40,"y":68},{"id":"C1","label":"C1","rol":"CONO","team":"CONO","color":"cono","x":48,"y":72},{"id":"C2","label":"C2","rol":"CONO","team":"CONO","color":"cono","x":56,"y":66}]},{"descripcion":"Paso 3: Frenado excéntrico y pase corto","balon":{"x":62,"y":61},"actores":[{"id":"F1","label":"8","rol":"ATLETA","team":"A","color":"oro","x":62,"y":61},{"id":"F2","label":"FS","rol":"FISIO","team":"B","color":"verde","x":48,"y":62},{"id":"C1","label":"C1","rol":"CONO","team":"CONO","color":"cono","x":48,"y":72},{"id":"C2","label":"C2","rol":"CONO","team":"CONO","color":"cono","x":56,"y":66}]}]}'::jsonb
    ),
    (
        2, 'ENTRENADOR', 12, NULL,
        'Circuito de Definición Cruzada y Cobertura F7',
        'Técnico-Táctico',
        'Conducción en velocidad por banda externa, pared con media punta y remate cruzado a segundo palo. Rotación continua de ambos perfiles.',
        40, CURRENT_DATE, '17:15', '18:15', 'Cuadrante Sur - F7', 'Cancha Completa',
        '{"pasos":[{"descripcion":"Paso 1: Arranque por banda derecha F7","balon":{"x":78,"y":58},"actores":[{"id":"B1","label":"7","rol":"EXT","team":"A","color":"vinotinto","x":78,"y":58},{"id":"B2","label":"9","rol":"DC","team":"A","color":"rojo","x":50,"y":36},{"id":"B3","label":"10","rol":"MP","team":"A","color":"vinotinto","x":56,"y":50},{"id":"R1","label":"4","rol":"DF","team":"B","color":"azul","x":58,"y":28},{"id":"GK","label":"1","rol":"POR","team":"GK","color":"oro","x":50,"y":9}]},{"descripcion":"Paso 2: Pared interior y ataque al espacio","balon":{"x":57,"y":46},"actores":[{"id":"B1","label":"7","rol":"EXT","team":"A","color":"vinotinto","x":80,"y":34},{"id":"B2","label":"9","rol":"DC","team":"A","color":"rojo","x":46,"y":24},{"id":"B3","label":"10","rol":"MP","team":"A","color":"vinotinto","x":58,"y":45},{"id":"R1","label":"4","rol":"DF","team":"B","color":"azul","x":52,"y":23},{"id":"GK","label":"1","rol":"POR","team":"GK","color":"oro","x":48,"y":8}]},{"descripcion":"Paso 3: Remate cruzado a segundo palo","balon":{"x":48,"y":10},"actores":[{"id":"B1","label":"7","rol":"EXT","team":"A","color":"vinotinto","x":74,"y":20},{"id":"B2","label":"9","rol":"DC","team":"A","color":"rojo","x":46,"y":15},{"id":"B3","label":"10","rol":"MP","team":"A","color":"vinotinto","x":58,"y":38},{"id":"R1","label":"4","rol":"DF","team":"B","color":"azul","x":54,"y":19},{"id":"GK","label":"1","rol":"POR","team":"GK","color":"oro","x":50,"y":8}]}]}'::jsonb
    );

-- 23. CONFIGURACIÓN INICIAL DE TASA BCV OFICIAL
INSERT INTO configuracion_tasas (moneda, tasa_bcv, fuente, fecha_tasa)
VALUES ('USD', 901.6175, 'Banco Central de Venezuela (Referencia Inicial)', CURRENT_DATE)
ON CONFLICT (moneda) DO NOTHING;

-- 22. EVALUACIONES PROFESIONALES DEL JUGADOR (FÍSICA, TÉCNICA CON BALÓN Y COORDINATIVA)
INSERT INTO evaluaciones_jugador (
    id_jugador, id_evaluador, fecha_evaluacion,
    fisica_velocidad, fisica_resistencia, fisica_fuerza,
    tecnica_control, tecnica_pase, tecnica_definicion,
    coordinativa_agilidad, coordinativa_equilibrio, coordinativa_ritmo,
    score_fisica, score_tecnica, score_coordinativa,
    ejercicio_video, video_url, nota_video, analisis_video_json,
    puntaje_global, porcentaje_global, fortalezas, debilidades, observaciones
)
VALUES
    (
        1, 2, CURRENT_DATE - INTERVAL '2 days',
        7.9, 8.2, 7.3,
        8.9, 9.0, 8.2,
        8.6, 8.2, 8.4,
        7.8, 8.7, 8.4,
        'Control orientado y pase filtrado en triángulo', NULL, 8.5,
        '{"fluidezMotriz":86,"tiempoContacto":0.42,"estabilidadPostural":84}'::jsonb,
        8.3, 83,
        'Pase filtrado al ras|Control orientado bajo presión|Visión de juego interior',
        'Potencia física en duelo 1v1|Juego aéreo defensivo',
        'Excelente lectura táctica en zonas interiores; continuar fortalecimiento de tren inferior en readaptación.'
    ),
    (
        2, 2, CURRENT_DATE - INTERVAL '3 days',
        8.9, 8.4, 7.6,
        9.1, 8.3, 8.5,
        9.0, 8.4, 8.7,
        8.3, 8.6, 8.7,
        'Slalom de conducción rápida y cambio de ritmo', NULL, 8.8,
        '{"fluidezMotriz":88,"tiempoContacto":0.35,"estabilidadPostural":85}'::jsonb,
        8.6, 86,
        'Regate en profundidad|Ambidiestrismo en banda|Aceleración explosiva',
        'Temporización defensiva tras pérdida',
        'Gran desequilibrio en últimos 20 metros con ambos perfiles.'
    ),
    (
        3, 2, CURRENT_DATE - INTERVAL '4 days',
        7.8, 8.4, 8.2,
        7.9, 8.3, 7.2,
        8.1, 8.3, 8.2,
        8.1, 7.8, 8.2,
        'Perfilado defensivo y despeje orientado', NULL, 8.2,
        '{"fluidezMotriz":82,"tiempoContacto":0.48,"estabilidadPostural":86}'::jsonb,
        8.1, 81,
        'Anticipación en línea defensiva|Salida limpia con pierna izquierda|Cobertura a espalda lateral',
        'Cambio de orientación largo bajo presión',
        'Sólida en coberturas zonales; vigilar recuperación isquiotibial con Fisioterapia.'
    ),
    (
        4, 2, CURRENT_DATE - INTERVAL '1 day',
        8.7, 8.6, 9.1,
        8.8, 8.7, 9.2,
        8.8, 9.0, 8.9,
        8.8, 8.9, 8.9,
        'Protección de espalda al arco y giro con pívot', NULL, 9.0,
        '{"fluidezMotriz":91,"tiempoContacto":0.31,"estabilidadPostural":92}'::jsonb,
        8.9, 89,
        'Juego de espaldas y giro rápido|Definición a primer toque|Potencia en disputa física',
        'Presión prolongada en bloque alto 40x20',
        'Referente ofensivo dominante en categoría Libre Futsal.'
    ),
    (
        5, 2, CURRENT_DATE - INTERVAL '3 days',
        8.0, 8.2, 8.6,
        8.1, 8.6, 7.6,
        8.9, 9.1, 8.8,
        8.3, 8.1, 8.9,
        'Blocaje aéreo y saque preciso de contraataque', NULL, 8.6,
        '{"fluidezMotriz":87,"tiempoContacto":0.38,"estabilidadPostural":91}'::jsonb,
        8.5, 85,
        'Velocidad de reacción lateral|Salida con los pies|Juego aéreo en área chica',
        'Pase largo diagonal con pierna izquierda',
        'Portero confiable con reflejos de nivel competitivo superior.'
    );

-- 24. GALERÍA HINCHADA (FOTOS Y VIDEOS DE JUEGOS Y ENTRENAMIENTOS)
INSERT INTO hinchada_galeria (titulo, descripcion, tipo, categoria_evento, media_url, thumbnail_url, fecha_evento, destacado, publicado_por)
VALUES
    (
        'Victoria Sub-14 en el Fénix Arena — Jornada Liga Estadal',
        'Galería oficial del triunfo 2-0 ante Atlético Metropolitano con uniforme titular Rojo Fuego & Negro.',
        'Foto', 'Juego', '/assets/uniforme-local-jugador-kit.png', '/assets/news-match.svg',
        CURRENT_DATE - INTERVAL '3 days', TRUE, 1
    ),
    (
        'Bloque de Porteros — Vuelo y Blocaje en Cuadrante Norte',
        'Sesión especial de reflejos y juego aéreo con la indumentaria oficial de arquero.',
        'Foto', 'Entrenamiento', '/assets/uniforme-local-portero-kit.png', '/assets/news-academy.svg',
        CURRENT_DATE - INTERVAL '2 days', TRUE, 2
    ),
    (
        'Nueva Armadura Visitante Negro & Dorado en Acción',
        'Estreno oficial del kit alternativo Negro & Oro en torneo regional Futsal / F7.',
        'Foto', 'Juego', '/assets/uniforme-visitante-jugador-kit.png', '/assets/news-match.svg',
        CURRENT_DATE - INTERVAL '1 day', TRUE, 1
    ),
    (
        'Resumen Táctico — Transición Ofensiva y Definición',
        'Video clip oficial de jugadas combinativas y presión tras pérdida durante el entrenamiento semanal.',
        'Video', 'Entrenamiento', 'https://www.youtube.com/watch?v=M7lc1UVf-VE', '/assets/news-academy.svg',
        CURRENT_DATE - INTERVAL '1 day', TRUE, 2
    ),
    (
        'Highlights Torneo Clausura Futsal Sala — Goles y Atajadas',
        'Mejores momentos de nuestra delegación en la Cancha Techada.',
        'Video', 'Juego', 'https://www.youtube.com/watch?v=aqz-KE-bpKQ', '/assets/news-match.svg',
        CURRENT_DATE - INTERVAL '4 days', TRUE, 2
    );

-- 25. BANDEJA DE NOTIFICACIONES INICIALES (RECORDATORIO 5 DÍAS ANTES + CONVOCATORIAS)
INSERT INTO notificaciones (
    id_usuario, id_representante, id_jugador, tipo, titulo, mensaje,
    referencia_tipo, referencia_id, fecha_limite, canal_email_estado, canal_whatsapp_estado, metadata_json, leida
)
VALUES
    (
        3, 1, 1, 'CONVOCATORIA',
        'Convocatoria Oficial: Mateo Mendoza vs Atlético Metropolitano',
        'Hola María Elena Mendoza, Mateo Mendoza (#10) fue convocado al partido de Sub-14 Campo frente a Atlético Metropolitano en Complejo Deportivo Fénix (Campo A). Indumentaria requerida: Uniforme Local (Rojo Fuego & Negro). Confirma asistencia desde Indumentaria y GPS o esta bandeja.',
        'partido', 1, CURRENT_DATE + INTERVAL '2 days', 'En_Bandeja', 'En_Bandeja',
        '{"id_partido":1,"rival":"Atlético Metropolitano","sede":"Complejo Deportivo Fénix (Campo A)","es_local":true,"kit_designado":"Uniforme Local (Camiseta Vinotinto / Rojo Fuego, Shorts Negros)","uniforme_img":"/assets/uniforme-local-jugador-kit.png","estado_convocatoria":"Convocado"}'::jsonb,
        FALSE
    ),
    (
        7, 3, 6, 'CONVOCATORIA',
        'Convocatoria Oficial: Francisco Prueba vs Atlético Metropolitano',
        'Hola prueba2, Francisco Prueba (#10) fue convocado al partido de Sub-14 Campo frente a Atlético Metropolitano en Complejo Deportivo Fénix (Campo A). Indumentaria requerida: Uniforme Local (Rojo Fuego & Negro). Por favor confirma tu asistencia.',
        'partido', 1, CURRENT_DATE + INTERVAL '2 days', 'En_Bandeja', 'En_Bandeja',
        '{"id_partido":1,"rival":"Atlético Metropolitano","sede":"Complejo Deportivo Fénix (Campo A)","es_local":true,"kit_designado":"Uniforme Local (Camiseta Vinotinto / Rojo Fuego, Shorts Negros)","uniforme_img":"/assets/uniforme-local-jugador-kit.png","estado_convocatoria":"Convocado"}'::jsonb,
        FALSE
    ),
    (
        7, 3, 6, 'PAGO_PROXIMO',
        'Recordatorio de Pago: Mensualidad — Vence 17/11/2026',
        'Hola prueba2, te recordamos automáticamente desde Legión Fénix FC que debes pagar la mensualidad del equipo Legión Fénix FC (Mensualidad Noviembre 2026 — Equipo Legión Fénix FC) por $45.00 USD antes de 17 del 11 de 2026. Ingresa a Pagos para presionar "Ya Pagué".',
        'transaccion', 10, '2026-11-17', 'Pendiente_Envio_Script', 'Pendiente_Envio_Script',
        '{"id_transaccion":10,"concepto":"Mensualidad","monto_usd":45.00,"fecha_vencimiento":"2026-11-17","atleta":"Francisco Prueba"}'::jsonb,
        FALSE
    );

