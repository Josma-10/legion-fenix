const { Client } = require('pg');

const cs = process.env.DATABASE_URL || 'postgresql://postgres.faifexwvegpdenbmohpm:1121314151617181@aws-1-us-east-1.pooler.supabase.com:5432/postgres';

async function updateRates() {
  const c = new Client({ connectionString: cs, ssl: { rejectUnauthorized: false } });
  await c.connect();

  console.log('Conectado a la base de datos para actualizar tarifas...');

  // 1. Actualizar precios oficiales en productos_tienda
  await c.query(`
    UPDATE productos_tienda 
    SET precio = 20.00 
    WHERE LOWER(nombre) LIKE '%uniforme completo%';
  `);

  await c.query(`
    UPDATE productos_tienda 
    SET precio = 10.00 
    WHERE LOWER(nombre) LIKE '%camisa%';
  `);

  // 2. Crear / actualizar tabla de tarifas oficiales
  await c.query(`
    CREATE TABLE IF NOT EXISTS configuracion_tarifas (
      id_tarifa SERIAL PRIMARY KEY,
      concepto VARCHAR(100) NOT NULL UNIQUE,
      monto_eur NUMERIC(10,2) NOT NULL,
      descripcion TEXT,
      actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await c.query(`
    INSERT INTO configuracion_tarifas (concepto, monto_eur, descripcion)
    VALUES 
      ('INSCRIPCION_GENERAL', 15.00, 'Inscripción General Legión Fénix FC'),
      ('MENSUALIDAD_MENORES', 10.00, 'Mensualidad Atletas de 0 a 17 años'),
      ('MENSUALIDAD_MAYORES', 15.00, 'Mensualidad Atletas mayores o iguales a 18 años'),
      ('UNIFORME_COMPLETO_ESTANDAR', 20.00, 'Uniforme Completo (Tallas hasta XL)'),
      ('UNIFORME_COMPLETO_PLUS', 25.00, 'Uniforme Completo (Tallas > XL: XXL, 2XL, 3XL)'),
      ('UNIFORME_CAMISA_ESTANDAR', 10.00, 'Camisa sola (Tallas hasta XL)'),
      ('UNIFORME_CAMISA_PLUS', 15.00, 'Camisa sola (Tallas > XL: XXL, 2XL, 3XL)'),
      ('TORNEOS_AVISO', 0.00, 'Inscripciones y arbitrajes: Se avisa e informa 2 semanas antes.')
    ON CONFLICT (concepto) DO UPDATE 
    SET monto_eur = EXCLUDED.monto_eur, descripcion = EXCLUDED.descripcion;
  `);

  // Verificar
  const tarifas = await c.query('SELECT concepto, monto_eur, descripcion FROM configuracion_tarifas ORDER BY id_tarifa;');
  console.log('Tarifas registradas:');
  console.table(tarifas.rows);

  const productos = await c.query('SELECT id_producto, nombre, precio FROM productos_tienda ORDER BY id_producto LIMIT 6;');
  console.log('Productos de tienda actualizados:');
  console.table(productos.rows);

  await c.end();
}

updateRates().catch(console.error);
