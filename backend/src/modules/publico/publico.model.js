const pool = require('../../config/db');
const categoriasModel = require('../categorias/categorias.model');

const getPublicHomeData = async () => {
  const [fixturesRes, newsRes, productsRes, sponsorsRes, galleryRes, heroSlidesRes, categories] = await Promise.all([
    pool.query(`
      SELECT p.*, c.nombre AS categoria_nombre, c.disciplina AS categoria_disciplina
      FROM partidos_fixture p
      LEFT JOIN categorias c ON c.id_categoria = p.id_categoria
      ORDER BY p.fecha_hora ASC
    `),
    pool.query(`
      SELECT *
      FROM noticias_club
      ORDER BY destacada DESC, publicado_en DESC
    `),
    pool.query(`
      SELECT *
      FROM productos_tienda
      WHERE activo = TRUE
      ORDER BY id_producto ASC
    `),
    pool.query(`
      SELECT *
      FROM patrocinadores
      WHERE activo = TRUE
      ORDER BY CASE nivel WHEN 'Oro' THEN 1 WHEN 'Plata' THEN 2 ELSE 3 END, id_patrocinador ASC
    `),
    pool.query(`
      SELECT h.*, u.nombre AS publicado_por_nombre
      FROM hinchada_galeria h
      LEFT JOIN usuarios u ON u.id_usuario = h.publicado_por
      ORDER BY h.fecha_evento DESC, h.id_media DESC
    `),
    pool
      .query(`
        SELECT s.*, u.nombre AS publicado_por_nombre
        FROM hero_carousel_slides s
        LEFT JOIN usuarios u ON u.id_usuario = s.publicado_por
        WHERE s.activo = TRUE
        ORDER BY s.orden ASC, s.id_slide DESC
      `)
      .catch(() => ({ rows: [] })),
    categoriasModel.getCategories(),
  ]);

  const upcomingMatches = fixturesRes.rows.filter(
    (m) => m.estado === 'Programado' && new Date(m.fecha_hora) > new Date()
  );

  return {
    nextMatch: upcomingMatches[0] || fixturesRes.rows[0] || null,
    fixtures: fixturesRes.rows,
    news: newsRes.rows,
    products: productsRes.rows,
    sponsors: sponsorsRes.rows,
    gallery: galleryRes.rows,
    heroSlides: heroSlidesRes.rows || [],
    categories,
  };
};

const getHinchadaGallery = async ({ tipo = null, categoria_evento = null } = {}) => {
  const params = [];
  const conds = [];
  if (tipo && tipo !== 'Todos') {
    params.push(tipo);
    conds.push(`h.tipo = $${params.length}`);
  }
  if (categoria_evento && categoria_evento !== 'Todos') {
    params.push(categoria_evento);
    conds.push(`h.categoria_evento = $${params.length}`);
  }
  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
  const { rows } = await pool.query(
    `SELECT h.*, u.nombre AS publicado_por_nombre
     FROM hinchada_galeria h
     LEFT JOIN usuarios u ON u.id_usuario = h.publicado_por
     ${where}
     ORDER BY h.fecha_evento DESC, h.id_media DESC`,
    params
  );
  return rows;
};

const createHinchadaMedia = async ({
  titulo,
  descripcion,
  tipo,
  categoria_evento,
  media_url,
  thumbnail_url,
  fecha_evento,
  publicado_por,
}) => {
  const { rows } = await pool.query(
    `INSERT INTO hinchada_galeria (
      titulo, descripcion, tipo, categoria_evento, media_url, thumbnail_url, fecha_evento, publicado_por
    )
    VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7::date, CURRENT_DATE), $8)
    RETURNING *`,
    [
      titulo,
      descripcion || '',
      tipo === 'Video' ? 'Video' : 'Foto',
      categoria_evento === 'Entrenamiento' ? 'Entrenamiento' : 'Juego',
      media_url,
      thumbnail_url || null,
      fecha_evento || null,
      publicado_por || null,
    ]
  );
  return rows[0];
};

const getFixtures = async (modalidad = null) => {
  const params = [];
  let where = '';
  if (modalidad && modalidad !== 'Todas') {
    params.push(modalidad);
    where = 'WHERE p.modalidad = $1';
  }
  const { rows } = await pool.query(
    `SELECT p.*, c.nombre AS categoria_nombre, c.disciplina AS categoria_disciplina
     FROM partidos_fixture p
     LEFT JOIN categorias c ON c.id_categoria = p.id_categoria
     ${where}
     ORDER BY p.fecha_hora ASC`,
    params
  );
  return rows;
};

