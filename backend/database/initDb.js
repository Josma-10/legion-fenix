const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const dbName = process.env.DB_NAME || 'legion_fenix';
const baseConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
};

async function initDatabase() {
  const forceReseed = process.argv.includes('--reset');

  if (!process.env.DATABASE_URL) {
    const adminClient = new Client({ ...baseConfig, database: 'postgres' });
    await adminClient.connect();
    const checkDb = await adminClient.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [dbName]
    );
    if (checkDb.rowCount === 0) {
      console.log(`📦 Creando base de datos "${dbName}"...`);
      await adminClient.query(`CREATE DATABASE "${dbName}"`);
    }
    await adminClient.end();
  }

  const isLocalDbUrl =
    process.env.DATABASE_URL &&
    (process.env.DATABASE_URL.includes('localhost') || process.env.DATABASE_URL.includes('127.0.0.1'));

  const targetClient = new Client(
    process.env.DATABASE_URL
      ? {
          connectionString: process.env.DATABASE_URL,
          ssl: isLocalDbUrl ? false : { rejectUnauthorized: false },
        }
      : { ...baseConfig, database: dbName }
  );

  await targetClient.connect();
  console.log(`🔌 Conectado a PostgreSQL (${dbName}).`);

  if (forceReseed) {
    console.log('⚠️ Modo --reset: limpiando tablas existentes...');
    await targetClient.query(`
      DROP TABLE IF EXISTS
        hinchada_galeria, notificaciones,
        configuracion_tasas, evaluaciones_jugador, trabajos_campo,
        pedidos_tienda, movimientos_contables, configuracion_cuadrantes, lesiones_clinicas,
        asistencias, patrocinadores, productos_tienda, noticias_club,
        videos_analisis, microciclos_entrenamiento, tacticas_simulador,
        estadisticas_partidos, convocatorias, partidos_fixture,
        uniformes_asignados, transacciones_jugador, consentimientos_legales,
        fichas_medicas, jugadores, categorias, representantes, usuarios, roles
      CASCADE;
    `);
  }

  const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await targetClient.query(schemaSql);
  console.log('✅ Esquema schema.sql aplicado correctamente.');

  const usersCount = await targetClient.query('SELECT COUNT(*)::int AS total FROM usuarios');
  if (usersCount.rows[0].total === 0) {
    const seedSql = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf8');
    await targetClient.query(seedSql);
    console.log('🌱 Datos iniciales seed.sql insertados correctamente.');
  } else {
    console.log('ℹ️ La base de datos ya contiene usuarios. Omitiendo seed.sql (usa --reset para reiniciar).');
  }

  await targetClient.end();
  console.log('🔥 Inicialización de Legión Fénix finalizada.');
}

initDatabase().catch((err) => {
  console.error('❌ Error inicializando base de datos:', err.message || err);
  process.exit(1);
});
