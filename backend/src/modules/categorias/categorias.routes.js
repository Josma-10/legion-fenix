const express = require('express');
const router = express.Router();
const categoriasController = require('./categorias.controller');
const { verifyToken, optionalVerifyToken, checkRole } = require('../../middlewares/auth');

router.get('/', categoriasController.listCategories);
router.get('/:id', optionalVerifyToken, categoriasController.getCategoryDetail);
router.post('/', verifyToken, checkRole(['ADMINISTRADOR']), categoriasController.createCategory);
router.patch('/:id', verifyToken, checkRole(['ADMINISTRADOR']), categoriasController.updateCategory);

module.exports = router;
