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
