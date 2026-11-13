const publicoModel = require('./publico.model');
const categoriasModel = require('../categorias/categorias.model');
const bcvService = require('../../services/bcvService');
const { getUploadedFileUrl } = require('../../config/cloudinary');

exports.getBcvRate = async (req, res) => {
  try {
    const forceRefresh = req.query.refresh === '1' || req.query.refresh === 'true';
    const bcv = await bcvService.getBcvRate({ forceRefresh });
    return res.json(bcv);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.getHomePortal = async (_req, res) => {
  try {
    const [data, bcv] = await Promise.all([
      publicoModel.getPublicHomeData(),
      bcvService.getBcvRate(),
    ]);
    return res.json({ ...data, bcv });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.getCategories = async (_req, res) => {
  try {
    const categories = await categoriasModel.getCategories();
    return res.json({ categories });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.getFixtures = async (req, res) => {
  const { modalidad } = req.query;
  try {
    const fixtures = await publicoModel.getFixtures(modalidad);
    return res.json({ fixtures });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.createStoreOrder = async (req, res) => {
  const { comprador_nombre, telefono_pago, metodo_pago, referencia_bancaria } = req.body;

  let items = req.body.items;
  if (typeof items === 'string') {
    try {
      items = JSON.parse(items);
    } catch {
      return res.status(400).json({ error: 'Formato inválido de productos del carrito.' });
    }
  }

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'El carrito está vacío. Selecciona al menos un producto.' });
  }

  if (!comprador_nombre || String(comprador_nombre).trim().length < 2) {
    return res.status(400).json({ error: 'Ingresa el nombre del titular que realiza el pedido.' });
  }

  if (!referencia_bancaria || String(referencia_bancaria).trim().length < 4) {
    return res.status(400).json({
      error: 'La referencia bancaria debe tener al menos 4 caracteres para verificar el pago.',
    });
  }

  if (!telefono_pago || String(telefono_pago).replace(/\D/g, '').length < 10) {
    return res.status(400).json({
      error: 'Ingresa el número de teléfono válido desde donde realizaste el pago.',
    });
  }

  const comprobanteUrl = req.file
    ? getUploadedFileUrl(req, req.file)
    : req.body.comprobante_url || null;

  if (!comprobanteUrl) {
    return res.status(400).json({
      error: 'Debe adjuntar el capture de pantalla del pago para confirmar la compra.',
    });
  }

  try {
    const bcv = await bcvService.getBcvRate();
    const pedido = await publicoModel.createVerifiedStoreOrder({
      comprador_nombre: comprador_nombre.trim(),
      telefono_pago: telefono_pago.trim(),
      metodo_pago: metodo_pago || 'Pago Móvil',
      referencia_bancaria: referencia_bancaria.trim(),
      comprobante_url: comprobanteUrl,
      items,
      tasa_bcv: bcv.tasa_bcv,
    });

    return res.status(201).json({
      message:
        'Pago confirmado y verificado exitosamente con referencia bancaria, capture de pantalla, teléfono y tasa BCV del día.',
      pedido,
      bcv,
      verificacion: {
        referencia_bancaria: pedido.referencia_bancaria,
        telefono_pago: pedido.telefono_pago,
        tasa_bcv: pedido.tasa_bcv,
        monto_bs: pedido.monto_bs,
        capture_verificado: true,
        comprobante_url: pedido.comprobante_url,
      },
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({
        error: 'Esta referencia bancaria ya fue utilizada en otro pedido verificado.',
      });
    }
    return res.status(error.status || 500).json({ error: error.message });
  }
};

exports.getGallery = async (req, res) => {
  const { tipo, categoria_evento } = req.query;
  try {
    const gallery = await publicoModel.getHinchadaGallery({ tipo, categoria_evento });
    return res.json({ gallery });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.createGalleryItem = async (req, res) => {
  const { titulo, descripcion, tipo, categoria_evento, media_url, fecha_evento } = req.body;
  try {
    const resolvedUrl = req.file ? getUploadedFileUrl(req, req.file) : media_url;
    if (!titulo || !resolvedUrl) {
      return res.status(400).json({ error: 'Título y archivo/URL de foto o video son obligatorios.' });
    }
    const item = await publicoModel.createHinchadaMedia({
      titulo: String(titulo).trim(),
      descripcion: String(descripcion || '').trim(),
      tipo: tipo === 'Video' ? 'Video' : 'Foto',
      categoria_evento: categoria_evento === 'Entrenamiento' ? 'Entrenamiento' : 'Juego',
      media_url: resolvedUrl,
      fecha_evento: fecha_evento || null,
      publicado_por: req.user?.id || null,
    });
    return res.status(201).json({ message: 'Contenido publicado en la Galería Hinchada.', item });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
