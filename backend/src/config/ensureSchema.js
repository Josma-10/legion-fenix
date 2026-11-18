const pool = require('./db');

/**
 * Garantiza de forma idempotente (IF NOT EXISTS) las columnas y tablas
 * agregadas en evoluciones del sistema para que producción (Supabase/PostgreSQL)
 * siempre cuente con el esquema actualizado al iniciar el servidor.
 */
async function ensureSchema() {
  const statements = [
    // 1. Tallas de indumentaria y calzado para entrenadores y personal en tabla usuarios
    `ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS talla_camiseta VARCHAR(15)`,
    `ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS talla_short VARCHAR(15)`,
    `ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS talla_zapatos VARCHAR(15)`,

    // 2. Talla de zapatos para jugadores en uniformes_asignados
    `ALTER TABLE uniformes_asignados ADD COLUMN IF NOT EXISTS talla_zapatos VARCHAR(15)`,

    // 3. Confirmación de asistencia de jugadores/representantes a entrenamientos (trabajos_campo)
    `CREATE TABLE IF NOT EXISTS confirmaciones_entrenamiento (
      id_confirmacion SERIAL PRIMARY KEY,
      id_trabajo INT NOT NULL REFERENCES trabajos_campo(id_trabajo) ON DELETE CASCADE,
      id_jugador INT NOT NULL REFERENCES jugadores(id_jugador) ON DELETE CASCADE,
      estado VARCHAR(25) NOT NULL CHECK (estado IN ('Confirmado', 'No_Asiste')),
      observacion TEXT,
      actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (id_trabajo, id_jugador)
    )`,

    // 4. Carrusel dinámico de la página principal (fotos de jugadores y videos promocionales)
    `CREATE TABLE IF NOT EXISTS hero_carousel_slides (
      id_slide SERIAL PRIMARY KEY,
      badge VARCHAR(140) DEFAULT 'LEGIÓN FÉNIX FC • EST. 2020 • RENDIRSE JAMÁS',
      titulo VARCHAR(180) NOT NULL,
      subtitulo TEXT,
      tipo_media VARCHAR(15) NOT NULL DEFAULT 'Foto' CHECK (tipo_media IN ('Foto', 'Video')),
      media_url TEXT NOT NULL,
      cta_label VARCHAR(80) DEFAULT 'Inscribir Atleta',
      cta_href VARCHAR(200) DEFAULT '/login?tab=register&tipo=representante',
      orden INT NOT NULL DEFAULT 1,
      activo BOOLEAN DEFAULT TRUE,
      publicado_por INT REFERENCES usuarios(id_usuario) ON DELETE SET NULL,
      creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
  ];

  for (const sql of statements) {
    await pool.query(sql);
  }
}

module.exports = { ensureSchema };
