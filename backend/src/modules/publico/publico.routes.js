const express = require('express');
const router = express.Router();
const publicoController = require('./publico.controller');
const { uploadCloud } = require('../../config/cloudinary');
const { verifyToken, checkRole } = require('../../middlewares/auth');

router.get('/home', publicoController.getHomePortal);
router.get('/bcv-rate', publicoController.getBcvRate);
router.get('/fixtures', publicoController.getFixtures);
router.get('/categories', publicoController.getCategories);
router.get('/gallery', publicoController.getGallery);
router.post(
  '/gallery',
  verifyToken,
  checkRole(['ENTRENADOR', 'ADMINISTRADOR', 'ANALISTA_ADMIN']),
  uploadCloud.single('archivo'),
  publicoController.createGalleryItem
);
router.get('/hero-slides', publicoController.getHeroSlides);
router.post(
  '/hero-slides',
  verifyToken,
  checkRole(['ADMINISTRADOR', 'ANALISTA_ADMIN']),
  uploadCloud.single('archivo'),
  publicoController.createHeroSlide
);
router.patch(
  '/hero-slides/:id',
  verifyToken,
  checkRole(['ADMINISTRADOR', 'ANALISTA_ADMIN']),
  publicoController.updateHeroSlide
);
router.delete(
  '/hero-slides/:id',
  verifyToken,
  checkRole(['ADMINISTRADOR', 'ANALISTA_ADMIN']),
  publicoController.deleteHeroSlide
);
router.post('/store-orders', uploadCloud.single('comprobante'), publicoController.createStoreOrder);

module.exports = router;