const createVerifiedStoreOrder = async ({
  comprador_nombre,
  telefono_pago,
  metodo_pago,
  referencia_bancaria,
  comprobante_url,
  items,
  tasa_bcv = null,
}) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const productIds = [...new Set(items.map((it) => Number(it.id_producto)))];
    const prodRes = await client.query(
      `SELECT id_producto, nombre, precio, stock
       FROM productos_tienda
       WHERE id_producto = ANY($1::int[]) AND activo = TRUE`,
      [productIds]
    );
    const prodMap = new Map(prodRes.rows.map((p) => [p.id_producto, p]));

    let montoTotal = 0;
    const normalizedItems = [];

    for (const item of items) {
      const prod = prodMap.get(Number(item.id_producto));
      if (!prod) {
        const err = new Error(`Producto #${item.id_producto} no encontrado o inactivo.`);
        err.status = 400;
        throw err;
      }
      const qty = Math.max(1, parseInt(item.qty, 10) || 1);
      const precioUnit = Number(prod.precio);
      montoTotal += precioUnit * qty;
      normalizedItems.push({
        id_producto: prod.id_producto,
        nombre: prod.nombre,
        talla: item.talla || 'Única',
        qty,
        precio_unitario: precioUnit,
        subtotal: Number((precioUnit * qty).toFixed(2)),
      });
    }

    montoTotal = Number(montoTotal.toFixed(2));
    const resolvedTasa = tasa_bcv ? Number(Number(tasa_bcv).toFixed(4)) : null;
    const montoBs = resolvedTasa ? Number((montoTotal * resolvedTasa).toFixed(2)) : null;

    const orderRes = await client.query(
      `INSERT INTO pedidos_tienda (
        comprador_nombre, telefono_pago, metodo_pago, referencia_bancaria,
        comprobante_url, items_json, monto_total, tasa_bcv, monto_bs, estado_pago
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'Verificado')
      RETURNING *`,
      [
        comprador_nombre,
        telefono_pago,
        metodo_pago || 'Pago Móvil',
        referencia_bancaria,
        comprobante_url,
        JSON.stringify(normalizedItems),
        montoTotal,
        resolvedTasa,
        montoBs,
      ]
    );
    const pedido = orderRes.rows[0];

    await client.query(
      `INSERT INTO movimientos_contables (
        tipo, categoria_contable, concepto, monto, cuadrante, fecha_movimiento, referencia
      )
      VALUES ('Ingreso', 'Tienda Oficial', $1, $2, 'Administración General', CURRENT_DATE, $3)`,
      [
        `Pedido Tienda #${pedido.id_pedido} - ${comprador_nombre} (${metodo_pago || 'Pago Móvil'})`,
        montoTotal,
        referencia_bancaria,
      ]
    );

    await client.query('COMMIT');
    return pedido;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const getHeroSlides = async ({ includeInactive = false } = {}) => {
  const where = includeInactive ? '' : 'WHERE s.activo = TRUE';
  const { rows } = await pool.query(`
    SELECT s.*, u.nombre AS publicado_por_nombre
    FROM hero_carousel_slides s
    LEFT JOIN usuarios u ON u.id_usuario = s.publicado_por
    ${where}
    ORDER BY s.orden ASC, s.id_slide DESC
  `);
  return rows;
};

const createHeroSlide = async ({
  badge,
  titulo,
  subtitulo,
  tipo_media,
  media_url,
  cta_label,
  cta_href,
  orden,
  activo = true,
  publicado_por,
}) => {
  const { rows } = await pool.query(
    `INSERT INTO hero_carousel_slides (
       badge, titulo, subtitulo, tipo_media, media_url, cta_label, cta_href, orden, activo, publicado_por
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING *`,
    [
      badge || 'LEGIÓN FÉNIX FC • EST. 2020 • RENDIRSE JAMÁS',
      titulo,
      subtitulo || '',
      tipo_media === 'Video' ? 'Video' : 'Foto',
      media_url,
      cta_label || 'Inscribir Atleta',
      cta_href || '/login?tab=register&tipo=representante',
      Number(orden) || 1,
      Boolean(activo),
      publicado_por || null,
    ]
  );
  return rows[0];
};

const updateHeroSlide = async (idSlide, data) => {
  const { rows } = await pool.query(
    `UPDATE hero_carousel_slides
     SET badge = COALESCE($1, badge),
         titulo = COALESCE($2, titulo),
         subtitulo = COALESCE($3, subtitulo),
         cta_label = COALESCE($4, cta_label),
         cta_href = COALESCE($5, cta_href),
         orden = COALESCE($6, orden),
         activo = COALESCE($7, activo)
     WHERE id_slide = $8
     RETURNING *`,
    [
      data.badge !== undefined ? data.badge : null,
      data.titulo !== undefined ? data.titulo : null,
      data.subtitulo !== undefined ? data.subtitulo : null,
      data.cta_label !== undefined ? data.cta_label : null,
      data.cta_href !== undefined ? data.cta_href : null,
      data.orden !== undefined ? Number(data.orden) : null,
      data.activo !== undefined ? Boolean(data.activo) : null,
      Number(idSlide),
    ]
  );
  return rows[0] || null;
};

const deleteHeroSlide = async (idSlide) => {
  const { rows } = await pool.query(
    `DELETE FROM hero_carousel_slides WHERE id_slide = $1 RETURNING *`,
    [Number(idSlide)]
  );
  return rows[0] || null;
};

module.exports = {
  getPublicHomeData,
  getHinchadaGallery,
  createHinchadaMedia,
  getFixtures,
  createVerifiedStoreOrder,
  getHeroSlides,
  createHeroSlide,
  updateHeroSlide,
  deleteHeroSlide,
};
