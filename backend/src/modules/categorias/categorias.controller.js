const categoriasModel = require('./categorias.model');

exports.listCategories = async (req, res) => {
  const { modalidad, disciplina } = req.query;
  try {
    const categories = await categoriasModel.getCategories({ modalidad, disciplina });
    return res.json({ categories });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.getCategoryDetail = async (req, res) => {
  const idCategoria = Number(req.params.id);
  if (!Number.isInteger(idCategoria) || idCategoria <= 0) {
    return res.status(400).json({ error: 'ID de categoría inválido.' });
  }
  const includePrivateStatus = Boolean(
    req.user && ['ADMINISTRADOR', 'ANALISTA_ADMIN', 'ENTRENADOR', 'FISIO'].includes(req.user.rol)
  );
  try {
    const detail = await categoriasModel.getCategoryById(idCategoria, { includePrivateStatus });
    if (!detail) {
      return res.status(404).json({ error: 'Categoría no encontrada.' });
    }
    return res.json(detail);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.createCategory = async (req, res) => {
  const { nombre, disciplina, modalidad, edad_min, edad_max, cuadrante_asignado } = req.body;
  if (!nombre || !['Campo', 'F7', 'Sala'].includes(modalidad)) {
    return res.status(400).json({
      error: 'Nombre de categoría y modalidad válida (Campo, F7 o Sala) son obligatorios.',
    });
  }
  try {
    const category = await categoriasModel.createCategory({
      nombre,
      disciplina,
      modalidad,
      edad_min,
      edad_max,
      cuadrante_asignado,
    });
    return res.status(201).json({ message: 'Categoría creada exitosamente.', category });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.updateCategory = async (req, res) => {
  const idCategoria = Number(req.params.id);
  if (!Number.isInteger(idCategoria) || idCategoria <= 0) {
    return res.status(400).json({ error: 'ID de categoría inválido.' });
  }
  if (req.body.modalidad && !['Campo', 'F7', 'Sala'].includes(req.body.modalidad)) {
    return res.status(400).json({ error: 'Modalidad inválida. Usa Campo, F7 o Sala.' });
  }
  try {
    const category = await categoriasModel.updateCategory(idCategoria, req.body);
    if (!category) {
      return res.status(404).json({ error: 'Categoría no encontrada.' });
    }
    return res.json({ message: 'Categoría actualizada.', category });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
